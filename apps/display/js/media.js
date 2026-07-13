function loadMediaInfo() {
  hideAllTemplates();

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

function loadGameTemplate() {
  const game = gameLibrary.find(
    (item) => item.id === theaterConfig.mediaId
  );

  if (!game) {
    console.error(`Game not found: ${theaterConfig.mediaId}`);
    loadIdleTemplate();
    return;
  }

  const gameTemplate = document.getElementById("gameTemplate");
  const gameBackground = document.getElementById("gameBackground");
  const gameTitle = document.getElementById("gameTitle");
  const gamePlatformLogo = document.getElementById("gamePlatformLogo");
  const gameDetails = document.getElementById("gameDetails");

  gameTemplate.classList.remove("hidden");
  
  document.body.classList.remove(
  "theme-movie",
  "theme-ps5",
  "theme-xbox",
  "theme-switch"
);

document.body.classList.add(`theme-${game.platform}`);  
  gameBackground.style.backgroundImage =
    `url("../../${game.background}")`;

  gameTitle.textContent = game.title;

  gamePlatformLogo.src =
    `../../assets/platforms/${game.platform}.png`;

  gamePlatformLogo.alt = game.platform.toUpperCase();

  gameDetails.textContent = game.release || "";
}

function loadMovieTemplate() {
  const movie = movieLibrary.find(
    (item) => item.id === theaterConfig.mediaId
  );

  if (!movie) {
    console.error(`Movie not found: ${theaterConfig.mediaId}`);
    loadIdleTemplate();
    return;
  }

  const movieTemplate = document.getElementById("movieTemplate");
  const moviePoster = document.getElementById("moviePoster");
  const movieDetails = document.getElementById("movieDetails");

  movieTemplate.classList.remove("hidden");

  document.body.classList.remove(
    "theme-movie",
    "theme-ps5",
    "theme-xbox",
    "theme-switch"
  );

  document.body.classList.add("theme-movie");

  moviePoster.src = `../../${movie.poster}`;
  moviePoster.alt = `${movie.title} poster`;

  const details = [
    movie.release,
    movie.runtime,
    movie.rating,
    movie.audio
  ].filter(Boolean);

  movieDetails.textContent = details.join(" • ");
}

function loadIdleTemplate() {
  const idleTemplate = document.getElementById("idleTemplate");

  idleTemplate.classList.remove("hidden");

  document.body.classList.remove(
    "theme-movie",
    "theme-ps5",
    "theme-xbox",
    "theme-switch"
  );
}