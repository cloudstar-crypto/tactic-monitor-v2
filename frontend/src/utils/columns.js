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
  { match: 'status', width: 110 },
  { match: 'customer', width: 100 },
  { match: 'car no', width: 70 },
  { match: 'pn', width: 140 },
  { match: 'last update', width: 200 },
  { match: 'car open date', width: 100 },
  // Update-date columns in non-main tabs only hold an 8-digit date, so
  // keep them tight. This match also catches header variants like
  // "Update Date", "Update_Date", "UpdateDate", or plain "Date".
  { match: 'update', width: 95 },
  { match: 'date', width: 95 },
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
