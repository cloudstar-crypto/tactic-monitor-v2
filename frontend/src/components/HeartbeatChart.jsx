import { memo, useId } from 'react';

// Animated ECG-style heartbeat chart. Pattern complexity + color driven by alertLevel.
function HeartbeatChart({ width = 240, height = 48, alertLevel = 'NORMAL' }) {
  const id = useId().replace(/:/g, '_');

  const config = {
    NORMAL: {
      color: '#8fae5f',
      glow: '#b5d477',
      path: 'M 0 24 L 30 24 L 36 24 L 42 24 L 50 8 L 58 40 L 66 18 L 72 24 L 120 24 L 126 24 L 132 24 L 140 10 L 148 38 L 156 20 L 162 24 L 240 24',
      duration: '1.4s',
    },
    WARNING: {
      color: '#e8c547',
      glow: '#ffd966',
      path: 'M 0 24 L 20 24 L 28 14 L 34 34 L 42 10 L 50 38 L 58 6 L 66 40 L 74 18 L 80 24 L 110 24 L 118 12 L 126 34 L 134 8 L 142 40 L 150 6 L 158 38 L 166 20 L 174 24 L 240 24',
      duration: '1.0s',
    },
    CRITICAL: {
      color: '#e74c3c',
      glow: '#ff6b5b',
      path: 'M 0 24 L 12 24 L 18 4 L 24 44 L 30 2 L 36 46 L 42 6 L 48 42 L 54 10 L 60 40 L 66 4 L 72 44 L 80 24 L 100 24 L 112 4 L 118 44 L 124 2 L 130 46 L 136 6 L 142 42 L 148 8 L 154 40 L 160 6 L 166 44 L 174 24 L 240 24',
      duration: '0.6s',
    },
  }[alertLevel] || {
    color: '#8fae5f',
    glow: '#b5d477',
    path: 'M 0 24 L 240 24',
    duration: '2s',
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 240 ${48}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={`ecg-fade-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={config.color} stopOpacity="0" />
          <stop offset="15%" stopColor={config.color} stopOpacity="1" />
          <stop offset="85%" stopColor={config.color} stopOpacity="1" />
          <stop offset="100%" stopColor={config.color} stopOpacity="0" />
        </linearGradient>
        <filter id={`ecg-glow-${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid background */}
      <g stroke={config.color} strokeWidth="0.3" opacity="0.15">
        <line x1="0" y1="12" x2="240" y2="12" />
        <line x1="0" y1="24" x2="240" y2="24" />
        <line x1="0" y1="36" x2="240" y2="36" />
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={i} x1={i * 20} y1="0" x2={i * 20} y2="48" />
        ))}
      </g>

      {/* ECG waveform */}
      <path
        d={config.path}
        fill="none"
        stroke={`url(#ecg-fade-${id})`}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#ecg-glow-${id})`}
      >
        <animate
          attributeName="stroke-dasharray"
          from="0 600"
          to="600 0"
          dur={config.duration}
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

export default memo(HeartbeatChart);
