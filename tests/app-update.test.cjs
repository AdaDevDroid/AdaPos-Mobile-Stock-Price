const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const ts = require('typescript');
const { readRelease, forPart, serveRelease } = require('../scripts/app-release.cjs');

const workerSource = fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const release = {
  version: '1.0.11', buildId: 'B', assetBasePath: '/Part', basePath: '/Part',
  pages: ['/Part/login', '/Part/transfer'],
  assets: [{ url: '/Part/_next/static/login.js', sha256: hash('login') },
    { url: '/Part/_next/static/transfer.js', sha256: hash('transfer') }],
};

class Channel {
  constructor() {
    this.port1 = { close() {}, postMessage: data => queueMicrotask(() => this.port2.onmessage?.({ data })) };
    this.port2 = { close() {}, postMessage: data => queueMicrotask(() => this.port1.onmessage?.({ data })) };
  }
}

function harness(options = {}) {
  const stores = new Map();
  const events = {};
  const actions = [];
  const clients = options.clients || [];
  const activeRelease = options.release || release;
  const key = request => new URL(typeof request === 'string' ? request : request.url, 'https://app.test').href;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        put: async (url, response) => entries.set(key(url), response.clone()),
        match: async url => entries.get(key(url))?.clone(),
        keys: async () => [...entries.keys()].map(url => ({ url })),
      };
    },
  };
  const fetch = async url => {
    const pathname = new URL(typeof url === 'string' ? url : url.url, 'https://app.test').pathname;
    if (options.offline) throw new Error('Offline');
    const body = pathname.endsWith('transfer.js') ? 'transfer' : pathname.endsWith('login.js') ? 'login' : '<html>build B</html>';
    return new Response(options.corrupt === pathname ? 'bad bytes' : body, {
      status: options.missing === pathname ? 404 : 200,
      headers: { 'X-Ada-Build-Id': options.mixed === pathname ? 'C' : activeRelease.buildId },
    });
  };
  const self = {
    __ADA_RELEASE__: activeRelease,
    location: new URL('https://app.test/Part/sw.js?version=1.0.8&build=A'),
    registration: { active: { scriptURL: 'https://app.test/Part/old.js' }, waiting: {} },
    clients: { matchAll: async () => [...clients], claim: async () => actions.push('claim') },
    skipWaiting: async () => actions.push('skipWaiting'),
    addEventListener: (name, handler) => { events[name] = handler; },
  };
  vm.runInNewContext(workerSource, {
    self, caches, fetch, URL, Response, AbortController, crypto: webcrypto,
    MessageChannel: Channel, setTimeout: (fn, ms) => setTimeout(fn, ms === 3000 ? 10 : ms), clearTimeout,
  });
  return {
    stores, caches, actions, clients, self,
    install: () => new Promise((resolve, reject) => events.install({ waitUntil: promise => promise.then(resolve, reject) })),
    message: type => new Promise(resolve => events.message({ data: { type }, ports: [{ postMessage: resolve }], waitUntil() {} })),
    fetch: (url, destination) => new Promise(resolve => {
      let handled = false;
      events.fetch({ request: { url: `https://app.test${url}`, method: 'GET', destination, mode: ['document', 'iframe'].includes(destination) ? 'navigate' : 'cors' }, respondWith: promise => { handled = true; resolve(promise); } });
      if (!handled) resolve(null);
    }),
  };
}

function client(id, { ready = true, buildId = 'A', silent = false, url = 'https://app.test/Part/transfer', onPrepare } = {}) {
  const messages = [];
  return { id, url, messages, postMessage(data, ports) {
    messages.push(data.type);
    if (data.type === 'PREPARE_UPDATE') onPrepare?.();
    if (!silent && ports?.[0]) ports[0].postMessage({ ready, buildId });
  } };
}

async function seedOld(h) {
  await (await h.caches.open('adapos-offline-_Part-1.0.10-A')).put('/Part/login', new Response('old page'));
  await (await h.caches.open('static-resources-_Part-1.0.10-A')).put('/Part/_next/static/old.js', new Response('old chunk'));
  await (await h.caches.open('adapos-offline-_Other-1.0.10-A')).put('/Other/login', new Response('other part'));
  await (await h.caches.open('adapos-offline-_Part-Branch-1.0.10-A')).put('/Part-Branch/login', new Response('prefix overlap'));
}

test('install stages all route chunks and never skips waiting or removes old caches', async () => {
  const h = harness();
  await seedOld(h);
  await h.install();
  assert.equal((await h.message('GET_STATUS')).ready, true);
  assert.deepEqual(h.actions, []);
  assert.ok(h.stores.has('adapos-offline-_Part-1.0.10-A'));
  assert.ok(await (await h.caches.open('static-resources-_Part-1.0.11-B')).match('/Part/_next/static/transfer.js'));
});

test('unchanged hashed assets from a previous CDN build are accepted by checksum', async () => {
  const h = harness({ mixed: '/Part/_next/static/login.js' });
  await h.install();
  assert.equal((await h.message('GET_STATUS')).ready, true);
});

