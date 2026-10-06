/**
 * api/index.js —— 静态内容数据源
 *
 * 本站已静态化：文章来自 content/posts/*.md（构建时由 scripts/gen-content.mjs 生成清单），
 * 友链来自 content/links.json，关于页来自 content/about.md。
 *
 * 函数签名与原后端 API 版保持一致，未来若接回 Spring Boot 后端，
 * 只需恢复这里的 HTTP 实现即可，视图层无需改动。
 */
import manifest from '@/content/manifest.json';
import linksData from '../../content/links.json';

// 正文按需懒加载：每篇文章一个独立 chunk，首屏不背全部正文
const postLoaders = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default'
});

function sortPosts(list, orderBy = 'date', orderType = 'desc') {
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

/** 文章列表（分页），与原后端 /api/post/list 返回结构一致 */
export async function fetchPosts(page = 1, pageSize = 10, orderBy = 'update_time', orderType = 'desc') {
  const all = sortPosts(manifest, orderBy, orderType);
  const total = all.length;
  const start = (page - 1) * pageSize;
  const rows = all.slice(start, start + pageSize);
  return {
    code: 200,
    data: { rows, total, page, pageSize }
  };
}

/** 单篇文章正文（含 front-matter 的原始 markdown），与 /api/post/get 结构一致 */
export async function fetchPostById(id) {
  const loader = postLoaders[`/content/posts/${id}.md`];
  if (!loader) {
    throw new Error(`文章不存在：${id}`);
  }
  const content = await loader();
  return { code: 200, data: { id, content } };
}

/** 友链分组，结构对齐原 /api/links/list：[{class_name, class_desc, link_list:[{name,avatar,link,descr}]}] */
export async function fetchLinks() {
  return { code: 200, data: linksData };
}

/** 文章总篇数（页脚用） */
export function getPostCount() {
  return manifest.length;
}
