const fs = require("fs");
const path = require("path");

//
// Paths
//

const IMPORTER_DIR = __dirname;
const PROJECT_ROOT = path.resolve(IMPORTER_DIR, "..", "..");

const CSV_PATH = path.join(
  IMPORTER_DIR,
  "data",
  "icollect-games.csv"
);

const GAME_LIBRARY_DIR = path.join(
  PROJECT_ROOT,
  "library",
  "games"
);

const BACKUP_DIR = path.join(
  PROJECT_ROOT,
  "backups",
  "game-imports"
);

//
// Platform normalization
//

const PLATFORM_MAP = {
  "Sony PlayStation 5 (PS5)": "ps5",
  "Sony PlayStation 4 (PS4)": "ps4",
  "Sony PlayStation 3 (PS3)": "ps3",
  "Sony PlayStation 2 (PS2)": "ps2",
  "Sony PlayStation": "ps",
  "Sony PSP": "psp",
  "Sony PlayStation Vita": "psvita",

  "Microsoft Xbox": "xbox",
  "Microsoft Xbox 360": "xbox360",
  "Microsoft Xbox One": "xboxone",
  "Microsoft Xbox Series X": "seriesx",
  "Microsoft Xbox Series X/S": "seriesx",

  "Nintendo Switch": "switch",
  "Nintendo Wii": "wii",
  "Nintendo 3DS": "3ds",
  "Nintendo DS": "ds",
  "Nintendo 64": "n64",
  "Nintendo Super Nintendo": "snes",
  "Nintendo Entertainment System": "nes",
  "Nintendo Game Boy Advance": "gba",
  "Nintendo Game Boy Color": "gbc",
  "Nintendo Game Boy": "gameboy",

  "Sega Genesis": "genesis",
  "Mattel Intellivision": "intellivision"
};

//
// CSV parser
//

function parseCsv(text) {
  const rows = [];

  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);

    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function rowsToObjects(rows) {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((row) => {
    const item = {};

    headers.forEach((header, index) => {
      item[header] = (row[index] || "").trim();
    });

    return item;
  });
}

//
// Game formatting
//

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getReleaseYear(releaseDate) {
  const match = String(releaseDate).match(/^(\d{4})/);
  return match ? match[1] : "";
}

