document.addEventListener("DOMContentLoaded", () => {
  loadMovieInfo();
  playLogoIntro();
  startSceneRotation();
});

function startSceneRotation() {
  const scene1 = document.getElementById("scene1");
  const scene2 = document.getElementById("scene2");

  let showingLogo = true;

  setInterval(() => {
    showingLogo = !showingLogo;

    scene1.classList.toggle("active", showingLogo);
    scene2.classList.toggle("active", !showingLogo);

    if (showingLogo) {
      playLogoIntro();
    }
  }, 12000);
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