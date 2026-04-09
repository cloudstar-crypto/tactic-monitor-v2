import { useMemo } from 'react';
import SkullMarineAvatar from './SkullMarineAvatar';
import AlertBadge from './AlertBadge';
import { getRowAlerts } from '../utils/alertRules';
import { displayName } from '../utils/columns';

const IDENTIFICATION_KEYS = ['status', 'customer', 'pn', 'sales', 'car open date'];

function findKeyByMatch(obj, match) {
  return Object.keys(obj || {}).find((k) => k.toLowerCase().includes(match));
}

function MissionDossier({ row, engineerName, squadName, onBack }) {
  const carNoKey = findKeyByMatch(row, 'car no');
  const historyKey = findKeyByMatch(row, 'history');
  const carNo = carNoKey ? row[carNoKey] : '';

  const alerts = useMemo(() => getRowAlerts(row), [row]);

  // Partition keys into 3 groups: identification / general / history.
  const { identKeys, generalKeys, historyKeys } = useMemo(() => {
    const ident = [];
    const general = [];
    const history = [];
    Object.keys(row || {}).forEach((k) => {
      const lower = k.toLowerCase();
      if (lower.includes('car no')) return; // shown in title
      if (lower.includes('fae')) return;     // hidden everywhere
      if (lower.includes('history')) {
        history.push(k);
        return;
      }
      if (IDENTIFICATION_KEYS.some((m) => lower.includes(m))) {
        ident.push(k);
        return;
      }
      general.push(k);
    });
    // Sort identification by canonical order
    ident.sort((a, b) => {
      const ia = IDENTIFICATION_KEYS.findIndex((m) => a.toLowerCase().includes(m));
      const ib = IDENTIFICATION_KEYS.findIndex((m) => b.toLowerCase().includes(m));
      return ia - ib;
    });
    return { identKeys: ident, generalKeys: general, historyKeys: history };
  }, [row]);

  const renderField = (key) => {
    const value = row[key];
    if (value == null || String(value).trim() === '') return null;
    return (
      <div className="md-field" key={key}>
        <div className="md-field-label">{displayName(key)}</div>
        <div className="md-field-value">{value}</div>
      </div>
    );
  };

  return (
    <section className="md-root">
      <div className="md-gridbg" />

      <header className="md-header">
        <button className="md-back" onClick={onBack}>
          ← BACK
        </button>

        <div className="md-identity">
          <SkullMarineAvatar size={72} alertLevel={alerts.level} isCaptain={false} />
          <div className="md-identity-text">
            <div className="md-identity-name">{engineerName}</div>
            <div className="md-identity-role">MEMBER · {squadName}</div>
          </div>
        </div>

        <div className="md-title-bar">
          <h1 className="md-title">
            MISSION DOSSIER <span className="md-title-sep">—</span>
            <span className="md-title-car">CAR No. {carNo || '—'}</span>
          </h1>
          <AlertBadge level={alerts.level} workingDays={alerts.workingDays} />
        </div>
      </header>

      <div className="md-body">
        {identKeys.length > 0 && (
          <section className="md-section">
            <h2 className="md-section-title">
              <span className="md-section-bar" /> IDENTIFICATION
            </h2>
            <div className="md-grid">{identKeys.map(renderField)}</div>
          </section>
        )}

        {generalKeys.length > 0 && (
          <section className="md-section">
            <h2 className="md-section-title">
              <span className="md-section-bar" /> MISSION DATA
            </h2>
            <div className="md-grid">{generalKeys.map(renderField)}</div>
          </section>
        )}

        {historyKeys.length > 0 && historyKeys.some((k) => row[k]) && (
          <section className="md-section md-section-history">
            <h2 className="md-section-title">
              <span className="md-section-bar md-section-bar-amber" /> HISTORY
            </h2>
            <div className="md-history">
              {historyKeys.map((k) => {
                const v = row[k];
                if (!v) return null;
                return (
                  <div key={k} className="md-history-block">
                    <div className="md-history-label">{displayName(k)}</div>
                    <div className="md-history-value">{v}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

export default MissionDossier;
