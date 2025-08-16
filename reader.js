const Parser = require('rss-parser');
const cheerio = require('cheerio');

const parser = new Parser({
    customFields: {
        item: [
            ['media:thumbnail', 'enclosure'],
            ['media:content', 'enclosure'],
        ]
    }
});

// const cache = {};

// const getFeed = async (url) => {
//     if (cache[url] && (Date.now() - cache[url].timestamp < 1000 * 60 * 30)) { // Cache for 30 minutes
//         return new Promise(resolve => resolve(cache[url].feed));
//     }
//     const feed = await parser.parseURL(url);
//     cache[url] = { feed, timestamp: Date.now() };
//     return feed;
// };

function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 60);
  if (interval >= 15) return interval + " minute" + (interval > 1 ? "s" : "") + " ago";


  return "Just now";
}

const labels = {'NEWS':'News', 'BUSINESS': 'Business', 'TECH': 'Technology', 'WORLD': 'World', 'SPORTS': 'Sports', 'ENTERTAINMENT': 'Entertainment', 'TNN': 'News', 'GLOBAL': 'World', 'ASTRO': 'Astrology' };

const fetchRSS = async (url, expand = false) => {

    const feed = await parser.parseURL(url);

    await Promise.all(feed.items.map(async item => {
        if (item.enclosure && item.enclosure.$) {
            item.enclosure = item.enclosure.$;
        }

        if (item.enclosure && item.enclosure.url) {
            fetch(item.enclosure.url, {
                method: 'HEAD'
            }).then(res => {
                if (!res.ok) {
                    console.error(`Error fetching enclosure for ${item.title}:`, res.statusText);
                    item.enclosure = undefined;
                    return;
                }
            }).catch(err => {
                console.error(`Error fetching enclosure for ${item.title}:`, err);
                item.enclosure = undefined;
            });
        }

        if (item.pubDate) {
            item.pubDate = timeAgo(new Date(item.pubDate));
        }

        if (item.creator) {
            item.labels = Object.keys(labels).filter(label => item.creator.toUpperCase().includes(label)).map(label => labels[label]);
        }

        if (!item.labels || item.labels.length === 0) {
            item.labels = ['News'];
        }

        const content = item.content || item.contentSnippet || '';
        const $ = cheerio.load(`<div>${content}</div>`);
        item.content = $.text();

        if (!!expand && (!item.content || item.content.length < 20) && (!item.contentSnippet || item.contentSnippet.length < 20)) {
            const fetched = await fetch(item.link);
            const $ = cheerio.load(await fetched.text());
            const content = $('.js_tbl_article').text();
            const reduced = content.replaceAll('...', '').split('.').slice(0, 3).join('. ') + '.';
            item.content = reduced;
        }
        return item;
    }));
    return feed;
};

module.exports = { fetchRSS };