import { createRouter, createWebHistory } from 'vue-router';
import { resolveScrollBehaviorWithLenis } from '@/plugins/smoothScroll';

import Home from '@/views/Home.vue';
// 非首页页面拆包（首页加载完后再预取，见 Home.vue）
const About = () => import('@/views/About.vue');
const Archive = () => import('@/views/Archive.vue');
const Links = () => import('@/views/Links.vue');
const PostDetail = () => import('@/views/PostDetail.vue');
const Private = () => import('@/views/Private.vue');

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/archive', name: 'Archive', component: Archive },
  { path: '/links', name: 'Links', component: Links },
  { path: '/private', name: 'Private', component: Private },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: PostDetail,
    props: true // 允许通过 props 接收路由参数
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return resolveScrollBehaviorWithLenis(savedPosition);
  }
});

export default router;
