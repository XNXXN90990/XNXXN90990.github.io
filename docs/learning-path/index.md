---
title: 学习路线
---

把「我要成为 X」拆成可执行的小目标。

<div class="cat-grid">
<a class="cat-card" href="/learning-path/self-balancing-car">
  <div class="cat-card__cat">路线</div>
  <h3>智能车平衡组学习路径</h3>
  <p>从嵌入式基础到 PID、姿态解算、传感器融合，分阶段给出推荐材料与里程碑。</p>
  <div class="cat-card__meta">占位 · 待补</div>
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
  display: block; border: 1px solid var(--vp-c-divider);
  border-radius: 12px; padding: 20px; color: inherit;
  background: var(--vp-c-bg-soft);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.cat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.06); border-color: var(--vp-c-brand-1); }
.cat-card h3 { margin: 8px 0; font-size: 1.05rem; }
.cat-card p { margin: 6px 0 12px; color: var(--vp-c-text-2); font-size: .92rem; line-height: 1.7; }
.cat-card__cat { font-size: .75rem; color: var(--vp-c-brand-1); letter-spacing: 1px; }
.cat-card__meta { font-size: .8rem; color: var(--vp-c-text-3); }
</style>
