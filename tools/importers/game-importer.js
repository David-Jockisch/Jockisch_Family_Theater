const fs = require("fs");
const path = require("path");
const readline = require("readline");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

//
// Configuration
//

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const GAME_LIBRARY_DIRECTORY = path.join(PROJECT_ROOT, "library", "games");
const GAME_IMPORT_BACKUP_DIRECTORY = path.join(
  PROJECT_ROOT,
  "backups",
  "game-imports"
);

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

const PLATFORM_OPTIONS = [
  // PlayStation
  { value: "ps5", label: "PlayStation 5", igdbNames: ["PlayStation 5"] },
  { value: "ps4", label: "PlayStation 4", igdbNames: ["PlayStation 4"] },
  { value: "ps3", label: "PlayStation 3", igdbNames: ["PlayStation 3"] },
  { value: "ps2", label: "PlayStation 2", igdbNames: ["PlayStation 2"] },
  { value: "ps1", label: "PlayStation", igdbNames: ["PlayStation"] },
  {
    value: "psp",
    label: "PlayStation Portable (PSP)",
    igdbNames: ["PlayStation Portable"]
  },
  {
    value: "psvita",
    label: "PlayStation Vita",
    igdbNames: ["PlayStation Vita"]
  },

  // Xbox
  {
    value: "seriesx",
    label: "Xbox Series X|S",
    igdbNames: ["Xbox Series X|S"]
  },
  { value: "xboxone", label: "Xbox One", igdbNames: ["Xbox One"] },
  { value: "xbox360", label: "Xbox 360", igdbNames: ["Xbox 360"] },
  { value: "xbox", label: "Xbox", igdbNames: ["Xbox"] },

  // Nintendo
  {
    value: "switch",
    label: "Nintendo Switch",
    igdbNames: ["Nintendo Switch"]
  },
  { value: "wii", label: "Nintendo Wii", igdbNames: ["Wii"] },
  { value: "3ds", label: "Nintendo 3DS", igdbNames: ["Nintendo 3DS"] },
  { value: "ds", label: "Nintendo DS", igdbNames: ["Nintendo DS"] },
  { value: "n64", label: "Nintendo 64", igdbNames: ["Nintendo 64"] },
  {
    value: "snes",
    label: "Super Nintendo",
    igdbNames: ["Super Nintendo Entertainment System"]
  },
  {
    value: "nes",
    label: "Nintendo Entertainment System",
    igdbNames: ["Nintendo Entertainment System"]
  },
  {
    value: "gba",
    label: "Game Boy Advance",
    igdbNames: ["Game Boy Advance"]
  },
  {
    value: "gbc",
    label: "Game Boy Color",
    igdbNames: ["Game Boy Color"]
  },
  { value: "gameboy", label: "Game Boy", igdbNames: ["Game Boy"] },

  // Sega
  {
    value: "genesis",
    label: "Sega Genesis",
    igdbNames: ["Sega Mega Drive/Genesis"]
  },

  // Other
  {
    value: "intellivision",
    label: "Mattel Intellivision",
    igdbNames: ["Intellivision"]
  }
];

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

async function choosePlatform() {
  console.log("Choose a platform:\n");

  PLATFORM_OPTIONS.forEach((platform, index) => {
    console.log(`${index + 1}) ${platform.label}`);
  });

  while (true) {
    const answer = await ask("\nPlatform number: ");
    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (
      Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 &&
      selectedIndex < PLATFORM_OPTIONS.length
    ) {
      return PLATFORM_OPTIONS[selectedIndex];
    }

    console.log("Please enter one of the listed platform numbers.");
  }
}

