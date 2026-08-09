const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';
const IGDB_GAME_ENDPOINT = 'https://api.igdb.com/v4/games';
const IGDB_COVER_BASE = 'https://images.igdb.com/igdb/image/upload/t_cover_big_2x';

const PLATFORM_OPTIONS = [
  { value: 'ps5', label: 'PlayStation 5', igdbNames: ['PlayStation 5'] },
  { value: 'ps4', label: 'PlayStation 4', igdbNames: ['PlayStation 4'] },
  { value: 'ps3', label: 'PlayStation 3', igdbNames: ['PlayStation 3'] },
  { value: 'ps2', label: 'PlayStation 2', igdbNames: ['PlayStation 2'] },
  { value: 'ps1', label: 'PlayStation', igdbNames: ['PlayStation'] },
  { value: 'psp', label: 'PlayStation Portable (PSP)', igdbNames: ['PlayStation Portable'] },
  { value: 'psvita', label: 'PlayStation Vita', igdbNames: ['PlayStation Vita'] },
  { value: 'seriesx', label: 'Xbox Series X|S', igdbNames: ['Xbox Series X|S'] },
  { value: 'xboxone', label: 'Xbox One', igdbNames: ['Xbox One'] },
  { value: 'xbox360', label: 'Xbox 360', igdbNames: ['Xbox 360'] },
  { value: 'xbox', label: 'Xbox', igdbNames: ['Xbox'] },
  { value: 'switch', label: 'Nintendo Switch', igdbNames: ['Nintendo Switch'] },
  { value: 'wii', label: 'Nintendo Wii', igdbNames: ['Wii'] },
  { value: '3ds', label: 'Nintendo 3DS', igdbNames: ['Nintendo 3DS'] },
  { value: 'ds', label: 'Nintendo DS', igdbNames: ['Nintendo DS'] },
  { value: 'n64', label: 'Nintendo 64', igdbNames: ['Nintendo 64'] },
  { value: 'snes', label: 'Super Nintendo', igdbNames: ['Super Nintendo Entertainment System'] },
  { value: 'nes', label: 'Nintendo Entertainment System', igdbNames: ['Nintendo Entertainment System'] },
  { value: 'gba', label: 'Game Boy Advance', igdbNames: ['Game Boy Advance'] },
  { value: 'gbc', label: 'Game Boy Color', igdbNames: ['Game Boy Color'] },
  { value: 'gameboy', label: 'Game Boy', igdbNames: ['Game Boy'] },
  { value: 'genesis', label: 'Sega Genesis', igdbNames: ['Sega Mega Drive/Genesis'] },
  { value: 'intellivision', label: 'Mattel Intellivision', igdbNames: ['Intellivision'] }
];

const GAME_CATEGORY_NAMES = {
  0: 'Main Game', 1: 'DLC / Add-on', 2: 'Expansion', 3: 'Bundle',
  4: 'Standalone Expansion', 5: 'Mod', 6: 'Episode', 7: 'Season',
  8: 'Remake', 9: 'Remaster', 10: 'Expanded Game', 11: 'Port',
  12: 'Fork', 13: 'Pack', 14: 'Update'
};

function slugify(value) {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’]/g, "'").trim().toLowerCase();
}

function normalizeSearchText(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim().toLowerCase();
}

function releaseYear(date) {
  const match = String(date || '').match(/^(\d{4})/);
  return match ? match[1] : 'Unknown';
}

function gameReleaseYear(timestamp) {
  return timestamp ? String(new Date(timestamp * 1000).getUTCFullYear()) : 'Unknown';
}

function formatRuntime(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return 'Unknown';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}min`;
  if (!mins) return `${hours}hr`;
  return `${hours}hr ${mins}min`;
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function ensureFile(file, label) {
  if (!fs.existsSync(file)) throw new Error(`${label} does not exist: ${file}`);
}

function loadArray(file, arrayName, moduleStyle = false) {
  ensureFile(file, arrayName);
  let source = fs.readFileSync(file, 'utf8');
  if (moduleStyle) {
    source = source.replace(new RegExp(`\\bexport\\s+default\\s+${arrayName}\\s*;?`), '');
  }
  const context = { result: null, module: { exports: {} }, exports: {} };
  vm.createContext(context);
  vm.runInContext(`${source}\nresult = ${arrayName};`, context, { filename: file });
  if (!Array.isArray(context.result)) throw new Error(`${arrayName} was not readable.`);
  return context.result.filter(Boolean);
}

function backupFile(source, backupDir, prefix) {
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `${prefix}-${timestamp()}.js`);
  fs.copyFileSync(source, backup);
  return backup;
}

function atomicWrite(file, contents) {
  const temp = `${file}.tmp`;
  try {
    fs.writeFileSync(temp, contents, 'utf8');
    fs.renameSync(temp, file);
  } catch (error) {
    if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    throw error;
  }
}

function getMostCommon(values) {
  const counts = new Map();
  values.filter(v => v !== undefined).forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0];
}

function cleanCollectionName(value, fallback) {
  return String(value || '').replace(/\s+Collection$/i, '').trim() || fallback;
}

function getPosterFolderFromPath(poster, mediaType = 'movie') {
  const normalizedPath = String(poster || '').replace(/\\/g, '/');
  const prefix = mediaType === 'series' ? '/assets/posters/shows/' : '/assets/posters/movies/';
  if (!normalizedPath.startsWith(prefix)) return '';
  const parts = normalizedPath.slice(prefix.length).split('/').filter(Boolean);
  return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
}

function buildMovieSuggestions(library, movie) {
  const tmdbCollection = cleanCollectionName(movie.belongs_to_collection?.name, movie.title);
  const collectionKey = normalize(tmdbCollection);
  let related = library.filter(item => normalize(item.collection) === collectionKey);
  if (!related.length) {
    const words = normalize(movie.title).split(/\s+/).filter(word => word.length >= 4);
    related = library.filter(item => {
      const searchable = normalize(`${item.title} ${item.collection || ''} ${item.franchise || ''} ${item.boothGroup || ''}`);
      return words.some(word => searchable.includes(word));
    });
  }
  const collection = getMostCommon(related.map(x => x.collection)) || tmdbCollection || movie.title;
  const collectionMatches = library.filter(x => normalize(x.collection) === normalize(collection));
  const pool = collectionMatches.length ? collectionMatches : related;
  const franchise = getMostCommon(pool.map(x => x.franchise).filter(Boolean)) || (movie.belongs_to_collection ? collection : '');
  const boothGroup = getMostCommon(pool.map(x => x.boothGroup).filter(Boolean)) || franchise || collection;
  const posterFolder = getMostCommon(pool.map(x => getPosterFolderFromPath(x.poster, 'movie'))) || (movie.belongs_to_collection ? slugify(collection) : '');
  return { collection, franchise, boothGroup, posterFolder };
}

function getUsRating(movie) {
  const us = (movie.release_dates?.results || []).find(x => x.iso_3166_1 === 'US');
  return (us?.release_dates || []).map(x => String(x.certification || '').trim()).find(Boolean) || 'Unknown';
}

async function requestTMDb(token, endpoint, query = {}) {
  if (!token) throw new Error('TMDB_ACCESS_TOKEN is missing from .env.');
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(`TMDb request failed (${response.status}): ${JSON.stringify(data)}`);
  return data;
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Artwork download failed (${response.status}).`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

function formatOwnedMovieObject(movie) {
  return [
    '  {',
    `    id: ${JSON.stringify(movie.id)},`,
    `    collection: ${JSON.stringify(movie.collection)},`,
    `    franchise: ${JSON.stringify(movie.franchise)},`,
    `    boothGroup: ${JSON.stringify(movie.boothGroup)},`,
    `    title: ${JSON.stringify(movie.title)},`,
    `    edition: ${JSON.stringify(movie.edition)},`,
    `    year: ${JSON.stringify(movie.year)},`,
    `    rating: ${JSON.stringify(movie.rating)},`,
    `    runtime: ${JSON.stringify(movie.runtime)},`,
    `    poster: ${JSON.stringify(movie.poster)}`,
    '  }'
  ].join('\n');
}

function getSectionMatches(source) {
  const pattern = /^  \/\/ ={50}\r?\n  \/\/ (.+)\r?\n  \/\/ ={50}$/gm;
  return [...source.matchAll(pattern)].map(match => ({ label: match[1].trim(), index: match.index }));
}

