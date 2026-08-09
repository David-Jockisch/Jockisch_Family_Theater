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

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

const PLATFORM_OPTIONS = [
  { value: "ps5", label: "PlayStation 5", igdbNames: ["PlayStation 5"] },
  { value: "ps4", label: "PlayStation 4", igdbNames: ["PlayStation 4"] },
  { value: "ps3", label: "PlayStation 3", igdbNames: ["PlayStation 3"] },
  { value: "ps2", label: "PlayStation 2", igdbNames: ["PlayStation 2"] },
  { value: "ps1", label: "PlayStation", igdbNames: ["PlayStation"] },
  { value: "psp", label: "PlayStation Portable (PSP)", igdbNames: ["PlayStation Portable"] },
  { value: "psvita", label: "PlayStation Vita", igdbNames: ["PlayStation Vita"] },
  { value: "seriesx", label: "Xbox Series X|S", igdbNames: ["Xbox Series X|S"] },
  { value: "xboxone", label: "Xbox One", igdbNames: ["Xbox One"] },
  { value: "xbox360", label: "Xbox 360", igdbNames: ["Xbox 360"] },
  { value: "xbox", label: "Xbox", igdbNames: ["Xbox"] },
  { value: "switch", label: "Nintendo Switch", igdbNames: ["Nintendo Switch"] },
  { value: "wii", label: "Nintendo Wii", igdbNames: ["Wii"] },
  { value: "3ds", label: "Nintendo 3DS", igdbNames: ["Nintendo 3DS"] },
  { value: "ds", label: "Nintendo DS", igdbNames: ["Nintendo DS"] },
  { value: "n64", label: "Nintendo 64", igdbNames: ["Nintendo 64"] },
  { value: "snes", label: "Super Nintendo", igdbNames: ["Super Nintendo Entertainment System"] },
  { value: "nes", label: "Nintendo Entertainment System", igdbNames: ["Nintendo Entertainment System"] },
  { value: "gba", label: "Game Boy Advance", igdbNames: ["Game Boy Advance"] },
  { value: "gbc", label: "Game Boy Color", igdbNames: ["Game Boy Color"] },
  { value: "gameboy", label: "Game Boy", igdbNames: ["Game Boy"] },
  { value: "genesis", label: "Sega Genesis", igdbNames: ["Sega Mega Drive/Genesis"] },
  { value: "intellivision", label: "Mattel Intellivision", igdbNames: ["Intellivision"] }
];

const GAME_CATEGORY_NAMES = {
  0: "Main Game", 1: "DLC / Add-on", 2: "Expansion", 3: "Bundle",
  4: "Standalone Expansion", 5: "Mod", 6: "Episode", 7: "Season",
  8: "Remake", 9: "Remaster", 10: "Expanded Game", 11: "Port",
  12: "Fork", 13: "Pack", 14: "Update"
};

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

async function chooseWishlistType() {
  const selected = await chooseNumber("Wishlist item type", ["Movie", "Game"]);
  if (selected === null) return null;
  return selected === 0 ? "movie" : "game";
}

async function choosePlatform() {
  const selected = await chooseNumber(
    "Platform number",
    PLATFORM_OPTIONS.map(platform => platform.label),
    { allowCancel: true }
  );
  return selected === null ? null : PLATFORM_OPTIONS[selected];
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "").replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function normalizeValue(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function normalizeSearchText(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "").replace(/&/g, " and ").replace(/[^a-zA-Z0-9]+/g, " ")
    .trim().toLowerCase();
}

function releaseYear(date) {
  const match = String(date || "").match(/^(\d{4})/);
  return match ? match[1] : "Unknown";
}

function gameReleaseYear(timestamp) {
  return timestamp ? String(new Date(timestamp * 1000).getUTCFullYear()) : "Unknown";
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
    new RegExp(`\\bexport\\s+default\\s+${arrayName}\\s*;?`), ""
  );
  const context = { module: { exports: {} }, exports: {}, result: null };
  vm.createContext(context);
  vm.runInContext(`${source}\nresult = ${arrayName};`, context, { filename: filePath });
  if (!Array.isArray(context.result)) throw new Error(`${arrayName} was not readable.`);
  return context.result.filter(Boolean);
}

