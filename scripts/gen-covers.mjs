/**
 * 文章封面生成器 v3：node scripts/gen-covers.mjs
 * 扫描 content/posts/*.md，为每篇生成 public/covers/<slug>.svg（800×450）。
 *
 * 每篇独一无二 = 背景（配色 × 构图）+ 专属线稿图标 三层组合：
 * - 14 套背景配色（PALETTES：从深海军蓝到暗琥珀，各带辉光色/图标色）
 * - 8 种背景构图（STYLES：极光/光束/等高线/地平线/星座/点阵/波带/网格）
 * - 图标沿用内容主题线稿（52 个）
 * 每篇文章分配唯一的（配色, 构图）组合，52 篇无重样（总组合 112 种）。
 */
import { readdirSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const POSTS = join(HERE, '../content/posts');
const OUT = join(HERE, '../public/covers');

// ---------- 背景配色（bg1→bg2 渐变底，glow 辉光/线条色，accent 图标色） ----------
const PALETTES = {
  navy:      { bg1: '#0a1428', bg2: '#10233d', glow: '#2e5fa3', accent: '#7db4ff' },
  violet:    { bg1: '#130b24', bg2: '#241643', glow: '#5b3fae', accent: '#b39dff' },
  forest:    { bg1: '#08180f', bg2: '#10291b', glow: '#1f6b45', accent: '#6fd6a0' },
  teal:      { bg1: '#06201e', bg2: '#0c3833', glow: '#157f78', accent: '#5fe0d0' },
  wine:      { bg1: '#1d0a13', bg2: '#351322', glow: '#8a2b4a', accent: '#ff8fb0' },
  indigo:    { bg1: '#0b0f2c', bg2: '#1a2050', glow: '#3747a8', accent: '#8f9dff' },
  amber:     { bg1: '#1d1206', bg2: '#37230c', glow: '#8a5a17', accent: '#ffc46b' },
  burnt:     { bg1: '#1c0e07', bg2: '#371a0c', glow: '#8a3d17', accent: '#ff9d6b' },
  slate:     { bg1: '#10151c', bg2: '#1f2833', glow: '#45586e', accent: '#9fb4d0' },
  rose:      { bg1: '#190d17', bg2: '#2f1a29', glow: '#7c3d63', accent: '#ff9dc9' },
  cyanNight: { bg1: '#041019', bg2: '#0a2836', glow: '#106a8a', accent: '#6bd4ff' },
  plum:      { bg1: '#17091d', bg2: '#2b1237', glow: '#5e2673', accent: '#cf9dff' },
  moss:      { bg1: '#131607', bg2: '#262c0e', glow: '#5c661d', accent: '#d4e06b' },
  charcoal:  { bg1: '#151312', bg2: '#26221f', glow: '#575049', accent: '#d0c4b0' },
};

// ---------- 可复现随机数（同一 slug 每次生成完全一致） ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------- 8 种背景构图 ----------
const STYLES = {
  /** 极光：两团大径向辉光 + 细弧 */
  aurora(p, rnd) {
    const cx1 = 120 + rnd() * 560, cy1 = rnd() * 160;
    const cx2 = rnd() * 800, cy2 = 260 + rnd() * 190;
    const arcX = 150 + rnd() * 500;
    return `
  <rect width="800" height="450" fill="url(#glowA)"/>
  <rect width="800" height="450" fill="url(#glowB)"/>
  <path d="M ${arcX - 190} 430 Q ${arcX} 210 ${arcX + 260} 400" fill="none" stroke="${p.glow}" stroke-opacity="0.22" stroke-width="1.6"/>
  <path d="M ${arcX - 120} 445 Q ${arcX + 60} 260 ${arcX + 330} 420" fill="none" stroke="${p.glow}" stroke-opacity="0.12" stroke-width="1.1"/>`;
  },
  /** 光束：斜向平行光柱 */
  beams(p, rnd) {
    const ang = 20 + rnd() * 16;
    const off = rnd() * 200 - 100;
    const beams = [0, 1, 2, 3].map((i) => {
      const x = 60 + i * 210 + off;
      const w = 54 + rnd() * 60;
      return `<polygon points="${x},-40 ${x + w},-40 ${x + w - 260},490 ${x - 260},490" fill="${p.glow}" fill-opacity="${(0.05 + rnd() * 0.06).toFixed(3)}"/>`;
    }).join('\n  ');
    return `
  <g transform="rotate(${ang.toFixed(1)} 400 225)">
  ${beams}
  </g>
  <circle cx="${(90 + rnd() * 620).toFixed(0)}" cy="${(60 + rnd() * 90).toFixed(0)}" r="4" fill="${p.accent}" fill-opacity="0.5"/>`;
  },
  /** 等高线：错位同心环 */
  rings(p, rnd) {
    const cx = 470 + rnd() * 250, cy = rnd() * 140;
    const rs = [210, 165, 124, 87, 54, 27];
    const circles = rs.map((r, i) =>
      `<circle cx="${(cx + (i % 2 ? 18 : 0)).toFixed(0)}" cy="${(cy + (i % 3 ? -12 : 8)).toFixed(0)}" r="${r}" fill="none" stroke="${p.glow}" stroke-opacity="${(0.2 - i * 0.026).toFixed(3)}" stroke-width="1.4"/>`
    ).join('\n  ');
    return `
  ${circles}
  <circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="9" fill="${p.accent}" fill-opacity="0.4"/>`;
  },
  /** 地平线：层叠山峦/波浪剪影 + 天体 */
  horizon(p, rnd) {
    const sunX = 140 + rnd() * 520, sunY = 70 + rnd() * 80;
    const shift = rnd() * 300;
    const layer = (baseY, amp, op, fill) => `
  <path d="M -20 ${baseY} C ${140 + shift} ${baseY - amp}, ${300 + shift} ${baseY + amp * 0.6}, 460 ${baseY - amp * 0.3} S ${720 - shift} ${baseY + amp * 0.8}, 820 ${baseY - amp * 0.4} L 820 470 L -20 470 Z" fill="${fill}" fill-opacity="${op}"/>`;
    return `
  <circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="34" fill="${p.accent}" fill-opacity="0.16"/>
  <circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="15" fill="${p.accent}" fill-opacity="0.34"/>
  ${layer(300, 60, 0.34, p.glow)}
  ${layer(352, 46, 0.5, p.bg2)}
  ${layer(396, 34, 0.72, p.bg1)}
  ${layer(430, 22, 0.9, '#050507')}`;
  },
  /** 星座：散点 + 连线（呼应站点的星空主题） */
  constellation(p, rnd) {
    const pts = Array.from({ length: 15 }, () => [30 + rnd() * 740, 20 + rnd() * 400]);
    const dots = pts.map(([x, y], i) =>
      `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.2 + rnd() * 2.2).toFixed(1)}" fill="${i % 4 === 0 ? p.accent : '#ffffff'}" fill-opacity="${(0.25 + rnd() * 0.5).toFixed(2)}"/>`
    ).join('');
    const links = [0, 1, 2, 3, 4].map(() => {
      const a = pts[Math.floor(rnd() * pts.length)];
      const b = pts[Math.floor(rnd() * pts.length)];
      return `<line x1="${a[0].toFixed(0)}" y1="${a[1].toFixed(0)}" x2="${b[0].toFixed(0)}" y2="${b[1].toFixed(0)}" stroke="${p.glow}" stroke-opacity="0.3" stroke-width="1"/>`;
    }).join('');
    return `
  ${dots}${links}`;
  },
  /** 点阵：渐隐矩阵 + 十字准线 */
  grid(p, rnd) {
    const ox = rnd() * 200, oy = rnd() * 120;
    let dots = '';
    for (let gx = 0; gx < 16; gx++) {
      for (let gy = 0; gy < 9; gy++) {
        const x = 36 + gx * 50 + (oy % 2 ? 0 : 25), y = 30 + gy * 48;
        const d = Math.hypot(gx - 8, gy - 4) / 10;
        const op = Math.max(0, 0.3 - d * 0.26);
        if (op > 0.02) dots += `<circle cx="${x + ox * 0.2}" cy="${y}" r="2.1" fill="${p.glow}" fill-opacity="${op.toFixed(2)}"/>`;
      }
    }
    const lx = 150 + rnd() * 500, ly = 90 + rnd() * 120;
    return `
  ${dots}
  <line x1="${lx.toFixed(0)}" y1="0" x2="${lx.toFixed(0)}" y2="450" stroke="${p.accent}" stroke-opacity="0.2" stroke-width="1"/>
  <line x1="0" y1="${ly.toFixed(0)}" x2="800" y2="${ly.toFixed(0)}" stroke="${p.accent}" stroke-opacity="0.2" stroke-width="1"/>
  <circle cx="${lx.toFixed(0)}" cy="${ly.toFixed(0)}" r="5" fill="none" stroke="${p.accent}" stroke-opacity="0.5" stroke-width="1.4"/>`;
  },
  /** 波带：横向正弦带（层叠流动） */
  waves(p, rnd) {
    const shift = rnd() * 400;
    const band = (y, amp, op, dashed) => `
  <path d="M -20 ${y} C ${160 + shift} ${y - amp}, ${380 + shift} ${y + amp}, 600 ${y - amp * 0.4} S ${820 - shift} ${y + amp * 0.7}, 830 ${y}" fill="none" stroke="${p.glow}" stroke-opacity="${op}" stroke-width="1.6"${dashed ? ' stroke-dasharray="6 8"' : ''}/>`;
    return `
  ${band(140 + rnd() * 60, 36, 0.3, false)}
  ${band(220 + rnd() * 40, 44, 0.22, true)}
  ${band(300 + rnd() * 40, 38, 0.3, false)}
  ${band(380 + rnd() * 30, 30, 0.18, true)}
  <path d="M -20 430 C 200 400, 400 450, 820 415 L 820 470 L -20 470 Z" fill="${p.glow}" fill-opacity="0.1"/>`;
  },
  /** 网格：细斜线织网 + 节点 */
  mesh(p, rnd) {
    const lines = [];
    for (let i = -6; i < 14; i++) {
      const x = i * 90 + rnd() * 30;
      lines.push(`<line x1="${x}" y1="-20" x2="${x - 220}" y2="470" stroke="${p.glow}" stroke-opacity="0.09" stroke-width="1"/>`);
    }
    for (let i = -2; i < 7; i++) {
      const x = i * 130 + rnd() * 40;
      lines.push(`<line x1="${x}" y1="-20" x2="${x + 200}" y2="470" stroke="${p.glow}" stroke-opacity="0.07" stroke-width="1"/>`);
    }
    const nodes = [0, 1, 2, 3, 4].map(() =>
      `<circle cx="${(80 + rnd() * 640).toFixed(0)}" cy="${(50 + rnd() * 350).toFixed(0)}" r="3.4" fill="${p.accent}" fill-opacity="0.55"/>`
    ).join('');
    return `
  ${lines.join('\n  ')}
  ${nodes}`;
  },
};

// ---------- 每篇专属图标（100×100 线稿，stroke=当前配色 accent） ----------
const ICONS = {
  // 密码学系列
  Numbertheory: `<path d="M34 26 L25 74 M47 26 L38 74 M60 26 L51 74 M73 26 L64 74"/><path d="M20 42 H80 M17 58 H77"/>`,
  Introduction: `<path d="M50 16 L79 27 V50 C79 67 66 79 50 85 C34 79 21 67 21 50 V27 Z"/><path d="M38 48 L47 58 63 40"/>`,
  Symmetriccryptography: `<path d="M16 52 C26 32 36 32 46 52 S66 72 84 52"/><circle cx="30" cy="40" r="2.4"/><circle cx="60" cy="63" r="2.4"/><circle cx="76" cy="49" r="2.4"/>`,
  Groupcipher: `<rect x="27" y="27" width="19" height="19" rx="3"/><rect x="54" y="27" width="19" height="19" rx="3"/><rect x="27" y="54" width="19" height="19" rx="3"/><rect x="54" y="54" width="19" height="19" rx="3"/>`,
  Asymmetriccryptography: `<circle cx="35" cy="50" r="13"/><path d="M48 50 H82 M70 50 V63 M81 50 V60"/>`,
  HashAndMAC: `<path d="M30 64 C30 43 41 30 50 30 C59 30 70 43 70 64"/><path d="M38 68 C38 51 44 41 50 41 C56 41 62 51 62 68"/><path d="M46 71 C46 59 48 53 50 53 C52 53 54 59 54 71"/>`,
  ProtocolAndApplication: `<path d="M24 41 H68 M58 31 L70 41 L58 51"/><path d="M76 61 H32 M42 51 L30 61 L42 71"/>`,
  Bitcoin: `<circle cx="50" cy="50" r="27"/><path d="M43 34 V66 M51 34 V66 M43 34 H55 C61 34 61 43 55 43 H43 M43 52 H57 C63 52 63 61 57 61 H43 M47 28 V34 M55 28 V34"/>`,
  ModernCryptography: `<circle cx="50" cy="23" r="7"/><circle cx="25" cy="69" r="7"/><circle cx="75" cy="69" r="7"/><path d="M45 29 L30 62 M55 29 L70 62 M32 69 H68"/>`,
  // 学术
  LaTeX: `<path d="M30 24 H70 L46 50 L70 76 H30"/>`,
  ddiancichang: `<circle cx="37" cy="50" r="6"/><circle cx="63" cy="50" r="6"/><path d="M37 43 C45 30 55 30 63 43 M37 57 C45 70 55 70 63 57 M33 39 C41 16 59 16 67 39 M33 61 C41 84 59 84 67 61"/>`,
  // iPhone
  iphoneduozhanghao: `<rect x="33" y="16" width="34" height="68" rx="8"/><path d="M44 23 H56"/><circle cx="43" cy="46" r="5"/><circle cx="57" cy="46" r="5"/><path d="M34 68 C37 60 47 60 50 68 M50 68 C53 60 63 60 66 68"/>`,
  iphonequchukaiping: `<rect x="33" y="16" width="34" height="68" rx="8"/><path d="M44 23 H56"/><path d="M40 44 V40 H44 M56 40 H60 V44 M40 58 V62 H44 M56 62 H60 V58"/><path d="M43 54 C46 58 54 58 57 54"/>`,
  iphonexianmian: `<rect x="33" y="16" width="34" height="68" rx="8"/><path d="M44 23 H56"/><rect x="42" y="48" width="16" height="13" rx="2.5"/><path d="M45 48 V44 C45 39 55 39 55 44 V48"/>`,
  // Windows
  '360': `<path d="M50 16 L77 26 V48 C77 64 65 76 50 82 C35 76 23 64 23 48 V26 Z"/><path d="M42 41 L58 57 M58 41 L42 57"/>`,
  edgexz: `<circle cx="50" cy="50" r="26"/><path d="M50 34 V62 M39 52 L50 63 L61 52"/>`,
  winkjj: `<rect x="18" y="33" width="64" height="34" rx="5"/><path d="M29 44 h6 M41 44 h6 M53 44 h6 M65 44 h6 M34 56 h32"/>`,
  // Python
  pip: `<path d="M50 20 L76 33 V63 L50 76 L24 63 V33 Z M24 33 L50 46 L76 33 M50 46 V76"/>`,
  python: `<path d="M62 22 C38 16 31 33 47 37 C66 41 68 58 44 55 C35 54 33 62 38 68"/><circle cx="59" cy="26" r="2.6"/>`,
  uv: `<path d="M56 18 L34 52 H49 L43 82 L68 42 H53 Z"/>`,
  // 技巧
  aixin: `<path d="M50 72 C27 55 21 40 30 31 C37 25 46 28 50 36 C54 28 63 25 70 31 C79 40 73 55 50 72 Z"/>`,
  googletranslate: `<rect x="20" y="22" width="36" height="36" rx="5"/><path d="M29 33 H47 M38 33 V52 M32 46 C39 51 43 51 48 49"/><rect x="46" y="42" width="34" height="34" rx="5"/><path d="M55 51 L71 67 M71 51 L55 67"/>`,
  jiaoben: `<rect x="20" y="24" width="60" height="52" rx="6"/><path d="M30 40 L41 49 L30 58 M47 60 H62"/>`,
  jisuanjibiannianshi: `<path d="M16 50 H84"/><circle cx="30" cy="50" r="4.5"/><circle cx="50" cy="50" r="4.5"/><circle cx="70" cy="50" r="4.5"/><path d="M30 50 V37 M50 50 V63 M70 50 V37"/>`,
  matlabrose: `<path d="M50 50 C42 32 58 32 50 50 M50 50 C68 42 68 58 50 50 M50 50 C58 68 42 68 50 50 M50 50 C32 58 32 42 50 50"/><circle cx="50" cy="50" r="3"/>`,
  ohmuzsh: `<rect x="20" y="24" width="60" height="52" rx="6"/><path d="M30 38 H42 M36 32 V44 M58 32 L48 66"/><circle cx="63" cy="38" r="3"/><circle cx="53" cy="60" r="3"/>`,
  ttq: `<circle cx="50" cy="50" r="27"/><circle cx="50" cy="50" r="10"/><path d="M42 32 l5 3 M63 39 l-5 3 M35 55 l6 2 M66 57 l-6 2"/>`,
  tuchuang: `<rect x="22" y="27" width="56" height="46" rx="5"/><circle cx="38" cy="41" r="5"/><path d="M26 66 L44 49 L55 58 L64 45 L76 60"/>`,
  win: `<rect x="28" y="28" width="19" height="19" rx="2.5"/><rect x="53" y="28" width="19" height="19" rx="2.5"/><rect x="28" y="53" width="19" height="19" rx="2.5"/><rect x="53" y="53" width="19" height="19" rx="2.5"/>`,
  // AI 系列
  prompt: `<path d="M28 26 H72 A7 7 0 0 1 79 33 V57 A7 7 0 0 1 72 64 H48 L36 77 V64 H28 A7 7 0 0 1 21 57 V33 A7 7 0 0 1 28 26 Z"/><path d="M38 40 l7 5 -7 5 M51 51 H64"/>`,
  'context-engineering': `<path d="M50 20 L79 35 50 50 21 35 Z"/><path d="M21 49 L50 64 79 49"/><path d="M21 63 L50 78 79 63"/>`,
  agent: `<rect x="31" y="35" width="38" height="31" rx="9"/><circle cx="43" cy="50" r="3"/><circle cx="57" cy="50" r="3"/><path d="M50 35 V22"/><circle cx="50" cy="18" r="3.5"/>`,
  'agentic-ai': `<circle cx="50" cy="50" r="23"/><path d="M50 22 V30 M50 70 V78 M22 50 H30 M70 50 H78 M31 31 L37 37 M63 63 L69 69 M69 31 L63 37 M37 63 L31 69"/><circle cx="50" cy="50" r="9"/>`,
  mcp: `<path d="M39 24 V42 M61 24 V42"/><path d="M31 42 H69 V53 C69 66 61 73 50 73 C39 73 31 66 31 53 Z"/><path d="M50 73 V82"/>`,
  a2a: `<circle cx="27" cy="50" r="11"/><circle cx="73" cy="50" r="11"/><path d="M38 50 H62"/><circle cx="50" cy="50" r="4"/>`,
  rag: `<ellipse cx="43" cy="31" rx="18" ry="7"/><path d="M25 31 V57 C25 62 33 65 43 65 C53 65 61 62 61 57 V31 M25 44 C25 49 33 52 43 52 C53 52 61 49 61 44"/><circle cx="63" cy="64" r="9"/><path d="M70 71 L80 81"/>`,
  skill: `<rect x="24" y="40" width="52" height="30" rx="5"/><path d="M41 40 V33 C41 26 59 26 59 33 V40 M24 53 H76"/>`,
  'ai-coding-agent': `<path d="M35 32 L21 50 35 68 M65 32 L79 50 65 68"/><path d="M54 27 L46 73"/>`,
  'multi-agent': `<circle cx="50" cy="24" r="8"/><circle cx="24" cy="71" r="8"/><circle cx="76" cy="71" r="8"/><path d="M44 30 L31 63 M56 30 L69 63 M32 71 H68"/>`,
  'deep-reasoning': `<path d="M44 25 C30 25 26 38 32 44 C23 50 27 65 40 67 C44 75 60 75 62 67 C73 63 73 47 64 43 C70 35 62 25 52 27 C50 23 46 23 44 25 Z"/><path d="M50 33 V61 M41 44 H59"/>`,
  'ai-security': `<path d="M50 16 L79 27 V50 C79 67 66 79 50 85 C34 79 21 67 21 50 V27 Z"/><circle cx="50" cy="45" r="6"/><path d="M50 51 V62"/>`,
  'attention-residuals': `<path d="M20 50 C33 30 67 30 80 50 C67 70 33 70 20 50 Z"/><circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="3"/>`,
  jepa: `<rect x="22" y="22" width="56" height="56" rx="7"/><rect x="37" y="37" width="26" height="26" rx="4"/><circle cx="50" cy="50" r="2.6"/>`,
  'embodied-ai': `<path d="M28 78 H72 M36 78 V60 C36 52 44 52 48 45 L57 33"/><circle cx="61" cy="28" r="6"/><path d="M66 24 L73 17"/>`,
  AItools: `<path d="M63 21 A17 17 0 1 0 73 45 L48 70 A8.5 8.5 0 0 1 31 53 Z"/><path d="M57 27 A9 9 0 0 1 69 39"/>`,
  'cc-switch': `<rect x="22" y="35" width="56" height="30" rx="15"/><circle cx="63" cy="50" r="10"/><path d="M35 50 h10"/>`,
  openclaw: `<path d="M50 80 C29 71 25 50 34 37 M34 37 C40 41 46 39 48 33 M34 37 C30 31 32 23 39 19"/><path d="M50 80 C71 71 75 50 66 37 M66 37 C60 41 54 39 52 33 M66 37 C70 31 68 23 61 19"/><path d="M41 80 H59"/>`,
  'hermes-agent': `<path d="M20 48 C33 37 51 35 66 42 L80 34 C76 46 65 55 50 58 C39 60 27 56 20 48 Z"/><path d="M27 61 C42 66 57 63 68 55"/><path d="M35 44 C45 40 57 40 64 44"/>`,
  nanobot: `<rect x="34" y="38" width="32" height="27" rx="7"/><circle cx="44" cy="51" r="2.6"/><circle cx="56" cy="51" r="2.6"/><path d="M50 38 V27"/><circle cx="50" cy="23" r="3.5"/><path d="M34 71 H66"/>`,
  'deepseek-harness': `<path d="M20 52 C26 38 45 33 58 40 C66 44 72 42 77 35 C78 48 71 60 56 65 C41 70 26 66 20 52 Z"/><path d="M77 35 C81 30 83 25 83 20 C86 27 84 35 79 41"/><circle cx="38" cy="51" r="2.2"/>`,
  'Claude-Code': `<path d="M34 32 L20 50 34 68 M66 32 L80 50 66 68"/><path d="M55 26 L45 74"/><path d="M50 14 v5 M50 81 v5 M14 50 h5 M81 50 h5"/>`,
  ChatGPT: `<path d="M34 32 L20 50 34 68 M66 32 L80 50 66 68"/><path d="M50 42 H50.1 M50 42 V58 M42 50 H58"/>`,
};

// ---------- 文章固定顺序（保证配色/构图分配稳定可复现） ----------
const ARTICLE_ORDER = [
  'Numbertheory', 'Introduction', 'Symmetriccryptography', 'Groupcipher', 'Asymmetriccryptography',
  'HashAndMAC', 'ProtocolAndApplication', 'Bitcoin', 'ModernCryptography',
  'LaTeX', 'ddiancichang',
  'iphoneduozhanghao', 'iphonequchukaiping', 'iphonexianmian',
  '360', 'edgexz', 'winkjj',
  'pip', 'python', 'uv',
  'aixin', 'googletranslate', 'jiaoben', 'jisuanjibiannianshi', 'matlabrose',
  'ohmuzsh', 'ttq', 'tuchuang', 'win',
  'prompt', 'context-engineering', 'agent', 'agentic-ai', 'mcp', 'a2a', 'rag', 'skill',
  'ai-coding-agent', 'multi-agent', 'deep-reasoning', 'ai-security', 'attention-residuals',
  'jepa', 'embodied-ai', 'AItools', 'cc-switch', 'openclaw', 'hermes-agent', 'nanobot',
  'deepseek-harness', 'Claude-Code', 'ChatGPT',
];

/** 手工微调（含义优先）：slug → { palette, style }，未列出的按顺序自动分配 */
const THEME_OVERRIDES = {
  Bitcoin: { palette: 'amber', style: 'rings' },            // 比特币：金色等高线（币的涟漪）
  aixin: { palette: 'wine', style: 'aurora' },              // 爱心代码：酒红极光
  prompt: { palette: 'cyanNight', style: 'beams' },         // AI 01：青夜光束
  Numbertheory: { palette: 'navy', style: 'constellation' },// 数论：星图
};

// ---------- 组装 ----------
function buildComboAssignments() {
  // 所有（配色×构图）组合确定性洗牌，按 ARTICLE_ORDER 依次发放，跳过被 override 占用的组合
  const names = Object.keys(PALETTES);
  const styles = Object.keys(STYLES);
  const combos = [];
  for (const p of names) for (const s of styles) combos.push({ palette: p, style: s });
  const rnd = mulberry32(20261026);
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  const used = new Set(Object.values(THEME_OVERRIDES).map((o) => o.palette + '|' + o.style));
  const assign = {};
  let ci = 0;
  for (const slug of ARTICLE_ORDER) {
    if (THEME_OVERRIDES[slug]) { assign[slug] = THEME_OVERRIDES[slug]; continue; }
    while (used.has(combos[ci].palette + '|' + combos[ci].style)) ci++;
    assign[slug] = combos[ci];
    used.add(combos[ci].palette + '|' + combos[ci].style);
    ci++;
  }
  return assign;
}

function svg(slug, paletteName, styleName) {
  const p = PALETTES[paletteName];
  const rnd = mulberry32(hashStr(slug));
  const bg = STYLES[styleName](p, rnd);
  const icon = ICONS[slug] || `<circle cx="50" cy="50" r="24"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${p.bg1}"/>
      <stop offset="1" stop-color="${p.bg2}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.78" cy="0.16" r="0.7">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.15" cy="0.85" r="0.6">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  ${bg}
  <g transform="translate(520 155) scale(1.9)" fill="none" stroke="${p.accent}" stroke-opacity="0.95" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    ${icon}
  </g>
  <rect width="800" height="450" filter="url(#grain)" fill="transparent"/>
</svg>
`;
}

// ---------- 主流程 ----------
mkdirSync(OUT, { recursive: true });
const slugs = existsSync(POSTS)
  ? readdirSync(POSTS).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
  : [];

const assign = buildComboAssignments();
// 顺序表之外的 slug（未来新文章）：按 hash 落到某个组合
const names = Object.keys(PALETTES);
const styles = Object.keys(STYLES);

let made = 0;
const missingIcons = [];
for (const slug of slugs) {
  const a = assign[slug] || {
    palette: names[hashStr(slug) % names.length],
    style: styles[(hashStr(slug + 's') >>> 3) % styles.length],
  };
  if (!ICONS[slug]) missingIcons.push(slug);
  writeFileSync(join(OUT, `${slug}.svg`), svg(slug, a.palette, a.style), 'utf8');
  made++;
}

// 清理孤儿封面（已删文章）
const keep = new Set([...slugs, 'post']);
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.svg') && !keep.has(f.replace(/\.svg$/, ''))) rmSync(join(OUT, f));
}
// 默认封面
writeFileSync(join(OUT, 'post.svg'), svg('post', 'charcoal', 'aurora'), 'utf8');

// 校验：配色×构图组合不得重复
const seen = new Set();
let dup = 0;
for (const slug of slugs) {
  const a = assign[slug] || { palette: '@' + hashStr(slug), style: '' };
  const key = a.palette + '|' + a.style;
  if (seen.has(key)) { console.warn(`⚠ 组合重复: ${slug} (${key})`); dup++; }
  seen.add(key);
}

console.log(`封面生成 v3：${made} 篇，${Object.keys(PALETTES).length} 配色 × ${Object.keys(STYLES).length} 构图，组合重复 ${dup}，缺图标：${missingIcons.length ? missingIcons.join(',') : '无'}`);
if (dup > 0) process.exitCode = 1;
