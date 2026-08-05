const fs = require("fs");
const path = require("path");
const readline = require("readline");
const vm = require("vm");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const MOVIE_LIBRARY_FILE = path.join(PROJECT_ROOT, "library", "movies", "movie-library.js");
const ACCESSIBLE_LIBRARY_FILE = path.join(PROJECT_ROOT, "library", "accessible-media", "accessible-media-library.js");
const MOVIE_BACKUP_DIR = path.join(PROJECT_ROOT, "backups", "movie-imports");
const ACCESSIBLE_BACKUP_DIR = path.join(PROJECT_ROOT, "backups", "accessible-media-imports");

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function askWithDefault(label, defaultValue, { allowBlank = false } = {}) {
  const shown = defaultValue || (allowBlank ? "blank" : "");
  while (true) {
    const answer = await ask(`${label} [${shown}]: `);
    if (answer === "-") {
      if (allowBlank) return "";
      console.log("This field cannot be blank.");
      continue;
    }
    if (answer) return answer;
    if (defaultValue || allowBlank) return defaultValue || "";
    console.log("Please enter a value.");
  }
}

async function confirm(question) {
  while (true) {
    const answer = (await ask(`${question} (y/n): `)).toLowerCase();
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no"].includes(answer)) return false;
    console.log('Please enter "y" or "n".');
  }
}

async function choose(prompt, options, allowCancel = true) {
  console.log("");
  options.forEach((option, index) => console.log(`${index + 1}) ${option}`));
  if (allowCancel) console.log("0) Cancel");

  while (true) {
    const answer = await ask(`\n${prompt}: `);
    if (allowCancel && answer === "0") return null;
    const index = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(index) && index >= 0 && index < options.length) return index;
    console.log("Please enter one of the listed numbers.");
  }
}

async function chooseDestination() {
  const index = await choose("Destination number", [
    "Owned Movie",
    "Accessible Movie",
    "Accessible TV Show"
  ]);
  if (index === null) return null;
  return ["owned-movie", "accessible-movie", "accessible-show"][index];
}

async function chooseEdition() {
  const editions = ["4K", "Blu Ray", "DVD", "Digital", "Custom"];
  const index = await choose("Edition number", editions, false);
  if (editions[index] === "Custom") return askWithDefault("Custom edition", "");
  const extra = await ask("Additional edition wording, or press Enter for none: ");
  return extra ? `${editions[index]} ${extra}` : editions[index];
}

async function chooseProvider() {
  const providers = [
    "Disney+", "Netflix", "Prime Video", "Hulu", "Max", "Peacock",
    "Paramount+", "Apple TV+", "Upcoming", "Other"
  ];
  const index = await choose("Provider number", providers, false);
  if (providers[index] !== "Other") return providers[index];
  return askWithDefault("Custom provider", "");
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
    .replace(/[’]/g, "'")
    .trim()
    .toLowerCase();
}

function cleanCollectionName(value, fallbackTitle) {
  const cleaned = String(value || "").replace(/\s+Collection$/i, "").trim();
  return cleaned || fallbackTitle;
}

