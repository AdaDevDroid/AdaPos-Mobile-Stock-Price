const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/HistoryModal.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const componentExports = {};
const element = (type, props) => ({ type, props: props || {} });
vm.runInNewContext(source, {
  exports: componentExports,
  require: name => {
    if (name === 'react') return {};
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    throw new Error(`Unexpected import: ${name}`);
  },
});

const collectText = value => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(collectText).join(' ');
  return collectText(value.props?.children);
};

const history = FTXthDocType => ({
  FTDate: '1/9/2569', FTRefDoc: 'TR0001', FNStatus: 1, FTRefSeq: `SEQ-${FTXthDocType ?? 'old'}`, FTXthDocType,
});

test('transfer history shows document type labels and keeps the table scrollable on mobile', () => {
  const tree = componentExports.default({
    isOpen: true,
    onClose() {},
    oDataHistory: [history('1'), history('2'), history('0'), history(undefined)],
    onView() {},
    onRepeat() {},
    showRefDocType: true,
  });
  const text = collectText(tree);
  assert.match(text, /ประเภทเอกสาร/);
  assert.match(text, /ใบจ่ายโอน/);
  assert.match(text, /ใบขอโอน/);
  assert.equal((text.match(/ไม่ระบุประเภท/g) || []).length, 2);
  assert.match(source, /min-w-\[760px\]/);
  assert.match(source, /min-h-0 overflow-auto/);
});

test('other history screens do not gain the transfer-only column', () => {
  const tree = componentExports.default({
    isOpen: true,
    onClose() {},
    oDataHistory: [history(undefined)],
    onView() {},
    onRepeat() {},
  });
  assert.doesNotMatch(collectText(tree), /ประเภทเอกสาร|ไม่ระบุประเภท/);
});

test('transfer persists document type and falls back to product history for old records', () => {
  const transfer = fs.readFileSync(path.join(__dirname, '../app/transfer/page.tsx'), 'utf8');
  assert.match(transfer, /const historyData:[\s\S]*FTXthDocType:\s*refDocType/);
  assert.match(transfer, /history\.FTXthDocType \?\? oProductHistoryList\?\.find/);
  assert.match(transfer, /showRefDocType/);
});
