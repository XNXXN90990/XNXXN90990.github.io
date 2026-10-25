/**
 * api/index.js —— 混合数据源（后端优先，静态兜底）
 *
 * 数据优先级：
 *   1. AyeezBlog 后端（VITE_API_BASE 指定地址，dev 默认走 /api 代理；超时 2.5s 视为不可用）
 *   2. 静态内容（content/ 下的 markdown 与 JSON，构建时由 scripts/gen-content.mjs 生成清单）
 * 后端挂掉/未启动时自动回退静态，网站照常可看，只是后台改动不生效。
 *
 * 函数签名与原 AyeezBlog 后端保持一致，视图层无感知。
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

// ============ 后端访问（混合模式核心） ============
// dev：'' 走 vite 代理 /api → localhost:8081；生产：VITE_API_BASE 设为后端完整地址；
// 设为 'off' 可强制纯静态。
const API_BASE = String(import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '');
const HYBRID_ENABLED = API_BASE !== 'off';

/** 请求后端，2.5s 超时或非 200 都视为不可用，抛错由调用方回退静态 */
async function tryRemote(path, timeout = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(API_BASE + path, { signal: controller.signal });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const body = await resp.json();
    if (body && body.code === 200) return body.data;
    throw new Error((body && body.message) || '接口异常');
  } finally {
    clearTimeout(timer);
  }
}

const day = (s) => (s ? String(s).slice(0, 10) : '');
const minute = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '');

/** 静态清单排序（回退路径用） */
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

/** 静态清单分页包装（回退路径用，返回结构与后端一致） */
function paged(list, page, pageSize) {
  const total = list.length;
  const start = (page - 1) * pageSize;
  return { code: 200, data: { rows: list.slice(start, start + pageSize), total, page, pageSize } };
}

/** 文章列表（分页）：后端优先，回退静态清单 */
export async function fetchPosts(page = 1, pageSize = 10, orderBy = 'update_time', orderType = 'desc') {
  if (HYBRID_ENABLED) {
    try {
      const data = await tryRemote(`/post/list?page=${page}&pageSize=${pageSize}`);
      const rows = (data.rows || []).map((r) => ({
        ...r,
        pinned: !!r.pinned,
        featured: !!r.featured,
        editing: !!r.editing,
        water: !!r.water,
        date: day(r.createTime),
        updateTime: day(r.updateTime)
      }));
      return { code: 200, data: { rows, total: data.total, page, pageSize } };
    } catch (e) {
      /* 后端不可用，回退静态 */
    }
  }
  return paged(sortList(manifest, orderBy, orderType), page, pageSize);
}

/** 单篇文章正文（含 front-matter 的原始 markdown）：后端与静态存储格式一致 */
export async function fetchPostById(id) {
  if (HYBRID_ENABLED) {
    try {
      const data = await tryRemote(`/post/get?id=${encodeURIComponent(id)}`);
      if (data && data.content) return { code: 200, data: { id: data.id || id, content: data.content } };
    } catch (e) {
      /* 回退静态 */
    }
  }
  const loader = postLoaders[`/content/posts/${id}.md`];
  if (!loader) throw new Error(`文章不存在：${id}`);
  const content = await loader();
  return { code: 200, data: { id, content } };
}

/** 杂想（暂无独立后端表，始终走静态） */
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
  if (HYBRID_ENABLED) {
    try {
      const data = await tryRemote('/talk/list?page=1&pageSize=500');
      const list = (data.rows || [])
        .map((r) => ({
          id: String(r.id),
          content: r.content,
          images: r.images || null,
          date: minute(r.createdAt),
          mood: '',
          tags: []
        }))
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      if (list.length) return { code: 200, data: list };
    } catch (e) {
      /* 回退静态 */
    }
  }
  const list = talksData.slice().sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return { code: 200, data: list };
}

