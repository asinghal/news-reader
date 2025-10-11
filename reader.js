import { loadLanguages } from "./services/lang.js";
import { getCachedFeed, setCachedFeed } from "./services/cache.js";
import { fetchAndParseFeed, crawlPage } from "./services/rss.js";
import { processItemSynchronous } from "./utils/item.js";

// Load languages once on startup (Initial side effect)
const LANGUAGES = await loadLanguages();

/**
 * Performs asynchronous content expansion and image crawling (I/O)
 * and attaches results to the item.
 * @param {Object} item The already processed item.
 * @param {string | null} articleLocator Selector for article content expansion.
 * @param {string | null} imageLocator Selector for image URL.
 * @param {boolean} expand If true, attempts to crawl the link for more content.
 */
async function processItemAsynchronous(
  item,
  articleLocator,
  imageLocator,
  expand,
) {
  const processedItem = { ...item }; // Work on a clone

  // 1. Conditional Expansion (Crawl for more content if needed)
  const needsExpansion =
    expand && processedItem.link && processedItem.content.length < 20;

  if (needsExpansion && articleLocator) {
    const crawledContent = await crawlPage(processedItem.link, articleLocator);
    if (crawledContent) {
      // Simple content reduction
      processedItem.content =
        crawledContent.split(/[.?!]/).slice(0, 3).join(". ").trim() + "...";
    }
  }

  // 2. Crawl for Image if missing
  const hasImage = processedItem.enclosure?.url;
  if (!hasImage && imageLocator && processedItem.link) {
    const image = await crawlPage(processedItem.link, imageLocator, "data-src");
    if (image) {
      processedItem.enclosure = { url: image };
    }
  }

  return processedItem;
}

/**
 * Fetches an RSS feed and processes its articles for display. (Main Orchestrator)
 * @param {string} url The RSS feed URL.
 * @param {string} articleLocator CSS selector for main article content.
 * @param {string} language The target language code.
 * @param {boolean} [expand=false] Whether to crawl the article link for more content.
 * @param {string | null} [imageLocator=null] CSS selector for the article's main image.
 * @returns {Promise<Object>} The processed RSS feed object.
 */
export async function fetchRSS(
  url,
  articleLocator,
  language,
  expand = false,
  imageLocator = null,
) {
  const langCode = LANGUAGES[language] ? language : "en";
  const translations = LANGUAGES[langCode];

  // --- Caching Side Effect ---
  let feed = getCachedFeed(url);

  if (!feed) {
    // --- Network I/O Side Effect ---
    const rawFeed = await fetchAndParseFeed(url);
    feed = JSON.parse(JSON.stringify(rawFeed)); // Deep clone before processing
    setCachedFeed(url, feed);
  }

  // Create a clone of the feed for processing to avoid modifying the cached object
  const finalFeed = JSON.parse(JSON.stringify(feed));

  // 1. Run all synchronous (pure) transformations
  finalFeed.items = finalFeed.items.map((item) =>
    processItemSynchronous(item, translations),
  );

  // 2. Run all asynchronous (I/O) transformations concurrently
  finalFeed.items = await Promise.all(
    finalFeed.items.map((item) =>
      processItemAsynchronous(item, articleLocator, imageLocator, expand),
    ),
  );

  return finalFeed;
}
