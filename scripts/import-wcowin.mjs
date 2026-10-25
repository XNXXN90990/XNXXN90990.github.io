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
const SRC_BLOG = resolve(HERE, '../../Wcowin的博客/docs/blog');
const SRC_CACHE = resolve(HERE, '.cache/wcowin-src/docs'); // git 稀疏克隆的源仓库
const DEST = resolve(HERE, '../content/posts');

/** 路径前缀 cache:// 表示从 .cache/wcowin-src/docs/ 取（在线仓库新文章），否则从旧本地拷贝取 */
function srcPath(rel) {
  return rel.startsWith('cache://') ? join(SRC_CACHE, rel.slice(7)) : join(SRC_BLOG, rel);
}

/** 白名单：要迁移的文件（相对各自源根）。
 *  cache:// 前缀 = .cache/wcowin-src/docs（在线仓库新文章），其余 = 旧本地拷贝。
 *  已排除：Mac/数学竞赛、旧站系统文（websitebeauty/Mkdocs/Zensical）、kexue、update 系列/HelloWorld/sim-card、deepseek.md（644B 占位壳）。 */
const WHITE_LIST = [
  // 网络安全/密码学 系列（9 篇，顺序 = 学习路径）
  ...['Numbertheory', 'Introduction', 'Symmetriccryptography', 'Groupcipher', 'Asymmetriccryptography',
    'HashAndMAC', 'ProtocolAndApplication', 'Bitcoin', 'ModernCryptography']
    .map((f) => `Cryptography/${f}.md`),
  // 学术（2 篇）
  ...['Academic/LaTeX.md', 'Academic/ddiancichang.md'],
  // iPhone / Windows / Python
  ...['iphone/iphoneduozhanghao.md', 'iphone/iphonequchukaiping.md', 'iphone/iphonexianmian.md'],
  ...['Win/360.md', 'Win/edgexz.md', 'Win/winkjj.md'],
  ...['py/pip.md', 'py/python.md', 'py/uv.md'],
  // 技巧分享（9 篇）
  ...['technique sharing/aixin.md', 'technique sharing/googletranslate.md', 'technique sharing/jiaoben.md',
    'technique sharing/jisuanjibiannianshi.md', 'technique sharing/matlabrose.md',
    'technique sharing/ohmuzsh.md', 'technique sharing/ttq.md', 'technique sharing/tuchuang.md',
    'technique sharing/win.md'],
  // AI 系列（23 篇，来自在线仓库；顺序 = 原站 index 学习路径：基础概念→基础设施→进阶架构→实战工具）
  ...['prompt', 'context-engineering', 'agent', 'agentic-ai', 'mcp', 'a2a', 'rag', 'skill',
    'ai-coding-agent', 'multi-agent', 'deep-reasoning', 'ai-security', 'attention-residuals',
    'jepa', 'embodied-ai', 'cc-switch', 'openclaw', 'hermes-agent', 'nanobot',
    'deepseek-harness'].map((f) => `cache://develop/AI/${f}.md`),
  'cache://develop/AItools.md',
  'cache://develop/Claude-Code.md',
  'cache://develop/ChatGPT.md',
];

/** 系列定义：标题加编号前缀 + front-matter 写入 series/seriesOrder（归档页按此分组） */
const SERIES = {
  'Cryptography/': {
    name: '密码学',
    short: '密码学',
    order: ['Numbertheory', 'Introduction', 'Symmetriccryptography', 'Groupcipher', 'Asymmetriccryptography',
      'HashAndMAC', 'ProtocolAndApplication', 'Bitcoin', 'ModernCryptography'],
  },
  'cache://develop/AI/': {
    name: 'AI 系列',
    short: 'AI',
    order: ['prompt', 'context-engineering', 'agent', 'agentic-ai', 'mcp', 'a2a', 'rag', 'skill',
      'ai-coding-agent', 'multi-agent', 'deep-reasoning', 'ai-security', 'attention-residuals',
      'jepa', 'embodied-ai', 'AItools', 'cc-switch', 'openclaw', 'hermes-agent', 'nanobot',
      'deepseek-harness'],
  },
};

