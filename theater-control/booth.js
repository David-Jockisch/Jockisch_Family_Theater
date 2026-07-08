const movieRows = document.getElementById("movieRows");
const libraryView = document.getElementById("libraryView");
const detailView = document.getElementById("detailView");
const builderView = document.getElementById("builderView");

const movieDetail = document.getElementById("movieDetail");
const presentationBuilder = document.getElementById("presentationBuilder");

const boothHeader = document.querySelector(".booth-header");

let selectedMovie = null;

function assetPath(path) {
  return `../${path}`;
}

function showView(targetView, direction = "right") {
  [libraryView, detailView, builderView].forEach(view => {
    view.classList.remove("active", "slide-in-right", "slide-in-left");
  });

  targetView.classList.add("active");

  if (direction === "right") {
    targetView.classList.add("slide-in-right");
  } else {
    targetView.classList.add("slide-in-left");
  }

  if (targetView === builderView) {
    boothHeader.classList.add("hidden");
  } else {
    boothHeader.classList.remove("hidden");
  }
}

function groupMoviesByCollection(movies) {
  return movies.reduce((groups, movie) => {
    const collection = movie.collection || "Other";

    if (!groups[collection]) {
      groups[collection] = [];
    }

    groups[collection].push(movie);
    return groups;
  }, {});
}

function renderLibrary() {
  const grouped = groupMoviesByCollection(movieLibrary);
  const collections = Object.keys(grouped).sort();

  movieRows.innerHTML = "";

  collections.forEach(collection => {
    const row = document.createElement("section");
    row.className = "collection-row";

    const title = document.createElement("h2");
    title.className = "collection-title";
    title.textContent = collection;

    const strip = document.createElement("div");
    strip.className = "poster-strip";

    const moviesInCollection = grouped[collection]
      .sort((a, b) => Number(a.year) - Number(b.year));

    const isSingleMovieCollection = moviesInCollection.length === 1;

    moviesInCollection.forEach(movie => {
      const tile = document.createElement("button");
      tile.className = isSingleMovieCollection
        ? "movie-tile single-movie-tile"
        : "movie-tile";

      tile.innerHTML = `
        <img src="${assetPath(movie.poster)}" alt="${movie.title}">
        ${isSingleMovieCollection ? "" : `<div class="movie-tile-title">${movie.title}</div>`}
      `;

      tile.addEventListener("click", () => showMovieDetail(movie));
      strip.appendChild(tile);
    });

    row.appendChild(title);
    row.appendChild(strip);
    movieRows.appendChild(row);
  });
}

function showMovieDetail(movie) {
  selectedMovie = movie;

  movieDetail.innerHTML = `
    <div class="detail-card">
      <img src="${assetPath(movie.poster)}" alt="${movie.title}">
      <h2>${movie.title}</h2>
      ${movie.edition ? `<div>${movie.edition}</div>` : ""}
      <div class="detail-meta">
        ${movie.year || ""}<br>
        ${movie.rating || ""}<br>
        ${movie.runtime || ""}
      </div>

<div class="detail-actions">

  <button id="configureButton" class="primary-button">
    Prepare Presentation
  </button>

  <button id="detailBackButton" class="back-button">
    ← Back to Library
  </button>

</div>    </div>
  `;

  document
    .getElementById("configureButton")
    .addEventListener("click", () => showPresentationBuilder(movie));
document
  .getElementById("detailBackButton")
  .addEventListener("click", () => {
    showView(libraryView, "left");
  });
  showView(detailView, "right");
}

function showPresentationBuilder(movie) {
  const demoOptions = demoLibrary
    .filter(demo => demo.enabled)
    .map(demo => `
      <label class="builder-option">
        <input type="checkbox" data-demo-id="${demo.id}">
        <span>${demo.title}</span>
      </label>
    `)
    .join("");

  presentationBuilder.innerHTML = `
    <div class="builder-hero" style="--builder-bg: url('${assetPath(movie.poster)}')">
      <div class="builder-poster-wrap">
        <img src="${assetPath(movie.poster)}" alt="${movie.title}">
      </div>

      <h2>Tonight's Presentation</h2>
      <h3>${movie.title}</h3>

      <div class="builder-options">
        <label class="builder-option">
          <input type="checkbox" checked data-presentation-item="theater-intro">
          <span>Theater Intro</span>
        </label>

        <div class="builder-section-title">Demo Clips</div>

        ${demoOptions}

        <div class="builder-section-title">Trailers</div>

        <label class="builder-option">
          <input type="checkbox" checked data-presentation-item="random-trailers">
          <span>Play Movie Trailers</span>
        </label>
      </div>

      <div class="builder-actions">
        <button class="primary-button start-button">
          Start Presentation
        </button>

        <button id="builderBackButton" class="builder-back-button">
          ← Back to Movie Details
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("builderBackButton")
    .addEventListener("click", () => {
      showView(detailView, "left");
    });

  showView(builderView, "right");
}

function enableDragScroll() {
  const strips = document.querySelectorAll(".poster-strip");

  strips.forEach(strip => {
    let isDown = false;
    let startX;
    let scrollLeft;

    strip.addEventListener("mousedown", e => {
      isDown = true;
      strip.classList.add("dragging");
      startX = e.pageX - strip.offsetLeft;
      scrollLeft = strip.scrollLeft;
    });

    strip.addEventListener("mouseleave", () => {
      isDown = false;
      strip.classList.remove("dragging");
    });

    strip.addEventListener("mouseup", () => {
      isDown = false;
      strip.classList.remove("dragging");
    });

    strip.addEventListener("mousemove", e => {
      if (!isDown) return;

      const x = e.pageX - strip.offsetLeft;
      const walk = (x - startX) * 1.4;

      if (Math.abs(walk) > 5) {
        e.preventDefault();
        strip.scrollLeft = scrollLeft - walk;
      }
    });
  });
}


renderLibrary();
enableDragScroll();