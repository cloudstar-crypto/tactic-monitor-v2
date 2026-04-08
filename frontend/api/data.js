import { getSheetData } from './_lib/googleSheets.js';
import { getCachedData, setCachedData } from './_lib/cache.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cached = getCachedData('engineers');
    if (cached) {
      return res.status(200).json({
        engineers: cached,
        fromCache: true,
      });
    }

    const engineers = await getSheetData();
    setCachedData('engineers', engineers);

    return res.status(200).json({
      engineers: engineers,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({
      error: 'Failed to fetch engineer data',
      message: error.message,
    });
  }
}
