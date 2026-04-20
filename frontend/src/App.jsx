import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import StrategicMap from './components/StrategicMap';
import SquadDetail from './components/SquadDetail';
import MobileDashboard from './components/MobileDashboard';
import MobileSquadDetail from './components/MobileSquadDetail';
import CaptainSearch from './components/CaptainSearch';
import InstallPrompt from './components/InstallPrompt';
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

  // Lock body scroll on both desktop and mobile — each layer manages its
  // own internal scrolling. Layer 1 (mobile dashboard) is non-scrollable
  // at the body level; Layer 2/3 scroll inside their own containers.
  useEffect(() => {
    if (!isAuthenticated) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthenticated]);

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

  // Mobile — routed with mobile-specific layer components.
  if (isMobile) {
    return (
      <div className="app app-mobile">
        <Header isAuthenticated={true} onLogout={handleLogout} variant="mobile" />
        <Routes>
          <Route path="/" element={<MobileDashboard />} />
          <Route path="/squad/:name" element={<MobileSquadDetail />} />
          <Route path="/captain/:name" element={<CaptainSearch />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPrompt />
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
        <Route path="/captain/:name" element={<CaptainSearch />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
