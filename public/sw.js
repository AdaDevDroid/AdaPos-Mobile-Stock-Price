// server.js stamps the immutable release into both stable and legacy SW URLs.
const release = self.__ADA_RELEASE__;
if (!release?.buildId || !release.assets?.length) throw new Error("Missing build manifest");
const { basePath: BASE_PATH, buildId, version } = release;
const CACHE_PART = BASE_PATH.replace(/[^A-Za-z0-9._-]/g, "_");
const VERSION = `${version}-${buildId}`.replace(/[^A-Za-z0-9._-]/g, "_");
const OFFLINE_PREFIX = `adapos-offline-${CACHE_PART}-`;
const STATIC_PREFIX = `static-resources-${CACHE_PART}-`;
const OFFLINE_CACHE_NAME = `${OFFLINE_PREFIX}${VERSION}`;
const STATIC_CACHE_NAME = `${STATIC_PREFIX}${VERSION}`;
const MARKER = `${BASE_PATH}/__app-cache-manifest`;
const assetMap = new Map(release.assets.map(asset => [asset.url, asset]));

const scopedClients = async () => (await self.clients.matchAll({ type: "window", includeUncontrolled: true }))
  .filter(client => {
    const url = new URL(client.url);
    return url.origin === self.location.origin && url.pathname.startsWith(`${BASE_PATH}/`);
  });

const ask = (client, type) => new Promise(resolve => {
  const channel = new MessageChannel();
  const finish = value => { clearTimeout(timer); channel.port1.close(); resolve(value); };
  const timer = setTimeout(() => finish(null), 3000);
  channel.port1.onmessage = event => finish(event.data);
  client.postMessage({ type, buildId }, [channel.port2]);
});

const status = async () => {
  const pageCache = await caches.open(OFFLINE_CACHE_NAME);
  const staticCache = await caches.open(STATIC_CACHE_NAME);
  const marker = await pageCache.match(MARKER);
  const missing = [];
  for (const url of release.pages) if (!await pageCache.match(url)) missing.push(url);
  for (const asset of release.assets) if (!await staticCache.match(asset.url)) missing.push(asset.url);
  return { buildId, version, ready: !!marker && missing.length === 0, failed: missing };
};

let preparation;
const prepare = () => {
  if (preparation) return preparation;
  preparation = (async () => {
    const pageCache = await caches.open(OFFLINE_CACHE_NAME);
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    const jobs = [
      ...release.pages.map(url => ({ url, cache: pageCache })),
      ...release.assets.map(asset => ({ ...asset, cache: staticCache })),
    ];
    const failures = [];
    // Bound parallel downloads; an incomplete release never replaces the active cache.
    await Promise.all(Array.from({ length: 4 }, async () => {
      for (let job; (job = jobs.shift());) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          try {
            const response = await fetch(job.url, { cache: "no-store", signal: controller.signal });
            if (!response.ok || (!job.sha256 && response.headers.get("X-Ada-Build-Id") !== buildId)) {
              throw new Error("Unavailable or mixed deployment");
            }
            if (job.sha256) {
              const digest = await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer());
              const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
              if (hash !== job.sha256) throw new Error("Asset checksum mismatch");
            }
            await job.cache.put(job.url, response);
          } finally { clearTimeout(timer); }
        } catch { failures.push(job.url); }
      }
    }));
    if (failures.length) throw new Error(`Incomplete release: ${failures.join(", ")}`);
    await pageCache.put(MARKER, new Response(JSON.stringify(release), {
      headers: { "Content-Type": "application/json" },
    }));
    return status();
  })().finally(() => { preparation = null; });
  return preparation;
};

const partCacheNames = async () => {
  const names = await caches.keys();
  const owned = [];
  for (const name of names.filter(name => name.startsWith(OFFLINE_PREFIX))) {
    const cache = await caches.open(name);
    const entries = await cache.keys();
    const marker = await cache.match(MARKER);
    const metadata = marker ? await marker.json() : null;
    const matches = metadata ? metadata.basePath === BASE_PATH : entries.length > 0 && entries.every(entry => {
      const url = new URL(entry.url);
      return url.origin === self.location.origin && url.pathname.startsWith(`${BASE_PATH}/`);
    });
    if (matches) owned.push(name, `${STATIC_PREFIX}${name.slice(OFFLINE_PREFIX.length)}`);
  }
  return owned;
};

