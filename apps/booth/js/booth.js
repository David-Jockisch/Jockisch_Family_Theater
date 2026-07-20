const app = document.getElementById("app");

const movieRows = document.getElementById("movieRows");
const libraryView = document.getElementById("libraryView");
const detailView = document.getElementById("detailView");
const builderView = document.getElementById("builderView");
const readyView = document.getElementById("readyView");

const gameLibraryView = document.getElementById("gameLibraryView");
const gameDetailView = document.getElementById("gameDetailView");
const gameRows = document.getElementById("gameRows");
const gameDetail = document.getElementById("gameDetail");

const movieDetail = document.getElementById("movieDetail");
const presentationBuilder = document.getElementById(
  "presentationBuilder"
);
const presentationReady = document.getElementById(
  "presentationReady"
);

const boothHeader = document.querySelector(".booth-header");

let selectedMovie = null;

function assetPath(path) {
  return path || "";
}

function forceScrollTop() {
  window.scrollTo(0, 0);

  requestAnimationFrame(() => {
    window.scrollTo(0, 0);

    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 60);
  });
}

function showView(targetView, direction = "right") {
  [
    libraryView,
    detailView,
    builderView,
    readyView,
    gameLibraryView,
    gameDetailView
  ].forEach(view => {
    view.classList.remove(
      "active",
      "slide-in-right",
      "slide-in-left"
    );
  });

  targetView.classList.add("active");

  targetView.classList.add(
    direction === "right"
      ? "slide-in-right"
      : "slide-in-left"
  );

  if (targetView === libraryView) {
    boothHeader.classList.remove("hidden");
    app.classList.remove("immersive");
  } else {
    boothHeader.classList.add("hidden");
    app.classList.add("immersive");
  }

  forceScrollTop();
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

function groupGamesByPlatform(games) {
  return games.reduce((groups, game) => {
    const platform = game.platform || "Other";

    if (!groups[platform]) {
      groups[platform] = [];
    }

    groups[platform].push(game);

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

    const moviesInCollection = grouped[collection].sort(
      (a, b) =>
        Number(a.year || 0) - Number(b.year || 0)
    );

    const isSingleMovieCollection =
      moviesInCollection.length === 1;

    moviesInCollection.forEach(movie => {
      const tile = document.createElement("button");

      tile.className = isSingleMovieCollection
        ? "movie-tile single-movie-tile"
        : "movie-tile";

      tile.innerHTML = `
        <img
          src="${assetPath(movie.poster)}"
          alt="${movie.title}"
        >

        ${
          isSingleMovieCollection
            ? ""
            : `
              <div class="movie-tile-title">
                ${movie.title}
              </div>
            `
        }
      `;

      tile.addEventListener("click", () => {
        if (movie.id === "games-library") {
          showGameLibrary();
        } else {
          showMovieDetail(movie);
        }
      });

      strip.appendChild(tile);
    });

    row.appendChild(title);
    row.appendChild(strip);
    movieRows.appendChild(row);
  });
}

function showGameLibrary() {
  renderGameLibrary();
  showView(gameLibraryView, "right");
}

function renderGameLibrary() {
  const grouped = groupGamesByPlatform(gameLibrary);
  const platforms = Object.keys(grouped).sort();

  gameRows.innerHTML = "";

  platforms.forEach(platform => {
    const row = document.createElement("section");
    row.className = "collection-row";

    const title = document.createElement("h2");
    title.className = "collection-title";
    title.textContent = platform.toUpperCase();

    const strip = document.createElement("div");
    strip.className = "poster-strip";

    grouped[platform]
      .sort((a, b) =>
        a.title.localeCompare(b.title)
      )
      .forEach(game => {
        const tile = document.createElement("button");

        tile.className = "movie-tile game-tile";

        const gameImage =
          game.poster ||
          game.background ||
          game.cover;

        tile.innerHTML = `
          <img
            src="${assetPath(gameImage)}"
            alt="${game.title}"
          >

          <div class="game-tile-title">
            ${game.title}
          </div>
        `;

        tile.addEventListener("click", () => {
          showGameDetail(game);
        });

        strip.appendChild(tile);
      });

    row.appendChild(title);
    row.appendChild(strip);
    gameRows.appendChild(row);
  });

  const backContainer = document.createElement("div");
  backContainer.className = "builder-actions";

  backContainer.innerHTML = `
    <button
      id="gameLibraryBackButton"
      class="back-button"
    >
      ← Back to Movies
    </button>
  `;

  gameRows.appendChild(backContainer);

  document
    .getElementById("gameLibraryBackButton")
    .addEventListener("click", () => {
      showView(libraryView, "left");
    });

  enableDragScroll();
}

function showGameDetail(game) {
  const gameImage =
    game.poster ||
    game.background ||
    game.cover;

  gameDetail.innerHTML = `
    <div
      class="detail-card detail-hero"
      style="
        --detail-bg:
        url('${assetPath(gameImage)}')
      "
    >
      <img
        src="${assetPath(gameImage)}"
        alt="${game.title}"
      >

      <h2>${game.title}</h2>

      <div class="detail-meta">
        ${game.platform || ""}<br>
        ${game.year || game.release || ""}
      </div>

      <div class="detail-actions">
        <button
          id="pushGameButton"
          class="primary-button"
        >
          Push to Display
        </button>

        <button
          id="gameDetailBackButton"
          class="back-button"
        >
          ← Back to Games
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("pushGameButton")
    .addEventListener("click", async () => {
      try {
        const response = await fetch("/api/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mode: "game",
            mediaId: game.id
          })
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.error ||
            "Failed to update theater state."
          );
        }

        console.log(
          "Game pushed to display:",
          game
        );
      } catch (error) {
        console.error(
          "Game display update failed:",
          error
        );

        alert(
          "The game could not be sent to the Display OS. " +
          "Please confirm the Theater Server is running."
        );
      }
    });

  document
    .getElementById("gameDetailBackButton")
    .addEventListener("click", () => {
      showView(gameLibraryView, "left");
    });

  showView(gameDetailView, "right");
}

function showMovieDetail(movie) {
  selectedMovie = movie;

  movieDetail.innerHTML = `
    <div
      class="detail-card detail-hero"
      style="
        --detail-bg:
        url('${assetPath(movie.poster)}')
      "
    >
      <img
        src="${assetPath(movie.poster)}"
        alt="${movie.title}"
      >

      <h2>${movie.title}</h2>

      ${
        movie.edition
          ? `<div>${movie.edition}</div>`
          : ""
      }

      <div class="detail-meta">
        ${movie.year || ""}<br>
        ${movie.rating || ""}<br>
        ${movie.runtime || ""}
      </div>

      <div class="detail-actions">
        <button
          id="configureButton"
          class="primary-button"
        >
          Prepare Presentation
        </button>

        <button
          id="detailBackButton"
          class="back-button"
        >
          ← Back to Library
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("configureButton")
    .addEventListener("click", () => {
      showPresentationBuilder(movie);
    });

  document
    .getElementById("detailBackButton")
    .addEventListener("click", () => {
      showView(libraryView, "left");
    });

  showView(detailView, "right");
}

function buildPresentationPlan(movie) {
  const introEnabled = document.querySelector(
    '[data-presentation-item="theater-intro"]'
  )?.checked;

  const demosEnabled = document.querySelector(
    '[data-presentation-item="random-demos"]'
  )?.checked;

  const trailersEnabled = document.querySelector(
    '[data-presentation-item="random-trailers"]'
  )?.checked;

  return {
    movieId: movie.id,
    title: movie.title,
    intro: Boolean(introEnabled),
    demos: Boolean(demosEnabled),
    randomTrailers: Boolean(trailersEnabled),
    demoCount: demosEnabled ? 2 : 0,
    trailerCount: trailersEnabled ? 2 : 0
  };
}

async function showPresentationBuilder(movie) {
  /*
   * Prepare Presentation
   *
   * Update the outside Display OS immediately when the user
   * enters the presentation builder.
   */

  try {
    const prepareResponse = await fetch(
      "/api/prepare",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "movie",
          mediaId: movie.id
        })
      }
    );

    if (!prepareResponse.ok) {
      const errorData = await prepareResponse
        .json()
        .catch(() => ({}));

      throw new Error(
        errorData.error ||
        "The Display OS could not be updated."
      );
    }

    const prepareResult =
      await prepareResponse.json();

    console.log(
      "Presentation prepared:",
      prepareResult
    );
  } catch (error) {
    console.error(
      "Prepare Presentation failed:",
      error
    );

    alert(
      "The movie could not be sent to the Display OS. " +
      "Please confirm the Theater Server is running."
    );

    return;
  }

  presentationBuilder.innerHTML = `
    <div
      class="builder-hero"
      style="
        --builder-bg:
        url('${assetPath(movie.poster)}')
      "
    >
      <h2>Tonight's Presentation</h2>
      <h3>${movie.title}</h3>

      <div class="builder-options">
        <label class="builder-option">
          <input
            type="checkbox"
            checked
            data-presentation-item="theater-intro"
          >

          <span>Theater Intro</span>
        </label>

        <label class="builder-option">
          <input
            type="checkbox"
            checked
            data-presentation-item="random-demos"
          >

          <span>Demo Clips</span>
        </label>

        <label class="builder-option">
          <input
            type="checkbox"
            checked
            data-presentation-item="random-trailers"
          >

          <span>Movie Trailers</span>
        </label>
      </div>

      <div class="builder-actions">
        <button
          id="startPresentationButton"
          class="primary-button start-button"
        >
          Start Presentation
        </button>

        <button
          id="builderBackButton"
          class="builder-back-button"
        >
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

  document
    .getElementById("startPresentationButton")
    .addEventListener("click", async () => {
      const startButton = document.getElementById(
        "startPresentationButton"
      );

      const presentationPlan =
        buildPresentationPlan(movie);

      startButton.disabled = true;
      startButton.textContent =
        "Starting Presentation...";

      try {
        /*
         * The Display OS was already updated when
         * Prepare Presentation was selected.
         *
         * Start Presentation now sends the selected
         * options to the mpv playback system.
         */

        const response = await fetch(
          "/api/playback/start",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              includeIntro:
                presentationPlan.intro,

              includeDemos:
                presentationPlan.demos,

              includeTrailers:
                presentationPlan.randomTrailers,

              includeFeaturePresentation:
                true,

              demoCount:
                presentationPlan.demoCount,

              trailerCount:
                presentationPlan.trailerCount
            })
          }
        );

        const result = await response
          .json()
          .catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
            "Unable to start the presentation."
          );
        }

        console.log(
          "Presentation started:",
          result
        );

        console.log(
          "Presentation plan:",
          presentationPlan
        );

        showPresentationReady(
          presentationPlan,
          movie
        );
      } catch (error) {
        console.error(
          "Presentation startup failed:",
          error
        );

        alert(
          "The presentation could not be started.\n\n" +
          (
            error.message ||
            "Please confirm the Theater Server is running."
          )
        );

        startButton.disabled = false;
        startButton.textContent =
          "Start Presentation";
      }
    });

  showView(builderView, "right");
}

function showPresentationReady(plan, movie) {
  presentationReady.innerHTML = `
    <div
      class="builder-hero"
      style="
        --builder-bg:
        url('${assetPath(movie.poster)}')
      "
    >
      <h2>FEATURE PRESENTATION</h2>

      <div class="builder-options">
        <div class="builder-option">
          <span>Movie</span>
          <strong>${movie.title}</strong>
        </div>

        <div class="builder-option">
          <span>Theater Intro</span>

          <strong>
            ${plan.intro ? "Yes" : "No"}
          </strong>
        </div>

        <div class="builder-option">
          <span>Demo Clips</span>

          <strong>
            ${
              plan.demos
                ? `${plan.demoCount} Random`
                : "No"
            }
          </strong>
        </div>

        <div class="builder-option">
          <span>Movie Trailers</span>

          <strong>
            ${
              plan.randomTrailers
                ? `${plan.trailerCount} Random`
                : "No"
            }
          </strong>
        </div>
      </div>

      <div class="builder-actions">
        <button
          id="readyHomeButton"
          class="primary-button start-button"
        >
          Return to Library
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("readyHomeButton")
    .addEventListener("click", () => {
      showView(libraryView, "left");
    });

  showView(readyView, "right");
}

function enableDragScroll() {
  const strips = document.querySelectorAll(
    ".poster-strip"
  );

  strips.forEach(strip => {
    let isDown = false;
    let startX;
    let scrollLeft;

    strip.addEventListener(
      "mousedown",
      event => {
        isDown = true;
        strip.classList.add("dragging");

        startX =
          event.pageX - strip.offsetLeft;

        scrollLeft = strip.scrollLeft;
      }
    );

    strip.addEventListener(
      "mouseleave",
      () => {
        isDown = false;
        strip.classList.remove("dragging");
      }
    );

    strip.addEventListener(
      "mouseup",
      () => {
        isDown = false;
        strip.classList.remove("dragging");
      }
    );

    strip.addEventListener(
      "mousemove",
      event => {
        if (!isDown) {
          return;
        }

        const x =
          event.pageX - strip.offsetLeft;

        const walk =
          (x - startX) * 1.4;

        if (Math.abs(walk) > 5) {
          event.preventDefault();

          strip.scrollLeft =
            scrollLeft - walk;
        }
      }
    );
  });
}

renderLibrary();
enableDragScroll();