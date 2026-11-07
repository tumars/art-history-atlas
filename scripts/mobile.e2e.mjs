// 可复跑的手机版浏览器回归：PLAYWRIGHT_MODULE 指向已安装的 playwright；不纳入纯单元测试。
// BASE_URL 可指向 npm run dev 或 npm run preview。覆盖 tab、导航栈、浏览器返回、sheet / 全图的历史项、深链接与横向溢出。
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:5173/art-history-atlas/";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const top = () => page.evaluate(() => {
  const st = [...document.querySelectorAll(".stack")].find((s) => !s.hidden);
  const r = [...st.children].at(-1).route;
  return { tab: st.dataset.stack, kind: r.kind, id: r.id || "" };
});
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "页面横向溢出");
try {
  await page.goto(base);
  await page.locator(".sea-art.on").waitFor();
  assert.ok((await page.locator(".sea-art").count()) > 60, "画海有作品");
  await noOverflow();

  // 四个 tab 与搜索
  for (const t of ["guide", "people", "saved"]) {
    await page.locator(`.tabbar [data-act="tab"][data-v="${t}"]`).click();
    assert.equal((await top()).kind, t);
    await noOverflow();
  }
  await page.locator(".tabbar .srch").click();
  await page.locator("#q").fill("van gogh");
  assert.ok((await page.locator(".results .lrow").count()) > 0, "搜索有结果");

  // 导览：年表时光带默认停在 1504，展厅 → 作品 → 全图，浏览器返回逐层关闭
  await page.locator('.tabbar [data-v="guide"]').click();
  assert.equal(await page.locator(".cb .tb-year").textContent(), "1504");
  await page.locator('[data-act="seg"][data-v="hall"]').click();
  await page.locator('[data-act="hall"][data-v="high-ren"]').click();
  await page.locator(".tile").first().click();
  assert.equal((await top()).kind, "work");
  await page.locator('.acts [data-act="full"]').click();
  await page.locator(".viewer").waitFor();
  await page.goBack();
  await page.locator(".viewer").waitFor({ state: "detached" });
  assert.equal((await top()).kind, "work", "返回先关全图");
  await page.goBack();
  assert.equal((await top()).kind, "hall");
  // sheet 占一条历史
  await page.locator('[data-act="era"]').click();
  await page.locator(".sheet-layer").waitFor();
  await page.goBack();
  await page.locator(".sheet-layer").waitFor({ state: "detached" });
  assert.equal((await top()).kind, "hall", "返回先关 sheet");
  await page.locator('.nav [data-act="back"]').click();
  assert.equal((await top()).kind, "guide");

  // 人物：时光、关系、名录
  await page.locator('.tabbar [data-v="people"]').click();
  for (const s of ["chain", "all", "time"]) {
    await page.locator(`[data-act="seg"][data-v="${s}"]`).click();
    await noOverflow();
  }

  // 深链接：新旧格式与无效内容
  for (const [hash, want] of [["#who-michelangelo", "person"], ["#p-baroque", "hall"], ["#m/explore/person/rembrandt", "person"], ["#m/explore/context/schools", "context"], ["#pendulum", "context"], ["#m/sea/work/nope", "missing"]]) {
    await page.goto(base + hash);
    await page.waitForFunction(() => document.querySelector(".stack:not([hidden])"));
    assert.equal((await top()).kind, want, hash);
    await noOverflow();
  }
  await page.goto(base + "#m/sea/viewer/mona-lisa");
  await page.locator(".viewer").waitFor();

  assert.deepEqual(errors, []);
  console.log("手机版回归通过");
} finally {
  await browser.close();
}