function getSortTitle(title) {
  return title
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePlatform(platformName) {
  if (PLATFORM_MAP[platformName]) {
    return PLATFORM_MAP[platformName];
  }

  const lowerPlatform = platformName.toLowerCase();

  // Accept platform values that are already normalized.
  if (lowerPlatform === "xbox") return "xbox";
  if (lowerPlatform === "xbox360") return "xbox360";
  if (lowerPlatform === "xboxone") return "xboxone";
  if (lowerPlatform === "seriesx") return "seriesx";

  if (lowerPlatform === "ps1") return "ps1";
  if (lowerPlatform === "ps2") return "ps2";
  if (lowerPlatform === "ps3") return "ps3";
  if (lowerPlatform === "ps4") return "ps4";
  if (lowerPlatform === "ps5") return "ps5";
  if (lowerPlatform === "psp") return "psp";
  if (lowerPlatform === "psvita") return "psvita";

  if (lowerPlatform.includes("playstation 5")) return "ps5";
  if (lowerPlatform.includes("playstation 4")) return "ps4";
  if (lowerPlatform.includes("playstation 3")) return "ps3";
  if (lowerPlatform.includes("playstation 2")) return "ps2";
  if (lowerPlatform.includes("playstation vita")) return "psvita";
  if (lowerPlatform.includes("psp")) return "psp";

  if (lowerPlatform === "microsoft xbox") return "xbox";
  if (lowerPlatform.includes("xbox 360")) return "xbox360";
  if (lowerPlatform.includes("xbox one")) return "xboxone";
  if (lowerPlatform.includes("xbox series")) return "seriesx";

if (lowerPlatform === "gameboy") return "gameboy";
if (lowerPlatform === "gbc") return "gbc";
if (lowerPlatform === "gba") return "gba";
if (lowerPlatform === "nes") return "nes";
if (lowerPlatform === "snes") return "snes";
if (lowerPlatform === "n64") return "n64";
if (lowerPlatform === "ds") return "ds";
if (lowerPlatform === "3ds") return "3ds";
if (lowerPlatform === "wii") return "wii";
if (lowerPlatform === "switch") return "switch";
if (lowerPlatform === "genesis") return "genesis";
if (lowerPlatform === "intellivision") return "intellivision";
if (lowerPlatform === "psvr") return "psvr";
  return null;
}
function createGame(record, platform) {
  const title = record.Title.trim();
  const collection = record.Series.trim() || title;

  return {
    id: slugify(title),
    title,
    sortTitle: getSortTitle(title),
    platform,
    release: getReleaseYear(record["Release Date"]),
    publisher: record.Publisher.trim(),
    developer: record.Developers.trim(),
    genre: record.Genre.trim(),
    players: record.Players.trim(),
    rating: record.Rating.trim(),
    collection,
    ownership: ["disc"],
    poster: `/assets/posters/games/${platform}/${slugify(title)}.jpg`,
    theaterEnabled: ["ps5", "ps4", "xbox"].includes(platform)
  };
}

//
// JavaScript output formatting
//

function formatProperty(name, value, indent = "    ") {
  return `${indent}${name}: ${JSON.stringify(value)}`;
}

function formatGame(game) {
  const lines = [
    "  {",
    `    id: ${JSON.stringify(game.id)},`,
    `    title: ${JSON.stringify(game.title)},`,
    `    sortTitle: ${JSON.stringify(game.sortTitle)},`,
    `    platform: ${JSON.stringify(game.platform)},`,
    `    release: ${JSON.stringify(game.release)},`,
    `    publisher: ${JSON.stringify(game.publisher)},`,
    `    developer: ${JSON.stringify(game.developer)},`,
    `    genre: ${JSON.stringify(game.genre)},`,
    `    players: ${JSON.stringify(game.players)},`,
    `    rating: ${JSON.stringify(game.rating)},`,
    `    collection: ${JSON.stringify(game.collection)},`,
    `    ownership: ${JSON.stringify(game.ownership)},`,
    `    poster: ${JSON.stringify(game.poster)},`,
    `    theaterEnabled: ${game.theaterEnabled}`,
    "  }"
  ];

  return lines.join("\n");
}
function createLibraryFile(platform, games) {
  const variableName = `${platform}Games`;

  const formattedGames = games
    .map((game) => formatGame(game))
    .join(",\n\n");

  return `const ${variableName} = [\n${formattedGames}\n];\n\nexport default ${variableName};\n`;
}

//
// Backup existing file
//

function backupExistingFile(outputPath, platform) {
  if (!fs.existsSync(outputPath)) {
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupPath = path.join(
    BACKUP_DIR,
    `${platform}-${timestamp}.js`
  );

  fs.copyFileSync(outputPath, backupPath);

  console.log(`Backup created: ${backupPath}`);
}

//
// Main importer
//

function main() {
  const requestedPlatform = (
    process.argv[2] || "ps5"
  ).toLowerCase();

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(
      `CSV file not found:\n${CSV_PATH}`
    );
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csvText);
  const records = rowsToObjects(rows);

  const collectionRecords = records.filter((record) => {
    return (
      record["Collection/Wishlist"]
        .trim()
        .toLowerCase() === "collection"
    );
  });

  const matchingRecords = collectionRecords.filter((record) => {
    return normalizePlatform(record.Platform) === requestedPlatform;
  });

  const games = matchingRecords
    .filter((record) => record.Title.trim() !== "")
    .map((record) => createGame(record, requestedPlatform))
    .sort((a, b) =>
      a.sortTitle.localeCompare(b.sortTitle, undefined, {
        sensitivity: "base",
        numeric: true
      })
    );

  if (games.length === 0) {
    throw new Error(
      `No collection games found for platform "${requestedPlatform}".`
    );
  }

  fs.mkdirSync(GAME_LIBRARY_DIR, { recursive: true });

  const outputPath = path.join(
    GAME_LIBRARY_DIR,
    `${requestedPlatform}.js`
  );

  backupExistingFile(outputPath, requestedPlatform);

  const output = createLibraryFile(
    requestedPlatform,
    games
  );

  fs.writeFileSync(outputPath, output, "utf8");

  console.log("");
  console.log("Game import complete.");
  console.log(`Platform: ${requestedPlatform}`);
  console.log(`Games imported: ${games.length}`);
  console.log(`Output: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("Game import failed.");
  console.error(error.message);
  process.exitCode = 1;
}