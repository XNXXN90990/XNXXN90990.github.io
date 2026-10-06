/**
 * gen-content.mjs —— 内容构建脚本（npm run dev / build 前自动执行）
 *
 * 1. 公开文章：扫描 content/posts/*.md，解析 front-matter，生成 src/content/manifest.json
 * 2. 私人文章：扫描 content/private/*.md（含「访问码」），用 AES-GCM 加密后
 *    生成 src/content/private-encrypted.json（密文，可安全提交到公开仓库）
 *
 * 私人空间访问码的明文只存在于 content/private/ 目录（已 gitignore，不会上传）。
 * 仓库被扒也只能看到密文，不知道访问码就解不开。
 *
 * 换密码流程：改 content/private/ 下对应文件里的「访问码」，重新跑 npm run dev 或 build 即可。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const PRIVATE_DIR = path.join(ROOT, 'content', 'private');
const OUT_DIR = path.join(ROOT, 'src', 'content');

// ---------- 基础工具 ----------

/** 极简 front-matter 解析（--- 包围的 YAML 子集：key: value / key: [a, b]） */
function parseFrontMatter(raw) {
  if (!raw.startsWith('---')) return { attributes: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { attributes: {}, body: raw };
  const head = raw.slice(3, end).trim();
  const body = raw.slice(raw.indexOf('\n', end + 1) + 1);
  const attributes = {};
  for (const line of head.split('\n')) {
    const m = line.match(/^([A-Za-z_\u4e00-\u9fa5][^:]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    attributes[key] = value;
  }
  return { attributes, body };
}

function b64(buf) {
  return Buffer.from(buf).toString('base64');
}

function str2ab(str) {
  return new TextEncoder().encode(str);
}

/** 与前端 src/utils/privateCrypto.js 保持一致的加密方案 */
async function deriveKey(code, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', str2ab(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJson(obj, code) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(code, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, str2ab(JSON.stringify(obj)));
  return { salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

// ---------- 1. 文章清单（公开文章 + 杂想，同一套 front-matter 规则） ----------

/** 扫描某个 markdown 目录并生成 manifest 数组 */
function scanManifest(dir, label) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  const list = [];
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { attributes } = parseFrontMatter(raw);
    const fmDate = attributes.date || attributes.updated || '';
    list.push({
      id,
      title: attributes.title || id,
      date: fmDate,
      updateTime: attributes.updated || fmDate,
      tags: Array.isArray(attributes.tags) ? attributes.tags : attributes.tags ? [attributes.tags] : [],
      category: Array.isArray(attributes.category) ? attributes.category : attributes.category ? [attributes.category] : [],
      cover: attributes.cover || '',
      description: attributes.description || '',
      pinned: String(attributes.pinned || '') === 'true',
      featured: String(attributes.featured || '') === 'true'
    });
  }
  list.sort((a, b) => {
    const ta = Date.parse(a.updateTime || a.date || '') || 0;
    const tb = Date.parse(b.updateTime || b.date || '') || 0;
    if (ta !== tb) return tb - ta;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  console.log(`[gen-content] ${label} ${list.length} 篇`);
  return list;
}

function genPublicManifest() {
  const posts = scanManifest(POSTS_DIR, '公开文章');
  const thoughts = scanManifest(path.join(ROOT, 'content', 'thoughts'), '杂想');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(posts, null, 2), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'thoughts-manifest.json'), JSON.stringify(thoughts, null, 2), 'utf-8');
  console.log(`[gen-content] 清单 → src/content/manifest.json + thoughts-manifest.json`);
  return posts;
}

// ---------- 2. 私人文章加密 ----------

async function genPrivateContent() {
  const outFile = path.join(OUT_DIR, 'private-encrypted.json');
  const hasSource = fs.existsSync(PRIVATE_DIR) && fs.readdirSync(PRIVATE_DIR).some((f) => f.endsWith('.md'));

  if (!hasSource) {
    // 本地没有私人文章源文件（比如 CI 环境）：保留仓库里已提交的密文
    if (fs.existsSync(outFile)) {
      console.log('[gen-content] 未找到 content/private/ 源文件，沿用已提交的 private-encrypted.json');
      return;
    }
    fs.writeFileSync(outFile, JSON.stringify({ version: 1, space: null, articles: [] }, null, 2), 'utf-8');
    console.log('[gen-content] 无私人文章，生成空的 private-encrypted.json');
    return;
  }

  // 空间总门码：content/private/空间配置.json { "spaceCode": "xxxx" }
  let spaceCode = '';
  const spaceConfPath = path.join(PRIVATE_DIR, '空间配置.json');
  if (fs.existsSync(spaceConfPath)) {
    try {
      const conf = JSON.parse(fs.readFileSync(spaceConfPath, 'utf-8'));
      spaceCode = String(conf.spaceCode || '').trim();
    } catch (e) {
      console.error('[gen-content] 空间配置.json 解析失败：', e.message);
    }
  }
  if (!spaceCode) {
    console.warn('[gen-content] ⚠ 未在 content/private/空间配置.json 里配置 spaceCode，私人空间将无法设置门禁');
  }

  const files = fs.readdirSync(PRIVATE_DIR).filter((f) => f.endsWith('.md'));
  const articles = [];
  const entries = [];
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(PRIVATE_DIR, file), 'utf-8');
    const { attributes } = parseFrontMatter(raw);
    const code = String(attributes['访问码'] || attributes.code || '').trim();
    if (!code) {
      console.warn(`[gen-content] ⚠ 私人文章 ${file} 没有「访问码」，已跳过（没有访问码无法解密）`);
      continue;
    }
    const meta = {
      title: attributes.title || id,
      date: attributes.date || '',
      description: attributes.description || '',
      tags: Array.isArray(attributes.tags) ? attributes.tags : attributes.tags ? [attributes.tags] : []
    };
    const blob = await encryptJson({ ...meta, content: raw }, code);
    articles.push({ id, blob });
    entries.push({ id, ...meta });
    console.log(`[gen-content] 已加密私人文章：${file}`);
  }

  // 文章目录（标题/日期/简介）用空间门码加密：输入门码后才能看到列表内容
  const space = spaceCode ? { blob: await encryptJson({ entries }, spaceCode) } : null;
  fs.writeFileSync(outFile, JSON.stringify({ version: 1, space, articles }, null, 2), 'utf-8');
  console.log(`[gen-content] 私人文章 ${articles.length} 篇 → src/content/private-encrypted.json（密文）`);
}

// ---------- 执行 ----------

genPublicManifest();
await genPrivateContent();
