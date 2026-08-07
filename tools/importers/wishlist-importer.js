const fs = require("fs");
const path = require("path");
const readline = require("readline");
const vm = require("vm");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const MOVIE_LIBRARY_FILE = path.join(PROJECT_ROOT, "library", "movies", "movie-library.js");
const ACCESSIBLE_MEDIA_LIBRARY_FILE = path.join(PROJECT_ROOT, "library", "accessible-media", "accessible-media-library.js");
const WISHLIST_LIBRARY_FILE = path.join(PROJECT_ROOT, "library", "wishlist", "wishlist-library.js");
const BACKUP_DIRECTORY = path.join(PROJECT_ROOT, "backups", "wishlist-imports");

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function confirm(question, defaultYes = false) {
  const suffix = defaultYes ? "Y/n" : "y/N";
  while (true) {
    const answer = (await ask(`${question} (${suffix}): `)).toLowerCase();
    if (!answer) return defaultYes;
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no"].includes(answer)) return false;
    console.log('Please enter "y" or "n".');
  }
}

async function chooseNumber(prompt, options, { allowCancel = true } = {}) {
  console.log("");
  options.forEach((option, index) => console.log(`${index + 1}) ${option}`));
  if (allowCancel) console.log("0) Cancel");

  while (true) {
    const answer = await ask(`\n${prompt}: `);
    if (allowCancel && answer === "0") return null;
    const selected = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(selected) && selected >= 0 && selected < options.length) return selected;
    console.log("Please enter one of the listed numbers.");
  }
}

async function askWithDefault(label, defaultValue, { allowBlank = false } = {}) {
  const display = defaultValue || (allowBlank ? "blank" : "");
  while (true) {
    const answer = await ask(`${label} [${display}]: `);
    if (answer === "-" && allowBlank) return "";
    if (answer) return answer;
    if (defaultValue || allowBlank) return defaultValue || "";
    console.log("Please enter a value.");
  }
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function releaseYear(date) {
  const match = String(date || "").match(/^(\d{4})/);
  return match ? match[1] : "Unknown";
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`${label} does not exist:\n${filePath}`);
}

function loadClassicArray(filePath, arrayName) {
  ensureFile(filePath, arrayName);
  const source = fs.readFileSync(filePath, "utf8");
  const context = { module: { exports: {} }, exports: {}, result: null };
  vm.createContext(context);
  vm.runInContext(`${source}\nresult = ${arrayName};`, context, { filename: filePath });
  if (!Array.isArray(context.result)) throw new Error(`${arrayName} was not readable.`);
  return context.result.filter(Boolean);
}

function loadModuleArray(filePath, arrayName) {
  ensureFile(filePath, arrayName);
  const source = fs.readFileSync(filePath, "utf8").replace(
    new RegExp(`\\bexport\\s+default\\s+${arrayName}\\s*;?`),
    ""
  );
  const context = { module: { exports: {} }, exports: {}, result: null };
  vm.createContext(context);
  vm.runInContext(`${source}\nresult = ${arrayName};`, context, { filename: filePath });
  if (!Array.isArray(context.result)) throw new Error(`${arrayName} was not readable.`);
  return context.result.filter(Boolean);
}

