import { memo, useId } from 'react';

/*
  Realistic ECG-style heartbeat chart.
  Path is a PQRST waveform repeated twice across the viewBox and
  scrolled horizontally via transform. The viewport shows half
  the path at any given time, giving an infinite scroll effect.
*/

// Build one PQRST cycle starting at x0, baseline y.
// Cycle width ~180 units. Amplitude scales with `amp`.
function buildPQRST(x0, y, amp) {
  const p = amp * 0.25;   // P wave height
  const q = amp * 0.15;   // Q dip
  const r = amp * 1.0;    // R spike height
  const s = amp * 0.55;   // S dip depth
  const t = amp * 0.35;   // T wave height

  return [
    `M ${x0} ${y}`,
    `L ${x0 + 14} ${y}`,
    // P wave (gentle bump)
    `Q ${x0 + 22} ${y - p * 2} ${x0 + 30} ${y}`,
    `L ${x0 + 40} ${y}`,
    // Q dip
    `L ${x0 + 44} ${y + q}`,
    // R spike
    `L ${x0 + 48} ${y - r}`,
    // S down
    `L ${x0 + 52} ${y + s}`,
    // Return to baseline
    `L ${x0 + 58} ${y}`,
    `L ${x0 + 72} ${y}`,
    // T wave (rounded)
    `Q ${x0 + 86} ${y - t * 1.5} ${x0 + 100} ${y}`,
    `L ${x0 + 180} ${y}`,
  ].join(' ');
}

function HeartbeatChart({ width = 240, height = 40, alertLevel = 'NORMAL' }) {
  const uid = useId().replace(/:/g, '_');

  const config = {
    NORMAL: {
      color: '#8fae5f',
      glow: '#b5d477',
      duration: '2.4s',
      amp: 16,
    },
    WARNING: {
      color: '#e8c547',
      glow: '#ffd966',
      duration: '1.3s',
      amp: 18,
    },
    CRITICAL: {
      color: '#e74c3c',
      glow: '#ff6b5b',
      duration: '0.65s',
      amp: 22,
    },
  }[alertLevel] || {
    color: '#8fae5f',
    glow: '#b5d477',
    duration: '2.4s',
    amp: 16,
  };

  const VB_W = 360;          // inner viewBox width shown at once
  const VB_H = 48;
  const baseline = VB_H / 2; // y=24
  const cycleWidth = 180;

  // Build three cycles so translating one cycle width creates seamless loop
  const path =
    buildPQRST(0, baseline, config.amp) + ' ' +
    buildPQRST(cycleWidth, baseline, config.amp) + ' ' +
    buildPQRST(cycleWidth * 2, baseline, config.amp);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <defs>
        <filter id={`ecg-glow-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid background */}
      <g stroke={config.color} strokeWidth="0.3" opacity="0.12">
        <line x1="0" y1={baseline} x2={VB_W} y2={baseline} />
        <line x1="0" y1={baseline - 12} x2={VB_W} y2={baseline - 12} />
        <line x1="0" y1={baseline + 12} x2={VB_W} y2={baseline + 12} />
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1={i * 40} y1="0" x2={i * 40} y2={VB_H} />
        ))}
      </g>

      {/* Scrolling waveform — seamless left-to-right across full card width */}
      <g>
        <path
          d={path}
          fill="none"
          stroke={config.color}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#ecg-glow-${uid})`}
          opacity="0.95"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 0"
          to={`-${cycleWidth} 0`}
          dur={config.duration}
          repeatCount="indefinite"
        />
      </g>
    </svg>
  );
}

export default memo(HeartbeatChart);
