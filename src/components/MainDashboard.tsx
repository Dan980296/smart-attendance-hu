import { useState } from "react";
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

  const handleInputChange = (field: string, value: string) => {
    setSessionData(prev => ({ ...prev, [field]: value }));
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

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
            {/* Camera Preview Placeholder */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              {isScanning ? (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Camera Active</p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Camera Preview</p>
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