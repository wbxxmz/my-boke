#!/usr/bin/env node
// 博客写作规范自查脚本（只读）
// 口径唯一来源：仓库根目录 STYLE.md「附：统计口径」一节。
// 使用：node scripts/check-style.mjs [--strict]
// 只读取 src/content/posts/*.md，向标准输出打印报告；不修改任何文件。

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const POSTS_DIR = 'src/content/posts';
const STRICT = process.argv.includes('--strict');

// ── 口径 4：汉字 = Unicode CJK 基本区，不含扩展 A / 标点 / 英文 / 数字 ──
const cjkCount = (s) => (s.match(/[\u4e00-\u9fa5]/g) || []).length;

// ── frontmatter 边界：口径 1 定义 body 为「第一个 frontmatter 段之后的正文」──
function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { ok: false, raw, body: raw };
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { ok: false, raw, body: raw };
  return { ok: true, body: raw.slice(m[0].length) };
}

// ── 口径 9①②：围栏代码块、行内代码剔除（半角标点与段落统计共用）──
function stripFenced(s) {
  return s.replace(/```[\s\S]*?```/g, '');
}

// ── 口径 5：'——' 计 1 次，非重叠；'————' 自然计 2 次 ──
const dashCount = (s) => (s.match(/——/g) || []).length;

// ── 口径 6：只计全角左括号 U+FF08 ──
const parenCount = (s) => (s.match(/（/g) || []).length;

// ── 口径 3：'不是…是/而是'，逐行不跨行、非重叠，仅统计 body ──
function oushuCount(raw) {
  let n = 0;
  for (const line of raw.split('\n')) {
    n += (line.match(/不是[^,。；]{1,14}[，,]?(而)?是/g) || []).length;
  }
  return n;
}

// ── 口径 7：加粗 = \*\*[^*]+\*\*，可跨行、不嵌套、非重叠 ──
const boldCount = (s) => (s.match(/\*\*[^*]+\*\*/g) || []).length;

// ── 口径 9：剔代码块→行内代码→图片→URL，再数「汉字 + 半角标点」 ──
function halfPunctCount(body) {
  let s = stripFenced(body);
  s = s.replace(/`[^`]*`/g, '');
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  s = s.replace(/https?:\/\/[^\s)]+/g, '');
  return (s.match(/[\u4e00-\u9fa5][,.;:!?]/g) || []).length;
}

// ── 口径 8：空行切段，剔 ``` | ! > # 开头段；列表项算独立段；按段内汉字计长 ──
function paragraphStats(body) {
  const clean = stripFenced(body);
  const paras = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => !/^(```|\||!|>|#)/.test(p));
  const lens = paras.map(cjkCount);
  return {
    count: lens.length,
    over120: lens.filter((l) => l > 120).length,
    longest: lens.length ? Math.max(...lens) : 0,
  };
}

// ── 口径 10：二级标题中同时含「启示」与「结尾」→ 双结尾（本站特判）──
function doubleEnding(body) {
  const h2 = body.match(/^##[ \t]+.+$/gm) || [];
  return h2.some((h) => h.includes('启示')) && h2.some((h) => h.includes('结尾'));
}

// ── 口径未覆盖的情况：只报告，不替作者决定 ──
function undefinedCases(raw, body, cjk, bold) {
  const notes = [];
  if (!raw.startsWith('---')) notes.push('文件不以 --- 开头，frontmatter 边界无法确定');
  else if (!/^---\r?\n[\s\S]*?\r?\n---\r?\n?/.test(raw)) notes.push('frontmatter 缺少结束分隔线 ---');
  if (((raw.match(/```/g) || []).length) % 2 !== 0) notes.push('围栏代码块未闭合（``` 数为奇数）');
  if (cjk === 0) notes.push('正文汉字数为 0，密度分母为 0');
  if (bold === 0) notes.push('加粗为 0 处，「每处字数」无定义');
  if (/———/.test(raw)) notes.push('出现 3 个及以上连续 U+2014，STYLE 只定义了 2 个和 4 个的情形');
  if (/<!--/.test(body)) notes.push('正文含 HTML 注释 <!-- -->，未规定是否计入统计');
  const indented = stripFenced(body)
    .split(/\n\s*\n/)
    .some((p) => /^ {4}/.test(p) && p.trim().length > 0);
  if (indented) notes.push('存在以 4 个空格开头的段（缩进代码块），未规定是否剔除');
  return notes;
}

// ── 显示宽度（CJK 记 2 列），仅用于表格对齐 ──
const width = (s) => [...s].reduce((w, ch) => w + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
const pad = (s, n) => s + ' '.repeat(Math.max(1, n - width(s)));

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).sort();

const rows = [];
const notesAll = [];
let sum = { dash: 0, paren: 0, oushu: 0, cjk: 0, bold: 0 };
let fail = 0;
const perFile = {};

