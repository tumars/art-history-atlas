import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.BASE_URL || "http://127.0.0.1:4173/art-history-atlas/";
try {
  await page.goto(base);
  await page.locator(".art[aria-pressed=true]").waitFor();
  await page.evaluate(() => {
    window.seaNode = document.querySelector(".sea-world");
    window.firstArt = document.querySelector(".art[aria-pressed=true]");
  });
  const identity = () =>
    page.evaluate(
      () =>
        window.seaNode === document.querySelector(".sea-world") &&
        window.firstArt.isConnected,
    );
  const transform = () => page.evaluate(() => window.firstArt.style.transform);
  const initial = await transform();
  await page.locator("[data-sea-next]").click();
  assert.equal(await identity(), true);
  await page.waitForTimeout(100);
  const intermediate = await transform();
  assert.notEqual(intermediate, initial);
  await page.waitForTimeout(900);
  assert.notEqual(await transform(), intermediate);
  // 一次真实点击只选中，不重建或移动相机。
  const pick = await page.evaluate(
    () =>
      [...document.querySelectorAll(".art:not([hidden])")].find((n) => {
        const r = n.getBoundingClientRect(),
          x = r.x + r.width / 2,
          y = r.y + r.height / 2;
        return (
          n.getAttribute("aria-pressed") === "false" &&
          x > 30 &&
          x < 360 &&
          y > 200 &&
          y < 600 &&
          document.elementFromPoint(x, y)?.closest(".art") === n
        );
      })?.dataset.select,
  );
  assert.ok(pick);
  const beforePick = await transform();
  await page.locator(`[data-select="${pick}"]`).click();
  assert.equal(await identity(), true);
  assert.equal(await transform(), beforePick);
  assert.equal(
    await page.locator(`[data-select="${pick}"]`).getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("[data-pause]").click();
  assert.equal(await identity(), true);
  await page.locator("[data-pause]").click();
  const cdp = await context.newCDPSession(page);
  const touch = async (type, points) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
  await touch("touchStart", [{ x: 160, y: 340 }]);
  for (let i = 1; i <= 5; i++) {
    await page.waitForTimeout(18);
    await touch("touchMove", [{ x: 160 + i * 10, y: 340 + i * 8 }]);
  }
  await touch("touchEnd", []);
  await page.waitForTimeout(40);
  const coasting = await transform();
  await page.waitForTimeout(100);
  assert.notEqual(await transform(), coasting, "松手有惯性");
  assert.equal(await page.locator(".sea-page").count(), 1, "拖动不误开详情");
  await touch("touchStart", [{ x: 160, y: 340 }]);
  await page.waitForTimeout(40);
  const stopped = await transform();
  await page.waitForTimeout(100);
  assert.equal(await transform(), stopped, "按住立即停止惯性");
  await page.waitForTimeout(120);
  await touch("touchEnd", []);
  // 长按后松手不沿用陈旧速度。
  await touch("touchStart", [{ x: 150, y: 340 }]);
  await touch("touchMove", [{ x: 180, y: 365 }]);
  await page.waitForTimeout(150);
  const held = await transform();
  await touch("touchEnd", []);
  await page.waitForTimeout(160);
  assert.equal(await transform(), held);
  await page.locator("[data-sea-locate]").click();
  await page.waitForTimeout(900);
  const beforeZoom = await transform();
  await page.locator('[data-sea-zoom="-1"]').click();
  await page.waitForTimeout(900);
  assert.notEqual(await transform(), beforeZoom);
  assert.equal(await identity(), true);
  // 多指交给浏览器，不继续单指拖动或误点作品。
  await touch("touchStart", [{ x: 140, y: 330 }]);
  await touch("touchStart", [
    { x: 140, y: 330 },
    { x: 240, y: 430 },
  ]);
  await touch("touchCancel", []);
  await page.waitForTimeout(80);
  assert.equal(await page.locator(".sea-page").count(), 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-sea-next]").click();
  const reduced = await transform();
  await page.waitForTimeout(150);
  assert.equal(await transform(), reduced);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "docs/screenshots/mobile-sea-motion.png" });
  console.log(
    "PASS: DOM 保持、平滑定位、原位选中、暂停、惯性、按住制动、停顿释放、多指取消、视距、减少动态。",
  );
} finally {
  await browser.close();
}
