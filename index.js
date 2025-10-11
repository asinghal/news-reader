import express from "express";
import path from "path";
import fs from "fs";
import { fetchRSS } from "./reader.js";
import { fileURLToPath } from "url";
import { getBrightness } from "./services/images.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static(path.join(__dirname, "public")));

const FEEDS_DIR = path.join(__dirname, "feeds");

function getJSONFiles(dir) {
  const files = fs.readdirSync(dir);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  return jsonFiles;
}

async function readJSONFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading or parsing file ${filePath}:`, error);
    return null; // Return null for failed files
  }
}

/**
 * Loads and parses all JSON feed source files asynchronously.
 * @returns {Promise<Object[]>} An array of feed source objects.
 */
async function loadJSONFiles(dir) {
  const jsonFiles = getJSONFiles(dir);

  const sourcesPromises = jsonFiles.map(async (file) => {
    const filePath = path.join(dir, file);

    return await readJSONFile(filePath);
  });

  // Wait for all files to be loaded and parsed, filtering out any nulls
  const sources = (await Promise.all(sourcesPromises)).filter(
    (source) => source !== null,
  );

  return sources;
}

const sources = await loadJSONFiles(FEEDS_DIR);
const languagePromises = getJSONFiles(__dirname + "/" + "lang").map(
  async (file) => ({
    [file.split(".")[0]]: await readJSONFile(
      path.join(__dirname, "lang", file),
    ),
  }),
);

const langResults = await Promise.all(languagePromises);
const languages = langResults.reduce((acc, curr) => {
  acc = { ...acc, ...curr };
  return acc;
}, {});

const getSegment = async (
  url,
  title,
  articleLocator,
  language,
  expand = false,
) => {
  const feed = await fetchRSS(url, articleLocator, language, expand);
  return { title, items: feed.items.slice(0, 10) };
};

const getPrimary = async (
  url,
  articleLocator,
  language,
  expand = false,
  imageLocator = null,
) => {
  const feed = await fetchRSS(
    url,
    articleLocator,
    language,
    expand,
    imageLocator,
  );
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
  const imageLocator = metadata.imageLocator;

  async function renderSegment(res, url, page) {
    const images = [];
    const { feed, mainArticle, date } = await getPrimary(
      url,
      articleLocator,
      metadata.language,
      true,
      imageLocator,
    );
    if (mainArticle && mainArticle.enclosure && mainArticle.enclosure.url) {
      images.push(mainArticle.enclosure.url);
      const brightness = await getBrightness(mainArticle.enclosure.url);
      mainArticle.enclosure.brightness = `${brightness.full} header-${brightness.top}`;
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
      translations: languages[metadata.language],
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
      metadata.language,
      true,
      metadata.imageLocator,
    );
    if (mainArticle && mainArticle.enclosure && mainArticle.enclosure.url) {
      images.push(mainArticle.enclosure.url);
      const brightness = await getBrightness(mainArticle.enclosure.url);
      mainArticle.enclosure.brightness = `${brightness.full} header-${brightness.top}`;
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
            metadata.language,
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
      translations: languages[metadata.language],
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
