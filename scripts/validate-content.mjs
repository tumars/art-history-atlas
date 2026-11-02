#!/usr/bin/env node
// 检查 content/ 下的数据：必填字段、id 唯一、引用关系是否成立。CI 和 npm run check 都会运行。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const errors = [];
const err = (m) => errors.push(m);
const need = (obj, keys, where) => keys.forEach((k) => (obj[k] === undefined || obj[k] === "") && err(`${where} 缺少字段 ${k}`));
const isYear = (v) => Number.isFinite(v);

const site = read("content/site.json");
need(site, ["title", "tagline", "axis", "traditions", "defaultTradition"], "site.json");
if (!site.traditions.includes(site.defaultTradition)) err("site.json: defaultTradition 不在 traditions 里");

const contextIds = new Set(readdirSync(join(root, "content/context")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
for (const id of contextIds) {
  const b = read(`content/context/${id}.json`);
  need(b, ["id", "label", "theme", "fields", "items"], `context/${id}.json`);
  if (b.id !== id) err(`context/${id}.json: id 应为 ${id}`);
  if (!["neutral", "cinnabar", "violet"].includes(b.theme)) err(`context/${id}.json: theme 只能是 neutral / cinnabar / violet`);
  b.items.forEach((it, i) => {
    need(it, ["start", "end", "name", "short", "values"], `context/${id}.json items[${i}]`);
    if (!(it.start < it.end)) err(`context/${id}.json items[${i}] ${it.name}: start 应小于 end`);
    if (it.values.length !== b.fields.length) err(`context/${id}.json items[${i}] ${it.name}: values 数量应与 fields 一致（${b.fields.length}）`);
    if (i && it.start < b.items[i - 1].end) err(`context/${id}.json: ${b.items[i - 1].name} 与 ${it.name} 时间重叠`);
  });
}

for (const t of site.traditions) {
  const dir = `content/traditions/${t}`;
  if (!existsSync(join(root, dir))) { err(`缺少目录 ${dir}`); continue; }
  const meta = read(`${dir}/tradition.json`);
  const periods = read(`${dir}/periods.json`);
  const works = read(`${dir}/works.json`);
  const opt = (n) => (existsSync(join(root, `${dir}/${n}.json`)) ? read(`${dir}/${n}.json`) : null);
  const events = opt("events") ?? [];
  const comparisons = opt("comparisons") ?? [];
  const sizes = opt("sizes") ?? [];

  const groupIds = new Set(meta.groups.map((g) => g.id));
  meta.contextBands.forEach((b) => !contextIds.has(b) && err(`${dir}/tradition.json: 背景行 ${b} 不存在`));

  const pids = new Set();
  periods.forEach((p, i) => {
    need(p, ["id", "name", "short", "start", "end", "group", "thesis"], `${dir}/periods.json[${i}]`);
    if (pids.has(p.id)) err(`${dir}/periods.json: 时期 id 重复 ${p.id}`);
    pids.add(p.id);
    if (!groupIds.has(p.group)) err(`${dir}/periods.json ${p.id}: group ${p.group} 未在 tradition.json 定义`);
    if (!(p.start < p.end)) err(`${dir}/periods.json ${p.id}: start 应小于 end`);
  });
  meta.relay.forEach((r) => !pids.has(r.period) && err(`${dir}/tradition.json relay: 时期 ${r.period} 不存在`));

  const wids = new Set();
  works.forEach((w, i) => {
    need(w, ["id", "title", "artist", "yearText", "year", "period", "summary"], `${dir}/works.json[${i}]`);
    if (!/^[a-z0-9-]+$/.test(w.id)) err(`${dir}/works.json ${w.id}: id 只能用小写字母、数字和连字符`);
    if (wids.has(w.id)) err(`${dir}/works.json: 作品 id 重复 ${w.id}`);
    wids.add(w.id);
    if (!pids.has(w.period)) err(`${dir}/works.json ${w.id}: period ${w.period} 不存在`);
    if (!isYear(w.year)) err(`${dir}/works.json ${w.id}: year 应为数字`);
    if (w.copyright && w.image) err(`${dir}/works.json ${w.id}: 标了 copyright 就不要再写 image`);
  });

  events.forEach((e, i) => {
    need(e, ["year", "yearText", "name", "what", "art", "periods"], `${dir}/events.json[${i}]`);
    e.periods.forEach((p) => !pids.has(p) && err(`${dir}/events.json ${e.name}: 时期 ${p} 不存在`));
    if (i && e.year < events[i - 1].year) err(`${dir}/events.json: ${e.name} 应按年份排序`);
  });
  comparisons.forEach((c) => [c.a, c.b].forEach((w) => !wids.has(w) && err(`${dir}/comparisons.json ${c.id}: 作品 ${w} 不存在`)));
  sizes.forEach((s) => !wids.has(s.work) && err(`${dir}/sizes.json: 作品 ${s.work} 不存在`));
}

if (errors.length) {
  console.error(`内容校验失败（${errors.length} 处）：\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log("内容校验通过");
