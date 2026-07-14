const theaterConfig = {
  /*
  | mode options:
  |   "idle"  = default theater screen
  |   "movie" = movie poster screen
  |   "game"  = game artwork screen
  */

  mode: "movie",

  mediaId: "iron-man",

  timings: {
    logoBuild: 6800,
    logoHold: 1800,

    logoToPosterFade: 1800,
    logoToPosterBlack: 600,

    posterHold: 12000,

    posterToLogoFade: 700
  }
};

async function loadTheaterState() {
  const response = await fetch("/api/state");
  const state = await response.json();

  theaterConfig.mode = state.mode;
  theaterConfig.mediaId = state.mediaId;
}