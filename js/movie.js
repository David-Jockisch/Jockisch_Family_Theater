function loadMovieInfo() {
  const title = document.getElementById("movieTitle");
  const poster = document.getElementById("moviePoster");
  const details = document.getElementById("movieDetails");

  title.textContent = theaterConfig.movie.title;

  poster.src = theaterConfig.movie.poster;
  poster.alt = `${theaterConfig.movie.title} Poster`;

  details.textContent =
    `${theaterConfig.movie.rating} • ${theaterConfig.movie.runtime} • ${theaterConfig.movie.year}`;
}