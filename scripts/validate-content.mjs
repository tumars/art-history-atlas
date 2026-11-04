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
const sources = (list, where) => (list ?? []).forEach((s) => {
  if (!s.label || !/^https:\/\//.test(s.url)) err(`${where}: 资料需有名称与 HTTPS 链接`);
  if (/^https:\/\/[^/]*wikipedia\.org\//.test(s.url) && !s.url.startsWith("https://zh.wikipedia.org/")) err(`${where}: 百科资料应使用中文维基百科`);
});
const credits = read("public/images/credits.json");

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
  meta.relay.forEach((r, i) => {
    const where = `${dir}/tradition.json relay[${i}]`;
    need(r, ["period", "place", "era", "note", "points"], where);
    if (!pids.has(r.period)) err(`${where}: 时期 ${r.period} 不存在`);
    if (!Array.isArray(r.points) || !r.points.length) err(`${where}: 缺少地图站点`);
    else r.points.forEach(p => {
      if (!p.name || !Number.isFinite(p.lon) || !Number.isFinite(p.lat) || Math.abs(p.lon) > 180 || Math.abs(p.lat) > 90) err(`${where}: 地图地点或经纬度无效`);
    });
  });

  const wids = new Set();
  works.forEach((w, i) => {
    need(w, ["id", "title", "artist", "yearText", "year", "period", "summary"], `${dir}/works.json[${i}]`);
    if (!/^[a-z0-9-]+$/.test(w.id)) err(`${dir}/works.json ${w.id}: id 只能用小写字母、数字和连字符`);
    if (wids.has(w.id)) err(`${dir}/works.json: 作品 id 重复 ${w.id}`);
    wids.add(w.id);
    if (!pids.has(w.period)) err(`${dir}/works.json ${w.id}: period ${w.period} 不存在`);
    if (!isYear(w.year)) err(`${dir}/works.json ${w.id}: year 应为数字`);
    if (!w.image && !w.copyright && !w.noImageReason) err(`${dir}/works.json ${w.id}: 缺图片或缺图说明`);
    if (w.image) {
      if ([w.image.commons, w.image.wikipedia, w.image.url].filter(Boolean).length !== 1) err(`${dir}/works.json ${w.id}: 图片应指定唯一来源`);
      if (w.image.url) {
        need(w.image, ["source", "author", "license"], `图片来源 ${w.id}`);
        for (const url of [w.image.url, w.image.thumb, w.image.source].filter(Boolean)) if (!/^https:\/\//.test(url)) err(`图片 ${w.id}: 应使用 HTTPS 来源`);
      }
      const c = credits[w.id];
      if (!c) err(`${dir}/works.json ${w.id}: 缺图片署名，请运行取图脚本`);
      else {
        need(c, ["file", "thumb", "author", "license", "source"], `图片 ${w.id}`);
        for (const path of [c.file, c.thumb]) if (!path || !existsSync(join(root, "public", path))) err(`图片 ${w.id}: 文件不存在 ${path}`);
      }
    }
    if (w.source && !/^https:\/\//.test(w.source)) err(`${dir}/works.json ${w.id}: source 应为 HTTPS 资料链接`);
    if (w.source && /^https:\/\/[^/]*wikipedia\.org\//.test(w.source) && !w.source.startsWith("https://zh.wikipedia.org/")) err(`${dir}/works.json ${w.id}: 百科资料应链接中文维基百科`);
    sources(w.sources, `作品 ${w.id}`);
  });

  events.forEach((e, i) => {
    need(e, ["year", "yearText", "name", "what", "art", "periods"], `${dir}/events.json[${i}]`);
    e.periods.forEach((p) => !pids.has(p) && err(`${dir}/events.json ${e.name}: 时期 ${p} 不存在`));
    if (i && e.year < events[i - 1].year) err(`${dir}/events.json: ${e.name} 应按年份排序`);
  });
  comparisons.forEach((c) => [c.a, c.b].forEach((w) => !wids.has(w) && err(`${dir}/comparisons.json ${c.id}: 作品 ${w} 不存在`)));
  sizes.forEach((s) => !wids.has(s.work) && err(`${dir}/sizes.json: 作品 ${s.work} 不存在`));

  periods.forEach(p => {
    if (!p.diagram) return;
    const at = `${dir}/periods.json ${p.id} 图解`;
    need(p.diagram, ["id", "title", "observe", "caption", "works"], at);
    if (!p.diagram.works?.length) err(`${at}: 需要可核对的作品入口`);
    (p.diagram.works ?? []).forEach(w => {
      if (!wids.has(w.work) || !w.label) err(`${at}: 作品引用或观察说明无效`);
    });
    sources(p.diagram.sources, at);
  });

  // 人物与相遇
  const pp = opt("people") ?? { people: [], encounters: [] };
  const hids = new Set();
  pp.people.forEach((p, i) => {
    need(p, ["id", "name", "en", "born", "died", "roles", "period", "line", "wiki"], `${dir}/people.json people[${i}]`);
    if (!/^[a-z0-9-]+$/.test(p.id)) err(`${dir}/people.json ${p.id}: id 只能用小写字母、数字和连字符`);
    if (hids.has(p.id)) err(`${dir}/people.json: 人物 id 重复 ${p.id}`);
    hids.add(p.id);
    if (!pids.has(p.period)) err(`${dir}/people.json ${p.id}: period ${p.period} 不存在`);
    if (!(isYear(p.born) && isYear(p.died) && p.born < p.died)) err(`${dir}/people.json ${p.id}: 生卒年有误`);
    (p.life ?? []).forEach((l, k, a) => {
      if (!isYear(l.year) || !l.text) err(`${dir}/people.json ${p.id}: 生平第 ${k + 1} 条缺年份或内容`);
      if (k && l.year < a[k - 1].year) err(`${dir}/people.json ${p.id}: 生平应按年份排序（${l.year}）`);
    });
    (p.works ?? []).forEach((x) => {
      if (!x.title || !x.year || !x.work) err(`${dir}/people.json ${p.id}: 作品缺名称、年代或完整作品引用`);
      if (x.work && !wids.has(x.work)) err(`${dir}/people.json ${p.id}: 作品 ${x.work} 不在 works.json`);
    });
    if (p.quote && (!p.quote.text || !p.quote.by)) err(`${dir}/people.json ${p.id}: 名言缺内容或出处人`);
    sources(p.sources, `人物 ${p.id}`);
  });
  pp.people.forEach((p) => Object.entries(p.rel ?? {}).forEach(([k, v]) => v.forEach((x) => !hids.has(x) && err(`${dir}/people.json ${p.id}: ${k} 里的 ${x} 不存在`))));
  const schools = opt("schools") ?? [], schoolIds = new Set(), classified = new Set();
  schools.forEach((s, i) => {
    const where = `${dir}/schools.json[${i}]`;
    need(s, ["id", "name", "en", "group", "span", "summary", "members"], where);
    if (schoolIds.has(s.id)) err(`${where}: 派系 id 重复 ${s.id}`);
    schoolIds.add(s.id);
    if (!groupIds.has(s.group)) err(`${where}: 大阶段 ${s.group} 不存在`);
    const ids = [...s.members, ...(s.related ?? []).map(r => r.person)];
    if (!ids.length) err(`${where}: 没有收录人物`);
    if (new Set(ids).size !== ids.length) err(`${where}: 同一人物重复列出`);
    ids.forEach(id => { if (!hids.has(id)) err(`${where}: 人物 ${id} 不存在`); classified.add(id); });
    (s.related ?? []).forEach(r => !r.role && err(`${where}: ${r.person} 缺少关联身份`));
    s.members.forEach(id => {
      const person = pp.people.find(p => p.id === id);
      if (person && !person.roles.some(r => ["画家", "雕塑家", "建筑师", "版画家", "艺术家", "工程师"].includes(r))) err(`${where}: ${id} 应注明赞助等关联身份，而非列为创作成员`);
    });
  });
  pp.people.forEach(p => !classified.has(p.id) && err(`${dir}/schools.json: 人物 ${p.id} 尚未分类`));
  pp.encounters.forEach((e, i) => {
    need(e, ["year", "place", "people", "title", "text"], `${dir}/people.json encounters[${i}]`);
    e.people.forEach((x) => !hids.has(x) && err(`${dir}/people.json 相遇 ${e.title}: 人物 ${x} 不存在`));
    const out = e.people.filter((x) => { const p = pp.people.find((q) => q.id === x); return p && (e.year < p.born || e.year > p.died); });
    if (out.length) err(`${dir}/people.json 相遇 ${e.title}: ${out.join("、")} 当年不在世`);
    sources(e.sources, `相遇 ${e.title}`);
  });
  works.forEach((w) => (w.by ?? []).forEach((x) => !hids.has(x) && err(`${dir}/works.json ${w.id}: 作者 ${x} 不在 people.json`)));

  // 阅读路径要能回到实际作品，关系故事不能凭主题相似添加历史连线。
  const readingIds = new Set();
  (opt("readings") ?? []).forEach(r => {
    const where = `${dir}/readings.json ${r.id}`;
    need(r, ["id", "kind", "title", "deck", "minutes", "periods", "people", "steps", "next", "sources"], where);
    if (!/^[a-z0-9-]+$/.test(r.id) || readingIds.has(r.id)) err(`${where}: id 无效或重复`);
    readingIds.add(r.id);
    if (!["story", "route"].includes(r.kind) || !(r.minutes > 0)) err(`${where}: 阅读类型或时长无效`);
    if (!r.steps?.length || !r.next?.length || !r.sources?.length || !r.periods?.length) err(`${where}: 缺阅读步骤、下一站、资料或展厅`);
    (r.periods ?? []).forEach(id => !pids.has(id) && err(`${where}: 展厅 ${id} 不存在`));
    (r.people ?? []).forEach(id => !hids.has(id) && err(`${where}: 人物 ${id} 不存在`));
    sources(r.sources, where);
    (r.steps ?? []).forEach((s, i) => {
      const at = `${where} 第 ${i + 1} 步`;
      need(s, ["title", "prompt", "works", "context"], at);
      if (!s.works?.length || s.works.length > 2) err(`${at}: 每步应有1–2件作品`);
      (s.works ?? []).forEach(id => {
        if (!wids.has(id)) err(`${at}: 作品 ${id} 不存在`);
        else if (!credits[id]) err(`${at}: 观察任务的作品 ${id} 需要配图`);
      });
      (s.details ?? []).forEach(d => {
        if (!s.works?.includes(d.work) || !d.label || !d.note) err(`${at}: 局部缺说明或不属于当前作品`);
        if (![d.x, d.y].every(v => Number.isFinite(v) && v >= 0 && v <= 100)) err(`${at}: 局部坐标应在0–100之间`);
      });
      (s.choices ?? []).forEach(c => (!c.label || !c.response) && err(`${at}: 观察选项缺反馈`));
    });
    (r.next ?? []).forEach(n => (!wids.has(n.work) || !n.label) && err(`${where}: 下一站无效`));
    (r.relations ?? []).forEach(pair => {
      const [a, b] = pair;
      if (pair.length !== 2 || a === b || !pair.every(id => r.people?.includes(id))) err(`${where}: 关系应属于本篇的两位不同人物`);
      const linked = pp.people.some(p => (p.id === a || p.id === b) && Object.values(p.rel ?? {}).some(ids => ids.includes(p.id === a ? b : a)))
        || pp.encounters.some(e => e.people.includes(a) && e.people.includes(b));
      if (!linked) err(`${where}: ${a} 与 ${b} 没有收录的历史关系`);
    });
  });
}

if (errors.length) {
  console.error(`内容校验失败（${errors.length} 处）：\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log("内容校验通过");
