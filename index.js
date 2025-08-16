const express = require('express')
const path = require("path");
const { fetchRSS } = require('./reader')
const app = express()
const port = 3000

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));

const rssFeeds = {
  home: { name: "Home", url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  business: { name: "Business", url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms' },
  tech: { name: "Technology", url: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms' },
  world: { name: "World", url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
  sports: { name: "Sports", url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms' },
  entertainment: { name: "Entertainment", url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms' },
  auto: { name: "Auto", url: 'https://timesofindia.indiatimes.com/rssfeeds/74317216.cms' },
  astrology: { name: "Astrology", url: 'https://timesofindia.indiatimes.com/rssfeeds/65857041.cms' },
  recent: { name: "Recent", url: 'http://timesofindia.indiatimes.com/rssfeedmostrecent.cms' },
  mostRead: { name: "Most Read", url: 'https://timesofindia.indiatimes.com/rssfeedmostread.cms' },
  india: { name: "India", url: 'http://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms' },
  us: { name: "US", url: "http://timesofindia.indiatimes.com/rssfeeds/30359486.cms" },
  nri: { name: "NRI", url: "http://timesofindia.indiatimes.com/rssfeeds/7098551.cms" },
  cricket: { name: "Cricket", url: "http://timesofindia.indiatimes.com/rssfeeds/54829575.cms" },
  science: { name: "Science", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms" },
  environment: { name: "Environment", url: "http://timesofindia.indiatimes.com/rssfeeds/2647163.cms" },
  education: { name: "Education", url: "http://timesofindia.indiatimes.com/rssfeeds/913168846.cms" },
  life: { name: "Life", url: "http://timesofindia.indiatimes.com/rssfeeds/2886704.cms" },
  mostShared: { name: "Most Shared", url: "http://timesofindia.indiatimes.com/rssfeedmostshared.cms" },
  mostCommented: { name: "Most Commented", url: "http://timesofindia.indiatimes.com/rssfeedmostcommented.cms" },
  pakistan: { name: "Pakistan", url: "http://timesofindia.indiatimes.com/rssfeeds/30359534.cms" },
  southasia: { name: "South Asia", url: "http://timesofindia.indiatimes.com/rssfeeds/3907412.cms" },
  uk: { name: "UK", url: "http://timesofindia.indiatimes.com/rssfeeds/2177298.cms" },
  europe: { name: "Europe", url: "http://timesofindia.indiatimes.com/rssfeeds/1898274.cms" },
  china: { name: "China", url: "http://timesofindia.indiatimes.com/rssfeeds/1898184.cms" },
  middleeast: { name: "Middle East", url: "http://timesofindia.indiatimes.com/rssfeeds/1898272.cms" },
  mumbai: { name: "Mumbai", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms" },
  delhi: { name: "Delhi", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128839596.cms" },
  bangalore: { name: "Bangalore", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms" },
  hyderabad: { name: "Hyderabad", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128816011.cms" },
  chennai: { name: "Chennai", url: "http://timesofindia.indiatimes.com/rssfeeds/2950623.cms" },
  ahemdabad: { name: "Ahemdabad", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128821153.cms" },
  allahabad: { name: "Allahabad", url: "http://timesofindia.indiatimes.com/rssfeeds/3947060.cms" },
  bhubaneswar: { name: "Bhubaneswar", url: "http://timesofindia.indiatimes.com/rssfeeds/4118235.cms" },
  coimbatore: { name: "Coimbatore", url: "http://timesofindia.indiatimes.com/rssfeeds/7503091.cms" },
  gurgaon: { name: "Gurgaon", url: "http://timesofindia.indiatimes.com/rssfeeds/6547154.cms" },
  guwahati: { name: "Guwahati", url: "http://timesofindia.indiatimes.com/rssfeeds/4118215.cms" },
  hubli: { name: "Hubli", url: "http://timesofindia.indiatimes.com/rssfeeds/3942695.cms" },
  kanpur: { name: "Kanpur", url: "http://timesofindia.indiatimes.com/rssfeeds/3947067.cms" },
  kolkata: { name: "Kolkata", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128830821.cms" },
  ludhiana: { name: "Ludhiana", url: "http://timesofindia.indiatimes.com/rssfeeds/3947051.cms" },
  mangalore: { name: "Mangalore", url: "http://timesofindia.indiatimes.com/rssfeeds/3942690.cms" },
  mysore: { name: "Mysore", url: "http://timesofindia.indiatimes.com/rssfeeds/3942693.cms" },
  Noida: { name: "Noida", url: "http://timesofindia.indiatimes.com/rssfeeds/8021716.cms" },
  pune: { name: "Pune", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128821991.cms" },
  goa: { name: "Goa", url: "http://timesofindia.indiatimes.com/rssfeeds/3012535.cms" },
  chandigarh: { name: "Chandigarh", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128816762.cms" },
  lucknow: { name: "Lucknow", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128819658.cms" },
  patna: { name: "Patna", url: "http://timesofindia.indiatimes.com/rssfeeds/-2128817995.cms" },
  jaipur: { name: "Jaipur", url: "http://timesofindia.indiatimes.com/rssfeeds/3012544.cms" },
  nagpur: { name: "Nagpur", url: "http://timesofindia.indiatimes.com/rssfeeds/442002.cms" },
  rajkot: { name: "Rajkot", url: "http://timesofindia.indiatimes.com/rssfeeds/3942663.cms" },
  ranchi: { name: "Ranchi", url: "http://timesofindia.indiatimes.com/rssfeeds/4118245.cms" },
  surat: { name: "Surat", url: "http://timesofindia.indiatimes.com/rssfeeds/3942660.cms" },
  vadodara: { name: "Vadodara", url: "http://timesofindia.indiatimes.com/rssfeeds/3942666.cms" },
  varanasi: { name: "Varanasi", url: "http://timesofindia.indiatimes.com/rssfeeds/3947071.cms" },
  thane: { name: "Thane", url: "http://timesofindia.indiatimes.com/rssfeeds/3831863.cms" },
};

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

async function renderSegment(res, url, page) {
  const { feed, mainArticle, date } = await getPrimary(url, true);
  const segments = [];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments, page, rssFeeds });
}

app.get('/', async (req, res) => {
  const { feed, mainArticle, date } = await getPrimary(rssFeeds.home.url, true);
  const recent = await getSegment(rssFeeds.recent.url, 'Recent Articles');
  const mostRead = await getSegment(rssFeeds.mostRead.url, 'Most Read Articles');
  const business = await getSegment(rssFeeds.business.url, 'Business');
  const tech = await getSegment(rssFeeds.tech.url, 'Technology');
  const world = await getSegment(rssFeeds.world.url, 'World');
  const sports = await getSegment(rssFeeds.sports.url, 'Sports');
  const entertainment = await getSegment(rssFeeds.entertainment.url, 'Entertainment');
  const segments = [mostRead, business, tech, world, sports, entertainment, recent];
  res.render('index', { feed, mainArticle, title: 'The Times of India', date, segments, page: 'home', rssFeeds });
})

Object.keys(rssFeeds).forEach(key => {
  app.get(`/${key}`, async (req, res) => {
    await renderSegment(res, rssFeeds[key].url, key);
  });
});

app.listen(port, () => {
  console.log(`News app listening on port ${port}`)
})
