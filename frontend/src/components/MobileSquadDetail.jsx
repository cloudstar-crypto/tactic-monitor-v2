import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEngineerDetail } from '../hooks/useEngineerDetail';
import MissionDossier from './MissionDossier';
import AlertBadge from './AlertBadge';
import { SQUADS } from '../utils/squads';
import { isHiddenColumn, displayName, rowHasVisibleContent } from '../utils/columns';
import { getRowAlerts } from '../utils/alertRules';

const TABS = [
  { key: 'main',     label: 'MAIN' },
  { key: 'report',   label: 'FAR' },
  { key: 'fsr',      label: 'FW/SW' },
  { key: 'rmReport', label: 'RM' },
  { key: 'others',   label: 'OTHERS' },
];

function findSquadOf(name) {
  return SQUADS.find((s) => s.members.includes(name)) || null;
}

// Build the ordered list of keys to display for a single row card.
// Re-applies the same "update date goes to the end" rule used in
// TacticTable so the mobile and desktop views stay consistent. The
// match must be the two-word phrase so other columns whose header
// happens to contain the word "date" (e.g. Onsite column) stay put.
function buildOrderedKeys(row, tab) {
  const keys = Object.keys(row || {}).filter((k) => !isHiddenColumn(k, tab));
  if (tab === 'main') return keys;
  const isDate = (k) => String(k).toLowerCase().includes('update date');
  return [...keys.filter((k) => !isDate(k)), ...keys.filter(isDate)];
}

function RowCard({ row, tab, onClick }) {
  const keys = useMemo(() => buildOrderedKeys(row, tab), [row, tab]);
  const alerts = tab === 'main' ? getRowAlerts(row) : null;

  return (
    <button type="button" className="msd-card" onClick={onClick}>
      {alerts && (
        <div className="msd-card-badge">
          <AlertBadge level={alerts.level} workingDays={alerts.workingDays} compact />
        </div>
      )}
      {keys.map((k) => {
        const v = row[k];
        if (v == null || String(v).trim() === '') return null;
        return (
          <div className="msd-card-field" key={k}>
            <div className="msd-card-label">{displayName(k)}</div>
            <div className="msd-card-value">{String(v)}</div>
          </div>
        );
      })}
    </button>
  );
}

function MobileSquadDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('main');

  const { data, loading, error } = useEngineerDetail(name);
  const squad = useMemo(() => findSquadOf(name), [name]);

  const rowParam = searchParams.get('row');
  const selectedRowIdx = rowParam != null ? Number(rowParam) : null;

  const tabRows = data?.[activeTab] || [];
  const visibleRows = useMemo(
    () => tabRows.filter((r) => rowHasVisibleContent(r, activeTab)),
    [tabRows, activeTab],
  );

  const tabCounts = useMemo(() => {
    const out = {};
    for (const t of TABS) {
      const arr = data?.[t.key] || [];
      out[t.key] = arr.filter((r) => rowHasVisibleContent(r, t.key)).length;
    }
    return out;
  }, [data]);

  const handleRowClick = (idx) => {
    setSearchParams({ row: String(idx) });
  };
  const handleClearRow = () => {
    setSearchParams({});
  };
  const handleBack = () => {
    navigate('/');
  };

  // Layer 3: Mission Dossier (mobile reuses the desktop component —
  // .md-grid collapses to a single column on narrow screens via minmax).
  if (selectedRowIdx != null && visibleRows[selectedRowIdx]) {
    return (
      <main className="msd-root msd-root-dossier">
        <MissionDossier
          row={visibleRows[selectedRowIdx]}
          engineerName={name}
          squadName={squad?.name || 'UNASSIGNED'}
          onBack={handleClearRow}
        />
      </main>
    );
  }

  return (
    <main className="msd-root">
      <div className="msd-topbar">
        <button type="button" className="msd-back" onClick={handleBack}>
          ← MAP
        </button>
        <div className="msd-identity">
          <div className="msd-identity-name">{name}</div>
          <div className="msd-identity-squad">{squad?.name || 'UNASSIGNED'}</div>
        </div>
        {loading && <span className="msd-status-loading">SYNC…</span>}
        {error && <span className="msd-status-error">⚠</span>}
      </div>

      <nav className="msd-tabs">
        {TABS.map((t) => {
          const count = tabCounts[t.key] || 0;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`msd-tab${active ? ' msd-tab-active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span>{t.label}</span>
              <span className="msd-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="msd-list">
        {loading && !data && (
          <div className="msd-empty">ESTABLISHING UPLINK…</div>
        )}
        {data && visibleRows.length === 0 && (
          <div className="msd-empty">NO RECORDS</div>
        )}
        {data && visibleRows.map((row, idx) => (
          <RowCard
            key={idx}
            row={row}
            tab={activeTab}
            onClick={activeTab === 'main' ? () => handleRowClick(idx) : undefined}
          />
        ))}
      </div>
    </main>
  );
}

export default MobileSquadDetail;
