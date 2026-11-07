import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/places.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { indexPlaces } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const data = JSON.parse(readFileSync(new URL("../content/places.json", import.meta.url), "utf8"));
const works = JSON.parse(readFileSync(new URL("../content/traditions/western/works.json", import.meta.url), "utf8"));
const ix = indexPlaces(data, works);

test("每件作品都归到地点或写明原因", () => {
  assert.deepEqual(ix.unknown.map(w => w.id), []);
  const placed = ix.placesOf.size, unplaced = [...ix.unplaced.values()].flat().length;
  assert.equal(placed + unplaced, works.length);
});

test("直接指定的作品优先于收藏文字，同一写法可以分属两馆", () => {
  assert.deepEqual(ix.placesOf.get("constable-flatford-mill").map(p => p.id), ["tate-britain"]);
  assert.deepEqual(ix.placesOf.get("matisse-the-snail").map(p => p.id), ["tate-modern"]);
  const elgin = works.find(w => w.location.includes("大英博物馆、雅典卫城博物馆"));
  assert.deepEqual(ix.placesOf.get(elgin.id).map(p => p.id).sort(), ["acropolis-museum", "british-museum"]);
});

test("不同写法归到同一地点，城市内按作品数排序", () => {
  assert.equal(ix.worksAt.get("scrovegni").length, 2);
  assert.equal(ix.worksAt.get("louvre").length, 40);
  const paris = ix.placesIn.get("paris");
  assert.equal(paris[0].id, "louvre");
  assert.ok(paris.every((p, i) => !i || ix.worksAt.get(paris[i - 1].id).length >= ix.worksAt.get(p.id).length));
});
