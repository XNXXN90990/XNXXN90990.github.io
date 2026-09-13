---
title: 杂谈说说
---

这里是我的「朋友圈」——想到什么写什么，可以上传图片、视频、文件，未来会通过后台管理。

<div class="cat-grid">

<a class="cat-card cat-card--moment" href="/moments/hello-moment">
  <div class="cat-card__cat">说说</div>
  <div class="cat-card__time">2026-09-13 · 17:51</div>
  <h3>重写开始</h3>
  <p>把小站推翻重做了一遍。极简、自适应、首页不再被容器宽度死绑着。以后这里会记录生活里零碎的事。</p>
</a>

</div>

<style>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin: 24px 0 8px;
}
.cat-card {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 18px 20px;
  color: inherit;
  background: var(--vp-c-bg-soft);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.cat-card--moment:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
  border-color: var(--vp-c-brand-1);
}
.cat-card h3 { margin: 6px 0 8px; font-size: 1.1rem; }
.cat-card p { margin: 0; color: var(--vp-c-text-2); font-size: .94rem; line-height: 1.7; }
.cat-card__cat { font-size: .75rem; color: var(--vp-c-brand-1); letter-spacing: 1px; }
.cat-card__time { font-size: .8rem; color: var(--vp-c-text-3); margin-top: 2px; }
</style>
