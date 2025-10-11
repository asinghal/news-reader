import Parser from "rss-parser";
import * as cheerio from "cheerio";

// RSS Parser Setup is a side effect (global state for the parser)
const rssParser = new Parser({
  defaultRSS: 2.0,
  customFields: {
    item: [
      ["media:thumbnail", "enclosure"],
      ["media:content", "enclosure"],
    ],
  },
});

/**
 * Fetches an RSS feed from the URL and parses it.
 * @param {string} url The RSS feed URL.
 * @returns {Promise<Object>} The parsed RSS feed object.
 */
export async function fetchAndParseFeed(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const text = await response.text();
    return rssParser.parseString(text);
  } catch (error) {
    console.error(`Error fetching/parsing RSS feed from ${url}:`, error);
    throw error;
  }
}

/**
 * Fetches a URL and extracts content using a CSS selector.
 * This is the crawling side effect.
 * @param {string} url The URL to crawl.
 * @param {string} locator The CSS selector.
 * @param {string | null} attribute The HTML attribute to extract (e.g., 'src').
 * @returns {Promise<string | undefined>} The extracted text or attribute value.
 */
export async function crawlPage(url, locator, attribute = null) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const $ = cheerio.load(await response.text());
    const element = $(locator);

    if (attribute) {
      return element.attr(attribute);
    }
    return element.text().trim();
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return undefined;
  }
}
