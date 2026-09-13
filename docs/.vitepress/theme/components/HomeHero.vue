<script setup lang="ts">
/**
 * 首页 Hero 下面的卡片矩阵，分类展示各栏目最新文章
 * 数据是占位，正式接 AdminPanel 后由 API 提供
 */
import { ref, onMounted } from 'vue'

interface CatItem {
  label: string
  title: string
  desc: string
  link: string
  meta?: string
}

const sections: { name: string; items: CatItem[] }[] = [
  {
    name: '教程',
    items: [
      { label: '教程', title: '如何在这个站点写一篇文章', desc: '占位内容：写作约定的速查。', link: '/tutorials/write-a-article', meta: '2026-09-13' },
    ],
  },
  {
    name: '杂谈说说',
    items: [
      { label: '说说', title: '重写开始', desc: '把小站推翻重做。', link: '/moments/hello-moment', meta: '刚刚' },
    ],
  },
  {
    name: '学习路线',
    items: [
      { label: '路线', title: '智能车平衡组学习路径', desc: '占位：从嵌入式到 PID 的阶段安排。', link: '/learning-path/self-balancing-car' },
    ],
  },
  {
    name: '随笔',
    items: [
      { label: '随笔', title: '写在开篇', desc: '重写之后的开场白。', link: '/essays/hello-world', meta: '2026-09-13' },
    ],
  },
]
</script>

<template>
  <div>
    <section v-for="s in sections" :key="s.name" style="margin-bottom: 28px;">
      <h2 style="font-size: 1.1rem; margin: 0 0 12px; padding-top: 0; border: none;">
        {{ s.name }}
      </h2>
      <div class="home-grid">
        <a v-for="i in s.items" :key="i.title" :href="i.link" class="item">
          <div class="label">{{ i.label }}</div>
          <h3>{{ i.title }}</h3>
          <p>{{ i.desc }}</p>
          <div v-if="i.meta" style="margin-top: 8px; font-size: 12px; color: var(--vp-c-text-3);">{{ i.meta }}</div>
        </a>
      </div>
    </section>
  </div>
</template>