async function chooseOwnership() {
  console.log("\nHow do you own this game?\n");
  console.log("1) Disc / Cartridge");
  console.log("2) Digital");

  while (true) {
    const answer = await ask("\nOwnership number: ");

    if (answer === "1") {
      return "disc";
    }

    if (answer === "2") {
      return "digital";
    }

    console.log("Please enter 1 for Disc / Cartridge or 2 for Digital.");
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

function escapeIGDBString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function getReleaseYear(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }

  return String(new Date(timestamp * 1000).getUTCFullYear());
}

function formatList(values, property = "name") {
  if (!Array.isArray(values) || values.length === 0) {
    return "Unknown";
  }

  return (
    values
      .map((item) => item?.[property])
      .filter(Boolean)
      .join(", ") || "Unknown"
  );
}

function platformMatches(platform, result) {
  const resultPlatformNames = (result.platforms || []).map(
    (item) => item.name
  );

  return platform.igdbNames.some((expectedName) =>
    resultPlatformNames.includes(expectedName)
  );
}

const GAME_CATEGORY_NAMES = {
  0: "Main Game",
  1: "DLC / Add-on",
  2: "Expansion",
  3: "Bundle",
  4: "Standalone Expansion",
  5: "Mod",
  6: "Episode",
  7: "Season",
  8: "Remake",
  9: "Remaster",
  10: "Expanded Game",
  11: "Port",
  12: "Fork",
  13: "Pack",
  14: "Update"
};

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function getCategoryName(category) {
  return GAME_CATEGORY_NAMES[category] || "Unknown Type";
}

function getCategoryScore(category) {
  switch (category) {
    case 0: // Main game
      return 300;
    case 8: // Remake
    case 9: // Remaster
    case 10: // Expanded game
    case 11: // Port
      return 180;
    case 4: // Standalone expansion
      return 80;
    case 3: // Bundle
      return -100;
    case 2: // Expansion
      return -250;
    case 6: // Episode
    case 7: // Season
      return -350;
    case 1: // DLC / add-on
    case 13: // Pack
    case 14: // Update
      return -600;
    case 5: // Mod
    case 12: // Fork
      return -700;
    default:
      return 0;
  }
}

function getNamePenalty(gameName) {
  const normalizedName = normalizeSearchText(gameName);

  const strongDlcTerms = [
    "season pass",
    "year pass",
    "expansion pass",
    "dlc",
    "add on",
    "soundtrack",
    "cosmetic pack",
    "vehicle pack",
    "skin pack",
    "map pack",
    "content pack",
    "starter pack"
  ];

  const weakerDlcTerms = [
    "season ",
    "chapter ",
    "episode ",
    "pack",
    "bundle",
    "upgrade"
  ];

  if (strongDlcTerms.some((term) => normalizedName.includes(term))) {
    return -500;
  }

  if (weakerDlcTerms.some((term) => normalizedName.includes(term))) {
    return -150;
  }

  return 0;
}

function scoreSearchResult(game, platform, searchTitle) {
  const normalizedSearch = normalizeSearchText(searchTitle);
  const normalizedName = normalizeSearchText(game.name);

  let score = 0;

  if (normalizedName === normalizedSearch) {
    score += 2000;
  } else if (normalizedName.startsWith(`${normalizedSearch} `)) {
    score += 800;
  } else if (normalizedName.includes(normalizedSearch)) {
    score += 350;
  }

  if (platformMatches(platform, game)) {
    score += 500;
  }

  score += getCategoryScore(game.category);
  score += getNamePenalty(game.name);

  if (game.cover?.image_id) {
    score += 25;
  }

  return score;
}

function sortSearchResults(results, platform, searchTitle) {
  return [...results]
    .map((game) => ({
      ...game,
      searchScore: scoreSearchResult(game, platform, searchTitle)
    }))
    .sort((first, second) => {
      if (first.searchScore !== second.searchScore) {
        return second.searchScore - first.searchScore;
      }

      return (
        (second.first_release_date || 0) -
        (first.first_release_date || 0)
      );
    });
}

function getPosterRelativePath(platform, title) {
  return `/assets/posters/games/${platform.value}/${slugify(title)}.jpg`;
}

function getPosterFilePath(platform, title) {
  return path.join(
    PROJECT_ROOT,
    getPosterRelativePath(platform, title).replace(/^[/\\]+/, "")
  );
}

function getSortTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCollectionName(game) {
  return (
    game.collection?.name ||
    game.franchises?.[0]?.name ||
    game.name ||
    "Unknown"
  );
}

function getPlatformLibraryPath(platform) {
  return path.join(GAME_LIBRARY_DIRECTORY, `${platform.value}.js`);
}

function getTheaterEnabledDefault(platform) {
  const libraryPath = getPlatformLibraryPath(platform);

  if (!fs.existsSync(libraryPath)) {
    return false;
  }

  const librarySource = fs.readFileSync(libraryPath, "utf8");
  const matches = [
    ...librarySource.matchAll(/theaterEnabled:\s*(true|false)/g)
  ].map((match) => match[1] === "true");

  if (matches.length === 0) {
    return false;
  }

  const firstValue = matches[0];
  const allMatch = matches.every((value) => value === firstValue);

  if (!allMatch) {
    console.log(
      `Warning: ${platform.value}.js contains mixed theaterEnabled values.`
    );
    console.log("Using false as the safe preview default.");
    return false;
  }

  return firstValue;
}

function normalizeDuplicateValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’]/g, "\'")
    .trim()
    .toLowerCase();
}

