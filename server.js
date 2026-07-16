require("dotenv").config({ path: ".env.local" });
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");
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

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      const dynamicPartRoute = C_GEToDynamicPartRoute(parsedUrl.pathname);

      if (parsedUrl.pathname === `${basePath}/setting` || parsedUrl.pathname === `${basePath}/setting/`) {
        res.writeHead(301, { Location: `/setting${parsedUrl.search || ""}` });
        res.end();
      } else if (parsedUrl.pathname === "/setting" || parsedUrl.pathname === "/setting/") {
        const correctedUrl = parse(`${basePath}${parsedUrl.path}`, true);
        handle(req, res, correctedUrl);
      } else if (dynamicPartRoute && dynamicPartRoute.routePath === "/setting") {
        res.writeHead(301, { Location: `/setting${parsedUrl.search || ""}` });
        res.end();
      } else if (dynamicPartRoute) {
        C_SETxNoStoreHeaders(res);
        C_SETxDatabasePartHeaders(req, dynamicPartRoute.part);
        const correctedUrl = parse(`${basePath}${dynamicPartRoute.routePath}${parsedUrl.search || ""}`, true);
        handle(req, res, correctedUrl);
      } else if (parsedUrl.pathname && parsedUrl.pathname.startsWith(basePath)) {
        // URLs ที่มี basePath
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
