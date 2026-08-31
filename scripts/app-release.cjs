const fs = require('node:fs');
const path = require('node:path');

function readRelease(root) {
  const release = JSON.parse(fs.readFileSync(path.join(root, '.next/ada-release.json'), 'utf8'));
  const buildId = fs.readFileSync(path.join(root, '.next/BUILD_ID'), 'utf8').trim();
  const version = fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim();
  if (release.buildId !== buildId || release.version !== version || !release.assets?.length) {
    throw new Error('Application build does not match version.txt. Run npm run build before starting.');
  }
  return release;
}

function forPart(release, part) {
  const basePath = `/${part}`;
  const aliases = basePath === release.assetBasePath ? [] : release.assets
    .filter(asset => !asset.url.startsWith(`${release.assetBasePath}/_next/`))
    .map(asset => ({ ...asset, url: `${basePath}${asset.url.slice(release.assetBasePath.length)}` }));
  return { ...release, basePath, assets: [...release.assets, ...aliases],
    pages: ['/', '/login', '/main', '/receive', '/transfer', '/stock', '/price-check', '/icons/icon-192x192.png', '/icons/icon-512x512.png'].map(route => `${basePath}${route}`) };
}

function serveRelease(req, res, route, part, release, workerSource) {
  if (route !== '/api/app-release' && route !== '/sw.js') return false;
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (!release) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 'production-build-required' }));
    return true;
  }
  const payload = forPart(release, part);
  res.setHeader('Content-Type', route === '/sw.js' ? 'application/javascript; charset=utf-8' : 'application/json');
  res.end(req.method === 'HEAD' ? '' : route === '/sw.js'
    ? `self.__ADA_RELEASE__ = ${JSON.stringify(payload)};\n${workerSource}`
    : JSON.stringify(payload));
  return true;
}

module.exports = { readRelease, forPart, serveRelease };
