/**
 * 统一风格文章封面生成器：node scripts/gen-covers.mjs
 * 输出 public/covers/*.svg（800×450）。
 *
 * 视觉系统：石墨墨色底 + 各系列专属「辉光 + 流线 + 同心环 + 点阵」，
 * 不带文字（卡片标题在封面下方另排），同一套构图参数按系列变色调 / 变相位。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/covers');
mkdirSync(OUT, { recursive: true });

const SERIES = [
  { name: 'post',     accent: '#8a93a8', glow: [0.78, 0.18], phase: 0 },
  { name: 'crypto',   accent: '#8b7bff', glow: [0.82, 0.12], phase: 1 },
  { name: 'academic', accent: '#6fa8ff', glow: [0.20, 0.14], phase: 2 },
  { name: 'ios',      accent: '#4fd6c8', glow: [0.75, 0.22], phase: 3 },
  { name: 'windows',  accent: '#90a8d0', glow: [0.24, 0.20], phase: 4 },
  { name: 'python',   accent: '#ffd166', glow: [0.80, 0.16], phase: 5 },
  { name: 'tips',     accent: '#ff8f7d', glow: [0.22, 0.16], phase: 6 },
];

/** 三条流线：按相位做水平错位 + 起伏幅度微调 */
function flowPaths(phase) {
  const dx = (phase % 3) * 60 - 60;
  const dy = Math.floor(phase / 3) * 26;
  const amp = 1 + (phase % 4) * 0.08;
  const y = (v) => (v + dy).toFixed(1);
  const x = (v) => (v + dx).toFixed(1);
  return [
    `M ${x(-60)} ${y(302)} C ${x(200)} ${y(302 - 42 * amp)}, ${x(380)} ${y(356 + 20 * amp)}, ${x(560)} ${y(302)} S ${x(820)} ${y(246)}, ${x(880)} ${y(282)}`,
    `M ${x(-60)} ${y(342)} C ${x(230)} ${y(342 - 30 * amp)}, ${x(410)} ${y(382 + 16 * amp)}, ${x(600)} ${y(336)} S ${x(840)} ${y(286)}, ${x(880)} ${y(318)}`,
    `M ${x(-60)} ${y(378)} C ${x(210)} ${y(378 - 22 * amp)}, ${x(430)} ${y(408 + 12 * amp)}, ${x(620)} ${y(372)} S ${x(850)} ${y(336)}, ${x(880)} ${y(356)}`,
  ];
}

function svg({ accent, glow, phase }) {
  const [gx, gy] = glow;
  const curves = flowPaths(phase)
    .map(
      (d, i) =>
        `<path d="${d}" fill="none" stroke="${accent}" stroke-opacity="${[0.5, 0.3, 0.16][i]}" stroke-width="${[2.4, 1.7, 1.1][i]}"${i === 1 ? ' stroke-dasharray="7 9"' : ''} stroke-linecap="round"/>`,
    )
    .join('\n  ');
  const ringCx = 150 + (phase % 4) * 130;
  const dots = Array.from({ length: 18 }, (_, i) => {
    const cx = 72 + (i % 6) * 22;
    const cy = 366 + Math.floor(i / 6) * 20;
    return `<circle cx="${cx}" cy="${cy}" r="2.2" fill="#ffffff" fill-opacity="${0.05 + (i % 3) * 0.045}"/>`;
  }).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.65" y2="1">
      <stop offset="0" stop-color="#0e1118"/>
      <stop offset="1" stop-color="#181d29"/>
    </linearGradient>
    <radialGradient id="glow" cx="${gx}" cy="${gy}" r="0.72">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.26"/>
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
  <g fill="none" stroke="#ffffff" stroke-opacity="0.07">
    <circle cx="${ringCx}" cy="118" r="132"/>
    <circle cx="${ringCx}" cy="118" r="86"/>
    <circle cx="${ringCx}" cy="118" r="44"/>
  </g>
  ${curves}
  ${dots}
  <rect width="800" height="450" filter="url(#grain)" fill="transparent"/>
</svg>
`;
}

for (const s of SERIES) {
  writeFileSync(join(OUT, `${s.name}.svg`), svg(s), 'utf8');
  console.log('生成', `${s.name}.svg`);
}
