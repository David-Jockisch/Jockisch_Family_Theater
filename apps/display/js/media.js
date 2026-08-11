function loadMediaInfo() {
  hideAllTemplates();

  console.log("[JFT Display] Rendering state:", {
    mode: theaterConfig.mode,
    mediaId: theaterConfig.mediaId
  });

  switch (theaterConfig.mode) {
    case "movie":
      loadMovieTemplate();
      break;

    case "game":
      loadGameTemplate();
      break;

    case "idle":
    default:
      loadIdleTemplate();
      break;
  }
}

function hideAllTemplates() {
  document.getElementById("movieTemplate").classList.add("hidden");
  document.getElementById("gameTemplate").classList.add("hidden");
  document.getElementById("idleTemplate").classList.add("hidden");
}

function toServerPath(value) {
  if (!value) return "";

  const pathValue = String(value).trim();

  if (/^(https?:|data:|blob:)/i.test(pathValue)) {
    return pathValue;
  }

  return pathValue.startsWith("/")
    ? pathValue
    : `/${pathValue.replace(/^\.?\/?/, "")}`;
}

function setTheme(themeName) {
  document.body.classList.remove(
    "theme-movie",
    "theme-ps5",
    "theme-xbox",
    "theme-switch",
    "theme-seriesx",
    "theme-xboxone",
    "theme-ps4",
    "theme-ps3"
  );

  if (themeName) {
    document.body.classList.add(themeName);
  }
}

function loadGameTemplate() {
  const library = Array.isArray(window.gameLibrary)
    ? window.gameLibrary
    : [];

  if (library.length === 0) {
    console.error("[JFT Display] Game library is unavailable.");
    loadIdleTemplate("Game Library Unavailable");
    return;
  }

  const game = library.find(
    item => item && item.id === theaterConfig.mediaId
  );

  if (!game) {
    console.error(`[JFT Display] Game not found: ${theaterConfig.mediaId}`);
    loadIdleTemplate("Game Not Found");
    return;
  }

  const gameTemplate = document.getElementById("gameTemplate");
  const gameBackground = document.getElementById("gameBackground");
  const gameTitle = document.getElementById("gameTitle");
  const gamePlatformLogo = document.getElementById("gamePlatformLogo");
  const gameDetails = document.getElementById("gameDetails");

  gameTemplate.classList.remove("hidden");
  setTheme(`theme-${game.platform}`);

  const background = toServerPath(
    game.background || game.poster || game.cover
  );

  gameBackground.style.backgroundImage = background
    ? `url("${background}")`
    : "none";

  gameTitle.textContent = game.title || "Game Night";

  gamePlatformLogo.src = `/assets/platforms/${game.platform}.png`;
  gamePlatformLogo.alt = String(game.platform || "Game platform").toUpperCase();

  gameDetails.textContent = game.release || "";

  console.log("[JFT Display] Game loaded:", game.title);
}

function loadMovieTemplate() {
  const library = Array.isArray(window.movieLibrary)
    ? window.movieLibrary
    : (typeof movieLibrary !== "undefined" && Array.isArray(movieLibrary)
      ? movieLibrary
      : []);

  if (library.length === 0) {
    console.error("[JFT Display] Movie library is unavailable.");
    loadIdleTemplate("Movie Library Unavailable");
    return;
  }

  const movie = library.find(
    item => item && item.id === theaterConfig.mediaId
  );

  if (!movie) {
    console.error(`[JFT Display] Movie not found: ${theaterConfig.mediaId}`);
    loadIdleTemplate("Movie Not Found");
    return;
  }

  const movieTemplate = document.getElementById("movieTemplate");
  const moviePoster = document.getElementById("moviePoster");
  const movieDetails = document.getElementById("movieDetails");

  movieTemplate.classList.remove("hidden");
  setTheme("theme-movie");

  const posterPath = toServerPath(movie.poster);

  moviePoster.src = posterPath;
  moviePoster.alt = `${movie.title || "Movie"} poster`;

  moviePoster.onerror = () => {
    console.error(
      `[JFT Display] Poster failed to load for ${movie.title}: ${posterPath}`
    );
  };

  const details = [
    movie.year || movie.release,
    movie.runtime,
    movie.rating,
    movie.audio
  ].filter(Boolean);

  movieDetails.textContent = details.join(" • ");

  console.log("[JFT Display] Movie loaded:", {
    title: movie.title,
    id: movie.id,
    poster: posterPath
  });
}

function loadIdleTemplate(message = "No Event Selected") {
  const idleTemplate = document.getElementById("idleTemplate");
  const idleSubtitle = idleTemplate.querySelector(".idle-subtitle");

  idleTemplate.classList.remove("hidden");
  setTheme("");

  if (idleSubtitle) {
    idleSubtitle.textContent = message;
  }
}
