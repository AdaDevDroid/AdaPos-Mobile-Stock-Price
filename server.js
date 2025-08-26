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

// ฟังก์ชันสำหรับ restart server
function scheduleRestart() {
  const now = new Date();
  const restart = new Date();
  restart.setHours(1, 0, 0, 0); // ตั้งเวลาตี 1
  
  // ถ้าเวลาปัจจุบันผ่านตี 1 แล้ว ให้ restart วันถัดไป
  if (now >= restart) {
    restart.setDate(restart.getDate() + 1);
  }
  
  const timeUntilRestart = restart.getTime() - now.getTime();
  
  console.log(`🕐 Auto-restart scheduled at ${restart.toLocaleString('th-TH')}`);
  console.log(`⏰ Time until restart: ${Math.floor(timeUntilRestart / (1000 * 60 * 60))}h ${Math.floor((timeUntilRestart % (1000 * 60 * 60)) / (1000 * 60))}m`);
  
  setTimeout(() => {
    console.log('🔄 Auto-restart initiated at 1:00 AM...');
    console.log('🧹 Clearing cache before restart...');
    
    // Clear cache directly without external batch file
    const { exec } = require('child_process');
    const clearCommands = [
      'rmdir /s /q ".next\\cache" 2>nul',
      'del /q "*.log" 2>nul',
      'npm cache clean --force'
    ].join(' && ');
    
    exec(clearCommands, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Cache clear had some issues, continuing restart...');
      } else {
        console.log('✅ Cache cleared successfully');
      }
      console.log('🔄 Restarting server...');
      process.exit(0); // ปิดเซิร์ฟเวอร์เพื่อให้ restart
    });
    
  }, timeUntilRestart);
}

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
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
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Environment: ${process.env.NODE_ENV}`);
      console.log(`> Mode: ${dev ? "DEVELOPMENT" : "PRODUCTION"}`);
      console.log(`> Ready on http://localhost:${port}${basePath}`);
      console.log(
        `> Or access via http://dev.ada-soft.com:${port}${basePath} if DNS is configured`
      );
      
      // กำหนดเวลา restart อัตโนมัติ
      scheduleRestart();
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
