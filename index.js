const express = require('express')
const path = require("path");
const { fetchRSS } = require('./reader')
const app = express()
const port = 3000

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));

const getSegment = async (url, title, expand = false) => {
  const feed = await fetchRSS(url, expand);
  return { title, items: feed.items.slice(0, 10) };
}

const getPrimary = async (url, expand = false) => {
  const feed = await fetchRSS(url, expand);
  const mainArticle = feed.items[0];
  feed.items = feed.items.slice(1, 17);
  const date = new Date().toLocaleDateString("en-GB");
  return { feed, mainArticle, date };
}

async function renderSegment(res, url, page) {
  const { feed, mainArticle, date } = await getPrimary(url, true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments, page });
}

app.get('/', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', true);
  const mostRead = await getSegment('https://timesofindia.indiatimes.com/rssfeedmostread.cms', 'Most Read Articles');
  const business = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', 'Business');
  const tech = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', 'Technology');
  const world = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', 'World');
  const sports = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', 'Sports');
  const entertainment = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', 'Entertainment');
  const segments = [mostRead, business, tech, world, sports, entertainment];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments, page: 'home' });
})

app.get('/business', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', 'business');
})

app.get('/tech', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', 'tech');
})

app.get('/world', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', 'world');
})

app.get('/sports', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', 'sports');
})

app.get('/entertainment', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', 'entertainment');
})

app.get('/auto', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/74317216.cms', 'auto');
})

app.get('/astrology', async (req, res) => {
  await renderSegment(res, 'https://timesofindia.indiatimes.com/rssfeeds/65857041.cms', 'astrology');
})

app.listen(port, () => {
  console.log(`News app listening on port ${port}`)
})
