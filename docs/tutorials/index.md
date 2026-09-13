---
title: 教程
---

这里收录我写过的、能帮到别人的「按图索骥」式教程。从开始到结束，把路写清楚。

<div class="cat-grid">
<a class="cat-card" href="/tutorials/write-a-article">
  <div class="cat-card__cat">教程</div>
  <h3>如何在这个站点写一篇文章</h3>
  <p>一篇占位文章，用于让 VitePress 渲染一篇普通的教程正文。回头我会换成正式的教程。</p>
  <div class="cat-card__meta">2026-09-13</div>
</a>
</div>

<style>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin: 24px 0 8px;
}
.cat-card {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  color: inherit;
  background: var(--vp-c-bg-soft);
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.cat-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
}
.cat-card h3 { margin: 8px 0; font-size: 1.05rem; }
.cat-card p { margin: 6px 0 12px; color: var(--vp-c-text-2); font-size: .92rem; }
.cat-card__cat { font-size: .75rem; color: var(--vp-c-brand-1); letter-spacing: 1px; }
.cat-card__meta { font-size: .8rem; color: var(--vp-c-text-3); }
</style>
