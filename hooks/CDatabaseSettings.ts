export const DATABASE_PART_STORAGE_KEY = "ada_db_part";
export const DATABASE_NAME_STORAGE_KEY = "ada_db_name";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD";

export const C_GETtNormalizedPathPart = (part: string): string => {
  return part.trim().replace(/^\/+/, "");
};

const BASE_PART = C_GETtNormalizedPathPart(BASE_PATH).split("/")[0] || "";
const APP_ROUTE_PARTS = new Set(["login", "main", "price-check", "receive", "setting", "stock", "transfer"]);
const RESERVED_PATH_PARTS = new Set([
  "_next",
  "api",
  "favicon.ico",
  "icons",
  "manifest.json",
  "sw.js",
  "test-network.ts",
  ...APP_ROUTE_PARTS,
]);

export const C_GETtNormalizedDatabaseName = (database: string): string => {
  return database.trim();
};

export const C_GEToDatabaseSettings = () => {
  if (typeof window === "undefined") {
    return { part: "", database: "" };
  }

  return {
    part: localStorage.getItem(DATABASE_PART_STORAGE_KEY) || "",
    database: localStorage.getItem(DATABASE_NAME_STORAGE_KEY) || "",
  };
};

export const C_SEToDatabaseSettings = (part: string, database: string) => {
  localStorage.setItem(DATABASE_PART_STORAGE_KEY, C_GETtNormalizedPathPart(part));
  localStorage.setItem(DATABASE_NAME_STORAGE_KEY, C_GETtNormalizedDatabaseName(database));
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

  const part = C_GETtPathPartFromUrl();
  if (part) {
    localStorage.setItem(DATABASE_PART_STORAGE_KEY, part);
  }

  return part;
};

export const C_GETtActiveDatabasePart = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return C_SYNCxDatabasePartFromUrl() || localStorage.getItem(DATABASE_PART_STORAGE_KEY) || BASE_PART;
};

export const C_GETtActiveBasePath = (): string => {
  const part = C_GETtActiveDatabasePart();

  return part ? `/${part}` : BASE_PATH;
};

export const C_GETtServiceWorkerUrl = (basePath = C_GETtActiveBasePath()): string => {
  const activeBasePath = basePath.replace(/\/+$/, "");

  return `${activeBasePath}/sw.js?basePath=${encodeURIComponent(activeBasePath)}`;
};

export const C_REGxServiceWorkerForActivePart = () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  C_SYNCxDatabasePartFromUrl();
  const activeBasePath = C_GETtActiveBasePath();

  return navigator.serviceWorker.register(C_GETtServiceWorkerUrl(activeBasePath), {
    scope: `${activeBasePath}/`,
  });
};

export const C_GETtPartUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const activeBasePath = C_GETtActiveBasePath();

  return `${activeBasePath}${normalizedPath}`;
};

export const C_GEToDatabaseHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  const headers: Record<string, string> = {};
  const part = C_GETtActiveDatabasePart();
  const token = localStorage.getItem("session_token");

  if (part) {
    headers["x-ada-db-part"] = part;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
