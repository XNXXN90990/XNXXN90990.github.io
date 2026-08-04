<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()

// 解析 frontmatter 中的 date 字段，兼容字符串（"2026-08-04"）和 Date 对象两种情况
const publishDate = computed(() => {
  const raw = frontmatter.value.date
  if (!raw) return ''
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return `${raw.getFullYear()} 年 ${raw.getMonth() + 1} 月 ${raw.getDate()} 日`
  }
  const str = String(raw)
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`
  return str
})
</script>

<template>
  <div v-if="publishDate" class="post-meta">
    <span class="post-meta-item">
      <svg class="post-meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      发布于 {{ publishDate }}
    </span>
    <span class="post-meta-dot">·</span>
    <span class="post-meta-item">
      本文阅读量 <span id="busuanzi_value_page_pv">…</span> 次
    </span>
  </div>
</template>
