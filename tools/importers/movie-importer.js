const fs = require("fs");
const path = require("path");
const readline = require("readline");
const vm = require("vm");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

//
// Configuration
//

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const MOVIE_LIBRARY_FILE = path.join(
  PROJECT_ROOT,
  "library",
  "movies",
  "movie-library.js"
);

const ACCESSIBLE_MEDIA_LIBRARY_FILE = path.join(
  PROJECT_ROOT,
  "library",
  "accessible-media",
  "accessible-media-library.js"
);

const MOVIE_IMPORT_BACKUP_DIRECTORY = path.join(
  PROJECT_ROOT,
  "backups",
  "movie-imports"
);

const ACCESSIBLE_IMPORT_BACKUP_DIRECTORY = path.join(
  PROJECT_ROOT,
  "backups",
  "accessible-media-imports"
);

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//
// Prompt helpers
//

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function askWithDefault(label, defaultValue, options = {}) {
  const { allowBlank = false } = options;
  const displayDefault = defaultValue || (allowBlank ? "blank" : "");

  while (true) {
    const answer = await ask(`${label} [${displayDefault}]: `);

    if (answer === "-") {
      if (allowBlank) return "";
      console.log("This field cannot be blank.");
      continue;
    }

    if (answer) return answer;

    if (defaultValue || allowBlank) {
      return defaultValue || "";
    }

    console.log("Please enter a value.");
  }
}

async function confirm(question, defaultYes = false) {
  const suffix = defaultYes ? "Y/n" : "y/n";

  while (true) {
    const answer = (await ask(`${question} (${suffix}): `)).toLowerCase();

    if (!answer && defaultYes) return true;
    if (answer === "y" || answer === "yes") return true;
    if (answer === "n" || answer === "no") return false;

    console.log('Please enter "y" or "n".');
  }
}

async function chooseNumber(prompt, options, { allowCancel = true } = {}) {
  console.log("");

  options.forEach((option, index) => {
    console.log(`${index + 1}) ${option}`);
  });

  if (allowCancel) {
    console.log("0) Cancel");
  }

  while (true) {
    const answer = await ask(`\n${prompt}: `);

    if (allowCancel && answer === "0") return null;

    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (
      Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 &&
      selectedIndex < options.length
    ) {
      return selectedIndex;
    }

    console.log("Please enter one of the listed numbers.");
  }
}

async function chooseImportDestination() {
  const choices = [
    "Owned Movie",
    "Accessible Movie",
    "Accessible TV Show"
  ];

  console.log("What are you adding?");

  const selectedIndex = await chooseNumber(
    "Destination number",
    choices
  );

  if (selectedIndex === null) return null;

  return ["owned-movie", "accessible-movie", "accessible-show"][
    selectedIndex
  ];
}

async function chooseSearchResult(results) {
  while (true) {
    const answer = await ask(
      "\nSelect a match number, or enter 0 to cancel: "
    );

    if (answer === "0") return null;

    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (
      Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 &&
      selectedIndex < results.length
    ) {
      return results[selectedIndex];
    }

    console.log("Please enter one of the listed match numbers.");
  }
}

async function chooseEdition(defaultEdition = "") {
  const editions = ["4K", "Blu Ray", "DVD", "Digital"];

  console.log("\nChoose an edition:\n");

  editions.forEach((edition, index) => {
    const marker =
      normalizeValue(edition) === normalizeValue(defaultEdition)
        ? " (current)"
        : "";

    console.log(`${index + 1}) ${edition}${marker}`);
  });

  console.log(`${editions.length + 1}) Custom`);

  while (true) {
    const answer = await ask("\nEdition number: ");
    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (
      Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 &&
      selectedIndex < editions.length
    ) {
      const extra = await ask(
        "Additional edition wording, or press Enter for none: "
      );

      return extra
        ? `${editions[selectedIndex]} ${extra}`
        : editions[selectedIndex];
    }

    if (selectedIndex === editions.length) {
      let customEdition = "";

      while (!customEdition) {
        customEdition = await ask(
          `Custom edition${defaultEdition ? ` [${defaultEdition}]` : ""}: `
        );

        if (!customEdition && defaultEdition) {
          return defaultEdition;
        }

        if (!customEdition) {
          console.log("Please enter an edition.");
        }
      }

      return customEdition;
    }

    console.log("Please enter one of the listed edition numbers.");
  }
}

async function chooseProvider(defaultProvider = "") {
  const providers = [
    "Disney+",
    "Netflix",
    "Prime Video",
    "Hulu",
    "Max",
    "Peacock",
    "Paramount+",
    "Apple TV+",
    "Upcoming",
    "Other"
  ];

  console.log("\nChoose the current provider or access source:");

  providers.forEach((provider, index) => {
    const marker =
      normalizeValue(provider) === normalizeValue(defaultProvider)
        ? " (current)"
        : "";

    console.log(`${index + 1}) ${provider}${marker}`);
  });

  while (true) {
    const answer = await ask("\nProvider number: ");
    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (
      Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 &&
      selectedIndex < providers.length
    ) {
      if (providers[selectedIndex] !== "Other") {
        return providers[selectedIndex];
      }

      return askWithDefault(
        "Custom provider",
        defaultProvider || ""
      );
    }

    console.log("Please enter one of the listed provider numbers.");
  }
}

