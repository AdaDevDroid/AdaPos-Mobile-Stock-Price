export const DATABASE_PART_STORAGE_KEY = "ada_db_part";
export const DATABASE_NAME_STORAGE_KEY = "ada_db_name";
export const SESSION_TOKEN_STORAGE_KEY = "session_token";
export const SESSION_EXPIRY_STORAGE_KEY = "session_expiry";
export const SESSION_PART_STORAGE_KEY = "session_part";
export const LAST_ACTIVITY_STORAGE_KEY = "last_activity";
export const APP_BUILD_STORAGE_KEY = "app_build";
export const SIDEBAR_STORAGE_KEY = "sidebarOpen";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD";
export const APP_VERSION = process.env.NEXT_PUBLIC_VERSION || "unknown";
export const APP_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || APP_VERSION;
const CACHE_VERSION = `${APP_VERSION}-${APP_BUILD_ID}`.replace(/[^A-Za-z0-9._-]/g, "_");
const OFFLINE_ROUTE_PATHS = [
  "/",
  "/login",
  "/main",
  "/receive",
  "/transfer",
  "/stock",
  "/price-check",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

export const C_GETtNormalizedPathPart = (part: string): string => {
  return part.trim().replace(/^\/+/, "");
};

const BASE_PART = C_GETtNormalizedPathPart(BASE_PATH).split("/")[0] || "";
const APP_ROUTE_PARTS = new Set(["login", "main", "price-check", "receive", "setting", "stock", "transfer"]);
const RESERVED_PATH_PARTS = new Set([
  ".",
  "..",
  "__proto__",
  "constructor",
  "prototype",
  "_next",
  "api",
  "favicon.ico",
  "icons",
  "manifest.json",
  "sw.js",
  "test-network.ts",
  ...APP_ROUTE_PARTS,
]);

export const C_GETtSafePart = (part: string): string => {
  return C_GETtNormalizedPathPart(part).replace(/[^A-Za-z0-9._-]/g, "_") || "default";
};

export const C_GETtNormalizedDatabaseName = (database: string): string => {
  return database.trim();
};

export const C_GETtPathPartFromUrl = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return C_GETtPathPartFromPathname(window.location.pathname);
};

export const C_GETtPathPartFromPathname = (pathname: string): string => {
  const parts = pathname.split("/").filter(Boolean);
  const firstPart = parts[0] || "";
  const secondPart = parts[1] || "";
  if (!firstPart || RESERVED_PATH_PARTS.has(firstPart.toLowerCase())) {
    return "";
  }

  if (firstPart !== BASE_PART && APP_ROUTE_PARTS.has(firstPart)) {
    return "";
  }

  if (secondPart && !APP_ROUTE_PARTS.has(secondPart)) {
    return "";
  }

  return firstPart;
};

export const C_GETtBasePathFromPathname = (pathname: string): string => {
  const part = C_GETtPathPartFromPathname(pathname);

  return part ? `/${part}` : BASE_PATH;
};

export const C_GETtRoutePathFromPathname = (pathname: string): string => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const parts = normalizedPath.split("/").filter(Boolean);
  const firstPart = parts[0] || "";
  const secondPart = parts[1] || "";

  if (parts.length > 1 && (firstPart === BASE_PART || APP_ROUTE_PARTS.has(secondPart))) {
    return `/${parts.slice(1).join("/")}`;
  }

  return normalizedPath;
};

export const C_SYNCxDatabasePartFromUrl = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return C_GETtPathPartFromUrl();
};

export const C_GETtActiveDatabasePart = (): string => {
  if (typeof window === "undefined") {
    return BASE_PART;
  }

  return C_GETtPathPartFromUrl() || BASE_PART;
};

export const C_GETtConfiguredDatabasePart = (): string => BASE_PART;

export const C_GETtActiveBasePath = (): string => {
  const part = C_GETtActiveDatabasePart();

  return part ? `/${part}` : BASE_PATH;
};

export const C_GETtPartStorageKey = (key: string, part = C_GETtActiveDatabasePart()): string => {
  return `adapos:${C_GETtSafePart(part)}:${key}`;
};

export const C_GETtPartStorageValue = (key: string, part = C_GETtActiveDatabasePart()): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(C_GETtPartStorageKey(key, part));
};

export const C_SETxPartStorageValue = (key: string, value: string, part = C_GETtActiveDatabasePart()) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(C_GETtPartStorageKey(key, part), value);
  }
};

export const C_REMxPartStorageValue = (key: string, part = C_GETtActiveDatabasePart()) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(C_GETtPartStorageKey(key, part));
  }
};

