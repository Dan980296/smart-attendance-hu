import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  QrCode, 
  Users, 
  Download, 
  Play, 
  Square,
  Settings,
  FileText
} from "lucide-react";
import QrScanner from "qr-scanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MainDashboardProps {
  onGenerateQR: () => void;
  onViewAttendance: () => void;
}

const MainDashboard = ({ onGenerateQR, onViewAttendance }: MainDashboardProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [sessionData, setSessionData] = useState({
    college: "",
    instructor: "",
    section: "",
    course: ""
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setSessionData(prev => ({ ...prev, [field]: value }));
  };

  const handleQrScanResult = async (result: QrScanner.ScanResult) => {
    console.log('QR Code detected:', result.data);
    
    if (!currentSessionId) {
      toast({
        title: "No Active Session",
        description: "Please fill in session information first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Parse QR code data - assuming format: "StudentName|StudentID" or JSON
      let studentName = "";
      let studentId = "";
      
      if (result.data.includes('|')) {
        const [name, id] = result.data.split('|');
        studentName = name;
        studentId = id;
      } else {
        try {
          const parsed = JSON.parse(result.data);
          studentName = parsed.name || parsed.studentName || "";
          studentId = parsed.id || parsed.studentId || "";
        } catch {
          // Fallback: use QR data as student ID
          studentId = result.data;
          studentName = `Student ${result.data}`;
        }
      }

      if (!studentName || !studentId) {
        toast({
          title: "Invalid QR Code",
          description: "QR code does not contain valid student information.",
          variant: "destructive"
        });
        return;
      }

      // Check if already scanned today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', currentSessionId)
        .eq('student_id', studentId)
        .eq('scan_date', today)
        .single();

      if (existingRecord) {
        toast({
          title: "Already Recorded",
          description: `${studentName} already scanned for today.`,
          variant: "destructive"
        });
        return;
      }

      // Determine if late (after 9:20 AM for example)
      const now = new Date();
      const cutoffTime = new Date();
      cutoffTime.setHours(9, 20, 0, 0);
      const status = now > cutoffTime ? 'late' : 'present';

      // Save attendance record
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: currentSessionId,
          student_name: studentName,
          student_id: studentId,
          status: status
        });

      if (error) {
        console.error('Error saving attendance:', error);
        toast({
          title: "Error",
          description: "Failed to save attendance record.",
          variant: "destructive"
        });
        return;
      }

      // Play success beep
      const successAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+v3vGkdCDmR4+W6Ej+a2+Jq');
      successAudio.play().catch(() => {});

      // Show success message
      toast({
        title: "Attendance Recorded",
        description: `${studentName} (${studentId}) marked as ${status}.`,
      });

    } catch (error) {
      console.error('Error processing QR scan:', error);
      toast({
        title: "Error",
        description: "Failed to process QR code.",
        variant: "destructive"
      });
    }
  };

  const handleQrScanError = (error: string | Error) => {
    console.log('QR scan error:', error);
  };

  const createSession = async () => {
    if (!sessionData.college || !sessionData.instructor || !sessionData.section || !sessionData.course) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all session information fields.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          college: sessionData.college,
          instructor: sessionData.instructor,
          section: sessionData.section,
          course: sessionData.course
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast({
          title: "Error",
          description: "Failed to create session.",
          variant: "destructive"
        });
        return null;
      }

      setCurrentSessionId(data.id);
      toast({
        title: "Session Created",
        description: "Ready to scan QR codes for attendance.",
      });
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const toggleScanning = async () => {
    if (!isScanning) {
      // Create session if not exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createSession();
        if (!sessionId) return;
      }

      try {
        if (videoRef.current) {
          const qrScanner = new QrScanner(
            videoRef.current,
            handleQrScanResult,
            {
              onDecodeError: handleQrScanError,
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );
          qrScannerRef.current = qrScanner;
          await qrScanner.start();
          setIsScanning(true);
        }
      } catch (error) {
        console.error('Error starting camera:', error);
        toast({
          title: "Camera Error",
          description: "Failed to access camera.",
          variant: "destructive"
        });
      }
    } else {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Attendance Monitor</h1>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="college">College/Department</Label>
              <Input
                id="college"
                value={sessionData.college}
                onChange={(e) => handleInputChange("college", e.target.value)}
                placeholder="Enter college/department"
              />
            </div>
            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={sessionData.instructor}
                onChange={(e) => handleInputChange("instructor", e.target.value)}
                placeholder="Enter instructor name"
              />
            </div>
            <div>
              <Label htmlFor="section">Section/Class</Label>
              <Input
                id="section"
                value={sessionData.section}
                onChange={(e) => handleInputChange("section", e.target.value)}
                placeholder="Enter section/class"
              />
            </div>
            <div>
              <Label htmlFor="course">Course Name/No</Label>
              <Input
                id="course"
                value={sessionData.course}
                onChange={(e) => handleInputChange("course", e.target.value)}
                placeholder="Enter course name/number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scanning Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Preview */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Camera Preview</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Scan Button */}
            <Button 
              onClick={toggleScanning}
              className={`w-full text-lg py-6 transition-all duration-300 ${
                isScanning 
                  ? 'bg-danger hover:bg-danger/90' 
                  : 'bg-success hover:bg-success/90'
              }`}
            >
              {isScanning ? (
                <>
                  <Square className="w-6 h-6 mr-2" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={onGenerateQR}
            className="py-6 flex flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <QrCode className="w-6 h-6" />
            Generate QR Codes
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onViewAttendance}
            className="py-6 flex flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <Users className="w-6 h-6" />
            View Attendance
          </Button>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Export Attendance (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainDashboard;