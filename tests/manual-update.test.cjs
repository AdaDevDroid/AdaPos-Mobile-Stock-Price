const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/AppUpdate.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function updater(options = {}) {
  const states = [];
  const effects = [];
  const calls = [];
  const exports = {};
  const window = new EventTarget();
  window.location = { pathname: '/Part/transfer' };
  const document = new EventTarget();
  document.visibilityState = 'visible';
  document.getElementById = () => null;
  const active = {};
  const waiting = options.newBuild ? {} : null;
  const registration = { active, waiting, update: async () => {} };
  const navigator = { onLine: options.online !== false, serviceWorker: new EventTarget() };
  navigator.serviceWorker.register = async () => registration;
  const helpers = {
    C_CANxApplyUpdate: () => false,
    C_GETxServerRelease: async () => {
      calls.push('release');
      await options.hold;
      return { version: '1.0.11', buildId: options.newBuild ? 'C' : 'B', basePath: '/Part' };
    },
    C_WAITxReleaseWorker: async () => waiting || active,
    C_MSGxWorker: async (_worker, type) => {
      calls.push(type);
      if (type === 'GET_STATUS') return { ready: true };
      if (type === 'REPAIR') {
        if (options.failRepair) throw new Error('Incomplete release');
        return { ready: true };
      }
      if (type === 'CLIENT_READY') return { cleaned: options.cleaned !== false };
      if (type === 'APPLY_UPDATE') return { blocked: true };
      throw new Error(`Unexpected message: ${type}`);
    },
  };
  active.postMessage = message => calls.push(`background:${message.type}`);
  vm.runInNewContext(source, {
    exports, window, document, navigator, Event, CustomEvent,
    process: { env: { NODE_ENV: 'production' } },
    setTimeout, clearTimeout, setInterval: () => 1, clearInterval() {}, console: { warn() {} },
    require: name => {
      if (name === 'react') return {
        useState(value) {
          const index = states.length;
          states.push(value);
          return [value, next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
        },
        useEffect: effect => effects.push(effect),
      };
      if (name === 'react/jsx-runtime') return { jsx: (_type, props) => props, jsxs: (_type, props) => props };
      if (name === 'lucide-react') return {};
      if (name === '@/hooks/CDatabaseSettings') return { APP_BUILD_ID: 'B', C_GETtServiceWorkerUrl: () => '/Part/sw.js' };
      if (name === '@/hooks/CAppUpdate') return helpers;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  exports.default({ basePath: '/Part', disabled: false });
  const dispose = effects[0]();
  return { calls, states, dispose, manual: () => window.dispatchEvent(new CustomEvent('ada-app-repair', { detail: { manual: true } })) };
}

const settle = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };

test('network menu is not trapped below update notices by a fixed ancestor', () => {
  const file = ts.createSourceFile('layout.tsx', fs.readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let menus = 0;
  const visit = (node, fixedAncestor = false) => {
    let fixed = fixedAncestor;
    if (ts.isJsxElement(node)) {
      const attribute = node.openingElement.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.text === 'className');
      if (attribute?.initializer && ts.isStringLiteral(attribute.initializer)) {
        fixed ||= /(?:^|\s)(?:[\w-]+:)*fixed(?:\s|$)/.test(attribute.initializer.text);
      }
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === 'NetworkStatus') {
      menus++;
      assert.equal(fixed, false, 'A fixed ancestor traps the menu below the root-level update toast');
    }
    ts.forEachChild(node, child => visit(child, fixed));
  };
  visit(file);
  assert.equal(menus, 1);
});

test('manual current-build action repairs before cleanup, reports success and never reloads', async () => {
  const app = updater();
  await settle();
  app.calls.length = 0;
  app.manual();
  await settle();
  assert.deepEqual(app.calls, ['release', 'GET_STATUS', 'REPAIR', 'CLIENT_READY']);
  assert.match(app.states[0], /ล้าง Cache เก่าเรียบร้อย/);
  assert.equal(app.states[3], null);
  app.dispose();
});

test('manual new-build action attempts guarded activation even away from login', async () => {
  const app = updater({ newBuild: true });
  await settle();
  app.calls.length = 0;
  app.manual();
  await settle();
  assert.deepEqual(app.calls, ['release', 'GET_STATUS', 'REPAIR', 'APPLY_UPDATE']);
  assert.match(app.states[0], /มีงานค้างหรือแท็บที่ยังไม่พร้อม/);
  assert.equal(typeof app.states[3], 'function');
  app.dispose();
});

test('manual failed download reports failure without cleanup or activation', async () => {
  const app = updater({ failRepair: true });
  await settle();
  app.calls.length = 0;
  app.manual();
  await settle();
  assert.deepEqual(app.calls, ['release', 'GET_STATUS', 'REPAIR']);
  assert.match(app.states[0], /เตรียมไฟล์อัปเดตไม่สำเร็จ/);
  assert.equal(typeof app.states[3], 'function');
  app.dispose();
});

test('manual cleanup reports retained caches when older tabs are still open', async () => {
  const app = updater({ cleaned: false });
  await settle();
  app.manual();
  await settle();
  assert.match(app.states[0], /ยังเก็บ Cache เก่าไว้/);
  assert.equal(typeof app.states[3], 'function');
  app.dispose();
});

test('manual offline action reports its reason without fetching or deleting', async () => {
  const app = updater({ online: false });
  app.manual();
  await settle();
  assert.deepEqual(app.calls, []);
  assert.match(app.states[0], /ยังไม่มีการล้าง Cache/);
  app.dispose();
});

test('manual request during background check is queued instead of silently dropped', async () => {
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  const app = updater({ hold });
  app.manual();
  app.manual();
  release();
  await settle();
  assert.equal(app.calls.filter(type => type === 'release').length, 2);
  assert.equal(app.calls.filter(type => type === 'REPAIR').length, 1);
  assert.match(app.states[0], /ล้าง Cache เก่าเรียบร้อย/);
  app.dispose();
});
