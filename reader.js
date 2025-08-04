const Parser = require('rss-parser');
const cheerio = require('cheerio');

const parser = new Parser({
    customFields: {
        item: [
            ['media:thumbnail', 'enclosure'],
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

const fetchRSS = async (url, expand = false) => {

    const feed = await parser.parseURL(url);

    await Promise.all(feed.items.map(async item => {
        if (item.enclosure && item.enclosure.$) {
            item.enclosure = item.enclosure.$;
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