import { memo } from 'react';
import SkullMarineAvatar from './SkullMarineAvatar';
import HeartbeatChart from './HeartbeatChart';

const ALERT_COLORS = {
  NORMAL: { border: '#6b8e23', glow: '#8fae5f', label: '#b5d477' },
  WARNING: { border: '#b8941e', glow: '#e8c547', label: '#ffd966' },
  CRITICAL: { border: '#a03020', glow: '#e74c3c', label: '#ff6b5b' },
};

function StatBox({ label, value, highlight }) {
  return (
    <div className="tc-stat">
      <div className="tc-stat-label">{label}</div>
      <div className="tc-stat-value" style={{ color: highlight || '#e8f0d6' }}>
        {value}
      </div>
    </div>
  );
}

function TacticCard({ data, variant = 'member' }) {
  const { name, role, all = 0, active = 0, pending = 0, done = 0, alertLevel = 'NORMAL' } = data || {};
  const colors = ALERT_COLORS[alertLevel] || ALERT_COLORS.NORMAL;
  const isCaptain = variant === 'captain';

  if (isCaptain) {
    // Horizontal layout: identity on left, stats + ecg on right
    return (
      <div
        className="tc-card tc-captain"
        style={{ '--tc-border': colors.border, '--tc-glow': colors.glow }}
      >
        <span className="tc-corner tc-tl" />
        <span className="tc-corner tc-tr" />
        <span className="tc-corner tc-bl" />
        <span className="tc-corner tc-br" />

        <div className="tc-captain-identity">
          <SkullMarineAvatar size={76} alertLevel={alertLevel} isCaptain />
          <div className="tc-id">
            <div className="tc-role" style={{ color: colors.label }}>CAPTAIN</div>
            <div className="tc-name">{name}</div>
            <div className="tc-alert" style={{ color: colors.label }}>● {alertLevel}</div>
          </div>
        </div>

        <div className="tc-captain-readout">
          <div className="tc-stats">
            <StatBox label="ALL" value={all} />
            <StatBox label="ACTIVE" value={active} highlight="#b5d477" />
            <StatBox label="PEND" value={pending} highlight={colors.label} />
            <StatBox label="DONE" value={done} highlight="#6b8e23" />
          </div>
          <div className="tc-ecg">
            <HeartbeatChart width={360} height={28} alertLevel={alertLevel} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tc-card tc-member tc-alert-${alertLevel}`}
      style={{ '--tc-border': colors.border, '--tc-glow': colors.glow }}
    >
      <span className="tc-corner tc-tl" />
      <span className="tc-corner tc-tr" />
      <span className="tc-corner tc-bl" />
      <span className="tc-corner tc-br" />

      <div className="tc-top">
        <SkullMarineAvatar size={46} alertLevel={alertLevel} isCaptain={false} />
        <div className="tc-id">
          <div className="tc-role" style={{ color: colors.label }}>
            {role || 'OPERATOR'}
          </div>
          <div className="tc-name">{name}</div>
        </div>
      </div>

      <div className="tc-stats">
        <StatBox label="ALL" value={all} />
        <StatBox label="ACT" value={active} highlight="#b5d477" />
        <StatBox label="PEND" value={pending} highlight={colors.label} />
        <StatBox label="DONE" value={done} highlight="#6b8e23" />
      </div>

      <div className="tc-alert-bar" style={{ color: colors.label, borderColor: colors.border }}>
        <span className="tc-alert-dot" style={{ background: colors.glow }} />
        {alertLevel}
      </div>

      <div className="tc-ecg">
        <HeartbeatChart width={220} height={20} alertLevel={alertLevel} />
      </div>
    </div>
  );
}

export default memo(TacticCard);
