const theaterConfig = {
  /*
  | mode options:
  |   "idle"  = default theater screen
  |   "movie" = movie poster screen
  |   "game"  = game artwork screen
  */

  mode: "game",

  mediaId: "indiana-jones-and-the-great-circle",

  timings: {
    logoBuild: 6800,
    logoHold: 1800,

    logoToPosterFade: 1800,
    logoToPosterBlack: 600,

    posterHold: 12000,

    posterToLogoFade: 700
  }
};