export const C_MIGxLegacyStorageForActivePart = () => {
  if (typeof window === "undefined") {
    return;
  }

  const part = C_GETtActiveDatabasePart();
  const migrationKey = C_GETtPartStorageKey("legacy_storage_migrated_v1", part);
  if (localStorage.getItem(migrationKey) === "1") {
    return;
  }

  if (localStorage.getItem(SESSION_PART_STORAGE_KEY) === part) {
    [SESSION_TOKEN_STORAGE_KEY, SESSION_EXPIRY_STORAGE_KEY, SESSION_PART_STORAGE_KEY, LAST_ACTIVITY_STORAGE_KEY]
      .forEach((key) => {
        const legacyValue = localStorage.getItem(key);
        if (legacyValue !== null && C_GETtPartStorageValue(key, part) === null) {
          C_SETxPartStorageValue(key, legacyValue, part);
        }
      });
  }

  if (localStorage.getItem(DATABASE_PART_STORAGE_KEY) === part) {
    const legacyDatabase = localStorage.getItem(DATABASE_NAME_STORAGE_KEY);
    if (legacyDatabase !== null && C_GETtPartStorageValue(DATABASE_NAME_STORAGE_KEY, part) === null) {
      C_SETxPartStorageValue(DATABASE_NAME_STORAGE_KEY, legacyDatabase, part);
    }
  }

  const legacySidebar = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (legacySidebar !== null && C_GETtPartStorageValue(SIDEBAR_STORAGE_KEY, part) === null) {
    C_SETxPartStorageValue(SIDEBAR_STORAGE_KEY, legacySidebar, part);
  }

  localStorage.setItem(migrationKey, "1");
};

export const C_GEToDatabaseSettings = () => {
  if (typeof window === "undefined") {
    return { part: "", database: "" };
  }

  C_MIGxLegacyStorageForActivePart();
  const part = C_GETtActiveDatabasePart();
  return {
    part,
    database: C_GETtPartStorageValue(DATABASE_NAME_STORAGE_KEY, part) || "",
  };
};

export const C_SEToDatabaseSettings = (part: string, database: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPart = C_GETtNormalizedPathPart(part);
  if (!normalizedPart) {
    return;
  }

  C_SETxPartStorageValue(DATABASE_NAME_STORAGE_KEY, C_GETtNormalizedDatabaseName(database), normalizedPart);
};

export const C_GETxPartSession = () => {
  C_MIGxLegacyStorageForActivePart();
  return {
    token: C_GETtPartStorageValue(SESSION_TOKEN_STORAGE_KEY),
    expiry: C_GETtPartStorageValue(SESSION_EXPIRY_STORAGE_KEY),
    part: C_GETtPartStorageValue(SESSION_PART_STORAGE_KEY),
  };
};

export const C_SETxPartSession = (token: string, expiry: string) => {
  const part = C_GETtActiveDatabasePart();
  C_SETxPartStorageValue(SESSION_TOKEN_STORAGE_KEY, token, part);
  C_SETxPartStorageValue(SESSION_EXPIRY_STORAGE_KEY, expiry, part);
  C_SETxPartStorageValue(SESSION_PART_STORAGE_KEY, part, part);
  C_SETxPartStorageValue(LAST_ACTIVITY_STORAGE_KEY, Date.now().toString(), part);
};

export const C_CLRxPartSession = () => {
  [SESSION_TOKEN_STORAGE_KEY, SESSION_EXPIRY_STORAGE_KEY, SESSION_PART_STORAGE_KEY, LAST_ACTIVITY_STORAGE_KEY]
    .forEach((key) => C_REMxPartStorageValue(key));
};

export const C_GETtRememberedUsernameCookieName = (part = C_GETtActiveDatabasePart()): string => {
  return `rememberedUsername_${C_GETtSafePart(part)}`;
};

export const C_GETtPartSessionStorageKey = (key: string, part = C_GETtActiveDatabasePart()): string => {
  return `adapos:${C_GETtSafePart(part)}:${key}`;
};

export const C_GETtServiceWorkerUrl = (basePath = C_GETtActiveBasePath()): string => {
  return `${basePath.replace(/\/+$/, "")}/sw.js`;
};

export const C_GETtPartCachePrefixes = (part = C_GETtActiveDatabasePart()) => {
  const cachePart = `/${C_GETtNormalizedPathPart(part)}`.replace(/[^A-Za-z0-9._-]/g, "_");
  return [`adapos-offline-${cachePart}-`, `static-resources-${cachePart}-`];
};

export const C_GETtActivePartCachePrefixes = () => C_GETtPartCachePrefixes();

export const C_GETtPartCacheNames = (part = C_GETtActiveDatabasePart()) => {
  const [offlinePrefix, staticPrefix] = C_GETtPartCachePrefixes(part);
  return [`${offlinePrefix}${CACHE_VERSION}`, `${staticPrefix}${CACHE_VERSION}`] as const;
};

export type PartCacheStatus = {
  offlineCount: number;
  offlineRequired: number;
  staticCount: number;
  staticRequired: number;
  missingOffline: string[];
  missingStatic: string[];
  isReady: boolean;
};

