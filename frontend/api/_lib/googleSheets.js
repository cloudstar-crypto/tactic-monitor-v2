import { google } from 'googleapis';

const ENGINEERS = [
  'Sunny', 'Joseph', 'Leo', 'Ian', 'Alien', 'Vincent',
  'Ali', 'Allen', 'Wallace', 'Daniel', 'Carlos',
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

export async function getSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const ranges = ENGINEERS.map((n) => `Main_${n}!A1:Z500`);
  let response;
  try {
    response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges,
    });
  } catch (err) {
    throw new Error(`Google Sheets API error: ${err.message}`);
  }

  const valueRanges = response.data.valueRanges || [];
  return ENGINEERS.map((name, i) => {
    const values = valueRanges[i]?.values || [];
    const rows = rowsToObjects(values);
    return summarizeEngineer(name, rows);
  });
}
