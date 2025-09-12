import { useState } from "react";
import SplashScreen from "../components/SplashScreen";
import MainDashboard from "../components/MainDashboard";
import QRGenerator from "../components/QRGenerator";
import AttendanceList from "../components/AttendanceList";

type AppScreen = "splash" | "dashboard" | "qr-generator" | "attendance-list";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");

  const handleScreenChange = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash":
        return <SplashScreen onStart={() => handleScreenChange("dashboard")} />;
      case "dashboard":
        return (
          <MainDashboard 
            onGenerateQR={() => handleScreenChange("qr-generator")}
            onViewAttendance={() => handleScreenChange("attendance-list")}
          />
        );
      case "qr-generator":
        return <QRGenerator onBack={() => handleScreenChange("dashboard")} />;
      case "attendance-list":
        return <AttendanceList onBack={() => handleScreenChange("dashboard")} />;
      default:
        return <SplashScreen onStart={() => handleScreenChange("dashboard")} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  );
};

export default Index;