function formatRuntime(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return "Unknown";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}min`;
  if (!mins) return `${hours}hr`;
  return `${hours}hr ${mins}min`;
}

function getReleaseYear(date) {
  const match = String(date || "").match(/^(\d{4})/);
  return match ? match[1] : "Unknown";
}

function getUsRating(movie) {
  const us = (movie.release_dates?.results || []).find(item => item.iso_3166_1 === "US");
  return (us?.release_dates || [])
    .map(item => String(item.certification || "").trim())
    .find(Boolean) || "Unknown";
}

function getMostCommon(values) {
  const counts = new Map();
  values.filter(value => value !== undefined).forEach(value => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0];
}

function getPosterFolderFromPath(posterPath, mediaType = "movie") {
  const normalized = String(posterPath || "").replace(/\\/g, "/");
  const prefix = mediaType === "series" ? "/assets/posters/shows/" : "/assets/posters/movies/";
  if (!normalized.startsWith(prefix)) return "";
  const parts = normalized.slice(prefix.length).split("/").filter(Boolean);
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

function getPosterRelativePath(mediaType, folder, id) {
  const cleanFolder = String(folder || "")
    .replace(/^[/\\]+|[/\\]+$/g, "")
    .replace(/\\/g, "/");
  const base = mediaType === "series" ? "/assets/posters/shows" : "/assets/posters/movies";
  return cleanFolder ? `${base}/${cleanFolder}/${id}.jpg` : `${base}/${id}.jpg`;
}

function getPosterFilePath(relativePath) {
  return path.join(PROJECT_ROOT, relativePath.replace(/^[/\\]+/, ""));
}

function timestamp() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`${label} does not exist:\n${filePath}`);
}

function loadMovieLibrary() {
  ensureFile(MOVIE_LIBRARY_FILE, "Movie library");
  const source = fs.readFileSync(MOVIE_LIBRARY_FILE, "utf8");
  const context = { module: { exports: {} }, exports: {}, result: null };
  vm.createContext(context);
  vm.runInContext(`${source}\nresult = movieLibrary;`, context, { filename: MOVIE_LIBRARY_FILE });
  if (!Array.isArray(context.result)) throw new Error("movie-library.js did not contain a readable movieLibrary array.");
  return context.result.filter(movie => movie && movie.type !== "games-library");
}

function loadAccessibleLibrary() {
  ensureFile(ACCESSIBLE_LIBRARY_FILE, "Accessible media library");
  const source = fs.readFileSync(ACCESSIBLE_LIBRARY_FILE, "utf8")
    .replace(/\bexport\s+default\s+accessibleMediaLibrary\s*;?/, "");
  const context = { module: { exports: {} }, exports: {}, result: null };
  vm.createContext(context);
  vm.runInContext(`${source}\nresult = accessibleMediaLibrary;`, context, { filename: ACCESSIBLE_LIBRARY_FILE });
  if (!Array.isArray(context.result)) throw new Error("accessible-media-library.js did not contain a readable array.");
  return context.result.filter(Boolean);
}

function findRelatedMovies(library, collection, title) {
  const normalizedCollection = normalizeValue(collection);
  const sameCollection = library.filter(movie => normalizeValue(movie.collection) === normalizedCollection);
  if (sameCollection.length) return sameCollection;
  const words = normalizeValue(title).split(/\s+/).filter(word => word.length >= 4);
  return library.filter(movie => {
    const text = normalizeValue(`${movie.title} ${movie.collection} ${movie.franchise} ${movie.boothGroup}`);
    return words.some(word => text.includes(word));
  });
}

function buildSuggestions(library, movie) {
  const tmdbCollection = cleanCollectionName(movie.belongs_to_collection?.name, movie.title);
  const related = findRelatedMovies(library, tmdbCollection, movie.title);
  const collection = getMostCommon(related.map(item => item.collection)) || tmdbCollection || movie.title;
  const collectionMatches = library.filter(item => normalizeValue(item.collection) === normalizeValue(collection));
  const pool = collectionMatches.length ? collectionMatches : related;
  const franchise = getMostCommon(pool.map(item => item.franchise).filter(Boolean)) || (movie.belongs_to_collection ? collection : "");
  const boothGroup = getMostCommon(pool.map(item => item.boothGroup).filter(Boolean)) || franchise || collection;
  const posterFolder = getMostCommon(pool.map(item => getPosterFolderFromPath(item.poster, "movie"))) || (movie.belongs_to_collection ? slugify(collection) : "");
  return { collection, franchise, boothGroup, posterFolder, relatedCount: pool.length };
}

function findDuplicate(owned, accessible, item) {
  const all = [
    ...owned.map(entry => ({ ...entry, source: "Owned Movie Library" })),
    ...accessible.map(entry => ({ ...entry, source: "Accessible Media Library" }))
  ];
  return all.find(entry =>
    normalizeValue(entry.id) === normalizeValue(item.id) ||
    (normalizeValue(entry.title) === normalizeValue(item.title) &&
      normalizeValue(entry.mediaType || "movie") === normalizeValue(item.mediaType || "movie"))
  );
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

async function searchTMDb(title, mediaType) {
  const endpoint = mediaType === "series" ? "/search/tv" : "/search/movie";
  const data = await requestTMDb(endpoint, { query: title, include_adult: "false", language: "en-US" });
  return data.results || [];
}

async function getDetails(id, mediaType) {
  if (mediaType === "series") return requestTMDb(`/tv/${Number(id)}`, { language: "en-US" });
  return requestTMDb(`/movie/${Number(id)}`, { append_to_response: "release_dates", language: "en-US" });
}

function printSearchResults(results, mediaType) {
  console.log("\nTMDb matches:\n");
  results.forEach((item, index) => {
    const title = mediaType === "series" ? item.name : item.title;
    const original = mediaType === "series" ? item.original_name : item.original_title;
    const date = mediaType === "series" ? item.first_air_date : item.release_date;
    const originalText = original && original !== title ? ` | Original: ${original}` : "";
    console.log(`${index + 1}) ${title} (${getReleaseYear(date)})${originalText}`);
    if (item.overview) console.log(`   ${item.overview.length > 140 ? `${item.overview.slice(0, 137)}...` : item.overview}`);
  });
}

async function chooseSearchResult(results) {
  while (true) {
    const answer = await ask("\nSelect a match number, or enter 0 to cancel: ");
    if (answer === "0") return null;
    const index = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(index) && index >= 0 && index < results.length) return results[index];
    console.log("Please enter one of the listed match numbers.");
  }
}

function printSelected(media, mediaType) {
  const title = mediaType === "series" ? media.name : media.title;
  const date = mediaType === "series" ? media.first_air_date : media.release_date;
  console.log("\n========================================");
  console.log(mediaType === "series" ? "Selected TV Show" : "Selected Movie");
  console.log("========================================");
  console.log(`Title: ${title}`);
  console.log(`TMDb ID: ${media.id}`);
  console.log(`Release: ${getReleaseYear(date)}`);
  if (mediaType === "movie") {
    console.log(`Rating: ${getUsRating(media)}`);
    console.log(`Runtime: ${formatRuntime(media.runtime)}`);
    console.log(`TMDb collection: ${media.belongs_to_collection?.name || "None"}`);
  } else {
    console.log(`Seasons: ${media.number_of_seasons || "Unknown"}`);
    console.log(`Episodes: ${media.number_of_episodes || "Unknown"}`);
  }
  console.log(`Poster available: ${media.poster_path ? "Yes" : "No"}`);
  if (media.overview) console.log(`\nOverview:\n${media.overview}`);
}

function formatOwnedMovie(item) {
  return [
    "  {",
    `    id: ${JSON.stringify(item.id)},`,
    `    collection: ${JSON.stringify(item.collection)},`,
    `    franchise: ${JSON.stringify(item.franchise)},`,
    `    boothGroup: ${JSON.stringify(item.boothGroup)},`,
    `    title: ${JSON.stringify(item.title)},`,
    `    edition: ${JSON.stringify(item.edition)},`,
    `    year: ${JSON.stringify(item.year)},`,
    `    rating: ${JSON.stringify(item.rating)},`,
    `    runtime: ${JSON.stringify(item.runtime)},`,
    `    poster: ${JSON.stringify(item.poster)}`,
    "  }"
  ].join("\n");
}

function formatAccessible(item) {
  const lines = [
    "  {",
    `    id: ${JSON.stringify(item.id)},`,
    `    mediaType: ${JSON.stringify(item.mediaType)},`,
    `    title: ${JSON.stringify(item.title)},`,
    `    year: ${JSON.stringify(item.year)},`,
    `    provider: ${JSON.stringify(item.provider)},`
  ];
  if (item.mediaType === "series") lines.push(`    seasons: ${JSON.stringify(item.seasons)},`);
  lines.push(`    poster: ${JSON.stringify(item.poster)}`, "  }");
  return lines.join("\n");
}

async function downloadPoster(posterPath, destination) {
  const response = await fetch(`${TMDB_IMAGE_BASE}${posterPath}`);
  if (!response.ok) throw new Error(`Poster download failed with status ${response.status}.`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

function backupFile(source, directory, prefix) {
  fs.mkdirSync(directory, { recursive: true });
  const backup = path.join(directory, `${prefix}-${timestamp()}.js`);
  fs.copyFileSync(source, backup);
  return backup;
}

function writeAtomically(filePath, contents) {
  const temp = `${filePath}.tmp`;
  try {
    fs.writeFileSync(temp, contents, "utf8");
    fs.renameSync(temp, filePath);
  } catch (error) {
    if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    throw error;
  }
}

function getSectionMatches(source) {
  const pattern = /^  \/\/ ={50}\r?\n  \/\/ (.+)\r?\n  \/\/ ={50}$/gm;
  return [...source.matchAll(pattern)].map(match => ({ label: match[1].trim(), index: match.index }));
}

function addOwnedMovie(source, item) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = source.replace(/\r\n/g, "\n");
  const sections = getSectionMatches(normalized);
  const existingIndex = sections.findIndex(section => normalizeValue(section.label) === normalizeValue(item.collection));
  let updated;

  if (existingIndex >= 0) {
    const next = sections[existingIndex + 1];
    if (!next) throw new Error(`Could not find the section after "${sections[existingIndex].label}".`);
    const before = normalized.slice(0, next.index).replace(/\s+$/, "").replace(/,\s*$/, "");
    updated = `${before},\n\n${formatOwnedMovie(item)},\n\n${normalized.slice(next.index)}`;
  } else {
    const games = sections.find(section => normalizeValue(section.label) === "games");
    if (!games) throw new Error('Could not find the special "Games" section in movie-library.js.');
    const later = sections.find(section => normalizeValue(section.label) !== "games" && section.label.localeCompare(item.collection, undefined, { sensitivity: "base", numeric: true }) > 0);
    const index = later ? later.index : games.index;
    const before = normalized.slice(0, index).replace(/\s+$/, "").replace(/,\s*$/, "");
    const block = [
      "  // ==================================================",
      `  // ${item.collection}`,
      "  // ==================================================",
      "",
      formatOwnedMovie(item)
    ].join("\n");
    updated = `${before},\n\n${block},\n\n${normalized.slice(index)}`;
  }

  return updated.replace(/\n/g, eol);
}

