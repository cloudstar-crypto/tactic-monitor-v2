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
    return (
      <header className="hud-header hud-header-mobile">
        <div className="hud-logo-block">
          <svg width="22" height="22" viewBox="0 0 40 40">
            <polygon points="20,3 36,11 36,29 20,37 4,29 4,11" fill="none" stroke="#8fae5f" strokeWidth="1.5" />
            <polygon points="20,9 30,14 30,26 20,31 10,26 10,14" fill="#2d3817" stroke="#b5d477" strokeWidth="1" />
            <circle cx="20" cy="20" r="3" fill="#b5d477" />
          </svg>
          <div>
            <div className="hud-title">TACTIC MONITOR</div>
            <div className="hud-subtitle">FAE OPS // V2</div>
          </div>
        </div>
        <div className="hud-right">
          <div className="hud-status-pill">
            <span className="hud-pulse" /> ONLINE
          </div>
          {isAuthenticated && (
            <button className="hud-logout" onClick={onLogout}>EXIT</button>
          )}
        </div>
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
