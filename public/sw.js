const VERSION = "1.0.8-offline-cache-2";
const serviceWorkerUrl = new URL(self.location.href);
const fallbackBasePath = serviceWorkerUrl.pathname.replace(/\/sw\.js$/, "") || "/AdaCheckStockSTD";
const basePathParam = serviceWorkerUrl.searchParams.get("basePath") || fallbackBasePath;
const BASE_PATH = `/${basePathParam.replace(/^\/+|\/+$/g, "")}`;
const CACHE_PART = BASE_PATH.replace(/[^A-Za-z0-9_-]/g, "_");
const OFFLINE_CACHE_NAME = `adapos-offline-${CACHE_PART}-${VERSION}`;
const STATIC_CACHE_NAME = `static-resources-${CACHE_PART}-${VERSION}`;

const OFFLINE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/login`,
  `${BASE_PATH}/main`,
  `${BASE_PATH}/receive`,
  `${BASE_PATH}/transfer`,
  `${BASE_PATH}/stock`,
  `${BASE_PATH}/price-check`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
];

const STATIC_URLS = [
  `${BASE_PATH}/favicon.ico`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/logoAda.png`,
  `${BASE_PATH}/icons/logoAdaLogin.png`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
];

const cacheUrls = async (cacheName, urls) => {
  const cache = await caches.open(cacheName);

  await Promise.all(
    urls.map(async (assetUrl) => {
      try {
        const response = await fetch(assetUrl, { cache: "reload" });
        if (response.ok) {
          await cache.put(assetUrl, response.clone());
        }
      } catch (error) {
        console.warn("Unable to cache asset:", assetUrl, error);
      }
    })
  );
};

const cleanupOldCaches = async () => {
  const cacheNames = await caches.keys();
  const offlinePrefix = `adapos-offline-${CACHE_PART}-`;
  const staticPrefix = `static-resources-${CACHE_PART}-`;

  await Promise.all(
    cacheNames
      .filter((cacheName) =>
        cacheName === "static-resources" ||
        cacheName.startsWith("workbox-precache") ||
        (cacheName.startsWith(offlinePrefix) && cacheName !== OFFLINE_CACHE_NAME) ||
        (cacheName.startsWith(staticPrefix) && cacheName !== STATIC_CACHE_NAME)
      )
      .map((cacheName) => caches.delete(cacheName))
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      cacheUrls(OFFLINE_CACHE_NAME, OFFLINE_URLS),
      cacheUrls(STATIC_CACHE_NAME, STATIC_URLS),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(`${BASE_PATH}/`)) {
    return;
  }

  const shouldCache =
    ["document", "script", "style", "image", "font"].includes(request.destination) ||
    url.pathname.endsWith("/manifest.json") ||
    url.pathname.endsWith("/favicon.ico");

  if (!shouldCache) {
    return;
  }

  const cacheName = request.destination === "document" ? OFFLINE_CACHE_NAME : STATIC_CACHE_NAME;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchAndCache = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchAndCache;
    })
  );
});