function addOwnedMovieToSource(source, movie) {
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const normalizedSource = source.replace(/\r\n/g, '\n');
  const sections = getSectionMatches(normalizedSource);
  const existingSectionIndex = sections.findIndex(s => normalize(s.label) === normalize(movie.collection));
  let updated;
  if (existingSectionIndex >= 0) {
    const next = sections[existingSectionIndex + 1];
    if (!next) throw new Error(`Could not find section after ${movie.collection}.`);
    const before = normalizedSource.slice(0, next.index).replace(/\s+$/, '').replace(/,\s*$/, '');
    updated = `${before},\n\n${formatOwnedMovieObject(movie)},\n\n${normalizedSource.slice(next.index)}`;
  } else {
    const games = sections.find(s => normalize(s.label) === 'games');
    if (!games) throw new Error('Could not find the Games section in movie-library.js.');
    const later = sections.find(s => normalize(s.label) !== 'games' && s.label.localeCompare(movie.collection, undefined, { sensitivity: 'base', numeric: true }) > 0);
    const insertion = later ? later.index : games.index;
    const block = ['  // ==================================================', `  // ${movie.collection}`, '  // ==================================================', '', formatOwnedMovieObject(movie)].join('\n');
    const before = normalizedSource.slice(0, insertion).replace(/\s+$/, '').replace(/,\s*$/, '');
    updated = `${before},\n\n${block},\n\n${normalizedSource.slice(insertion)}`;
  }
  return updated.replace(/\n/g, eol);
}

function findFlatObjectRangeById(source, id) {
  const escaped = JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\bid\\s*:\\s*${escaped}`).exec(source);
  if (!match) return null;
  const start = source.lastIndexOf('{', match.index);
  let depth = 0, quote = null, escapedChar = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escapedChar) escapedChar = false;
      else if (ch === '\\') escapedChar = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (["'", '"', '`'].includes(ch)) { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) return { start, end: i + 1 };
  }
  return null;
}

function replaceFlatObjectById(source, id, objectText) {
  const range = findFlatObjectRangeById(source, id);
  if (!range) throw new Error(`Could not find entry ${id}.`);
  return source.slice(0, range.start) + objectText + source.slice(range.end);
}

function removeObjectRange(source, range) {
  let start = range.start, end = range.end;
  const after = source.slice(end);
  const commaAfter = after.match(/^\s*,/);
  if (commaAfter) end += commaAfter[0].length;
  else {
    const commaBefore = source.slice(0, start).match(/,\s*$/);
    if (commaBefore) start -= commaBefore[0].length;
  }
  return source.slice(0, start).replace(/[ \t]+$/gm, '') + source.slice(end);
}

function formatWishlistObject(item) {
  const lines = ['  {', `    id: ${JSON.stringify(item.id)},`, `    mediaType: ${JSON.stringify(item.mediaType)},`, `    title: ${JSON.stringify(item.title)},`, `    year: ${JSON.stringify(item.year)},`];
  if (item.mediaType === 'movie') lines.push(`    desiredFormat: ${JSON.stringify(item.desiredFormat)},`);
  if (item.mediaType === 'game') lines.push(`    platform: ${JSON.stringify(item.platform)},`);
  lines.push(`    poster: ${JSON.stringify(item.poster)}`, '  }');
  return lines.join('\n');
}

function findWishlistRange(source, id, mediaType, platform = '') {
  const escaped = JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...source.matchAll(new RegExp(`\\bid\\s*:\\s*${escaped}`, 'g'))];
  for (const match of matches) {
    const start = source.lastIndexOf('{', match.index);
    let depth = 0, quote = null, esc = false;
    for (let i = start; i < source.length; i += 1) {
      const ch = source[i];
      if (quote) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === quote) quote = null; continue; }
      if (["'", '"', '`'].includes(ch)) { quote = ch; continue; }
      if (ch === '{') depth += 1;
      if (ch === '}' && --depth === 0) {
        const text = source.slice(start, i + 1);
        const type = text.match(/\bmediaType\s*:\s*["']([^"']+)["']/)?.[1] || 'movie';
        const itemPlatform = text.match(/\bplatform\s*:\s*["']([^"']+)["']/)?.[1] || '';
        if (type === mediaType && (!platform || normalize(itemPlatform) === normalize(platform))) return { start, end: i + 1 };
        break;
      }
    }
  }
  return null;
}

function addWishlistToSource(source, item) {
  const pattern = /\n\];\s*\n\s*export\s+default\s+wishlistLibrary\s*;?\s*$/;
  const match = source.match(pattern);
  if (!match || match.index === undefined) throw new Error('Could not find end of wishlistLibrary.');
  const before = source.slice(0, match.index).replace(/\s+$/, '').replace(/,\s*$/, '');
  const comma = /\[\s*$/.test(before) ? '' : ',';
  return `${before}${comma}\n\n${formatWishlistObject(item)}\n${source.slice(match.index)}`;
}