function addAccessibleMedia(source, item) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = source.replace(/\r\n/g, "\n");
  const pattern = /\n\];\s*\n\s*export\s+default\s+accessibleMediaLibrary\s*;?\s*$/;
  const match = normalized.match(pattern);
  if (!match || match.index === undefined) throw new Error("Could not find the end of accessibleMediaLibrary.");
  const before = normalized.slice(0, match.index).replace(/\s+$/, "").replace(/,\s*$/, "");
  const updated = `${before},\n\n${formatAccessible(item)}\n${normalized.slice(match.index)}`;
  return updated.replace(/\n/g, eol);
}

function saveOwnedMovie(item) {
  const source = fs.readFileSync(MOVIE_LIBRARY_FILE, "utf8");
  const backup = backupFile(MOVIE_LIBRARY_FILE, MOVIE_BACKUP_DIR, "movie-library");
  writeAtomically(MOVIE_LIBRARY_FILE, addOwnedMovie(source, item));
  return { libraryPath: MOVIE_LIBRARY_FILE, backupPath: backup };
}

function saveAccessible(item) {
  const source = fs.readFileSync(ACCESSIBLE_LIBRARY_FILE, "utf8");
  const backup = backupFile(ACCESSIBLE_LIBRARY_FILE, ACCESSIBLE_BACKUP_DIR, "accessible-media-library");
  writeAtomically(ACCESSIBLE_LIBRARY_FILE, addAccessibleMedia(source, item));
  return { libraryPath: ACCESSIBLE_LIBRARY_FILE, backupPath: backup };
}