//
// General helpers
//

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
  const cleaned = String(value || "")
    .replace(/\s+Collection$/i, "")
    .trim();

  return cleaned || fallbackTitle;
}

function formatRuntime(minutes) {
  const totalMinutes = Number(minutes);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "Unknown";
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}hr`;

  return `${hours}hr ${remainingMinutes}min`;
}

function getReleaseYear(releaseDate) {
  const match = String(releaseDate || "").match(/^(\d{4})/);
  return match ? match[1] : "Unknown";
}

function getUsMovieRating(movie) {
  const usRelease = (movie.release_dates?.results || []).find(
    (entry) => entry.iso_3166_1 === "US"
  );

  const certifications = (usRelease?.release_dates || [])
    .map((entry) => String(entry.certification || "").trim())
    .filter(Boolean);

  return certifications[0] || "Unknown";
}

function getPosterFolderFromPath(posterPath, mediaType = "movie") {
  const normalizedPath = String(posterPath || "").replace(/\\/g, "/");
  const prefix =
    mediaType === "series"
      ? "/assets/posters/shows/"
      : "/assets/posters/movies/";

  const relativePath = normalizedPath.startsWith(prefix)
    ? normalizedPath.slice(prefix.length)
    : "";

  const parts = relativePath.split("/").filter(Boolean);

  if (parts.length <= 1) return "";

  return parts.slice(0, -1).join("/");
}

function getMostCommon(values) {
  const counts = new Map();

  for (const value of values.filter((item) => item !== undefined)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((first, second) => {
      if (first[1] !== second[1]) {
        return second[1] - first[1];
      }

      return String(first[0]).localeCompare(String(second[0]));
    })[0]?.[0];
}

function getPosterRelativePath(mediaType, folder, id) {
  const cleanFolder = String(folder || "")
    .replace(/^[/\\]+|[/\\]+$/g, "")
    .replace(/\\/g, "/");

  const base =
    mediaType === "series"
      ? "/assets/posters/shows"
      : "/assets/posters/movies";

  return cleanFolder
    ? `${base}/${cleanFolder}/${id}.jpg`
    : `${base}/${id}.jpg`;
}

function getPosterFilePath(posterRelativePath) {
  return path.join(
    PROJECT_ROOT,
    posterRelativePath.replace(/^[/\\]+/, "")
  );
}

function createTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_` +
    `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} does not exist:\n${filePath}`);
  }
}

function mediaMatches(item, id, title, mediaType = "movie") {
  return (
    normalizeValue(item.id) === normalizeValue(id) ||
    (
      normalizeValue(item.title) === normalizeValue(title) &&
      normalizeValue(item.mediaType || "movie") ===
        normalizeValue(mediaType)
    )
  );
}

//
// Library reading
//

function loadMovieLibrary() {
  ensureFileExists(MOVIE_LIBRARY_FILE, "Movie library");

  const source = fs.readFileSync(MOVIE_LIBRARY_FILE, "utf8");
  const context = {
    module: { exports: {} },
    exports: {},
    result: null
  };

  vm.createContext(context);

  try {
    vm.runInContext(
      `${source}\nresult = movieLibrary;`,
      context,
      { filename: MOVIE_LIBRARY_FILE }
    );
  } catch (error) {
    throw new Error(
      `Could not read movie-library.js: ${error.message}`
    );
  }

  if (!Array.isArray(context.result)) {
    throw new Error(
      "movie-library.js did not contain a readable movieLibrary array."
    );
  }

  return context.result.filter(
    (movie) => movie && movie.type !== "games-library"
  );
}

function loadAccessibleMediaLibrary() {
  ensureFileExists(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    "Accessible media library"
  );

  const source = fs.readFileSync(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    "utf8"
  );

  const executableSource = source.replace(
    /\bexport\s+default\s+accessibleMediaLibrary\s*;?/,
    ""
  );

  const context = {
    module: { exports: {} },
    exports: {},
    result: null
  };

  vm.createContext(context);

  try {
    vm.runInContext(
      `${executableSource}\nresult = accessibleMediaLibrary;`,
      context,
      { filename: ACCESSIBLE_MEDIA_LIBRARY_FILE }
    );
  } catch (error) {
    throw new Error(
      `Could not read accessible-media-library.js: ${error.message}`
    );
  }

  if (!Array.isArray(context.result)) {
    throw new Error(
      "accessible-media-library.js did not contain a readable accessibleMediaLibrary array."
    );
  }

  return context.result.filter(Boolean);
}

