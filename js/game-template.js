function loadGameTemplate() {
    const game = gameLibrary.find(
        item => item.id === theaterConfig.mediaId
    );

    if (!game) {
        console.error(`Game not found: ${theaterConfig.mediaId}`);
        loadIdleTemplate();
        return;
    }

    // Look up the platform information
    const platform = platforms[game.platform];

    if (!platform) {
        console.error(`Platform not found: ${game.platform}`);
        loadIdleTemplate();
        return;
    }

    const template = document.getElementById("gameTemplate");
    const background = document.getElementById("gameBackground");
    const title = document.getElementById("gameTitle");
    const logo = document.getElementById("gamePlatformLogo");
    const details = document.getElementById("gameDetails");

    applyTheme(`theme-${platform.theme}`);

    template.classList.remove("hidden");

    background.style.backgroundImage = `url("${game.background}")`;

    title.textContent = game.title;

    fitTitleToContainer(title);

    logo.src = platform.logo;
    logo.alt = platform.name;
    logo.style.transform = `scale(${platform.logoScale})`;

    details.innerHTML = `
      <div class="game-meta-item">${game.genre}</div>

      <div class="game-meta-item">${game.players}</div>

      <div class="game-meta-year">${game.release}</div>
    `;
}

function applyTheme(themeClass) {
    const scene2 = document.getElementById("scene2");

    scene2.classList.remove(
        "theme-movie",
        "theme-ps5",
        "theme-xbox",
        "theme-switch"
    );

    scene2.classList.add(themeClass);
}

function fitTitleToContainer(titleElement) {
  const maxFontSize = 82;
  const minFontSize = 46;
  const step = 2;

  titleElement.style.fontSize = `${maxFontSize}px`;

  while (
    titleElement.scrollWidth > titleElement.clientWidth &&
    parseInt(titleElement.style.fontSize) > minFontSize
  ) {
    const currentSize = parseInt(titleElement.style.fontSize);
    titleElement.style.fontSize = `${currentSize - step}px`;
  }
}