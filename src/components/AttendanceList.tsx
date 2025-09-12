import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Users, 
  Clock,
  Calendar,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface AttendanceListProps {
  onBack: () => void;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  scanTime: string;
  scanDate: string;
  status: "present" | "late";
}

const AttendanceList = ({ onBack }: AttendanceListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sample attendance data
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "1",
      studentName: "Abebe Kebede",
      studentId: "HU001",
      scanTime: "09:15 AM",
      scanDate: "2024-09-12",
      status: "present"
    },
    {
      id: "2",
      studentName: "Almaz Tadesse",
      studentId: "HU002",
      scanTime: "09:18 AM",
      scanDate: "2024-09-12",
      status: "present"
    },
    {
      id: "3",
      studentName: "Dawit Haile",
      studentId: "HU003",
      scanTime: "09:25 AM",
      scanDate: "2024-09-12",
      status: "late"
    }
  ]);

  const filteredRecords = attendanceRecords.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const lateCount = attendanceRecords.filter(r => r.status === "late").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Attendance List</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{attendanceRecords.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="w-6 h-6 bg-success rounded-full mx-auto mb-1"></div>
              <p className="text-2xl font-bold text-success">{presentCount}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="w-6 h-6 bg-warning rounded-full mx-auto mb-1"></div>
              <p className="text-2xl font-bold text-warning">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Export Button */}
        <Button className="w-full bg-success hover:bg-success/90">
          <Download className="w-4 h-4 mr-2" />
          Export to CSV/Excel
        </Button>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRecords.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredRecords.map((record, index) => (
                  <div 
                    key={record.id}
                    className={`p-4 flex items-center justify-between ${
                      index !== filteredRecords.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{record.studentName}</p>
                        <Badge 
                          variant={record.status === "present" ? "default" : "secondary"}
                          className={
                            record.status === "present" 
                              ? "bg-success text-success-foreground" 
                              : "bg-warning text-warning-foreground"
                          }
                        >
                          {record.status === "present" ? "Present" : "Late"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">ID: {record.studentId}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {record.scanTime}
                      </div>
                      <p className="text-xs text-muted-foreground">{record.scanDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium">Computer Science 101</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instructor:</span>
                <span className="font-medium">Dr. Daniel M.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Section:</span>
                <span className="font-medium">CS-1A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">September 12, 2024</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceList;