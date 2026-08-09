const app = document.getElementById('app');
const pageTitle = document.getElementById('pageTitle');
const backButton = document.getElementById('backButton');
const serverDot = document.getElementById('serverDot');
const toast = document.getElementById('toast');

const state = {
  route: 'home',
  platforms: [],
  selectedPlatform: 'ps5',
  selected: null,
  wishlistTab: 'movie',
  history: []
};

const API = '/api/importer';
const GIT_API = '/api/git';
const HOLD_MS = 620;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function setRoute(route, options = {}) {
  if (state.route !== route && !options.replace) state.history.push(state.route);
  state.route = route;
  render();
}

function goBack() {
  state.route = state.history.pop() || 'home';
  state.selected = null;
  render();
}

backButton.addEventListener('click', goBack);

function bindNav() {
  document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => setRoute(button.dataset.route)));
}

function enableHold(element, callback) {
  let timer = null;
  let start = 0;
  let frame = null;
  let fired = false;

  const reset = () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = null;
    element.classList.remove('holding');
    element.style.setProperty('--press', '0deg');
    element.style.setProperty('--hold-progress', '0');
  };

  const tick = () => {
    if (!timer) return;
    const progress = Math.min(1, (performance.now() - start) / HOLD_MS);
    element.style.setProperty('--press', `${progress * 360}deg`);
    element.style.setProperty('--hold-progress', String(progress));
    if (progress < 1) frame = requestAnimationFrame(tick);
  };

  const begin = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    fired = false;
    start = performance.now();
    element.classList.add('holding');
    timer = setTimeout(() => {
      fired = true;
      reset();
      if (navigator.vibrate) navigator.vibrate(35);
      callback();
    }, HOLD_MS);
    frame = requestAnimationFrame(tick);
  };

  element.addEventListener('pointerdown', begin);
  ['pointerup','pointercancel','pointerleave'].forEach(name => element.addEventListener(name, () => { if (!fired) reset(); }));
  element.addEventListener('contextmenu', event => event.preventDefault());
  element.addEventListener('click', event => { if (fired) { event.preventDefault(); event.stopPropagation(); } });
}

function bindHold(selector, callback) {
  document.querySelectorAll(selector).forEach(element => enableHold(element, () => callback(element)));
}

function renderHome() {
  pageTitle.textContent = 'Mobile Importer';
  backButton.classList.add('hidden');
  app.innerHTML = document.getElementById('homeTemplate').innerHTML;
  bindNav();
  updateGitBadge();
}