async function buildOwnedMovie(movie, library) {
  const suggestions = buildSuggestions(library, movie);
  console.log("\nPress Enter to accept a suggestion. Enter \"-\" to leave an optional field blank.\n");
  const title = await askWithDefault("Title", movie.title);
  const id = await askWithDefault("ID", slugify(title));
  const collection = await askWithDefault("Collection", suggestions.collection || title);
  const franchise = await askWithDefault("Franchise", suggestions.franchise, { allowBlank: true });
  const boothGroup = await askWithDefault("Booth Group", suggestions.boothGroup || franchise || collection);
  const posterFolder = await askWithDefault("Poster Folder", suggestions.posterFolder, { allowBlank: true });
  const edition = await chooseEdition();
  const year = await askWithDefault("Year", getReleaseYear(movie.release_date));
  const rating = await askWithDefault("Rating", getUsRating(movie));
  const runtime = await askWithDefault("Runtime", formatRuntime(movie.runtime));
  return { id, collection, franchise, boothGroup, title, edition, year, rating, runtime, poster: getPosterRelativePath("movie", posterFolder, id) };
}

async function buildAccessibleMovie(movie, library) {
  const suggestions = buildSuggestions(library, movie);
  const title = await askWithDefault("Title", movie.title);
  const id = await askWithDefault("ID", slugify(title));
  const posterFolder = await askWithDefault("Poster Folder", suggestions.posterFolder || "", { allowBlank: true });
  const provider = await chooseProvider();
  const year = await askWithDefault("Year", getReleaseYear(movie.release_date));
  return { id, mediaType: "movie", title, year, provider, poster: getPosterRelativePath("movie", posterFolder, id) };
}

