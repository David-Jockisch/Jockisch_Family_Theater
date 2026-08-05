import gameLibrary from "../../library/games/game-library.js";
import playlistLibrary from "../../library/playlists/playlist-library.js";
import accessibleMediaLibrary from "../../library/accessible-media/accessible-media-library.js";
import seriesLibrary from "../../library/series/series-library.js";

const byId = id => document.getElementById(id);
const views = ["homeView", "movieLibraryView", "movieDetailView", "movieGuideView", "gameLibraryView", "gameDetailView", "playlistLibraryView", "playlistDetailView"].map(byId);

const homeView = byId("homeView");
const movieLibraryView = byId("movieLibraryView");
const movieDetailView = byId("movieDetailView");
const movieGuideView = byId("movieGuideView");
const gameLibraryView = byId("gameLibraryView");
const gameDetailView = byId("gameDetailView");
const playlistLibraryView = byId("playlistLibraryView");
const playlistDetailView = byId("playlistDetailView");

const movieGrid = byId("movieGrid");
const movieDetail = byId("movieDetail");
const movieGuide = byId("movieGuide");
const emptyState = byId("emptyState");
const movieSearch = byId("movieSearch");
const movieFormatFilter = byId("movieFormatFilter");
const movieCollectionFilter = byId("movieCollectionFilter");
const movieRatingFilter = byId("movieRatingFilter");

const gameGroups = byId("gameGroups");
const gameDetail = byId("gameDetail");
const gameEmptyState = byId("gameEmptyState");
const gameSearch = byId("gameSearch");
const gamePlatformFilter = byId("gamePlatformFilter");
const gameGenreFilter = byId("gameGenreFilter");
const allGamesViewButton = byId("allGamesViewButton");
const platformGamesViewButton = byId("platformGamesViewButton");

const allMoviesViewButton = byId("allMoviesViewButton");
const movieCollectionsViewButton = byId("movieCollectionsViewButton");
const movieCollectionGrid = byId("movieCollectionGrid");
const collectionEmptyState = byId("collectionEmptyState");
const playlistGrid = byId("playlistGrid");
const playlistDetail = byId("playlistDetail");

const movieFiltersToggle = byId("movieFiltersToggle");
const gameFiltersToggle = byId("gameFiltersToggle");
const movieFilterOptions = byId("movieFilterOptions");
const gameFilterOptions = byId("gameFilterOptions");

let movieViewMode = "all";
let gameViewMode = "all";

const platformOrder = [
  "ps5", "ps4", "ps3", "ps2", "ps1", "psvr", "psvita", "psp",
  "seriesx", "xboxone", "xbox360", "xbox", "switch", "wii", "gamecube",
  "3ds", "ds", "n64", "snes", "nes", "gba", "gbc", "gameboy",
  "genesis", "intellivision"
];

const platformNames = {
  ps5: "PlayStation 5", ps4: "PlayStation 4", ps3: "PlayStation 3",
  ps2: "PlayStation 2", ps1: "PlayStation", psvr: "PlayStation VR",
  psvita: "PlayStation Vita", psp: "PlayStation Portable",
  seriesx: "Xbox Series X|S", xboxone: "Xbox One", xbox360: "Xbox 360",
  xbox: "Original Xbox", switch: "Nintendo Switch", wii: "Nintendo Wii",
  gamecube: "Nintendo GameCube", "3ds": "Nintendo 3DS", ds: "Nintendo DS",
  n64: "Nintendo 64", snes: "Super Nintendo", nes: "Nintendo Entertainment System",
  gba: "Game Boy Advance", gbc: "Game Boy Color", gameboy: "Game Boy",
  genesis: "Sega Genesis", intellivision: "Intellivision"
};

function getSiteBasePath() {
  const marker = "/apps/collection/";
  const index = window.location.pathname.indexOf(marker);
  return index === -1 ? "" : window.location.pathname.slice(0, index);
}

const siteBasePath = getSiteBasePath();

function assetPath(path) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${siteBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function valueList(value) {
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(/[,/|;]/).map(v => v.trim()).filter(Boolean);
}

function titleValue(item) {
  return String(item.sortTitle || item.title || "");
}

function compareTitles(a, b) {
  return titleValue(a).localeCompare(titleValue(b), undefined, { numeric: true, sensitivity: "base" });
}


function getMovieFormat(movie) {
  const source = normalizeText([movie.format, movie.media, movie.edition].filter(Boolean).join(" "));
  if (source.includes("4k") || source.includes("uhd")) return "4K";
  if (source.includes("blu ray") || source.includes("blu-ray") || source.includes("bluray")) return "Blu-ray";
  if (source.includes("dvd")) return "DVD";
  if (source.includes("digital")) return "Digital";
  return "";
}

function getCollectionMovies() {
  if (typeof movieLibrary === "undefined" || !Array.isArray(movieLibrary)) return [];
  return movieLibrary.filter(movie => movie.type !== "games-library");
}

function getCollectionGames() {
  return Array.isArray(gameLibrary) ? gameLibrary.slice() : [];
}

function movieSearchText(movie) {
  return [movie.title, movie.sortTitle, movie.year, movie.rating, movie.edition,
    movie.collection, movie.franchise, getMovieFormat(movie)].filter(Boolean).join(" ").toLowerCase();
}

function gameSearchText(game) {
  return [game.title, game.sortTitle, game.platform, platformNames[game.platform], game.release,
    game.publisher, game.developer, ...valueList(game.genre), game.collection]
    .filter(Boolean).join(" ").toLowerCase();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
}

function fillSelect(select, values, firstLabel, labelFor = value => value) {
  select.innerHTML = `<option value="">${escapeHtml(firstLabel)}</option>`;
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelFor(value);
    select.appendChild(option);
  });
}

function populateFilters() {
  const movies = getCollectionMovies();
  fillSelect(movieFormatFilter, ["4K", "Blu-ray", "DVD", "Digital"].filter(format => movies.some(movie => getMovieFormat(movie) === format)), "All Formats");
  fillSelect(movieCollectionFilter, uniqueSorted(movies.map(movie => movie.collection)), "All Collections");
  fillSelect(movieRatingFilter, uniqueSorted(movies.map(movie => movie.rating)), "All Ratings");

  const games = getCollectionGames();
  const platforms = sortPlatforms(uniqueSorted(games.map(game => game.platform)));
  fillSelect(gamePlatformFilter, platforms, "All Platforms", platform => platformNames[platform] || platform);
  fillSelect(gameGenreFilter, uniqueSorted(games.flatMap(game => valueList(game.genre))), "All Genres");
}

