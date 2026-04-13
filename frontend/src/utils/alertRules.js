// Per-row alert classification for MAIN(CAR) rows.
// Only rows with status Open / In Progress / Pending are evaluated;
// all other statuses are treated as NORMAL immediately.
// CRITICAL: working days since last update >= 5
// WARNING:  working days >= 3, OR status is Open/Pending
// NORMAL:   otherwise

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

// Only Open / In Progress / Pending are active statuses; everything else is NORMAL.
function isActiveStatus(raw) {
  if (!raw) return false;
  const v = String(raw).toLowerCase();
  return v.includes('open') || v.includes('in progress') || v.includes('pending');
}

function isOpenOrPendingStatus(raw) {
  if (!raw) return false;
  const v = String(raw).toLowerCase();
  return v.includes('open') || v.includes('pending');
}

export function getRowAlerts(row) {
  if (!row) return { level: 'NORMAL', workingDays: 0 };

  const statusKey = findKey(row, 'status');
  const lastUpdateKey = findKey(row, 'last update');

  const status = statusKey ? row[statusKey] : '';
  if (!isActiveStatus(status)) {
    return { level: 'NORMAL', workingDays: 0 };
  }

  // Last Update 欄位前 8 碼即為日期 (YYYYMMDD)
  const raw = lastUpdateKey ? String(row[lastUpdateKey] || '').trim() : '';
  const prefix = raw.slice(0, 8);
  const parsed = /^\d{8}$/.test(prefix)
    ? new Date(Number(prefix.slice(0, 4)), Number(prefix.slice(4, 6)) - 1, Number(prefix.slice(6, 8)))
    : parseDate(raw);
  const days = workingDaysSince(parsed);

  if (days >= 5) return { level: 'CRITICAL', workingDays: days };
  if (days >= 3 || isOpenOrPendingStatus(status)) return { level: 'WARNING', workingDays: days };
  return { level: 'NORMAL', workingDays: days };
}