function findDuplicateGame(platform, gameObject) {
  const libraryPath = getPlatformLibraryPath(platform);

  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Target library does not exist: ${libraryPath}`);
  }

  const librarySource = fs.readFileSync(libraryPath, "utf8");
  const idMatches = [
    ...librarySource.matchAll(/\bid:\s*["\']([^"\']+)["\']/g)
  ].map((match) => match[1]);
  const titleMatches = [
    ...librarySource.matchAll(/\btitle:\s*["\']([^"\']+)["\']/g)
  ].map((match) => match[1]);

  const duplicateId = idMatches.find(
    (id) => normalizeDuplicateValue(id) === normalizeDuplicateValue(gameObject.id)
  );
  const duplicateTitle = titleMatches.find(
    (title) =>
      normalizeDuplicateValue(title) === normalizeDuplicateValue(gameObject.title)
  );

  if (!duplicateId && !duplicateTitle) {
    return null;
  }

  return { duplicateId, duplicateTitle };
}

function createTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_` +
    `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

function indentBlock(value, spaces) {
  const indentation = " ".repeat(spaces);
  return String(value)
    .split(/\r?\n/)
    .map((line) => `${indentation}${line}`)
    .join("\n");
}

function writeGameToLibrary(platform, gameObject) {
  const libraryPath = getPlatformLibraryPath(platform);

  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Target library does not exist: ${libraryPath}`);
  }

  const originalSource = fs.readFileSync(libraryPath, "utf8");
  const lineEnding = originalSource.includes("\r\n") ? "\r\n" : "\n";
  const normalizedSource = originalSource.replace(/\r\n/g, "\n");

  const arrayClosePattern = /\n\];(?=\n\s*export\s+default\s+)/;

  if (!arrayClosePattern.test(normalizedSource)) {
    throw new Error(
      `Could not find the end of the game array in ${path.basename(libraryPath)}.`
    );
  }

  const objectText = indentBlock(formatJavaScriptValue(gameObject), 2);
  const updatedSource = normalizedSource.replace(
    arrayClosePattern,
    `,\n\n${objectText}\n];`
  );

  fs.mkdirSync(GAME_IMPORT_BACKUP_DIRECTORY, { recursive: true });

  const backupName = `${platform.value}-${createTimestamp()}.js`;
  const backupPath = path.join(GAME_IMPORT_BACKUP_DIRECTORY, backupName);
  fs.copyFileSync(libraryPath, backupPath);

  const temporaryPath = `${libraryPath}.tmp`;

  try {
    fs.writeFileSync(
      temporaryPath,
      updatedSource.replace(/\n/g, lineEnding),
      "utf8"
    );
    fs.renameSync(temporaryPath, libraryPath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) {
      fs.rmSync(temporaryPath, { force: true });
    }

    throw error;
  }

  return { libraryPath, backupPath };
}

function buildGameObject(game, platform, ownership) {
  return {
    id: slugify(game.name),
    title: game.name,
    sortTitle: getSortTitle(game.name),
    platform: platform.value,
    release: getReleaseYear(game.first_release_date),
    publisher: getCompanyNames(game, "publisher"),
    developer: getCompanyNames(game, "developer"),
    genre: formatList(game.genres),
    players: "Unknown",
    rating: "Unknown",
    collection: getCollectionName(game),
    ownership: [ownership],
    poster: getPosterRelativePath(platform, game.name),
    theaterEnabled: getTheaterEnabledDefault(platform)
  };
}

