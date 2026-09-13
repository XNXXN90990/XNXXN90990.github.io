---
title: 友链
---

这是我喜欢、也愿意放在这里的站。

<div class="links-grid">
<a class="link-card" href="https://wcowin.work" target="_blank" rel="noopener">
  <div class="link-card__avatar">W</div>
  <div class="link-card__body">
    <div class="link-card__name">Wcowin's Blog</div>
    <div class="link-card__desc">极简风格、清爽排版。本站的视觉风格参考来源之一。</div>
  </div>
</a>

<a class="link-card" href="https://ayeez.cn" target="_blank" rel="noopener">
  <div class="link-card__avatar">A</div>
  <div class="link-card__body">
    <div class="link-card__name">阿叶的博客</div>
    <div class="link-card__desc">前后端一体的开发笔记。AdminPanel 的实现思路参考来源。</div>
  </div>
</a>
</div>

> 交换友链请联系 DBD（私聊「友链交换」即可）。

<style>
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
  margin: 24px 0;
}
.link-card {
  display: flex; gap: 14px; align-items: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 14px 16px;
  color: inherit;
  background: var(--vp-c-bg-soft);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
  border-color: var(--vp-c-brand-1);
}
.link-card__avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  color: #fff; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.link-card__name { font-weight: 600; }
.link-card__desc { color: var(--vp-c-text-2); font-size: .88rem; margin-top: 2px; line-height: 1.6; }
</style>
