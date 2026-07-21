const fs = require("fs");
const path = require("path");
const vm = require("vm");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

//
// Configuration
//

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const GAME_LIBRARY_DIRECTORY = path.join(
  PROJECT_ROOT,
  "library",
  "games"
);

const REVIEW_LOG_FILE = path.join(
  __dirname,
  "review-game-artwork.txt"
);

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

// Safety setting for the first full test.
// Change this to null after confirming the results look correct.
const DOWNLOAD_LIMIT = null;

// A match must score at least this high before downloading automatically.
const MINIMUM_MATCH_SCORE = 100;

// Small delay between IGDB searches.
// This helps avoid making requests too quickly.
const REQUEST_DELAY_MS = 300;

//
// General helpers
//

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getReleaseYear(timestamp) {
  if (!timestamp) {
    return null;
  }

  return String(
    new Date(timestamp * 1000).getUTCFullYear()
  );
}

function getPlatformName(platform) {
  const platformNames = {
    xbox: "Xbox Series X|S",
    xboxone: "Xbox One",
    xbox360: "Xbox 360",
    xboxoriginal: "Xbox",
    ps5: "PlayStation 5",
    ps4: "PlayStation 4",
    ps3: "PlayStation 3",
    ps2: "PlayStation 2",
    ps1: "PlayStation",
    switch: "Nintendo Switch",
    wiiu: "Wii U",
    wii: "Wii",
    gamecube: "Nintendo GameCube",
    "3ds": "Nintendo 3DS",
  };

  return platformNames[platform] || platform;
}

function platformMatches(gamePlatform, resultPlatforms) {
  if (!Array.isArray(resultPlatforms)) {
    return false;
  }

  const expectedPlatform = normalizeTitle(
    getPlatformName(gamePlatform)
  );

  return resultPlatforms.some((platform) => {
    return normalizeTitle(platform.name) === expectedPlatform;
  });
}

function formatGameLabel(game) {
  const release = game.release ? `, ${game.release}` : "";
  return `${game.title} [${game.platform}${release}]`;
}

//
// Library discovery
//

function getGameLibraryFiles() {
  if (!fs.existsSync(GAME_LIBRARY_DIRECTORY)) {
    throw new Error(
      `Game library directory does not exist:\n${GAME_LIBRARY_DIRECTORY}`
    );
  }

  const excludedFiles = new Set([
    "index.js",
    "game-library.js",
  ]);

  return fs
    .readdirSync(GAME_LIBRARY_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".js"))
    .filter((fileName) => !excludedFiles.has(fileName))
    .sort()
    .map((fileName) =>
      path.join(GAME_LIBRARY_DIRECTORY, fileName)
    );
}