function formatJavaScriptValue(value, indent = 0) {
  const spacing = ' '.repeat(indent);
  if (Array.isArray(value)) return `[${value.map(x => JSON.stringify(x)).join(', ')}]`;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (value === null) return 'null';
  return `{\n${Object.entries(value).map(([k,v]) => `${' '.repeat(indent+2)}${k}: ${formatJavaScriptValue(v, indent+2)}`).join(',\n')}\n${spacing}}`;
}

function getCategoryScore(category) {
  if (category === 0) return 300;
  if ([8,9,10,11].includes(category)) return 180;
  if (category === 4) return 80;
  if (category === 3) return -100;
  if (category === 2) return -250;
  if ([6,7].includes(category)) return -350;
  if ([1,13,14].includes(category)) return -600;
  if ([5,12].includes(category)) return -700;
  return 0;
}

function getNamePenalty(name) {
  const n = normalizeSearchText(name);
  const strong = ['season pass','year pass','expansion pass','dlc','add on','soundtrack','cosmetic pack','vehicle pack','skin pack','map pack','content pack','starter pack'];
  const weak = ['season ','chapter ','episode ','pack','bundle','upgrade'];
  if (strong.some(x => n.includes(x))) return -500;
  if (weak.some(x => n.includes(x))) return -150;
  return 0;
}

function platformMatches(platform, game) {
  const names = (game.platforms || []).map(x => x.name);
  return platform.igdbNames.some(x => names.includes(x));
}

function sortGameResults(results, platform, title) {
  const search = normalizeSearchText(title);
  return [...results].map(game => {
    const name = normalizeSearchText(game.name);
    let score = 0;
    if (name === search) score += 2000;
    else if (name.startsWith(`${search} `)) score += 800;
    else if (name.includes(search)) score += 350;
    if (platformMatches(platform, game)) score += 500;
    score += getCategoryScore(game.category) + getNamePenalty(game.name);
    if (game.cover?.image_id) score += 25;
    return { ...game, searchScore: score };
  }).sort((a,b) => b.searchScore - a.searchScore || (b.first_release_date || 0) - (a.first_release_date || 0));
}

