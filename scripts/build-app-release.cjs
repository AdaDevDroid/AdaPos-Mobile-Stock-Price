const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, '.next/required-server-files.json'), 'utf8')).config;
const buildId = fs.readFileSync(path.join(root, '.next/BUILD_ID'), 'utf8').trim();
const version = fs.readFileSync(path.join(root, 'version.txt'), 'utf8').trim();
if (config.env.NEXT_PUBLIC_BUILD_ID !== buildId || config.env.NEXT_PUBLIC_VERSION !== version) {
  throw new Error('Client and server build metadata do not match.');
}
const assets = [];
function add(file, url) {
  assets.push({ url, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
}
function walk(directory, url) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, `${url}/${entry.name}`);
    else if (!entry.name.endsWith('.map')) add(file, `${url}/${entry.name}`);
  }
}
walk(path.join(root, '.next/static'), `${config.basePath}/_next/static`);
for (const file of ['favicon.ico', 'manifest.json', 'icons/logoAda.png', 'icons/logoAdaLogin.png', 'icons/icon-192x192.png', 'icons/icon-512x512.png']) {
  add(path.join(root, 'public', file), `${config.basePath}/${file}`);
}
fs.writeFileSync(path.join(root, '.next/ada-release.json'), JSON.stringify({ version, buildId, assetBasePath: config.basePath, assets }));
console.log(`Release ${version} (${buildId}): ${assets.length} verified offline assets`);
