/**
 * 从旧博客（Wcowin的博客，MkDocs 架构）迁移文章到 content/posts/
 *
 * 用法：node scripts/import-wcowin.mjs
 * 幂等：同 slug 直接覆盖；只写入下面 WHITE_LIST 圈定的文章。
 *
 * 转换内容：
 * - front-matter 重写为 NingBlog 子集（title/date/category/tags/cover/description）
 * - date 缺失时用文件修改时间兜底（下载时间，可手改）
 * - MkDocs `!!! type "标题"` 提示块 → blockquote（> **标题**）
 * - pymdownx `=== "标签"` 选项卡 → 【标签】加粗行 + 内容去缩进
 * - 剥离 :material-xxx: / :fontawesome-xxx: 图标 token
 * - 站内 *.md 互链改写为 /posts/<slug>；目标未迁移的链接降级为加粗文字
 * - description 缺失时自动从首段生成（≤60 字）
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../Wcowin的博客/docs/blog');
const DEST = resolve(HERE, '../content/posts');

/** 白名单：要迁移的文件（相对 docs/blog/），skip 的带注释说明 */
const WHITE_LIST = [
  // 密码学（系列学习笔记，9 篇；index.md 是目录页不迁）
  ...['Introduction', 'ModernCryptography', 'Symmetriccryptography', 'Asymmetriccryptography',
    'HashAndMAC', 'Groupcipher', 'Numbertheory', 'ProtocolAndApplication', 'Bitcoin']
    .map((f) => `Cryptography/${f}.md`),
  // 学术（5 篇）
  ...['Academic/LaTeX.md', 'Academic/math.md', 'Academic/Math/13js.md', 'Academic/Math/14.md',
    'Academic/ddiancichang.md'],
  // Mac 教程（11 篇）+ 软件清单
  ...['homebrew', 'jiasugithub', 'jietu', 'kjj', 'Launchpad', 'maccd', 'Macesc', 'Pd',
    'shanchu', 'sunhuai', 'xjiq'].map((f) => `Mac/${f}.md`),
  'macsoft.md',
  // iPhone / Windows / Python
  ...['iphone/iphoneduozhanghao.md', 'iphone/iphonequchukaiping.md', 'iphone/iphonexianmian.md'],
  ...['Win/360.md', 'Win/edgexz.md', 'Win/winkjj.md'],
  ...['py/pip.md', 'py/python.md', 'py/uv.md'],
  // 技巧分享（9 篇；comkdocs 是旧站系统文、kexue 不适合公开站，均不迁）
  ...['technique sharing/aixin.md', 'technique sharing/googletranslate.md', 'technique sharing/jiaoben.md',
    'technique sharing/jisuanjibiannianshi.md', 'technique sharing/matlabrose.md',
    'technique sharing/ohmuzsh.md', 'technique sharing/ttq.md', 'technique sharing/tuchuang.md',
    'technique sharing/win.md'],
];

/** 分类 / 标签 / 封面映射 */
const CATEGORY_RULES = [
  { test: (p) => p.startsWith('Cryptography/'), category: '密码学', tags: ['密码学', '学习笔记'], cover: '/covers/crypto.svg' },
  { test: (p) => p.startsWith('Academic/'), category: '学术', tags: ['学术', '笔记'], cover: '/covers/academic.svg' },
  { test: (p) => p.startsWith('Mac/') || p === 'macsoft.md', category: '教程', tags: ['Mac', '教程'], cover: '/covers/mac.svg' },
  { test: (p) => p.startsWith('iphone/') || p.startsWith('Win/') || p.startsWith('py/'), category: '教程', tags: [], cover: '/covers/tutorial.svg' },
  { test: (p) => p.startsWith('technique sharing/'), category: '技巧', tags: ['技巧'], cover: '/covers/tips.svg' },
];
const SPECIAL_TAGS = {
  'iphone/': ['iPhone', '教程'],
  'Win/': ['Windows', '教程'],
  'py/': ['Python', '教程'],
};
const SPECIAL_COVER = { 'technique sharing/jisuanjibiannianshi.md': '/covers/timeline.svg' };

/** !!! 类型 → 中文标题 */
const ADMONITION_CN = {
  note: '笔记', tip: '小贴士', info: '说明', warning: '注意', danger: '危险', bug: 'Bug',
  example: '例子', question: '问题', success: '正确做法', failure: '错误做法', quote: '引用', abstract: '摘要',
};