//
// Suggestions and lookup
//

function findRelatedMovies(library, collection, title) {
  const normalizedCollection = normalizeValue(collection);
  const normalizedTitle = normalizeValue(title);

  const sameCollection = library.filter(
    (movie) =>
      normalizeValue(movie.collection) === normalizedCollection
  );

  if (sameCollection.length > 0) return sameCollection;

  const titleWords = normalizedTitle
    .split(/\s+/)
    .filter((word) => word.length >= 4);

  return library.filter((movie) => {
    const searchable = normalizeValue(
      `${movie.title} ${movie.collection} ${movie.franchise} ${movie.boothGroup}`
    );

    return titleWords.some((word) => searchable.includes(word));
  });
}

function buildMovieSuggestions(library, movie) {
  const tmdbCollection = cleanCollectionName(
    movie.belongs_to_collection?.name,
    movie.title
  );

  const relatedMovies = findRelatedMovies(
    library,
    tmdbCollection,
    movie.title
  );

  const collection =
    getMostCommon(relatedMovies.map((entry) => entry.collection)) ||
    tmdbCollection ||
    movie.title;

  const collectionMatches = library.filter(
    (entry) =>
      normalizeValue(entry.collection) === normalizeValue(collection)
  );

  const suggestionPool =
    collectionMatches.length > 0 ? collectionMatches : relatedMovies;

  const franchise =
    getMostCommon(
      suggestionPool
        .map((entry) => entry.franchise)
        .filter((value) => value !== undefined && value !== "")
    ) ||
    (movie.belongs_to_collection ? collection : "");

  const boothGroup =
    getMostCommon(
      suggestionPool
        .map((entry) => entry.boothGroup)
        .filter(Boolean)
    ) ||
    franchise ||
    collection;

  const posterFolder =
    getMostCommon(
      suggestionPool.map((entry) =>
        getPosterFolderFromPath(entry.poster, "movie")
      )
    ) ||
    (movie.belongs_to_collection ? slugify(collection) : "");

  return {
    collection,
    franchise,
    boothGroup,
    posterFolder,
    relatedCount: suggestionPool.length
  };
}

function findExistingOwnedMovie(library, id, title) {
  return library.find((item) =>
    mediaMatches(item, id, title, "movie")
  );
}

function findExistingAccessibleMedia(
  library,
  id,
  title,
  mediaType
) {
  return library.find((item) =>
    mediaMatches(item, id, title, mediaType)
  );
}

//
// TMDb requests
//

