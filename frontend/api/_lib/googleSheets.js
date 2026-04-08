import { google } from 'googleapis';

const ENGINEERS = [
  'Joseph', 'Leo', 'Ian', 'Alien', 'Vincent',
  'Allen', 'Wallace', 'Daniel', 'Carlos',
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error('Missing Google Sheets credentials');
  }
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

function isDone(row) {
  const statusKey = findKey(row, 'status');
  if (!statusKey) return false;
  const v = String(row[statusKey] || '').toLowerCase();
  return v.includes('done') || v.includes('closed');
}

function summarizeEngineer(name, rows) {
  const total = rows.length;
  const done = rows.filter(isDone).length;
  const active = total - done;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  let latestTask = '—';
  const active_rows = rows.filter((r) => !isDone(r));
  if (active_rows.length > 0) {
    const symptomKey = findKey(active_rows[0], 'symptom') || findKey(active_rows[0], 'customer');
    if (symptomKey) latestTask = active_rows[0][symptomKey] || '—';
  }
  return {
    id: name,
    name,
    task: active > 0 ? `${active} active / ${total} total` : `${total} cases (all done)`,
    latestTask,
    progress,
    status: active === 0 ? 'idle' : active >= 5 ? 'critical' : 'in-progress',
  };
}

const EXCLUDED_SHEETS = ['summary_temp', 'summary'];

function isExcluded(title) {
  const l = title.toLowerCase();
  return EXCLUDED_SHEETS.some((ex) => l.includes(ex));
}

function findEngineerSheet(sheetTitles, engineer) {
  const lower = engineer.toLowerCase();
  const candidates = sheetTitles.filter((t) => !isExcluded(t));
  // Prefer sheets that look like a Main/CAR sheet for this engineer
  const mainMatch = candidates.find((t) => {
    const l = t.toLowerCase();
    return l.includes(lower) && (l.includes('main') || l.includes('car'));
  });
  if (mainMatch) return mainMatch;
  // Fallback: any non-excluded sheet containing engineer name
  return candidates.find((t) => t.toLowerCase().includes(lower));
}

export async function getSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Step 1: get all sheet titles
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

  // Step 2: map each engineer to an actual sheet title
  const matched = ENGINEERS.map((name) => ({
    name,
    sheetTitle: findEngineerSheet(sheetTitles, name),
  }));

  // Step 3: batchGet only the matched ranges (skip unmatched)
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
    if (!sheetTitle) {
      summary.task = 'no sheet found';
    }
    return summary;
  });
}
