import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEngineerDetail } from '../hooks/useEngineerDetail';
import MissionDossier from './MissionDossier';
import AlertBadge from './AlertBadge';
import { SQUADS } from '../utils/squads';
import { isHiddenColumn, displayName, rowHasVisibleContent } from '../utils/columns';
import { getRowAlerts } from '../utils/alertRules';

function findSquadOf(name) {
  return SQUADS.find((s) => s.members.includes(name)) || null;
}

function buildOrderedKeys(row) {
  return Object.keys(row || {}).filter((k) => !isHiddenColumn(k, 'main'));
}

function RowCard({ row, onClick }) {
  const keys = useMemo(() => buildOrderedKeys(row), [row]);
  const alerts = getRowAlerts(row);

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

// Pull-to-refresh: track touch gestures on the list container.
const PULL_THRESHOLD = 60;

function usePullToRefresh(onRefresh, isRefreshing) {
  const listRef = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistance = useRef(0);
  const indicatorRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = listRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
    pullDistance.current = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const el = listRef.current;
    if (!el || el.scrollTop > 0) {
      pulling.current = false;
      if (indicatorRef.current) indicatorRef.current.style.height = '0px';
      return;
    }
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) return;
    // Dampen the pull distance
    pullDistance.current = Math.min(dy * 0.4, 80);
    if (indicatorRef.current) {
      indicatorRef.current.style.height = `${pullDistance.current}px`;
      indicatorRef.current.style.opacity = Math.min(pullDistance.current / PULL_THRESHOLD, 1);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;
    const triggered = pullDistance.current >= PULL_THRESHOLD;
    pullDistance.current = 0;
    if (indicatorRef.current) {
      indicatorRef.current.style.height = triggered ? '32px' : '0px';
      indicatorRef.current.style.opacity = triggered ? 1 : 0;
    }
    if (triggered && !isRefreshing) onRefresh();
  }, [onRefresh, isRefreshing]);

  return { listRef, indicatorRef, onTouchStart, onTouchMove, onTouchEnd };
}

function MobileSquadDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, loading, error, refresh } = useEngineerDetail(name);
  const squad = useMemo(() => findSquadOf(name), [name]);

  const { listRef, indicatorRef, onTouchStart, onTouchMove, onTouchEnd } =
    usePullToRefresh(refresh, loading);

  // Collapse pull indicator when loading finishes.
  useEffect(() => {
    if (!loading && indicatorRef.current) {
      indicatorRef.current.style.height = '0px';
      indicatorRef.current.style.opacity = 0;
    }
  }, [loading, indicatorRef]);

  const rowParam = searchParams.get('row');
  const selectedRowIdx = rowParam != null ? Number(rowParam) : null;

  const tabRows = data?.main || [];
  const visibleRows = useMemo(
    () => tabRows.filter((r) => rowHasVisibleContent(r, 'main')),
    [tabRows],
  );

  const rowCount = visibleRows.length;

  const handleRowClick = (idx) => {
    setSearchParams({ row: String(idx) });
  };
  const handleClearRow = () => {
    setSearchParams({});
  };
  const handleBack = () => {
    navigate('/');
  };

  // Layer 3: Mission Dossier
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
        <div className="msd-topbar-right">
          <span className="msd-tab-label">MAIN (CAR)</span>
          <span className="msd-tab-count">{rowCount}</span>
        </div>
        {loading && <span className="msd-status-loading">SYNC…</span>}
        {error && <span className="msd-status-error">⚠</span>}
      </div>

      <div
        className="msd-list"
        ref={listRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="msd-pull-indicator" ref={indicatorRef}>
          {loading ? 'SYNCING…' : '↓ PULL TO REFRESH'}
        </div>
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
            onClick={() => handleRowClick(idx)}
          />
        ))}
      </div>
    </main>
  );
}

export default MobileSquadDetail;