function searchPanel(kind) {
  const game = kind === 'games';
  return `
    <section class="panel">
      ${game ? `<div class="field"><label>Platform</label><select id="platformSelect">${state.platforms.map(p => `<option value="${p.value}" ${p.value === state.selectedPlatform ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}</select></div><div style="height:10px"></div>` : ''}
      <div class="search-row">
        <input id="searchInput" autocomplete="off" autocapitalize="words" placeholder="${game ? 'Search for a game…' : 'Search for a movie…'}">
        <button id="searchButton" class="search-button" type="button">Search</button>
      </div>
    </section>
    <section id="results"></section>`;
}

function renderSearch(kind) {
  pageTitle.textContent = kind === 'movies' ? 'Movie Importer' : 'Game Importer';
  backButton.classList.remove('hidden');
  app.innerHTML = searchPanel(kind);
  const input = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  if (kind === 'games') document.getElementById('platformSelect').addEventListener('change', e => state.selectedPlatform = e.target.value);
  const run = () => runSearch(kind, input.value.trim());
  searchButton.addEventListener('click', run);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  setTimeout(() => input.focus(), 50);
}

async function runSearch(kind, query) {
  if (!query) return;
  const results = document.getElementById('results');
  results.innerHTML = '<div class="loader"></div>';
  try {
    const url = kind === 'movies' ? `${API}/movies/search?q=${encodeURIComponent(query)}` : `${API}/games/search?q=${encodeURIComponent(query)}&platform=${encodeURIComponent(state.selectedPlatform)}`;
    const data = await api(url);
    if (!data.results.length) { results.innerHTML = '<div class="empty">No matches found.</div>'; return; }
    results.innerHTML = `<div class="hold-tip"><span class="hold-ring mini"></span><span>Hold the correct result to continue.</span></div><div class="results-grid">${data.results.map(item => mediaCard(item, kind)).join('')}</div>`;
    bindHold('.media-card', async card => {
      const id = card.dataset.id;
      results.innerHTML = '<div class="loader"></div>';
      try {
        const detail = kind === 'movies' ? await api(`${API}/movies/${id}`) : await api(`${API}/games/${id}?platform=${encodeURIComponent(state.selectedPlatform)}`);
        state.selected = kind === 'movies' ? { kind, tmdbId: id, ...detail.movie } : { kind, igdbId: id, ...detail.game };
        setRoute(kind === 'movies' ? 'movie-detail' : 'game-detail');
      } catch (error) { showToast(error.message, 'error'); renderSearch(kind); }
    });
  } catch (error) { results.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
}

function mediaCard(item, kind, wishlist = false) {
  const poster = item.posterUrl || item.poster;
  const sub = wishlist ? (item.mediaType === 'movie' ? item.desiredFormat : platformLabel(item.platform)) : `${item.year || 'Unknown'}${kind === 'games' && item.type ? ` · ${item.type}` : ''}`;
  return `<article class="media-card" data-id="${escapeHtml(item.id)}" data-type="${escapeHtml(item.mediaType || kind)}" data-platform="${escapeHtml(item.platform || '')}">
    <div class="poster-wrap">${poster ? `<img src="${escapeHtml(poster)}" alt="">` : '<div class="poster-placeholder">?</div>'}<div class="press-overlay"></div>${kind === 'games' && item.platformMatch ? '<div class="badges"><span class="badge match">PLATFORM MATCH</span></div>' : ''}</div>
    <div class="card-body"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(sub || '')}</p></div>
  </article>`;
}

function detailHero(item, poster, meta) {
  return `<section class="panel detail-hero">${poster ? `<img src="${escapeHtml(poster)}" alt="">` : '<div></div>'}<div><div class="meta-line">${escapeHtml(meta)}</div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.overview || item.summary || '')}</p></div></section>`;
}

function field(name, label, value, type = 'text') {
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" type="${type}" value="${escapeHtml(value || '')}"></div>`;
}

