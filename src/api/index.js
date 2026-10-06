/**
 * api/index.js —— 静态内容数据源
 *
 * 本站已静态化：文章/杂想来自 content/ 下的 markdown（构建时由 scripts/gen-content.mjs 生成清单），
 * 说说/相册/友链来自 content/ 下的 JSON，指南来自 content/guide/（scripts/import-guides.mjs 导入）。
 *
 * 函数签名与原后端 API 版保持一致，未来若接回 Spring Boot 后端，
 * 只需恢复这里的 HTTP 实现即可，视图层无需改动。
 */
import manifest from '@/content/manifest.json';
import thoughtsManifest from '@/content/thoughts-manifest.json';
import linksData from '../../content/links.json';
import talksData from '../../content/talks.json';
import albumsData from '../../content/albums.json';
import guidesData from '@/content/guides.json';

// 正文按需懒加载：每篇文章一个独立 chunk，首屏不背全部正文
const postLoaders = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default'
});
const thoughtLoaders = import.meta.glob('/content/thoughts/*.md', {
  query: '?raw',
  import: 'default'
});
// 指南文档（613 篇，全部懒加载，路径含中文/URL 编码）
const guideDocLoaders = import.meta.glob('/content/guide/**/*.md', {
  query: '?raw',
  import: 'default'
});

function sortList(list, orderBy = 'date', orderType = 'desc') {
  const arr = list.slice();
  arr.sort((a, b) => {
    const ta = Date.parse((orderBy === 'update_time' ? a.updateTime : a.date) || '') || 0;
    const tb = Date.parse((orderBy === 'update_time' ? b.updateTime : b.date) || '') || 0;
    if (ta !== tb) return orderType === 'asc' ? ta - tb : tb - ta;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return String(a.id).localeCompare(String(b.id));
  });
  return arr;
}

function paged(list, page, pageSize) {
  const total = list.length;
  const start = (page - 1) * pageSize;
  return { code: 200, data: { rows: list.slice(start, start + pageSize), total, page, pageSize } };
}

/** 文章列表（分页），与原后端 /api/post/list 返回结构一致 */
export async function fetchPosts(page = 1, pageSize = 10, orderBy = 'update_time', orderType = 'desc') {
  return paged(sortList(manifest, orderBy, orderType), page, pageSize);
}

/** 单篇文章正文（含 front-matter 的原始 markdown），与 /api/post/get 结构一致 */
export async function fetchPostById(id) {
  const loader = postLoaders[`/content/posts/${id}.md`];
  if (!loader) throw new Error(`文章不存在：${id}`);
  const content = await loader();
  return { code: 200, data: { id, content } };
}

/** 杂想列表 / 详情 */
export async function fetchThoughts(page = 1, pageSize = 10) {
  return paged(sortList(thoughtsManifest), page, pageSize);
}

export async function fetchThoughtById(id) {
  const loader = thoughtLoaders[`/content/thoughts/${id}.md`];
  if (!loader) throw new Error(`杂想不存在：${id}`);
  const content = await loader();
  return { code: 200, data: { id, content } };
}

/** 说说（按时间倒序返回全部，前端可再分页） */
export async function fetchTalks() {
  const list = talksData.slice().sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return { code: 200, data: list };
}

/** 相册列表 / 详情 */
export async function fetchAlbums() {
  const albums = albumsData.albums || [];
  return { code: 200, data: albums };
}

export async function fetchAlbumById(id) {
  const album = (albumsData.albums || []).find((a) => a.id === id);
  if (!album) throw new Error(`相册不存在：${id}`);
  return { code: 200, data: album };
}

/** 友链分组，结构对齐原 /api/links/list：[{class_name, class_desc, link_list:[{name,avatar,link,descr}]}] */
export async function fetchLinks() {
  return { code: 200, data: linksData };
}

/** 指南（三本开源手册，含章节树与出处） */
export function fetchGuides() {
  return guidesData;
}

export function getGuideById(gid) {
  return guidesData.find((g) => g.id === gid) || null;
}

/** 指南单篇文档正文（文件名可能含中文，glob key 的编码形式不确定，这里做双向兼容） */
export async function fetchGuideDoc(gid, docPath) {
  const key = Object.keys(guideDocLoaders).find((k) => {
    // 剥掉 content/guide/ 与 <gid>/ 前缀和 .md 后缀，得到纯文档路径
    const rel = k
      .replace(/^\/content\/guide\//, '')
      .replace(new RegExp('^' + gid + '/'), '')
      .replace(/\.md$/i, '');
    if (rel === docPath) return true;
    let decoded = rel;
    try {
      decoded = decodeURIComponent(rel);
    } catch (e) {
      /* 保留原样 */
    }
    return decoded === docPath;
  });
  if (!key) throw new Error(`文档不存在：${docPath}`);
  const content = await guideDocLoaders[key]();
  return { code: 200, data: { id: docPath, content } };
}

/** 把指南章节树拍平成阅读顺序（上一篇/下一篇用） */
export function flattenGuideChapters(chapters, out = []) {
  for (const node of chapters || []) {
    if (node.path) out.push({ title: node.title, path: node.path });
    flattenGuideChapters(node.children, out);
  }
  return out;
}

/** 文章总篇数（页脚用） */
export function getPostCount() {
  return manifest.length;
}
