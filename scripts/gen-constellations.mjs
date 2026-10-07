/**
 * gen-constellations.mjs —— 生成首页真实星座轮廓数据
 *
 * 数据源：d3-celestial（MIT）constellations.lines.json，真实天球坐标（RA/Dec，度）
 * 用法：node scripts/gen-constellations.mjs
 * 输出：src/content/constellations.json（提交到仓库，CI 无网络依赖）
 *
 * 想换星座/调位置：改下面 CONSTELLATIONS 数组即可。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE = join(__dirname, '.cache', 'constellations.lines.json');
const OUT = join(ROOT, 'src', 'content', 'constellations.json');
const DATA_URL = 'https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/constellations.lines.json';

const VIEW_W = 1440;
const VIEW_H = 700;

/**
 * 每个星座：id（IAU 缩写）、name（拉丁名标签）、zh（中文名）、
 * box 在 hero viewBox 里的摆放区域 [x0, y0, x1, y1]（保纵横比缩放）。
 * 9 个星座错峰淡入淡出 + 缓慢漂浮，允许重叠（见 Home.vue 动画）。
 */
const CONSTELLATIONS = [
  { id: 'UMa', name: 'URSA MAJOR', zh: '大熊座 · 北斗七星', box: [36, 46, 400, 205] },
  { id: 'Ori', name: 'ORION', zh: '猎户座', box: [805, 55, 1000, 330] },
  { id: 'Cas', name: 'CASSIOPEIA', zh: '仙后座', box: [66, 470, 320, 565] },
  { id: 'CrB', name: 'CORONA BOREALIS', zh: '北冕座', box: [598, 418, 752, 512] },
  { id: 'Cyg', name: 'CYGNUS', zh: '天鹅座', box: [430, 60, 640, 290] },
  { id: 'Lyr', name: 'LYRA', zh: '天琴座', box: [1030, 400, 1160, 520] },
  { id: 'Del', name: 'DELPHINUS', zh: '海豚座', box: [1250, 540, 1390, 650] },
  { id: 'Aql', name: 'AQUILA', zh: '天鹰座', box: [180, 260, 430, 430] },
  { id: 'Leo', name: 'LEO', zh: '狮子座', box: [1050, 60, 1330, 280] }
];

async function loadData() {
  if (existsSync(CACHE)) {
    console.log('使用本地缓存数据');
    return JSON.parse(readFileSync(CACHE, 'utf8'));
  }
  console.log('从 jsDelivr 拉取星座数据…');
  const resp = await fetch(DATA_URL);
  if (!resp.ok) throw new Error(`下载失败: HTTP ${resp.status}`);
  const text = await resp.json();
  return text;
}

/** 经度解包：处理跨 RA 0°/360° 的情况，保证线段内经度连续 */
function unwrapLongitudes(segment) {
  const out = segment.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat]);
  for (let i = 1; i < out.length; i++) {
    let d = out[i][0] - out[i - 1][0];
    if (d > 180) out[i][0] -= 360;
    else if (d < -180) out[i][0] += 360;
  }
  return out;
}

/** 等距圆柱投影（纬度余弦校正横轴），投影到目标 box，保纵横比 */
function project(segments, box) {
  const midLat =
    segments.flat().reduce((s, p) => s + p[1], 0) / segments.flat().length;
  const k = Math.cos((midLat * Math.PI) / 180);

  const projected = segments.map((seg) => seg.map(([lon, lat]) => [lon * k, lat]));

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of projected.flat()) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }

  const boxW = box[2] - box[0];
  const boxH = box[3] - box[1];
  const scale = Math.min(boxW / (maxX - minX), boxH / (maxY - minY));
  // 在 box 内居中
  const offsetX = box[0] + (boxW - (maxX - minX) * scale) / 2;
  const offsetY = box[1] + (boxH - (maxY - minY) * scale) / 2;

  // 天球纬度向上为正，屏幕 y 向下为正 → 翻转 y
  const toXY = (p) => [
    Math.round((offsetX + (p[0] - minX) * scale) * 10) / 10,
    Math.round((offsetY + (maxY - p[1]) * scale) * 10) / 10
  ];

  return {
    lines: projected.map((seg) => seg.map(toXY)),
    stars: projected.flat().map(toXY)
  };
}

const data = await loadData();
const items = [];

for (const target of CONSTELLATIONS) {
  const feature = data.features.find((f) => f.id === target.id);
  if (!feature) {
    console.warn(`未找到星座 ${target.id}，跳过`);
    continue;
  }
  const segments = feature.geometry.coordinates.map(unwrapLongitudes);
  const { lines, stars } = project(segments, target.box);
  items.push({ ...target, lines, stars });
  console.log(
    `${target.id} ${target.name}: ${lines.length} 条线 / ${stars.length} 颗星`,
    JSON.stringify(lines.flat().reduce((a, p) => [
      Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])
    ], [Infinity, Infinity, -Infinity, -Infinity]))
  );
}

writeFileSync(OUT, JSON.stringify({ viewbox: [VIEW_W, VIEW_H], items }, null, 2) + '\n');
console.log(`已写入 ${OUT}`);
