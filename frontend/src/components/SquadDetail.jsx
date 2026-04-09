import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEngineerDetail } from '../hooks/useEngineerDetail';
import TacticTable from './TacticTable';
import MissionDossier from './MissionDossier';
import { SQUADS } from '../utils/squads';
import { rowHasVisibleContent } from '../utils/columns';

const TABS = [
  { key: 'main',     label: 'MAIN (CAR)' },
  { key: 'report',   label: 'FAR REPORT' },
  { key: 'fsr',      label: 'FW/SW REQUEST' },
  { key: 'rmReport', label: 'RM REPORT' },
  { key: 'others',   label: 'OTHERS' },
];

function findSquadOf(name) {
  return SQUADS.find((s) => s.members.includes(name)) || null;
}

function SquadDetail() {
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

  const tabCount = (key) => {
    const arr = data?.[key] || [];
    return arr.filter((r) => rowHasVisibleContent(r, key)).length;
  };

  const handleRowClick = (idx) => {
    setSearchParams({ row: String(idx) });
  };

  const handleClearRow = () => {
    setSearchParams({});
  };

  const handleBackToMap = () => {
    navigate('/');
  };

  // Layer 3: Mission Dossier
  if (selectedRowIdx != null && visibleRows[selectedRowIdx]) {
    return (
      <main className="sd-root">
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
    <main className="sd-root">
      <div className="sd-gridbg" />

      <div className="sd-topbar">
        <button className="sd-back" onClick={handleBackToMap}>
          ← STRATEGIC MAP
        </button>
        <div className="sd-identity">
          <span className="sd-identity-name">{name}</span>
          <span className="sd-identity-sep">·</span>
          <span className="sd-identity-squad">{squad?.name || 'UNASSIGNED'}</span>
        </div>
        <div className="sd-status">
          {loading && <span className="sd-status-loading">SYNCING…</span>}
          {error && <span className="sd-status-error">⚠ {error}</span>}
        </div>
      </div>

      <nav className="sd-tabs">
        {TABS.map((t) => {
          const count = data ? tabCount(t.key) : 0;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              className={`sd-tab${active ? ' sd-tab-active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className="sd-tab-label">{t.label}</span>
              <span className="sd-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="sd-content">
        {loading && !data && (
          <div className="sd-loading">
            <div className="sm-scan-line" />
            ESTABLISHING UPLINK…
          </div>
        )}
        {data && (
          <TacticTable
            rows={tabRows}
            tab={activeTab}
            onRowClick={activeTab === 'main' ? handleRowClick : undefined}
          />
        )}
      </div>
    </main>
  );
}

export default SquadDetail;
