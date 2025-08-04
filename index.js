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

app.get('/', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', true);
  feed.items = feed.items.slice(1, 17);
  const mostRead = await getSegment('https://timesofindia.indiatimes.com/rssfeedmostread.cms', 'Most Read Articles');
  const business = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', 'Business');
  const tech = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', 'Technology');
  const world = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', 'World');
  const sports = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', 'Sports');
  const entertainment = await getSegment('https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', 'Entertainment');
  const segments = [mostRead, business, tech, world, sports, entertainment];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments });
})

app.get('/business', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments });
})

app.get('/tech', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments });
})

app.get('/world', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments });
})

app.get('/sports', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments });
})

app.get('/entertainment', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary('https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments });
})

app.listen(port, () => {
  console.log(`News app listening on port ${port}`)
})

