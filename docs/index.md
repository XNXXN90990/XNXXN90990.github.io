---
title: 首页
hide:
  - footer
  - sidebar
  - toc
layout: home
hero:
  name: 寜的小站
  text: Ning's Blog
  tagline: 一点教程、一点杂谈、偶尔的思考，还有一处只属于自己的小角落。
  actions:
    - theme: brand
      text: 开始阅读 →
      link: /tutorials/
    - theme: alt
      text: 关于我
      link: /about/
---

<!-- 站点自定义卡片，置中放在 Hero 下方。组件在 .vitepress/theme/components 下面。 -->
<div class="home-grid-wrap">
  <ClientOnly>
    <HomeHero />
  </ClientOnly>
</div>

<style>
/* 让卡片区域不与 VitePress 默认的 960px 容器对齐，撑满宽度 */
.home-grid-wrap {
  max-width: 1200px;
  margin: 32px auto 64px;
  padding: 0 32px;
}
@media (max-width: 768px) {
  .home-grid-wrap { padding: 0 16px; margin: 24px auto 48px; }
}
</style>
