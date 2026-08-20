const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const versionPath = path.join(__dirname, "version.txt");
const appVersion = fs.readFileSync(versionPath, "utf8").trim();
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(appVersion)) {
  throw new Error(`Invalid application version in ${versionPath}: "${appVersion}"`);
}
process.env.NEXT_PUBLIC_VERSION = appVersion;

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { spawn, exec } = require("child_process");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD";
const port = process.env.PORT || 3001;
const basePart = basePath.replace(/^\/+/, "").split("/")[0] || "";
const safePathPart = /^[A-Za-z0-9._-]+$/;
const reservedPathParts = new Set([
  ".",
  "..",
  "__proto__",
  "constructor",
  "prototype",
  "_next",
  "api",
  "favicon.ico",
  "icons",
  "login",
  "main",
  "manifest.json",
  "price-check",
  "receive",
  "setting",
  "stock",
  "sw.js",
  "test-network.ts",
  "transfer",
]);
const pageRoutes = new Set(["/", "/login", "/main", "/price-check", "/receive", "/setting", "/stock", "/transfer"]);
const runtimeSettingsPath = path.join(process.cwd(), ".runtime", "database-paths.json");

const C_GETbDatabaseSetting = (value) => {
  if (typeof value === "string") {
    return Boolean(value.trim());
  }
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && String(value.database || "").trim());
};

const C_GEToEnvPartSettings = () => {
  const settings = {};
  try {
    const parsed = JSON.parse(process.env.DATABASE_NAME_BY_PATH || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [rawPart, value] of Object.entries(parsed)) {
        if (C_GETbDatabaseSetting(value)) {
          settings[rawPart.replace(/^\/+/, "")] = value;
        }
      }
    }
  } catch (error) {
    console.error("Invalid DATABASE_NAME_BY_PATH:", error.message);
  }

  if (basePart && process.env.NAME_DB) {
    settings[basePart] = settings[basePart] || process.env.NAME_DB;
  }
  return settings;
};

const envPartSettings = C_GEToEnvPartSettings();

