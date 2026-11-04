#!/usr/bin/env node
/**
 * 从 Commons、维基百科文件页或馆藏网站下载作品图片，并保留来源署名。
 *
 *   node scripts/fetch-images.mjs            # 下载缺少的图片
 *   node scripts/fetch-images.mjs --force    # 全部重新下载
 *   node scripts/fetch-images.mjs --only mona-lisa,starry-night
 *
 * 读取 content/traditions/*\/works.json 的 image.commons / image.wikipedia（文件名）或 image.url，
 * 输出：
 *   public/images/works/<id>.<ext>        大图（宽 1280）
 *   public/images/works/<id>.thumb.<ext>  缩略图（宽 320）
 *   public/images/people/<id>.<ext>       人物肖像（宽 480，经维基数据 P18 取得），另有宽 120 的 .thumb
 *   public/images/credits.json            页面读取的署名清单（人物的键为 person:<id>）
 *   CREDITS.md                            人看的署名清单
 * 作品不按授权标签筛除；逐张记录来源页原有的授权或权利说明，不把非自由图片标成自由授权。
 * 需要 Node 18+（内置 fetch）。
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/images/works");
const CREDITS = join(root, "public/images/credits.json");
const API = "https://commons.wikimedia.org/w/api.php";
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const UA = "ArtHistoryAtlas/0.1 (https://github.com/tumars/art-history-atlas; image fetch script)";
const FULL = 1280, THUMB = 320;

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only"));
const only = onlyArg ? new Set((onlyArg.split("=")[1] ?? args[args.indexOf(onlyArg) + 1] ?? "").split(",").filter(Boolean)) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const okLicense = (short = "", lic = "") => /^(public domain|cc0)(?:\s|$)/i.test(short) || /^cc[ -]by(?:[ -]sa)?[ -]\d(?:\.\d)?$/i.test(short) || /^(pd(?:-[a-z0-9-]+)?|cc0|cc-by(?:-sa)?-\d(?:\.\d)?)$/i.test(lic);

// 收集所有体系的作品
const works = [];
for (const t of readdirSync(join(root, "content/traditions"))) {
  const p = join(root, "content/traditions", t, "works.json");
  if (!existsSync(p)) continue;
  for (const w of JSON.parse(readFileSync(p, "utf8"))) works.push({ ...w, tradition: t });
}

// 收集人物（people.json 的 wiki 字段是英文维基百科条目名）
const people = [];
for (const t of readdirSync(join(root, "content/traditions"))) {
  const p = join(root, "content/traditions", t, "people.json");
  if (!existsSync(p)) continue;
  for (const x of JSON.parse(readFileSync(p, "utf8")).people ?? []) people.push(x);
}
const PORTRAIT = 480;

const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, "utf8")) : {};
const todo = works.filter((w) => w.image && (!only || only.has(w.id)) && (force || !credits[w.id]));
console.log(`共 ${works.length} 件作品，本次需要处理 ${todo.length} 件`);
mkdirSync(OUT, { recursive: true });

async function api(params, endpoint = API) {
  const url = endpoint + "?" + new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params });
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.ok) return r.json();
    await sleep(1500 * (i + 1));
  }
  throw new Error("图片 API 请求失败：" + url);
}

/** 一次查询最多 50 个文件，返回 规范化标题 → imageinfo */
async function lookup(files, width, endpoint = API) {
  const res = {};
  for (let i = 0; i < files.length; i += 40) {
    const batch = files.slice(i, i + 40);
    const j = await api({
      action: "query", redirects: "1", prop: "imageinfo",
      iiprop: "url|extmetadata|mime", iiurlwidth: String(width),
      titles: batch.map((f) => "File:" + f.replace(/_/g, " ")).join("|"),
    }, endpoint);
    const alias = {};
    for (const n of j.query?.normalized ?? []) alias[n.to] = n.from;
    for (const n of j.query?.redirects ?? []) alias[n.to] = alias[n.from] ?? n.from;
    for (const p of j.query?.pages ?? []) {
      const asked = alias[p.title] ?? p.title;
      // 维基百科共用 Commons 图片时，本地文件页可标 missing，但 imageinfo 仍然有效。
      res[asked] = p.imageinfo?.[0] ?? null;
    }
    await sleep(300);
  }
  return res;
}

