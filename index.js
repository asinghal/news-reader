const express = require('express')
const path = require("path");
const { fetchRSS } = require('./reader')
const app = express()
const port = 3000

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));


const toiRSSFeeds = require('./toi.json');
const hinduRSSFeeds = require('./hindu.json');
const htRSSFeeds = require('./ht.json');

const sources = [toiRSSFeeds, hinduRSSFeeds, htRSSFeeds];

const getSegment = async (url, title, expand = false) => {
  const feed = await fetchRSS(url, expand);
  return { title, items: feed.items.slice(0, 10) };
}

const getPrimary = async (url, expand = false) => {
  const feed = await fetchRSS(url, expand);
  const mainArticle = feed.items[0];
  feed.items = feed.items.slice(1, 37);
  const date = new Date().toLocaleDateString("en-GB");
  return { feed, mainArticle, date };
}

app.get('/', async (req, res) => {
  res.render('index', {
    sources: sources.map(source => ({
      name: source.metadata.name,
      uri: source.metadata.rootURI,
      logo: source.metadata.logo || '',
    }))
  });
});

sources.forEach(source => {
  const metadata = source.metadata;
  const rssFeeds = source.feeds;

  async function renderSegment(res, url, page) {
    const { feed, mainArticle, date } = await getPrimary(url, true);
    const segments = [];
    const nav = Object.keys(rssFeeds).filter(key => !!rssFeeds[key].nav).sort((a, b) => rssFeeds[a].name > rssFeeds[b].name ? 1 : -1);
    res.render('main', { feed, mainArticle, title: metadata.name, author: metadata.author, date, segments, page, rssFeeds, nav, uri: metadata.rootURI });
  }

  app.get(`/${metadata.rootURI}`, async (req, res) => {
    const { feed, mainArticle, date } = await getPrimary(rssFeeds.home.url, true);
    const nav = Object.keys(rssFeeds).filter(key => !!rssFeeds[key].nav).sort((a, b) => rssFeeds[a].name > rssFeeds[b].name ? 1 : -1);
    const segments = await Promise.all(Object.keys(rssFeeds).filter(key => !!rssFeeds[key].featured).map(async key => {
      return await getSegment(rssFeeds[key].url, rssFeeds[key].name);
    }));
    res.render('main', { feed, mainArticle, title: metadata.name, author: metadata.author, date, segments, page: 'home', rssFeeds, nav, uri: metadata.rootURI });
  })

  app.get('/location_specific_service', async (req, res) => {
    console.log(req.ip)
    var fetch_res = await fetch(`https://ipapi.co/${req.ip}/json/`);
    var fetch_data = await fetch_res.json()

    res.send(`You are from ${fetch_data.region}`)
  })

  Object.keys(rssFeeds).forEach(key => {
    app.get(`/${metadata.rootURI}/${key}`, async (req, res) => {
      await renderSegment(res, rssFeeds[key].url, key);
    });
  });

});

app.listen(port, () => {
  console.log(`News app listening on port ${port}`)
})
