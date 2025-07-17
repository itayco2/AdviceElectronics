import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import BuildingsList from './components/BuildingsList';
import BuildingDashboard from './components/BuildingDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { Routes, Route } from 'react-router-dom';

interface Building {
  id: string;
  userId: string;
  name: string;
  numberOfFloors: number;
}

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Routes>
      <Route
        path="/admin"
        element={<AdminDashboard />}
      />
      <Route
        path="/"
        element={
          !selectedBuilding ? (
            <BuildingsList onSelect={setSelectedBuilding} />
          ) : (
            <BuildingDashboard building={selectedBuilding!} onBack={() => setSelectedBuilding(null)} />
          )
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
