// Per-row alert classification, mirrors the rules used by the backend summarizer.
// CRITICAL: working days since last update >= 5
// WARNING:  working days >= 3, OR status is open/pending
// NORMAL:   otherwise (including done/closed rows)

function findKey(obj, target) {
  const lower = target.toLowerCase();
  return Object.keys(obj || {}).find((k) => k.toLowerCase().includes(lower));
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const direct = new Date(s);
  if (!isNaN(direct.getTime())) return direct;
  let m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return null;
}

function workingDaysSince(date) {
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  if (start > today) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < today) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

function isDoneStatus(raw) {
  if (!raw) return false;
  const v = String(raw).toLowerCase();
  return v.includes('done') || v.includes('closed') || v.includes('complete');
}

function isOpenOrPendingStatus(raw) {
  if (!raw) return false;
  const v = String(raw).toLowerCase();
  return v.includes('open') || v.includes('pending') || v.includes('wait') || v.includes('hold');
}

export function getRowAlerts(row) {
  if (!row) return { level: 'NORMAL', workingDays: 0 };

  const statusKey = findKey(row, 'status');
  const lastUpdateKey =
    findKey(row, 'last update') ||
    findKey(row, 'update date') ||
    findKey(row, 'update');

  const status = statusKey ? row[statusKey] : '';
  if (isDoneStatus(status)) {
    return { level: 'NORMAL', workingDays: 0 };
  }

  const parsed = lastUpdateKey ? parseDate(row[lastUpdateKey]) : null;
  const days = workingDaysSince(parsed);

  if (days >= 5) return { level: 'CRITICAL', workingDays: days };
  if (days >= 3 || isOpenOrPendingStatus(status)) return { level: 'WARNING', workingDays: days };
  return { level: 'NORMAL', workingDays: days };
}
