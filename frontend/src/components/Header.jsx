import { useState, useEffect } from 'react';

function Header({ isAuthenticated, onLogout, variant = 'desktop' }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8);

  if (variant === 'mobile') {
    // Keep the old simple header for mobile — independent code path.
    return (
      <header style={{
        backgroundColor: '#1a1e3f',
        borderBottom: '3px solid #8b7355',
        padding: '16px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '20px' }}>⚔️ TACTIC MONITOR V2 ⚔️</h1>
        <p style={{ fontSize: '12px', marginTop: '6px' }}>FAE 工程師進度監控系統</p>
        {isAuthenticated && (
          <button onClick={onLogout} style={{ marginTop: '10px' }}>LOGOUT</button>
        )}
      </header>
    );
  }

  return (
    <header className="hud-header">
      <div className="hud-left">
        <div className="hud-logo-block">
          <svg width="28" height="28" viewBox="0 0 40 40">
            <polygon points="20,3 36,11 36,29 20,37 4,29 4,11" fill="none" stroke="#8fae5f" strokeWidth="1.5" />
            <polygon points="20,9 30,14 30,26 20,31 10,26 10,14" fill="#2d3817" stroke="#b5d477" strokeWidth="1" />
            <circle cx="20" cy="20" r="3" fill="#b5d477" />
          </svg>
          <div>
            <div className="hud-title">TACTIC MONITOR</div>
            <div className="hud-subtitle">FAE OPERATIONS COMMAND // V2</div>
          </div>
        </div>
      </div>

      <div className="hud-center">
        <div className="hud-clock">
          <div className="hud-clock-time">{timeStr}</div>
          <div className="hud-clock-date">{dateStr} UTC</div>
        </div>
      </div>

      <div className="hud-right">
        <div className="hud-status-pill">
          <span className="hud-pulse" /> ONLINE
        </div>
        {isAuthenticated && (
          <button className="hud-logout" onClick={onLogout}>DISENGAGE</button>
        )}
      </div>
    </header>
  );
}

export default Header;