function formatJavaScriptValue(value, indent = 0) {
  const spacing = " ".repeat(indent);

  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  const lines = Object.entries(value).map(([key, itemValue]) => {
    return `${" ".repeat(indent + 2)}${key}: ${formatJavaScriptValue(
      itemValue,
      indent + 2
    )}`;
  });

  return `{\n${lines.join(",\n")}\n${spacing}}`;
}

function printGameObjectPreview(gameObject) {
  console.log("\n========================================");
  console.log("Future Library Entry Preview");
  console.log("========================================\n");
  console.log(formatJavaScriptValue(gameObject));
}

//
// Twitch authentication
//

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is missing from .env."
    );
  }

  const url = new URL("https://id.twitch.tv/oauth2/token");

  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("client_secret", CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(url, {
    method: "POST"
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Twitch authentication failed: ${JSON.stringify(data)}`
    );
  }

  return data.access_token;
}

//
// IGDB requests
//

async function requestIGDB(query, token) {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    body: query
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`IGDB request failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function searchIGDB(title, token) {
  const safeTitle = escapeIGDBString(title);

  const query = `
search "${safeTitle}";
fields id,name,category,first_release_date,platforms.name,cover.image_id;
limit 100;
`;

  return requestIGDB(query, token);
}

async function getGameDetails(gameId, token) {
  const query = `
fields
  id,
  name,
  slug,
  category,
  summary,
  storyline,
  first_release_date,
  platforms.name,
  genres.name,
  themes.name,
  game_modes.name,
  player_perspectives.name,
  involved_companies.company.name,
  involved_companies.developer,
  involved_companies.publisher,
  collection.name,
  franchises.name,
  cover.image_id,
  url;
where id = ${Number(gameId)};
limit 1;
`;

  const results = await requestIGDB(query, token);
  return results[0] || null;
}

//
// Poster handling
//

async function downloadCover(imageId, destination) {
  const imageUrl =
    "https://images.igdb.com/igdb/image/upload/" +
    `t_cover_big_2x/${imageId}.jpg`;

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Cover download failed with status ${response.status}.`
    );
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.writeFileSync(destination, imageBuffer);
}

//
// Display
//

function printSearchResults(results, selectedPlatform) {
  console.log("\nIGDB matches:\n");

  results.forEach((game, index) => {
    const year = getReleaseYear(game.first_release_date);
    const platforms = formatList(game.platforms);
    const matchMarker = platformMatches(selectedPlatform, game)
      ? " [platform match]"
      : "";

    const category = getCategoryName(game.category);

    console.log(`${index + 1}) ${game.name} (${year})${matchMarker}`);
    console.log(`   ${category} | ${platforms}`);
  });
}

function getCompanyNames(game, role) {
  const companies = (game.involved_companies || [])
    .filter((entry) => entry?.[role])
    .map((entry) => entry.company?.name)
    .filter(Boolean);

  return companies.length > 0 ? companies.join(", ") : "Unknown";
}

function printSelectedGame(game, platform) {
  const coverUrl = game.cover?.image_id
    ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${game.cover.image_id}.jpg`
    : "None";

  const posterPath = getPosterRelativePath(platform, game.name);

  console.log("\n========================================");
  console.log("Selected Game");
  console.log("========================================");
  console.log(`Library platform: ${platform.value}`);
  console.log(`Title: ${game.name}`);
  console.log(`IGDB ID: ${game.id}`);
  console.log(`Slug: ${slugify(game.name)}`);
  console.log(`Release: ${getReleaseYear(game.first_release_date)}`);
  console.log(`Type: ${getCategoryName(game.category)}`);
  console.log(`Platforms: ${formatList(game.platforms)}`);
  console.log(`Developer: ${getCompanyNames(game, "developer")}`);
  console.log(`Publisher: ${getCompanyNames(game, "publisher")}`);
  console.log(`Genres: ${formatList(game.genres)}`);
  console.log(`Themes: ${formatList(game.themes)}`);
  console.log(`Game modes: ${formatList(game.game_modes)}`);
  console.log(
    `Player perspectives: ${formatList(game.player_perspectives)}`
  );
  console.log(`Collection: ${game.collection?.name || "None"}`);
  console.log(`Franchises: ${formatList(game.franchises)}`);
  console.log(`Cover: ${coverUrl}`);
  console.log(`Poster path: ${posterPath}`);
  console.log(`IGDB page: ${game.url || "Unknown"}`);

  if (game.summary) {
    console.log("\nSummary:");
    console.log(game.summary);
  }

  if (game.storyline) {
    console.log("\nStoryline:");
    console.log(game.storyline);
  }
}

//
// Main
//

async function main() {
  console.log("");
  console.log("========================================");
  console.log("Jockisch Family Theater");
  console.log("Game Importer - Version 2.3");
  console.log("========================================\n");

  const platform = await choosePlatform();

  let title = "";

  while (!title) {
    title = await ask("\nGame title: ");

    if (!title) {
      console.log("Please enter a game title.");
    }
  }

  console.log("\nAuthenticating with IGDB...");
  const token = await getAccessToken();

  console.log(`Searching IGDB for "${title}"...`);
  const searchResults = await searchIGDB(title, token);

  if (searchResults.length === 0) {
    console.log("\nNo IGDB matches were found.");
    return;
  }

  const sortedResults = sortSearchResults(
    searchResults,
    platform,
    title
  ).slice(0, 10);

  printSearchResults(sortedResults, platform);

  const selectedResult = await chooseSearchResult(sortedResults);

  if (!selectedResult) {
    console.log("\nImport canceled. No files were changed.");
    return;
  }

  console.log("\nLoading full game metadata...");
  const gameDetails = await getGameDetails(selectedResult.id, token);

  if (!gameDetails) {
    throw new Error("IGDB did not return details for the selected game.");
  }

  printSelectedGame(gameDetails, platform);

  const ownership = await chooseOwnership();
  const gameObject = buildGameObject(
    gameDetails,
    platform,
    ownership
  );

  const duplicate = findDuplicateGame(platform, gameObject);

  if (duplicate) {
    console.log("\nImport stopped: this game appears to already exist.");

    if (duplicate.duplicateId) {
      console.log(`Matching ID: ${duplicate.duplicateId}`);
    }

    if (duplicate.duplicateTitle) {
      console.log(`Matching title: ${duplicate.duplicateTitle}`);
    }

    console.log("No files were changed.");
    return;
  }

  if (!gameDetails.cover?.image_id) {
    console.log("\nThis IGDB entry does not have a cover image.");
    console.log("No files were changed.");
    return;
  }

  const posterFile = getPosterFilePath(platform, gameDetails.name);

  console.log("");
  const shouldDownload = await confirm("Download this poster");

  if (!shouldDownload) {
    console.log("\nDownload canceled. No files were changed.");
    return;
  }

  if (fs.existsSync(posterFile)) {
    console.log("\nA poster already exists at:");
    console.log(posterFile);

    const shouldOverwrite = await confirm("Overwrite the existing poster");

    if (!shouldOverwrite) {
      console.log("\nExisting poster kept. No files were changed.");
      return;
    }
  }

  console.log("\nDownloading poster...");
  await downloadCover(gameDetails.cover.image_id, posterFile);

  console.log("\nPoster downloaded successfully.");
  console.log(`Saved: ${posterFile}`);
  console.log(
    `Library path: ${getPosterRelativePath(platform, gameDetails.name)}`
  );

  console.log(`\nTarget library: ${getPlatformLibraryPath(platform)}`);
  printGameObjectPreview(gameObject);

  console.log("");
  const approved = await confirm(
    "Add this game to the platform library"
  );

  if (!approved) {
    console.log("\nImport canceled. No library files were changed.");
    console.log("The downloaded poster was left in place.");
    return;
  }

  const result = writeGameToLibrary(platform, gameObject);

  console.log("\n========================================");
  console.log("Import Complete");
  console.log("========================================");
  console.log(`Added: ${gameObject.title}`);
  console.log(`Library: ${result.libraryPath}`);
  console.log(`Poster: ${posterFile}`);
  console.log(`Backup: ${result.backupPath}`);
}

main()
  .catch((error) => {
    console.error("\nGame importer failed:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
  });
