import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'articles', name: 'articles', component: () => import('@/views/Articles.vue'), meta: { title: '文章' } },
      { path: 'moments', name: 'moments', component: () => import('@/views/Moments.vue'), meta: { title: '说说' } },
      { path: 'categories', name: 'categories', component: () => import('@/views/Categories.vue'), meta: { title: '分类' } },
      { path: 'links', name: 'links', component: () => import('@/views/Links.vue'), meta: { title: '友链' } },
      { path: 'settings', name: 'settings', component: () => import('@/views/Settings.vue'), meta: { title: '设置' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 简易路由守卫：未登录跳 /login
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('ning-admin-token')
  if (!to.meta.public && !token) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  next()
})

export default router