for (const [name, options] of [
  ['missing lazy chunk', { missing: '/Part/_next/static/transfer.js' }],
  ['corrupt chunk', { corrupt: '/Part/_next/static/transfer.js' }],
  ['mixed build HTML', { mixed: '/Part/transfer' }],
  ['network loss', { offline: true }],
]) test(`${name} aborts installation and keeps old offline files`, async () => {
  const h = harness(options);
  await seedOld(h);
  await assert.rejects(h.install(), /Incomplete release/);
  assert.equal((await h.message('GET_STATUS')).ready, false);
  assert.ok(h.stores.has('adapos-offline-_Part-1.0.10-A'));
  assert.deepEqual(h.actions, []);
});

for (const [name, options] of [['pending work', { ready: false }], ['legacy unresponsive tab', { silent: true }]]) {
  test(`${name} blocks every tab and releases prepared tabs`, async () => {
    const safe = client('safe');
    const h = harness({ clients: [safe, client('busy', options)] });
    await h.install();
    assert.equal((await h.message('APPLY_UPDATE')).blocked, true);
    assert.deepEqual(h.actions, []);
    assert.ok(safe.messages.includes('CANCEL_UPDATE'));
  });
}

test('a tab opened during readiness checks cancels activation', async () => {
  const clients = [];
  clients.push(client('first', { onPrepare: () => clients.push(client('new')) }));
  const h = harness({ clients });
  await h.install();
  assert.equal((await h.message('APPLY_UPDATE')).blocked, true);
  assert.deepEqual(h.actions, []);
});

test('ready tabs activate but retain old assets until all clients report new build', async () => {
  const h = harness({ clients: [client('one'), client('two')] });
  await seedOld(h);
  await h.install();
  assert.equal((await h.message('APPLY_UPDATE')).applied, true);
  assert.deepEqual(h.actions, ['skipWaiting']);
  assert.equal((await h.message('CLIENT_READY')).cleaned, false);
  assert.ok(h.stores.has('static-resources-_Part-1.0.10-A'));
  h.clients.splice(0, h.clients.length, client('one', { buildId: 'B' }), client('two', { buildId: 'B' }));
  assert.equal((await h.message('CLIENT_READY')).cleaned, true);
  assert.ok(!h.stores.has('static-resources-_Part-1.0.10-A'));
  assert.ok(h.stores.has('adapos-offline-_Other-1.0.10-A'));
  assert.ok(h.stores.has('adapos-offline-_Part-Branch-1.0.10-A'));
});

test('unknown or foreign-Part clients are not forcibly reloaded', async () => {
  const foreign = client('other', { url: 'https://app.test/Other/main', ready: false });
  const h = harness({ clients: [client('one'), foreign] });
  await h.install();
  assert.equal((await h.message('APPLY_UPDATE')).applied, true);
  assert.deepEqual(foreign.messages, []);
});

test('cache eviction after install blocks activation until repair succeeds', async () => {
  const h = harness({ clients: [client('one')] });
  await h.install();
  h.stores.get('static-resources-_Part-1.0.11-B').delete('https://app.test/Part/_next/static/transfer.js');
  assert.match((await h.message('APPLY_UPDATE')).error, /incomplete/);
  assert.equal((await h.message('REPAIR')).ready, true);
  assert.equal((await h.message('APPLY_UPDATE')).applied, true);
});

test('manual same-build repair cleans only owned old caches without reloading clients', async () => {
  const h = harness({ clients: [client('one', { buildId: 'B', ready: false })] });
  await seedOld(h);
  await h.install();
  assert.equal((await h.message('REPAIR')).ready, true);
  assert.equal((await h.message('CLIENT_READY')).cleaned, true);
  assert.ok(!h.stores.has('adapos-offline-_Part-1.0.10-A'));
  assert.ok(h.stores.has('adapos-offline-_Part-1.0.11-B'));
  assert.ok(h.stores.has('static-resources-_Part-1.0.11-B'));
  assert.ok(h.stores.has('adapos-offline-_Other-1.0.10-A'));
  assert.ok(h.stores.has('adapos-offline-_Part-Branch-1.0.10-A'));
  assert.deepEqual(h.clients[0].messages, ['GET_CLIENT_BUILD']);
  assert.deepEqual(h.actions, []);
});

test('failed manual repair never removes old caches', async () => {
  const options = { clients: [client('one', { buildId: 'B' })] };
  const h = harness(options);
  await seedOld(h);
  await h.install();
  options.offline = true;
  assert.match((await h.message('REPAIR')).error, /Incomplete release/);
  assert.ok(h.stores.has('adapos-offline-_Part-1.0.10-A'));
  assert.ok(h.stores.has('static-resources-_Part-1.0.10-A'));
  assert.deepEqual(h.actions, []);
});