async function buildAccessibleShow(show) {
  const title = await askWithDefault("Title", show.name);
  const id = await askWithDefault("ID", slugify(title));
  const posterFolder = await askWithDefault("Poster Folder", "", { allowBlank: true });
  const provider = await chooseProvider();
  const year = await askWithDefault("Year", getReleaseYear(show.first_air_date));
  const seasons = await askWithDefault("Season Count", String(show.number_of_seasons || "Unknown"));
  return { id, mediaType: "series", title, year, provider, seasons, poster: getPosterRelativePath("series", posterFolder, id) };
}

async function main() {
  console.log("\n========================================");
  console.log("Jockisch Family Theater");
  console.log("Media Importer - Version 2.0");
  console.log("========================================\n");

  console.log("What are you adding?");
  const destination = await chooseDestination();
  if (!destination) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const mediaType = destination === "accessible-show" ? "series" : "movie";
  const owned = loadMovieLibrary();
  const accessible = loadAccessibleLibrary();

  let searchTitle = "";
  while (!searchTitle) {
    searchTitle = await ask(mediaType === "series" ? "TV show title: " : "Movie title: ");
    if (!searchTitle) console.log("Please enter a title.");
  }

  console.log(`\nSearching TMDb for "${searchTitle}"...`);
  const results = (await searchTMDb(searchTitle, mediaType)).slice(0, 10);
  if (!results.length) {
    console.log("\nNo TMDb matches were found.");
    return;
  }

  printSearchResults(results, mediaType);
  const selected = await chooseSearchResult(results);
  if (!selected) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  console.log("\nLoading full metadata...");
  const media = await getDetails(selected.id, mediaType);
  printSelected(media, mediaType);

  if (!media.poster_path) {
    console.log("\nThis TMDb entry does not have a poster. No files were changed.");
    return;
  }

  const item = destination === "owned-movie"
    ? await buildOwnedMovie(media, owned)
    : destination === "accessible-movie"
      ? await buildAccessibleMovie(media, owned)
      : await buildAccessibleShow(media);

  const duplicate = findDuplicate(owned, accessible, item);
  if (duplicate) {
    console.log("\nImport stopped: this title appears to already exist.");
    console.log(`Existing title: ${duplicate.title}`);
    console.log(`Existing ID: ${duplicate.id}`);
    console.log(`Library: ${duplicate.source}`);
    console.log("No files were changed.");
    return;
  }

  console.log("\n========================================");
  console.log("Future Library Entry Preview");
  console.log("========================================\n");
  console.log(destination === "owned-movie" ? formatOwnedMovie(item) : formatAccessible(item));

  const targetLibrary = destination === "owned-movie" ? MOVIE_LIBRARY_FILE : ACCESSIBLE_LIBRARY_FILE;
  console.log(`\nPoster path: ${item.poster}`);
  console.log(`Target library: ${targetLibrary}`);

  if (!(await confirm("\nDownload the poster and add this title"))) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const posterFile = getPosterFilePath(item.poster);
  const existed = fs.existsSync(posterFile);
  if (existed) {
    console.log(`\nA poster already exists at:\n${posterFile}`);
    if (!(await confirm("Overwrite the existing poster"))) {
      console.log("\nImport canceled. No files were changed.");
      return;
    }
  }

  console.log("\nDownloading poster...");
  await downloadPoster(media.poster_path, posterFile);
  console.log("Poster downloaded successfully.");

  let result;
  try {
    result = destination === "owned-movie" ? saveOwnedMovie(item) : saveAccessible(item);
  } catch (error) {
    if (!existed && fs.existsSync(posterFile)) fs.rmSync(posterFile, { force: true });
    throw error;
  }

  console.log("\n========================================");
  console.log("Import Complete");
  console.log("========================================");
  console.log(`Added: ${item.title}`);
  console.log(`Type: ${destination === "owned-movie" ? "Owned Movie" : item.mediaType === "series" ? "Accessible TV Show" : "Accessible Movie"}`);
  if (item.provider) console.log(`Provider: ${item.provider}`);
  console.log(`Library: ${result.libraryPath}`);
  console.log(`Poster: ${posterFile}`);
  console.log(`Backup: ${result.backupPath}`);
}

main()
  .catch(error => {
    console.error("\nMedia importer failed:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