for (const file of files) {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
  const { body } = splitFrontmatter(raw);

  const cjk = cjkCount(body);
  const dash = dashCount(body);     // 仅 body（口径 1 修订：与汉字分母对齐）
  const paren = parenCount(body);   // 仅 body
  const oushu = oushuCount(body);   // 仅 body
  const bold = boldCount(body);
  const ps = paragraphStats(body);
  const half = halfPunctCount(body);
  const dbl = doubleEnding(body);

  const dashD = cjk ? (dash / cjk) * 1000 : NaN;   // 每千汉字
  const parenD = cjk ? (paren / cjk) * 1000 : NaN;
  const boldPer = bold ? Math.floor(cjk / bold) : NaN; // 每处加粗覆盖的汉字数（向下取整，对齐基线 65）
  const pairD = dashD + parenD;                     // 插入语合计（口径 11：合并计一项）

  // 阈值取 STYLE.md：插入语合计 ≤2 次/千字；对偶句 ≤1；加粗 ≥300 字/处；超长段 0；半角标点 0；双结尾 False
  const failPair = !(pairD <= 2);
  const failOushu = !(oushu <= 1);
  const failBold = !(boldPer >= 300);
  const failPara = !(ps.over120 === 0);
  const failHalf = !(half === 0);
  const failDbl = dbl !== false;

  const n = [failPair, failOushu, failBold, failPara, failHalf, failDbl].filter(Boolean).length;
  fail += n;

  const notes = undefinedCases(raw, body, cjk, bold);
  if (notes.length) notesAll.push({ file, notes });

  sum.dash += dash; sum.paren += paren; sum.oushu += oushu; sum.cjk += cjk; sum.bold += bold;
  perFile[file] = { dash, paren, oushu, bold, cjk, dashD, parenD, pairD, boldPer, ps, half, dbl };

  const mark = (bad) => (bad ? '✗' : '✓');
  rows.push([
    file,
    `${pairD.toFixed(1)}${mark(failPair)}`,
    `${oushu}${mark(failOushu)}`,
    `${Number.isNaN(boldPer) ? '—' : boldPer}${mark(failBold)}`,
    `${ps.over120}${mark(failPara)}`,
    `${half}${mark(failHalf)}`,
    `${dbl ? 'True' : 'False'}${mark(failDbl)}`,
  ]);
}

// ── 输出 ──
const head = ['文件名', '插入语/千字', '对偶句', '加粗字/处', '超长段', '半角标点', '双结尾'];
const widths = head.map((h, i) => Math.max(width(h), ...rows.map((r) => width(r[i]))) + 2);

console.log('口径：STYLE.md「附：统计口径」修订版。破折号/括号/对偶句/汉字/加粗/段落一律只统计 body（剔 frontmatter）。');
console.log('阈值：插入语（破折号+括号）合计 ≤2 次/千字；对偶句 ≤1；加粗 ≥300 字/处；超长段 =0；半角标点 =0；双结尾 = False。\n');
console.log(head.map((h, i) => pad(h, widths[i])).join(''));
console.log('-'.repeat(widths.reduce((a, b) => a + b, 0)));
for (const r of rows) console.log(r.map((c, i) => pad(c, widths[i])).join(''));

console.log('\n── 汇总 ──');
console.log(`破折号总次数：${sum.dash}（仅 body）`);
console.log(`括号总次数：${sum.paren}（仅 body，全角左括号「（」）`);
console.log(`对偶句总数：${sum.oushu}（仅 body）`);
console.log(`插入语拆分（破折号+括号，次/千字）：${files.map((f) => {
  const p = perFile[f];
  return `${f.replace('.md', '')} ${p.dashD.toFixed(1)}+${p.parenD.toFixed(1)}`;
}).join('  |  ')}`);
if (perFile['ros2-python-2.md']) {
  const p = perFile['ros2-python-2.md'];
  console.log(`ros2-python-2.md 加粗：${p.bold} 处 / ${p.cjk} 字 = 每 ${p.boldPer} 字一处`);
}
if (perFile['ai-api-selection.md']) {
  console.log(`ai-api-selection.md 最长段：${perFile['ai-api-selection.md'].ps.longest} 字`);
}
console.log(`超标项合计：${fail} 处（${files.length} 篇 × 6 项 = ${files.length * 6} 项）`);

if (notesAll.length) {
  console.log('\n── 口径未定义（未替你决定，请补充 STYLE.md）──');
  for (const { file, notes } of notesAll) {
    for (const note of notes) console.log(`口径未定义：${file} —— ${note}`);
  }
} else {
  console.log('\n口径未定义：无（当前样本全部落在 STYLE.md 已覆盖范围内）');
}

if (STRICT && fail > 0) {
  console.log('\n[strict] 存在超标项，退出码 1。');
  process.exit(1);
}