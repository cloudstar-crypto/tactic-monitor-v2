import { memo, useId, useMemo } from 'react';

/*
  Realistic ECG-style heartbeat chart.
  Each card receives a `seed` (engineer name); a mulberry32 PRNG produces
  deterministic per-cycle variations — ±40% amplitude on P/R/T waves,
  ±3 baseline drift, randomised P/R/T timing offsets, and in-cycle
  baseline noise — so every operative has a visibly unique but stable
  waveform. The path loops seamlessly: cycle[0] == cycle[N] (same
  factors), so translating by one cycle width yields a flawless repeat.
*/

// --- Deterministic PRNG helpers ----------------------------------------

function hashString(str) {
  let h = 2166136261 >>> 0; // FNV-1a 32-bit
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a number in [min, max] from rng.
function pick(rng, min, max) {
  return min + rng() * (max - min);
}

// --- Path building ------------------------------------------------------

// Build one PQRST cycle starting at x0. All feature positions, amplitudes
// and baseline noise come from the `factors` bundle. Cycle width stays 180
// units so the outer loop stitches pixel-perfectly as long as the first and
// last factors match.
function buildPQRST(x0, y, baseAmp, factors) {
  const {
    rScale, tScale, qScale, sScale, pScale,
    baselineShift,
    pStart, rCenter, tCenter,
    noise, // array of {x, dy} baseline wiggle points
  } = factors;

  const yb = y + baselineShift;

  const p = baseAmp * 0.25 * pScale;
  const q = baseAmp * 0.15 * qScale;
  const r = baseAmp * 1.0 * rScale;
  const s = baseAmp * 0.55 * sScale;
  const t = baseAmp * 0.35 * tScale;

  // Noise points that land on the quiet segments (before P, between T and end).
  const leadingNoise = noise
    .filter((n) => n.x < pStart - 2)
    .map((n) => `L ${x0 + n.x} ${yb + n.dy}`)
    .join(' ');
  const trailingNoise = noise
    .filter((n) => n.x > tCenter + 20 && n.x < 176)
    .map((n) => `L ${x0 + n.x} ${yb + n.dy}`)
    .join(' ');

  return [
    `M ${x0} ${yb}`,
    leadingNoise,
    `L ${x0 + pStart} ${yb}`,
    // P wave (rounded bump)
    `Q ${x0 + pStart + 8} ${yb - p * 2} ${x0 + pStart + 16} ${yb}`,
    `L ${x0 + rCenter - 8} ${yb}`,
    // Q dip
    `L ${x0 + rCenter - 4} ${yb + q}`,
    // R spike
    `L ${x0 + rCenter} ${yb - r}`,
    // S down
    `L ${x0 + rCenter + 4} ${yb + s}`,
    // Back to baseline
    `L ${x0 + rCenter + 10} ${yb}`,
    `L ${x0 + tCenter - 14} ${yb}`,
    // T wave
    `Q ${x0 + tCenter} ${yb - t * 1.5} ${x0 + tCenter + 14} ${yb}`,
    trailingNoise,
    `L ${x0 + 180} ${y}`, // return to true baseline so neighbouring cycles stitch
  ].filter(Boolean).join(' ');
}

// Build a full multi-cycle path. First and last cycles share factors so
// the loop is seamless.
function buildSeamlessPath(seedStr, baseline, baseAmp, cycleWidth, numCycles) {
  const rng = mulberry32(hashString(seedStr || 'tactic'));

  const makeFactors = () => ({
    rScale: pick(rng, 0.6, 1.4),
    tScale: pick(rng, 0.5, 1.5),
    qScale: pick(rng, 0.7, 1.3),
    sScale: pick(rng, 0.7, 1.3),
    pScale: pick(rng, 0.6, 1.4),
    baselineShift: pick(rng, -3, 3),
    pStart: pick(rng, 10, 18),
    rCenter: pick(rng, 44, 52),
    tCenter: pick(rng, 80, 92),
    noise: [
      { x: pick(rng, 2, 8), dy: pick(rng, -1.5, 1.5) },
      { x: pick(rng, 108, 130), dy: pick(rng, -1.5, 1.5) },
      { x: pick(rng, 140, 170), dy: pick(rng, -1.5, 1.5) },
    ],
  });

  const factorsList = [];
  for (let i = 0; i < numCycles; i++) factorsList.push(makeFactors());
  // Force the final cycle to match the first so the loop is seamless.
  factorsList[numCycles - 1] = factorsList[0];

  return factorsList
    .map((f, i) => buildPQRST(i * cycleWidth, baseline, baseAmp, f))
    .join(' ');
}

// --- Component ----------------------------------------------------------

function HeartbeatChart({ width = '100%', height = '100%', alertLevel = 'NORMAL', seed = '' }) {
  const uid = useId().replace(/:/g, '_');

  const config = {
    NORMAL: { color: '#8fae5f', glow: '#b5d477', duration: '2.4s', amp: 16 },
    WARNING: { color: '#e8c547', glow: '#ffd966', duration: '1.3s', amp: 18 },
    CRITICAL: { color: '#e74c3c', glow: '#ff6b5b', duration: '0.65s', amp: 22 },
  }[alertLevel] || { color: '#8fae5f', glow: '#b5d477', duration: '2.4s', amp: 16 };

  const VB_W = 360;
  const VB_H = 48;
  const baseline = VB_H / 2;
  const cycleWidth = 180;
  const numCycles = 4; // path spans 4 * 180 = 720 units (> 2 viewports)

  // Per-card waveform, stable across re-renders via useMemo keyed on seed+level.
  const path = useMemo(
    () => buildSeamlessPath(`${seed}|${alertLevel}`, baseline, config.amp, cycleWidth, numCycles),
    [seed, alertLevel, config.amp],
  );

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

      {/* Scrolling waveform — seamless loop across full card width */}
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
