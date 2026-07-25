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

const MOVIE_IMPORT_BACKUP_DIRECTORY = path.join(
  PROJECT_ROOT,
  "backups",
  "movie-imports"
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
      if (allowBlank) {
        return "";
      }

      console.log("This field cannot be blank.");
      continue;
    }

    if (answer) {
      return answer;
    }

    if (defaultValue || allowBlank) {
      return defaultValue || "";
    }

    console.log("Please enter a value.");
  }
}

async function confirm(question) {
  while (true) {
    const answer = (await ask(`${question} (y/n): `)).toLowerCase();

    if (answer === "y" || answer === "yes") {
      return true;
    }

    if (answer === "n" || answer === "no") {
      return false;
    }

    console.log('Please enter "y" or "n".');
  }
}

async function chooseSearchResult(results) {
  while (true) {
    const answer = await ask(
      "\nSelect a match number, or enter 0 to cancel: "
    );

    if (answer === "0") {
      return null;
    }

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

async function chooseEdition() {
  const editions = ["4K", "Blu Ray", "DVD", "Digital"];

  console.log("\nChoose an edition:\n");

  editions.forEach((edition, index) => {
    console.log(`${index + 1}) ${edition}`);
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
        customEdition = await ask("Custom edition: ");

        if (!customEdition) {
          console.log("Please enter an edition.");
        }
      }

      return customEdition;
    }

    console.log("Please enter one of the listed edition numbers.");
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

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}hr`;
  }

  return `${hours}hr ${remainingMinutes}min`;
}

function getReleaseYear(releaseDate) {
  const match = String(releaseDate || "").match(/^(\d{4})/);
  return match ? match[1] : "Unknown";
}

function getUsRating(movie) {
  const usRelease = (movie.release_dates?.results || []).find(
    (entry) => entry.iso_3166_1 === "US"
  );

  const certifications = (usRelease?.release_dates || [])
    .map((entry) => String(entry.certification || "").trim())
    .filter(Boolean);

  return certifications[0] || "Unknown";
}

function getPosterFolderFromPath(posterPath) {
  const normalizedPath = String(posterPath || "").replace(/\\/g, "/");
  const prefix = "/assets/posters/movies/";
  const relativePath = normalizedPath.startsWith(prefix)
    ? normalizedPath.slice(prefix.length)
    : "";

  const parts = relativePath.split("/").filter(Boolean);

  if (parts.length <= 1) {
    return "";
  }

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

function getPosterRelativePath(folder, id) {
  const cleanFolder = String(folder || "")
    .replace(/^[/\\]+|[/\\]+$/g, "")
    .replace(/\\/g, "/");

  return cleanFolder
    ? `/assets/posters/movies/${cleanFolder}/${id}.jpg`
    : `/assets/posters/movies/${id}.jpg`;
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

//
// Movie library reading and suggestions
//

function loadMovieLibrary() {
  if (!fs.existsSync(MOVIE_LIBRARY_FILE)) {
    throw new Error(
      `Movie library does not exist:\n${MOVIE_LIBRARY_FILE}`
    );
  }

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

function findRelatedMovies(library, collection, title) {
  const normalizedCollection = normalizeValue(collection);
  const normalizedTitle = normalizeValue(title);

  const sameCollection = library.filter(
    (movie) =>
      normalizeValue(movie.collection) === normalizedCollection
  );

  if (sameCollection.length > 0) {
    return sameCollection;
  }

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

function buildSuggestions(library, movie) {
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
        getPosterFolderFromPath(entry.poster)
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

function findDuplicateMovie(library, movieObject) {
  return library.find(
    (movie) =>
      normalizeValue(movie.id) === normalizeValue(movieObject.id) ||
      normalizeValue(movie.title) === normalizeValue(movieObject.title)
  );
}

//
// TMDb requests
//

async function requestTMDb(endpoint, query = {}) {
  if (!TMDB_ACCESS_TOKEN) {
    throw new Error(
      "TMDB_ACCESS_TOKEN is missing from .env."
    );
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

async function searchTMDb(title) {
  const data = await requestTMDb("/search/movie", {
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

//
// Display
//

function printSearchResults(results) {
  console.log("\nTMDb matches:\n");

  results.forEach((movie, index) => {
    const year = getReleaseYear(movie.release_date);
    const originalTitle =
      movie.original_title &&
      movie.original_title !== movie.title
        ? ` | Original: ${movie.original_title}`
        : "";

    console.log(`${index + 1}) ${movie.title} (${year})${originalTitle}`);

    if (movie.overview) {
      const shortOverview =
        movie.overview.length > 140
          ? `${movie.overview.slice(0, 137)}...`
          : movie.overview;

      console.log(`   ${shortOverview}`);
    }
  });
}

function printSelectedMovie(movie) {
  console.log("\n========================================");
  console.log("Selected Movie");
  console.log("========================================");
  console.log(`Title: ${movie.title}`);
  console.log(`TMDb ID: ${movie.id}`);
  console.log(`Release: ${getReleaseYear(movie.release_date)}`);
  console.log(`Rating: ${getUsRating(movie)}`);
  console.log(`Runtime: ${formatRuntime(movie.runtime)}`);
  console.log(
    `TMDb collection: ${movie.belongs_to_collection?.name || "None"}`
  );
  console.log(
    `Poster available: ${movie.poster_path ? "Yes" : "No"}`
  );

  if (movie.overview) {
    console.log("\nOverview:");
    console.log(movie.overview);
  }
}

function formatMovieObject(movieObject) {
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

function printMovieObjectPreview(movieObject) {
  console.log("\n========================================");
  console.log("Future Library Entry Preview");
  console.log("========================================\n");
  console.log(formatMovieObject(movieObject));
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
// Library writing
//

function backupMovieLibrary() {
  fs.mkdirSync(MOVIE_IMPORT_BACKUP_DIRECTORY, {
    recursive: true
  });

  const backupPath = path.join(
    MOVIE_IMPORT_BACKUP_DIRECTORY,
    `movie-library-${createTimestamp()}.js`
  );

  fs.copyFileSync(MOVIE_LIBRARY_FILE, backupPath);

  return backupPath;
}

function getSectionMatches(source) {
  const sectionPattern =
    /^  \/\/ ={50}\r?\n  \/\/ (.+)\r?\n  \/\/ ={50}$/gm;

  return [...source.matchAll(sectionPattern)].map((match) => ({
    label: match[1].trim(),
    index: match.index,
    endIndex: match.index + match[0].length
  }));
}

function createSectionBlock(movieObject) {
  return [
    "  // ==================================================",
    `  // ${movieObject.collection}`,
    "  // ==================================================",
    "",
    formatMovieObject(movieObject)
  ].join("\n");
}

