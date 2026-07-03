document.addEventListener("DOMContentLoaded", () => {
  loadMovieInfo();
  runTheaterLoop();
});

const timing = {
  logoBuild: 6800,
  logoHold: 1800,

  logoToPosterFade: 1800,
  logoToPosterBlack: 600,

  posterHold: 12000,

  posterToLogoFade: 700
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTheaterLoop() {
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