function renderMovieDetail() {
  const m = state.selected;
  if (!m) return setRoute('movies', { replace: true });
  pageTitle.textContent = 'Review Movie'; backButton.classList.remove('hidden');
  app.innerHTML = `${detailHero(m, m.tmdbPosterPath ? `https://image.tmdb.org/t/p/w780${m.tmdbPosterPath}` : m.poster, `${m.year} · ${m.rating} · ${m.runtime}`)}
    <section class="panel"><div class="field-grid two">
      ${field('title','Title',m.title)}${field('edition','Edition',m.edition)}${field('collection','Collection',m.collection)}${field('franchise','Franchise',m.franchise)}${field('boothGroup','Booth Group',m.boothGroup)}${field('posterFolder','Poster Folder',m.posterFolder)}${field('year','Year',m.year)}${field('rating','Rating',m.rating)}${field('runtime','Runtime',m.runtime)}
    </div></section>
    <div class="action-stack"><button id="addMovie" class="primary-button hold-button" type="button">Hold to Add Movie</button><button id="wishlistMovie" class="secondary-button hold-button" type="button">Hold to Add to Wishlist</button></div>`;
  enableHold(document.getElementById('addMovie'), () => saveMovie(false));
  enableHold(document.getElementById('wishlistMovie'), () => saveMovie(true));
}

async function saveMovie(wishlist) {
  const body = { tmdbId: state.selected.tmdbId, title: value('title'), year: value('year'), posterFolder: value('posterFolder') };
  try {
    if (wishlist) {
      const desiredFormat = value('edition') || '4K Blu Ray';
      await api(`${API}/wishlist/movie`, { method: 'POST', body: JSON.stringify({ ...body, desiredFormat }) });
      showToast(`${body.title} added to Wishlist.`);
    } else {
      Object.assign(body, { edition: value('edition'), collection: value('collection'), franchise: value('franchise'), boothGroup: value('boothGroup'), rating: value('rating'), runtime: value('runtime') });
      const result = await api(`${API}/movies/import`, { method: 'POST', body: JSON.stringify(body) });
      showToast(`${body.title} ${result.action}.`);
    }
  } catch (error) { showToast(error.message, 'error'); }
}

function renderGameDetail() {
  const g = state.selected;
  if (!g) return setRoute('games', { replace: true });
  pageTitle.textContent = 'Review Game'; backButton.classList.remove('hidden');
  app.innerHTML = `${detailHero(g, g.posterUrl, `${platformLabel(g.platform)} · ${g.release}`)}
    <section class="panel"><div class="field-grid two">
      ${field('gameTitle','Title',g.title)}${field('gameCollection','Collection',g.collection)}${field('gamePublisher','Publisher',g.publisher)}${field('gameDeveloper','Developer',g.developer)}${field('gameGenre','Genre',g.genre)}${field('gamePlayers','Players',g.players)}${field('gameRating','Rating',g.rating)}
      <div class="field"><label>Ownership</label><select id="ownership"><option value="disc">Disc / Cartridge</option><option value="digital">Digital</option></select></div>
    </div></section>
    <div class="action-stack"><button id="addGame" class="primary-button hold-button">Hold to Add Game</button><button id="wishlistGame" class="secondary-button hold-button">Hold to Add to Wishlist</button></div>`;
  enableHold(document.getElementById('addGame'), () => saveGame(false));
  enableHold(document.getElementById('wishlistGame'), () => saveGame(true));
}

async function saveGame(wishlist) {
  const platform = state.selected.platform || state.selectedPlatform;
  try {
    if (wishlist) {
      await api(`${API}/wishlist/game`, { method: 'POST', body: JSON.stringify({ igdbId: state.selected.igdbId, platform }) });
      showToast(`${state.selected.title} added to Wishlist.`);
    } else {
      const overrides = { title: value('gameTitle'), collection: value('gameCollection'), publisher: value('gamePublisher'), developer: value('gameDeveloper'), genre: value('gameGenre'), players: value('gamePlayers'), rating: value('gameRating') };
      await api(`${API}/games/import`, { method: 'POST', body: JSON.stringify({ igdbId: state.selected.igdbId, platform, ownership: value('ownership'), overrides }) });
      showToast(`${overrides.title} added to ${platformLabel(platform)}.`);
    }
  } catch (error) { showToast(error.message, 'error'); }
}

async function renderWishlist() {
  pageTitle.textContent = 'Wishlist'; backButton.classList.remove('hidden');
  app.innerHTML = '<div class="loader"></div>';
  try {
    const data = await api(`${API}/wishlist`);
    const filtered = data.items.filter(x => x.mediaType === state.wishlistTab);
    app.innerHTML = `<div class="segmented"><button data-tab="movie" class="${state.wishlistTab === 'movie' ? 'active' : ''}">Movies</button><button data-tab="game" class="${state.wishlistTab === 'game' ? 'active' : ''}">Games</button></div>
      <div class="hold-tip"><span class="hold-ring mini"></span><span>Hold an item to open its Wishlist actions.</span></div>
      ${filtered.length ? `<div class="wishlist-grid">${filtered.map(x => mediaCard(x, x.mediaType === 'movie' ? 'movies' : 'games', true)).join('')}</div>` : '<div class="empty">Nothing in this Wishlist tab yet.</div>'}`;
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { state.wishlistTab = button.dataset.tab; renderWishlist(); }));
    bindHold('.media-card', card => {
      state.selected = data.items.find(x => x.mediaType === card.dataset.type && x.id === card.dataset.id && (!card.dataset.platform || x.platform === card.dataset.platform));
      setRoute('wishlist-detail');
    });
  } catch (error) { app.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
}

function renderWishlistDetail() {
  const item = state.selected;
  if (!item) return setRoute('wishlist', { replace: true });
  pageTitle.textContent = 'Wishlist Item'; backButton.classList.remove('hidden');
  const meta = item.mediaType === 'movie' ? `${item.year} · ${item.desiredFormat}` : `${item.year} · ${platformLabel(item.platform)}`;
  app.innerHTML = `${detailHero(item, item.poster, meta)}
    <section class="panel"><p style="color:var(--muted);margin:0">Hold <strong style="color:var(--text)">Add to Library</strong> to open the purchase/import review flow. Removing an item requires a second confirmation.</p></section>
    <div class="action-stack"><button id="moveWishlist" class="primary-button hold-button">Hold to Add to Library</button><button id="removeWishlist" class="danger-button hold-button">Hold to Remove from Wishlist</button></div>`;
  enableHold(document.getElementById('moveWishlist'), () => prepareWishlistMove(item));
  enableHold(document.getElementById('removeWishlist'), () => confirmRemove(item));
}

async function prepareWishlistMove(item) {
  app.innerHTML = '<div class="loader"></div>';
  try {
    const query = item.platform ? `?platform=${encodeURIComponent(item.platform)}` : '';
    const data = await api(`${API}/wishlist/${item.mediaType}/${encodeURIComponent(item.id)}/preview${query}`);
    state.selected = { ...item, ...data.preview, wishlistItem: item, fromWishlist: true };
    setRoute(item.mediaType === 'movie' ? 'wishlist-movie-review' : 'wishlist-game-review');
  } catch (error) {
    showToast(error.message, 'error');
    renderWishlistDetail();
  }
}

function renderWishlistMovieReview() {
  const m = state.selected; pageTitle.textContent = 'Add Wishlist Movie'; backButton.classList.remove('hidden');
  const wish = m.wishlistItem || m;
  app.innerHTML = `${detailHero(m, wish.poster || m.poster, `${m.year} · ${m.rating || 'Unknown'} · ${m.runtime || 'Unknown'}`)}
    <section class="panel"><div class="field-grid two">
      ${field('wishEdition','Edition',wish.desiredFormat || m.edition || 'Blu Ray')}${field('wishCollection','Collection',m.collection || m.title)}${field('wishFranchise','Franchise',m.franchise || '')}${field('wishBooth','Booth Group',m.boothGroup || m.title)}${field('wishRating','Rating',m.rating || 'Unknown')}${field('wishRuntime','Runtime',m.runtime || 'Unknown')}
    </div></section><button id="confirmWishMovie" class="primary-button hold-button" style="width:100%">Hold to Add & Remove from Wishlist</button>`;
  enableHold(document.getElementById('confirmWishMovie'), async () => {
    try {
      await api(`${API}/wishlist/movie/${encodeURIComponent(wish.id)}/move-to-library`, { method: 'POST', body: JSON.stringify({ edition: value('wishEdition'), collection: value('wishCollection'), franchise: value('wishFranchise'), boothGroup: value('wishBooth'), rating: value('wishRating'), runtime: value('wishRuntime') }) });
      showToast(`${wish.title} moved to Movie Library.`); state.selected = null; state.history = ['home']; setRoute('wishlist', { replace: true });
    } catch (error) { showToast(error.message, 'error'); }
  });
}

function renderWishlistGameReview() {
  const g = state.selected; const wish = g.wishlistItem || g; pageTitle.textContent = 'Add Wishlist Game'; backButton.classList.remove('hidden');
  app.innerHTML = `${detailHero(g, wish.poster || g.posterUrl, `${g.release || wish.year} · ${platformLabel(wish.platform || g.platform)}`)}
    <section class="panel"><div class="field-grid two">
      ${field('wishGameTitle','Title',g.title)}${field('wishGameCollection','Collection',g.collection)}${field('wishGamePublisher','Publisher',g.publisher)}${field('wishGameDeveloper','Developer',g.developer)}${field('wishGameGenre','Genre',g.genre)}${field('wishGamePlayers','Players',g.players)}${field('wishGameRating','Rating',g.rating)}
      <div class="field"><label>Ownership</label><select id="wishOwnership"><option value="disc">Disc / Cartridge</option><option value="digital">Digital</option></select></div>
    </div></section><button id="confirmWishGame" class="primary-button hold-button" style="width:100%">Hold to Add & Remove from Wishlist</button>`;
  enableHold(document.getElementById('confirmWishGame'), async () => {
    try {
      const overrides = { title: value('wishGameTitle'), collection: value('wishGameCollection'), publisher: value('wishGamePublisher'), developer: value('wishGameDeveloper'), genre: value('wishGameGenre'), players: value('wishGamePlayers'), rating: value('wishGameRating') };
      await api(`${API}/wishlist/game/${encodeURIComponent(wish.id)}/move-to-library`, { method: 'POST', body: JSON.stringify({ platform: wish.platform, ownership: value('wishOwnership'), overrides }) });
      showToast(`${wish.title} moved to ${platformLabel(wish.platform)}.`); state.selected = null; state.history = ['home']; setRoute('wishlist', { replace: true });
    } catch (error) { showToast(error.message, 'error'); }
  });
}

function confirmRemove(item) {
  const sheet = document.createElement('div');
  sheet.className = 'confirm-sheet';
  sheet.innerHTML = `<div class="confirm-card"><h3>Remove ${escapeHtml(item.title)}?</h3><p>This removes it from the Wishlist only. Existing library entries and shared artwork are not changed.</p><div class="confirm-actions"><button class="secondary-button" data-cancel>Cancel</button><button class="danger-button hold-button" data-confirm>Hold to Remove</button></div></div>`;
  document.body.appendChild(sheet);
  sheet.querySelector('[data-cancel]').addEventListener('click', () => sheet.remove());
  enableHold(sheet.querySelector('[data-confirm]'), async () => {
    try {
      const query = item.platform ? `?platform=${encodeURIComponent(item.platform)}` : '';
      await api(`${API}/wishlist/${item.mediaType}/${encodeURIComponent(item.id)}${query}`, { method: 'DELETE' });
      sheet.remove(); showToast(`${item.title} removed from Wishlist.`); state.selected = null; setRoute('wishlist', { replace: true });
    } catch (error) { sheet.remove(); showToast(error.message, 'error'); }
  });
}

function platformLabel(value) { return state.platforms.find(p => p.value === value)?.label || value || 'Unknown'; }
function value(id) { return document.getElementById(id)?.value?.trim?.() ?? document.getElementById(id)?.value ?? ''; }


function terminalEscape(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function gitPrompt(command) {
  return `<div class="terminal-line"><span class="terminal-prompt">JFT&gt;</span> ${escapeHtml(command)}</div>`;
}

function gitOutput(text, tone = '') {
  if (!text) return '';
  return `<div class="terminal-output ${tone}">${terminalEscape(text)}</div>`;
}

function appendTerminal(html) {
  const terminal = document.getElementById('gitTerminal');
  if (!terminal) return;
  terminal.insertAdjacentHTML('beforeend', html);
  terminal.scrollTop = terminal.scrollHeight;
}

function gitChangeLine(line) {
  const code = line.slice(0, 2).trim() || '?';
  const file = line.slice(3);
  let label = code;
  let cls = 'modified';
  if (code.includes('?') || code.includes('A')) { label = 'A'; cls = 'added'; }
  else if (code.includes('D')) { label = 'D'; cls = 'deleted'; }
  else if (code.includes('R')) { label = 'R'; cls = 'renamed'; }
  else if (code.includes('M')) { label = 'M'; cls = 'modified'; }
  return `<div class="git-file ${cls}"><span>${escapeHtml(label)}</span><code>${escapeHtml(file)}</code></div>`;
}

async function renderGitConsole() {
  pageTitle.textContent = 'Save & Push';
  backButton.classList.remove('hidden');
  app.innerHTML = `
    <section class="terminal-shell">
      <div class="terminal-titlebar">
        <span class="terminal-lights"><i></i><i></i><i></i></span>
        <span>JFT • SAVE AND PUSH CHANGES</span>
      </div>
      <div id="gitTerminal" class="terminal-body">
        <div class="terminal-brand">J O C K I S C H&nbsp;&nbsp; F A M I L Y&nbsp;&nbsp; T H E A T E R</div>
        <div class="terminal-subtitle">JFT • SAVE AND PUSH CHANGES</div>
        ${gitPrompt('Checking repository status...')}
      </div>
    </section>
    <section id="gitControls" class="panel git-controls"><div class="loader"></div></section>`;

  try {
    const status = await api(`${GIT_API}/status`);
    appendTerminal(gitOutput(`Project:  JFT repository\nBranch:   ${status.branch}\nStatus:   ${status.clean ? 'Clean - ready' : `${status.changeCount} pending change(s)`}`, status.clean ? 'success-text' : 'notice-text'));

    const controls = document.getElementById('gitControls');
    if (status.clean) {
      appendTerminal(gitOutput('[SUCCESS] The project is clean. There are no uncommitted changes.', 'success-text'));
      controls.innerHTML = `<button class="secondary-button" id="gitRefresh" style="width:100%">Refresh Status</button>`;
      document.getElementById('gitRefresh').addEventListener('click', renderGitConsole);
      return;
    }

    appendTerminal(gitOutput('\nCurrent project changes:', 'notice-text'));
    appendTerminal(`<div class="git-files">${status.changes.map(gitChangeLine).join('')}</div>`);
    controls.innerHTML = `
      <p class="git-question">Stage all listed changes?</p>
      <p class="git-help">Matches the Developer Console flow: <code>git add -A</code>.</p>
      <button id="gitStage" class="primary-button hold-button" style="width:100%">Hold to Stage All Changes</button>`;
    enableHold(document.getElementById('gitStage'), stageGitChanges);
  } catch (error) {
    appendTerminal(gitOutput(`[ERROR] ${error.message}`, 'error-text'));
    document.getElementById('gitControls').innerHTML = `<button class="secondary-button" id="gitRefresh" style="width:100%">Retry</button>`;
    document.getElementById('gitRefresh').addEventListener('click', renderGitConsole);
  }
}

async function stageGitChanges() {
  const controls = document.getElementById('gitControls');
  controls.innerHTML = '<div class="loader"></div>';
  appendTerminal(gitPrompt('git add -A'));
  appendTerminal(gitOutput('Staging project changes...'));

  try {
    const result = await api(`${GIT_API}/stage`, { method: 'POST', body: '{}' });
    appendTerminal(gitOutput('\nFiles staged for commit:', 'notice-text'));
    appendTerminal(`<div class="git-files">${result.staged.map(line => {
      const parts = line.split(/\t+/);
      return gitChangeLine(`${parts[0].padEnd(2)} ${parts.slice(1).join(' → ')}`);
    }).join('')}</div>`);

    controls.innerHTML = `
      <p class="git-question">Commit these staged files?</p>
      <div class="field"><label>Commit message</label><input id="gitCommitMessage" maxlength="180" value="Update JFT collection"></div>
      <div style="height:12px"></div>
      <button id="gitCommit" class="primary-button hold-button" style="width:100%">Hold to Commit</button>
      <button id="gitCancelAfterStage" class="secondary-button" style="width:100%;margin-top:10px">Cancel — Leave Files Staged</button>`;
    enableHold(document.getElementById('gitCommit'), commitGitChanges);
    document.getElementById('gitCancelAfterStage').addEventListener('click', () => {
      appendTerminal(gitOutput('[NOTICE] Commit canceled. The files remain staged.', 'notice-text'));
      controls.innerHTML = `<button class="secondary-button" id="gitReturnHome" style="width:100%">Return to Importer</button>`;
      document.getElementById('gitReturnHome').addEventListener('click', () => setRoute('home'));
    });
  } catch (error) {
    appendTerminal(gitOutput(`[ERROR] Git could not stage the changes.\n${error.message}`, 'error-text'));
    controls.innerHTML = `<button class="secondary-button" id="gitRetry" style="width:100%">Reload Git Status</button>`;
    document.getElementById('gitRetry').addEventListener('click', renderGitConsole);
  }
}

async function commitGitChanges() {
  const message = document.getElementById('gitCommitMessage').value.trim() || 'Update JFT collection';
  const controls = document.getElementById('gitControls');
  controls.innerHTML = '<div class="loader"></div>';
  appendTerminal(gitPrompt(`git commit -m "${message}"`));
  appendTerminal(gitOutput('Creating commit...'));

  try {
    const result = await api(`${GIT_API}/commit`, { method: 'POST', body: JSON.stringify({ message }) });
    appendTerminal(gitOutput(result.output.stdout || result.output.stderr || 'Commit created.', 'success-text'));
    controls.innerHTML = `
      <p class="git-question">Push the current branch to GitHub?</p>
      <button id="gitPush" class="primary-button hold-button" style="width:100%">Hold to Push to GitHub</button>`;
    enableHold(document.getElementById('gitPush'), pushGitChanges);
  } catch (error) {
    appendTerminal(gitOutput(`[ERROR] Git could not create the commit.\n${error.message}`, 'error-text'));
    controls.innerHTML = `<button class="secondary-button" id="gitReload" style="width:100%">Reload Git Status</button>`;
    document.getElementById('gitReload').addEventListener('click', renderGitConsole);
  }
}

async function pushGitChanges() {
  const controls = document.getElementById('gitControls');
  controls.innerHTML = '<div class="loader"></div>';
  appendTerminal(gitPrompt('git push'));
  appendTerminal(gitOutput('Pushing the current branch to GitHub...'));

  try {
    const result = await api(`${GIT_API}/push`, { method: 'POST', body: '{}' });
    const output = [result.output.stdout, result.output.stderr].filter(Boolean).join('\n');
    if (output) appendTerminal(gitOutput(output));
    appendTerminal(`
      <div class="terminal-success-box">
        <strong>GITHUB UPDATE COMPLETE</strong>
        <span>Changes were committed and pushed successfully.</span>
        <small>GitHub Pages should begin rebuilding automatically.</small>
      </div>`);
    controls.innerHTML = `
      <button id="gitDone" class="primary-button" style="width:100%">Return to Importer</button>
      <button id="gitCheckAgain" class="secondary-button" style="width:100%;margin-top:10px">Check Status Again</button>`;
    document.getElementById('gitDone').addEventListener('click', () => { state.history = []; setRoute('home', { replace: true }); });
    document.getElementById('gitCheckAgain').addEventListener('click', renderGitConsole);
  } catch (error) {
    appendTerminal(gitOutput(`[ERROR] The commit was created locally, but the GitHub push failed.\n${error.message}\nChoose Save & Push again to retry.`, 'error-text'));
    controls.innerHTML = `<button id="gitRetryPush" class="primary-button hold-button" style="width:100%">Hold to Retry Push</button><button id="gitReturn" class="secondary-button" style="width:100%;margin-top:10px">Return to Importer</button>`;
    enableHold(document.getElementById('gitRetryPush'), pushGitChanges);
    document.getElementById('gitReturn').addEventListener('click', () => setRoute('home'));
  }
}

async function updateGitBadge() {
  const badge = document.getElementById('gitPendingBadge');
  if (!badge) return;
  try {
    const status = await api(`${GIT_API}/status`);
    if (!status.clean) {
      badge.textContent = status.changeCount;
      badge.classList.remove('hidden');
    }
  } catch {}
}

function render() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (state.route === 'home') return renderHome();
  if (state.route === 'movies' || state.route === 'games') return renderSearch(state.route);
  if (state.route === 'movie-detail') return renderMovieDetail();
  if (state.route === 'game-detail') return renderGameDetail();
  if (state.route === 'wishlist') return renderWishlist();
  if (state.route === 'wishlist-detail') return renderWishlistDetail();
  if (state.route === 'wishlist-movie-review') return renderWishlistMovieReview();
  if (state.route === 'wishlist-game-review') return renderWishlistGameReview();
  if (state.route === 'git') return renderGitConsole();
  renderHome();
}

async function boot() {
  try {
    const [status, platforms] = await Promise.all([api(`${API}/status`), api(`${API}/platforms`)]);
    state.platforms = platforms.platforms;
    serverDot.classList.add('online');
    serverDot.title = `Server online · TMDb ${status.tmdbConfigured ? 'ready' : 'missing'} · IGDB ${status.igdbConfigured ? 'ready' : 'missing'}`;
  } catch (error) {
    serverDot.title = 'Importer API unavailable';
    showToast('Importer API is not available. Start the JFT Node server.', 'error');
  }
  render();
}

boot();