async function download(url, path) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.ok) {
      if (!r.headers.get("content-type")?.startsWith("image/")) throw new Error("来源未返回图片：" + url);
      writeFileSync(path, Buffer.from(await r.arrayBuffer())); return;
    }
    await sleep(2000 * (i + 1));
  }
  throw new Error("下载失败：" + url);
}

const titleOf = (f) => "File:" + f.replace(/_/g, " ");
const files = todo.filter(w => w.image.commons).map((w) => w.image.commons);
const full = await lookup(files, FULL);
const thumb = await lookup(files, THUMB);
const wikiFiles = todo.filter(w => w.image.wikipedia).map(w => w.image.wikipedia);
const wikiFull = await lookup(wikiFiles, FULL, WIKI_API);
const wikiThumb = await lookup(wikiFiles, THUMB, WIKI_API);

const failed = [];
for (const w of todo) {
  const name = w.image.commons ?? w.image.wikipedia;
  const key = name && titleOf(name);
  const info = w.image.url ? {
    url: w.image.url, thumburl: w.image.url, mime: /\.png(?:\?|$)/i.test(w.image.url) ? "image/png" : "image/jpeg",
    descriptionurl: w.image.source,
    extmetadata: { Artist: { value: w.image.author }, LicenseShortName: { value: w.image.license } },
  } : (w.image.wikipedia ? wikiFull[key] : full[key]);
  const tinfo = w.image.url ? { thumburl: w.image.thumb ?? w.image.url } : (w.image.wikipedia ? wikiThumb[key] : thumb[key]);
  if (!info) { failed.push(`${w.id}：来源上找不到 ${name}`); continue; }
  const m = info.extmetadata ?? {};
  const short = m.LicenseShortName?.value ?? "", lic = m.License?.value ?? "";
  const ext = (info.mime === "image/png" ? "png" : "jpg");
  const file = `images/works/${w.id}.${ext}`, tfile = `images/works/${w.id}.thumb.${ext}`;
  try {
    const fullUrl = info.thumburl ?? info.url, thumbUrl = tinfo?.thumburl ?? fullUrl;
    await download(fullUrl, join(root, "public", file));
    await sleep(200);
    if (thumbUrl === fullUrl) copyFileSync(join(root, "public", file), join(root, "public", tfile));
    else await download(thumbUrl, join(root, "public", tfile));
    await sleep(200);
  } catch (e) { failed.push(`${w.id}：${e.message}`); continue; }
  credits[w.id] = {
    file, thumb: tfile, title: w.title,
    author: stripHtml(m.Artist?.value).slice(0, 160) || w.artist,
    license: short || lic || "来源页未注明授权",
    licenseUrl: m.LicenseUrl?.value || undefined,
    source: info.descriptionurl,
  };
  console.log(`✓ ${w.id}  ${short}`);
}

