const feedCache = {};
const CACHE_DURATION_MS = 1000 * 60 * 15; // 15 minutes

/**
 * Checks if a URL is currently cached and the entry is still fresh.
 * @param {string} url The feed URL.
 * @returns {Object | null} The cached feed object or null.
 */
export function getCachedFeed(url) {
  const cachedEntry = feedCache[url];
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS) {
    return cachedEntry.feed;
  }
  return null;
}

/**
 * Saves a parsed feed object to the cache.
 * @param {string} url The feed URL.
 * @param {Object} feed The parsed feed data.
 */
export function setCachedFeed(url, feed) {
  feedCache[url] = { feed, timestamp: Date.now() };
}
