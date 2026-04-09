import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StrategicMap from './components/StrategicMap';
import SquadDetail from './components/SquadDetail';
import { useIsMobile } from './hooks/useIsMobile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) setIsAuthenticated(true);
    setLoading(false);
  }, []);

  // Toggle body scroll lock: desktop must not scroll at body level (layers
  // manage their own internal scrolling); mobile keeps body scrollable.
  useEffect(() => {
    if (!isAuthenticated) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = isMobile ? 'auto' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthenticated, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  if (loading) return <div className="container">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className={isMobile ? 'app app-mobile' : 'app app-desktop'}>
        <Header isAuthenticated={false} onLogout={handleLogout} variant={isMobile ? 'mobile' : 'desktop'} />
        <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  if (isMobile) {
    // Independent mobile tree — deferred for later redesign.
    return (
      <div className="app app-mobile">
        <Header isAuthenticated={true} onLogout={handleLogout} variant="mobile" />
        <Dashboard />
      </div>
    );
  }

  // Desktop — routed
  return (
    <div className="app app-desktop">
      <Header isAuthenticated={true} onLogout={handleLogout} variant="desktop" />
      <Routes>
        <Route path="/" element={<StrategicMap />} />
        <Route path="/squad/:name" element={<SquadDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
