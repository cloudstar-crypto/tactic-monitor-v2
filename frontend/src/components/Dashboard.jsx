import { useState, useEffect } from 'react';
import EngineerCard from './EngineerCard';

function Dashboard() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setEngineers(data.engineers || []);
      setLastUpdate(new Date().toLocaleTimeString('zh-TW'));
      setError('');
    } catch (err) {
      setError('無法載入資料：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <p>最後更新：{lastUpdate || '—'}</p>
        {error && <p style={{ color: '#c9714d' }}>{error}</p>}
        <button onClick={fetchData}>重新載入</button>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {engineers.length > 0 ? (
          engineers.map((eng) => (
            <EngineerCard key={eng.id} engineer={eng} />
          ))
        ) : (
          <p>沒有工程師資料</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
