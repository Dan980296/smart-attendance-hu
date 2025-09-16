import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface SessionInfo {
  id: string;
  college: string;
  instructor: string;
  section: string;
  course: string;
  session_date: string;
}

const AttendanceList = ({ onBack }: AttendanceListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load attendance data from database
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's session
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('session_date', today)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionError) {
          console.error('Error loading session:', sessionError);
          return;
        }

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setSessionInfo(session);
          
          // Get attendance records for this session
          const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('session_id', session.id)
            .order('scan_time', { ascending: true });

          if (recordsError) {
            console.error('Error loading attendance records:', recordsError);
            return;
          }
          
          // Transform attendance records
          const transformedRecords = (records || []).map((record: any) => ({
            id: record.id,
            studentName: record.student_name,
            studentId: record.student_id,
            scanTime: new Date(`1970-01-01T${record.scan_time}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            scanDate: record.scan_date,
            status: record.status
          }));
          
          setAttendanceRecords(transformedRecords);
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [toast]);

  const filteredRecords = attendanceRecords.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const lateCount = attendanceRecords.filter(r => r.status === "late").length;

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Student ID', 'Status', 'Scan Time', 'Scan Date'];
    const csvContent = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        `"${record.studentName}"`,
        record.studentId,
        record.status,
        `"${record.scanTime}"`,
        record.scanDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <Button 
          className="w-full bg-success hover:bg-success/90"
          onClick={handleExportCSV}
        >
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
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>Loading attendance records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
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
              {sessionInfo ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course:</span>
                    <span className="font-medium">{sessionInfo.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="font-medium">{sessionInfo.instructor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section:</span>
                    <span className="font-medium">{sessionInfo.section}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">College:</span>
                    <span className="font-medium">{sessionInfo.college}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(sessionInfo.session_date).toLocaleDateString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No active session today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceList;