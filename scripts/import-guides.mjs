/**
 * import-guides.mjs —— 把开源指南文档导入站内（手动执行：npm run import-guides）
 *
 * 数据来源（本地素材文件夹，不入仓库）：
 *   素材/北大CS自学指南     (MkDocs)  → content/guide/cs-self-learning/
 *   素材/上海交通大学生存手册 (GitBook) → content/guide/sjtu-survival/
 *   素材/IC自学指南          (MkDocs)  → content/guide/ic-guide/
 *
 * 做四件事：
 *   1. 按 nav/SUMMARY 收录的章节拷贝 md 到 content/guide/<gid>/（保持相对路径）
 *   2. 重写 md 内部链接（*.md → /guide/<gid>/<路径>）与图片路径（→ /guide-assets/<gid>/...）
 *   3. 拷贝被引用的图片等资源到 public/guide-assets/<gid>/
 *   4. 生成 src/content/guides.json（章节树 + 出处信息），提交后在 CI 直接可用
 *
 * 版权：三个项目均为开源（MIT / 社区维护），导入时保留出处标注，版权归原作者所有。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MATERIALS = path.resolve(ROOT, '..', '素材');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.avif']);

const GUIDES = [
  {
    id: 'cs-self-learning',
    title: 'CS 自学指南',
    src: path.join(MATERIALS, '北大CS自学指南'),
    mode: 'mkdocs',
    docsDir: 'docs',
    intro:
      '来自北京大学的计算机科学自学指南。收录了欧美名校公开课的完整自学路线：数学基础、编程入门、数据结构与算法、计算机系统、人工智能……让任何人都能凭借优质开源资源，在两三年内成长为功底扎实的程序员。',
    source: {
      author: 'PKUFlyingPig（北京大学）',
      site: 'https://csdiy.wiki',
      repo: 'https://github.com/PKUFlyingPig/cs-self-learning',
      license: 'MIT'
    }
  },
  {
    id: 'sjtu-survival',
    title: '上海交通大学生存手册',
    src: path.join(MATERIALS, '上海交通大学生存手册'),
    mode: 'gitbook',
    docsDir: '.',
    intro:
      '2008 年由一群上海交通大学本科生写就的传奇手册，十二年后由社区重新维护。关于志向、思维方式、学习方式、生存技巧与出路选择的真诚长谈——虽然出身交大，但对每一名大学生都值得一读。',
    source: {
      author: 'SurviveSJTU 社区（原书：2008 级交大本科生团队）',
      site: 'https://survivesjtu.github.io/SJTU-Survival-Guide/',
      repo: 'https://github.com/SurviveSJTU/SJTU-Survival-Guide',
      license: '开源社区维护'
    }
  },
  {
    id: 'ic-guide',
    title: 'IC 自学指南',
    src: path.join(MATERIALS, 'IC自学指南'),
    mode: 'mkdocs',
    docsDir: 'docs',
    intro:
      '来自复旦大学集成电路（微电子）专业的自学指南。包含 17 个科研方向导览（器件与制造、模拟射频、计算架构、EDA、量子芯片……）、分学科课程地图与工程工具教程，是摸清集成电路学习路径的宝藏地图。',
    source: {
      author: 'Crys-Chen（复旦大学）',
      site: 'https://crys-chen.github.io/ic-guide/',
      repo: 'https://github.com/Crys-Chen/ic-guide',
      license: 'MIT'
    }
  }
];

// ---------- 工具 ----------

function walk(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) {
      if (name === '.git' || name === '.github' || name === '.gitbook') continue;
      walk(full, base, out);
    } else {
      out.push({ full, rel });
    }
  }
  return out;
}

/** 尝试按原始 / URL 解码路径定位文件 */
function resolveFile(docsRoot, relFromDoc, target) {
  if (/^(https?:|data:|mailto:|#)/i.test(target)) return null;
  const clean = target.split('#')[0].split('?')[0];
  if (!clean) return null;
  for (const cand of [clean, (() => { try { return decodeURIComponent(clean); } catch { return clean; } })()]) {
    const abs = path.resolve(docsRoot, relFromDoc, cand);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

/** 相对 docs 根的资源路径（正斜杠） */
const relToRoot = (docsRoot, abs) => path.relative(docsRoot, abs).split(path.sep).join('/');

/** 去掉可能的 front-matter */
function stripFrontMatter(text) {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return text;
  return text.slice(text.indexOf('\n', end + 1) + 1);
}

// ---------- 链接/图片重写 ----------

function rewriteMarkdown(text, docsRoot, docRelDir, gid, assetsCopied) {
  // 图片：![alt](src) / ![alt](src "title") / HTML <img src="">
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, alt, src) => {
    const abs = resolveFile(docsRoot, docRelDir, src);
    if (!abs) return m; // 外链或缺失，保持原样
    const rel = relToRoot(docsRoot, abs);
    assetsCopied.set(rel, abs);
    return `![${alt}](/guide-assets/${gid}/${encodeURI(rel)})`;
  });
  text = text.replace(/<img\s[^>]*src="([^"]+)"[^>]*>/gi, (m, src) => {
    const abs = resolveFile(docsRoot, docRelDir, src);
    if (!abs) return m;
    const rel = relToRoot(docsRoot, abs);
    assetsCopied.set(rel, abs);
    return m.replace(src, `/guide-assets/${gid}/${encodeURI(rel)}`);
  });

  // 站内 md 链接：[text](xxx.md#anchor)
  text = text.replace(/\[([^\]]*)\]\(([^)\s]+\.md)(#[^)\s]*)?(?:\s+"[^"]*")?\)/gi, (m, label, target, anchor) => {
    const abs = resolveFile(docsRoot, docRelDir, target);
    if (!abs) return m;
    const rel = relToRoot(docsRoot, abs).replace(/\.md$/i, '');
    return `[${label}](/guide/${gid}/${encodeURI(rel)}${anchor || ''})`;
  });

  return text;
}

// ---------- nav 解析 ----------

/** MkDocs nav（YAML 子集）→ 树；兼容 navigation.indexes 的裸字符串节点。
 *  不用 js-yaml：部分源文件的 nav 存在重复键，标准解析器会直接抛错。 */
function parseMkdocsNav(ymlText) {
  // 截取 nav: 段（到下一个顶格 key 为止）
  const lines = ymlText.split(/\r?\n/);
  const start = lines.findIndex((l) => /^nav:\s*$/.test(l));
  if (start === -1) return [];
  const section = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_][\w-]*:/.test(lines[i])) break;
    section.push(lines[i]);
  }

  const root = { title: null, path: null, children: [] };
  const stack = [{ indent: -1, node: root }];

  for (const line of section) {
    const m = line.match(/^(\s*)-\s+(.*)$/);
    if (!m) continue;
    const indent = m[1].replace(/\t/g, '    ').length;
    const body = m[2].trim();

    // 解析 "- 标题: 值" / "- 标题:" / "- 路径"（标题可能带引号且含冒号）
    let node;
    const quotedKey = body.match(/^"((?:[^"\\]|\\.)*)":\s*(.*)$/);
    const plainKey = !quotedKey && body.match(/^(.+?):\s*(.*)$/);
    if (quotedKey || plainKey) {
      const title = quotedKey ? quotedKey[1] : plainKey[1].trim().replace(/^["']|["']$/g, '');
      const value = (quotedKey ? quotedKey[2] : plainKey[2]).trim().replace(/^["']|["']$/g, '');
      node = value ? { title, path: value, children: [] } : { title, path: null, children: [] };
    } else {
      const value = body.replace(/^["']|["']$/g, '');
      node = { title: null, path: value, children: [] }; // 裸路径 = 分组首页
    }

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ indent, node });
  }
  return root.children;
}

/** GitBook SUMMARY.md → 树（依据缩进层级） */
function parseGitbookNav(text) {
  const root = { title: null, path: null, children: [] };
  const stack = [{ node: root, depth: -1 }];
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.match(/^[\t ]*/)[0];
    const depth = Math.floor((indent.replace(/\t/g, '    ').length) / 2);
    const m = rawLine.trim().match(/^\*?\s*\[([^\]]+)\]\(([^)]+)\)/);
    if (!m) continue;
    const node = { title: m[1], path: m[2].split('#')[0], children: [] };
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }
  return root.children;
}