function loadGameLibrary(libraryFile) {
  const source = fs.readFileSync(libraryFile, "utf8");

  const declarationMatch = source.match(
    /const\s+([A-Za-z0-9_$]+)\s*=\s*\[/
  );

  if (!declarationMatch) {
    throw new Error(
      `Could not find a game array in ${path.basename(libraryFile)}.`
    );
  }

  const libraryVariable = declarationMatch[1];

  const arrayStart =
    declarationMatch.index +
    declarationMatch[0].lastIndexOf("[");

  const exportPattern = new RegExp(
    `export\\s+default\\s+${libraryVariable}\\s*;?`
  );

  const exportMatch = exportPattern.exec(source);

  if (!exportMatch) {
    throw new Error(
      `Could not find the default export in ${path.basename(
        libraryFile
      )}.`
    );
  }

  let arraySource = source
    .slice(arrayStart, exportMatch.index)
    .trim();

  arraySource = arraySource.replace(/;\s*$/, "");

  const context = {
    result: null,
  };

  vm.createContext(context);

  try {
    vm.runInContext(
      `result = ${arraySource}`,
      context,
      {
        filename: libraryFile,
      }
    );
  } catch (error) {
    throw new Error(
      `Could not read ${path.basename(
        libraryFile
      )}: ${error.message}`
    );
  }

  if (!Array.isArray(context.result)) {
    throw new Error(
      `${path.basename(
        libraryFile
      )} did not contain a readable game array.`
    );
  }

  return context.result;
}

function loadAllGameLibraries() {
  const libraryFiles = getGameLibraryFiles();
  const libraries = [];

  for (const libraryFile of libraryFiles) {
    const games = loadGameLibrary(libraryFile);

    libraries.push({
      file: libraryFile,
      name: path.basename(libraryFile),
      games,
    });
  }

  return libraries;
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

  const url = new URL(
    "https://id.twitch.tv/oauth2/token"
  );

  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set(
    "client_secret",
    CLIENT_SECRET
  );
  url.searchParams.set(
    "grant_type",
    "client_credentials"
  );

  const response = await fetch(url, {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Twitch authentication failed: ${JSON.stringify(
        data
      )}`
    );
  }

  return data.access_token;
}

//
// IGDB searching and matching
//


function getSearchTitle(title) {
  return String(title || "")
    // Remove text in parentheses.
    .replace(/\([^)]*\)/g, "")

    // Remove text in square brackets.
    .replace(/\[[^\]]*]/g, "")

    // Remove common retail edition wording.
    .replace(
      /\b(GOTY|Game of the Year|Gold Edition|Collector'?s Edition|Limited Edition|Day One Edition|Bonus Edition|Platinum Hits|Greatest Hits|Complete Edition|Ultimate Edition|Standard Edition|Launch Edition|Digital Deluxe Edition)\b/gi,
      ""
    )

    // Remove trailing platform labels.
    .replace(
      /\b(PlayStation 5|PlayStation 4|Series X|Xbox Series X)\b/gi,
      ""
    )

    // Clean up extra punctuation and spacing.
    .replace(/\s*[-–:]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchIGDB(game, token) {
  const safeTitle = getSearchTitle(game.title)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  const query = `
search "${safeTitle}";
fields id,name,first_release_date,platforms.name,cover.image_id;
limit 20;
`;

  const response = await fetch(
    "https://api.igdb.com/v4/games",
    {
      method: "POST",
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: query,
    }
  );

  const results = await response.json();

  if (!response.ok) {
    throw new Error(
      `IGDB search failed: ${JSON.stringify(results)}`
    );
  }

  return results;
}

function scoreMatch(game, result) {
  let score = 0;

  const libraryTitle = normalizeTitle(game.title);
  const resultTitle = normalizeTitle(result.name);

  const resultYear = getReleaseYear(
    result.first_release_date
  );

  if (resultTitle === libraryTitle) {
    score += 100;
  } else if (
    resultTitle.includes(libraryTitle) ||
    libraryTitle.includes(resultTitle)
  ) {
    score += 40;
  }

  if (
    game.release &&
    resultYear &&
    String(game.release) === resultYear
  ) {
    score += 30;
  }

  if (
    platformMatches(
      game.platform,
      result.platforms
    )
  ) {
    score += 50;
  }

  if (result.cover?.image_id) {
    score += 10;
  }

  return score;
}

function chooseBestMatch(game, results) {
  const scoredResults = results
    .map((result) => ({
      result,
      score: scoreMatch(game, result),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    best: scoredResults[0] || null,
    secondBest: scoredResults[1] || null,
  };
}

function matchNeedsReview(best, secondBest) {
  if (!best) {
    return true;
  }

  if (best.score < MINIMUM_MATCH_SCORE) {
    return true;
  }

  if (
    secondBest &&
    best.score - secondBest.score < 20
  ) {
    return true;
  }

  return false;
}

//
// Poster handling
//

function getPosterFilePath(game) {
  if (!game.poster) {
    throw new Error(
      `${game.title} does not have a poster path.`
    );
  }

  const relativePosterPath = game.poster.replace(
    /^[/\\]+/,
    ""
  );

  return path.join(
    PROJECT_ROOT,
    relativePosterPath
  );
}

async function downloadCover(
  imageId,
  destination
) {
  const imageUrl =
    "https://images.igdb.com/igdb/image/upload/" +
    `t_cover_big_2x/${imageId}.jpg`;

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Cover download failed with status ${response.status}.`
    );
  }

  const imageBuffer = Buffer.from(
    await response.arrayBuffer()
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true,
  });

  fs.writeFileSync(destination, imageBuffer);
}

