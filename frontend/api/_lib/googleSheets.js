import { google } from 'googleapis';

const ENGINEERS = [
  'Joseph', 'Leo', 'Ian', 'Alien', 'Vincent',
  'Allen', 'Wallace', 'Daniel', 'Carlos',
];

const EXCLUDED_SHEETS = ['summary_temp', 'summary'];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error('Missing Google Sheets credentials');
  const privateKey = rawKey.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

function rowsToObjects(values) {
  if (!values || values.length < 2) return [];
  const [header, ...rows] = values;
  const keys = header.map((h) => String(h || '').trim());
  return rows.map((row) => {
    const obj = {};
    keys.forEach((k, i) => {
      if (k) obj[k] = row[i] != null ? String(row[i]).trim() : '';
    });
    return obj;
  });
}

function findKey(obj, target) {
  const lower = target.toLowerCase();
  return Object.keys(obj).find((k) => k.toLowerCase().includes(lower));
}

function classifyStatus(raw) {
  if (!raw) return 'unknown';
  const v = String(raw).toLowerCase().trim();
  if (v.includes('done') || v.includes('closed') || v.includes('complete')) return 'done';
  if (v.includes('pending') || v.includes('wait') || v.includes('hold')) return 'pending';
  if (v.includes('in progress') || v.includes('progress') || v === 'open' || v.includes('open')) return 'active';
  return 'unknown';
}

// Parse various date formats seen in sheets: "2026/04/08", "04/08/2026", "2026-04-08", etc.
function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Try ISO / native
  const direct = new Date(s);
  if (!isNaN(direct.getTime())) return direct;
  // Try YYYY/MM/DD or YYYY-MM-DD
  let m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Try MM/DD/YYYY or DD/MM/YYYY — assume MM/DD/YYYY (US) since sheet likely uses that
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return null;
}

// Count working days (Mon-Fri) between date and today, inclusive of partial today.
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

function computeAlertLevel(maxDays) {
  if (maxDays > 5) return 'CRITICAL';
  if (maxDays > 3) return 'WARNING';
  return 'NORMAL';
}

function summarizeEngineer(name, rows) {
  let all = 0, active = 0, pending = 0, done = 0;
  let maxDaysSinceUpdate = 0;

  for (const row of rows) {
    const statusKey = findKey(row, 'status');
    const lastUpdateKey = findKey(row, 'last update') || findKey(row, 'update date') || findKey(row, 'update');
    if (!statusKey) continue;
    const cls = classifyStatus(row[statusKey]);
    if (cls === 'unknown') continue;
    all += 1;
    if (cls === 'done') {
      done += 1;
      continue;
    }
    if (cls === 'active') active += 1;
    if (cls === 'pending') pending += 1;
    // For non-done rows, measure staleness
    if (lastUpdateKey) {
      const parsed = parseDate(row[lastUpdateKey]);
      if (parsed) {
        const days = workingDaysSince(parsed);
        if (days > maxDaysSinceUpdate) maxDaysSinceUpdate = days;
      }
    }
  }

  const alertLevel = (active + pending) === 0 ? 'NORMAL' : computeAlertLevel(maxDaysSinceUpdate);

  return {
    id: name,
    name,
    all,
    active,
    pending,
    done,
    maxDaysSinceUpdate,
    alertLevel,
  };
}

function isExcluded(title) {
  const l = title.toLowerCase();
  return EXCLUDED_SHEETS.some((ex) => l.includes(ex));
}

function findEngineerSheet(sheetTitles, engineer) {
  const lower = engineer.toLowerCase();
  const candidates = sheetTitles.filter((t) => !isExcluded(t));
  const mainMatch = candidates.find((t) => {
    const l = t.toLowerCase();
    return l.includes(lower) && (l.includes('main') || l.includes('car'));
  });
  if (mainMatch) return mainMatch;
  return candidates.find((t) => t.toLowerCase().includes(lower));
}

export async function getSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  let meta;
  try {
    meta = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets.properties.title',
    });
  } catch (err) {
    throw new Error(`Google Sheets metadata error: ${err.message}`);
  }
  const sheetTitles = (meta.data.sheets || []).map((s) => s.properties.title);

  const matched = ENGINEERS.map((name) => ({
    name,
    sheetTitle: findEngineerSheet(sheetTitles, name),
  }));

  const toFetch = matched.filter((m) => m.sheetTitle);
  const ranges = toFetch.map((m) => `'${m.sheetTitle}'!A1:Z500`);

  let response = { data: { valueRanges: [] } };
  if (ranges.length > 0) {
    try {
      response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges,
      });
    } catch (err) {
      throw new Error(`Google Sheets values error: ${err.message}`);
    }
  }

  const valueRanges = response.data.valueRanges || [];
  const fetchedMap = new Map();
  toFetch.forEach((m, i) => {
    fetchedMap.set(m.name, valueRanges[i]?.values || []);
  });

  return matched.map(({ name, sheetTitle }) => {
    const values = fetchedMap.get(name) || [];
    const rows = rowsToObjects(values);
    const summary = summarizeEngineer(name, rows);
    summary.sheetTitle = sheetTitle || null;
    return summary;
  });
}
