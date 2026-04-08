import { useState, useEffect, useMemo } from 'react';
import SquadPanel from './SquadPanel';
import { buildSquadRoster } from '../utils/squads';

function StrategicMap() {
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

  if (loading) {
    return (
      <div className="sm-loading">
        <div className="sm-loading-inner">
          <div className="sm-scan-line" />
          ESTABLISHING UPLINK...
        </div>
      </div>
    );
  }

  return (
    <main className="sm-root">
      <div className="sm-gridbg" />
      <div className="sm-status-bar">
        <span className="sm-status-item">
          <span className="sm-dot" /> UPLINK ACTIVE
        </span>
        <span className="sm-status-item">
          LAST SYNC {lastUpdate ? lastUpdate.toLocaleTimeString('en-GB') : '—'}
        </span>
        <span className="sm-status-item">
          SECTOR / TACTIC-V2
        </span>
        {error && (
          <span className="sm-status-item sm-status-error">⚠ {error}</span>
        )}
      </div>

      <div className="sm-squads">
        {squads.map((sq) => (
          <SquadPanel key={sq.id} squad={sq} />
        ))}
      </div>
    </main>
  );
}

export default StrategicMap;