// ---------- 人物肖像 ----------
const ptodo = people.filter((p) => p.wiki && p.portrait !== false && (!only || only.has(p.id)) && (force || !credits["person:" + p.id]));
console.log(`\n人物 ${people.length} 位，本次需要取肖像 ${ptodo.length} 位`);
if (ptodo.length) {
  mkdirSync(join(root, "public/images/people"), { recursive: true });
  // 英文条目名 → 维基数据 P18（图像）
  const p18 = {};
  for (let i = 0; i < ptodo.length; i += 40) {
    const batch = ptodo.slice(i, i + 40);
    const url = "https://www.wikidata.org/w/api.php?" + new URLSearchParams({
      action: "wbgetentities", sites: "enwiki", titles: batch.map((p) => p.wiki).join("|"),
      props: "claims|sitelinks", sitefilter: "enwiki", format: "json", origin: "*", redirects: "yes",
    });
    let j = null;
    for (let k = 0; k < 4 && !j; k++) {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) j = await r.json(); else await sleep(1500 * (k + 1));
    }
    for (const e of Object.values(j?.entities ?? {})) {
      const title = e.sitelinks?.enwiki?.title;
      const file = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (title && file) p18[title.replace(/ /g, "_")] = file;
    }
    await sleep(300);
  }
  const want = ptodo.map((p) => ({ p, file: p18[p.wiki.replace(/ /g, "_")] }));
  const found = want.filter((x) => x.file);
  want.filter((x) => !x.file).forEach(({ p }) => failed.push(`人物 ${p.id}：维基数据上没有找到图像（${p.wiki}）`));
  const info = await lookup(found.map((x) => x.file), PORTRAIT);
  const tinfo = await lookup(found.map((x) => x.file), 120); // 关系图节点用的小图
  for (const { p, file } of found) {
    const ii = info[titleOf(file)];
    if (!ii) { failed.push(`人物 ${p.id}：Commons 上找不到 ${file}`); continue; }
    const m = ii.extmetadata ?? {};
    const short = m.LicenseShortName?.value ?? "", lic = m.License?.value ?? "";
    if (!okLicense(short, lic)) { failed.push(`人物 ${p.id}：授权不符合要求（${short || lic || "未知"}）`); continue; }
    const ext = ii.mime === "image/png" ? "png" : "jpg";
    const out = `images/people/${p.id}.${ext}`, tout = `images/people/${p.id}.thumb.${ext}`;
    const small = tinfo[titleOf(file)];
    try {
      await download(ii.thumburl ?? ii.url, join(root, "public", out)); await sleep(200);
      await download(small?.thumburl ?? ii.thumburl ?? ii.url, join(root, "public", tout)); await sleep(200);
    } catch (e) { failed.push(`人物 ${p.id}：${e.message}`); continue; }
    credits["person:" + p.id] = {
      file: out, thumb: tout, title: `${p.name}（肖像）`,
      author: stripHtml(m.Artist?.value).slice(0, 160) || "佚名",
      license: short || lic, licenseUrl: m.LicenseUrl?.value || undefined, source: ii.descriptionurl,
    };
    console.log(`✓ 人物 ${p.id}  ${short}`);
  }
}

// 删掉已不存在的作品和人物
const ids = new Set([...works.map((w) => w.id), ...people.map((p) => "person:" + p.id)]);
for (const k of Object.keys(credits)) if (!ids.has(k)) delete credits[k];

const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(CREDITS, JSON.stringify(sorted, null, 2) + "\n");

const md = ["# 图片署名", "", "图片来自维基共享资源、维基百科文件页及馆藏网站。逐张保留来源页的作者、授权或权利说明；部分为非自由内容，不属于本项目的 MIT 授权。此文件由 `scripts/fetch-images.mjs` 生成，请勿手改。", "",
  "| 作品 | 作者 / 拍摄者 | 授权 | 来源 |", "|---|---|---|---|",
  ...Object.entries(sorted).map(([, c]) => `| ${c.title} | ${c.author.replace(/\|/g, "/")} | ${c.licenseUrl ? `[${c.license}](${c.licenseUrl})` : c.license} | [图片来源](${c.source}) |`), ""];
writeFileSync(join(root, "CREDITS.md"), md.join("\n"));

console.log(`\n完成：已有图片 ${Object.keys(sorted).length} 件`);
if (failed.length) {
  console.log(`未取到 ${failed.length} 件：\n- ` + failed.join("\n- "));
  console.log("可在 works.json 里核对图片文件名或馆藏图片地址后重跑。");
}
