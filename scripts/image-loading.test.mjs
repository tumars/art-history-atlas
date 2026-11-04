import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const requests = [];
class FakeImage {
  dataset = {};
  isConnected = true;
  naturalWidth = 1280;
  naturalHeight = 900;
  complete = false;
  set src(value) { this._src = value; requests.push(value); }
  get src() { return this._src; }
  removeAttribute(key) { if (key === 'src') this._src = undefined; }
  decode() { return Promise.resolve(); }
}
let visibility;
globalThis.Image = globalThis.HTMLImageElement = FakeImage;
globalThis.IntersectionObserver = class {
  constructor(fn) { visibility = fn; }
  observe() {} unobserve() {}
};
const source = readFileSync(new URL('../src/lib/image-loading.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
// 记录预加载实例，用受控网络完成顺序验证竞争情况。
const loaders = [];
globalThis.Image = class extends FakeImage { constructor() { super(); loaders.push(this); } };
const { loadProgressiveImage, clearProgressiveImage, observeImages } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('屏幕外不请求图片；可见后先显示小图，解码完成才替换大图', async () => {
  const img = new FakeImage();
  img.dataset = { preview: 'small.webp', full: 'large.webp' };
  const before = requests.length;
  observeImages({ querySelectorAll: () => [img] });
  visibility([{ target: img, isIntersecting: false }]);
  assert.equal(requests.length, before);
  visibility([{ target: img, isIntersecting: true }]);
  assert.equal(img.src, 'small.webp');
  assert.equal(loaders.at(-1).src, undefined);
  img.onload();
  const loader = loaders.at(-1);
  let resolveDecode;
  loader.decode = () => new Promise(resolve => { resolveDecode = resolve; });
  const ready = loader.onload();
  assert.equal(img.src, 'small.webp');
  resolveDecode(); await ready;
  assert.equal(img.src, 'large.webp');
  assert.equal(img.dataset.quality, 'full');
});

test('快速切换时，旧大图即使晚完成解码也不能覆盖新作品', async () => {
  const img = new FakeImage();
  loadProgressiveImage(img, 'a-small', 'a-full'); img.onload();
  let resolveDecode;
  loaders.at(-1).decode = () => new Promise(resolve => { resolveDecode = resolve; });
  const old = loaders.at(-1).onload();
  loadProgressiveImage(img, 'b-small', 'b-full');
  resolveDecode(); await old;
  assert.equal(img.src, 'b-small');
  img.onload(); await loaders.at(-1).onload();
  assert.equal(img.src, 'b-full');
});

test('大图失败保留小图；小图失败仍尝试大图', async () => {
  const img = new FakeImage();
  loadProgressiveImage(img, 'small', 'full'); img.onload();
  loaders.at(-1).onerror();
  assert.equal(img.src, 'small');
  loadProgressiveImage(img, 'broken-small', 'full'); img.onerror();
  await loaders.at(-1).onload();
  assert.equal(img.src, 'full');
});

test('关闭大图窗口后，完成解码的旧请求不再写回图片', async () => {
  const img = new FakeImage();
  loadProgressiveImage(img, 'small', 'full'); img.onload();
  let resolveDecode;
  loaders.at(-1).decode = () => new Promise(resolve => { resolveDecode = resolve; });
  const ready = loaders.at(-1).onload();
  clearProgressiveImage(img); resolveDecode(); await ready;
  assert.equal(img.src, undefined);
});