const cleanup = async () => {
  if (!(await status()).ready) return { buildId, cleaned: false };
  const clients = await scopedClients();
  const replies = await Promise.all(clients.map(client => ask(client, "GET_CLIENT_BUILD")));
  if (!clients.length || replies.some(reply => reply?.buildId !== buildId)) return { buildId, cleaned: false };
  // Old/unknown clients keep their assets until they have actually loaded this build.
  const latest = await scopedClients();
  if (latest.some(client => !clients.some(previous => previous.id === client.id))) return { buildId, cleaned: false };
  for (const name of await partCacheNames()) {
    if (name !== OFFLINE_CACHE_NAME && name !== STATIC_CACHE_NAME) await caches.delete(name);
  }
  return { buildId, cleaned: true };
};

let applying = false;
const applyUpdate = async () => {
  if (applying) return { blocked: true, buildId };
  applying = true;
  const clients = await scopedClients();
  try {
    if (!(await status()).ready) throw new Error("Release cache is incomplete");
    const replies = await Promise.all(clients.map(client => ask(client, "PREPARE_UPDATE")));
    const latest = await scopedClients();
    if (!clients.length || replies.some(reply => reply?.ready !== true) ||
        latest.some(client => !clients.some(previous => previous.id === client.id))) {
      clients.forEach(client => client.postMessage({ type: "CANCEL_UPDATE", buildId }));
      return { blocked: true, buildId };
    }
    if (self.registration.active?.scriptURL === self.location.href && !self.registration.waiting) {
      clients.forEach(client => client.postMessage({ type: "RELOAD_UPDATE", buildId }));
    } else {
      await self.skipWaiting();
    }
    return { applied: true, buildId };
  } catch (error) {
    clients.forEach(client => client.postMessage({ type: "CANCEL_UPDATE", buildId }));
    throw error;
  } finally { applying = false; }
};

self.addEventListener("install", event => event.waitUntil(prepare()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  await self.clients.claim();
  (await scopedClients()).forEach(client => client.postMessage({ type: "RELOAD_UPDATE", buildId }));
})()));
self.addEventListener("message", event => {
  const action = async () => {
    switch (event.data?.type) {
      case "GET_STATUS": return status();
      case "REPAIR": return prepare();
      case "CACHE_ASSETS": {
        const result = (await status()).ready ? await status() : await prepare();
        return { ...result, status: "cache-complete" };
      }
      case "APPLY_UPDATE": return applyUpdate();
      case "CLIENT_READY": return cleanup();
      default: return null;
    }
  };
  event.waitUntil(action().then(result => event.ports[0]?.postMessage(result))
    .catch(error => event.ports[0]?.postMessage({ buildId, error: error.message })));
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      url.pathname.includes("/api/") || url.pathname.endsWith("/sw.js")) return;
  if (url.pathname === `${release.assetBasePath}/_next/image` && url.searchParams.has("url")) {
    const source = new URL(url.searchParams.get("url"), self.location.origin);
    if (source.origin === self.location.origin && assetMap.has(source.pathname)) {
      event.respondWith((async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        return await cache.match(source.pathname) || fetch(request);
      })());
    }
    return;
  }
  if ((request.mode === "navigate" || request.destination === "document") && url.pathname.startsWith(`${BASE_PATH}/`)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if ([404, 410].includes(response.status) && response.headers.get("X-Ada-Part-Status")) {
          for (const name of await partCacheNames()) await caches.delete(name);
          await self.registration.unregister();
        }
        if (response.ok && response.headers.get("X-Ada-Build-Id") !== buildId) {
          const current = await (await caches.open(OFFLINE_CACHE_NAME)).match(url.pathname, { ignoreVary: true });
          if (current) return current;
        }
        return response;
      }
      catch {
        const cache = await caches.open(OFFLINE_CACHE_NAME);
        return await cache.match(url.pathname, { ignoreVary: true }) ||
          await cache.match(`${BASE_PATH}/login`, { ignoreVary: true }) || Response.error();
      }
    })());
  } else if (assetMap.has(url.pathname) || url.pathname.startsWith(`${release.assetBasePath}/_next/static/`)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const current = await cache.match(url.pathname, { ignoreVary: true });
      if (current) return current;
      // Lazy chunks requested by an older open tab must still resolve after activation.
      for (const name of await partCacheNames()) {
        if (!name.startsWith(STATIC_PREFIX)) continue;
        const previous = await (await caches.open(name)).match(url.pathname, { ignoreVary: true });
        if (previous) return previous;
      }
      return fetch(request);
    })());
  }
});
