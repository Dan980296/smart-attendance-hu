import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  QrCode, 
  Upload, 
  Download, 
  FileText, 
  Users,
  ArrowLeft,
  Plus,
  File,
  Share2
} from "lucide-react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  onBack: () => void;
}

const QRGenerator = ({ onBack }: QRGeneratorProps) => {
  const [singleStudent, setSingleStudent] = useState({
    name: "",
    id: ""
  });

  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([]);

  // Generate QR code image from data
  const generateQRImage = async (data: string): Promise<string> => {
    try {
      const qrDataURL = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Download QR code as image
  const downloadQRCode = (qrImage: string, filename: string) => {
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share QR code using Web Share API if available
  const shareQRCode = async (qrImage: string, studentName: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code for ${studentName}`,
          text: `Attendance QR code for ${studentName}`,
          url: qrImage
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to download
        downloadQRCode(qrImage, `${studentName}-qr`);
      }
    } else {
      // Fallback to download
      downloadQRCode(qrImage, `${studentName}-qr`);
    }
  };

  const handleSingleGenerate = async () => {
    if (singleStudent.name && singleStudent.id) {
      const qrData = JSON.stringify({
        studentId: singleStudent.id,
        studentName: singleStudent.name,
        timestamp: Date.now()
      });
      
      const qrImage = await generateQRImage(qrData);
      
      const newCode = {
        id: singleStudent.id,
        name: singleStudent.name,
        qrData,
        qrImage
      };
      setGeneratedCodes(prev => [...prev, newCode]);
      // Clear the form for next manual entry
      setSingleStudent({ name: "", id: "" });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBatchFile(file);
      // Simulate batch processing
      const sampleStudents = [
        { id: "HU001", name: "Abebe Kebede" },
        { id: "HU002", name: "Almaz Tadesse" },
        { id: "HU003", name: "Dawit Haile" },
      ];
      
      const codes = await Promise.all(
        sampleStudents.map(async (student) => {
          const qrData = JSON.stringify({
            studentId: student.id,
            studentName: student.name,
            timestamp: Date.now()
          });
          const qrImage = await generateQRImage(qrData);
          
          return {
            id: student.id,
            name: student.name,
            qrData,
            qrImage
          };
        })
      );
      
      setGeneratedCodes(codes);
    }
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
          <h1 className="text-xl font-bold">QR Code Generator</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Tabs defaultValue="single" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single QR</TabsTrigger>
            <TabsTrigger value="batch">Batch Generator</TabsTrigger>
          </TabsList>

          {/* Single QR Code Generation */}
          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Single QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    value={singleStudent.name}
                    onChange={(e) => setSingleStudent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={singleStudent.id}
                    onChange={(e) => setSingleStudent(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="Enter student ID"
                  />
                </div>
                <Button 
                  onClick={handleSingleGenerate}
                  className="w-full bg-success hover:bg-success/90"
                  disabled={!singleStudent.name || !singleStudent.id}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch QR Code Generation */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Batch Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="batchFile">Upload Class List</Label>
                  <div className="mt-2">
                    <label htmlFor="batchFile" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> CSV/Excel file
                        </p>
                        <p className="text-xs text-muted-foreground">CSV or XLSX files only</p>
                      </div>
                      <input 
                        id="batchFile" 
                        type="file" 
                        className="hidden" 
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                    {batchFile && (
                      <p className="text-sm text-success mt-2 flex items-center">
                        <File className="w-4 h-4 mr-1" />
                        {batchFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {generatedCodes.length > 0 && (
                  <div className="space-y-2">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <Download className="w-4 h-4 mr-2" />
                      Download as ZIP
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Print-Ready PDF
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generated Codes Preview */}
        {generatedCodes.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Generated QR Codes ({generatedCodes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedCodes.map((code, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{code.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {code.id}</p>
                      </div>
                    </div>
                    {code.qrImage && (
                      <div className="flex flex-col items-center space-y-3">
                        <img 
                          src={code.qrImage} 
                          alt={`QR Code for ${code.name}`}
                          className="w-32 h-32 border rounded"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => downloadQRCode(code.qrImage, `${code.name}-qr`)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareQRCode(code.qrImage, code.name)}
                            className="flex-1"
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;