const express = require("express");
const path = require("path");
const fs = require("fs");
const { fetchRSS } = require("./reader");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static(path.join(__dirname, "public")));

const files = fs.readdirSync(__dirname + "/" + "feeds");
const jsonFiles = files.filter((file) => file.endsWith(".json"));
const sources = jsonFiles.map((file) => require(`./feeds/${file}`));
const { getBrightness } = require("./images");

const getSegment = async (url, title, articleLocator, expand = false) => {
  const feed = await fetchRSS(url, articleLocator, expand);
  return { title, items: feed.items.slice(0, 10) };
};

const getPrimary = async (url, articleLocator, expand = false) => {
  const feed = await fetchRSS(url, articleLocator, expand);
  const mainArticle = feed.items[0];
  const count = feed.items.length;
  const optimumCount = count - (count % 6);
  feed.items = feed.items.slice(1, optimumCount + 1);
  const date = new Date().toLocaleDateString("en-GB");
  return { feed, mainArticle, date };
};

app.get("/", async (req, res) => {
  res.render("index", {
    sources: sources.map((source) => ({
      name: source.metadata.name,
      uri: source.metadata.rootURI,
      logo: source.metadata.logo || "",
    })),
  });
});

sources.forEach((source) => {
  const metadata = source.metadata;
  const rssFeeds = source.feeds;
  const articleLocator = metadata.articleLocator || ".js_tbl_article";

  async function renderSegment(res, url, page) {
    const images = [];
    const { feed, mainArticle, date } = await getPrimary(
      url,
      articleLocator,
      true,
    );
    if (mainArticle && mainArticle.enclosure && mainArticle.enclosure.url) {
      images.push(mainArticle.enclosure.url);
      const brightness = await getBrightness(mainArticle.enclosure.url);
      mainArticle.enclosure.brightness = brightness;
    }
    const segments = [];
    const nav = Object.keys(rssFeeds)
      .filter((key) => !!rssFeeds[key].nav)
      .sort((a, b) => (rssFeeds[a].name > rssFeeds[b].name ? 1 : -1));
    if (feed.items && feed.items.length > 0) {
      const _images = feed.items
        .map((item) => item.enclosure && item.enclosure.url)
        .filter(Boolean);
      images.push(..._images);
    }

    res.render("main", {
      feed,
      mainArticle,
      title: metadata.name,
      favicon: metadata.favicon,
      author: metadata.author,
      date,
      segments,
      page,
      rssFeeds,
      nav,
      uri: metadata.rootURI,
      images,
    });
  }

  app.get(`/${metadata.rootURI}`, async (req, res) => {
    const images = [];
    const { feed, mainArticle, date } = await getPrimary(
      rssFeeds.home.url,
      articleLocator,
      true,
    );
    if (mainArticle && mainArticle.enclosure && mainArticle.enclosure.url) {
      images.push(mainArticle.enclosure.url);
      const brightness = await getBrightness(mainArticle.enclosure.url);
      mainArticle.enclosure.brightness = brightness;
    }
    const nav = Object.keys(rssFeeds)
      .filter((key) => !!rssFeeds[key].nav)
      .sort((a, b) => (rssFeeds[a].name > rssFeeds[b].name ? 1 : -1));
    const segments = await Promise.all(
      Object.keys(rssFeeds)
        .filter((key) => !!rssFeeds[key].featured)
        .map(async (key) => {
          return await getSegment(
            rssFeeds[key].url,
            rssFeeds[key].name,
            articleLocator,
          );
        }),
    );

    if (feed.items && feed.items.length > 0) {
      const _images = feed.items
        .map((item) => item.enclosure && item.enclosure.url)
        .filter(Boolean);
      images.push(..._images);
    }

    res.render("main", {
      feed,
      mainArticle,
      title: metadata.name,
      favicon: metadata.favicon,
      author: metadata.author,
      date,
      segments,
      page: "home",
      rssFeeds,
      nav,
      uri: metadata.rootURI,
      images,
    });
  });

  app.get("/location_specific_service", async (req, res) => {
    var fetch_res = await fetch(`https://ipapi.co/${req.ip}/json/`);
    var fetch_data = await fetch_res.json();

    res.send(`You are from ${fetch_data.region}`);
  });

  Object.keys(rssFeeds).forEach((key) => {
    app.get(`/${metadata.rootURI}/${key}`, async (req, res) => {
      await renderSegment(res, rssFeeds[key].url, key);
    });
  });
});

app.listen(port, () => {
  console.log(`News app listening on port ${port}`);
});
