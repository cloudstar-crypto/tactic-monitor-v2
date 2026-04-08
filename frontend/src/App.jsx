import { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div>
      <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;
