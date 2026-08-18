const serviceWorkerUrl = new URL(self.location.href);
const deployVersion = serviceWorkerUrl.searchParams.get("version") || "1.0.9";
const buildId = serviceWorkerUrl.searchParams.get("build") || deployVersion;
const VERSION = `${deployVersion}-${buildId}`.replace(/[^A-Za-z0-9._-]/g, "_");
const fallbackBasePath = serviceWorkerUrl.pathname.replace(/\/sw\.js$/, "") || "/AdaCheckStockSTD";
const basePathParam = serviceWorkerUrl.searchParams.get("basePath") || fallbackBasePath;
const assetBasePathParam = serviceWorkerUrl.searchParams.get("assetBasePath") || basePathParam;
const BASE_PATH = `/${basePathParam.replace(/^\/+|\/+$/g, "")}`;
const ASSET_BASE_PATH = `/${assetBasePathParam.replace(/^\/+|\/+$/g, "")}`;
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

const STATIC_URLS = [...new Set([
  `${BASE_PATH}/favicon.ico`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/logoAda.png`,
  `${BASE_PATH}/icons/logoAdaLogin.png`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
  `${ASSET_BASE_PATH}/favicon.ico`,
  `${ASSET_BASE_PATH}/manifest.json`,
  `${ASSET_BASE_PATH}/icons/logoAda.png`,
  `${ASSET_BASE_PATH}/icons/logoAdaLogin.png`,
  `${ASSET_BASE_PATH}/icons/icon-192x192.png`,
  `${ASSET_BASE_PATH}/icons/icon-512x512.png`,
])];

const putInCache = async (cacheName, request, response) => {
  if (!response.ok) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
};

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
  const activePath = `${BASE_PATH.replace(/\/+$/, "")}/`;

  await Promise.all(
    cacheNames
      .filter((cacheName) =>
        (cacheName.startsWith(offlinePrefix) && cacheName !== OFFLINE_CACHE_NAME) ||
        (cacheName.startsWith(staticPrefix) && cacheName !== STATIC_CACHE_NAME)
      )
      .map((cacheName) => caches.delete(cacheName))
  );

  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName === "static-resources" || cacheName.startsWith("workbox-precache"))
      .map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        await Promise.all(requests.map(async (request) => {
          const url = new URL(request.url);
          if (url.origin === self.location.origin && url.pathname.startsWith(activePath)) {
            await cache.delete(request);
          }
        }));
      })
  );
};

const isPartUrl = (url) => (
  url.origin === self.location.origin &&
  (url.pathname === BASE_PATH || url.pathname.startsWith(`${BASE_PATH}/`))
);

const isCacheableAssetUrl = (url) => (
  url.origin === self.location.origin && (
    url.pathname.startsWith(`${ASSET_BASE_PATH}/_next/`) ||
    url.pathname.startsWith(`${BASE_PATH}/icons/`) ||
    url.pathname.startsWith(`${ASSET_BASE_PATH}/icons/`) ||
    url.pathname === `${BASE_PATH}/manifest.json` ||
    url.pathname === `${BASE_PATH}/favicon.ico` ||
    url.pathname === `${ASSET_BASE_PATH}/manifest.json` ||
    url.pathname === `${ASSET_BASE_PATH}/favicon.ico`
  )
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      cacheUrls(OFFLINE_CACHE_NAME, OFFLINE_URLS),
      cacheUrls(STATIC_CACHE_NAME, STATIC_URLS),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    cleanupOldCaches()
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((client) => client.postMessage({ status: "cache-complete", buildId })))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_ASSETS" || !Array.isArray(event.data.urls)) {
    return;
  }

  const urls = event.data.urls.filter((value) => {
    try {
      return isCacheableAssetUrl(new URL(value, self.location.origin));
    } catch {
      return false;
    }
  });

  event.waitUntil(
    cacheUrls(STATIC_CACHE_NAME, urls)
      .then(() => event.ports[0]?.postMessage({ status: "cache-complete", buildId }))
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const partRequest = isPartUrl(url);
  const assetRequest = isCacheableAssetUrl(url);
  if (!partRequest && !assetRequest) {
    return;
  }

  const shouldCache =
    ["document", "script", "style", "image", "font"].includes(request.destination) ||
    url.pathname.endsWith("/manifest.json") ||
    url.pathname.endsWith("/favicon.ico");

  if (!shouldCache) {
    return;
  }

  if (request.destination === "document" && partRequest) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          await putInCache(OFFLINE_CACHE_NAME, request, networkResponse);
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(OFFLINE_CACHE_NAME);
          return (await cache.match(request, { ignoreVary: true })) ||
            (await cache.match(`${BASE_PATH}/login`, { ignoreVary: true })) ||
            Response.error();
        })
    );
    return;
  }

  const cacheName = STATIC_CACHE_NAME;

  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      const cachedResponse = await cache.match(request, { ignoreVary: true });
      const fetchAndCache = fetch(request)
        .then(async (networkResponse) => {
          await putInCache(cacheName, request, networkResponse);
          return networkResponse;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || fetchAndCache;
    })
  );
});
