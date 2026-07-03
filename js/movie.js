function loadMovieInfo() {
  document.getElementById("theaterName").textContent =
    theaterConfig.theaterName;

  document.getElementById("movieTitle").textContent =
    theaterConfig.movie.title;

  document.getElementById("moviePoster").src =
    theaterConfig.movie.poster;

  document.getElementById("moviePoster").alt =
    `${theaterConfig.movie.title} Poster`;

  document.getElementById("movieDetails").textContent =
    `${theaterConfig.movie.rating} • ${theaterConfig.movie.runtime} • ${theaterConfig.movie.year}`;
}