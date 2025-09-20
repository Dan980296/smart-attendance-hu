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
    
    // Auto-create session if not exists and session data is available
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      if (!sessionData.college || !sessionData.instructor || !sessionData.section || !sessionData.course) {
        toast({
          title: "Session Required",
          description: "Please fill in all session information first.",
          variant: "destructive"
        });
        return;
      }
      
      const sessionId = await createSession();
      if (!sessionId) {
        return;
      }
      activeSessionId = sessionId;
    }

    try {
      // Parse QR code data with better validation
      let studentName = "";
      let studentId = "";
      
      console.log('Raw QR data:', result.data);
      
      if (result.data.includes('|')) {
        const parts = result.data.split('|');
        if (parts.length >= 2) {
          studentName = parts[0].trim();
          studentId = parts[1].trim();
        }
      } else {
        try {
          const parsed = JSON.parse(result.data);
          studentName = (parsed.name || parsed.studentName || parsed.student_name || "").toString().trim();
          studentId = (parsed.id || parsed.studentId || parsed.student_id || "").toString().trim();
        } catch (parseError) {
          console.log('QR data is not JSON, using as student ID');
          // Fallback: use QR data as student ID
          studentId = result.data.trim();
          studentName = `Student ${result.data.trim()}`;
        }
      }

      console.log('Parsed student data:', { studentName, studentId });

      if (!studentName || !studentId) {
        console.error('Invalid student data:', { studentName, studentId });
        toast({
          title: "Invalid QR Code",
          description: "QR code does not contain valid student information (name and ID required).",
          variant: "destructive"
        });
        return;
      }

      // Check if already scanned today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', activeSessionId)
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

      // Determine if late - configurable cutoff time (default 10:00 AM)
      const now = new Date();
      const cutoffTime = new Date();
      // Set cutoff to 10:00 AM - can be made configurable later
      cutoffTime.setHours(10, 0, 0, 0);
      const status = now > cutoffTime ? 'late' : 'present';

      // Save attendance record with better error handling
      console.log('Attempting to save attendance record:', {
        session_id: activeSessionId,
        student_name: studentName,
        student_id: studentId,
        status: status
      });

      const { data: insertedRecord, error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: activeSessionId,
          student_name: studentName,
          student_id: studentId,
          status: status
        })
        .select()
        .single();

      if (error) {
        console.error('Database error saving attendance:', error);
        toast({
          title: "Database Error",
          description: `Failed to save attendance: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Successfully saved attendance record:', insertedRecord);

      // Play success beep - improved audio handling
      try {
        // Create and play beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if suspended (required for autoplay policy)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Success beep: 800Hz for 0.2 seconds
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
        console.log('Beep sound played successfully');
      } catch (audioError) {
        console.log('Web Audio API failed, trying fallback beep');
        // Fallback: Try HTML5 audio
        try {
          const beepAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+v3vGkdCDmR4+W6bj+a2+Jq');
          beepAudio.volume = 0.3;
          await beepAudio.play();
          console.log('Fallback beep played');
        } catch (fallbackError) {
          console.log('All audio methods failed:', fallbackError);
        }
      }

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