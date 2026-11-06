// 可复跑的浏览器回归：PLAYWRIGHT_MODULE 指向已安装的 playwright；不纳入纯单元测试。
// BASE_URL 可指向 npm run dev 或 npm run preview。
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.BASE_URL || "http://127.0.0.1:5173/art-history-atlas/";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const back = async (selector) => {
  await page.locator("[data-back]").first().click();
  await page.locator(selector).first().waitFor();
};
const noOverflow = async () =>
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "页面横溢出",
  );
try {
  await page.goto(base);
  await page.locator(".go").waitFor();
  assert.equal(await page.locator(".art").count(), 422);
  assert.ok(
    (await page.locator(".art img[src]").count()) < 100,
    "首屏只加载附近图片",
  );
  // 触摸画海，返回后镜头与选中保持。
  const art = page.locator(".art[aria-pressed=true]");
  const before = await art.getAttribute("style");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 170, y: 350 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 220, y: 410 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const moved = await art.getAttribute("style");
  assert.notEqual(before, moved);
  assert.equal(await page.locator(".sea-page").count(), 1);
  await page.locator(".go").click();
  await page.locator(".author").click();
  await page.locator(".person-hero").waitFor();
  await back(".work-copy");
  await back(".sea-page");
  assert.equal(await art.getAttribute("style"), moved);
  // 筛选层应占一条历史，系统返回关闭它，不离开首页。
  await page.locator("[data-period]").click();
  await page.goBack();
  await page.locator(".sheet").waitFor({ state: "detached" });
  assert.equal(await page.locator(".sea-page").count(), 1);
  await page.locator("[data-period]").click();
  await page.locator("[data-pick-period=modern]").click();
  await page.locator(".sheet").waitFor({ state: "detached" });
  assert.equal(
    await page.locator(".art[aria-pressed=true]:visible").count(),
    1,
  );
  await page.locator("[data-tab=explore]").click();
  await page.locator(".search-field").click();
  await page.locator("#query").fill("van gogh");
  await page.locator("[data-work]").first().click();
  await page.locator('[data-work-step="1"]').click();
  await page.locator("[data-save]").click();
  await page.locator("[data-full]").first().click();
  await page.locator("[data-zoom]").click();
  assert.equal(await page.locator(".full.zoom").count(), 1);
  await back(".work-copy");
  await back("#query");
  assert.equal(await page.locator("#query").inputValue(), "van gogh");
  await page.reload();
  await page.locator("#query").waitFor();
  assert.equal(await page.locator("#query").inputValue(), "van gogh");
  await page.locator("[data-tab=saved]").click();
  assert.equal(await page.locator(".tile").count(), 1);
  await page.reload();
  await page.locator(".tile").waitFor();
  assert.equal(await page.locator(".tile").count(), 1);
  await page.locator(".tile").click();
  await page.locator("[data-save]").click();
  await page.locator("[data-undo]").click();
  assert.equal(
    await page.locator("[data-save]").getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("[data-tab=guide]").click();
  await page.locator('[data-guide-section=stories]').click();
  await page.locator("[data-story]").first().click();
  await page.locator("[data-read]").click();
  await page.locator("[data-choice]").first().click();
  await page.locator("[data-reader-next]").click();
  const step = await page.locator(".step").innerText();
  await back("[data-read]");
  await page.locator("[data-read]").click();
  assert.equal(await page.locator(".step").innerText(), step);
  await page.reload();
  await page.locator(".step").waitFor();
  assert.equal(await page.locator(".step").innerText(), step);
  await back("[data-read]");
  await page.locator("[data-tab=explore]").click();
  await page.locator("[data-tab=explore]").click();
  await page.locator("[data-category=context]").click();
  for (const id of [
    "chronology",
    "relay",
    "schools",
    "pendulum",
    "pairs",
    "sizes",
  ]) {
    await page.locator(`[data-context=${id}]`).click();
    await page.locator(".pad h2").waitFor();
    const select = page.locator("[data-context-value]");
    if (await select.count()) {
      const v = await select.locator("option").last().getAttribute("value");
      await select.selectOption(v);
    }
    await noOverflow();
    await back("[data-context=chronology]");
  }
  const periods = JSON.parse(
    await readFile(
      new URL("../content/traditions/western/periods.json", import.meta.url),
    ),
  );
  for (const id of ["people-life", "people-graph"]) {
    await page.goto(base + "#m/explore/context/" + id);
    if(id==='people-graph') {
      await page.locator('[data-network-locate]').selectOption('van-gogh');
      await page.locator('.network-person [data-person]').click();
      await page.locator('.person-hero').waitFor();
      await back('[data-network-locate]');
      await noOverflow();
      continue;
    }
    await page.locator("svg [data-person]").first().waitFor();
    await page.locator("svg [data-person]").first().focus();
    await page.keyboard.press("Enter");
    await page.locator(".person-hero").waitFor();
    await back("svg [data-person]");
    await noOverflow();
  }
  for (const period of periods) {
    await page.goto(base + "#p-" + period.id);
    await page.locator(".pad h2").waitFor();
    assert.equal(await page.locator(".pad h2").innerText(), period.name);
    await noOverflow();
    if (period.diagram) {
      await page.locator(".source summary").click();
      await page.locator("[data-context]").click();
      await page.locator(".diagram-host").waitFor();
      await noOverflow();
    }
  }
  const readings = JSON.parse(
    await readFile(
      new URL("../content/traditions/western/readings.json", import.meta.url),
    ),
  );
  await page.evaluate(()=>localStorage.removeItem('aha.reading.v1'));
  await page.reload();
  for (const reading of readings) {
    await page.goto(base + "#story-" + reading.id);
    await page.locator("[data-read]").click();
    await page.locator(".step").waitFor();
    for (let step = 0; step < reading.steps.length; step++) {
      assert.match(await page.locator('.step').innerText(),new RegExp('^'+(step+1)+' /'));
      await noOverflow();
      if (step < reading.steps.length - 1)
        await page.locator("[data-reader-next]").click();
    }
  }
  for (const hash of [
    "#who-van-gogh",
    "#m/explore/work/starry-night",
    "#m/explore/work/no-such-work",
  ]) {
    await page.goto(base + hash);
    await page.locator(".screen h2").waitFor();
    await noOverflow();
  }
  assert.match(await page.locator(".screen").innerText(), /没有找到/);
  for (const [width, height] of [
    [320, 667],
    [375, 667],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await page.locator(".go").waitFor();
    await noOverflow();
    assert.equal(await page.locator(".tabbar").isVisible(), true);
    const rect = await page.locator(".go").boundingBox();
    assert.ok(rect.y + rect.height <= height, "看作品入口在首屏内");
  }
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  desktop.on("pageerror", (e) => errors.push(e.message));
  await desktop.goto(base);
  await desktop
    .locator("#hero .sky-art")
    .first()
    .waitFor({ state: "attached" });
  assert.equal(await desktop.locator("#mobile-app").count(), 0);
  await desktop.goto(base + "#m/explore/work/starry-night");
  await desktop.locator("dialog[open]").waitFor();
  const blocked = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("storage blocked");
    };
  });
  const bp = await blocked.newPage();
  bp.on("pageerror", (e) => errors.push(e.message));
  await bp.goto(base);
  await bp.locator("[data-save]").click();
  assert.match(await bp.locator(".toast").innerText(), /仅在本次会话/);
  await bp.locator("[data-tab=saved]").click();
  assert.equal(await bp.locator(".tile").count(), 1);
  await blocked.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 422 件画海、触摸/返回、筛选历史、搜索与收藏、阅读续看、6 项脉络、18 厅/17 图解、9 篇导览、深链、4 种手机尺寸及桌面回归。",
  );
} finally {
  await browser.close();
}