// ---------- 解析旧 front-matter（--- 包围的 YAML 子集） ----------
function splitFrontMatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  let currentKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (/^\s+-\s?/.test(line) && currentKey) {
      fm[currentKey] = [...(Array.isArray(fm[currentKey]) ? fm[currentKey] : []), line.replace(/^\s+-\s?/, '').trim().replace(/^["']|["']$/g, '')];
    } else {
      const kv = /^([\w-]+):\s*(.*)$/.exec(line);
      if (kv) {
        currentKey = kv[1];
        let v = kv[2].trim();
        if (v === '>' || v === '|' || v === '') { fm[currentKey] = ''; continue; } // 块标量：值在后续缩进行
        if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
        fm[currentKey] = v;
      }
    }
  }
  // 块标量 > ：把紧随其后的缩进行拼进值（后面是列表行的空值 key 不算块标量）
  const fmLines = m[1].split(/\r?\n/);
  let inBlockScalar = null;
  for (let idx = 0; idx < fmLines.length; idx++) {
    const line = fmLines[idx];
    const kv = /^([\w-]+):\s*(>|)$/.exec(line);
    if (kv) {
      const next = fmLines[idx + 1] || '';
      if (/^\s+-/.test(next)) { continue; } // 列表项，第一遍已解析
      inBlockScalar = kv[1];
      fm[kv[1]] = '';
      continue;
    }
    if (inBlockScalar && /^\s+\S/.test(line)) {
      fm[inBlockScalar] = `${fm[inBlockScalar]} ${line.trim()}`.trim();
      continue;
    }
    if (line.trim() !== '') inBlockScalar = null;
  }
  return { fm, body: m[2] };
}

// ---------- 正文转换 ----------
function convertAdmonitions(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = /^!!!\s+([\w-]+)(?:\s+"([^"]*)")?\s*$/.exec(lines[i]);
    if (!m) { out.push(lines[i]); continue; }
    const title = m[2] || ADMONITION_CN[m[1]] || m[1];
    out.push(`> **${title}**`);
    let j = i + 1;
    while (j < lines.length && (/^\s{4,}/.test(lines[j]) || lines[j].trim() === '')) {
      if (lines[j].trim() === '') {
        // 空行：后面还有缩进行才继续
        const next = lines.slice(j + 1).find((l) => l.trim() !== '');
        if (next && /^\s{4,}/.test(next)) { out.push('>'); j++; continue; }
        break;
      }
      out.push(`> ${lines[j].replace(/^\s{4}/, '')}`);
      j++;
    }
    out.push('');
    i = j - 1;
  }
  return out.join('\n');
}

function convertTabs(text) {
  const out = [];
  let dedent = false;
  for (const line of text.split(/\r?\n/)) {
    const m = /^===\s+"([^"]*)"\s*$/.exec(line);
    if (m) { out.push(`**【${m[1]}】**`); dedent = true; continue; }
    if (dedent) {
      if (line.trim() === '') { out.push(''); continue; }
      if (/^\s{4,}/.test(line)) { out.push(line.replace(/^\s{4}/, '')); continue; }
      dedent = false;
    }
    out.push(line);
  }
  return out.join('\n');
}

function rewriteLinks(text, migratedSlugs) {
  return text.replace(/\]\(([^)\s]+\.md)([^)]*)\)/g, (whole, target, suffix) => {
    const slug = basename(target.replace(/^\.\//, '').replace(/^\.\.\//, '')).replace(/\.md$/, '');
    if (migratedSlugs.has(slug)) return `](/posts/${slug}${suffix})`;
    return `](#${slug})`; // 目标未迁移：降级为页内无效锚，避免跳到 404
  });
}

function stripIconTokens(text) {
  return text.replace(/:(material|fontawesome|octicons|simple-icons)[\w-]*:/g, '');
}

function genDescription(body) {
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || /^(#|!\[|>|\||```|---|===)/.test(t)) continue;
    const plain = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim();
    if (plain.length < 8) continue;
    return plain.length > 60 ? `${plain.slice(0, 58)}…` : plain;
  }
  return '';
}

// ---------- 主流程 ----------
const migratedSlugs = new Set(WHITE_LIST.map((p) => basename(p, '.md')));
let ok = 0;
const failures = [];

for (const rel of WHITE_LIST) {
  const srcPath = join(SRC, rel);
  const slug = basename(rel, '.md');
  try {
    const raw = readFileSync(srcPath, 'utf8');
    const { fm, body } = splitFrontMatter(raw);
    const rule = CATEGORY_RULES.find((r) => r.test(rel));
    const stat = statSync(srcPath);

    let date = String(fm.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
      date = new Date(stat.mtime).toISOString().slice(0, 10);
    }
    const oldCats = Array.isArray(fm.categories) ? fm.categories : fm.categories ? [fm.categories] : [];
    const category = oldCats[0] && rel.startsWith('posts/') ? oldCats[0] : rule.category;
    const oldTags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    const special = Object.entries(SPECIAL_TAGS).find(([k]) => rel.startsWith(k));
    const ruleTags = special ? special[1] : (rule?.tags || []);
    const tags = [];
    for (const t of [...ruleTags, ...oldTags]) {
      const v = String(t || '').trim();
      if (v && !tags.some((x) => x.toLowerCase() === v.toLowerCase())) tags.push(v);
    }

    let content = convertAdmonitions(body);
    content = convertTabs(content);
    content = stripIconTokens(content);
    content = rewriteLinks(content, migratedSlugs).trim();

    // 标题：front-matter 缺失时回退到正文首个 H1
    const h1 = /^#\s+(.+?)\s*$/m.exec(body);
    const title = String(fm.title || (h1 ? h1[1] : '') || slug).trim();

    const description = String(fm.description || '').trim() || genDescription(content);
    const cover = SPECIAL_COVER[rel] || rule?.cover || '';

    const front = [
      '---',
      `title: ${title}`,
      `date: ${date}`,
      `category: ${category}`,
      `tags: [${tags.join(', ')}]`,
      `cover: ${cover}`,
      `description: ${description}`,
      '---',
      '',
    ].join('\n');

    writeFileSync(join(DEST, `${slug}.md`), front + content + '\n', 'utf8');
    ok++;
  } catch (e) {
    failures.push(`${rel}: ${e.message}`);
  }
}

console.log(`迁移完成：${ok}/${WHITE_LIST.length} 篇 → ${DEST}`);
if (failures.length) {
  console.log('失败：');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exitCode = 1;
}
