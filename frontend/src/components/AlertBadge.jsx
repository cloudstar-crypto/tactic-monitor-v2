import { memo } from 'react';

const COLORS = {
  NORMAL: { glow: '#8fae5f', label: '#b5d477', border: '#6b8e23' },
  WARNING: { glow: '#f0c97a', label: '#f0c97a', border: '#b8941e' },
  CRITICAL: { glow: '#e74c3c', label: '#ff6b5b', border: '#a03020' },
};

function AlertBadge({ level = 'NORMAL', workingDays = 0, compact = false }) {
  const c = COLORS[level] || COLORS.NORMAL;
  const showDays = level !== 'NORMAL' && workingDays > 0;
  return (
    <span
      className={`ab-badge ab-${level.toLowerCase()}${compact ? ' ab-compact' : ''}`}
      style={{
        color: c.label,
        borderColor: c.border,
        boxShadow: `0 0 6px ${c.glow}33`,
      }}
    >
      <span className="ab-dot" style={{ background: c.glow }} />
      {level}
      {showDays && <span className="ab-days">{workingDays}D</span>}
    </span>
  );
}

export default memo(AlertBadge);
