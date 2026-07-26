import gameLibrary from "../../library/games/game-library.js";

const byId = id => document.getElementById(id);
const views = ["homeView", "movieLibraryView", "movieDetailView", "movieGuideView", "gameLibraryView", "gameDetailView"].map(byId);

const homeView = byId("homeView");
const movieLibraryView = byId("movieLibraryView");
const movieDetailView = byId("movieDetailView");
const movieGuideView = byId("movieGuideView");
const gameLibraryView = byId("gameLibraryView");
const gameDetailView = byId("gameDetailView");

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
    targetView === gameDetailView;

  document.body.classList.toggle("home-view-active", isHomeView);
  document.body.classList.toggle("detail-view-active", isDetailView);
}


function setActiveLibraryTab(activeLibrary) {
  byId("movieTabButton").classList.toggle("active", activeLibrary === "movies");
  byId("gameTabButton").classList.toggle("active", activeLibrary === "games");
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
  if (typeof ownership === "string") return paragraphSection("Ownership Guide", ownership, "guide-ownership");

  const rows = [
    ["Preferred Format", ownership.preferredFormat],
    ["Streaming Comparison", ownership.streamingComparison],
    ["Upgrade Value", ownership.upgradeValue],
    ["Collection Role", ownership.collectionRole]
  ].filter(([, value]) => value);

  if (!ownership.recommendation && !rows.length) return "";

  return `
    <section class="guide-major-section guide-ownership">
      <div class="guide-section-heading">
        <span>Ownership Guide</span>
        <h3>${escapeHtml(ownership.recommendation || "Physical Media Guidance")}</h3>
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

            <div class="guide-rating-lockup">
              ${classification ? `<div class="guide-classification-badge"><span>★</span>${escapeHtml(classification)}</div>` : ""}
              ${score !== "" ? `<div class="guide-score-line"><strong>${escapeHtml(score)}</strong><span>/ 10</span></div>` : ""}
            </div>

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
byId("openMoviesButton").addEventListener("click", showMovieLibrary);
byId("openGamesButton").addEventListener("click", showGameLibrary);
byId("movieCountButton").addEventListener("click", showMovieLibrary);
byId("gameCountButton").addEventListener("click", showGameLibrary);

byId("movieCount").textContent = String(getCollectionMovies().length);
byId("gameCount").textContent = String(getCollectionGames().length);
populateFilters();
renderMovies();
renderGames();
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
