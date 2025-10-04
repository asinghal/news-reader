const Parser = require("rss-parser");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const files = fs.readdirSync(path.join(__dirname, "lang"));
const jsonFiles = files.filter((file) => file.endsWith(".json"));
const languages = jsonFiles
  .map((file) => ({
    [file.split(".")[0]]: require(`./lang/${file}`),
  }))
  .reduce((acc, curr) => ({ ...acc, ...curr }), {});

const parser = new Parser({
  defaultRSS: 2.0,
  customFields: {
    item: [
      ["media:thumbnail", "enclosure"],
      ["media:content", "enclosure"],
    ],
  },
});

const cache = {};

const getFeed = async (url) => {
  try {
    if (cache[url] && Date.now() - cache[url].timestamp < 1000 * 60 * 15) {
      // Cache for 15 minutes
      return new Promise((resolve) => resolve(cache[url].feed));
    }

    const response = await fetch(url);
    const text = await response.text();
    const feed = parser.parseString(text);
    cache[url] = { feed, timestamp: Date.now() };
    return new Promise((resolve) => resolve(feed));
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    throw error;
  }
};

function timeAgo(date, lang = "en") {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1)
    return (
      interval +
      " " +
      (interval > 1 ? languages[lang].years_ago : languages[lang].year_ago)
    );

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1)
    return (
      interval +
      " " +
      (interval > 1 ? languages[lang].months_ago : languages[lang].month_ago)
    );

  interval = Math.floor(seconds / 86400);
  if (interval >= 1)
    return (
      interval +
      " " +
      (interval > 1 ? languages[lang].days_ago : languages[lang].day_ago)
    );

  interval = Math.floor(seconds / 3600);
  if (interval >= 1)
    return (
      interval +
      " " +
      (interval > 1 ? languages[lang].hours_ago : languages[lang].hour_ago)
    );

  interval = Math.floor(seconds / 60);
  if (interval >= 15)
    return (
      interval +
      " " +
      (interval > 1 ? languages[lang].minutes_ago : languages[lang].minute_ago)
    );

  return languages[lang].just_now;
}

/**
 * Checks if the input string is an absolute date string (e.g., 2025-10-02T23:45:05+05:30, or 2025-10-02)
 * rather than a relative time string (e.g., 16 hours ago).
 *
 * @param {string} value The incoming date/time string from the RSS feed.
 * @returns {boolean} True if it looks like an absolute date, false otherwise.
 */
function isAbsoluteDateString(value) {
  if (typeof value !== "string") {
    return false;
  }

  // Regex Explanation:
  // 1. \d{4}-\d{2}-\d{2} -> Matches YYYY-MM-DD (covers ISO and Date-Only)
  // OR
  // 2. \d{2}\s[A-Za-z]{3}\s\d{4} -> Matches DD Mon YYYY (e.g., 03 Oct 2025 - covers RFC 2822)
  // OR
  // 3. (GMT|UTC|Z|[+-]\d{2}:?\d{2}) -> Matches common Time Zone abbreviations/offsets
  const dateRegex =
    /(\d{4}-\d{2}-\d{2})|(\d{2}\s[A-Za-z]{3}\s\d{4})|(GMT|UTC|Z|[+-]\d{2}:?\d{2})/i;
  return dateRegex.test(value);
}

const labels = {
  NEWS: "News",
  BUSINESS: "Business",
  TECH: "Technology",
  WORLD: "World",
  SPORTS: "Sports",
  ENTERTAINMENT: "Entertainment",
  TNN: "News",
  GLOBAL: "World",
  ASTRO: "Astrology",
};

const fetchRSS = async (url, articleLocator, language, expand = false) => {
  const _feed = await getFeed(url);
  const feed = { ..._feed };

  await Promise.all(
    feed.items.map(async (item) => {
      if (item.enclosure && item.enclosure.$) {
        item.enclosure = item.enclosure.$;
      }

      if (item.enclosure && item.enclosure.url) {
        fetch(item.enclosure.url, {
          method: "HEAD",
        })
          .then((res) => {
            if (!res.ok) {
              console.error(
                `Error fetching enclosure ${item.enclosure.url} for ${item.title}:`,
                res.statusText,
              );
              item.enclosure = undefined;
              return;
            }
          })
          .catch((err) => {
            console.error(
              `Error fetching enclosure ${item.enclosure.url} for ${item.title}:`,
              err,
            );
            item.enclosure = undefined;
          });
      }

      if (item.pubDate && isAbsoluteDateString(item.pubDate)) {
        item.pubDate = timeAgo(new Date(item.pubDate), language);
      }

      if (item.creator) {
        item.labels = Object.keys(labels)
          .filter((label) => item.creator.toUpperCase().includes(label))
          .map((label) => labels[label]);
      }

      if (!item.labels || item.labels.length === 0) {
        item.labels = [languages[language].news];
      }

      const content = item.content || item.contentSnippet || "";
      const $ = cheerio.load(`<div>${content}</div>`);
      item.content = $.text();
      if (item.content.length > 500) {
        item.content = item.content.substring(0, 500) + "...";
      }

      if (
        !!expand &&
        (!item.content || item.content.length < 20) &&
        (!item.contentSnippet || item.contentSnippet.length < 20)
      ) {
        try {
          const fetched = await fetch(item.link);
          const $ = cheerio.load(await fetched.text());
          const content = $(articleLocator).text();
          const reduced =
            content.replaceAll("...", "").split(".").slice(0, 3).join(". ") +
            ".";
          item.content = reduced;
        } catch (error) {
          console.error(
            `Error fetching expanded content for ${item.title}:`,
            error,
          );
        }
      }
      return item;
    }),
  );
  return feed;
};

module.exports = { fetchRSS };