async function requestTMDb(endpoint, query = {}) {
  if (!TMDB_ACCESS_TOKEN) throw new Error("TMDB_ACCESS_TOKEN is missing from .env.");
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`, Accept: "application/json" }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`TMDb request failed (${response.status}): ${JSON.stringify(data)}`);
  return data;
}

async function searchMovies(title) {
  const data = await requestTMDb("/search/movie", {
    query: title,
    include_adult: "false",
    language: "en-US"
  });
  return data.results || [];
}

async function getMovieDetails(id) {
  return requestTMDb(`/movie/${Number(id)}`, { language: "en-US" });
}

function printSearchResults(results) {
  console.log("\nTMDb matches:\n");
  results.forEach((movie, index) => {
    console.log(`${index + 1}) ${movie.title} (${releaseYear(movie.release_date)})`);
    if (movie.overview) {
      const overview = movie.overview.length > 135 ? `${movie.overview.slice(0, 132)}...` : movie.overview;
      console.log(`   ${overview}`);
    }
  });
}

async function chooseDesiredFormat(current = "") {
  const formats = ["4K Blu Ray", "Blu Ray", "DVD", "Digital", "Any Physical Edition"];
  console.log("\nDesired format:");
  formats.forEach((format, index) => {
    const marker = normalizeValue(format) === normalizeValue(current) ? " (current)" : "";
    console.log(`${index + 1}) ${format}${marker}`);
  });
  console.log(`${formats.length + 1}) Custom`);

  while (true) {
    const answer = await ask("\nFormat number: ");
    const selected = Number.parseInt(answer, 10) - 1;
    if (selected >= 0 && selected < formats.length) return formats[selected];
    if (selected === formats.length) return askWithDefault("Custom format", current || "4K");
    console.log("Please enter one of the listed format numbers.");
  }
}

function movieMatches(item, id, title) {
  return normalizeValue(item.id) === normalizeValue(id) || normalizeValue(item.title) === normalizeValue(title);
}

function getPosterFolder(poster) {
  const prefix = "/assets/posters/movies/";
  const normalized = String(poster || "").replace(/\\/g, "/");
  if (!normalized.startsWith(prefix)) return "";
  const parts = normalized.slice(prefix.length).split("/").filter(Boolean);
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

function findRelatedPosterFolder(allMovies, movie) {
  const collectionName = String(movie.belongs_to_collection?.name || "")
    .replace(/\s+Collection$/i, "")
    .trim();

  if (collectionName) {
    const collectionKey = normalizeValue(collectionName);
    const match = allMovies.find(item =>
      normalizeValue(item.collection) === collectionKey ||
      normalizeValue(item.franchise) === collectionKey ||
      normalizeValue(item.boothGroup) === collectionKey
    );
    const folder = getPosterFolder(match?.poster);
    if (folder) return folder;
  }

  const words = normalizeValue(movie.title).split(/\s+/).filter(word => word.length >= 4);
  const match = allMovies.find(item => {
    const haystack = normalizeValue(`${item.title} ${item.collection || ""} ${item.franchise || ""}`);
    return words.some(word => haystack.includes(word));
  });
  return getPosterFolder(match?.poster);
}

function getPosterPath(id, folder = "") {
  const cleanFolder = String(folder || "").replace(/^[/\\]+|[/\\]+$/g, "").replace(/\\/g, "/");
  return cleanFolder
    ? `/assets/posters/movies/${cleanFolder}/${id}.jpg`
    : `/assets/posters/movies/${id}.jpg`;
}

function posterFilePath(relativePath) {
  return path.join(PROJECT_ROOT, relativePath.replace(/^[/\\]+/, ""));
}

async function downloadPoster(tmdbPosterPath, destination) {
  const response = await fetch(`${TMDB_IMAGE_BASE}${tmdbPosterPath}`);
  if (!response.ok) throw new Error(`Poster download failed with status ${response.status}.`);
  const image = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, image);
}

function formatWishlistObject(item) {
  return [
    "  {",
    `    id: ${JSON.stringify(item.id)},`,
    `    title: ${JSON.stringify(item.title)},`,
    `    year: ${JSON.stringify(item.year)},`,
    `    desiredFormat: ${JSON.stringify(item.desiredFormat)},`,
    `    poster: ${JSON.stringify(item.poster)}`,
    "  }"
  ].join("\n");
}

function findObjectRangeById(source, id) {
  const escaped = JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\bid\\s*:\\s*${escaped}`).exec(source);
  if (!match) return null;
  let start = source.lastIndexOf("{", match.index);
  let depth = 0, quote = null, escapedChar = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escapedChar) escapedChar = false;
      else if (ch === "\\") escapedChar = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (["\"", "'", "`"].includes(ch)) { quote = ch; continue; }
    if (ch === "{") depth += 1;
    if (ch === "}" && --depth === 0) return { start, end: i + 1 };
  }
  return null;
}

