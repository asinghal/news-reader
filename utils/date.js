/**
 * Checks if the input string is an absolute date string. (Pure)
 * @param {*} value The incoming date/time string.
 * @returns {boolean} True if it looks like an absolute date, false otherwise.
 */
export function isAbsoluteDateString(value) {
  if (typeof value !== "string") return false;
  const dateRegex =
    /(\d{4}-\d{2}-\d{2})|(\d{2}\s[A-Za-z]{3}\s\d{4})|(GMT|UTC|Z|[+-]\d{2}:?\d{2})/i;
  return dateRegex.test(value);
}

/**
 * Converts a date into a human-readable "time ago" string. (Pure)
 * @param {Date} date The date object.
 * @param {Object} translations The language object for 'time ago' phrases.
 * @returns {string} The "time ago" string.
 */
export function formatTimeAgo(date, translations) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = [
    // ... (timeAgo logic from previous example) ...
    { limit: 31536000, key: "year" },
    { limit: 2592000, key: "month" },
    { limit: 86400, key: "day" },
    { limit: 3600, key: "hour" },
    { limit: 60, key: "minute" },
  ];

  for (const { limit, key } of intervals) {
    const interval = Math.floor(seconds / limit);
    if (interval >= 1) {
      const translationKey = interval > 1 ? `${key}s_ago` : `${key}_ago`;
      return `${interval} ${translations[translationKey]}`;
    }
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes >= 1) {
    const translationKey = minutes > 1 ? "minutes_ago" : "minute_ago";
    return `${minutes} ${translations[translationKey]}`;
  }

  return translations.just_now;
}
