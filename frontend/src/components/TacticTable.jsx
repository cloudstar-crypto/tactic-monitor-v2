import { useMemo } from 'react';
import AlertBadge from './AlertBadge';
import { isHiddenColumn, displayName, columnWidth, rowHasVisibleContent } from '../utils/columns';
import { getRowAlerts } from '../utils/alertRules';

function TacticTable({ rows, tab, onRowClick }) {
  const visibleRows = useMemo(
    () => (rows || []).filter((r) => rowHasVisibleContent(r, tab)),
    [rows, tab],
  );

  const columns = useMemo(() => {
    if (visibleRows.length === 0) return [];
    const seen = new Set();
    const keys = [];
    for (const row of visibleRows) {
      for (const k of Object.keys(row)) {
        if (seen.has(k)) continue;
        if (isHiddenColumn(k, tab)) continue;
        seen.add(k);
        keys.push(k);
      }
    }
    return keys;
  }, [visibleRows, tab]);

  const isMain = tab === 'main';
  const clickable = isMain && typeof onRowClick === 'function';

  if (visibleRows.length === 0) {
    return (
      <div className="tt-empty">
        <span className="tt-empty-line" />
        NO RECORDS
        <span className="tt-empty-line" />
      </div>
    );
  }

  return (
    <div className="tt-wrap">
      <table className="tt-table">
        <colgroup>
          {columns.map((k) => {
            const w = columnWidth(k);
            return <col key={k} style={w ? { width: `${w}px` } : undefined} />;
          })}
          {isMain && <col style={{ width: '90px' }} />}
        </colgroup>
        <thead>
          <tr>
            {columns.map((k) => (
              <th key={k}>{displayName(k)}</th>
            ))}
            {isMain && <th>ALERT</th>}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, idx) => {
            const alerts = isMain ? getRowAlerts(row) : null;
            return (
              <tr
                key={idx}
                className={clickable ? 'tt-row tt-row-clickable' : 'tt-row'}
                onClick={clickable ? () => onRowClick(idx) : undefined}
              >
                {columns.map((k) => (
                  <td key={k} title={row[k] || ''}>
                    <span className="tt-cell-text">{row[k] || ''}</span>
                  </td>
                ))}
                {isMain && (
                  <td className="tt-cell-alert">
                    <AlertBadge level={alerts.level} workingDays={alerts.workingDays} compact />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TacticTable;
