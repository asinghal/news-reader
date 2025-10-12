import Parser from "rss-parser";
import * as cheerio from "cheerio";

// RSS Parser Setup is a side effect (global state for the parser)
const rssParser = new Parser({
  defaultRSS: 2.0,
  headers: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,de;q=0.8",
    "cache-control": "no-cache",
    pragma: "no-cache",
    priority: "u=0, i",
    "sec-ch-ua":
      '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  },
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
export async function crawlPage(url, locator, attributes = []) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const $ = cheerio.load(await response.text());
    const element = $(locator);

    if (attributes && attributes.length) {
      return attributes
        .map((attribute) => element.attr(attribute))
        .find((value) => !!value);
    }
    return element.text().trim();
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return undefined;
  }
}
