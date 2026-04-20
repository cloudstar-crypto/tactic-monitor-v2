import { useEffect, useState } from 'react';

export function useSquadData(captain) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!captain) return;
    let cancelled = false;

    setLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/squad-search?captain=${encodeURIComponent(captain)}`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setRows(json.rows || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load squad data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [captain]);

  return { rows, loading, error };
}
