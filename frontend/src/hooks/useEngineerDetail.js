import { useEffect, useState } from 'react';

const cache = new Map(); // name -> { data, timestamp }
const TTL = 5 * 60 * 1000;

export function useEngineerDetail(name) {
  const [data, setData] = useState(() => {
    const hit = cache.get(name);
    if (hit && Date.now() - hit.timestamp < TTL) return hit.data;
    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!name) return;
    let cancelled = false;

    const hit = cache.get(name);
    if (hit && Date.now() - hit.timestamp < TTL) {
      setData(hit.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/engineer-detail?name=${encodeURIComponent(name)}`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        cache.set(name, { data: json, timestamp: Date.now() });
        setData(json);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load engineer detail');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  return { data, loading, error };
}