test('offline routes and old lazy chunks work without requests; API is never cached', async () => {
  const options = {};
  const h = harness(options);
  await seedOld(h);
  await h.install();
  options.offline = true;
  assert.equal(await (await h.fetch('/Part/transfer', 'document')).text(), '<html>build B</html>');
  assert.equal(await (await h.fetch('/Part/transfer', 'iframe')).text(), '<html>build B</html>');
  assert.equal(await (await h.fetch('/Part/_next/static/transfer.js', 'script')).text(), 'transfer');
  assert.equal(await (await h.fetch('/Part/_next/static/old.js', 'script')).text(), 'old chunk');
  assert.equal(await h.fetch('/Part/api/products', ''), null);
});

test('navigation keeps active build HTML until the new worker is ready', async () => {
  const options = {};
  const h = harness(options);
  await h.install();
  options.mixed = '/Part/transfer';
  const response = await h.fetch('/Part/transfer', 'document');
  assert.equal(response.headers.get('X-Ada-Build-Id'), 'B');
});

test('optimized local images use the verified original asset offline', async () => {
  const options = {};
  const h = harness(options);
  await h.install();
  options.offline = true;
  const response = await h.fetch('/Part/_next/image?url=%2FPart%2F_next%2Fstatic%2Flogin.js&w=256&q=75', 'image');
  assert.equal(await response.text(), 'login');
});

test('legacy CACHE_ASSETS cannot delete old caches or add arbitrary old chunk URLs', async () => {
  const h = harness();
  await seedOld(h);
  await h.install();
  assert.equal((await h.message('CACHE_ASSETS')).status, 'cache-complete');
  assert.ok(h.stores.has('adapos-offline-_Part-1.0.10-A'));
});

test('stable and legacy worker URLs serve current release, with bytes changing per build', () => {
  const result = (url, buildId) => {
    const headers = {};
    let body;
    serveRelease({ method: 'GET', url }, { setHeader: (key, value) => { headers[key] = value; }, end: value => { body = value; } }, '/sw.js', 'Part', { ...release, buildId }, workerSource);
    assert.match(headers['Cache-Control'], /no-store/);
    return body;
  };
  assert.equal(result('/Part/sw.js', 'B'), result('/Part/sw.js?version=1.0.8&build=A', 'B'));
  assert.notEqual(result('/Part/sw.js', 'A'), result('/Part/sw.js', 'B'));
});

test('dynamic Parts have their own public asset aliases', () => {
  const result = forPart({ ...release, assets: [...release.assets, { url: '/Part/icons/logoAda.png', sha256: 'hash' }] }, 'Agency');
  assert.ok(result.pages.includes('/Agency/transfer'));
  assert.ok(result.assets.some(asset => asset.url === '/Agency/icons/logoAda.png' && asset.sha256 === 'hash'));
});

test('startup rejects stale build or edited version.txt', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ada-release-test-'));
  try {
    fs.mkdirSync(path.join(root, '.next'));
    fs.writeFileSync(path.join(root, '.next/ada-release.json'), JSON.stringify(release));
    fs.writeFileSync(path.join(root, '.next/BUILD_ID'), 'B');
    fs.writeFileSync(path.join(root, 'version.txt'), '1.0.11');
    assert.equal(readRelease(root).buildId, 'B');
    fs.writeFileSync(path.join(root, 'version.txt'), '1.0.12');
    assert.throws(() => readRelease(root), /Run npm run build/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

function clientHelpers(fetch) {
  const exports = {};
  const cleanups = [];
  const window = { location: { pathname: '/Part/transfer' }, setTimeout, clearTimeout };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../hooks/CAppUpdate.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, window, AbortController, fetch, require: name => name === 'react'
    ? { useRef: () => ({ current: {} }), useLayoutEffect: fn => cleanups.push(fn()) }
    : { C_GETtActiveBasePath: () => '/Part' } });
  return { exports, window, cleanups };
}

test('old client discovers server B directly without trusting localStorage build A', async () => {
  let requests = 0;
  const { exports } = clientHelpers(async (url, options) => {
    requests++;
    assert.equal(url, '/Part/api/app-release');
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify(release));
  });
  assert.equal((await exports.C_GETxServerRelease()).buildId, 'B');
  assert.equal(requests, 1);
});

test('page guard denies missing, dirty or unmounted pages and allows an idle mounted page', () => {
  const { exports, window, cleanups } = clientHelpers();
  assert.equal(exports.C_CANxApplyUpdate(), false);
  exports.useAppUpdateGuard(false);
  assert.equal(exports.C_CANxApplyUpdate(), true);
  exports.useAppUpdateGuard(true);
  assert.equal(exports.C_CANxApplyUpdate(), false);
  cleanups.pop()();
  assert.equal(exports.C_CANxApplyUpdate(), true);
  window.location.pathname = '/Part/receive';
  assert.equal(exports.C_CANxApplyUpdate(), false);
});

test('updater does not clear IndexedDB, credentials or pending records', () => {
  for (const file of ['public/sw.js', 'hooks/CAppUpdate.ts', 'components/AppUpdate.tsx', 'components/NetworkStatus.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(source, /indexedDB\.deleteDatabase|localStorage\.clear|sessionStorage\.clear|C_CLRxPartClientState/);
  }
});