// ---------- 主流程 ----------

function importGuide(guide) {
  const docsRoot = path.join(guide.src, guide.docsDir);
  const outContentDir = path.join(ROOT, 'content', 'guide', guide.id);
  const outAssetsDir = path.join(ROOT, 'public', 'guide-assets', guide.id);

  // 清空旧产物
  for (const dir of [outContentDir, outAssetsDir]) fs.rmSync(dir, { recursive: true, force: true });

  // 1. nav 树
  let tree;
  if (guide.mode === 'mkdocs') {
    tree = parseMkdocsNav(fs.readFileSync(path.join(guide.src, 'mkdocs.yml'), 'utf-8'));
  } else {
    tree = parseGitbookNav(fs.readFileSync(path.join(guide.src, 'SUMMARY.md'), 'utf-8'));
  }

  const assetsCopied = new Map(); // rel -> abs
  let docCount = 0;
  const importedPaths = new Set();

  /** 树节点：校验文件存在、拷贝+重写 md、递归子节点 */
  const processNode = (node) => {
    if (node.path) {
      const p = node.path.split('#')[0];
      const abs = (() => {
        for (const cand of [p, (() => { try { return decodeURIComponent(p); } catch { return p; } })()]) {
          const a = path.join(docsRoot, cand);
          if (fs.existsSync(a) && fs.statSync(a).isFile()) return a;
        }
        return null;
      })();
      if (abs && abs.endsWith('.md')) {
        const rel = relToRoot(docsRoot, abs);
        let text = stripFrontMatter(fs.readFileSync(abs, 'utf-8')).replace(/^\uFEFF/, '');
        text = rewriteMarkdown(text, docsRoot, path.dirname(rel), guide.id, assetsCopied);
        const dest = path.join(outContentDir, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, text, 'utf-8');
        node.path = rel.replace(/\.md$/i, ''); // 站内路由（不带扩展名）
        importedPaths.add(node.path);
        docCount += 1;
      } else {
        console.warn(`  ⚠ 缺失文件，跳过：${node.title || ''} ${node.path}`);
        node.path = null;
      }
    }
    node.children.forEach(processNode);
    // 清理空节点
    node.children = node.children.filter((c) => c.path || c.children.length);
  };
  tree.forEach(processNode);

  // 2. 拷贝资源
  let assetCount = 0;
  for (const [rel, abs] of assetsCopied) {
    const dest = path.join(outAssetsDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    assetCount += 1;
  }

  // 裸字符串节点（navigation.indexes）：用文件名/子节点标题补个可读标题
  const fixTitle = (node, fallback) => {
    if (!node.title) {
      node.title = node.path
        ? path.basename(node.path)
        : (node.children[0] && fixTitle(node.children[0], fallback), node.children[0]?.title) || fallback;
    }
    node.children.forEach((c) => fixTitle(c, fallback));
    return node.title;
  };
  tree.forEach((t, i) => fixTitle(t, `分组 ${i + 1}`));

  console.log(`[import] ${guide.title}: ${docCount} 篇文档, ${assetCount} 个资源`);
  return { id: guide.id, title: guide.title, intro: guide.intro, source: guide.source, chapters: tree };
}

const results = GUIDES.map(importGuide);

const outFile = path.join(ROOT, 'src', 'content', 'guides.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');
console.log(`[import] 完成 → src/content/guides.json（${results.length} 部指南）`);