function updateWishlistSource(source, item, existingId = "") {
  if (existingId) {
    const range = findObjectRangeById(source, existingId);
    if (!range) throw new Error(`Could not find wishlist entry "${existingId}".`);
    return source.slice(0, range.start) + formatWishlistObject(item) + source.slice(range.end);
  }

  const pattern = /\n\];\s*\n\s*export\s+default\s+wishlistLibrary\s*;?\s*$/;
  const match = source.match(pattern);
  if (!match || match.index === undefined) throw new Error("Could not find the end of wishlistLibrary.");
  const before = source.slice(0, match.index).replace(/\s+$/, "").replace(/,\s*$/, "");
  const after = source.slice(match.index);
  const comma = /\[\s*$/.test(before) ? "" : ",";
  return `${before}${comma}\n\n${formatWishlistObject(item)}\n${after}`;
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function saveWishlist(item, existingId = "") {
  const source = fs.readFileSync(WISHLIST_LIBRARY_FILE, "utf8");
  const updated = updateWishlistSource(source, item, existingId);
  fs.mkdirSync(BACKUP_DIRECTORY, { recursive: true });
  const backup = path.join(BACKUP_DIRECTORY, `wishlist-library-${timestamp()}.js`);
  fs.copyFileSync(WISHLIST_LIBRARY_FILE, backup);
  const temp = `${WISHLIST_LIBRARY_FILE}.tmp`;
  fs.writeFileSync(temp, updated, "utf8");
  fs.renameSync(temp, WISHLIST_LIBRARY_FILE);
  return backup;
}

async function main() {
  console.log("\n========================================");
  console.log("Jockisch Family Theater");
  console.log("Wishlist Importer - Version 1.0");
  console.log("========================================\n");

  const owned = loadClassicArray(MOVIE_LIBRARY_FILE, "movieLibrary")
    .filter(item => item.type !== "games-library");
  const accessible = loadModuleArray(ACCESSIBLE_MEDIA_LIBRARY_FILE, "accessibleMediaLibrary")
    .filter(item => item.mediaType === "movie");
  const wishlist = loadModuleArray(WISHLIST_LIBRARY_FILE, "wishlistLibrary");

  let searchTitle = "";
  while (!searchTitle) searchTitle = await ask("Movie title: ");

  console.log(`\nSearching TMDb for "${searchTitle}"...`);
  const results = (await searchMovies(searchTitle)).slice(0, 10);
  if (!results.length) {
    console.log("\nNo TMDb matches were found.");
    return;
  }

  printSearchResults(results);
  const selectedIndex = await chooseNumber("Select a match", results.map(movie => `${movie.title} (${releaseYear(movie.release_date)})`));
  if (selectedIndex === null) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const movie = await getMovieDetails(results[selectedIndex].id);
  if (!movie.poster_path) throw new Error("This TMDb title does not have a poster.");

  const canonicalTitle = movie.title;
  const canonicalId = slugify(canonicalTitle);
  const existingWishlist = wishlist.find(item => movieMatches(item, canonicalId, canonicalTitle));
  const existingOwned = owned.find(item => movieMatches(item, canonicalId, canonicalTitle));
  const existingAccessible = accessible.find(item => movieMatches(item, canonicalId, canonicalTitle));

  console.log("\n========================================");
  console.log(existingWishlist ? "Update Wishlist Item" : "Wishlist Item");
  console.log("========================================");
  console.log(`Title: ${canonicalTitle}`);
  console.log(`Year: ${releaseYear(movie.release_date)}`);
  if (existingOwned) console.log(`Already owned: ${existingOwned.edition || "Yes"} (upgrade wishlist allowed)`);
  if (existingAccessible) console.log(`Accessible now: ${existingAccessible.provider || "Yes"}`);

  const title = await askWithDefault("Title", existingWishlist?.title || canonicalTitle);
  const id = await askWithDefault("ID", existingWishlist?.id || canonicalId);
  const desiredFormat = await chooseDesiredFormat(existingWishlist?.desiredFormat || "4K");
  const year = await askWithDefault("Year", existingWishlist?.year || releaseYear(movie.release_date));

  // Prefer an exact poster already used anywhere else in JFT.
  const reusedPoster = existingWishlist?.poster || existingOwned?.poster || existingAccessible?.poster || "";
  let poster = reusedPoster;

  if (poster) {
    console.log(`\nShared poster found: ${poster}`);
    console.log("The wishlist will reuse this artwork.");
  } else {
    const suggestedFolder = findRelatedPosterFolder([...owned, ...accessible], movie) ||
      (movie.belongs_to_collection ? slugify(String(movie.belongs_to_collection.name).replace(/\s+Collection$/i, "")) : "");
    const posterFolder = await askWithDefault("Poster Folder", suggestedFolder, { allowBlank: true });
    poster = getPosterPath(id, posterFolder);
  }

  const item = { id, title, year, desiredFormat, poster };
  console.log("\nFuture Wishlist Entry:\n");
  console.log(formatWishlistObject(item));
  console.log(`\nPoster: ${poster}`);

  const approved = await confirm(existingWishlist ? "Update this wishlist item" : "Add this movie to the wishlist", true);
  if (!approved) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const posterFile = posterFilePath(poster);
  if (fs.existsSync(posterFile)) {
    console.log("\nReusing existing shared poster artwork.");
  } else {
    console.log("\nDownloading poster to the shared movie poster library...");
    await downloadPoster(movie.poster_path, posterFile);
    console.log("Poster downloaded successfully.");
  }

  const backup = saveWishlist(item, existingWishlist?.id || "");

  console.log("\n========================================");
  console.log(existingWishlist ? "Wishlist Updated" : "Wishlist Item Added");
  console.log("========================================");
  console.log(`Title: ${item.title}`);
  console.log(`Desired format: ${item.desiredFormat}`);
  console.log(`Library: ${WISHLIST_LIBRARY_FILE}`);
  console.log(`Poster: ${posterFile}`);
  console.log(`Backup: ${backup}`);
}

main()
  .catch(error => {
    console.error("\nWishlist importer failed:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
