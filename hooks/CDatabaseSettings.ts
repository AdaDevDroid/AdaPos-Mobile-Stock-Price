export const DATABASE_PART_STORAGE_KEY = "ada_db_part";
export const DATABASE_NAME_STORAGE_KEY = "ada_db_name";
export const SESSION_TOKEN_STORAGE_KEY = "session_token";
export const SESSION_EXPIRY_STORAGE_KEY = "session_expiry";
export const SESSION_PART_STORAGE_KEY = "session_part";
export const LAST_ACTIVITY_STORAGE_KEY = "last_activity";
export const APP_BUILD_STORAGE_KEY = "app_build";
export const SIDEBAR_STORAGE_KEY = "sidebarOpen";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD";
export const APP_VERSION = process.env.NEXT_PUBLIC_VERSION || "1.0.9";
export const APP_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || APP_VERSION;

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

const C_GETtSafePart = (part: string): string => {
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

export const C_GETtServiceWorkerUrl = (basePath = C_GETtActiveBasePath()): string => {
  const activeBasePath = basePath.replace(/\/+$/, "");
  const params = new URLSearchParams({
    basePath: activeBasePath,
    assetBasePath: BASE_PATH.replace(/\/+$/, ""),
    version: APP_VERSION,
    build: APP_BUILD_ID,
  });

  return `${activeBasePath}/sw.js?${params.toString()}`;
};

const C_GETaCurrentPageAssetUrls = (): string[] => {
  const activeBasePath = C_GETtActiveBasePath().replace(/\/+$/, "");
  const assetBasePath = BASE_PATH.replace(/\/+$/, "");
  const urls = new Set<string>();

  document.querySelectorAll<HTMLElement>("script[src], link[href], img[src]").forEach((element) => {
    const value = element.getAttribute("src") || element.getAttribute("href");
    if (value) {
      urls.add(new URL(value, window.location.origin).href);
    }
  });

  performance.getEntriesByType("resource").forEach((entry) => urls.add(entry.name));

  return [...urls].filter((value) => {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && (
      url.pathname.startsWith(`${assetBasePath}/_next/`) ||
      url.pathname.startsWith(`${activeBasePath}/icons/`) ||
      url.pathname.startsWith(`${assetBasePath}/icons/`) ||
      url.pathname === `${activeBasePath}/manifest.json` ||
      url.pathname === `${activeBasePath}/favicon.ico` ||
      url.pathname === `${assetBasePath}/manifest.json` ||
      url.pathname === `${assetBasePath}/favicon.ico`
    );
  });
};

const C_CACHExCurrentPageAssets = async (registration: ServiceWorkerRegistration) => {
  const readyRegistration = registration.active ? registration : await navigator.serviceWorker.ready;
  const worker = readyRegistration.active;
  if (!worker) {
    return;
  }

  await new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    const timeoutId = window.setTimeout(resolve, 10000);
    channel.port1.onmessage = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };
    worker.postMessage({ type: "CACHE_ASSETS", urls: C_GETaCurrentPageAssetUrls() }, [channel.port2]);
  });
};

export const C_REGxServiceWorkerForActivePart = async () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const activeBasePath = C_GETtActiveBasePath();
  const registration = await navigator.serviceWorker.register(C_GETtServiceWorkerUrl(activeBasePath), {
    scope: `${activeBasePath}/`,
    updateViaCache: "none",
  });
  await registration.update();
  await C_CACHExCurrentPageAssets(registration);
  return registration;
};

export const C_GETtActivePartCachePrefixes = () => {
  const cachePart = C_GETtActiveBasePath().replace(/[^A-Za-z0-9_-]/g, "_");
  return [`adapos-offline-${cachePart}-`, `static-resources-${cachePart}-`];
};

const C_CLRxLegacyCacheEntriesForActivePart = async (cacheName: string) => {
  const cache = await caches.open(cacheName);
  const activePath = `${C_GETtActiveBasePath().replace(/\/+$/, "")}/`;
  const requests = await cache.keys();
  await Promise.all(requests.map(async (request) => {
    const url = new URL(request.url);
    if (url.origin === window.location.origin && url.pathname.startsWith(activePath)) {
      await cache.delete(request);
    }
  }));
};

export const C_CLRxActivePartWebAssets = async () => {
  if (typeof window === "undefined") {
    return;
  }

  if ("caches" in window) {
    const prefixes = C_GETtActivePartCachePrefixes();
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(async (cacheName) => {
      if (prefixes.some((prefix) => cacheName.startsWith(prefix))) {
        await caches.delete(cacheName);
      } else if (cacheName === "static-resources" || cacheName.startsWith("workbox-precache")) {
        await C_CLRxLegacyCacheEntriesForActivePart(cacheName);
      }
    }));
  }

  if ("serviceWorker" in navigator) {
    const activeScope = new URL(`${C_GETtActiveBasePath().replace(/\/+$/, "")}/`, window.location.origin).href;
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter((registration) => registration.scope === activeScope)
      .map((registration) => registration.unregister()));
  }
};

let activeRepairPromise: Promise<boolean> | null = null;

const C_RPRxActivePartAssets = async (reason: string, onRepaired?: () => void) => {
  if (typeof window === "undefined") {
    return false;
  }

  const guardKey = C_GETtPartStorageKey(`repair:${APP_BUILD_ID}:${reason}`);
  if (sessionStorage.getItem(guardKey) === "done") {
    return false;
  }

  if (activeRepairPromise) {
    return activeRepairPromise;
  }

  activeRepairPromise = (async () => {
    sessionStorage.setItem(guardKey, "running");
    try {
      await C_CLRxActivePartWebAssets();
      await C_REGxServiceWorkerForActivePart();
      onRepaired?.();
      sessionStorage.setItem(guardKey, "done");
      window.location.reload();
      return true;
    } catch (error) {
      sessionStorage.removeItem(guardKey);
      throw error;
    } finally {
      activeRepairPromise = null;
    }
  })();

  return activeRepairPromise;
};

export const C_RPRxActivePartAssetsOnce = async (reason = "asset") => {
  return C_RPRxActivePartAssets(reason);
};

export const C_ENSxActivePartBuild = async () => {
  if (typeof window === "undefined") {
    return false;
  }

  C_MIGxLegacyStorageForActivePart();
  const storedBuild = C_GETtPartStorageValue(APP_BUILD_STORAGE_KEY);
  if (!storedBuild) {
    C_SETxPartStorageValue(APP_BUILD_STORAGE_KEY, APP_BUILD_ID);
    return false;
  }
  if (storedBuild === APP_BUILD_ID) {
    return false;
  }

  return C_RPRxActivePartAssets("build", () => {
    C_SETxPartStorageValue(APP_BUILD_STORAGE_KEY, APP_BUILD_ID);
  });
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