//
// Reporting
//

function getMatchSummary(matchEntry) {
  if (!matchEntry) {
    return null;
  }

  const match = matchEntry.result;

  return {
    name: match.name,
    year:
      getReleaseYear(match.first_release_date) ||
      "Unknown",
    platforms:
      match.platforms
        ?.map((platform) => platform.name)
        .join(", ") || "Unknown",
    score: matchEntry.score,
  };
}

function printMatchDetails(best) {
  const summary = getMatchSummary(best);

  console.log(`  Match: ${summary.name}`);
  console.log(`  Release: ${summary.year}`);
  console.log(`  Platforms: ${summary.platforms}`);
  console.log(`  Match score: ${summary.score}`);
}

function printProgressCounters({
  downloaded,
  skipped,
  review,
  failed,
}) {
  console.log(
    `  Status — Downloaded: ${downloaded} | ` +
      `Skipped: ${skipped} | ` +
      `Review: ${review} | ` +
      `Failed: ${failed}\n`
  );
}

function writeReviewLog({
  processed,
  totalGames,
  downloaded,
  skipped,
  review,
  failed,
  reviewItems,
  failedItems,
}) {
  const lines = [];

  lines.push("Jockisch Family Theater");
  lines.push("Game Artwork Review Log");
  lines.push("========================================");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push(`Processed: ${processed}/${totalGames}`);
  lines.push(`Downloaded: ${downloaded}`);
  lines.push(`Skipped existing: ${skipped}`);
  lines.push(`Needs review: ${review}`);
  lines.push(`Failed: ${failed}`);
  lines.push("");

  lines.push("MANUAL REVIEW");
  lines.push("----------------------------------------");

  if (reviewItems.length === 0) {
    lines.push("No games require manual review.");
    lines.push("");
  } else {
    for (const item of reviewItems) {
      lines.push(formatGameLabel(item.game));
      lines.push(`Reason: ${item.reason}`);
      lines.push(`Library file: ${item.libraryName}`);

      if (item.best) {
        lines.push(
          `Best match: ${item.best.name} (${item.best.year})`
        );
        lines.push(
          `Best platforms: ${item.best.platforms}`
        );
        lines.push(`Best score: ${item.best.score}`);
      }

      if (item.secondBest) {
        lines.push(
          `Second match: ${item.secondBest.name} (${item.secondBest.year})`
        );
        lines.push(
          `Second platforms: ${item.secondBest.platforms}`
        );
        lines.push(
          `Second score: ${item.secondBest.score}`
        );
      }

      lines.push("");
    }
  }

  lines.push("FAILURES");
  lines.push("----------------------------------------");

  if (failedItems.length === 0) {
    lines.push("No failures occurred.");
    lines.push("");
  } else {
    for (const item of failedItems) {
      lines.push(formatGameLabel(item.game));
      lines.push(`Error: ${item.error}`);
      lines.push(`Library file: ${item.libraryName}`);
      lines.push("");
    }
  }

  fs.writeFileSync(
    REVIEW_LOG_FILE,
    `${lines.join("\n")}\n`,
    "utf8"
  );
}

function printSummary({
  processed,
  totalGames,
  downloaded,
  skipped,
  review,
  failed,
  reviewItems,
  failedItems,
}) {
  writeReviewLog({
    processed,
    totalGames,
    downloaded,
    skipped,
    review,
    failed,
    reviewItems,
    failedItems,
  });

  console.log("\n==============================");
  console.log("Artwork download complete");
  console.log("==============================");

  console.log(`Processed: ${processed}/${totalGames}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Needs review: ${review}`);
  console.log(`Failed: ${failed}`);
  console.log(`Review log: ${REVIEW_LOG_FILE}`);
}

//
// Main process
//

