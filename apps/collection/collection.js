const libraryView = document.getElementById("libraryView");
const detailView = document.getElementById("detailView");

const movieGrid = document.getElementById("movieGrid");
const movieDetail = document.getElementById("movieDetail");
const movieCount = document.getElementById("movieCount");

const movieSearch = document.getElementById("movieSearch");
const clearSearchButton = document.getElementById(
  "clearSearchButton"
);

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
  if (!Array.isArray(movieLibrary)) {
    return [];
  }

  return movieLibrary
    .filter(movie => {
      return movie.type !== "games-library";
    })
    .slice()
    .sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
}

function showView(targetView) {
  [libraryView, detailView].forEach(view => {
    view.classList.remove("active");
  });

  targetView.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function createMovieCard(movie) {
  const card = document.createElement("button");
  const format = getMovieFormat(movie);

  card.className = "movie-card";
  card.type = "button";

  card.innerHTML = `
    <div class="movie-poster-shell">
      <img
        src="${assetPath(movie.poster)}"
        alt="${movie.title}"
        loading="lazy"
      >

      ${
        format
          ? `
            <span class="format-badge">
              ${format}
            </span>
          `
          : ""
      }
    </div>

    <div class="movie-card-copy">
      <h2 class="movie-card-title">
        ${movie.title}
      </h2>

      <p class="movie-card-meta">
        ${movie.year || "Year unknown"}
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

  movieCount.textContent = String(movies.length);
  emptyState.hidden = movies.length !== 0;
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

  movieDetail.innerHTML = `
    <article
      class="detail-card"
      style="
        --detail-bg:
        url('${assetPath(movie.poster)}')
      "
    >
      <div class="detail-backdrop"></div>

      <div class="detail-content">
        <img
          class="detail-poster"
          src="${assetPath(movie.poster)}"
          alt="${movie.title}"
        >

        <div class="detail-copy">
          <h2>
            ${movie.title}
          </h2>

          ${
            movie.edition
              ? `
                <p class="detail-edition">
                  ${movie.edition}
                </p>
              `
              : ""
          }

          <div class="detail-meta">
            ${
              movie.year
                ? `<span>${movie.year}</span>`
                : ""
            }

            ${
              movie.rating
                ? `<span>${movie.rating}</span>`
                : ""
            }

            ${
              movie.runtime
                ? `<span>${movie.runtime}</span>`
                : ""
            }

            ${
              format
                ? `<span>${format}</span>`
                : ""
            }
          </div>

          ${
            movie.collection
              ? `
                <section class="detail-section">
                  <h3>Collection</h3>

                  <p>
                    ${movie.collection}
                  </p>
                </section>
              `
              : ""
          }

          ${
            movie.franchise
              ? `
                <section class="detail-section">
                  <h3>Franchise</h3>

                  <p>
                    ${movie.franchise}
                  </p>
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
            ← Back to Collection
          </button>
        </div>
      </div>
    </article>
  `;

  document
    .getElementById("detailBackButton")
    .addEventListener("click", () => {
      showView(libraryView);
    });

  showView(detailView);
}

movieSearch.addEventListener("input", runSearch);

clearSearchButton.addEventListener("click", () => {
  movieSearch.value = "";
  runSearch();
  movieSearch.focus();
});

renderMovies(getCollectionMovies());