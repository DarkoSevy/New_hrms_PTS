
import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="bg-[#020617] min-h-screen">
      {isAuthenticated ? (
        <DashboardLayout onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;