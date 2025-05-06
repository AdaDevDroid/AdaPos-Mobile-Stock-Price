const { createServer: createHttpsServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/AdaCheckStockSTD'; // กำหนด basePath ถ้ามี

// --- กำหนดค่า SSL ---
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'privatekey.key')), // เรียกจาก root ของโปรเจกต์
    cert: fs.readFileSync(path.join(__dirname, 'cert', '_ada-soft_com.crt')) // เรียกจาก root ของโปรเจกต์
    // หากมี Intermediate certificate (chain) อาจต้องใช้ ca: [fs.readFileSync('path/to/chain.pem')]
};

// --- Port ที่ต้องการให้ Server ทำงาน ---
const httpsPort = 3000;

app.prepare().then(() => {
    // สร้าง HTTPS Server บน Port ที่กำหนด
    createHttpsServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(httpsPort, (err) => {
        if (err) throw err;
        // แนะนำให้แสดง Domain จริง หรือ localhost ถ้าทดสอบในเครื่อง
        console.log(`> Environment: ${process.env.NODE_ENV}`);
        console.log(`> Mode: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
        console.log(`> Ready on https://localhost:${httpsPort}${basePath}`);
        console.log(`> Or access via https://dev.ada-soft.com:${httpsPort}${basePath} if DNS is configured`);
    });

}).catch(err => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});