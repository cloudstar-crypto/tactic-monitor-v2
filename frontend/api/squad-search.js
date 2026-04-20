import { getSquadMainRows } from './_lib/googleSheets.js';
import { getCachedData, setCachedData } from './_lib/cache.js';

const SQUAD_MEMBERS = {
  Sunny: ['Joseph', 'Leo', 'Ian', 'Alien', 'Vincent'],
  Ali: ['Allen', 'Wallace', 'Daniel', 'Carlos', 'Bobo'],
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const captain = req.query?.captain;
  if (!captain || !SQUAD_MEMBERS[captain]) {
    return res.status(400).json({ error: 'Invalid or missing captain parameter' });
  }

  const cacheKey = `squad-main:${captain}`;

  try {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({ rows: cached, fromCache: true });
    }

    const rows = await getSquadMainRows(SQUAD_MEMBERS[captain]);
    setCachedData(cacheKey, rows);

    return res.status(200).json({ rows, fromCache: false });
  } catch (error) {
    console.error('Error fetching squad data:', error);
    return res.status(500).json({
      error: 'Failed to fetch squad data',
      message: error.message,
    });
  }
}
