const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

export function getCachedData(key) {
  const item = cache.get(key);
  if (!item) return null;

  const now = Date.now();
  if (now > item.expireAt) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

export function setCachedData(key, data) {
  cache.set(key, {
    data: data,
    expireAt: Date.now() + CACHE_DURATION,
  });
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
