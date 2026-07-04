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