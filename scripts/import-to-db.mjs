/**
 * import-to-db.mjs —— 把静态版内容一次性迁移到 AyeezBlog MySQL 数据库
 *
 * 迁移范围：content/posts（含 front-matter 原文）、content/talks.json、
 *          content/links.json、content/albums.json
 * 不迁移：content/thoughts（杂想，暂继续用静态文件，前端混合层会回退读取）
 *
 * 幂等：posts 用 REPLACE（id=文件名 slug），talks/links/albums 先清后插。
 * 用法：node scripts/import-to-db.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import mysql from 'mysql2/promise';

const ROOT = join(import.meta.dirname, '..');

// 连接参数与后端 application-local-secret.yml 保持一致
const DB = { host: '127.0.0.1', port: 3306, user: 'root', password: 'root123', database: 'ayeezblog' };

/** 解析 front-matter（与 gen-content.mjs 同一套简化规则：--- 包裹的 YAML 子集） */
function parseFrontMatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm = {};
  let body = text;
  if (m) {
    body = text.slice(m[0].length);
    let currentKey = null;
    for (const line of m[1].split('\n')) {
      if (/^\s*-\s+/.test(line) && currentKey) {
        (fm[currentKey] = Array.isArray(fm[currentKey]) ? fm[currentKey] : []).push(line.replace(/^\s*-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
      } else if (/^(\w[\w-]*):\s*(.*)$/.test(line)) {
        const key = line.match(/^(\w[\w-]*):\s*(.*)$/);
        currentKey = key[1];
        let val = key[2].trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          fm[currentKey] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        } else if (val === '') {
          fm[currentKey] = null;
        } else {
          fm[currentKey] = val.replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }
  return { fm, body };
}

const toBool = (v) => (v === true || v === 'true' ? 1 : 0);

async function main() {
  const conn = await mysql.createConnection({ ...DB, charset: 'utf8mb4' });
  console.log('已连接 MySQL');

  // ---------- 1. 文章 ----------
  const postsDir = join(ROOT, 'content', 'posts');
  const files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  const categoryCache = new Map();
  const tagCache = new Map();

  async function getCategoryId(name) {
    if (categoryCache.has(name)) return categoryCache.get(name);
    const [rows] = await conn.execute('SELECT id FROM blog_category WHERE name = ? LIMIT 1', [name]);
    let id = rows[0]?.id;
    if (!id) {
      const slug = 'cat-' + Buffer.from(name, 'utf8').toString('hex').slice(0, 24);
      const [r] = await conn.execute('INSERT INTO blog_category (parent_id, name, slug, sort) VALUES (NULL, ?, NULL, 0)', [name]);
      id = r.insertId;
    }
    categoryCache.set(name, id);
    return id;
  }
  async function getTagId(name) {
    if (tagCache.has(name)) return tagCache.get(name);
    const [rows] = await conn.execute('SELECT id FROM blog_tag WHERE name = ? LIMIT 1', [name]);
    let id = rows[0]?.id;
    if (!id) {
      const [r] = await conn.execute('INSERT INTO blog_tag (name) VALUES (?)', [name]);
      id = r.insertId;
    }
    tagCache.set(name, id);
    return id;
  }

  for (const file of files) {
    const slug = basename(file, '.md');
    const raw = readFileSync(join(postsDir, file), 'utf8');
    const { fm, body } = parseFrontMatter(raw);
    const title = fm.title || slug;
    const content = raw; // 与 AyeezBlog 一致：存带 front-matter 的完整 Markdown
    const date = fm.date ? new Date(String(fm.date)) : new Date();
    const cover = fm.cover || '';
    const description = fm.description || '';
    const cats = Array.isArray(fm.category) ? fm.category : fm.category ? [fm.category] : [];
    const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    const categoryId = cats.length ? await getCategoryId(String(cats[0])) : null;

    await conn.execute(
      `REPLACE INTO blog_post (id, title, content, cover, create_time, update_time, description, category_id, pinned, featured, editing, water, series, series_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [slug, title, content, cover, date, date, description, categoryId, toBool(fm.pinned), toBool(fm.featured), toBool(fm.water), fm.series || null, Number(fm.seriesOrder) || null]
    );
    await conn.execute('DELETE FROM blog_post_tag WHERE post_id = ?', [slug]);
    for (const t of tags) {
      const tagId = await getTagId(String(t));
      await conn.execute('INSERT IGNORE INTO blog_post_tag (post_id, tag_id) VALUES (?, ?)', [slug, tagId]);
    }
    console.log('文章入库:', slug, '-', title);
  }

  // ---------- 2. 说说 ----------
  const talks = JSON.parse(readFileSync(join(ROOT, 'content', 'talks.json'), 'utf8'));
  await conn.execute('DELETE FROM blog_talk');
  for (const t of talks) {
    await conn.execute(
      'INSERT INTO blog_talk (content, images, published, created_at, updated_at) VALUES (?, NULL, 1, ?, ?)',
      [t.content || '', new Date(String(t.date).replace(' ', 'T')), new Date(String(t.date).replace(' ', 'T'))]
    );
  }
  console.log('说说入库:', talks.length, '条');

  // ---------- 3. 友链 ----------
  const linkGroups = JSON.parse(readFileSync(join(ROOT, 'content', 'links.json'), 'utf8'));
  await conn.execute('DELETE FROM friend_link');
  await conn.execute('DELETE FROM friend_link_class');
  let classSort = 0;
  for (const g of linkGroups) {
    const [r] = await conn.execute('INSERT INTO friend_link_class (class_name, class_desc, sort) VALUES (?, ?, ?)', [g.class_name, g.class_desc || '', classSort++]);
    let linkSort = 0;
    for (const l of g.link_list || []) {
      await conn.execute(
        'INSERT INTO friend_link (class_id, name, link, avatar, descr, sort) VALUES (?, ?, ?, ?, ?, ?)',
        [r.insertId, l.name, l.link, l.avatar || '', l.descr || '', linkSort++]
      );
    }
  }
  console.log('友链分组入库:', linkGroups.length, '组');

  // ---------- 4. 相册 ----------
  const albumsData = JSON.parse(readFileSync(join(ROOT, 'content', 'albums.json'), 'utf8'));
  await conn.execute('DELETE FROM blog_album_photo');
  await conn.execute('DELETE FROM blog_album');
  let albumSort = 0;
  for (const a of albumsData.albums || []) {
    const [r] = await conn.execute(
      'INSERT INTO blog_album (title, description, sort, default_cover_source) VALUES (?, ?, ?, 0)',
      [a.name, a.description || '', albumSort++]
    );
    let photoSort = 0;
    for (const p of a.photos || []) {
      await conn.execute(
        'INSERT INTO blog_album_photo (album_id, image_url, caption, sort) VALUES (?, ?, ?, ?)',
        [r.insertId, p.src, p.caption || '', photoSort++]
      );
    }
  }
  console.log('相册入库:', (albumsData.albums || []).length, '个');

  await conn.end();
  console.log('迁移完成 ✓');
}

main().catch((e) => {
  console.error('迁移失败:', e.message);
  process.exit(1);
});
