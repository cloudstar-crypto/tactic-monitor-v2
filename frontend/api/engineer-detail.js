import { getEngineerDetail } from './_lib/googleSheets.js';
import { getCachedData, setCachedData } from './_lib/cache.js';

const NAME_PATTERN = /^[A-Za-z0-9_\u4e00-\u9fff-]{1,40}$/;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const name = req.query?.name;
  if (!name || typeof name !== 'string' || !NAME_PATTERN.test(name)) {
    return res.status(400).json({ error: 'Invalid or missing name parameter' });
  }

  const cacheKey = `engineer-detail:${name}`;

  try {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, fromCache: true });
    }

    const detail = await getEngineerDetail(name);
    setCachedData(cacheKey, detail);

    return res.status(200).json({ ...detail, fromCache: false });
  } catch (error) {
    console.error('Error fetching engineer detail:', error);
    return res.status(500).json({
      error: 'Failed to fetch engineer detail',
      message: error.message,
    });
  }
}
