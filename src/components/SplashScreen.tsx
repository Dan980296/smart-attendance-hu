import { Button } from "@/components/ui/button";
import { GraduationCap, QrCode } from "lucide-react";


interface SplashScreenProps {
  onStart: () => void;
}

const SplashScreen = ({ onStart }: SplashScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md w-full space-y-8">

        {/* App Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <QrCode className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center border-2 border-background">
                <GraduationCap className="w-4 h-4 text-warning-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Student Attendance Monitor
          </h1>
          <p className="text-muted-foreground text-lg">
            Hawassa University
          </p>
        </div>

        {/* Start Button */}
        <Button 
          onClick={onStart}
          size="lg"
          className="w-full text-lg py-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Start Attendance
        </Button>

        {/* Footer */}
        <div className="pt-8 text-right">
          <p className="text-sm text-muted-foreground">
            Developed by Dr. Daniel M.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;