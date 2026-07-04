function loadMovieTemplate() {
  const movie = movieLibrary.find(
    (item) => item.id === theaterConfig.mediaId
  );

  if (!movie) {
    console.error(`Movie not found: ${theaterConfig.mediaId}`);
    loadIdleTemplate();
    return;
  }

  const template = document.getElementById("movieTemplate");
  const poster = document.getElementById("moviePoster");
  const details = document.getElementById("movieDetails");

  template.classList.remove("hidden");

  poster.src = movie.poster;
  poster.alt = movie.title;

  let info = `${movie.rating} • ${movie.runtime} • ${movie.year}`;

  if (movie.edition) {
    info += `\n${movie.edition.toUpperCase()}`;
  }

  details.innerHTML = info.replace("\n", "<br>");
}