async function getIGDBToken(clientId, clientSecret) {
  if (!clientId || !clientSecret) throw new Error('TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is missing from .env.');
  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('grant_type', 'client_credentials');
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(`Twitch authentication failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function requestIGDB(clientId, token, query) {
  const response = await fetch(IGDB_GAME_ENDPOINT, {
    method: 'POST',
    headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: query
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`IGDB request failed: ${JSON.stringify(data)}`);
  return data;
}

function escapeIGDB(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
function getCompanyNames(game, role) {
  const names = (game.involved_companies || []).filter(x => x?.[role]).map(x => x.company?.name).filter(Boolean);
  return names.length ? names.join(', ') : 'Unknown';
}
function formatList(values) { return Array.isArray(values) && values.length ? values.map(x => x?.name).filter(Boolean).join(', ') || 'Unknown' : 'Unknown'; }
function getSortTitle(title) { return String(title || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’]/g,'').replace(/[^a-zA-Z0-9\s]+/g,' ').replace(/\s+/g,' ').trim(); }
function getCollectionName(game) { return game.collection?.name || game.franchises?.[0]?.name || game.name || 'Unknown'; }

function registerImporterRoutes(app, options = {}) {
  const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
  const movieLibraryFile = path.join(projectRoot, 'library', 'movies', 'movie-library.js');
  const wishlistFile = path.join(projectRoot, 'library', 'wishlist', 'wishlist-library.js');
  const gameDirectory = path.join(projectRoot, 'library', 'games');
  const movieBackupDir = path.join(projectRoot, 'backups', 'movie-imports');
  const gameBackupDir = path.join(projectRoot, 'backups', 'game-imports');
  const wishlistBackupDir = path.join(projectRoot, 'backups', 'wishlist-imports');
  const token = process.env.TMDB_ACCESS_TOKEN;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  const absoluteAsset = relative => path.join(projectRoot, String(relative || '').replace(/^[/\\]+/, ''));
  const platformByValue = value => PLATFORM_OPTIONS.find(x => x.value === value);
  const loadMovies = () => loadArray(movieLibraryFile, 'movieLibrary').filter(x => x.type !== 'games-library');
  const loadWishlist = () => loadArray(wishlistFile, 'wishlistLibrary', true);

  async function fullMovie(tmdbId) {
    return requestTMDb(token, `/movie/${Number(tmdbId)}`, { append_to_response: 'release_dates', language: 'en-US' });
  }

  async function findTMDbByTitle(title) {
    const data = await requestTMDb(token, '/search/movie', { query: title, include_adult: 'false', language: 'en-US' });
    const exact = (data.results || []).find(x => normalize(x.title) === normalize(title));
    const chosen = exact || data.results?.[0];
    if (!chosen) throw new Error(`Could not find ${title} on TMDb.`);
    return fullMovie(chosen.id);
  }

  async function fullGame(gameId) {
    const auth = await getIGDBToken(clientId, clientSecret);
    const query = `fields id,name,slug,category,summary,storyline,first_release_date,platforms.name,genres.name,themes.name,game_modes.name,player_perspectives.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,collection.name,franchises.name,cover.image_id,url;\nwhere id = ${Number(gameId)};\nlimit 1;`;
    return (await requestIGDB(clientId, auth, query))[0] || null;
  }

  async function findIGDBByTitle(title, platform) {
    const auth = await getIGDBToken(clientId, clientSecret);
    const search = await requestIGDB(clientId, auth, `search "${escapeIGDB(title)}";\nfields id,name,category,first_release_date,platforms.name,cover.image_id;\nlimit 100;`);
    const sorted = sortGameResults(search, platform, title);
    if (!sorted[0]) throw new Error(`Could not find ${title} on IGDB.`);
    return fullGame(sorted[0].id);
  }

  function moviePreview(movie, overrides = {}) {
    const movies = loadMovies();
    const suggestions = buildMovieSuggestions(movies, movie);
    const title = overrides.title || movie.title;
    const id = overrides.id || slugify(title);
    const folder = overrides.posterFolder !== undefined ? overrides.posterFolder : suggestions.posterFolder;
    const poster = folder ? `/assets/posters/movies/${folder}/${id}.jpg` : `/assets/posters/movies/${id}.jpg`;
    return {
      id, title,
      collection: overrides.collection ?? suggestions.collection ?? title,
      franchise: overrides.franchise ?? suggestions.franchise ?? '',
      boothGroup: overrides.boothGroup ?? suggestions.boothGroup ?? suggestions.collection ?? title,
      edition: overrides.edition || 'Blu Ray',
      year: overrides.year || releaseYear(movie.release_date),
      rating: overrides.rating || getUsRating(movie),
      runtime: overrides.runtime || formatRuntime(movie.runtime),
      poster,
      posterFolder: folder || '',
      tmdbPosterPath: movie.poster_path || '',
      overview: movie.overview || ''
    };
  }

  function gameTheaterDefault(platform) {
    const file = path.join(gameDirectory, `${platform.value}.js`);
    if (!fs.existsSync(file)) return false;
    const values = [...fs.readFileSync(file, 'utf8').matchAll(/theaterEnabled:\s*(true|false)/g)].map(m => m[1] === 'true');
    return values.length && values.every(v => v === values[0]) ? values[0] : false;
  }

  function gameObject(game, platform, ownership) {
    return {
      id: slugify(game.name), title: game.name, sortTitle: getSortTitle(game.name), platform: platform.value,
      release: gameReleaseYear(game.first_release_date), publisher: getCompanyNames(game, 'publisher'), developer: getCompanyNames(game, 'developer'),
      genre: formatList(game.genres), players: 'Unknown', rating: 'Unknown', collection: getCollectionName(game), ownership: [ownership],
      poster: `/assets/posters/games/${platform.value}/${slugify(game.name)}.jpg`, theaterEnabled: gameTheaterDefault(platform)
    };
  }

  function writeMovie(movie, existingId = '') {
    const source = fs.readFileSync(movieLibraryFile, 'utf8');
    const updated = existingId ? replaceFlatObjectById(source, existingId, formatOwnedMovieObject(movie)) : addOwnedMovieToSource(source, movie);
    const backup = backupFile(movieLibraryFile, movieBackupDir, 'movie-library');
    atomicWrite(movieLibraryFile, updated);
    return backup;
  }

  function writeGame(platform, object) {
    const file = path.join(gameDirectory, `${platform.value}.js`);
    ensureFile(file, 'Game library');
    const source = fs.readFileSync(file, 'utf8');
    const ids = [...source.matchAll(/\bid:\s*["']([^"']+)["']/g)].map(m => normalize(m[1]));
    const titles = [...source.matchAll(/\btitle:\s*["']([^"']+)["']/g)].map(m => normalize(m[1]));
    if (ids.includes(normalize(object.id)) || titles.includes(normalize(object.title))) throw new Error(`${object.title} already appears in ${platform.label}.`);
    const eol = source.includes('\r\n') ? '\r\n' : '\n';
    const normalizedSource = source.replace(/\r\n/g, '\n');
    const pattern = /\n\];(?=\n\s*export\s+default\s+)/;
    if (!pattern.test(normalizedSource)) throw new Error(`Could not find end of ${platform.value}.js array.`);
    const objectText = formatJavaScriptValue(object).split('\n').map(line => `  ${line}`).join('\n');
    const updated = normalizedSource.replace(pattern, `,\n\n${objectText}\n];`).replace(/\n/g, eol);
    const backup = backupFile(file, gameBackupDir, platform.value);
    atomicWrite(file, updated);
    return backup;
  }

  function saveWishlist(item, existingId = '', existingPlatform = '') {
    let source = fs.readFileSync(wishlistFile, 'utf8');
    if (existingId) {
      const range = findWishlistRange(source, existingId, item.mediaType, existingPlatform || item.platform || '');
      if (!range) throw new Error(`Could not find wishlist item ${existingId}.`);
      source = source.slice(0, range.start) + formatWishlistObject(item) + source.slice(range.end);
    } else source = addWishlistToSource(source, item);
    const backup = backupFile(wishlistFile, wishlistBackupDir, 'wishlist-library');
    atomicWrite(wishlistFile, source);
    return backup;
  }

  function removeWishlist(id, mediaType, platform = '') {
    const source = fs.readFileSync(wishlistFile, 'utf8');
    const range = findWishlistRange(source, id, mediaType, platform);
    if (!range) throw new Error(`Could not find wishlist item ${id}.`);
    const backup = backupFile(wishlistFile, wishlistBackupDir, 'wishlist-library-before-removal');
    atomicWrite(wishlistFile, removeObjectRange(source, range));
    return backup;
  }

  const wrap = fn => async (req, res) => {
    try { await fn(req, res); }
    catch (error) { console.error('Importer API error:', error); res.status(500).json({ success: false, error: error.message }); }
  };

  app.get('/api/importer/status', wrap(async (req, res) => {
    res.json({ success: true, tmdbConfigured: Boolean(token), igdbConfigured: Boolean(clientId && clientSecret), projectRoot });
  }));

  app.get('/api/importer/platforms', (req, res) => res.json({ success: true, platforms: PLATFORM_OPTIONS }));

  app.get('/api/importer/movies/search', wrap(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, error: 'Search title is required.' });
    const data = await requestTMDb(token, '/search/movie', { query: q, include_adult: 'false', language: 'en-US' });
    res.json({ success: true, results: (data.results || []).slice(0, 12).map(movie => ({
      id: movie.id, title: movie.title, year: releaseYear(movie.release_date), overview: movie.overview || '',
      posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null
    })) });
  }));

  app.get('/api/importer/movies/:id', wrap(async (req, res) => {
    const movie = await fullMovie(req.params.id);
    res.json({ success: true, movie: moviePreview(movie) });
  }));

  app.post('/api/importer/movies/import', wrap(async (req, res) => {
    const movie = await fullMovie(req.body.tmdbId);
    const object = moviePreview(movie, req.body);
    delete object.posterFolder; delete object.tmdbPosterPath; delete object.overview;
    const existing = loadMovies().find(x => normalize(x.id) === normalize(object.id) || normalize(x.title) === normalize(object.title));
    const posterFile = absoluteAsset(object.poster);
    if (!fs.existsSync(posterFile) && movie.poster_path) await download(`${TMDB_IMAGE_BASE}${movie.poster_path}`, posterFile);
    const backup = writeMovie(object, existing?.id || '');
    res.json({ success: true, action: existing ? 'updated' : 'added', item: object, backup });
  }));

  app.get('/api/importer/games/search', wrap(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const platform = platformByValue(String(req.query.platform || ''));
    if (!q || !platform) return res.status(400).json({ success: false, error: 'Game title and platform are required.' });
    const auth = await getIGDBToken(clientId, clientSecret);
    const results = await requestIGDB(clientId, auth, `search "${escapeIGDB(q)}";\nfields id,name,category,first_release_date,platforms.name,cover.image_id;\nlimit 100;`);
    res.json({ success: true, results: sortGameResults(results, platform, q).slice(0, 12).map(game => ({
      id: game.id, title: game.name, year: gameReleaseYear(game.first_release_date), type: GAME_CATEGORY_NAMES[game.category] || 'Unknown Type',
      platformMatch: platformMatches(platform, game), platforms: (game.platforms || []).map(x => x.name),
      posterUrl: game.cover?.image_id ? `${IGDB_COVER_BASE}/${game.cover.image_id}.jpg` : null
    })) });
  }));

  app.get('/api/importer/games/:id', wrap(async (req, res) => {
    const platform = platformByValue(String(req.query.platform || ''));
    if (!platform) return res.status(400).json({ success: false, error: 'Platform is required.' });
    const game = await fullGame(req.params.id);
    if (!game) throw new Error('IGDB did not return game details.');
    res.json({ success: true, game: { ...gameObject(game, platform, 'disc'), igdbId: game.id, summary: game.summary || '', posterUrl: game.cover?.image_id ? `${IGDB_COVER_BASE}/${game.cover.image_id}.jpg` : null, coverImageId: game.cover?.image_id || '' } });
  }));

  app.post('/api/importer/games/import', wrap(async (req, res) => {
    const platform = platformByValue(req.body.platform);
    if (!platform) return res.status(400).json({ success: false, error: 'Valid platform is required.' });
    const game = await fullGame(req.body.igdbId);
    if (!game) throw new Error('IGDB did not return game details.');
    const object = { ...gameObject(game, platform, req.body.ownership === 'digital' ? 'digital' : 'disc'), ...req.body.overrides };
    object.platform = platform.value;
    object.ownership = [req.body.ownership === 'digital' ? 'digital' : 'disc'];
    object.poster = `/assets/posters/games/${platform.value}/${slugify(object.title)}.jpg`;
    const posterFile = absoluteAsset(object.poster);
    if (!fs.existsSync(posterFile) && game.cover?.image_id) await download(`${IGDB_COVER_BASE}/${game.cover.image_id}.jpg`, posterFile);
    const backup = writeGame(platform, object);
    res.json({ success: true, item: object, backup });
  }));

  app.get('/api/importer/wishlist', wrap(async (req, res) => {
    res.json({ success: true, items: loadWishlist() });
  }));

  app.post('/api/importer/wishlist/movie', wrap(async (req, res) => {
    const movie = await fullMovie(req.body.tmdbId);
    const movies = loadMovies();
    const suggestions = buildMovieSuggestions(movies, movie);
    const title = req.body.title || movie.title;
    const id = req.body.id || slugify(title);
    const existing = loadWishlist().find(x => x.mediaType === 'movie' && (normalize(x.id) === normalize(id) || normalize(x.title) === normalize(title)));
    const owned = movies.find(x => normalize(x.id) === normalize(id) || normalize(x.title) === normalize(title));
    const folder = req.body.posterFolder !== undefined ? req.body.posterFolder : (getPosterFolderFromPath(owned?.poster) || suggestions.posterFolder || '');
    const poster = owned?.poster || (folder ? `/assets/posters/movies/${folder}/${id}.jpg` : `/assets/posters/movies/${id}.jpg`);
    const item = { id, mediaType: 'movie', title, year: req.body.year || releaseYear(movie.release_date), desiredFormat: req.body.desiredFormat || '4K Blu Ray', poster };
    const posterFile = absoluteAsset(poster);
    if (!fs.existsSync(posterFile) && movie.poster_path) await download(`${TMDB_IMAGE_BASE}${movie.poster_path}`, posterFile);
    const backup = saveWishlist(item, existing?.id || '');
    res.json({ success: true, action: existing ? 'updated' : 'added', item, backup });
  }));

  app.post('/api/importer/wishlist/game', wrap(async (req, res) => {
    const platform = platformByValue(req.body.platform);
    if (!platform) return res.status(400).json({ success: false, error: 'Valid platform is required.' });
    const game = await fullGame(req.body.igdbId);
    if (!game) throw new Error('IGDB did not return game details.');
    const id = slugify(game.name);
    const wishlist = loadWishlist();
    const existing = wishlist.find(x => x.mediaType === 'game' && normalize(x.id) === normalize(id) && normalize(x.platform) === normalize(platform.value));
    const item = { id, mediaType: 'game', title: game.name, year: gameReleaseYear(game.first_release_date), platform: platform.value, poster: `/assets/posters/games/${platform.value}/${id}.jpg` };
    const posterFile = absoluteAsset(item.poster);
    if (!fs.existsSync(posterFile) && game.cover?.image_id) await download(`${IGDB_COVER_BASE}/${game.cover.image_id}.jpg`, posterFile);
    const backup = saveWishlist(item, existing?.id || '', platform.value);
    res.json({ success: true, action: existing ? 'updated' : 'added', item, backup });
  }));

  app.get('/api/importer/wishlist/:mediaType/:id/preview', wrap(async (req, res) => {
    const mediaType = req.params.mediaType;
    const requestedPlatform = String(req.query.platform || '');
    const item = loadWishlist().find(x => x.mediaType === mediaType && normalize(x.id) === normalize(req.params.id) && (!requestedPlatform || normalize(x.platform) === normalize(requestedPlatform)));
    if (!item) return res.status(404).json({ success: false, error: 'Wishlist item not found.' });

    if (mediaType === 'movie') {
      const movie = await findTMDbByTitle(item.title);
      const preview = moviePreview(movie, {
        title: item.title,
        id: item.id,
        year: item.year,
        edition: item.desiredFormat || 'Blu Ray',
        posterFolder: getPosterFolderFromPath(item.poster)
      });
      preview.poster = item.poster || preview.poster;
      return res.json({ success: true, item, preview });
    }

    const platform = platformByValue(item.platform || requestedPlatform);
    if (!platform) return res.status(400).json({ success: false, error: 'Valid platform is required.' });
    const game = await findIGDBByTitle(item.title, platform);
    const preview = { ...gameObject(game, platform, 'disc'), igdbId: game.id, summary: game.summary || '', posterUrl: item.poster || (game.cover?.image_id ? `${IGDB_COVER_BASE}/${game.cover.image_id}.jpg` : null) };
    return res.json({ success: true, item, preview });
  }));

  app.delete('/api/importer/wishlist/:mediaType/:id', wrap(async (req, res) => {
    const backup = removeWishlist(req.params.id, req.params.mediaType, String(req.query.platform || ''));
    res.json({ success: true, removed: req.params.id, backup });
  }));

  app.post('/api/importer/wishlist/:mediaType/:id/move-to-library', wrap(async (req, res) => {
    const mediaType = req.params.mediaType;
    const wishlist = loadWishlist();
    const item = wishlist.find(x => x.mediaType === mediaType && normalize(x.id) === normalize(req.params.id) && (!req.body.platform || normalize(x.platform) === normalize(req.body.platform)));
    if (!item) return res.status(404).json({ success: false, error: 'Wishlist item not found.' });

    if (mediaType === 'movie') {
      const movie = await findTMDbByTitle(item.title);
      const object = moviePreview(movie, { ...req.body, title: item.title, id: item.id, year: item.year, posterFolder: getPosterFolderFromPath(item.poster), edition: req.body.edition || item.desiredFormat || 'Blu Ray' });
      delete object.posterFolder; delete object.tmdbPosterPath; delete object.overview;
      const existing = loadMovies().find(x => normalize(x.id) === normalize(object.id) || normalize(x.title) === normalize(object.title));
      if (!fs.existsSync(absoluteAsset(item.poster)) && movie.poster_path) await download(`${TMDB_IMAGE_BASE}${movie.poster_path}`, absoluteAsset(item.poster));
      const libraryBackup = writeMovie(object, existing?.id || '');
      const wishlistBackup = removeWishlist(item.id, 'movie');
      return res.json({ success: true, item: object, action: existing ? 'updated' : 'added', libraryBackup, wishlistBackup });
    }

    const platform = platformByValue(req.body.platform || item.platform);
    if (!platform) return res.status(400).json({ success: false, error: 'Valid platform is required.' });
    const game = await findIGDBByTitle(item.title, platform);
    const object = { ...gameObject(game, platform, req.body.ownership === 'digital' ? 'digital' : 'disc'), ...(req.body.overrides || {}) };
    object.platform = platform.value;
    object.ownership = [req.body.ownership === 'digital' ? 'digital' : 'disc'];
    object.poster = item.poster || `/assets/posters/games/${platform.value}/${slugify(object.title)}.jpg`;
    if (!fs.existsSync(absoluteAsset(object.poster)) && game.cover?.image_id) await download(`${IGDB_COVER_BASE}/${game.cover.image_id}.jpg`, absoluteAsset(object.poster));
    const libraryBackup = writeGame(platform, object);
    const wishlistBackup = removeWishlist(item.id, 'game', item.platform);
    return res.json({ success: true, item: object, action: 'added', libraryBackup, wishlistBackup });
  }));
}

module.exports = { registerImporterRoutes, PLATFORM_OPTIONS };