function getFilteredMovies() {
  const query = normalizeText(movieSearch.value);
  const format = movieFormatFilter.value;
  const collection = movieCollectionFilter.value;
  const rating = movieRatingFilter.value;

  const filtered = getCollectionMovies().filter(movie => {
    return (!query || movieSearchText(movie).includes(query)) &&
      (!format || getMovieFormat(movie) === format) &&
      (!collection || movie.collection === collection) &&
      (!rating || movie.rating === rating);
  });

  return filtered.sort(compareTitles);
}

function getFilteredGames() {
  const query = normalizeText(gameSearch.value);
  const platform = gamePlatformFilter.value;
  const genre = gameGenreFilter.value;

  const filtered = getCollectionGames().filter(game => {
    return (!query || gameSearchText(game).includes(query)) &&
      (!platform || game.platform === platform) &&
      (!genre || valueList(game.genre).includes(genre));
  });

  return filtered.sort(compareTitles);
}


function updateFilterCounts() {
  const movieCount = [
    movieFormatFilter.value,
    movieCollectionFilter.value,
    movieRatingFilter.value
  ].filter(Boolean).length;

  const gameCount = [
    gamePlatformFilter.value,
    gameGenreFilter.value
  ].filter(Boolean).length;

  movieFiltersToggle.textContent = `Filters (${movieCount})`;
  gameFiltersToggle.textContent = `Filters (${gameCount})`;
}

function toggleFilterPanel(button, panel) {
  const isOpen = panel.classList.toggle("open");
  button.setAttribute("aria-expanded", String(isOpen));
}

function setPageViewMode(targetView) {
  const isHomeView = targetView === homeView;
  const isDetailView =
    targetView === movieDetailView ||
    targetView === movieGuideView ||
    targetView === gameDetailView ||
    targetView === playlistDetailView;

  document.body.classList.toggle("home-view-active", isHomeView);
  document.body.classList.toggle("detail-view-active", isDetailView);
}


function setActiveLibraryTab(activeLibrary) {
  byId("movieTabButton").classList.toggle("active", activeLibrary === "movies");
  byId("gameTabButton").classList.toggle("active", activeLibrary === "games");
  byId("playlistTabButton").classList.toggle("active", activeLibrary === "playlists");
}

