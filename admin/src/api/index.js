import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

http.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ning-admin-token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

http.interceptors.response.use(
  (r) => r.data,
  (e) => {
    if (e?.response?.status === 401) {
      localStorage.removeItem('ning-admin-token')
      if (location.hash === '' && location.pathname !== '/login') {
        location.href = '/login'
      }
    }
    return Promise.reject(e?.response?.data || { message: e.message })
  }
)

/**
 * ===== 下面是「目标 API 契约」占位，本期不连真实后端 =====
 * 下一轮把这些接到 Cloudflare Worker / D1 时，把函数体替换成真实调用即可。
 */

export async function login(payload) {
  // 临时占位：用户名 ning、密码 ning（部署后端后请改走真实 API）
  await new Promise((r) => setTimeout(r, 400))
  if (payload.username === 'ning' && payload.password === 'ning') {
    return { token: 'demo-token-' + Date.now(), username: 'ning' }
  }
  throw new Error('用户名或密码不正确')
}

export async function getDashboardStats() {
  // mock 数据，后续由 Cloudflare Worker 拉真实 PV/UV + D1 文章数
  return {
    pv: 1234,
    uv: 567,
    todayPv: 18,
    todayUv: 6,
    articlesTotal: 5,
    draftsTotal: 1,
  }
}

export async function getArticleList(query) {
  // mock；后续接 D1
  return {
    rows: [
      { id: 't1', title: '如何在这个站点写一篇文章', category: 'tutorials', status: 'published', date: '2026-09-13' },
      { id: 't2', title: '重写开始', category: 'moments', status: 'published', date: '2026-09-13' },
      { id: 't3', title: '写在开篇', category: 'essays', status: 'draft', date: '2026-09-13' },
      { id: 't4', title: '智能车平衡组学习路径', category: 'learning-path', status: 'published', date: '2026-09-13' },
    ],
    total: 4,
  }
}

export async function createArticle(payload) {
  console.log('[admin] createArticle (mock):', payload)
  return { id: 'new-' + Date.now(), ...payload }
}

export async function deleteArticle(id) {
  console.log('[admin] deleteArticle (mock):', id)
  return { ok: true }
}

export const apiContract = '/api/{articles,moments,categories,links,settings,me,dashboard,upload}'
