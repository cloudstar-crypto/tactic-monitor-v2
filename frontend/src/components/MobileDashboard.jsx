import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SkullMarineAvatar from './SkullMarineAvatar';
import { buildSquadRoster } from '../utils/squads';

const ALERT_COLORS = {
  NORMAL:   { border: '#6b8e23', glow: '#8fae5f', label: '#b5d477' },
  WARNING:  { border: '#b8941e', glow: '#e8c547', label: '#ffd966' },
  CRITICAL: { border: '#a03020', glow: '#e74c3c', label: '#ff6b5b' },
};

function MemberRow({ member, onClick }) {
  const level = member.alertLevel || 'NORMAL';
  const colors = ALERT_COLORS[level] || ALERT_COLORS.NORMAL;
  return (
    <button
      type="button"
      className={`mbd-member mbd-alert-${level}`}
      style={{ '--tc-border': colors.border, '--tc-glow': colors.glow }}
      onClick={onClick}
    >
      <SkullMarineAvatar size={36} alertLevel={level} isCaptain={false} />
      <div className="mbd-member-id">
        <div className="mbd-member-name">{member.name}</div>
        <div className="mbd-member-alert" style={{ color: colors.label }}>
          ● {level}
        </div>
      </div>
      <div className="mbd-member-stats">
        <span className="mbd-stat">
          <span className="mbd-stat-lbl">ACT</span>
          <span className="mbd-stat-val" style={{ color: '#b5d477' }}>{member.active || 0}</span>
        </span>
        <span className="mbd-stat">
          <span className="mbd-stat-lbl">PEND</span>
          <span className="mbd-stat-val" style={{ color: colors.label }}>{member.pending || 0}</span>
        </span>
        <span className="mbd-stat">
          <span className="mbd-stat-lbl">DONE</span>
          <span className="mbd-stat-val" style={{ color: '#6b8e23' }}>{member.done || 0}</span>
        </span>
      </div>
      <span className="mbd-chevron" aria-hidden>›</span>
    </button>
  );
}

function SquadBlock({ squad, onMemberClick, onCaptainClick }) {
  const { name, captainStats, memberStats, colorPrimary, colorAccent } = squad;
  const cLevel = captainStats.alertLevel || 'NORMAL';
  const cColors = ALERT_COLORS[cLevel] || ALERT_COLORS.NORMAL;

  return (
    <section
      className="mbd-squad"
      style={{
        '--sq-primary': colorPrimary,
        '--sq-accent': colorAccent,
      }}
    >
      <header className="mbd-squad-head">
        <div className="mbd-squad-bar" />
        <h2 className="mbd-squad-title">{name}</h2>
        <div className="mbd-squad-meta">{memberStats.length} OPS</div>
      </header>

      <button type="button" className="mbd-captain mbd-captain-clickable" style={{ '--tc-border': cColors.border, '--tc-glow': cColors.glow }} onClick={() => onCaptainClick(captainStats.name)}>
        <SkullMarineAvatar size={44} alertLevel={cLevel} isCaptain />
        <div className="mbd-captain-id">
          <div className="mbd-captain-role" style={{ color: cColors.label }}>CAPTAIN</div>
          <div className="mbd-captain-name">{captainStats.name}</div>
        </div>
        <div className="mbd-captain-stats">
          <span className="mbd-stat">
            <span className="mbd-stat-lbl">ALL</span>
            <span className="mbd-stat-val">{captainStats.all || 0}</span>
          </span>
          <span className="mbd-stat">
            <span className="mbd-stat-lbl">ACT</span>
            <span className="mbd-stat-val" style={{ color: '#b5d477' }}>{captainStats.active || 0}</span>
          </span>
          <span className="mbd-stat">
            <span className="mbd-stat-lbl">PEND</span>
            <span className="mbd-stat-val" style={{ color: cColors.label }}>{captainStats.pending || 0}</span>
          </span>
          <span className="mbd-stat">
            <span className="mbd-stat-lbl">DONE</span>
            <span className="mbd-stat-val" style={{ color: '#6b8e23' }}>{captainStats.done || 0}</span>
          </span>
        </div>
      </button>

      <div className="mbd-members">
        {memberStats.map((m) => (
          <MemberRow key={m.id || m.name} member={m} onClick={() => onMemberClick(m.name)} />
        ))}
      </div>
    </section>
  );
}

function MobileDashboard() {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEngineers(data.engineers || []);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const squads = useMemo(() => buildSquadRoster(engineers), [engineers]);

  const handleMemberClick = (name) => {
    navigate(`/squad/${encodeURIComponent(name)}`);
  };

  const handleCaptainClick = (name) => {
    navigate(`/captain/${encodeURIComponent(name)}`);
  };

  if (loading) {
    return (
      <main className="mbd-root">
        <div className="mbd-loading">
          <div className="sm-scan-line" />
          ESTABLISHING UPLINK…
        </div>
      </main>
    );
  }

  return (
    <main className="mbd-root">
      <div className="mbd-status-bar">
        <span className="mbd-status-item">
          <span className="sm-dot" /> UPLINK
        </span>
        <span className="mbd-status-item">
          SYNC {lastUpdate ? lastUpdate.toLocaleTimeString('en-GB') : '—'}
        </span>
        {error && (
          <span className="mbd-status-item mbd-status-error">⚠ {error}</span>
        )}
      </div>

      <div className="mbd-squads">
        {squads.map((sq) => (
          <SquadBlock key={sq.id} squad={sq} onMemberClick={handleMemberClick} onCaptainClick={handleCaptainClick} />
        ))}
      </div>
    </main>
  );
}

export default MobileDashboard;