async function run() {
  const libraries = loadAllGameLibraries();

  const totalGames = libraries.reduce(
    (total, library) =>
      total + library.games.length,
    0
  );

  console.log(
    `Found ${libraries.length} game library files.`
  );

  console.log(
    `Found ${totalGames} total games.\n`
  );

  if (DOWNLOAD_LIMIT === null) {
    console.log(
      "Download limit: None — processing the full library.\n"
    );
  } else {
    console.log(
      `Download limit: ${DOWNLOAD_LIMIT}\n`
    );
  }

  const token = await getAccessToken();

  let processed = 0;
  let downloaded = 0;
  let skipped = 0;
  let review = 0;
  let failed = 0;

  const reviewItems = [];
  const failedItems = [];

  for (const library of libraries) {
    console.log(
      `\n=== ${library.name} (${library.games.length} games) ===\n`
    );

    for (const game of library.games) {
      processed += 1;

      console.log(
        `[${processed}/${totalGames}] ${game.title}`
      );

      let posterFile;

      try {
        posterFile = getPosterFilePath(game);
      } catch (error) {
        console.log(`  ✗ ${error.message}`);

        failed += 1;
        failedItems.push({
          game,
          libraryName: library.name,
          error: error.message,
        });

        printProgressCounters({
          downloaded,
          skipped,
          review,
          failed,
        });

        continue;
      }

      if (fs.existsSync(posterFile)) {
        console.log("  ✓ Poster already exists");

        skipped += 1;

        printProgressCounters({
          downloaded,
          skipped,
          review,
          failed,
        });

        continue;
      }

      try {
        const results = await searchIGDB(
          game,
          token
        );

        const { best, secondBest } =
          chooseBestMatch(game, results);

        if (!best) {
          console.log("  ? No IGDB match found");

          review += 1;

          reviewItems.push({
            game,
            libraryName: library.name,
            reason: "No IGDB match found",
            best: null,
            secondBest: null,
          });

          printProgressCounters({
            downloaded,
            skipped,
            review,
            failed,
          });

          await delay(REQUEST_DELAY_MS);
          continue;
        }

        printMatchDetails(best);

        if (matchNeedsReview(best, secondBest)) {
          console.log("  ? Match needs manual review");

          review += 1;

          reviewItems.push({
            game,
            libraryName: library.name,
            reason:
              best.score < MINIMUM_MATCH_SCORE
                ? `Best score is below ${MINIMUM_MATCH_SCORE}`
                : "Top two matches are too close",
            best: getMatchSummary(best),
            secondBest: getMatchSummary(secondBest),
          });

          printProgressCounters({
            downloaded,
            skipped,
            review,
            failed,
          });

          await delay(REQUEST_DELAY_MS);
          continue;
        }

        const imageId = best.result.cover?.image_id;

        if (!imageId) {
          console.log("  ? Match has no cover image");

          review += 1;

          reviewItems.push({
            game,
            libraryName: library.name,
            reason: "Matched game has no cover",
            best: getMatchSummary(best),
            secondBest: getMatchSummary(secondBest),
          });

          printProgressCounters({
            downloaded,
            skipped,
            review,
            failed,
          });

          await delay(REQUEST_DELAY_MS);
          continue;
        }

        await downloadCover(
          imageId,
          posterFile
        );

        console.log("  ↓ Downloaded");
        console.log(`  ${posterFile}`);

        downloaded += 1;

        printProgressCounters({
          downloaded,
          skipped,
          review,
          failed,
        });

        if (
          DOWNLOAD_LIMIT !== null &&
          downloaded >= DOWNLOAD_LIMIT
        ) {
          console.log("Download limit reached.");

          printSummary({
            processed,
            totalGames,
            downloaded,
            skipped,
            review,
            failed,
            reviewItems,
            failedItems,
          });

          return;
        }

        await delay(REQUEST_DELAY_MS);
      } catch (error) {
        console.log(`  ✗ ${error.message}`);

        failed += 1;
        failedItems.push({
          game,
          libraryName: library.name,
          error: error.message,
        });

        printProgressCounters({
          downloaded,
          skipped,
          review,
          failed,
        });

        await delay(REQUEST_DELAY_MS);
      }
    }
  }

  printSummary({
    processed,
    totalGames,
    downloaded,
    skipped,
    review,
    failed,
    reviewItems,
    failedItems,
  });
}

run().catch((error) => {
  console.error("\nArtwork downloader failed:");
  console.error(error.message);
  process.exitCode = 1;
});