const C_GETaMissingCacheUrls = async (cacheName: string, requiredUrls: string[]): Promise<string[]> => {
  const cacheNames = await caches.keys();
  if (!cacheNames.includes(cacheName)) {
    return requiredUrls;
  }

  const cache = await caches.open(cacheName);
  const missing: string[] = [];
  for (const url of requiredUrls) {
    if (!await cache.match(url, { ignoreVary: true })) {
      missing.push(url);
    }
  }
  return missing;
};

export const C_GETxActivePartCacheStatus = async (): Promise<PartCacheStatus> => {
  if (typeof window === "undefined" || !("caches" in window)) {
    return {
      offlineCount: 0,
      offlineRequired: OFFLINE_ROUTE_PATHS.length,
      staticCount: 0,
      staticRequired: 0,
      missingOffline: [...OFFLINE_ROUTE_PATHS],
      missingStatic: [],
      isReady: false,
    };
  }

  const activeBasePath = C_GETtActiveBasePath().replace(/\/+$/, "");
  const offlineUrls = OFFLINE_ROUTE_PATHS.map((routePath) =>
    new URL(`${activeBasePath}${routePath === "/" ? "/" : routePath}`, window.location.origin).href
  );
  const [offlineCacheName, staticCacheName] = C_GETtPartCacheNames();
  const cache = await caches.open(offlineCacheName);
  const marker = await cache.match(`${activeBasePath}/__app-cache-manifest`);
  const release = marker ? await marker.json() : null;
  const staticUrls: string[] = release?.buildId === APP_BUILD_ID
    ? release.assets.map((asset: { url: string }) => asset.url) : [];
  const [missingOffline, missingStatic] = await Promise.all([
    C_GETaMissingCacheUrls(offlineCacheName, offlineUrls),
    C_GETaMissingCacheUrls(staticCacheName, staticUrls),
  ]);
  const offlineCount = offlineUrls.length - missingOffline.length;
  const staticCount = staticUrls.length - missingStatic.length;

  return {
    offlineCount,
    offlineRequired: offlineUrls.length,
    staticCount,
    staticRequired: staticUrls.length,
    missingOffline,
    missingStatic,
    isReady: offlineUrls.length > 0 && staticUrls.length > 0 &&
      missingOffline.length === 0 && missingStatic.length === 0,
  };
};

const C_CLRxLegacyCacheEntriesForPart = async (cacheName: string, part: string) => {
  const cache = await caches.open(cacheName);
  const activePath = `/${C_GETtNormalizedPathPart(part).replace(/\/+$/, "")}/`;
  const requests = await cache.keys();
  await Promise.all(requests.map(async (request) => {
    const url = new URL(request.url);
    if (url.origin === window.location.origin && url.pathname.startsWith(activePath)) {
      await cache.delete(request);
    }
  }));
};

const C_CLRxPartWebAssets = async (part: string, includeCurrentBuild: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  if ("caches" in window) {
    const prefixes = C_GETtPartCachePrefixes(part);
    const currentCacheNames = new Set(C_GETtPartCacheNames(part));
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(async (cacheName) => {
      if (
        prefixes.some((prefix) => cacheName.startsWith(prefix)) &&
        (includeCurrentBuild || !currentCacheNames.has(cacheName))
      ) {
        await caches.delete(cacheName);
      } else if (cacheName === "static-resources" || cacheName.startsWith("workbox-precache")) {
        await C_CLRxLegacyCacheEntriesForPart(cacheName, part);
      }
    }));
  }

  if (includeCurrentBuild && "serviceWorker" in navigator) {
    const activeScope = new URL(`/${C_GETtNormalizedPathPart(part).replace(/\/+$/, "")}/`, window.location.origin).href;
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter((registration) => registration.scope === activeScope)
      .map((registration) => registration.unregister()));
  }
};

export const C_CLRxActivePartWebAssets = async () => {
  await C_CLRxPartWebAssets(C_GETtActiveDatabasePart(), true);
};

export const C_CLRxPartClientState = async (part: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPart = C_GETtNormalizedPathPart(part);
  const keyPrefix = `adapos:${C_GETtSafePart(normalizedPart)}:`;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(keyPrefix)) {
      localStorage.removeItem(key);
    }
  }
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(keyPrefix)) {
      sessionStorage.removeItem(key);
    }
  }
  await C_CLRxPartWebAssets(normalizedPart, true);
};

export const C_GETtPartUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const activeBasePath = C_GETtActiveBasePath();

  return `${activeBasePath}${normalizedPath}`;
};

export const C_GEToDatabaseHeaders = (tokenOverride?: string): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  const headers: Record<string, string> = {};
  const part = C_GETtActiveDatabasePart();
  const token = tokenOverride || C_GETxPartSession().token;

  if (part) {
    headers["x-ada-db-part"] = part;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
