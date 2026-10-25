/**
 * 文章封面生成器 v2：node scripts/gen-covers.mjs
 * 扫描 content/posts/*.md，为每篇生成 public/covers/<slug>.svg（800×450）。
 *
 * 统一视觉系统 + 逐篇独特性：
 * - 底色：石墨墨色渐变 + 胶片颗粒（全站一致）
 * - 每篇专属：主题色（ACCENTS）、内容主题线稿图标（ICONS，100×100 线稿）、
 *   构图相位（phase 决定流线起伏 / 辉光位置 / 同心环位置 / 点阵亮度）
 * - 图标描边为主题色，放在右侧视觉焦点；无文字。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const POSTS = join(HERE, '../content/posts');
const OUT = join(HERE, '../public/covers');

// ---------- 每篇专属配置：主题色 + 图标 ----------
// 图标在 100×100 坐标系内绘制（stroke=主题色，fill=none，线稿风）
const CONF = {
  // —— 密码学系列（紫色系渐变，Bitcoin 用经典金） ——
  Numbertheory:        { a: '#8b7bff', icon: `<path d="M34 26 L25 74 M47 26 L38 74 M60 26 L51 74 M73 26 L64 74"/><path d="M20 42 H80 M17 58 H77"/>` },
  Introduction:        { a: '#9d7bff', icon: `<path d="M50 16 L79 27 V50 C79 67 66 79 50 85 C34 79 21 67 21 50 V27 Z"/><path d="M38 48 L47 58 63 40"/>` },
  Symmetriccryptography:{ a: '#7b8bff', icon: `<path d="M16 52 C26 32 36 32 46 52 S66 72 84 52"/><circle cx="30" cy="40" r="2.4"/><circle cx="60" cy="63" r="2.4"/><circle cx="76" cy="49" r="2.4"/>` },
  Groupcipher:         { a: '#a98bff', icon: `<rect x="27" y="27" width="19" height="19" rx="3"/><rect x="54" y="27" width="19" height="19" rx="3"/><rect x="27" y="54" width="19" height="19" rx="3"/><rect x="54" y="54" width="19" height="19" rx="3"/>` },
  Asymmetriccryptography:{ a: '#8b5fff', icon: `<circle cx="35" cy="50" r="13"/><path d="M48 50 H82 M70 50 V63 M81 50 V60"/>` },
  HashAndMAC:          { a: '#b39dff', icon: `<path d="M30 64 C30 43 41 30 50 30 C59 30 70 43 70 64"/><path d="M38 68 C38 51 44 41 50 41 C56 41 62 51 62 68"/><path d="M46 71 C46 59 48 53 50 53 C52 53 54 59 54 71"/>` },
  ProtocolAndApplication:{ a: '#7b5fff', icon: `<path d="M24 41 H68 M58 31 L70 41 L58 51"/><path d="M76 61 H32 M42 51 L30 61 L42 71"/>` },
  Bitcoin:             { a: '#f2b34c', icon: `<circle cx="50" cy="50" r="27"/><path d="M43 34 V66 M51 34 V66 M43 34 H55 C61 34 61 43 55 43 H43 M43 52 H57 C63 52 63 61 57 61 H43 M47 28 V34 M55 28 V34"/>` },
  ModernCryptography:  { a: '#c9a8ff', icon: `<circle cx="50" cy="23" r="7"/><circle cx="25" cy="69" r="7"/><circle cx="75" cy="69" r="7"/><path d="M45 29 L30 62 M55 29 L70 62 M32 69 H68"/>` },
  // —— 学术 ——
  LaTeX:               { a: '#5a9cff', icon: `<path d="M30 24 H70 L46 50 L70 76 H30"/>` },
  ddiancichang:        { a: '#48c8b8', icon: `<circle cx="37" cy="50" r="6"/><circle cx="63" cy="50" r="6"/><path d="M37 43 C45 30 55 30 63 43 M37 57 C45 70 55 70 63 57 M33 39 C41 16 59 16 67 39 M33 61 C41 84 59 84 67 61"/>` },
  // —— iPhone（手机底 + 屏内不同内容） ——
  iphoneduozhanghao:   { a: '#ff8f7d', icon: `<rect x="33" y="16" width="34" height="68" rx="8"/><path d="M44 23 H56"/><circle cx="43" cy="46" r="5"/><circle cx="57" cy="46" r="5"/><path d="M34 68 C37 60 47 60 50 68 M50 68 C53 60 63 60 66 68"/>` },
  iphonequchukaiping:  { a: '#4fc3f7', icon: `<rect x="33" y="16" width="34" height="68" rx="8"/><path d="M44 23 H56"/><path d="M40 44 V40 H44 M56 40 H60 V44 M40 58 V62 H44 M56 62 H60 V58"/><path d="M43 54 C46 58 54 58 57 54"/>` },
  iphonexianmian:      { a: '#b58aff', icon: `<rect x="33" y="16" width="34" height="68" rx="8"/><path d="M44 23 H56"/><rect x="42" y="48" width="16" height="13" rx="2.5"/><path d="M45 48 V44 C45 39 55 39 55 44 V48"/>` },
  // —— Windows ——
  '360':               { a: '#58c888', icon: `<path d="M50 16 L77 26 V48 C77 64 65 76 50 82 C35 76 23 64 23 48 V26 Z"/><path d="M42 41 L58 57 M58 41 L42 57"/>` },
  edgexz:              { a: '#4fc3f7', icon: `<circle cx="50" cy="50" r="26"/><path d="M50 34 V62 M39 52 L50 63 L61 52"/>` },
  winkjj:              { a: '#90a8d0', icon: `<rect x="18" y="33" width="64" height="34" rx="5"/><path d="M29 44 h6 M41 44 h6 M53 44 h6 M65 44 h6 M34 56 h32"/>` },
  // —— Python ——
  pip:                 { a: '#ffd166', icon: `<path d="M50 20 L76 33 V63 L50 76 L24 63 V33 Z M24 33 L50 46 L76 33 M50 46 V76"/>` },
  python:              { a: '#7ee08a', icon: `<path d="M62 22 C38 16 31 33 47 37 C66 41 68 58 44 55 C35 54 33 62 38 68"/><circle cx="59" cy="26" r="2.6"/>` },
  uv:                  { a: '#f2c14e', icon: `<path d="M56 18 L34 52 H49 L43 82 L68 42 H53 Z"/>` },
  // —— 技巧 ——
  aixin:               { a: '#ff6b9d', icon: `<path d="M50 72 C27 55 21 40 30 31 C37 25 46 28 50 36 C54 28 63 25 70 31 C79 40 73 55 50 72 Z"/>` },
  googletranslate:     { a: '#9ad0ff', icon: `<rect x="20" y="22" width="36" height="36" rx="5"/><path d="M29 33 H47 M38 33 V52 M32 46 C39 51 43 51 48 49"/><rect x="46" y="42" width="34" height="34" rx="5"/><path d="M55 51 L71 67 M71 51 L55 67"/>` },
  jiaoben:             { a: '#8ad0ff', icon: `<rect x="20" y="24" width="60" height="52" rx="6"/><path d="M30 40 L41 49 L30 58 M47 60 H62"/>` },
  jisuanjibiannianshi: { a: '#ffa94d', icon: `<path d="M16 50 H84"/><circle cx="30" cy="50" r="4.5"/><circle cx="50" cy="50" r="4.5"/><circle cx="70" cy="50" r="4.5"/><path d="M30 50 V37 M50 50 V63 M70 50 V37"/>` },
  matlabrose:          { a: '#e05f7e', icon: `<path d="M50 50 C42 32 58 32 50 50 M50 50 C68 42 68 58 50 50 M50 50 C58 68 42 68 50 50 M50 50 C32 58 32 42 50 50"/><circle cx="50" cy="50" r="3"/>` },
  ohmuzsh:             { a: '#62e0b0', icon: `<rect x="20" y="24" width="60" height="52" rx="6"/><path d="M30 38 H42 M36 32 V44 M58 32 L48 66"/><circle cx="63" cy="38" r="3"/><circle cx="53" cy="60" r="3"/>` },
  ttq:                 { a: '#f2a0c0', icon: `<circle cx="50" cy="50" r="27"/><circle cx="50" cy="50" r="10"/><path d="M42 32 l5 3 M63 39 l-5 3 M35 55 l6 2 M66 57 l-6 2"/>` },
  tuchuang:            { a: '#64d2a8', icon: `<rect x="22" y="27" width="56" height="46" rx="5"/><circle cx="38" cy="41" r="5"/><path d="M26 66 L44 49 L55 58 L64 45 L76 60"/>` },
  win:                 { a: '#5ac8fa', icon: `<rect x="28" y="28" width="19" height="19" rx="2.5"/><rect x="53" y="28" width="19" height="19" rx="2.5"/><rect x="28" y="53" width="19" height="19" rx="2.5"/><rect x="53" y="53" width="19" height="19" rx="2.5"/>` },
  // —— AI 系列（青蓝绿科技色域，Claude/OpenAI 各用品牌暖色点缀） ——
  prompt:              { a: '#4fc3f7', icon: `<path d="M28 26 H72 A7 7 0 0 1 79 33 V57 A7 7 0 0 1 72 64 H48 L36 77 V64 H28 A7 7 0 0 1 21 57 V33 A7 7 0 0 1 28 26 Z"/><path d="M38 40 l7 5 -7 5 M51 51 H64"/>` },
  'context-engineering':{ a: '#64d2a8', icon: `<path d="M50 20 L79 35 50 50 21 35 Z"/><path d="M21 49 L50 64 79 49"/><path d="M21 63 L50 78 79 63"/>` },
  agent:               { a: '#5ad0ff', icon: `<rect x="31" y="35" width="38" height="31" rx="9"/><circle cx="43" cy="50" r="3"/><circle cx="57" cy="50" r="3"/><path d="M50 35 V22"/><circle cx="50" cy="18" r="3.5"/>` },
  'agentic-ai':        { a: '#4fd6c8', icon: `<circle cx="50" cy="50" r="23"/><path d="M50 22 V30 M50 70 V78 M22 50 H30 M70 50 H78 M31 31 L37 37 M63 63 L69 69 M69 31 L63 37 M37 63 L31 69"/><circle cx="50" cy="50" r="9"/>` },
  mcp:                 { a: '#6fa8ff', icon: `<path d="M39 24 V42 M61 24 V42"/><path d="M31 42 H69 V53 C69 66 61 73 50 73 C39 73 31 66 31 53 Z"/><path d="M50 73 V82"/>` },
  a2a:                 { a: '#7ee0e0', icon: `<circle cx="27" cy="50" r="11"/><circle cx="73" cy="50" r="11"/><path d="M38 50 H62"/><circle cx="50" cy="50" r="4"/>` },
  rag:                 { a: '#4fa8ff', icon: `<ellipse cx="43" cy="31" rx="18" ry="7"/><path d="M25 31 V57 C25 62 33 65 43 65 C53 65 61 62 61 57 V31 M25 44 C25 49 33 52 43 52 C53 52 61 49 61 44"/><circle cx="63" cy="64" r="9"/><path d="M70 71 L80 81"/>` },
  skill:               { a: '#62e0b0', icon: `<rect x="24" y="40" width="52" height="30" rx="5"/><path d="M41 40 V33 C41 26 59 26 59 33 V40 M24 53 H76"/>` },
  'ai-coding-agent':   { a: '#52c9ff', icon: `<path d="M35 32 L21 50 35 68 M65 32 L79 50 65 68"/><path d="M54 27 L46 73"/>` },
  'multi-agent':       { a: '#45c8e8', icon: `<circle cx="50" cy="24" r="8"/><circle cx="24" cy="71" r="8"/><circle cx="76" cy="71" r="8"/><path d="M44 30 L31 63 M56 30 L69 63 M32 71 H68"/>` },
  'deep-reasoning':    { a: '#7aa8ff', icon: `<path d="M44 25 C30 25 26 38 32 44 C23 50 27 65 40 67 C44 75 60 75 62 67 C73 63 73 47 64 43 C70 35 62 25 52 27 C50 23 46 23 44 25 Z"/><path d="M50 33 V61 M41 44 H59"/>` },
  'ai-security':       { a: '#55d6b8', icon: `<path d="M50 16 L79 27 V50 C79 67 66 79 50 85 C34 79 21 67 21 50 V27 Z"/><circle cx="50" cy="45" r="6"/><path d="M50 51 V62"/>` },
  'attention-residuals':{ a: '#8ad0ff', icon: `<path d="M20 50 C33 30 67 30 80 50 C67 70 33 70 20 50 Z"/><circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="3"/>` },
  jepa:                { a: '#48b8e0', icon: `<rect x="22" y="22" width="56" height="56" rx="7"/><rect x="37" y="37" width="26" height="26" rx="4"/><circle cx="50" cy="50" r="2.6"/>` },
  'embodied-ai':       { a: '#5ae0d6', icon: `<path d="M28 78 H72 M36 78 V60 C36 52 44 52 48 45 L57 33"/><circle cx="61" cy="28" r="6"/><path d="M66 24 L73 17"/>` },
  AItools:             { a: '#6fd6a0', icon: `<path d="M63 21 A17 17 0 1 0 73 45 L48 70 A8.5 8.5 0 0 1 31 53 Z"/><path d="M57 27 A9 9 0 0 1 69 39"/>` },
  'cc-switch':         { a: '#58c8dc', icon: `<rect x="22" y="35" width="56" height="30" rx="15"/><circle cx="63" cy="50" r="10"/><path d="M35 50 h10"/>` },
  openclaw:            { a: '#4aa8e8', icon: `<path d="M50 80 C29 71 25 50 34 37 M34 37 C40 41 46 39 48 33 M34 37 C30 31 32 23 39 19"/><path d="M50 80 C71 71 75 50 66 37 M66 37 C60 41 54 39 52 33 M66 37 C70 31 68 23 61 19"/><path d="M41 80 H59"/>` },
  'hermes-agent':      { a: '#66d6c0', icon: `<path d="M20 48 C33 37 51 35 66 42 L80 34 C76 46 65 55 50 58 C39 60 27 56 20 48 Z"/><path d="M27 61 C42 66 57 63 68 55"/><path d="M35 44 C45 40 57 40 64 44"/>` },
  nanobot:             { a: '#74c8f0', icon: `<rect x="34" y="38" width="32" height="27" rx="7"/><circle cx="44" cy="51" r="2.6"/><circle cx="56" cy="51" r="2.6"/><path d="M50 38 V27"/><circle cx="50" cy="23" r="3.5"/><path d="M34 71 H66"/>` },
  'deepseek-harness':  { a: '#48c0d0', icon: `<path d="M20 52 C26 38 45 33 58 40 C66 44 72 42 77 35 C78 48 71 60 56 65 C41 70 26 66 20 52 Z"/><path d="M77 35 C81 30 83 25 83 20 C86 27 84 35 79 41"/><circle cx="38" cy="51" r="2.2"/>` },
  'Claude-Code':       { a: '#d69a5a', icon: `<path d="M34 32 L20 50 34 68 M66 32 L80 50 66 68"/><path d="M55 26 L45 74"/><path d="M50 14 v5 M50 81 v5 M14 50 h5 M81 50 h5"/>` },
  ChatGPT:             { a: '#5ae0a0', icon: `<path d="M34 32 L20 50 34 68 M66 32 L80 50 66 68"/><path d="M50 42 H50.1 M50 42 V58 M42 50 H58"/>` },
};

// ---------- 组合 ----------
function phaseOf(slug) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h % 8;
}

function flowPaths(phase) {
  const dx = (phase % 4) * 45 - 70;
  const dy = Math.floor(phase / 4) * 30;
  const amp = 1 + (phase % 3) * 0.1;
  const y = (v) => (v + dy).toFixed(1);
  const x = (v) => (v + dx).toFixed(1);
  return [
    `M ${x(-60)} ${y(302)} C ${x(200)} ${y(302 - 42 * amp)}, ${x(380)} ${y(356 + 20 * amp)}, ${x(560)} ${y(302)} S ${x(820)} ${y(246)}, ${x(880)} ${y(282)}`,
    `M ${x(-60)} ${y(342)} C ${x(230)} ${y(342 - 30 * amp)}, ${x(410)} ${y(382 + 16 * amp)}, ${x(600)} ${y(336)} S ${x(840)} ${y(286)}, ${x(880)} ${y(318)}`,
    `M ${x(-60)} ${y(378)} C ${x(210)} ${y(378 - 22 * amp)}, ${x(430)} ${y(408 + 12 * amp)}, ${x(620)} ${y(372)} S ${x(850)} ${y(336)}, ${x(880)} ${y(356)}`,
  ];
}

function svg(slug, accent, phase) {
  const gx = phase % 2 === 0 ? 0.78 : 0.22;
  const gy = phase % 3 === 0 ? 0.16 : 0.22;
  const ringCx = 120 + (phase % 5) * 90;
  const curves = flowPaths(phase)
    .map(
      (d, i) =>
        `<path d="${d}" fill="none" stroke="${accent}" stroke-opacity="${[0.4, 0.24, 0.13][i]}" stroke-width="${[2.4, 1.7, 1.1][i]}"${i === 1 ? ' stroke-dasharray="7 9"' : ''} stroke-linecap="round"/>`,
    )
    .join('\n  ');
  const dots = Array.from({ length: 18 }, (_, i) => {
    const cx = 72 + (i % 6) * 22;
    const cy = 366 + Math.floor(i / 6) * 20;
    return `<circle cx="${cx}" cy="${cy}" r="2.2" fill="#ffffff" fill-opacity="${0.05 + (i % 3) * 0.045}"/>`;
  }).join('\n  ');
  const icon = (CONF[slug] && CONF[slug].icon) || `<circle cx="50" cy="50" r="24"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.65" y2="1">
      <stop offset="0" stop-color="#0e1118"/>
      <stop offset="1" stop-color="#181d29"/>
    </linearGradient>
    <radialGradient id="glow" cx="${gx}" cy="${gy}" r="0.72">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.27"/>
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <rect width="800" height="450" fill="url(#glow)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.06">
    <circle cx="${ringCx}" cy="112" r="128"/>
    <circle cx="${ringCx}" cy="112" r="82"/>
    <circle cx="${ringCx}" cy="112" r="40"/>
  </g>
  ${curves}
  ${dots}
  <g transform="translate(520 155) scale(1.9)" fill="none" stroke="${accent}" stroke-opacity="0.92" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    ${icon}
  </g>
  <rect width="800" height="450" filter="url(#grain)" fill="transparent"/>
</svg>
`;
}

// ---------- 主流程：以 content/posts 为准逐篇生成，清理孤儿封面 ----------
mkdirSync(OUT, { recursive: true });

const slugs = existsSync(POSTS)
  ? readdirSync(POSTS).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
  : [];

let made = 0;
const missing = [];
for (const slug of slugs) {
  const cfg = CONF[slug];
  if (!cfg) { missing.push(slug); continue; }
  writeFileSync(join(OUT, `${slug}.svg`), svg(slug, cfg.a, phaseOf(slug)), 'utf8');
  made++;
}

// 旧版通用封面与已删文章的孤儿文件清理
const keep = new Set([...slugs, 'post']);
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.svg') && !keep.has(f.replace(/\.svg$/, ''))) {
    rmSync(join(OUT, f));
  }
}

// 默认封面（无图标纯构图）
writeFileSync(
  join(OUT, 'post.svg'),
  svg('post', '#8a93a8', 0),
  'utf8',
);

console.log(`封面生成：${made} 篇（缺配置：${missing.length ? missing.join(', ') : '无'}），输出 ${OUT}`);
if (missing.length) process.exitCode = 1;
