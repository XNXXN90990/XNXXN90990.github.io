import { createRouter, createWebHistory } from 'vue-router';
import { resolveScrollBehaviorWithLenis } from '@/plugins/smoothScroll';
import { siteStore, SITE_STATUS } from '@/utils/siteStore';

import Home from '@/views/Home.vue';
// 非首页页面拆包（首页加载完后再预取，见 Home.vue）
const About = () => import('@/views/About.vue');
const Archive = () => import('@/views/Archive.vue');
const Links = () => import('@/views/Links.vue');
const PostDetail = () => import('@/views/PostDetail.vue');
const Private = () => import('@/views/Private.vue');
const Talks = () => import('@/views/Talks.vue');
const Thoughts = () => import('@/views/Thoughts.vue');
const Albums = () => import('@/views/Albums.vue');
const AlbumDetail = () => import('@/views/AlbumDetail.vue');
const GuideHome = () => import('@/views/GuideHome.vue');
const GuideDetail = () => import('@/views/GuideDetail.vue');
const GuideDoc = () => import('@/views/GuideDoc.vue');
const Maintenance = () => import('@/views/Maintenance.vue');

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/archive', name: 'Archive', component: Archive },
  { path: '/links', name: 'Links', component: Links },
  { path: '/private', name: 'Private', component: Private },
  { path: '/talks', name: 'Talks', component: Talks },
  { path: '/thoughts', name: 'Thoughts', component: Thoughts },
  { path: '/albums', name: 'Albums', component: Albums },
  { path: '/albums/:id', name: 'AlbumDetail', component: AlbumDetail, props: true },
  { path: '/guide', name: 'GuideHome', component: GuideHome },
  { path: '/guide/:gid', name: 'GuideDetail', component: GuideDetail, props: true },
  // doc 是多级路径（可能含中文，URL 编码），用通配捕获
  { path: '/guide/:gid/:doc(.*)', name: 'GuideDoc', component: GuideDoc, props: true },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: PostDetail,
    props: (route) => ({ id: route.params.id, source: 'posts' })
  },
  {
    path: '/thoughts/:id',
    name: 'ThoughtDetail',
    component: PostDetail,
    props: (route) => ({ id: route.params.id, source: 'thoughts' })
  },
  { path: '/maintenance', name: 'Maintenance', component: Maintenance },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return resolveScrollBehaviorWithLenis(savedPosition);
  }
});

// 维护模式守卫：后台切到 maintenance/ghost 后，全站只留维护页；恢复 normal 自动放行
router.beforeEach((to) => {
  if (!siteStore.loaded) return true; // 配置未到前先放行，App 初始化完成后会补跳转
  if (siteStore.status !== SITE_STATUS.NORMAL && to.path !== '/maintenance') return '/maintenance';
  if (siteStore.status === SITE_STATUS.NORMAL && to.path === '/maintenance') return '/';
  return true;
});

export default router;
