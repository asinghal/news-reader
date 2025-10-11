import * as cheerio from "cheerio";
import { isAbsoluteDateString, formatTimeAgo } from "./date.js";

const SNIPPET_MAX_LENGTH = 500;
const CATEGORY_LABELS = {
  // ... (Your labels here) ...
  NEWS: "News",
  BUSINESS: "Business",
  TECH: "Technology",
  WORLD: "World",
  // ...
};

/**
 * Cleans content, formats date, and assigns labels to an RSS item. (Pure)
 * This function handles all *synchronous* transformations.
 *
 * @param {Object} item The RSS feed item (will be mutated, pass a clone if strict immutability is required).
 * @param {Object} translations Language translations for 'time ago' and 'news' fallback.
 * @returns {Object} The processed item.
 */
export function processItemSynchronous(item, translations) {
  // 1. Clone the item to prevent mutation of the original item object
  const processedItem = { ...item };

  // 2. Normalize 'enclosure' property
  if (processedItem.enclosure && processedItem.enclosure.$) {
    processedItem.enclosure = processedItem.enclosure.$;
  }

  // 3. Format Date
  if (processedItem.pubDate && isAbsoluteDateString(processedItem.pubDate)) {
    // formatTimeAgo is a pure function
    processedItem.pubDate = formatTimeAgo(
      new Date(processedItem.pubDate),
      translations,
    );
  }

  // 4. Extract/Determine Labels
  processedItem.labels = [];
  if (processedItem.creator) {
    const creatorUpper = processedItem.creator.toUpperCase();
    processedItem.labels = Object.keys(CATEGORY_LABELS)
      .filter((labelKey) => creatorUpper.includes(labelKey))
      .map((labelKey) => CATEGORY_LABELS[labelKey]);
  }

  // Fallback label
  if (processedItem.labels.length === 0) {
    processedItem.labels = [translations.news || "News"];
  }

  // 5. Clean up and Truncate Content/Snippet
  let content = processedItem.content || processedItem.contentSnippet || "";
  // Cheerio load here is safe as it's an in-memory transformation, not I/O
  const $ = cheerio.load(`<div>${content}</div>`);
  processedItem.content = $.text().trim();

  if (processedItem.content.length > SNIPPET_MAX_LENGTH) {
    processedItem.content =
      processedItem.content.substring(0, SNIPPET_MAX_LENGTH) + "...";
  }

  // 6. Ensure link is a string
  if (processedItem.link) {
    processedItem.link = String(processedItem.link);
  }

  return processedItem;
}
