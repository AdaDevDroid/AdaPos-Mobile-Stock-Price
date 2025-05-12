const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/AdaCheckStockSTD';

const port = 3001;

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Environment: ${process.env.NODE_ENV}`);
        console.log(`> Mode: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
        console.log(`> Ready on http://localhost:${port}${basePath}`);
        console.log(`> Or access via http://dev.ada-soft.com:${port}${basePath} if DNS is configured`);
    });

}).catch(err => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
});