document.addEventListener("DOMContentLoaded", async () => {
  await loadTheaterState();
  loadMediaInfo();
  runTheaterLoop();

  setInterval(checkForStateChange, 1000);
});

async function checkForStateChange() {
  const response = await fetch("/api/state");
  const state = await response.json();

  const stateChanged =
    state.mode !== theaterConfig.mode ||
    state.mediaId !== theaterConfig.mediaId;

  if (!stateChanged) return;

  theaterConfig.mode = state.mode;
  theaterConfig.mediaId = state.mediaId;

  loadMediaInfo();
}
function getTiming() {
  return theaterConfig.timings;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTheaterLoop() {
  const timing = getTiming();

  const scene1 = document.getElementById("scene1");
  const scene2 = document.getElementById("scene2");

  while (true) {
    scene1.style.transitionDuration = `${timing.logoToPosterFade}ms`;
    scene2.style.transitionDuration = `${timing.posterToLogoFade}ms`;

    scene1.classList.add("active");
    scene2.classList.remove("active");

    playLogoIntro();

    await sleep(timing.logoBuild + timing.logoHold);

    scene1.classList.remove("active");

    await sleep(timing.logoToPosterFade + timing.logoToPosterBlack);

    scene2.style.transitionDuration = `${timing.logoToPosterFade}ms`;
    scene2.classList.add("active");

    await sleep(timing.posterHold);

    scene2.style.transitionDuration = `${timing.posterToLogoFade}ms`;
    scene2.classList.remove("active");

    await sleep(timing.posterToLogoFade);
  }
}

function playLogoIntro() {
  const logoLayers = document.querySelectorAll(".logo-layer");

  logoLayers.forEach((layer) => {
    layer.classList.remove("animate-logo");
  });

  setTimeout(() => {
    logoLayers.forEach((layer) => {
      layer.classList.add("animate-logo");
    });
  }, 50);
}