function showView(targetView, activeLibrary = "") {
  setPageViewMode(targetView);
  views.forEach(view => view.classList.remove("active"));
  targetView.classList.add("active");
  byId("pageTitle").textContent = "Collection";
  setActiveLibraryTab(activeLibrary);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showHome() { showView(homeView); }
function showMovieLibrary() { renderMovies(); showView(movieLibraryView, "movies"); }
function showGameLibrary() { renderGames(); showView(gameLibraryView, "games"); }
function showPlaylistLibrary() { renderPlaylists(); showView(playlistLibraryView, "playlists"); }

function createMovieCard(movie) {
  const card = document.createElement("button");
  const format = getMovieFormat(movie);
  const title = escapeHtml(movie.title || "Untitled");
  const poster = escapeHtml(assetPath(movie.poster));
  card.className = "movie-card";
  card.type = "button";
  card.innerHTML = `
    <div class="movie-poster-shell">
      <img src="${poster}" alt="${title}" loading="lazy">
      ${format ? `<span class="format-badge">${escapeHtml(format)}</span>` : ""}
    </div>
    <div class="movie-card-copy">
      <h2 class="movie-card-title">${title}</h2>
      <p class="movie-card-meta">${escapeHtml(movie.year || "Year unknown")}</p>
    </div>`;
  card.addEventListener("click", () => showMovieDetail(movie));
  return card;
}

function collectionGroups() {
  const query = normalizeText(movieSearch.value);
  const groups = new Map();

  getCollectionMovies().forEach(movie => {
    const name = String(movie.collection || movie.title || "Uncategorized").trim();
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(movie);
  });

  return [...groups.entries()]
    .filter(([name, movies]) => {
      if (!query) return true;
      return normalizeText(name).includes(query) ||
        movies.some(movie => movieSearchText(movie).includes(query));
    })
    .sort(([a], [b]) => a.localeCompare(b, undefined, {
      sensitivity: "base",
      numeric: true
    }));
}

function createCollectionCard(name, movies) {
  const card = document.createElement("button");
  const representative = movies[0] || {};
  const poster = escapeHtml(assetPath(representative.poster));
  const safeName = escapeHtml(name);

  card.className = "collection-card";
  card.type = "button";
  card.innerHTML = `
    ${poster ? `<img class="collection-card-image" src="${poster}" alt="" loading="lazy">` : ""}
    <span class="collection-card-overlay" aria-hidden="true"></span>
    <span class="collection-card-copy">
      <strong class="collection-card-title">${safeName}</strong>
      <span class="collection-card-count">
        ${movies.length} ${movies.length === 1 ? "Movie" : "Movies"}
      </span>
    </span>`;

  card.addEventListener("click", () => {
    movieViewMode = "all";
    movieCollectionFilter.value = name;
    setMovieViewMode("all");
  });

  return card;
}

function renderMovies() {
  updateFilterCounts();

  const showingCollections = movieViewMode === "collections";
  movieLibraryView.classList.toggle("collection-mode", showingCollections);
  movieGrid.hidden = showingCollections;
  movieCollectionGrid.hidden = !showingCollections;
  emptyState.hidden = true;
  collectionEmptyState.hidden = true;

  if (showingCollections) {
    const groups = collectionGroups();
    movieCollectionGrid.innerHTML = "";
    groups.forEach(([name, movies]) => {
      movieCollectionGrid.appendChild(createCollectionCard(name, movies));
    });
    collectionEmptyState.hidden = groups.length !== 0;
    return;
  }

  const movies = getFilteredMovies();
  movieGrid.innerHTML = "";
  movies.forEach(movie => movieGrid.appendChild(createMovieCard(movie)));
  emptyState.hidden = movies.length !== 0;
}

function setMovieViewMode(mode) {
  movieViewMode = mode;
  const allActive = mode === "all";

  allMoviesViewButton.classList.toggle("active", allActive);
  movieCollectionsViewButton.classList.toggle("active", !allActive);
  allMoviesViewButton.setAttribute("aria-current", allActive ? "page" : "false");
  movieCollectionsViewButton.setAttribute(
    "aria-current",
    allActive ? "false" : "page"
  );

  movieSearch.placeholder = allActive
    ? "Search by title..."
    : "Search collections...";

  renderMovies();
}

function createGameCard(game) {
  const card = document.createElement("button");
  const platformName = platformNames[game.platform] || game.platform || "Other";
  const title = escapeHtml(game.title || "Untitled");
  const poster = escapeHtml(assetPath(game.poster || game.background || game.cover));
  card.className = "game-card";
  card.type = "button";
  card.innerHTML = `
    <div class="game-poster-shell">
      <img src="${poster}" alt="${title}" loading="lazy">
      <span class="platform-badge">${escapeHtml(platformName)}</span>
    </div>
    <div class="game-card-copy">
      <h3 class="game-card-title">${title}</h3>
      <p class="game-card-meta">${escapeHtml(game.release || "Year unknown")}</p>
    </div>`;
  card.addEventListener("click", () => showGameDetail(game));
  return card;
}

function sortPlatforms(platforms) {
  return platforms.slice().sort((a, b) => {
    const ai = platformOrder.indexOf(a), bi = platformOrder.indexOf(b);
    if (ai === -1 && bi === -1) return (platformNames[a] || a).localeCompare(platformNames[b] || b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function renderAllGames(games) {
  const grid = document.createElement("div");
  grid.className = "game-grid all-games-grid";
  games.forEach(game => grid.appendChild(createGameCard(game)));
  gameGroups.appendChild(grid);
}

function renderPlatformGames(games) {
  const grouped = games.reduce((map, game) => {
    const platform = game.platform || "other";
    (map[platform] ||= []).push(game);
    return map;
  }, {});

  sortPlatforms(Object.keys(grouped)).forEach(platform => {
    const platformGames = grouped[platform].slice().sort(compareTitles);
    const section = document.createElement("section");
    section.className = "game-platform-section collapsed";
    section.innerHTML = `
      <button class="game-platform-heading" type="button" aria-expanded="false">
        <span class="platform-heading-title">
          <span class="collapse-chevron" aria-hidden="true">▶</span>
          <span>${escapeHtml(platformNames[platform] || platform)}</span>
        </span>
        <span>${platformGames.length} ${platformGames.length === 1 ? "Game" : "Games"}</span>
      </button>
      <div class="game-grid platform-game-grid" hidden></div>`;

    const heading = section.querySelector(".game-platform-heading");
    const grid = section.querySelector(".platform-game-grid");
    platformGames.forEach(game => grid.appendChild(createGameCard(game)));
    heading.addEventListener("click", () => {
      const expanded = heading.getAttribute("aria-expanded") === "true";
      heading.setAttribute("aria-expanded", String(!expanded));
      section.classList.toggle("collapsed", expanded);
      grid.hidden = expanded;
      section.querySelector(".collapse-chevron").textContent = expanded ? "▶" : "▼";
    });
    gameGroups.appendChild(section);
  });
}

function renderGames() {
  updateFilterCounts();
  const games = getFilteredGames();
  gameGroups.innerHTML = "";
  if (gameViewMode === "platform") renderPlatformGames(games);
  else renderAllGames(games);
  gameEmptyState.hidden = games.length !== 0;
}

function setGameViewMode(mode) {
  gameViewMode = mode;
  const allActive = mode === "all";
  allGamesViewButton.classList.toggle("active", allActive);
  platformGamesViewButton.classList.toggle("active", !allActive);
  allGamesViewButton.setAttribute("aria-selected", String(allActive));
  platformGamesViewButton.setAttribute("aria-selected", String(!allActive));
  renderGames();
}


function ratingFilePath(movieId) {
  return `${siteBasePath}/library/ratings/movies/${encodeURIComponent(movieId)}.js`;
}

async function loadMovieGuide(movie) {
  const url = ratingFilePath(movie.id);
  const cacheBustedUrl = `${url}?v=${Date.now()}`;

  try {
    // Future-proof path: supports ES module rating files.
    const module = await import(cacheBustedUrl);
    return module.default || module.movieGuide || module;
  } catch (moduleError) {
    // Current generated files use CommonJS (`module.exports = {...}`).
    // GitHub Pages cannot import CommonJS directly, so load and evaluate
    // the trusted, same-origin guide file as a fallback.
    const response = await fetch(cacheBustedUrl, { cache: "no-store" });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Movie guide request failed with ${response.status}`);
    }

    const source = await response.text();
    const module = { exports: {} };
    const exports = module.exports;

    try {
      new Function("module", "exports", `"use strict";\n${source}`)(
        module,
        exports
      );
    } catch (error) {
      console.error("Could not read JFT Movie Guide file:", error);
      throw new Error("The movie guide file could not be read.");
    }

    return module.exports && Object.keys(module.exports).length
      ? module.exports
      : null;
  }
}

function guideValue(guide, ...keys) {
  for (const key of keys) {
    const value = guide?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function nestedGuideValue(guide, path, ...fallbackKeys) {
  const value = path.split(".").reduce((current, key) => current?.[key], guide);
  if (value !== undefined && value !== null && value !== "") return value;
  return guideValue(guide, ...fallbackKeys);
}

function paragraphSection(title, value, className = "") {
  if (!value) return "";
  return `
    <section class="guide-panel ${className}">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(value)}</p>
    </section>`;
}

function renderWhyItems(items) {
  if (!Array.isArray(items) || !items.length) return "";

  const rows = items.map(item => {
    const entry = typeof item === "object" ? item : { type: "positive", text: item };
    const type = entry.type === "warning" ? "warning" : "positive";
    const icon = type === "warning" ? "⚠" : "✓";
    return `
      <li class="guide-why-item ${type}">
        <span aria-hidden="true">${icon}</span>
        <span>${escapeHtml(entry.text)}</span>
      </li>`;
  }).join("");

  return `
    <section class="guide-panel guide-why">
      <h3>Why It Earned Its Score</h3>
      <ul>${rows}</ul>
    </section>`;
}

function renderTheaterSection(theater) {
  if (!theater || typeof theater !== "object") return "";

  const cards = [
    ["Picture", theater.picture],
    ["HDR", theater.hdr],
    ["Dolby Atmos", theater.audio],
    ["Bass", theater.bass],
    ["Replay Value", theater.replayValue],
    ["Demo Value", theater.demoValue]
  ].filter(([, value]) => value);

  if (!theater.overview && !cards.length) return "";

  return `
    <section class="guide-major-section">
      <div class="guide-section-heading">
        <span>Theater Experience</span>
        <h3>Built for the big screen</h3>
      </div>
      ${theater.overview ? `<p class="guide-section-intro">${escapeHtml(theater.overview)}</p>` : ""}
      <div class="guide-experience-grid">
        ${cards.map(([title, value]) => `
          <article class="guide-experience-card">
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(value)}</p>
          </article>`).join("")}
      </div>
    </section>`;
}

function renderDiscernmentSection(section) {
  if (!section || typeof section !== "object") return "";

  const details = [
    ["Violence", section.violence],
    ["Language", section.language],
    ["Sexual Content", section.sexualContent],
    ["Nudity", section.nudity],
    ["Substances", section.substances],
    ["LGBT Influence", section.lgbtInfluence],
    ["Spiritual Themes", section.spiritualThemes],
    ["Family Suitability", section.familySuitability]
  ].filter(([, value]) => value);

  if (!section.overview && !details.length) return "";

  return `
    <section class="guide-major-section guide-discernment">
      <div class="guide-section-heading">
        <span>Biblical Discernment</span>
        <h3>Family awareness</h3>
      </div>
      ${section.note ? `<p class="guide-discernment-note">${escapeHtml(section.note)}</p>` : ""}
      ${section.overview ? `<div class="guide-discernment-overview"><h4>Overview</h4><p>${escapeHtml(section.overview)}</p></div>` : ""}
      <div class="guide-accordion-list">
        ${details.map(([title, value]) => `
          <details class="guide-accordion">
            <summary>${escapeHtml(title)}<span aria-hidden="true">+</span></summary>
            <p>${escapeHtml(value)}</p>
          </details>`).join("")}
      </div>
    </section>`;
}

function renderOwnershipSection(ownership) {
  if (!ownership) return "";
  if (typeof ownership === "string") {
    return paragraphSection("Best Edition", ownership, "guide-ownership");
  }

  // The first two fields are the simplified format used by new guides.
  // The remaining fields preserve compatibility with guides already created.
  const rows = [
    ["Recommended Edition", ownership.bestEdition],
    ["Why", ownership.why],
    ["Preferred Format", ownership.preferredFormat],
    ["Streaming Comparison", ownership.streamingComparison],
    ["Upgrade Value", ownership.upgradeValue],
    ["Collection Role", ownership.collectionRole]
  ].filter(([, value]) => value);

  if (!ownership.recommendation && !rows.length) return "";

  return `
    <section class="guide-major-section guide-ownership">
      <div class="guide-section-heading">
        <span>Best Edition</span>
        <h3>${escapeHtml(ownership.recommendation || "Home Theater Recommendation")}</h3>
      </div>
      <div class="guide-ownership-grid">
        ${rows.map(([title, value]) => `
          <article class="guide-ownership-card">
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(value)}</p>
          </article>`).join("")}
      </div>
    </section>`;
}

function renderDemoScenes(demo) {
  const scenes = Array.isArray(demo) ? demo : demo?.scenes;
  if (!Array.isArray(scenes) || !scenes.length) return "";

  return `
    <section class="guide-major-section guide-demo-scenes">
      <div class="guide-section-heading">
        <span>Best Demo Scenes</span>
        <h3>Show the theater off</h3>
      </div>
      <div class="guide-demo-grid">
        ${scenes.map((scene, index) => {
          const item = typeof scene === "object" ? scene : { title: scene, description: "" };
          return `
            <article class="guide-demo-card">
              <span class="guide-demo-number">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>${escapeHtml(item.title)}</h4>
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
              </div>
            </article>`;
        }).join("")}
      </div>
    </section>`;
}

function hasCompletedGuideFields(guide) {
  if (!guide || typeof guide !== "object") return false;
  if (guide.rating || guide.theater || guide.biblicalDiscernment || guide.ownership || guide.demo || guide.finalThoughts) return true;

  const metadataKeys = new Set([
    "id", "title", "collection", "franchise", "boothGroup",
    "edition", "year", "rating", "runtime"
  ]);

  return Object.entries(guide).some(([key, value]) => {
    if (metadataKeys.has(key)) return false;
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  });
}

function renderLegacyGuideSections(guide) {
  const section = (title, value) => paragraphSection(title, value);
  return `
    ${section("JFT Verdict", guideValue(guide, "verdict", "summary", "overview"))}
    ${section("Picture", guideValue(guide, "picture", "pictureQuality", "video"))}
    ${section("HDR", guideValue(guide, "hdr", "hdrQuality"))}
    ${section("Dolby Atmos", guideValue(guide, "audio", "audioQuality", "sound"))}
    ${section("Bass", guideValue(guide, "bass", "bassQuality"))}
    ${section("Demo Value", guideValue(guide, "demoValue"))}
    ${section("Replay Value", guideValue(guide, "rewatchability", "rewatch"))}
    ${renderOwnershipSection(guideValue(guide, "ownership", "ownershipValue", "recommendation"))}
    ${section("Final Thoughts", guideValue(guide, "notes", "review", "finalThoughts"))}`;
}

function renderMovieGuide(movie, guide) {
  const info = guide?.info || guide || {};
  const rating = guide?.rating || {};
  const title = escapeHtml(movie.title || info.title || "Untitled");
  const poster = escapeHtml(assetPath(movie.poster));
  const completed = hasCompletedGuideFields(guide);
  const score = rating.score ?? guideValue(guide, "jftScore", "score");
  const classification = rating.classification || guideValue(guide, "classification", "jftClassification", "tier");
  const tagline = rating.tagline || "";
  const edition = movie.edition || info.edition || "";
  const isGroupedGuide = Boolean(guide?.rating || guide?.theater || guide?.biblicalDiscernment || guide?.demo);

  movieGuide.innerHTML = `
    <article class="guide-card" style="--detail-bg: url('${poster}')">
      <div class="detail-backdrop"></div>

      <div class="guide-content">
        <header class="guide-hero">
          <img class="guide-poster" src="${poster}" alt="${title}">

          <div class="guide-heading">
            <p class="eyebrow">JFT Movie Guide</p>
            <h2>${title}</h2>
            ${edition ? `<p class="detail-edition">${escapeHtml(edition)}</p>` : ""}

            ${score !== "" || classification ? `
              <div class="guide-rating-lockup">
                ${classification ? `<div class="guide-classification-badge"><span>★</span>${escapeHtml(classification)}</div>` : ""}
                ${score !== "" ? `<div class="guide-score-line"><strong>${escapeHtml(score)}</strong><span>/ 10</span></div>` : ""}
              </div>
            ` : completed ? `
              <div class="guide-type-badge">Collection Guide</div>
            ` : ""}

            ${tagline ? `<p class="guide-tagline">${escapeHtml(tagline)}</p>` : ""}
          </div>
        </header>

        ${completed ? `
          <div class="guide-body">
            ${isGroupedGuide ? `
              ${renderWhyItems(rating.why)}
              ${paragraphSection("JFT Verdict", rating.verdict, "guide-verdict")}
              ${renderTheaterSection(guide.theater)}
              ${renderDiscernmentSection(guide.biblicalDiscernment)}
              ${renderOwnershipSection(guide.ownership)}
              ${renderDemoScenes(guide.demo)}
              ${paragraphSection("Final Thoughts", guide.finalThoughts, "guide-final-thoughts")}
            ` : renderLegacyGuideSections(guide)}
          </div>` : `
          <div class="guide-coming-soon">
            <span aria-hidden="true">🎬</span>
            <h3>Guide coming soon</h3>
            <p>This movie has a JFT Movie Guide file, but the theater review has not been completed yet.</p>
          </div>`}

        <div class="guide-actions">
          <button id="guideBackButton" class="back-button" type="button">← Back to Movie</button>
        </div>
      </div>
    </article>`;

  byId("guideBackButton").addEventListener("click", () => showMovieDetail(movie));
  showView(movieGuideView, "movies");
}

async function showMovieGuide(movie) {
  movieGuide.innerHTML = `
    <div class="guide-loading" role="status">
      <span class="guide-loading-mark" aria-hidden="true">JFT</span>
      <p>Loading Movie Guide…</p>
    </div>`;

  showView(movieGuideView, "movies");

  try {
    const guide = await loadMovieGuide(movie);

    if (!guide) {
      movieGuide.innerHTML = `
        <div class="guide-coming-soon guide-missing">
          <span aria-hidden="true">🎬</span>
          <h2>Guide not created yet</h2>
          <p>
            Run the JFT Movie Guide generator from Developer Tools to create
            this movie's starter file.
          </p>
          <button id="guideMissingBackButton" class="back-button" type="button">
            ← Back to Movie
          </button>
        </div>`;

      byId("guideMissingBackButton").addEventListener(
        "click",
        () => showMovieDetail(movie)
      );
      return;
    }

    renderMovieGuide(movie, guide);
  } catch (error) {
    console.error("JFT Movie Guide failed to load:", error);

    movieGuide.innerHTML = `
      <div class="guide-coming-soon guide-error">
        <span aria-hidden="true">!</span>
        <h2>Guide unavailable</h2>
        <p>${escapeHtml(error.message || "The movie guide could not be loaded.")}</p>
        <button id="guideErrorBackButton" class="back-button" type="button">
          ← Back to Movie
        </button>
      </div>`;

    byId("guideErrorBackButton").addEventListener(
      "click",
      () => showMovieDetail(movie)
    );
  }
}

function showMovieDetail(movie) {
  const format = getMovieFormat(movie), title = escapeHtml(movie.title || "Untitled");
  const poster = escapeHtml(assetPath(movie.poster));
  movieDetail.innerHTML = `
    <article class="detail-card" style="--detail-bg: url('${poster}')"><div class="detail-backdrop"></div>
      <div class="detail-content"><img class="detail-poster" src="${poster}" alt="${title}">
        <div class="detail-copy"><h2>${title}</h2>${movie.edition ? `<p class="detail-edition">${escapeHtml(movie.edition)}</p>` : ""}
          <div class="detail-meta">${movie.year ? `<span>${escapeHtml(movie.year)}</span>` : ""}${movie.rating ? `<span>${escapeHtml(movie.rating)}</span>` : ""}${movie.runtime ? `<span>${escapeHtml(movie.runtime)}</span>` : ""}${format ? `<span>${escapeHtml(format)}</span>` : ""}</div>
          ${movie.collection ? `<section class="detail-section"><h3>Collection</h3><p>${escapeHtml(movie.collection)}</p></section>` : ""}
          ${movie.franchise ? `<section class="detail-section"><h3>Franchise</h3><p>${escapeHtml(movie.franchise)}</p></section>` : ""}
        </div><div class="detail-actions detail-actions-stack">
          <button id="movieGuideButton" class="movie-guide-button" type="button">JFT Movie Guide</button>
          <button id="detailBackButton" class="back-button" type="button">← Back to Movies</button>
        </div>
      </div></article>`;
  byId("movieGuideButton").addEventListener("click", () => showMovieGuide(movie));
  byId("detailBackButton").addEventListener("click", showMovieLibrary);
  showView(movieDetailView, "movies");
}

function detailRow(label, value) {
  return value ? `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>` : "";
}

function showGameDetail(game) {
  const title = escapeHtml(game.title || "Untitled");
  const poster = escapeHtml(assetPath(game.poster || game.background || game.cover));
  const platformName = platformNames[game.platform] || game.platform || "Other";
  const ownership = Array.isArray(game.ownership) ? game.ownership.join(", ") : game.ownership;
  gameDetail.innerHTML = `
    <article class="detail-card" style="--detail-bg: url('${poster}')"><div class="detail-backdrop"></div>
      <div class="detail-content"><img class="detail-poster" src="${poster}" alt="${title}">
        <div class="detail-copy"><h2>${title}</h2><p class="detail-edition">${escapeHtml(platformName)}</p>
          <div class="detail-meta">${game.release ? `<span>${escapeHtml(game.release)}</span>` : ""}${game.rating ? `<span>${escapeHtml(game.rating)}</span>` : ""}${game.players ? `<span>${escapeHtml(game.players)} Players</span>` : ""}</div>
          <dl class="game-detail-list">${detailRow("Platform", platformName)}${detailRow("Genre", valueList(game.genre).join(", "))}${detailRow("Developer", game.developer)}${detailRow("Publisher", game.publisher)}${detailRow("Collection", game.collection)}${detailRow("Ownership", ownership)}</dl>
        </div><div class="detail-actions"><button id="gameDetailBackButton" class="back-button" type="button">← Back to Games</button></div>
      </div></article>`;
  byId("gameDetailBackButton").addEventListener("click", showGameLibrary);
  showView(gameDetailView, "games");
}


const PLAYLIST_PROGRESS_PREFIX = "jft-playlist-progress:";

function getPlaylistProgressKey(playlistId) {
  return `${PLAYLIST_PROGRESS_PREFIX}${playlistId}`;
}

function getPlaylistProgress(playlistId, itemCount) {
  const saved = Number.parseInt(
    localStorage.getItem(getPlaylistProgressKey(playlistId)) || "0",
    10
  );

  if (!Number.isInteger(saved)) return 0;
  return Math.min(Math.max(saved, 0), Math.max(itemCount, 0));
}

function setPlaylistProgress(playlistId, itemIndex) {
  localStorage.setItem(
    getPlaylistProgressKey(playlistId),
    String(Math.max(0, itemIndex))
  );
}

function resolvePlaylistMedia(ref) {
  const owned = getCollectionMovies().find(movie => movie.id === ref);
  if (owned) {
    return {
      ...owned,
      mediaType: owned.mediaType || "movie",
      availabilityLabel: getMovieFormat(owned) || "Owned",
      availabilityType: "owned"
    };
  }

  const accessible = accessibleMediaLibrary.find(item => item.id === ref);
  if (accessible) {
    return {
      ...accessible,
      availabilityLabel: accessible.provider || "Available",
      availabilityType: "accessible"
    };
  }

  return {
    id: ref,
    title: ref,
    mediaType: "unknown",
    availabilityLabel: "Not in library",
    availabilityType: "missing",
    poster: ""
  };
}

function expandPlaylistItems(playlist) {
  const expanded = [];

  (playlist.items || []).forEach(item => {
    const media = resolvePlaylistMedia(item.ref);
    const displayTitle = item.title || media.title;

    const shared = {
      ...media,
      ...item,
      title: displayTitle
    };

    if (item.type === "episode-list") {
      (item.episodes || []).forEach(episode => {
        expanded.push({
          ...shared,
          progressId:
            episode.id ||
            `${item.id || item.ref}-s${episode.season}-e${episode.episode}`,
          displayType: "episode",
          season: episode.season,
          episode: episode.episode,
          episodeTitle: episode.title || ""
        });
      });

      return;
    }

    if (item.type === "season") {
      const series = seriesLibrary.find(
        entry => entry.id === item.ref
      );

      const seasonData = series?.seasons?.find(
        season => Number(season.season) === Number(item.season)
      );

      const libraryEpisodes = seasonData?.episodes || [];

      if (libraryEpisodes.length > 0) {
        libraryEpisodes.forEach(episode => {
          expanded.push({
            ...shared,
            progressId:
              `${item.id || item.ref}-s${item.season}-e${episode.episode}`,
            displayType: "episode",
            season: item.season,
            episode: episode.episode,
            episodeTitle: episode.title || ""
          });
        });

        return;
      }

      // Fallback for older playlist files that still use episodeCount.
      const episodeCount = Number(item.episodeCount || 0);

      for (let episode = 1; episode <= episodeCount; episode += 1) {
        expanded.push({
          ...shared,
          progressId:
            `${item.id || item.ref}-s${item.season}-e${episode}`,
          displayType: "episode",
          season: item.season,
          episode,
          episodeTitle: ""
        });
      }

      return;
    }

    expanded.push({
      ...shared,
      progressId: item.id || item.ref,
      displayType: item.type || media.mediaType || "movie"
    });
  });

  return expanded;
}
function playlistItemLabel(item) {
  if (item.displayType === "episode") {
    const episodeCode = `S${item.season} E${item.episode}`;
    return item.episodeTitle
      ? `${episodeCode} — ${item.episodeTitle}`
      : episodeCode;
  }

  if (item.displayType === "special") {
    return item.note || "Specially placed credit scene";
  }

  const parts = [
    item.year ? String(item.year) : "Movie",
    item.priority
  ].filter(Boolean);

  return parts.join(" · ");
}


const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function parsePlaylistEventDate(dateValue) {
  if (!dateValue) return null;

  const parts = String(dateValue).split("-").map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isInteger(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPlaylistEventDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getPlaylistEventStatus(weeklyGoal, remainingEntries, daysRemaining) {
  if (remainingEntries === 0) return { label: "Complete", level: "complete" };
  if (daysRemaining < 0) return { label: "Target Passed", level: "behind" };
  if (weeklyGoal <= 2) return { label: "Comfortably On Track", level: "ahead" };
  if (weeklyGoal <= 5) return { label: "On Track", level: "on-track" };
  if (weeklyGoal <= 8) return { label: "Pick Up the Pace", level: "warning" };
  return { label: "Marathon Mode", level: "behind" };
}

function getPlaylistEventUrgency(daysRemaining, remainingEntries) {
  if (remainingEntries === 0) return "complete";
  if (daysRemaining < 0) return "passed";
  if (daysRemaining <= 7) return "urgent";
  if (daysRemaining <= 30) return "near";
  if (daysRemaining <= 90) return "approaching";
  return "normal";
}

function getWeeklyGoalMessage(weeklyGoal, remainingEntries) {
  if (remainingEntries === 0) return "You are ready for the event.";
  if (weeklyGoal <= 2) return "A light week should keep you comfortably on pace.";
  if (weeklyGoal <= 5) return "A few viewing sessions this week should keep you on track.";
  if (weeklyGoal <= 8) return "Plan a couple of longer sessions or a weekend binge.";
  if (weeklyGoal <= 12) return "Several binge sessions will help bring the goal back down.";
  return "A major catch-up week is needed to finish by the target date.";
}

function calculatePlaylistEvent(playlist, itemCount, completedEntries) {
  const eventDate = parsePlaylistEventDate(playlist.event?.date);
  if (!eventDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (eventDate.getTime() - today.getTime()) / DAY_IN_MILLISECONDS
  );

  const remainingEntries = Math.max(itemCount - completedEntries, 0);
  const weeksRemaining = daysRemaining > 0 ? daysRemaining / 7 : 0;

  const weeklyGoal =
    remainingEntries === 0
      ? 0
      : weeksRemaining > 0
        ? Math.ceil(remainingEntries / weeksRemaining)
        : remainingEntries;

  const percentComplete =
    itemCount > 0
      ? Math.round((completedEntries / itemCount) * 100)
      : 0;

  const status = getPlaylistEventStatus(
    weeklyGoal,
    remainingEntries,
    daysRemaining
  );

  return {
    title: playlist.event.title || playlist.title,
    date: eventDate,
    formattedDate: formatPlaylistEventDate(eventDate),
    daysRemaining,
    remainingEntries,
    completedEntries,
    totalEntries: itemCount,
    weeklyGoal,
    percentComplete,
    status,
    urgency: getPlaylistEventUrgency(daysRemaining, remainingEntries),
    weeklyGoalMessage: getWeeklyGoalMessage(weeklyGoal, remainingEntries)
  };
}

function playlistCountdownLabel(eventData) {
  if (eventData.remainingEntries === 0) return "Ready";
  if (eventData.daysRemaining < 0) {
    const daysPast = Math.abs(eventData.daysRemaining);
    return `${daysPast} ${daysPast === 1 ? "day" : "days"} past`;
  }
  if (eventData.daysRemaining === 0) return "Today";

  return `${eventData.daysRemaining} ${
    eventData.daysRemaining === 1 ? "day" : "days"
  } remaining`;
}

function renderPlaylistEventCard(eventData) {
  if (!eventData) return "";

  return `
    <section class="playlist-event-card urgency-${escapeHtml(eventData.urgency)}">
      <div class="playlist-event-heading">
        <div>
          <p class="eyebrow">Upcoming Event</p>
          <h2>${escapeHtml(eventData.title)}</h2>
          <p>${escapeHtml(eventData.formattedDate)}</p>
        </div>

        <div class="playlist-event-countdown">
          <strong>${
            eventData.daysRemaining < 0
              ? Math.abs(eventData.daysRemaining)
              : eventData.daysRemaining
          }</strong>
          <span>${
            eventData.daysRemaining < 0
              ? "Days Past"
              : eventData.daysRemaining === 0
                ? "Today"
                : "Days Remaining"
          }</span>
        </div>
      </div>

      <div class="playlist-event-progress">
        <div class="playlist-event-progress-copy">
          <span>Progress</span>
          <strong>${eventData.completedEntries} / ${eventData.totalEntries} Entries</strong>
        </div>

        <div
          class="playlist-event-progress-track"
          role="progressbar"
          aria-label="Playlist progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${eventData.percentComplete}"
        >
          <span style="width: ${eventData.percentComplete}%"></span>
        </div>

        <span class="playlist-event-percentage">${eventData.percentComplete}%</span>
      </div>

      <div class="playlist-event-stats">
        <div class="playlist-event-stat">
          <span>Weekly Goal</span>
          <strong>${eventData.weeklyGoal}</strong>
          <small>${eventData.weeklyGoal === 1 ? "Entry Per Week" : "Entries Per Week"}</small>
        </div>

        <div class="playlist-event-stat">
          <span>Remaining</span>
          <strong>${eventData.remainingEntries}</strong>
          <small>${eventData.remainingEntries === 1 ? "Entry" : "Entries"}</small>
        </div>

        <div class="playlist-event-stat">
          <span>Status</span>
          <strong class="playlist-event-status status-${escapeHtml(eventData.status.level)}">
            ${escapeHtml(eventData.status.label)}
          </strong>
          <small>${escapeHtml(eventData.weeklyGoalMessage)}</small>
        </div>
      </div>
    </section>
  `;
}

function createPlaylistCard(playlist) {
  const card = document.createElement("button");
  const items = expandPlaylistItems(playlist);
  const currentIndex = getPlaylistProgress(playlist.id, items.length);
  const currentItem = items[currentIndex];
  const eventData = calculatePlaylistEvent(playlist, items.length, currentIndex);
  const artwork = escapeHtml(assetPath(playlist.poster || currentItem?.poster));

  card.className = "playlist-card";
  card.type = "button";
  card.innerHTML = `
    <div class="playlist-card-artwork">
      ${artwork ? `<img src="${artwork}" alt="" loading="lazy">` : ""}
      <span class="playlist-card-overlay" aria-hidden="true"></span>
      <span class="playlist-card-count">${items.length} items</span>
    </div>
    <div class="playlist-card-copy">
      <p class="eyebrow">Playlist</p>
      <h2>${escapeHtml(playlist.title)}</h2>
      <p>${escapeHtml(playlist.description || "")}</p>
      ${
        eventData
          ? `
            <div class="playlist-card-event">
              <span>${escapeHtml(eventData.title)}</span>
              <strong>${escapeHtml(playlistCountdownLabel(eventData))}</strong>
              <small>Weekly Goal: ${eventData.weeklyGoal} ${eventData.weeklyGoal === 1 ? "entry" : "entries"}</small>
            </div>
          `
          : ""
      }
      ${currentItem ? `<strong>Up next: ${escapeHtml(currentItem.title)}${currentItem.displayType === "episode" ? ` — ${escapeHtml(playlistItemLabel(currentItem))}` : ""}</strong>` : ""}
    </div>`;

  card.addEventListener("click", () => showPlaylistDetail(playlist));
  return card;
}

function renderPlaylists() {
  playlistGrid.innerHTML = "";
  playlistLibrary.forEach(playlist => {
    playlistGrid.appendChild(createPlaylistCard(playlist));
  });
}


function renderPlaylistItemsBySection(items, currentIndex) {
  let previousSection = null;

  return items
    .map((item, index) => {
      const state =
        index < currentIndex
          ? "watched"
          : index === currentIndex
            ? "current"
            : "upcoming";

      const section = item.section || "Playlist";

      const sectionHeading =
        section !== previousSection
          ? `
            <li class="playlist-section-heading">
              <span>${escapeHtml(section)}</span>
            </li>
          `
          : "";

      previousSection = section;

      return `
        ${sectionHeading}

        <li class="playlist-item ${state}">
          <span class="playlist-item-status" aria-hidden="true">
            ${
              state === "watched"
                ? "✓"
                : state === "current"
                  ? "▶"
                  : index + 1
            }
          </span>

          ${
            item.poster
              ? `
                <img
                  src="${escapeHtml(assetPath(item.poster))}"
                  alt=""
                  loading="lazy"
                >
              `
              : ""
          }

          <div class="playlist-item-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(playlistItemLabel(item))}</span>
          </div>

          <span class="availability-badge ${escapeHtml(item.availabilityType)}">
            ${escapeHtml(item.availabilityLabel)}
          </span>
        </li>
      `;
    })
    .join("");
}

function showPlaylistDetail(playlist) {
  const items = expandPlaylistItems(playlist);
  let currentIndex = getPlaylistProgress(playlist.id, items.length);

  function renderDetail() {
    currentIndex = getPlaylistProgress(playlist.id, items.length);
    const currentItem = items[currentIndex];
    const eventData = calculatePlaylistEvent(playlist, items.length, currentIndex);
    const heroPoster = escapeHtml(assetPath(playlist.poster || currentItem?.poster));

    playlistDetail.innerHTML = `
      <article class="playlist-detail-card" style="--detail-bg: url('${heroPoster}')">
        <div class="detail-backdrop"></div>
        <div class="playlist-detail-content">
          <button id="playlistBackButton" class="detail-back-button" type="button">← Back to Playlists</button>

          <header class="playlist-detail-header">
            ${heroPoster ? `<img class="playlist-detail-poster" src="${heroPoster}" alt="${escapeHtml(playlist.title)}">` : ""}
            <div>
              <p class="eyebrow">JFT Playlist</p>
              <h1>${escapeHtml(playlist.title)}</h1>
              <p>${escapeHtml(playlist.description || "")}</p>
              <div class="playlist-progress-summary">
                <span>${currentIndex} watched</span>
                <span>${Math.max(items.length - currentIndex, 0)} remaining</span>
              </div>
            </div>
          </header>

          ${renderPlaylistEventCard(eventData)}

          ${currentItem ? `
            <section class="up-next-card">
              <p class="eyebrow">Up Next</p>
              <div class="up-next-main">
                ${currentItem.poster ? `<img src="${escapeHtml(assetPath(currentItem.poster))}" alt="">` : ""}
                <div>
                  <h2>${escapeHtml(currentItem.title)}</h2>
                  <p>${escapeHtml(playlistItemLabel(currentItem))}</p>
                  <span class="availability-badge ${escapeHtml(currentItem.availabilityType)}">${escapeHtml(currentItem.availabilityLabel)}</span>
                </div>
              </div>
              <div class="playlist-progress-actions">
                <button id="playlistPreviousButton" class="secondary-button" type="button" ${currentIndex === 0 ? "disabled" : ""}>Previous</button>
                <button id="playlistWatchedButton" class="movie-guide-button" type="button" ${currentIndex >= items.length ? "disabled" : ""}>Mark Watched</button>
                <button id="playlistResetButton" class="secondary-button" type="button">Reset</button>
              </div>
            </section>` : ""}

          <ol class="playlist-item-list">
            ${renderPlaylistItemsBySection(items, currentIndex)}
          </ol>
        </div>
      </article>`;

    byId("playlistBackButton").addEventListener("click", showPlaylistLibrary);

    byId("playlistPreviousButton")?.addEventListener("click", () => {
      setPlaylistProgress(playlist.id, currentIndex - 1);
      renderDetail();
    });

    byId("playlistWatchedButton")?.addEventListener("click", () => {
      setPlaylistProgress(playlist.id, currentIndex + 1);
      renderDetail();
    });

    byId("playlistResetButton")?.addEventListener("click", () => {
      setPlaylistProgress(playlist.id, 0);
      renderDetail();
    });
  }

  renderDetail();
  showView(playlistDetailView, "playlists");
}

function clearMovieFilters() {
  movieSearch.value = "";
  movieFormatFilter.value = "";
  movieCollectionFilter.value = "";
  movieRatingFilter.value = "";
  movieFilterOptions.classList.remove("open");
  movieFiltersToggle.setAttribute("aria-expanded", "false");
  renderMovies();
}
function clearGameFilters() {
  gameSearch.value = "";
  gamePlatformFilter.value = "";
  gameGenreFilter.value = "";
  gameFilterOptions.classList.remove("open");
  gameFiltersToggle.setAttribute("aria-expanded", "false");
  renderGames();
}

[movieSearch, movieFormatFilter, movieCollectionFilter, movieRatingFilter]
  .forEach(control => {
    control.addEventListener(
      control === movieSearch ? "input" : "change",
      renderMovies
    );
  });

[gameSearch, gamePlatformFilter, gameGenreFilter]
  .forEach(control => {
    control.addEventListener(
      control === gameSearch ? "input" : "change",
      renderGames
    );
  });

movieFiltersToggle.addEventListener("click", () => {
  toggleFilterPanel(movieFiltersToggle, movieFilterOptions);
});

gameFiltersToggle.addEventListener("click", () => {
  toggleFilterPanel(gameFiltersToggle, gameFilterOptions);
});

allMoviesViewButton.addEventListener("click", () => {
  setMovieViewMode("all");
});

movieCollectionsViewButton.addEventListener("click", () => {
  setMovieViewMode("collections");
});

byId("clearMovieFiltersButton").addEventListener("click", clearMovieFilters);
byId("clearGameFiltersButton").addEventListener("click", clearGameFilters);
allGamesViewButton.addEventListener("click", () => setGameViewMode("all"));
platformGamesViewButton.addEventListener("click", () => setGameViewMode("platform"));

byId("homeButton").addEventListener("click", showHome);
byId("movieTabButton").addEventListener("click", showMovieLibrary);
byId("gameTabButton").addEventListener("click", showGameLibrary);
byId("playlistTabButton").addEventListener("click", showPlaylistLibrary);
byId("openMoviesButton").addEventListener("click", showMovieLibrary);
byId("openGamesButton").addEventListener("click", showGameLibrary);
byId("openPlaylistsButton").addEventListener("click", showPlaylistLibrary);
byId("movieCountButton").addEventListener("click", showMovieLibrary);
byId("gameCountButton").addEventListener("click", showGameLibrary);

byId("movieCount").textContent = String(getCollectionMovies().length);
byId("gameCount").textContent = String(getCollectionGames().length);
populateFilters();
renderMovies();
renderGames();
renderPlaylists();
showHome();


// PWA update handling.
//
// The installed iPhone app checks for a newer service worker whenever it
// launches or returns to the foreground. The Refresh button also clears the
// app caches and reloads the latest files without removing the Home Screen app.
const refreshAppButton = byId("refreshAppButton");
const appUpdateStatus = byId("appUpdateStatus");

let serviceWorkerRegistration = null;
let updateReloadStarted = false;
let updateStatusTimer = null;

function showUpdateStatus(message, duration = 2400) {
  if (!appUpdateStatus) return;

  window.clearTimeout(updateStatusTimer);
  appUpdateStatus.textContent = message;
  appUpdateStatus.hidden = false;

  if (duration > 0) {
    updateStatusTimer = window.setTimeout(() => {
      appUpdateStatus.hidden = true;
    }, duration);
  }
}

function setRefreshButtonBusy(isBusy) {
  if (!refreshAppButton) return;

  refreshAppButton.disabled = isBusy;
  refreshAppButton.classList.toggle("refreshing", isBusy);
  refreshAppButton.setAttribute("aria-busy", String(isBusy));
}

async function requestLatestServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;

  serviceWorkerRegistration =
    serviceWorkerRegistration ||
    await navigator.serviceWorker.getRegistration("./");

  if (serviceWorkerRegistration) {
    await serviceWorkerRegistration.update();
  }

  return serviceWorkerRegistration;
}

async function refreshInstalledApp() {
  setRefreshButtonBusy(true);
  showUpdateStatus("Checking for collection updates…", 0);

  try {
    const registration = await requestLatestServiceWorker();

    const worker =
      registration?.waiting ||
      registration?.installing ||
      registration?.active ||
      navigator.serviceWorker.controller;

    if (worker) {
      worker.postMessage({ type: "CLEAR_APP_CACHES" });
    }

    // Force the HTML document to be revalidated before reloading.
    await fetch(window.location.href, {
      cache: "reload",
      credentials: "same-origin"
    });

    showUpdateStatus("Collection updated. Reloading…", 0);

    window.setTimeout(() => {
      window.location.reload();
    }, 350);
  } catch (error) {
    console.warn("JFT Collection refresh failed:", error);
    showUpdateStatus("Could not refresh. Check your connection and try again.");
    setRefreshButtonBusy(false);
  }
}

if (refreshAppButton) {
  refreshAppButton.addEventListener("click", refreshInstalledApp);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updateReloadStarted) return;
    updateReloadStarted = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      serviceWorkerRegistration = await navigator.serviceWorker.register(
        "./service-worker.js",
        { updateViaCache: "none" }
      );

      await serviceWorkerRegistration.update();

      if (serviceWorkerRegistration.waiting) {
        serviceWorkerRegistration.waiting.postMessage({
          type: "SKIP_WAITING"
        });
      }

      serviceWorkerRegistration.addEventListener("updatefound", () => {
        const installingWorker = serviceWorkerRegistration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateStatus("A collection update is ready…", 0);
            installingWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    } catch (error) {
      console.warn(
        "JFT Collection service worker registration failed:",
        error
      );
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      requestLatestServiceWorker().catch(error => {
        console.warn("JFT Collection update check failed:", error);
      });
    }
  });

  window.addEventListener("pageshow", () => {
    requestLatestServiceWorker().catch(error => {
      console.warn("JFT Collection update check failed:", error);
    });
  });
}
