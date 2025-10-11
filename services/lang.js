import * as fs from "fs/promises";
import path from "path";

const LANG_DIR = path.join(path.resolve(), "lang"); // Adjust path resolution as needed

/**
 * Loads and processes all language JSON files from the 'lang' directory.
 * @returns {Promise<Object>} An object containing all language translations.
 */
export async function loadLanguages() {
  try {
    const files = await fs.readdir(LANG_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const languagePromises = jsonFiles.map(async (file) => {
      const langCode = file.split(".")[0];
      const filePath = path.join(LANG_DIR, file);
      const content = await fs.readFile(filePath, "utf8");
      return { [langCode]: JSON.parse(content) };
    });

    const languageData = await Promise.all(languagePromises);
    return languageData.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  } catch (error) {
    console.error("Error loading language files:", error);
    return {};
  }
}
