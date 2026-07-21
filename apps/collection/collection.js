const homeView = document.getElementById("homeView");
const movieLibraryView = document.getElementById("movieLibraryView");
const movieDetailView = document.getElementById("movieDetailView");
const gameLibraryView = document.getElementById("gameLibraryView");

const homeButton = document.getElementById("homeButton");
const movieHomeButton = document.getElementById("movieHomeButton");
const gameHomeButton = document.getElementById("gameHomeButton");

const openMoviesButton = document.getElementById("openMoviesButton");
const openGamesButton = document.getElementById("openGamesButton");

const pageTitle = document.getElementById("pageTitle");
const libraryCount = document.getElementById("libraryCount");
const itemCount = document.getElementById("itemCount");
const itemCountLabel = document.getElementById("itemCountLabel");

const movieGrid = document.getElementById("movieGrid");
const movieDetail = document.getElementById("movieDetail");

const movieSearch = document.getElementById("movieSearch");
const clearSearchButton = document.getElementById("clearSearchButton");
const emptyState = document.getElementById("emptyState");

let currentMovies = [];

function getSiteBasePath() {
  const collectionPath = "/apps/collection/";
  const currentPath = window.location.pathname;
  const collectionIndex = currentPath.indexOf(collectionPath);

  if (collectionIndex === -1) {
    return "";
  }

  return currentPath.slice(0, collectionIndex);
}

const siteBasePath = getSiteBasePath();

function assetPath(path) {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${siteBasePath}${normalizedPath}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getMovieFormat(movie) {
  const edition = normalizeText(movie.edition);

  if (edition.includes("4k")) {
    return "4K";
  }

  if (
    edition.includes("blu ray") ||
    edition.includes("blu-ray")
  ) {
    return "Blu-ray";
  }

  if (edition.includes("digital")) {
    return "Digital";
  }

  if (edition.includes("dvd")) {
    return "DVD";
  }

  return "";
}

function getSearchText(movie) {
  return [
    movie.title,
    movie.year,
    movie.rating,
    movie.runtime,
    movie.edition,
    movie.collection,
    movie.franchise,
    movie.boothGroup,
    getMovieFormat(movie)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getCollectionMovies() {
  if (!Array.isArray(window.movieLibrary)) {
    return [];
  }

  return window.movieLibrary
    .filter(movie => {
      return movie.type !== "games-library";
    })
    .slice()
    .sort((a, b) => {
      return String(a.title || "").localeCompare(
        String(b.title || ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base"
        }
      );
    });
}

function showView(targetView, title, countOptions = null) {
  [
    homeView,
    movieLibraryView,
    movieDetailView,
    gameLibraryView
  ].forEach(view => {
    view.classList.remove("active");
  });

  targetView.classList.add("active");
  pageTitle.textContent = title;

  if (countOptions) {
    libraryCount.hidden = false;
    itemCount.textContent = String(countOptions.count);
    itemCountLabel.textContent = countOptions.label;
  } else {
    libraryCount.hidden = true;
  }

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function showHome() {
  showView(homeView, "My Collection");
}

function showMovieLibrary() {
  const movies = filterMovies(movieSearch.value);

  renderMovies(movies);

  showView(
    movieLibraryView,
    "Movies",
    {
      count: movies.length,
      label: movies.length === 1 ? "Movie" : "Movies"
    }
  );
}

function showGameLibrary() {
  showView(gameLibraryView, "Games");
}

function createMovieCard(movie) {
  const card = document.createElement("button");
  const format = getMovieFormat(movie);

  card.className = "movie-card";
  card.type = "button";

  const title = escapeHtml(movie.title || "Untitled");
  const poster = escapeHtml(assetPath(movie.poster));
  const year = escapeHtml(movie.year || "Year unknown");

  card.innerHTML = `
    <div class="movie-poster-shell">
      <img
        src="${poster}"
        alt="${title}"
        loading="lazy"
      >

      ${
        format
          ? `
            <span class="format-badge">
              ${escapeHtml(format)}
            </span>
          `
          : ""
      }
    </div>

    <div class="movie-card-copy">
      <h2 class="movie-card-title">
        ${title}
      </h2>

      <p class="movie-card-meta">
        ${year}
      </p>
    </div>
  `;

  card.addEventListener("click", () => {
    showMovieDetail(movie);
  });

  return card;
}

function renderMovies(movies) {
  currentMovies = movies;
  movieGrid.innerHTML = "";

  movies.forEach(movie => {
    movieGrid.appendChild(
      createMovieCard(movie)
    );
  });

  emptyState.hidden = movies.length !== 0;

  if (movieLibraryView.classList.contains("active")) {
    itemCount.textContent = String(movies.length);
    itemCountLabel.textContent =
      movies.length === 1 ? "Movie" : "Movies";
  }
}

function filterMovies(query) {
  const normalizedQuery = normalizeText(query);
  const allMovies = getCollectionMovies();

  if (!normalizedQuery) {
    return allMovies;
  }

  return allMovies.filter(movie => {
    return getSearchText(movie).includes(
      normalizedQuery
    );
  });
}

function runSearch() {
  renderMovies(
    filterMovies(movieSearch.value)
  );
}

function showMovieDetail(movie) {
  const format = getMovieFormat(movie);

  const title = escapeHtml(movie.title || "Untitled");
  const poster = escapeHtml(assetPath(movie.poster));
  const edition = escapeHtml(movie.edition || "");
  const year = escapeHtml(movie.year || "");
  const rating = escapeHtml(movie.rating || "");
  const runtime = escapeHtml(movie.runtime || "");
  const collection = escapeHtml(movie.collection || "");
  const franchise = escapeHtml(movie.franchise || "");

  movieDetail.innerHTML = `
    <article
      class="detail-card"
      style="--detail-bg: url('${poster}')"
    >
      <div class="detail-backdrop"></div>

      <div class="detail-content">
        <img
          class="detail-poster"
          src="${poster}"
          alt="${title}"
        >

        <div class="detail-copy">
          <h2>
            ${title}
          </h2>

          ${
            edition
              ? `
                <p class="detail-edition">
                  ${edition}
                </p>
              `
              : ""
          }

          <div class="detail-meta">
            ${year ? `<span>${year}</span>` : ""}
            ${rating ? `<span>${rating}</span>` : ""}
            ${runtime ? `<span>${runtime}</span>` : ""}
            ${format ? `<span>${escapeHtml(format)}</span>` : ""}
          </div>

          ${
            collection
              ? `
                <section class="detail-section">
                  <h3>Collection</h3>
                  <p>${collection}</p>
                </section>
              `
              : ""
          }

          ${
            franchise
              ? `
                <section class="detail-section">
                  <h3>Franchise</h3>
                  <p>${franchise}</p>
                </section>
              `
              : ""
          }
        </div>

        <div class="detail-actions">
          <button
            id="detailBackButton"
            class="back-button"
            type="button"
          >
            ← Back to Movies
          </button>
        </div>
      </div>
    </article>
  `;

  document
    .getElementById("detailBackButton")
    .addEventListener("click", showMovieLibrary);

  showView(movieDetailView, movie.title || "Movie Details");
}

movieSearch.addEventListener("input", runSearch);

clearSearchButton.addEventListener("click", () => {
  movieSearch.value = "";
  runSearch();
  movieSearch.focus();
});

homeButton.addEventListener("click", showHome);
movieHomeButton.addEventListener("click", showHome);
gameHomeButton.addEventListener("click", showHome);

openMoviesButton.addEventListener("click", showMovieLibrary);
openGamesButton.addEventListener("click", showGameLibrary);

renderMovies(getCollectionMovies());
showHome();
