import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const { outputText } = ts.transpileModule(readFileSync(new URL('../src/lib/navigation.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
let count = 0;
async function setup() {
  const entries = [{ url: 'https://atlas.test/#hall', state: null }];
  let index = 0;
  const handlers = {};
  globalThis.location = { href: entries[0].url };
  globalThis.scrollX = 0; globalThis.scrollY = 120;
  globalThis.document = { activeElement: null, body: { style: {} }, querySelector: () => null, querySelectorAll: () => [] };
  globalThis.window = { scrollTo: ({ left, top }) => { globalThis.scrollX = left; globalThis.scrollY = top; } };
  globalThis.requestAnimationFrame = fn => fn();
  globalThis.addEventListener = (name, fn) => { handlers[name] = fn; };
  const travel = delta => {
    index += delta;
    globalThis.location.href = entries[index].url;
    handlers.popstate({ state: entries[index].state });
  };
  globalThis.history = {
    replaceState(state, _, url) { entries[index] = { state, url: url ?? location.href }; location.href = entries[index].url; },
    pushState(state, _, url) { entries.splice(++index); entries.push({ state, url }); location.href = url; },
    back() { travel(-1); }, forward() { travel(1); },
  };
  const nav = await import(`data:text/javascript;base64,${Buffer.from(outputText + `\n// instance ${count++}`).toString('base64')}`);
  return { nav, entries, settle: () => new Promise(resolve => setTimeout(resolve, 5)) };
}

test('作品到人物再返回，恢复作品与原搜索上下文，嵌套动作只增加一条历史', async () => {
  const { nav, entries, settle } = await setup();
  let view = 'search:梵高', work = 0;
  nav.registerNavigation('content', () => { const v = view, w = work; return () => { view = v; work = w; }; });
  nav.initNavigation();
  nav.navigate(() => { view = 'work'; work = 2; scrollY = 0; });
  nav.navigate(() => nav.navigate(() => { view = 'person'; location.href = 'https://atlas.test/#who-van-gogh'; }));
  assert.equal(entries.length, 3);
  history.back(); await settle();
  assert.equal(view, 'work'); assert.equal(work, 2);
  history.back(); await settle();
  assert.equal(view, 'search:梵高'); assert.equal(scrollY, 120);
  history.forward(); await settle();
  assert.equal(view, 'work');
});

test('直接深链接关闭使用页面回退；后退后新分支仍可返回正确来源', async () => {
  const { nav, settle } = await setup();
  let value = 'initial', fallback = false;
  nav.registerNavigation('content', () => { const saved = value; return () => { value = saved; }; });
  nav.initNavigation();
  nav.returnToOrigin(() => { fallback = true; });
  assert.equal(fallback, true);
  nav.navigate(() => { value = 'first'; });
  nav.navigate(() => { value = 'old-branch'; });
  history.back(); await settle();
  nav.navigate(() => { value = 'new-branch'; });
  nav.returnToOrigin(() => assert.fail('应使用站内历史'));
  await settle(); assert.equal(value, 'first');
});
