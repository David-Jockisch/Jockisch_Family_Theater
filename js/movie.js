function getActiveMovie() {
  if (!theaterConfig.activeMovieId) {
    return null;
  }

  const movie = movieLibrary.find(
    (item) => item.id === theaterConfig.activeMovieId
  );

  if (!movie) {
    console.error(`Movie not found: ${theaterConfig.activeMovieId}`);
    return null;
  }

  return movie;
}

function loadMovieInfo() {
  const movie = getActiveMovie();

  if (!movie) {
    loadIdleScene();
    return;
  }

  loadPosterScene(movie);
}

function loadPosterScene(movie) {
  const movieMode = document.getElementById("movieMode");
  const idleMode = document.getElementById("idleMode");
  const poster = document.getElementById("moviePoster");
  const details = document.getElementById("movieDetails");

  movieMode.classList.remove("hidden");
  idleMode.classList.add("hidden");

  poster.src = movie.poster;
  poster.alt = movie.title;

  let info = `${movie.rating} • ${movie.runtime} • ${movie.year}`;

  if (movie.edition) {
    info += `\n${movie.edition.toUpperCase()}`;
  }

  details.innerHTML = info.replace("\n", "<br>");
}

function loadIdleScene() {
  const movieMode = document.getElementById("movieMode");
  const idleMode = document.getElementById("idleMode");
  const poster = document.getElementById("moviePoster");
  const details = document.getElementById("movieDetails");

  movieMode.classList.add("hidden");
  idleMode.classList.remove("hidden");

  poster.src = "";
  poster.alt = "";
  details.innerHTML = "";
}