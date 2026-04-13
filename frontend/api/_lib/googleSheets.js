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

// Count items encoded inside a single cell for report-style tabs.
// Rules:
//   - null / undefined / empty string → 0
//   - 'NA' / 'N/A' (case-insensitive, whitespace ignored) → 0
//   - otherwise → number of line breaks + 1
function countCell(raw) {
  if (raw == null) return 0;
  const s = String(raw).trim();
  if (s === '') return 0;
  const compact = s.replace(/\s+/g, '').toLowerCase();
  if (compact === 'na' || compact === 'n/a') return 0;
  const normalized = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const newlines = (normalized.match(/\n/g) || []).length;
  return newlines + 1;
}

// Compute the per-tab count for report-style tabs by reading fixed cell
// positions from the raw sheet values (NOT the header-keyed objects).
//   - report / fsr / rmReport: count of B2 only
//   - others: count of B2 + count of C2
// values is the raw 2D array returned by the Sheets API (row 0 = header).
function computeTabCount(values, tabKey) {
  if (!values || values.length < 2) return 0;
  const dataRow = values[1];
  if (!dataRow) return 0;
  if (tabKey === 'others') {
    return countCell(dataRow[1]) + countCell(dataRow[2]);
  }
  if (tabKey === 'report' || tabKey === 'fsr' || tabKey === 'rmReport') {
    return countCell(dataRow[1]);
  }
  return 0;
}

function findKey(obj, target) {
  const lower = target.toLowerCase();
  return Object.keys(obj).find((k) => k.toLowerCase().includes(lower));
}

function classifyStatus(raw) {
  if (!raw) return 'done';
  const v = String(raw).toLowerCase().trim();
  if (v.includes('open')) return 'active';
  if (v.includes('in progress')) return 'active';
  if (v.includes('pending')) return 'pending';
  return 'done';
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
  if (maxDays >= 5) return 'CRITICAL';
  if (maxDays >= 3) return 'WARNING';
  return 'NORMAL';
}

function summarizeEngineer(name, rows) {
  let all = 0, active = 0, pending = 0, done = 0;
  let maxDaysSinceUpdate = 0;

  for (const row of rows) {
    const statusKey = findKey(row, 'status');
    const lastUpdateKey = findKey(row, 'last update');
    if (!statusKey) continue;
    const cls = classifyStatus(row[statusKey]);
    all += 1;
    if (cls === 'done') {
      done += 1;
      continue;
    }
    if (cls === 'active') active += 1;
    if (cls === 'pending') pending += 1;
    // For non-done rows, measure staleness via Last Update first 8 chars (YYYYMMDD)
    if (lastUpdateKey) {
      const raw = String(row[lastUpdateKey] || '').trim();
      const prefix = raw.slice(0, 8);
      const parsed = /^\d{8}$/.test(prefix)
        ? new Date(Number(prefix.slice(0, 4)), Number(prefix.slice(4, 6)) - 1, Number(prefix.slice(6, 8)))
        : parseDate(raw);
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

// Find the 5 sheets belonging to an engineer, classified by tab key.
// Returns: { main, report, fsr, rmReport, others } — values are sheet titles or null.
function findEngineerSheetSet(sheetTitles, engineer) {
  const lower = engineer.toLowerCase();
  const candidates = sheetTitles.filter((t) => !isExcluded(t) && t.toLowerCase().includes(lower));

  const result = { main: null, report: null, fsr: null, rmReport: null, others: null };

  for (const title of candidates) {
    const l = title.toLowerCase();
    if (!result.rmReport && (l.includes('rmreport') || l.includes('rm_report') || l.includes('rm report') || (l.includes('rm') && l.includes('report')))) {
      result.rmReport = title;
      continue;
    }
    if (!result.report && l.includes('report')) {
      result.report = title;
      continue;
    }
    if (!result.fsr && (l.includes('fsr') || l.includes('fw_sw') || l.includes('fwsw') || l.includes('fw/sw'))) {
      result.fsr = title;
      continue;
    }
    if (!result.others && (l.includes('other'))) {
      result.others = title;
      continue;
    }
    if (!result.main && (l.includes('main') || l.includes('car'))) {
      result.main = title;
      continue;
    }
  }
  // Fallback: if still no main found, use any remaining engineer sheet
  if (!result.main) {
    const used = new Set(Object.values(result).filter(Boolean));
    const fallback = candidates.find((t) => !used.has(t));
    if (fallback) result.main = fallback;
  }
  return result;
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

// Fetch the full 5-tab dataset for a single engineer.
// Returns: { name, main, report, fsr, rmReport, others } where each tab is an array of row objects.
export async function getEngineerDetail(name) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID');
  if (!name) throw new Error('Missing engineer name');

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

  const sheetSet = findEngineerSheetSet(sheetTitles, name);
  const tabKeys = ['main', 'report', 'fsr', 'rmReport', 'others'];

  const toFetch = tabKeys
    .map((key) => ({ key, title: sheetSet[key] }))
    .filter((t) => t.title);
  const ranges = toFetch.map((t) => `'${t.title}'!A1:Z500`);

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
  const result = {
    name,
    main: [],
    report: [],
    fsr: [],
    rmReport: [],
    others: [],
    // Backend-computed Tab counts for report-style tabs. MAIN is still
    // counted client-side from visible-row filtering; these override the
    // client count for the other four tabs.
    tabCounts: { report: 0, fsr: 0, rmReport: 0, others: 0 },
  };
  toFetch.forEach((t, i) => {
    const values = valueRanges[i]?.values || [];
    result[t.key] = rowsToObjects(values);
    if (t.key in result.tabCounts) {
      result.tabCounts[t.key] = computeTabCount(values, t.key);
    }
  });

  return result;
}
