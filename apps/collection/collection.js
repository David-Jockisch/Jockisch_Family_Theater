import gameLibrary from "../../library/games/game-library.js";

const byId = id => document.getElementById(id);
const views = ["homeView", "movieLibraryView", "movieDetailView", "gameLibraryView", "gameDetailView"].map(byId);

const homeView = byId("homeView");
const movieLibraryView = byId("movieLibraryView");
const movieDetailView = byId("movieDetailView");
const gameLibraryView = byId("gameLibraryView");
const gameDetailView = byId("gameDetailView");

const movieGrid = byId("movieGrid");
const movieDetail = byId("movieDetail");
const emptyState = byId("emptyState");
const movieSearch = byId("movieSearch");
const movieFormatFilter = byId("movieFormatFilter");
const movieCollectionFilter = byId("movieCollectionFilter");
const movieRatingFilter = byId("movieRatingFilter");
const movieSort = byId("movieSort");

const gameGroups = byId("gameGroups");
const gameDetail = byId("gameDetail");
const gameEmptyState = byId("gameEmptyState");
const gameSearch = byId("gameSearch");
const gamePlatformFilter = byId("gamePlatformFilter");
const gameGenreFilter = byId("gameGenreFilter");
const gameSort = byId("gameSort");
const allGamesViewButton = byId("allGamesViewButton");
const platformGamesViewButton = byId("platformGamesViewButton");

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

function releaseYear(item, field = "year") {
  const match = String(item[field] || "").match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

function sortItems(items, mode, yearField) {
  const sorted = items.slice();
  if (mode === "za") return sorted.sort((a, b) => compareTitles(b, a));
  if (mode === "newest") return sorted.sort((a, b) => releaseYear(b, yearField) - releaseYear(a, yearField) || compareTitles(a, b));
  if (mode === "oldest") return sorted.sort((a, b) => {
    const ay = releaseYear(a, yearField) || 9999;
    const by = releaseYear(b, yearField) || 9999;
    return ay - by || compareTitles(a, b);
  });
  return sorted.sort(compareTitles);
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

  return sortItems(filtered, movieSort.value, "year");
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

  return sortItems(filtered, gameSort.value, "release");
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

function setDetailViewMode(isDetail) {
  document.body.classList.toggle("detail-view-active", isDetail);
}

function syncMovieSort(value, source) {
  movieSort.value = value;
  movieSortMobile.value = value;
  if (source !== "render") {
    renderMovies();
  }
}

function syncGameSort(value, source) {
  gameSort.value = value;
  gameSortMobile.value = value;
  if (source !== "render") {
    renderGames();
  }
}

function setActiveLibraryTab(activeLibrary) {
  byId("movieTabButton").classList.toggle("active", activeLibrary === "movies");
  byId("gameTabButton").classList.toggle("active", activeLibrary === "games");
}

function showView(targetView, activeLibrary = "") {
  const isDetailView =
    targetView === movieDetailView ||
    targetView === gameDetailView;

  setDetailViewMode(isDetailView);
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

function renderMovies() {
  movieSortMobile.value = movieSort.value;
  updateFilterCounts();
  const movies = getFilteredMovies();
  movieGrid.innerHTML = "";
  movies.forEach(movie => movieGrid.appendChild(createMovieCard(movie)));
  emptyState.hidden = movies.length !== 0;
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
    const platformGames = sortItems(grouped[platform], gameSort.value, "release");
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
  gameSortMobile.value = gameSort.value;
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
        </div><div class="detail-actions"><button id="detailBackButton" class="back-button" type="button">← Back to Movies</button></div>
      </div></article>`;
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
  movieSearch.value = ""; movieFormatFilter.value = ""; movieCollectionFilter.value = "";
  movieRatingFilter.value = ""; movieSort.value = "az"; renderMovies();
}
function clearGameFilters() {
  gameSearch.value = ""; gamePlatformFilter.value = ""; gameGenreFilter.value = "";
  gameSort.value = "az"; renderGames();
}

[movieSearch, movieFormatFilter, movieCollectionFilter, movieRatingFilter, movieSort].forEach(control => control.addEventListener(control === movieSearch ? "input" : "change", renderMovies));
[gameSearch, gamePlatformFilter, gameGenreFilter, gameSort].forEach(control => control.addEventListener(control === gameSearch ? "input" : "change", renderGames));

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


// Register the Collection PWA service worker after the page is fully loaded.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => {
        console.warn("JFT Collection service worker registration failed:", error);
      });
  });
}