const C_GEToRuntimePartSettings = () => {
  try {
    if (!fs.existsSync(runtimeSettingsPath)) {
      return {};
    }
    const parsed = JSON.parse(fs.readFileSync(runtimeSettingsPath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error("Unable to read runtime database settings:", error.message);
    return {};
  }
};

const C_GEToPartResolution = (requestedPart) => {
  const normalizedPart = String(requestedPart || "").replace(/^\/+/, "");
  const normalizedLowerPart = normalizedPart.toLowerCase();
  const runtimeSettings = C_GEToRuntimePartSettings();
  const mergedSettings = { ...envPartSettings };

  for (const [rawPart, value] of Object.entries(runtimeSettings)) {
    const part = rawPart.replace(/^\/+/, "");
    if (value === null) {
      if (!Object.prototype.hasOwnProperty.call(envPartSettings, part)) {
        delete mergedSettings[part];
      }
    } else if (C_GETbDatabaseSetting(value)) {
      mergedSettings[part] = value;
    }
  }

  const activePart = Object.keys(mergedSettings).find((part) => part.toLowerCase() === normalizedLowerPart);
  if (activePart) {
    return { status: "active", part: activePart };
  }

  const deletedPart = Object.keys(runtimeSettings).find(
    (part) => part.toLowerCase() === normalizedLowerPart && runtimeSettings[part] === null
  );
  return deletedPart
    ? { status: "deleted", part: deletedPart }
    : { status: "unknown", part: normalizedPart };
};

const C_GEToDynamicPartRoute = (pathname) => {
  if (!pathname || pathname === "/") {
    return null;
  }

  const parts = pathname.split("/").filter(Boolean);
  const part = parts[0] || "";
  if (!part || part === basePart || reservedPathParts.has(part.toLowerCase())) {
    return null;
  }

  if (!safePathPart.test(part)) {
    return null;
  }

  const routePath = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "/";
  const pagePath = routePath.replace(/\/$/, "") || "/";
  if (
    pageRoutes.has(pagePath) ||
    routePath.startsWith("/api/") ||
    routePath.startsWith("/_next/") ||
    routePath.startsWith("/icons/") ||
    routePath === "/favicon.ico" ||
    routePath === "/manifest.json" ||
    routePath === "/sw.js" ||
    routePath === "/test-network.ts"
  ) {
    return { part, routePath };
  }

  return null;
};

const C_SETxDatabasePartHeaders = (req, part) => {
  req.headers["x-forwarded-prefix"] = `/${part}`;
  req.headers["x-ada-db-part"] = part;
};

const C_SETxNoStoreHeaders = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

const C_GETbNoStoreRoute = (routePath) => {
  const normalizedPath = (routePath || "/").replace(/\/$/, "") || "/";
  return pageRoutes.has(normalizedPath) ||
    normalizedPath.startsWith("/api/") ||
    normalizedPath === "/manifest.json" ||
    normalizedPath === "/sw.js";
};

const C_SNDxInvalidPart = (res, routePath, resolution) => {
  const statusCode = resolution.status === "deleted" ? 410 : 404;
  C_SETxNoStoreHeaders(res);
  res.statusCode = statusCode;

  if (routePath.startsWith("/api/")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      status: "invalid-part",
      code: resolution.status === "deleted" ? "database-part-deleted" : "database-part-not-configured",
      part: resolution.part,
    }));
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(statusCode === 410 ? "This Part has been deleted." : "This Part is not configured.");
};

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      const dynamicPartRoute = C_GEToDynamicPartRoute(parsedUrl.pathname);

      if (parsedUrl.pathname === `${basePath}/setting` || parsedUrl.pathname === `${basePath}/setting/`) {
        C_SETxNoStoreHeaders(res);
        res.writeHead(301, { Location: `/setting${parsedUrl.search || ""}` });
        res.end();
      } else if (parsedUrl.pathname === "/setting" || parsedUrl.pathname === "/setting/") {
        C_SETxNoStoreHeaders(res);
        const correctedUrl = parse(`${basePath}${parsedUrl.path}`, true);
        handle(req, res, correctedUrl);
      } else if (dynamicPartRoute && dynamicPartRoute.routePath === "/setting") {
        C_SETxNoStoreHeaders(res);
        res.writeHead(301, { Location: `/setting${parsedUrl.search || ""}` });
        res.end();
      } else if (dynamicPartRoute) {
        const resolution = C_GEToPartResolution(dynamicPartRoute.part);
        if (resolution.status !== "active") {
          C_SNDxInvalidPart(res, dynamicPartRoute.routePath, resolution);
          return;
        }
        if (resolution.part !== dynamicPartRoute.part) {
          C_SETxNoStoreHeaders(res);
          res.writeHead(308, {
            Location: `/${resolution.part}${dynamicPartRoute.routePath}${parsedUrl.search || ""}`,
          });
          res.end();
          return;
        }
        if (C_GETbNoStoreRoute(dynamicPartRoute.routePath)) {
          C_SETxNoStoreHeaders(res);
        }
        C_SETxDatabasePartHeaders(req, dynamicPartRoute.part);
        const correctedUrl = parse(`${basePath}${dynamicPartRoute.routePath}${parsedUrl.search || ""}`, true);
        handle(req, res, correctedUrl);
      } else if (
        parsedUrl.pathname &&
        (parsedUrl.pathname === basePath || parsedUrl.pathname.startsWith(`${basePath}/`))
      ) {
        // URLs ที่มี basePath
        const baseRoutePath = parsedUrl.pathname.slice(basePath.length) || "/";
        if (C_GETbNoStoreRoute(baseRoutePath)) {
          C_SETxNoStoreHeaders(res);
        }
        C_SETxDatabasePartHeaders(req, basePart);
        handle(req, res, parsedUrl);
      } else if (
        parsedUrl.pathname &&
        parsedUrl.pathname.startsWith("/_next/")
      ) {
        // URLs ที่เริ่มต้นด้วย /_next/
        const correctedUrl = parse(`${basePath}${parsedUrl.pathname}`, true);
        handle(req, res, correctedUrl);
      } else {
        // Redirect ไปที่ basePath
        res.writeHead(301, { Location: basePath });
        res.end();
      }
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Environment: ${process.env.NODE_ENV}`);
      console.log(`> Mode: ${dev ? "DEVELOPMENT" : "PRODUCTION"}`);
      console.log(`> Ready on http://localhost:${port}${basePath}`);
      console.log(
        `> Or access via http://dev.ada-soft.com:${port}${basePath} if DNS is configured`
      );
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error("Error preparing Next.js app:", err);
    process.exit(1);
  });
