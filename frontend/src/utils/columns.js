// Column visibility & display rules for Layer 2 / Layer 3 tables.

// Hidden in ALL tabs (case-insensitive substring match against the column key).
const ALWAYS_HIDDEN = ['fae'];

// Hidden ONLY in MAIN(CAR) tab.
const MAIN_HIDDEN = [
  'history',
  'sales',
  'solution',           // catches "Solution" and "Solution (Ctrl+PCB+FW/ DRAM)"
];

// Optional display-name overrides (key: lowercase substring → display label).
// First matching entry wins.
export const COLUMN_RENAMES = [
  { match: 'fail symptom', label: 'FAIL SYMPTOM' },
  { match: 'last update', label: 'LAST UPDATE' },
  { match: 'car open date', label: 'CAR OPEN DATE' },
  { match: 'car no', label: 'CAR NO.' },
  { match: 'onsite support', label: 'ONSITE SUPPORT AND VIDEO CON.' },
  { match: 'other support', label: 'OTHER SUPPORT' },
];

export function isHiddenColumn(key, tab) {
  if (!key) return true;
  const k = String(key).toLowerCase();
  if (ALWAYS_HIDDEN.some((h) => k.includes(h))) return true;
  if (tab === 'main' && MAIN_HIDDEN.some((h) => k.includes(h))) return true;
  return false;
}

export function displayName(key) {
  if (!key) return '';
  const k = String(key).toLowerCase();
  const hit = COLUMN_RENAMES.find((r) => k.includes(r.match));
  return hit ? hit.label : String(key).toUpperCase();
}

// Default per-column widths in px. auto = flex-grow.
// Order matters: longer/more-specific patterns must come before broader ones
// because `find` returns the first match.
const FIXED_WIDTHS = [
  { match: 'status', width: 'clamp(90px, 7.64vw, 196px)' },
  { match: 'customer', width: 'clamp(80px, 6.94vw, 178px)' },
  { match: 'car no', width: 'clamp(56px, 4.86vw, 125px)' },
  { match: 'pn', width: 'clamp(112px, 9.72vw, 249px)' },
  { match: 'last update', width: 'clamp(180px, 13.89vw, 356px)' },
  { match: 'car open date', width: 'clamp(80px, 6.94vw, 178px)' },
  // 8-digit update-date columns only — must be the two-word phrase so we
  // don't accidentally shrink other columns whose header text happens to
  // contain the word "date" (e.g. Onsite column with "(... + Date + ...)").
  { match: 'update date', width: 'clamp(76px, 6.6vw, 169px)' },
];

export function columnWidth(key) {
  if (!key) return null;
  const k = String(key).toLowerCase();
  const hit = FIXED_WIDTHS.find((w) => k.includes(w.match));
  return hit ? hit.width : null;
}

// Determine if a row has any value across the visible columns for a tab.
// Used to filter out blank rows. Hidden-but-populated columns do not count.
export function rowHasVisibleContent(row, tab) {
  if (!row) return false;
  return Object.keys(row).some((k) => {
    if (isHiddenColumn(k, tab)) return false;
    const v = row[k];
    return v != null && String(v).trim() !== '';
  });
}