/** 日期指定：旧站多数文章无日期，这里按系列学习路径/季节自然铺开（可随时手改） */
const DATE_OVERRIDES = {
  // 密码学系列：2025 秋季学期逐章推进
  Numbertheory: '2025-09-18', Introduction: '2025-09-30', Symmetriccryptography: '2025-10-14',
  Groupcipher: '2025-10-26', Asymmetriccryptography: '2025-11-08', HashAndMAC: '2025-11-20',
  ProtocolAndApplication: '2025-12-03', Bitcoin: '2025-12-15', ModernCryptography: '2025-12-27',
  // 学术
  ddiancichang: '2026-01-05', LaTeX: '2026-01-12',
  // iPhone
  iphoneduozhanghao: '2026-01-20', iphonequchukaiping: '2026-02-03', iphonexianmian: '2026-02-14',
  // Windows（2025 秋）
  '360': '2025-10-08', edgexz: '2025-10-22', winkjj: '2025-11-05',
  // Python（2026 春）
  pip: '2026-02-25', python: '2026-03-10', uv: '2026-03-22',
  // 技巧分享
  googletranslate: '2025-12-10', matlabrose: '2026-01-28', ohmuzsh: '2026-03-05',
  jiaoben: '2026-04-08', ttq: '2026-04-22', tuchuang: '2026-03-28',
  aixin: '2026-05-20', jisuanjibiannianshi: '2026-06-01', win: '2026-06-15',
  // AI 系列：2026-05 起按学习路径推进
  prompt: '2026-05-10', 'context-engineering': '2026-06-04', agent: '2026-06-12',
  'agentic-ai': '2026-06-20', mcp: '2026-06-28', a2a: '2026-07-05', rag: '2026-07-12',
  skill: '2026-07-18', 'ai-coding-agent': '2026-07-26', 'multi-agent': '2026-08-02',
  'deep-reasoning': '2026-08-08', 'ai-security': '2026-08-15', 'attention-residuals': '2026-08-22',
  jepa: '2026-08-28', 'embodied-ai': '2026-09-03', AItools: '2026-09-10', 'cc-switch': '2026-09-16',
  openclaw: '2026-09-24', 'hermes-agent': '2026-10-01', nanobot: '2026-10-08',
  'deepseek-harness': '2026-10-14', 'Claude-Code': '2026-10-18', ChatGPT: '2026-10-22',
};

/** AI 分类与系列（与 CATEGORY_RULES 里的目录规则分开，cache:// 路径单独判断） */
const AI_DIR = 'cache://develop/AI/';
const AI_STANDALONE = ['cache://develop/Claude-Code.md', 'cache://develop/ChatGPT.md'];

/** 分类 / 标签映射（封面统一逐篇生成：/covers/<slug>.svg） */
const CATEGORY_RULES = [
  { test: (p) => p.startsWith('Cryptography/'), category: '网络安全', tags: ['密码学', '系列'] },
  { test: (p) => p.startsWith('Academic/'), category: '学术', tags: ['学术', '笔记'] },
  { test: (p) => p.startsWith('iphone/'), category: '教程', tags: ['iPhone', '教程'] },
  { test: (p) => p.startsWith('Win/'), category: '教程', tags: ['Windows', '教程'] },
  { test: (p) => p.startsWith('py/'), category: '教程', tags: ['Python', '教程'] },
  { test: (p) => p.startsWith('technique sharing/'), category: '技巧', tags: ['技巧'] },
  { test: (p) => p.startsWith('cache://develop/AI') || AI_STANDALONE.includes(p), category: 'AI', tags: ['AI', '系列'] },
];

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
  return text
    .replace(/:(material|fontawesome|octicons|simple-icons)[\w-]*:/g, '')
    .replace(/\{\s*\.[\w. -]*\s*\}/g, ''); // mkdocs 属性列表（{.lg .middle}），要求点号开头不伤代码
}

function genDescription(body) {
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || /^(#|!\[|>|\||```|---|===|<)/.test(t)) continue;
    const plain = t
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/:(material|fontawesome|octicons|simple-icons)[\w-]*:/g, '')
      .replace(/\{\s*\.[\w. -]*\s*\}/g, '') // mkdocs 属性列表残留
      .replace(/^-\s+/, '')
      .replace(/[*_`~]/g, '')
      .trim();
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
  const file = srcPath(rel);
  const slug = basename(rel, '.md');
  try {
    const raw = readFileSync(file, 'utf8');
    const { fm, body } = splitFrontMatter(raw);
    const rule = CATEGORY_RULES.find((r) => r.test(rel));
    const stat = statSync(file);

    let date = DATE_OVERRIDES[slug] || String(fm.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
      date = new Date(stat.mtime).toISOString().slice(0, 10);
    }
    const category = rule.category;
    const oldTags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    const tags = [];
    for (const t of [...(rule?.tags || []), ...oldTags]) {
      const v = String(t || '').trim();
      if (v && !tags.some((x) => x.toLowerCase() === v.toLowerCase())) tags.push(v);
    }

    let content = convertAdmonitions(body);
    content = convertTabs(content);
    content = stripIconTokens(content);
    content = rewriteLinks(content, migratedSlugs).trim();

    // 标题：front-matter 缺失时回退到正文首个 H1；系列文章加「系列名 NN ·」编号前缀
    const h1 = /^#\s+(.+?)\s*$/m.exec(body);
    let title = String(fm.title || (h1 ? h1[1] : '') || slug).trim();
    const seriesEntry = Object.entries(SERIES).find(([, cfg]) => cfg.order.includes(slug));
    let seriesLine = '';
    if (seriesEntry) {
      const [prefix, cfg] = seriesEntry;
      const idx = cfg.order.indexOf(slug);
      if (idx >= 0) {
        title = `${cfg.short} ${String(idx + 1).padStart(2, '0')} · ${title}`;
        seriesLine = `series: ${cfg.name}\nseriesOrder: ${idx + 1}\n`;
      }
    }

    const description = String(fm.description || '').trim() || genDescription(content);
    const cover = `/covers/${slug}.svg`;

    const front = [
      '---',
      `title: ${title}`,
      `date: ${date}`,
      `category: ${category}`,
      `tags: [${tags.join(', ')}]`,
      `cover: ${cover}`,
      `description: ${description}`,
      seriesLine,
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
