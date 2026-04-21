import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquadData } from '../hooks/useSquadData';
import { SQUADS } from '../utils/squads';

function findSquadByCaptain(captain) {
  return SQUADS.find((s) => s.captain === captain) || null;
}

function findKey(obj, target) {
  const lower = target.toLowerCase();
  return Object.keys(obj || {}).find((k) => k.toLowerCase().includes(lower));
}

function getField(row, target) {
  const key = findKey(row, target);
  return key ? (row[key] || '') : '';
}

function CaptainSearch() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const squad = useMemo(() => findSquadByCaptain(name), [name]);
  const { rows, loading, error } = useSquadData(name);

  const results = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (!q) return true;
        const carNo = getField(row, 'car no').toLowerCase();
        const customer = getField(row, 'customer').toLowerCase();
        const pn = getField(row, 'pn').toLowerCase();
        return carNo.includes(q) || customer.includes(q) || pn.includes(q);
      })
      .map((row) => ({
        engineer: row._engineer || '',
        carNo: getField(row, 'car no'),
        customer: getField(row, 'customer'),
        pn: getField(row, 'pn'),
        solution: getField(row, 'solution'),
        lastUpdate: getField(row, 'last update'),
      }));
  }, [rows, query]);

  return (
    <main className="cs-root">
      <div className="cs-topbar">
        <button type="button" className="cs-back" onClick={() => navigate('/')}>
          ← MAP
        </button>
        <div className="cs-identity">
          <div className="cs-identity-name">{name}</div>
          <div className="cs-identity-squad">{squad?.name || 'UNKNOWN SQUAD'}</div>
        </div>
        {loading && <span className="cs-status">SYNC…</span>}
        {error && <span className="cs-status cs-status-error">⚠ {error}</span>}
      </div>

      <div className="cs-search-bar">
        <input
          type="text"
          className="cs-input"
          placeholder="SEARCH CAR NO. / CUSTOMER / PN…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <span className="cs-result-count">{results.length} RECORDS</span>
      </div>

      <div className="cs-results">
        {loading && !rows && (
          <div className="cs-empty">ESTABLISHING UPLINK…</div>
        )}
        {rows && results.length === 0 && (
          <div className="cs-empty">NO MATCHING RECORDS</div>
        )}
        {results.map((r, i) => (
          <div className="cs-card" key={i}>
            <div className="cs-card-header">
              <span className="cs-card-carno">CAR {r.carNo}</span>
              <span className="cs-card-engineer">{r.engineer}</span>
            </div>
            <div className="cs-card-body">
              <div className="cs-card-field">
                <span className="cs-card-label">CUSTOMER</span>
                <span className="cs-card-value">{r.customer}</span>
              </div>
              <div className="cs-card-field">
                <span className="cs-card-label">PN</span>
                <span className="cs-card-value">{r.pn}</span>
              </div>
              <div className="cs-card-field">
                <span className="cs-card-label">SOLUTION</span>
                <span className="cs-card-value cs-card-value-wrap">{r.solution}</span>
              </div>
              <div className="cs-card-field">
                <span className="cs-card-label">LAST UPDATE</span>
                <span className="cs-card-value cs-card-value-wrap">{r.lastUpdate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default CaptainSearch;