function addMovieToLibrarySource(source, movieObject) {
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
      `${before},\n\n${formatMovieObject(movieObject)},\n\n${after}`;
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
      if (normalizeValue(section.label) === "games") {
        return false;
      }

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
      `${before},\n\n${createSectionBlock(movieObject)},\n\n${after}`;
  }

  return updatedSource.replace(/\n/g, lineEnding);
}

function writeMovieToLibrary(movieObject) {
  const originalSource = fs.readFileSync(
    MOVIE_LIBRARY_FILE,
    "utf8"
  );

  const updatedSource = addMovieToLibrarySource(
    originalSource,
    movieObject
  );

  const backupPath = backupMovieLibrary();
  const temporaryPath = `${MOVIE_LIBRARY_FILE}.tmp`;

  try {
    fs.writeFileSync(temporaryPath, updatedSource, "utf8");
    fs.renameSync(temporaryPath, MOVIE_LIBRARY_FILE);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) {
      fs.rmSync(temporaryPath, { force: true });
    }

    throw error;
  }

  return {
    libraryPath: MOVIE_LIBRARY_FILE,
    backupPath
  };
}

//
// Main
//

async function main() {
  console.log("");
  console.log("========================================");
  console.log("Jockisch Family Theater");
  console.log("Movie Importer - Version 1.0");
  console.log("========================================\n");

  const library = loadMovieLibrary();

  let searchTitle = "";

  while (!searchTitle) {
    searchTitle = await ask("Movie title: ");

    if (!searchTitle) {
      console.log("Please enter a movie title.");
    }
  }

  console.log(`\nSearching TMDb for "${searchTitle}"...`);

  const searchResults = (await searchTMDb(searchTitle)).slice(0, 10);

  if (searchResults.length === 0) {
    console.log("\nNo TMDb matches were found.");
    return;
  }

  printSearchResults(searchResults);

  const selectedResult = await chooseSearchResult(searchResults);

  if (!selectedResult) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  console.log("\nLoading full movie metadata...");

  const movie = await getMovieDetails(selectedResult.id);

  printSelectedMovie(movie);

  if (!movie.poster_path) {
    console.log("\nThis TMDb entry does not have a poster.");
    console.log("No files were changed.");
    return;
  }

  const suggestions = buildSuggestions(library, movie);

  console.log("\n========================================");
  console.log("Library Organization");
  console.log("========================================");

  if (suggestions.relatedCount > 0) {
    console.log(
      `Suggestions use ${suggestions.relatedCount} related existing ` +
      `${suggestions.relatedCount === 1 ? "movie" : "movies"}.`
    );
  } else {
    console.log(
      "No related library entries were found. TMDb values are being used."
    );
  }

  console.log(
    'Press Enter to accept a suggestion. Enter "-" to leave an optional field blank.\n'
  );

  const title = await askWithDefault("Title", movie.title);
  const id = await askWithDefault("ID", slugify(title));

  const collection = await askWithDefault(
    "Collection",
    suggestions.collection || title
  );

  const franchise = await askWithDefault(
    "Franchise",
    suggestions.franchise,
    { allowBlank: true }
  );

  const boothGroup = await askWithDefault(
    "Booth Group",
    suggestions.boothGroup || franchise || collection
  );

  const posterFolder = await askWithDefault(
    "Poster Folder",
    suggestions.posterFolder,
    { allowBlank: true }
  );

  const edition = await chooseEdition();

  const year = await askWithDefault(
    "Year",
    getReleaseYear(movie.release_date)
  );

  const rating = await askWithDefault(
    "Rating",
    getUsRating(movie)
  );

  const runtime = await askWithDefault(
    "Runtime",
    formatRuntime(movie.runtime)
  );

  const poster = getPosterRelativePath(posterFolder, id);

  const movieObject = {
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

  const duplicate = findDuplicateMovie(library, movieObject);

  if (duplicate) {
    console.log("\nImport stopped: this movie appears to already exist.");
    console.log(`Existing title: ${duplicate.title}`);
    console.log(`Existing ID: ${duplicate.id}`);
    console.log("No files were changed.");
    return;
  }

  printMovieObjectPreview(movieObject);

  console.log(`\nPoster path: ${poster}`);
  console.log(`Target library: ${MOVIE_LIBRARY_FILE}`);

  const approved = await confirm(
    "\nDownload the poster and add this movie"
  );

  if (!approved) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  const posterFile = getPosterFilePath(poster);

  if (fs.existsSync(posterFile)) {
    console.log("\nA poster already exists at:");
    console.log(posterFile);

    const shouldOverwrite = await confirm(
      "Overwrite the existing poster"
    );

    if (!shouldOverwrite) {
      console.log("\nImport canceled. No files were changed.");
      return;
    }
  }

  console.log("\nDownloading poster...");
  await downloadPoster(movie.poster_path, posterFile);

  console.log("Poster downloaded successfully.");

  let result;

  try {
    result = writeMovieToLibrary(movieObject);
  } catch (error) {
    if (fs.existsSync(posterFile)) {
      fs.rmSync(posterFile, { force: true });
    }

    throw error;
  }

  console.log("\n========================================");
  console.log("Import Complete");
  console.log("========================================");
  console.log(`Added: ${movieObject.title}`);
  console.log(`Collection: ${movieObject.collection}`);
  console.log(`Library: ${result.libraryPath}`);
  console.log(`Poster: ${posterFile}`);
  console.log(`Backup: ${result.backupPath}`);
}

main()
  .catch((error) => {
    console.error("\nMovie importer failed:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
  });
