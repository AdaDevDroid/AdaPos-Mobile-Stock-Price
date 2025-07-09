require("dotenv").config({ path: ".env.local" });
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD";

const port = process.env.PORT || 3001;

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);

      // จัดการกับ URLs ที่มี basePath
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith(basePath)) {
        // URLs ที่มี basePath
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
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Environment: ${process.env.NODE_ENV}`);
      console.log(`> Mode: ${dev ? "DEVELOPMENT" : "PRODUCTION"}`);
      console.log(`> Ready on http://localhost:${port}${basePath}`);
      console.log(
        `> Or access via http://dev.ada-soft.com:${port}${basePath} if DNS is configured`
      );
    });
  })
  .catch((err) => {
    console.error("Error preparing Next.js app:", err);
    process.exit(1);
  });
