// Local-only integration fixture: real compiled UI and SW, no database/API access.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const { readRelease, serveRelease } = require('../scripts/app-release.cjs');
const root = path.join(__dirname, '..');
const original = readRelease(root);
const basePath = original.assetBasePath;
const worker = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
let generation = 'A';
let failAsset = false;
let offline = false;
const build = letter => `fixture-${letter}-${original.buildId}`;
const rewrite = (buffer, letter) => Buffer.from(buffer.toString()
  .replaceAll(original.buildId, build(letter)).replaceAll('static/', `static/fixture-${letter}/`));
const generations = new Map(['A', 'B', 'C'].map(letter => {
  const files = new Map();
  const assets = original.assets.map(asset => {
    const route = asset.url.slice(basePath.length);
    const file = path.join(root, route.startsWith('/_next/static/') ? `.next/${route.slice('/_next/'.length)}` : `public${route}`);
    const bytes = fs.readFileSync(file);
    const body = /\.(js|css|json)$/.test(file) ? rewrite(bytes, letter) : bytes;
    const url = asset.url.replaceAll(original.buildId, build(letter)).replace('/_next/static/', `/_next/static/fixture-${letter}/`);
    files.set(url, body);
    return { url, sha256: createHash('sha256').update(body).digest('hex') };
  });
  for (const route of ['/', '/login', '/main', '/receive', '/transfer', '/stock', '/price-check']) {
    files.set(`${basePath}${route}`, rewrite(fs.readFileSync(path.join(root, `.next/server/app/${route === '/' ? 'index' : route.slice(1)}.html`)), letter));
  }
  return [letter, { files, release: { ...original, buildId: build(letter), assets } }];
}));

const controls = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Update test controls</title></head><body>
<h1>Local update test</h1><p>No backend connections. Synthetic data only.</p>
<button onclick="publishFixture('B')">Publish B</button><button onclick="publishFixture('C-fail')">Publish C with missing chunk</button>
<button onclick="publishFixture('C')">Repair C assets</button><button onclick="publishFixture('offline')">Network unavailable</button><button onclick="publishFixture('online')">Network available</button>
<button onclick="seed()">Seed pending record</button><button onclick="seedCaches()">Seed old caches</button><button onclick="inspect()">Inspect test state</button>
<p><a href="${basePath}/login">Open application</a> | <a href="/mobile">Open mobile viewport</a></p><pre id="state"></pre>
<script>
const request = value => new Promise((resolve,reject) => {value.onsuccess=()=>resolve(value.result);value.onerror=()=>reject(value.error)});
async function seed() {
 const db=await request(indexedDB.open('AdaDB'));
 const tx=db.transaction('TCNTProductReceive','readwrite');
 tx.objectStore('TCNTProductReceive').put({FNId:99999,FTBarcode:'TEST-OFFLINE-KEEP',FNQuantity:7,FTRefDoc:'TEST-REF',FTRefSeq:'TEST-SEQ'},99999);
 await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=reject});db.close();await inspect();
}
async function seedCaches() {
 const part=${JSON.stringify(basePath)};
 const suffix=part.replace(/[^A-Za-z0-9._-]/g,'_')+'-1.0.8-fixture-old';
 await (await caches.open('adapos-offline-'+suffix)).put(part+'/login',new Response('old fixture page'));
 await (await caches.open('static-resources-'+suffix)).put(part+'/_next/static/old.js',new Response('old fixture chunk'));
 await (await caches.open('adapos-offline-_OtherFixture-1.0.8-old')).put('/OtherFixture/login',new Response('other Part'));
 await inspect();
}
async function publishFixture(value) {await fetch('/control',{method:'POST',body:value});await inspect()}
async function inspect() {
 const server=await (await fetch('/state')).json();
 const names=await caches.keys(); const registrations=await navigator.serviceWorker.getRegistrations();
 const workers=[];
 for(const reg of registrations) for(const kind of ['active','waiting']) if(reg[kind]) {
   const reply=await new Promise(resolve=>{const c=new MessageChannel();const t=setTimeout(()=>resolve({timeout:true}),3000);c.port1.onmessage=e=>{clearTimeout(t);c.port1.close();resolve(e.data)};reg[kind].postMessage({type:'GET_STATUS'},[c.port2])});workers.push({kind,...reply});
 }
 let pending=null;
 const db=await request(indexedDB.open('AdaDB'));
 if(db.objectStoreNames.contains('TCNTProductReceive')) pending=await request(db.transaction('TCNTProductReceive').objectStore('TCNTProductReceive').get(99999));db.close();
 document.getElementById('state').textContent=JSON.stringify({server,workers,caches:names,pending},null,2);
}
inspect();
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/mobile') {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<html><body style="margin:0"><iframe title="Mobile viewport" src="${basePath}/login" width="390" height="640" style="border:0;display:block"></iframe></body></html>`);
    return;
  }
  if (url.pathname === '/control') {
    if (req.method === 'POST') {
      let value = ''; for await (const chunk of req) value += chunk;
      if (['A', 'B', 'C', 'C-fail'].includes(value)) { generation = value[0]; failAsset = value.endsWith('fail'); }
      if (value === 'offline') offline = true;
      if (value === 'online') offline = false;
    }
    res.setHeader('Content-Type', 'text/html'); res.end(controls); return;
  }
  if (url.pathname === '/state') { res.end(JSON.stringify({generation,failAsset,offline})); return; }
  if (offline) { req.socket.destroy(); return; }
  const current = generations.get(generation);
  res.setHeader('X-Ada-Build-Id', current.release.buildId);
  const route = url.pathname.slice(basePath.length);
  if (serveRelease(req,res,route,basePath.slice(1),current.release,worker)) return;
  if (route === '/api/health') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({status:'healthy',buildId:current.release.buildId})); return; }
  const body = current.files.get(url.pathname);
  if (!body || (failAsset && url.pathname.includes('/chunks/app/transfer/'))) { res.statusCode=404;res.end('Fixture missing file');return; }
  const ext = path.extname(url.pathname);
  res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.woff2':'font/woff2'})[ext] || 'text/html; charset=utf-8');
  res.end(body);
});
server.listen(3191, '127.0.0.1', () => console.log(`Integration fixture: http://127.0.0.1:3191/control`));