function wishlistMatches(item, mediaType, id, title, platform = "") {
  if ((item.mediaType || "movie") !== mediaType) return false;
  const identityMatches = normalizeValue(item.id) === normalizeValue(id) || normalizeValue(item.title) === normalizeValue(title);
  if (!identityMatches) return false;
  if (mediaType !== "game") return true;
  return !platform || normalizeValue(item.platform) === normalizeValue(platform);
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

// ---------------- TMDb movie wishlist ----------------
async function requestTMDb(endpoint, query = {}) {
  if (!TMDB_ACCESS_TOKEN) throw new Error("TMDB_ACCESS_TOKEN is missing from .env.");
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`, Accept: "application/json" } });
  const data = await response.json();
  if (!response.ok) throw new Error(`TMDb request failed (${response.status}): ${JSON.stringify(data)}`);
  return data;
}

async function searchMovies(title) {
  const data = await requestTMDb("/search/movie", { query: title, include_adult: "false", language: "en-US" });
  return data.results || [];
}

async function getMovieDetails(id) {
  return requestTMDb(`/movie/${Number(id)}`, { language: "en-US" });
}

function getPosterFolder(poster) {
  const prefix = "/assets/posters/movies/";
  const normalized = String(poster || "").replace(/\\/g, "/");
  if (!normalized.startsWith(prefix)) return "";
  const parts = normalized.slice(prefix.length).split("/").filter(Boolean);
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

function findRelatedPosterFolder(allMovies, movie) {
  const collectionName = String(movie.belongs_to_collection?.name || "").replace(/\s+Collection$/i, "").trim();
  if (collectionName) {
    const key = normalizeValue(collectionName);
    const match = allMovies.find(item =>
      normalizeValue(item.collection) === key || normalizeValue(item.franchise) === key || normalizeValue(item.boothGroup) === key
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

function getMoviePosterPath(id, folder = "") {
  const clean = String(folder || "").replace(/^[/\\]+|[/\\]+$/g, "").replace(/\\/g, "/");
  return clean ? `/assets/posters/movies/${clean}/${id}.jpg` : `/assets/posters/movies/${id}.jpg`;
}

async function downloadMoviePoster(tmdbPosterPath, destination) {
  const response = await fetch(`${TMDB_IMAGE_BASE}${tmdbPosterPath}`);
  if (!response.ok) throw new Error(`Poster download failed with status ${response.status}.`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function buildMovieWishlistItem(owned, accessible, wishlist) {
  let searchTitle = "";
  while (!searchTitle) searchTitle = await ask("Movie title: ");
  console.log(`\nSearching TMDb for "${searchTitle}"...`);
  const results = (await searchMovies(searchTitle)).slice(0, 10);
  if (!results.length) return null;
  const selected = await chooseNumber("Select a match", results.map(movie => `${movie.title} (${releaseYear(movie.release_date)})`));
  if (selected === null) return null;
  const movie = await getMovieDetails(results[selected].id);
  if (!movie.poster_path) throw new Error("This TMDb title does not have a poster.");

  const canonicalTitle = movie.title;
  const canonicalId = slugify(canonicalTitle);
  const existing = wishlist.find(item => wishlistMatches(item, "movie", canonicalId, canonicalTitle));
  const existingOwned = owned.find(item => normalizeValue(item.id) === normalizeValue(canonicalId) || normalizeValue(item.title) === normalizeValue(canonicalTitle));
  const existingAccessible = accessible.find(item => normalizeValue(item.id) === normalizeValue(canonicalId) || normalizeValue(item.title) === normalizeValue(canonicalTitle));

  console.log("\n========================================");
  console.log(existing ? "Update Movie Wishlist Item" : "Movie Wishlist Item");
  console.log("========================================");
  console.log(`Title: ${canonicalTitle}`);
  console.log(`Year: ${releaseYear(movie.release_date)}`);
  if (existingOwned) console.log(`Already owned: ${existingOwned.edition || "Yes"} (upgrade wishlist allowed)`);
  if (existingAccessible) console.log(`Accessible now: ${existingAccessible.provider || "Yes"}`);

  const title = await askWithDefault("Title", existing?.title || canonicalTitle);
  const id = await askWithDefault("ID", existing?.id || canonicalId);
  const desiredFormat = await chooseDesiredFormat(existing?.desiredFormat || "4K");
  const year = await askWithDefault("Year", existing?.year || releaseYear(movie.release_date));
  let poster = existing?.poster || existingOwned?.poster || existingAccessible?.poster || "";
  if (!poster) {
    const suggestedFolder = findRelatedPosterFolder([...owned, ...accessible], movie) ||
      (movie.belongs_to_collection ? slugify(String(movie.belongs_to_collection.name).replace(/\s+Collection$/i, "")) : "");
    const folder = await askWithDefault("Poster Folder", suggestedFolder, { allowBlank: true });
    poster = getMoviePosterPath(id, folder);
  } else {
    console.log(`\nShared poster found: ${poster}`);
  }

  return {
    item: { id, mediaType: "movie", title, year, desiredFormat, poster },
    existingId: existing?.id || "",
    remoteImageId: movie.poster_path,
    imageType: "movie"
  };
}

// ---------------- IGDB game wishlist ----------------
function escapeIGDBString(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function platformMatches(platform, result) {
  const names = (result.platforms || []).map(item => item.name);
  return platform.igdbNames.some(expected => names.includes(expected));
}

function getCategoryScore(category) {
  switch (category) {
    case 0: return 300;
    case 8: case 9: case 10: case 11: return 180;
    case 4: return 80;
    case 3: return -100;
    case 2: return -250;
    case 6: case 7: return -350;
    case 1: case 13: case 14: return -600;
    case 5: case 12: return -700;
    default: return 0;
  }
}

function getNamePenalty(gameName) {
  const name = normalizeSearchText(gameName);
  const strong = ["season pass", "year pass", "expansion pass", "dlc", "add on", "soundtrack", "cosmetic pack", "vehicle pack", "skin pack", "map pack", "content pack", "starter pack"];
  const weak = ["season ", "chapter ", "episode ", "pack", "bundle", "upgrade"];
  if (strong.some(term => name.includes(term))) return -500;
  if (weak.some(term => name.includes(term))) return -150;
  return 0;
}

function scoreSearchResult(game, platform, searchTitle) {
  const search = normalizeSearchText(searchTitle);
  const name = normalizeSearchText(game.name);
  let score = 0;
  if (name === search) score += 2000;
  else if (name.startsWith(`${search} `)) score += 800;
  else if (name.includes(search)) score += 350;
  if (platformMatches(platform, game)) score += 500;
  score += getCategoryScore(game.category) + getNamePenalty(game.name);
  if (game.cover?.image_id) score += 25;
  return score;
}

function sortSearchResults(results, platform, title) {
  return [...results].map(game => ({ ...game, searchScore: scoreSearchResult(game, platform, title) }))
    .sort((a, b) => b.searchScore - a.searchScore || (b.first_release_date || 0) - (a.first_release_date || 0));
}

async function getIGDBToken() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) throw new Error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is missing from .env.");
  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");
  const response = await fetch(url, { method: "POST" });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(`Twitch authentication failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function requestIGDB(query, token) {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: { "Client-ID": TWITCH_CLIENT_ID, Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: query
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`IGDB request failed: ${JSON.stringify(data)}`);
  return data;
}

async function searchIGDB(title, token) {
  return requestIGDB(`search "${escapeIGDBString(title)}";\nfields id,name,category,first_release_date,platforms.name,cover.image_id;\nlimit 100;`, token);
}

async function getGameDetails(id, token) {
  const results = await requestIGDB(`fields id,name,category,first_release_date,platforms.name,cover.image_id;\nwhere id = ${Number(id)};\nlimit 1;`, token);
  return results[0] || null;
}

function getGamePosterPath(platform, title) {
  return `/assets/posters/games/${platform.value}/${slugify(title)}.jpg`;
}

async function downloadGameCover(imageId, destination) {
  const url = `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cover download failed with status ${response.status}.`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function buildGameWishlistItem(wishlist) {
  const platform = await choosePlatform();
  if (!platform) return null;
  let title = "";
  while (!title) title = await ask("\nGame title: ");

  console.log("\nAuthenticating with IGDB...");
  const token = await getIGDBToken();
  console.log(`Searching IGDB for "${title}"...`);
  const results = await searchIGDB(title, token);
  if (!results.length) return null;
  const sorted = sortSearchResults(results, platform, title).slice(0, 10);
  const selected = await chooseNumber(
    "Select a match",
    sorted.map(game => `${game.name} (${gameReleaseYear(game.first_release_date)}) | ${GAME_CATEGORY_NAMES[game.category] || "Unknown Type"}`)
  );
  if (selected === null) return null;
  const game = await getGameDetails(sorted[selected].id, token);
  if (!game) throw new Error("IGDB did not return details for the selected game.");
  if (!game.cover?.image_id) throw new Error("This IGDB game does not have cover artwork.");

  const canonicalId = slugify(game.name);
  const existing = wishlist.find(item => wishlistMatches(item, "game", canonicalId, game.name, platform.value));
  const item = {
    id: existing?.id || canonicalId,
    mediaType: "game",
    title: existing?.title || game.name,
    year: existing?.year || gameReleaseYear(game.first_release_date),
    platform: platform.value,
    poster: existing?.poster || getGamePosterPath(platform, game.name)
  };

  console.log("\n========================================");
  console.log(existing ? "Update Game Wishlist Item" : "Game Wishlist Item");
  console.log("========================================");
  console.log(`Title: ${item.title}`);
  console.log(`Year: ${item.year}`);
  console.log(`Platform: ${platform.label}`);
  console.log(`Poster: ${item.poster}`);

  return {
    item,
    existingId: existing?.id || "",
    remoteImageId: game.cover.image_id,
    imageType: "game"
  };
}

// ---------------- shared wishlist writing ----------------
function formatWishlistObject(item) {
  const lines = [
    "  {",
    `    id: ${JSON.stringify(item.id)},`,
    `    mediaType: ${JSON.stringify(item.mediaType)},`,
    `    title: ${JSON.stringify(item.title)},`,
    `    year: ${JSON.stringify(item.year)},`
  ];
  if (item.mediaType === "movie") lines.push(`    desiredFormat: ${JSON.stringify(item.desiredFormat)},`);
  if (item.mediaType === "game") lines.push(`    platform: ${JSON.stringify(item.platform)},`);
  lines.push(`    poster: ${JSON.stringify(item.poster)}`, "  }");
  return lines.join("\n");
}

function findObjectRangeByIdentity(source, id, mediaType) {
  const escaped = JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...source.matchAll(new RegExp(`\\bid\\s*:\\s*${escaped}`, "g"))];
  for (const match of matches) {
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
      if (ch === "}" && --depth === 0) {
        const text = source.slice(start, i + 1);
        const typeMatch = text.match(/\bmediaType\s*:\s*["']([^"']+)["']/);
        const foundType = typeMatch ? typeMatch[1] : "movie";
        if (foundType === mediaType) return { start, end: i + 1 };
        break;
      }
    }
  }
  return null;
}

function updateWishlistSource(source, item, existingId = "") {
  if (existingId) {
    const range = findObjectRangeByIdentity(source, existingId, item.mediaType);
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
  try {
    fs.writeFileSync(temp, updated, "utf8");
    fs.renameSync(temp, WISHLIST_LIBRARY_FILE);
  } catch (error) {
    if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    throw error;
  }
  return backup;
}

function absolutePosterPath(relativePath) {
  return path.join(PROJECT_ROOT, relativePath.replace(/^[/\\]+/, ""));
}

async function main() {
  console.log("\n========================================");
  console.log("Jockisch Family Theater");
  console.log("Wishlist Importer - Version 2.0");
  console.log("========================================\n");

  const type = await chooseWishlistType();
  if (!type) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const wishlist = loadModuleArray(WISHLIST_LIBRARY_FILE, "wishlistLibrary");
  let result;

  if (type === "movie") {
    const owned = loadClassicArray(MOVIE_LIBRARY_FILE, "movieLibrary").filter(item => item.type !== "games-library");
    const accessible = loadModuleArray(ACCESSIBLE_MEDIA_LIBRARY_FILE, "accessibleMediaLibrary").filter(item => item.mediaType === "movie");
    result = await buildMovieWishlistItem(owned, accessible, wishlist);
  } else {
    result = await buildGameWishlistItem(wishlist);
  }

  if (!result) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  console.log("\nFuture Wishlist Entry:\n");
  console.log(formatWishlistObject(result.item));

  const approved = await confirm(result.existingId ? "Update this wishlist item" : `Add this ${result.item.mediaType} to the wishlist`, true);
  if (!approved) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const posterFile = absolutePosterPath(result.item.poster);
  if (fs.existsSync(posterFile)) {
    console.log("\nReusing existing shared artwork.");
  } else if (result.imageType === "movie") {
    console.log("\nDownloading poster to the shared movie poster library...");
    await downloadMoviePoster(result.remoteImageId, posterFile);
  } else {
    console.log("\nDownloading cover to the shared game poster library...");
    await downloadGameCover(result.remoteImageId, posterFile);
  }

  const backup = saveWishlist(result.item, result.existingId);

  console.log("\n========================================");
  console.log(result.existingId ? "Wishlist Updated" : "Wishlist Item Added");
  console.log("========================================");
  console.log(`Type: ${result.item.mediaType === "game" ? "Game" : "Movie"}`);
  console.log(`Title: ${result.item.title}`);
  if (result.item.desiredFormat) console.log(`Desired format: ${result.item.desiredFormat}`);
  if (result.item.platform) {
    const p = PLATFORM_OPTIONS.find(option => option.value === result.item.platform);
    console.log(`Platform: ${p?.label || result.item.platform}`);
  }
  console.log(`Library: ${WISHLIST_LIBRARY_FILE}`);
  console.log(`Artwork: ${posterFile}`);
  console.log(`Backup: ${backup}`);
}

main()
  .catch(error => {
    console.error("\nWishlist importer failed:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