async function requestTMDb(endpoint, query = {}) {
  if (!TMDB_ACCESS_TOKEN) {
    throw new Error("TMDB_ACCESS_TOKEN is missing from .env.");
  }

  const url = new URL(`${TMDB_API_BASE}${endpoint}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      Accept: "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `TMDb request failed (${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function searchTMDb(title, mediaType) {
  const endpoint =
    mediaType === "series" ? "/search/tv" : "/search/movie";

  const data = await requestTMDb(endpoint, {
    query: title,
    include_adult: "false",
    language: "en-US"
  });

  return data.results || [];
}

async function getMovieDetails(movieId) {
  return requestTMDb(`/movie/${Number(movieId)}`, {
    append_to_response: "release_dates",
    language: "en-US"
  });
}

async function getShowDetails(showId) {
  return requestTMDb(`/tv/${Number(showId)}`, {
    language: "en-US"
  });
}

//
// Display
//

function printSearchResults(results, mediaType) {
  console.log("\nTMDb matches:\n");

  results.forEach((item, index) => {
    const title =
      mediaType === "series" ? item.name : item.title;

    const originalTitle =
      mediaType === "series" ? item.original_name : item.original_title;

    const releaseDate =
      mediaType === "series"
        ? item.first_air_date
        : item.release_date;

    const year = getReleaseYear(releaseDate);

    const originalLabel =
      originalTitle && originalTitle !== title
        ? ` | Original: ${originalTitle}`
        : "";

    console.log(`${index + 1}) ${title} (${year})${originalLabel}`);

    if (item.overview) {
      const shortOverview =
        item.overview.length > 140
          ? `${item.overview.slice(0, 137)}...`
          : item.overview;

      console.log(`   ${shortOverview}`);
    }
  });
}

function printSelectedMedia(media, mediaType) {
  const title =
    mediaType === "series" ? media.name : media.title;

  const year = getReleaseYear(
    mediaType === "series"
      ? media.first_air_date
      : media.release_date
  );

  console.log("\n========================================");
  console.log(
    mediaType === "series" ? "Selected TV Show" : "Selected Movie"
  );
  console.log("========================================");
  console.log(`Title: ${title}`);
  console.log(`TMDb ID: ${media.id}`);
  console.log(`Release: ${year}`);

  if (mediaType === "movie") {
    console.log(`Rating: ${getUsMovieRating(media)}`);
    console.log(`Runtime: ${formatRuntime(media.runtime)}`);
    console.log(
      `TMDb collection: ${media.belongs_to_collection?.name || "None"}`
    );
  } else {
    console.log(`Seasons: ${media.number_of_seasons || "Unknown"}`);
    console.log(`Episodes: ${media.number_of_episodes || "Unknown"}`);
  }

  console.log(
    `Poster available: ${media.poster_path ? "Yes" : "No"}`
  );

  if (media.overview) {
    console.log("\nOverview:");
    console.log(media.overview);
  }
}

function formatOwnedMovieObject(movieObject) {
  return [
    "  {",
    `    id: ${JSON.stringify(movieObject.id)},`,
    `    collection: ${JSON.stringify(movieObject.collection)},`,
    `    franchise: ${JSON.stringify(movieObject.franchise)},`,
    `    boothGroup: ${JSON.stringify(movieObject.boothGroup)},`,
    `    title: ${JSON.stringify(movieObject.title)},`,
    `    edition: ${JSON.stringify(movieObject.edition)},`,
    `    year: ${JSON.stringify(movieObject.year)},`,
    `    rating: ${JSON.stringify(movieObject.rating)},`,
    `    runtime: ${JSON.stringify(movieObject.runtime)},`,
    `    poster: ${JSON.stringify(movieObject.poster)}`,
    "  }"
  ].join("\n");
}

function formatAccessibleMediaObject(mediaObject) {
  const lines = [
    "  {",
    `    id: ${JSON.stringify(mediaObject.id)},`,
    `    mediaType: ${JSON.stringify(mediaObject.mediaType)},`,
    `    title: ${JSON.stringify(mediaObject.title)},`,
    `    year: ${JSON.stringify(mediaObject.year)},`,
    `    provider: ${JSON.stringify(mediaObject.provider)},`
  ];

  if (mediaObject.mediaType === "series") {
    lines.push(
      `    seasons: ${JSON.stringify(mediaObject.seasons)},`
    );
  }

  lines.push(
    `    poster: ${JSON.stringify(mediaObject.poster)}`,
    "  }"
  );

  return lines.join("\n");
}

function printObjectPreview(mediaObject, destination, operation) {
  console.log("\n========================================");
  console.log(
    operation === "update"
      ? "Updated Library Entry Preview"
      : "Future Library Entry Preview"
  );
  console.log("========================================\n");

  console.log(
    destination === "owned-movie"
      ? formatOwnedMovieObject(mediaObject)
      : formatAccessibleMediaObject(mediaObject)
  );
}

//
// Poster handling
//

async function downloadPoster(posterPath, destination) {
  const response = await fetch(`${TMDB_IMAGE_BASE}${posterPath}`);

  if (!response.ok) {
    throw new Error(
      `Poster download failed with status ${response.status}.`
    );
  }

  const imageBuffer = Buffer.from(
    await response.arrayBuffer()
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.writeFileSync(destination, imageBuffer);
}

//
// Generic backup and atomic writing
//

function backupFile(sourceFile, backupDirectory, prefix) {
  fs.mkdirSync(backupDirectory, {
    recursive: true
  });

  const backupPath = path.join(
    backupDirectory,
    `${prefix}-${createTimestamp()}.js`
  );

  fs.copyFileSync(sourceFile, backupPath);

  return backupPath;
}

function writeFileAtomically(filePath, contents) {
  const temporaryPath = `${filePath}.tmp`;

  try {
    fs.writeFileSync(temporaryPath, contents, "utf8");
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) {
      fs.rmSync(temporaryPath, { force: true });
    }

    throw error;
  }
}

//
// Flat-object source editing
//

function findFlatObjectRangeById(source, targetId) {
  const idPattern = new RegExp(
    `\\bid\\s*:\\s*${JSON.stringify(targetId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
  );

  const idMatch = idPattern.exec(source);

  if (!idMatch) return null;

  let objectStart = source.lastIndexOf("{", idMatch.index);

  if (objectStart < 0) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") depth += 1;

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start: objectStart,
          end: index + 1
        };
      }
    }
  }

  return null;
}

function replaceFlatObjectById(source, targetId, replacementObjectText) {
  const range = findFlatObjectRangeById(source, targetId);

  if (!range) {
    throw new Error(`Could not find entry with ID "${targetId}".`);
  }

  return (
    source.slice(0, range.start) +
    replacementObjectText +
    source.slice(range.end)
  );
}

function removeFlatObjectById(source, targetId) {
  const range = findFlatObjectRangeById(source, targetId);

  if (!range) {
    throw new Error(`Could not find entry with ID "${targetId}".`);
  }

  let start = range.start;
  let end = range.end;

  const after = source.slice(end);
  const commaAfter = after.match(/^\s*,/);

  if (commaAfter) {
    end += commaAfter[0].length;
  } else {
    const before = source.slice(0, start);
    const commaBefore = before.match(/,\s*$/);

    if (commaBefore) {
      start -= commaBefore[0].length;
    }
  }

  return (
    source.slice(0, start).replace(/[ \t]+$/gm, "") +
    source.slice(end)
  );
}

//
// Owned movie library writing
//

function getSectionMatches(source) {
  const sectionPattern =
    /^  \/\/ ={50}\r?\n  \/\/ (.+)\r?\n  \/\/ ={50}$/gm;

  return [...source.matchAll(sectionPattern)].map((match) => ({
    label: match[1].trim(),
    index: match.index,
    endIndex: match.index + match[0].length
  }));
}

function createOwnedMovieSectionBlock(movieObject) {
  return [
    "  // ==================================================",
    `  // ${movieObject.collection}`,
    "  // ==================================================",
    "",
    formatOwnedMovieObject(movieObject)
  ].join("\n");
}

function addOwnedMovieToLibrarySource(source, movieObject) {
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const normalizedSource = source.replace(/\r\n/g, "\n");
  const sections = getSectionMatches(normalizedSource);

  const existingSectionIndex = sections.findIndex(
    (section) =>
      normalizeValue(section.label) ===
      normalizeValue(movieObject.collection)
  );

  let updatedSource;

  if (existingSectionIndex >= 0) {
    const currentSection = sections[existingSectionIndex];
    const nextSection = sections[existingSectionIndex + 1];

    if (!nextSection) {
      throw new Error(
        `Could not find the section after "${currentSection.label}".`
      );
    }

    const insertionIndex = nextSection.index;
    const before = normalizedSource
      .slice(0, insertionIndex)
      .replace(/\s+$/, "")
      .replace(/,\s*$/, "");
    const after = normalizedSource.slice(insertionIndex);

    updatedSource =
      `${before},\n\n${formatOwnedMovieObject(movieObject)},\n\n${after}`;
  } else {
    const gamesSection = sections.find(
      (section) => normalizeValue(section.label) === "games"
    );

    if (!gamesSection) {
      throw new Error(
        'Could not find the special "Games" section in movie-library.js.'
      );
    }

    const laterSection = sections.find((section) => {
      if (normalizeValue(section.label) === "games") return false;

      return (
        section.label.localeCompare(
          movieObject.collection,
          undefined,
          { sensitivity: "base", numeric: true }
        ) > 0
      );
    });

    const insertionIndex = laterSection
      ? laterSection.index
      : gamesSection.index;

    const before = normalizedSource
      .slice(0, insertionIndex)
      .replace(/\s+$/, "")
      .replace(/,\s*$/, "");
    const after = normalizedSource.slice(insertionIndex);

    updatedSource =
      `${before},\n\n${createOwnedMovieSectionBlock(movieObject)},\n\n${after}`;
  }

  return updatedSource.replace(/\n/g, lineEnding);
}

function writeOwnedMovie(movieObject, operation, existingId = "") {
  const originalSource = fs.readFileSync(
    MOVIE_LIBRARY_FILE,
    "utf8"
  );

  const updatedSource =
    operation === "update"
      ? replaceFlatObjectById(
          originalSource,
          existingId,
          formatOwnedMovieObject(movieObject)
        )
      : addOwnedMovieToLibrarySource(
          originalSource,
          movieObject
        );

  const backupPath = backupFile(
    MOVIE_LIBRARY_FILE,
    MOVIE_IMPORT_BACKUP_DIRECTORY,
    "movie-library"
  );

  writeFileAtomically(MOVIE_LIBRARY_FILE, updatedSource);

  return {
    libraryPath: MOVIE_LIBRARY_FILE,
    backupPath
  };
}

//
// Accessible media library writing
//

function addAccessibleMediaToLibrarySource(source, mediaObject) {
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const normalizedSource = source.replace(/\r\n/g, "\n");

  const closingPattern =
    /\n\];\s*\n\s*export\s+default\s+accessibleMediaLibrary\s*;?\s*$/;

  const match = normalizedSource.match(closingPattern);

  if (!match || match.index === undefined) {
    throw new Error(
      "Could not find the end of accessibleMediaLibrary."
    );
  }

  const beforeArrayEnd = normalizedSource
    .slice(0, match.index)
    .replace(/\s+$/, "")
    .replace(/,\s*$/, "");

  const afterArrayEnd = normalizedSource.slice(match.index);

  const objectText = formatAccessibleMediaObject(mediaObject);

  const updatedSource =
    `${beforeArrayEnd},\n\n${objectText}\n${afterArrayEnd}`;

  return updatedSource.replace(/\n/g, lineEnding);
}

function writeAccessibleMedia(
  mediaObject,
  operation,
  existingId = ""
) {
  const originalSource = fs.readFileSync(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    "utf8"
  );

  const updatedSource =
    operation === "update"
      ? replaceFlatObjectById(
          originalSource,
          existingId,
          formatAccessibleMediaObject(mediaObject)
        )
      : addAccessibleMediaToLibrarySource(
          originalSource,
          mediaObject
        );

  const backupPath = backupFile(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    ACCESSIBLE_IMPORT_BACKUP_DIRECTORY,
    "accessible-media-library"
  );

  writeFileAtomically(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    updatedSource
  );

  return {
    libraryPath: ACCESSIBLE_MEDIA_LIBRARY_FILE,
    backupPath
  };
}

function removeAccessibleMedia(existingId) {
  const originalSource = fs.readFileSync(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    "utf8"
  );

  const updatedSource = removeFlatObjectById(
    originalSource,
    existingId
  );

  const backupPath = backupFile(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    ACCESSIBLE_IMPORT_BACKUP_DIRECTORY,
    "accessible-media-library-before-removal"
  );

  writeFileAtomically(
    ACCESSIBLE_MEDIA_LIBRARY_FILE,
    updatedSource
  );

  return {
    libraryPath: ACCESSIBLE_MEDIA_LIBRARY_FILE,
    backupPath
  };
}

//
// Object builders
//

async function buildOwnedMovieObject(
  movie,
  ownedLibrary,
  existingOwned = null,
  existingAccessible = null
) {
  const suggestions = buildMovieSuggestions(
    ownedLibrary,
    movie
  );

  const sourceDefaults =
    existingOwned || existingAccessible || {};

  console.log("\n========================================");
  console.log(
    existingOwned
      ? "Update Owned Movie"
      : existingAccessible
        ? "Convert Accessible Movie to Owned"
        : "Owned Movie Organization"
  );
  console.log("========================================");

  if (existingOwned) {
    console.log(
      `Current edition: ${existingOwned.edition || "Unknown"}`
    );
    console.log(
      "Press Enter to preserve existing organization fields.\n"
    );
  } else if (existingAccessible) {
    console.log(
      `Current accessible source: ${
        existingAccessible.provider || "Unknown"
      }`
    );
    console.log(
      "The owned movie entry will become the preferred playlist source.\n"
    );
  }

  const title = await askWithDefault(
    "Title",
    sourceDefaults.title || movie.title
  );

  const id = await askWithDefault(
    "ID",
    sourceDefaults.id || slugify(title)
  );

  const collection = await askWithDefault(
    "Collection",
    sourceDefaults.collection ||
      suggestions.collection ||
      title
  );

  const franchise = await askWithDefault(
    "Franchise",
    sourceDefaults.franchise ||
      suggestions.franchise,
    { allowBlank: true }
  );

  const boothGroup = await askWithDefault(
    "Booth Group",
    sourceDefaults.boothGroup ||
      suggestions.boothGroup ||
      franchise ||
      collection
  );

  const existingPosterFolder = getPosterFolderFromPath(
    sourceDefaults.poster,
    "movie"
  );

  const posterFolder = await askWithDefault(
    "Poster Folder",
    existingPosterFolder ||
      suggestions.posterFolder,
    { allowBlank: true }
  );

  const edition = await chooseEdition(
    sourceDefaults.edition || ""
  );

  const year = await askWithDefault(
    "Year",
    sourceDefaults.year ||
      getReleaseYear(movie.release_date)
  );

  const rating = await askWithDefault(
    "Rating",
    sourceDefaults.rating ||
      getUsMovieRating(movie)
  );

  const runtime = await askWithDefault(
    "Runtime",
    sourceDefaults.runtime ||
      formatRuntime(movie.runtime)
  );

  const poster = getPosterRelativePath(
    "movie",
    posterFolder,
    id
  );

  return {
    id,
    collection,
    franchise,
    boothGroup,
    title,
    edition,
    year,
    rating,
    runtime,
    poster
  };
}

async function buildAccessibleMovieObject(
  movie,
  ownedLibrary,
  existingAccessible = null
) {
  const suggestions = buildMovieSuggestions(
    ownedLibrary,
    movie
  );

  const sourceDefaults = existingAccessible || {};

  console.log("\n========================================");
  console.log(
    existingAccessible
      ? "Update Accessible Movie"
      : "Accessible Movie Organization"
  );
  console.log("========================================");
  console.log(
    "This title will not be added to your owned movie library.\n"
  );

  const title = await askWithDefault(
    "Title",
    sourceDefaults.title || movie.title
  );

  const id = await askWithDefault(
    "ID",
    sourceDefaults.id || slugify(title)
  );

  const existingPosterFolder = getPosterFolderFromPath(
    sourceDefaults.poster,
    "movie"
  );

  const posterFolder = await askWithDefault(
    "Poster Folder",
    existingPosterFolder ||
      suggestions.posterFolder ||
      "",
    { allowBlank: true }
  );

  const provider = await chooseProvider(
    sourceDefaults.provider || ""
  );

  const year = await askWithDefault(
    "Year",
    sourceDefaults.year ||
      getReleaseYear(movie.release_date)
  );

  const poster = getPosterRelativePath(
    "movie",
    posterFolder,
    id
  );

  return {
    id,
    mediaType: "movie",
    title,
    year,
    provider,
    poster
  };
}

async function buildAccessibleShowObject(
  show,
  existingAccessible = null
) {
  const sourceDefaults = existingAccessible || {};

  console.log("\n========================================");
  console.log(
    existingAccessible
      ? "Update Accessible TV Show"
      : "Accessible TV Show Organization"
  );
  console.log("========================================");
  console.log(
    "TV artwork will be stored under /assets/posters/shows/.\n"
  );

  const title = await askWithDefault(
    "Title",
    sourceDefaults.title || show.name
  );

  const id = await askWithDefault(
    "ID",
    sourceDefaults.id || slugify(title)
  );

  const existingPosterFolder = getPosterFolderFromPath(
    sourceDefaults.poster,
    "series"
  );

  const posterFolder = await askWithDefault(
    "Poster Folder",
    existingPosterFolder || "",
    { allowBlank: true }
  );

  const provider = await chooseProvider(
    sourceDefaults.provider || ""
  );

  const year = await askWithDefault(
    "Year",
    sourceDefaults.year ||
      getReleaseYear(show.first_air_date)
  );

  const seasons = await askWithDefault(
    "Season Count",
    String(
      sourceDefaults.seasons ||
      show.number_of_seasons ||
      "Unknown"
    )
  );

  const poster = getPosterRelativePath(
    "series",
    posterFolder,
    id
  );

  return {
    id,
    mediaType: "series",
    title,
    year,
    provider,
    seasons,
    poster
  };
}

//
// Main
//

async function main() {
  console.log("");
  console.log("========================================");
  console.log("Jockisch Family Theater");
  console.log("Media Importer - Version 2.1");
  console.log("========================================\n");

  const destination = await chooseImportDestination();

  if (!destination) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const mediaType =
    destination === "accessible-show" ? "series" : "movie";

  const ownedLibrary = loadMovieLibrary();
  const accessibleLibrary = loadAccessibleMediaLibrary();

  let searchTitle = "";

  while (!searchTitle) {
    searchTitle = await ask(
      mediaType === "series" ? "TV show title: " : "Movie title: "
    );

    if (!searchTitle) {
      console.log("Please enter a title.");
    }
  }

  console.log(`\nSearching TMDb for "${searchTitle}"...`);

  const searchResults = (
    await searchTMDb(searchTitle, mediaType)
  ).slice(0, 10);

  if (searchResults.length === 0) {
    console.log("\nNo TMDb matches were found.");
    return;
  }

  printSearchResults(searchResults, mediaType);

  const selectedResult = await chooseSearchResult(searchResults);

  if (!selectedResult) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  console.log("\nLoading full metadata...");

  const media =
    mediaType === "series"
      ? await getShowDetails(selectedResult.id)
      : await getMovieDetails(selectedResult.id);

  printSelectedMedia(media, mediaType);

  if (!media.poster_path) {
    console.log("\nThis TMDb entry does not have a poster.");
    console.log("No files were changed.");
    return;
  }

  const canonicalTitle =
    mediaType === "series" ? media.name : media.title;

  const canonicalId = slugify(canonicalTitle);

  const existingOwned =
    mediaType === "movie"
      ? findExistingOwnedMovie(
          ownedLibrary,
          canonicalId,
          canonicalTitle
        )
      : null;

  const existingAccessible =
    findExistingAccessibleMedia(
      accessibleLibrary,
      canonicalId,
      canonicalTitle,
      mediaType
    );

  let operation = "add";
  let removeAccessibleAfterOwnedImport = false;

  if (destination === "owned-movie" && existingOwned) {
    console.log("\n========================================");
    console.log("Existing Owned Movie Found");
    console.log("========================================");
    console.log(`Title: ${existingOwned.title}`);
    console.log(`Edition: ${existingOwned.edition || "Unknown"}`);
    console.log(`ID: ${existingOwned.id}`);

    const action = await chooseNumber(
      "What would you like to do",
      [
        "Update the existing owned entry",
        "Cancel"
      ],
      { allowCancel: false }
    );

    if (action === 1) {
      console.log("\nImport canceled. No files were changed.");
      return;
    }

    operation = "update";
  }

  if (
    destination === "owned-movie" &&
    !existingOwned &&
    existingAccessible
  ) {
    console.log("\n========================================");
    console.log("Accessible Version Found");
    console.log("========================================");
    console.log(`Title: ${existingAccessible.title}`);
    console.log(
      `Provider: ${existingAccessible.provider || "Unknown"}`
    );
    console.log(`ID: ${existingAccessible.id}`);

    const proceed = await confirm(
      "Import this title into the owned movie library",
      true
    );

    if (!proceed) {
      console.log("\nImport canceled. No files were changed.");
      return;
    }

    removeAccessibleAfterOwnedImport = await confirm(
      "Remove the accessible entry after the owned import succeeds",
      true
    );
  }

  if (
    destination !== "owned-movie" &&
    existingAccessible
  ) {
    console.log("\n========================================");
    console.log("Existing Accessible Entry Found");
    console.log("========================================");
    console.log(`Title: ${existingAccessible.title}`);
    console.log(
      `Provider: ${existingAccessible.provider || "Unknown"}`
    );
    console.log(`ID: ${existingAccessible.id}`);

    const action = await chooseNumber(
      "What would you like to do",
      [
        "Update the existing accessible entry",
        "Cancel"
      ],
      { allowCancel: false }
    );

    if (action === 1) {
      console.log("\nImport canceled. No files were changed.");
      return;
    }

    operation = "update";
  }

  if (
    destination === "accessible-movie" &&
    existingOwned
  ) {
    console.log("\nThis movie is already in your owned library.");
    console.log(`Owned edition: ${existingOwned.edition || "Unknown"}`);
    console.log(
      "The importer will not create a lower-priority accessible duplicate."
    );
    console.log("No files were changed.");
    return;
  }

  let mediaObject;

  if (destination === "owned-movie") {
    mediaObject = await buildOwnedMovieObject(
      media,
      ownedLibrary,
      existingOwned,
      existingAccessible
    );
  } else if (destination === "accessible-movie") {
    mediaObject = await buildAccessibleMovieObject(
      media,
      ownedLibrary,
      existingAccessible
    );
  } else {
    mediaObject = await buildAccessibleShowObject(
      media,
      existingAccessible
    );
  }

  printObjectPreview(
    mediaObject,
    destination,
    operation
  );

  const targetLibrary =
    destination === "owned-movie"
      ? MOVIE_LIBRARY_FILE
      : ACCESSIBLE_MEDIA_LIBRARY_FILE;

  console.log(`\nPoster path: ${mediaObject.poster}`);
  console.log(`Target library: ${targetLibrary}`);

  const approved = await confirm(
    operation === "update"
      ? "\nDownload the poster and update this title"
      : "\nDownload the poster and add this title"
  );

  if (!approved) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const posterFile = getPosterFilePath(mediaObject.poster);
  const posterAlreadyExisted = fs.existsSync(posterFile);

  let overwritePoster = true;

  if (posterAlreadyExisted) {
    console.log("\nA poster already exists at:");
    console.log(posterFile);

    overwritePoster = await confirm(
      "Replace it with the current TMDb poster"
    );
  }

  if (overwritePoster) {
    console.log("\nDownloading poster...");
    await downloadPoster(media.poster_path, posterFile);
    console.log("Poster downloaded successfully.");
  } else {
    console.log("\nKeeping the existing poster.");
  }

  let result;

  try {
    if (destination === "owned-movie") {
      result = writeOwnedMovie(
        mediaObject,
        operation,
        existingOwned?.id || ""
      );
    } else {
      result = writeAccessibleMedia(
        mediaObject,
        operation,
        existingAccessible?.id || ""
      );
    }
  } catch (error) {
    if (
      overwritePoster &&
      !posterAlreadyExisted &&
      fs.existsSync(posterFile)
    ) {
      fs.rmSync(posterFile, { force: true });
    }

    throw error;
  }

  let removalResult = null;

  if (
    destination === "owned-movie" &&
    removeAccessibleAfterOwnedImport &&
    existingAccessible
  ) {
    removalResult = removeAccessibleMedia(
      existingAccessible.id
    );
  }

  console.log("\n========================================");
  console.log(
    operation === "update"
      ? "Update Complete"
      : "Import Complete"
  );
  console.log("========================================");
  console.log(`Title: ${mediaObject.title}`);
  console.log(
    `Type: ${
      mediaObject.mediaType === "series"
        ? "Accessible TV Show"
        : destination === "owned-movie"
          ? "Owned Movie"
          : "Accessible Movie"
    }`
  );

  if (mediaObject.edition) {
    console.log(`Edition: ${mediaObject.edition}`);
  }

  if (mediaObject.provider) {
    console.log(`Provider: ${mediaObject.provider}`);
  }

  console.log(`Library: ${result.libraryPath}`);
  console.log(`Poster: ${posterFile}`);
  console.log(`Backup: ${result.backupPath}`);

  if (removalResult) {
    console.log(
      "Accessible entry removed after successful owned import."
    );
    console.log(
      `Removal backup: ${removalResult.backupPath}`
    );
  }
}

main()
  .catch((error) => {
    console.error("\nMedia importer failed:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
  });