/** 相册列表 / 详情 */
export async function fetchAlbums() {
  if (HYBRID_ENABLED) {
    try {
      const list = await tryRemote('/album/list');
      // 后端相册表不存展示元数据（date/指定封面），按名字用静态 albums.json 补齐
      const meta = new Map((albumsData.albums || []).map((m) => [m.name, m]));
      const albums = (list || []).map((a) => {
        const m = meta.get(a.title) || {};
        return {
          id: String(a.id),
          name: a.title,
          cover: m.cover || (a.coverImages && a.coverImages[0]) || '',
          date: m.date || '',
          description: a.description || m.description || '',
          photos: null
        };
      });
      if (albums.length) return { code: 200, data: albums };
    } catch (e) {
      /* 回退静态 */
    }
  }
  const albums = albumsData.albums || [];
  return { code: 200, data: albums };
}

export async function fetchAlbumById(id) {
  if (HYBRID_ENABLED) {
    try {
      const a = await tryRemote(`/album/get?id=${encodeURIComponent(id)}`);
      if (a) {
        const m = (albumsData.albums || []).find((x) => x.name === a.title) || {};
        return {
          code: 200,
          data: {
            id: String(a.id),
            name: a.title,
            cover: m.cover || (a.coverImages && a.coverImages[0]) || '',
            date: m.date || '',
            description: a.description || m.description || '',
            photos: (a.photos || []).map((p) => ({ src: p.imageUrl, caption: p.caption || '' }))
          }
        };
      }
    } catch (e) {
      /* 回退静态 */
    }
  }
  const album = (albumsData.albums || []).find((a) => a.id === id);
  if (!album) throw new Error(`相册不存在：${id}`);
  return { code: 200, data: album };
}

/** 友链分组，结构对齐静态 links.json：[{class_name, class_desc, link_list:[{name,avatar,link,descr}]}] */
export async function fetchLinks() {
  if (HYBRID_ENABLED) {
    try {
      const groups = await tryRemote('/links/list');
      const mapped = (groups || []).map((g) => ({
        class_name: g.className,
        class_desc: g.classDesc,
        link_list: (g.linkList || []).map((l) => ({
          name: l.name,
          avatar: l.avatar || '',
          link: l.link,
          descr: l.descr || ''
        }))
      }));
      if (mapped.length) return { code: 200, data: mapped };
    } catch (e) {
      /* 回退静态 */
    }
  }
  return { code: 200, data: linksData };
}

/** 站点配置（水印/公告/模块开关/维护状态），后端不可用返回 null（前端用内置默认值） */
export async function fetchSiteConfig() {
  if (!HYBRID_ENABLED) return null;
  try {
    return await tryRemote('/site/config', 3000);
  } catch (e) {
    return null;
  }
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

// ============ 自托管访问计数（后端在线才生效；纯静态模式直接跳过） ============

/** 取/生成访客标识（localStorage uuid，清浏览器数据即算新访客） */
export function getVisitorUid() {
  const KEY = 'ning-uid';
  try {
    let uid = localStorage.getItem(KEY);
    if (!uid) {
      uid = (crypto.randomUUID && crypto.randomUUID()) ||
        'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(KEY, uid);
    }
    return uid;
  } catch (e) {
    return 'anonymous';
  }
}

/** 上报一次访问（失败静默，不打扰页面） */
export function trackVisit(path) {
  if (!HYBRID_ENABLED) return Promise.resolve(null);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  return fetch(`${API_BASE}/visit/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: getVisitorUid(), path: String(path || '/').slice(0, 200) }),
    signal: controller.signal
  }).catch(() => null).finally(() => clearTimeout(timer));
}

/** 拉取访问统计 { pv, uv, pvOffset, uvOffset, totalPv, totalUv }；后端不可用返回 null */
export async function fetchVisitStats() {
  if (!HYBRID_ENABLED) return null;
  try {
    return await tryRemote('/visit/stats', 3000);
  } catch (e) {
    return null;
  }
}
