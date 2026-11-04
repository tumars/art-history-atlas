import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/sections/hero-space.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { arrangeWorks, skyLoop, projectWork, focusCamera, focalLength, DEFAULT_DISTANCE, MIN_DISTANCE, MAX_DISTANCE } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const works = JSON.parse(readFileSync(new URL("../content/traditions/western/works.json", import.meta.url), "utf8"));
const credits = JSON.parse(readFileSync(new URL("../public/images/credits.json", import.meta.url), "utf8"));
const illustrated = works.filter((w) => credits[w.id]);
const space = arrangeWorks(illustrated);
const desktop = { width: 1440, height: 700 };

test("全部有图作品都有独立位置，画海超出一屏且布局稳定", () => {
  assert.equal(space.length, illustrated.length);
  assert.equal(new Set(space.map((p) => `${p.x},${p.y}`)).size, illustrated.length);
  assert(Math.max(...space.map((p) => p.x)) - Math.min(...space.map((p) => p.x)) > desktop.width * 4);
  assert(Math.max(...space.map((p) => p.y)) - Math.min(...space.map((p) => p.y)) > desktop.height * 4);
  assert.deepEqual(arrangeWorks(illustrated), space);
  assert.deepEqual(arrangeWorks([]), []);
});

test("同样拖动距离下，近景比远景移动更多", () => {
  const near = { ...space[0], x: 0, y: 0, depth: 380 };
  const far = { ...near, depth: 1120 };
  const start = { x: 0, y: 0, distance: DEFAULT_DISTANCE };
  const end = { ...start, x: 160 };
  const displacement = (p) => Math.abs(projectWork(p, end, desktop).x - projectWork(p, start, desktop).x);
  assert(displacement(near) > displacement(far) * 1.5);
});

test("拉近视距会放大并照亮图片，拉远产生相反变化", () => {
  const item = { ...space[0], x: 0, y: 0 };
  const near = projectWork(item, { x: 0, y: 0, distance: MIN_DISTANCE }, desktop);
  const far = projectWork(item, { x: 0, y: 0, distance: MAX_DISTANCE }, desktop);
  assert(near.scale > far.scale);
  assert(near.light > far.light);
  assert(near.opacity > far.opacity);
});

test("桌面和手机都能定位到世界中的任意作品", () => {
  for (const view of [desktop, { width: 390, height: 335 }]) {
    for (const item of space) {
      const camera = focusCamera(item, DEFAULT_DISTANCE, view);
      const p = projectWork(item, camera, view);
      assert(Math.abs(p.x - view.width * .68) < 1e-8);
      assert(Math.abs(p.y - view.height * .54) < 1e-8);
      assert(p.scale > 0 && Number.isFinite(p.scale));
    }
  }
});

test("图片靠近视野中心时尺寸略增，形成连续的接近感", () => {
  const camera = { x: 0, y: 0, distance: DEFAULT_DISTANCE };
  const middle = projectWork({ ...space[0], x: 0, y: 0 }, camera, desktop);
  const edge = projectWork({ ...space[0], x: 800, y: 0 }, camera, desktop);
  assert(middle.scale > edge.scale);
});

test("横纵拖动任意整圈后，同一批作品的投影完全续上", () => {
  const loop = skyLoop(space.length);
  for (const view of [desktop, { width: 390, height: 335 }]) {
    for (const distance of [MIN_DISTANCE, DEFAULT_DISTANCE, MAX_DISTANCE]) {
      for (const item of space) {
        const camera = { x: 130, y: -240, distance };
        const before = projectWork(item, camera, view, loop);
        const after = projectWork(item, { ...camera, x: camera.x + loop.width * 11, y: camera.y - loop.height * 7 }, view, loop);
        for (const key of ["x", "y", "scale", "light", "opacity"]) assert(Math.abs(before[key] - after[key]) < 1e-7);
      }
    }
  }
});

test("镜头经过横纵接缝时，可见图片连续移动，没有回跳", () => {
  const loop = skyLoop(space.length), delta = .2;
  const visible = p => p.x > -150 && p.x < desktop.width + 150 && p.y > -150 && p.y < desktop.height + 150;
  for (const axis of ["x", "y"]) {
    for (const sign of [-1, 1]) {
      const camera = { x: 0, y: 0, distance: MAX_DISTANCE };
      camera[axis] = sign * loop[axis === "x" ? "width" : "height"] / 2 - delta / 2;
      let checked = 0;
      for (const item of space) {
        const before = projectWork(item, camera, desktop, loop);
        const after = projectWork(item, { ...camera, [axis]: camera[axis] + delta }, desktop, loop);
        if (!visible(before) && !visible(after)) continue;
        checked++;
        const expected = -delta * focalLength(desktop) / (item.depth + camera.distance);
        assert(Math.abs(after[axis] - before[axis] - expected) < 1e-7);
      }
      assert(checked > 0);
    }
  }
});

test("绕行多圈后定位任意作品都走最近的一圈，并落在焦点处", () => {
  const loop = skyLoop(space.length);
  for (const view of [desktop, { width: 390, height: 335 }]) {
    const from = { x: loop.width * 8 + 17, y: -loop.height * 9 - 23, distance: DEFAULT_DISTANCE };
    for (const item of space) {
      const camera = focusCamera(item, from.distance, view, loop, from);
      assert(Math.abs(camera.x - from.x) <= loop.width / 2);
      assert(Math.abs(camera.y - from.y) <= loop.height / 2);
      const p = projectWork(item, camera, view, loop);
      assert(Math.abs(p.x - view.width * .68) < 1e-7);
      assert(Math.abs(p.y - view.height * .54) < 1e-7);
    }
  }
});

test("每行作品数均匀，首尾接缝不会留出半排空洞", () => {
  const loop = skyLoop(space.length);
  const rows = Array.from({ length: loop.rows }, () => []);
  space.forEach((item, i) => rows[Math.floor(i * loop.rows / space.length)].push(item.x));
  assert(Math.max(...rows.map(r => r.length)) - Math.min(...rows.map(r => r.length)) <= 1);
  rows.forEach(row => {
    row.sort((a, b) => a - b);
    for (let i = 0; i < row.length; i++) {
      const gap = i ? row[i] - row[i - 1] : row[0] + loop.width - row.at(-1);
      assert(gap > 0 && gap < 600);
    }
  });
});
