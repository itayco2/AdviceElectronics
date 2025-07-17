import AuthForm from "@/components/AuthForm";
import BuildingDashboard from "@/components/BuildingDashboard";
import BuildingsList from "@/components/BuildingsList";
import type { Building } from "@/types/Building";
import { useState } from "react";


interface User {
  email: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const handleLogin = (email: string) => {
    setUser({ email });
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedBuilding(null);
  };

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building);
  };

  const handleBackToBuildings = () => {
    setSelectedBuilding(null);
  };

  if (!user) {
    return <AuthForm />;
  }

  if (selectedBuilding) {
    return (
      <BuildingDashboard
        building={selectedBuilding!}
        onBack={handleBackToBuildings}
      />
    );
  }

  return (
    <BuildingsList onSelect={handleSelectBuilding} />
  );
};

export default Index;