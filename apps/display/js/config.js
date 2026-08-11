const theaterConfig = {
  /*
  | mode options:
  |   "idle"  = default theater screen
  |   "movie" = movie poster screen
  |   "game"  = game artwork screen
  */

  mode: "idle",
  mediaId: null,

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
  const response = await fetch("/api/state", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`State request failed with ${response.status}`);
  }

  const state = await response.json();

  theaterConfig.mode = state.mode || "idle";
  theaterConfig.mediaId = state.mediaId || null;

  console.log("[JFT Display] Initial state:", state);
}
