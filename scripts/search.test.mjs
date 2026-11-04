import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/search.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { searchCatalog } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const read = name => JSON.parse(readFileSync(new URL(`../content/traditions/western/${name}.json`, import.meta.url), "utf8"));
const catalog = { works: read("works"), people: read("people").people };

test("作品名精确匹配优先，空白与未知名称返回空结果", () => {
  const work = catalog.works[0];
  assert.equal(searchCatalog(catalog, work.title)[0].id, work.id);
  assert.deepEqual(searchCatalog(catalog, "  "), []);
  assert.deepEqual(searchCatalog(catalog, "不存在的作品xyz"), []);
});

test("英文姓名不区分大小写和重音，也能找到对应作者的作品", () => {
  const person = catalog.people.find(p => p.en.includes("Monet"));
  assert(person);
  assert(searchCatalog(catalog, "MÓNÉT", "person").some(r => r.id === person.id));
  const works = searchCatalog(catalog, "monet", "work");
  assert(works.length > 0);
  assert(works.every(r => r.kind === "work"));
  assert(catalog.works.filter(w => w.by?.includes(person.id)).every(w => works.some(r => r.id === w.id)));
});

test("作者和作品名可组合检索，无图作品仍能找到", () => {
  const work = catalog.works.find(w => w.by?.length);
  assert(searchCatalog(catalog, `${work.artist} ${work.title}`, "work").some(r => r.id === work.id));
  const missing = catalog.works.find(w => w.noImageReason);
  assert(missing);
  assert(searchCatalog(catalog, missing.title).some(r => r.id === missing.id));
  const person = catalog.people.find(p => p.name.includes("·"));
  assert(person);
  assert(searchCatalog(catalog, person.name.replaceAll("·", ""), "person").some(r => r.id === person.id));
});
