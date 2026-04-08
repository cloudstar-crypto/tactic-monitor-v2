import { memo } from 'react';

// Heavy-metal skull marine SVG avatar.
// Color tint driven by alert level so the whole helmet glows when warning/critical.
function SkullMarineAvatar({ size = 72, alertLevel = 'NORMAL', isCaptain = false }) {
  const palette = {
    NORMAL: { glow: '#8fae5f', accent: '#b5d477', eye: '#8fae5f' },
    WARNING: { glow: '#e8c547', accent: '#ffd966', eye: '#ffd966' },
    CRITICAL: { glow: '#e74c3c', accent: '#ff6b5b', eye: '#ff6b5b' },
  }[alertLevel] || { glow: '#8fae5f', accent: '#b5d477', eye: '#8fae5f' };

  const helmetFill = isCaptain ? '#3a4a1e' : '#2d3817';
  const helmetStroke = palette.accent;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', filter: `drop-shadow(0 0 6px ${palette.glow}80)` }}
    >
      <defs>
        <radialGradient id={`bg-${alertLevel}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1a2210" />
          <stop offset="100%" stopColor="#0a0e05" />
        </radialGradient>
        <linearGradient id={`helmet-${alertLevel}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={helmetFill} />
          <stop offset="100%" stopColor="#1a2210" />
        </linearGradient>
      </defs>

      {/* Hex frame background */}
      <polygon
        points="50,4 90,25 90,75 50,96 10,75 10,25"
        fill={`url(#bg-${alertLevel})`}
        stroke={palette.accent}
        strokeWidth="1.5"
      />
      <polygon
        points="50,8 86,27 86,73 50,92 14,73 14,27"
        fill="none"
        stroke={palette.glow}
        strokeWidth="0.5"
        opacity="0.5"
      />

      {/* Helmet outer shell */}
      <path
        d="M 25 42 Q 25 22 50 22 Q 75 22 75 42 L 75 60 Q 75 68 70 72 L 30 72 Q 25 68 25 60 Z"
        fill={`url(#helmet-${alertLevel})`}
        stroke={helmetStroke}
        strokeWidth="1.2"
      />

      {/* Captain crest */}
      {isCaptain && (
        <>
          <polygon points="50,14 46,22 54,22" fill={palette.accent} stroke={palette.glow} strokeWidth="0.5" />
          <line x1="50" y1="22" x2="50" y2="32" stroke={palette.accent} strokeWidth="1" />
        </>
      )}

      {/* Skull visor cutout (dark mouth/eye area) */}
      <path
        d="M 32 38 Q 32 32 38 32 L 62 32 Q 68 32 68 38 L 68 52 Q 68 58 62 58 L 56 58 L 54 64 L 50 66 L 46 64 L 44 58 L 38 58 Q 32 58 32 52 Z"
        fill="#0a0e05"
        stroke={helmetStroke}
        strokeWidth="0.8"
      />

      {/* Skull eye sockets */}
      <ellipse cx="42" cy="43" rx="4" ry="5" fill={palette.eye} opacity="0.95">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="58" cy="43" rx="4" ry="5" fill={palette.eye} opacity="0.95">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </ellipse>

      {/* Eye inner pupils */}
      <circle cx="42" cy="44" r="1.2" fill="#0a0e05" />
      <circle cx="58" cy="44" r="1.2" fill="#0a0e05" />

      {/* Skull nose cavity */}
      <polygon points="50,46 47,54 53,54" fill="#0a0e05" stroke={helmetStroke} strokeWidth="0.4" />

      {/* Skull teeth grill */}
      <g stroke={helmetStroke} strokeWidth="0.5">
        <line x1="40" y1="56" x2="40" y2="62" />
        <line x1="44" y1="56" x2="44" y2="62" />
        <line x1="48" y1="56" x2="48" y2="62" />
        <line x1="52" y1="56" x2="52" y2="62" />
        <line x1="56" y1="56" x2="56" y2="62" />
        <line x1="60" y1="56" x2="60" y2="62" />
        <line x1="38" y1="58" x2="62" y2="58" />
      </g>

      {/* Helmet side vents */}
      <rect x="26" y="44" width="3" height="10" fill={palette.accent} opacity="0.6" />
      <rect x="71" y="44" width="3" height="10" fill={palette.accent} opacity="0.6" />

      {/* Neck guard */}
      <path
        d="M 32 72 L 30 82 L 70 82 L 68 72 Z"
        fill={helmetFill}
        stroke={helmetStroke}
        strokeWidth="0.8"
      />

      {/* Chin bolt */}
      <circle cx="50" cy="76" r="1.5" fill={palette.accent} />

      {/* HUD corner markers */}
      <g stroke={palette.glow} strokeWidth="1" fill="none" opacity="0.7">
        <polyline points="14,27 14,35 20,35" />
        <polyline points="86,27 86,35 80,35" />
        <polyline points="14,73 14,65 20,65" />
        <polyline points="86,73 86,65 80,65" />
      </g>
    </svg>
  );
}

export default memo(SkullMarineAvatar);
