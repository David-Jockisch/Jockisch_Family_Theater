document.addEventListener("DOMContentLoaded", () => {
  loadMovieInfo();
  startSceneRotation();
});

function startSceneRotation() {
  const logoScene = document.getElementById("logoScene");
  const posterScene = document.getElementById("posterScene");

  let showingLogo = true;

  setInterval(() => {
    showingLogo = !showingLogo;

    logoScene.classList.toggle("active-scene", showingLogo);
    posterScene.classList.toggle("active-scene", !showingLogo);
  }, 10000);
}