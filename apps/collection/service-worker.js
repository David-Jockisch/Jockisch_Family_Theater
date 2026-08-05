const CACHE_VERSION = "jft-collection-v10";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./collection.css",
  "./collection.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => ![APP_SHELL_CACHE, IMAGE_CACHE].includes(key))
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  const message = event.data || {};

  if (message.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (message.type === "CLEAR_APP_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
    );
  }
});

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    /\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(url.pathname)
  );
}

function isFreshnessCriticalRequest(request, url) {
  return (
    request.mode === "navigate" ||
    ["document", "script", "style", "manifest"].includes(
      request.destination
    ) ||
    /\.(?:html?|js|mjs|css|json|webmanifest)$/i.test(url.pathname) ||
    url.pathname.includes("/library/")
  );
}

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: "no-cache" });

    if (response && response.ok) {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return (
      (await caches.match(request)) ||
      (request.mode === "navigate"
        ? await caches.match("./index.html")
        : Response.error())
    );
  }
}

async function cacheFirstImage(request) {
  const cached = await caches.match(request);

  if (cached) {
    // Refresh the cached artwork quietly in the background.
    fetch(request)
      .then(async response => {
        if (response && response.ok) {
          const cache = await caches.open(IMAGE_CACHE);
          await cache.put(request, response);
        }
      })
      .catch(() => {});

    return cached;
  }

  const response = await fetch(request);

  if (response && response.ok) {
    const cache = await caches.open(IMAGE_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (isFreshnessCriticalRequest(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
