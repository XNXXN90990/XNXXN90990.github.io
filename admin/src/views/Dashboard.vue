<template>
  <h2 class="title">仪表盘</h2>
  <p class="sub">这里是「访客流量 + 文章数据」的概览。本期数据是 mock，下一轮接 Cloudflare Worker。</p>

  <div class="cards">
    <el-card v-for="(c, i) in cards" :key="i" shadow="never" class="card">
      <div class="card__label">{{ c.label }}</div>
      <div class="card__value">{{ c.value }}</div>
      <div class="card__extra">{{ c.extra }}</div>
    </el-card>
  </div>

  <el-card shadow="never" class="chart-card">
    <template #header>最近 14 天访问</template>
    <div class="chart-placeholder">
      📈 接入 Cloudflare Worker 后这里显示趋势图（折线 / 漏斗）
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getDashboardStats } from '@/api'

const stats = ref({ pv: 0, uv: 0, todayPv: 0, todayUv: 0, articlesTotal: 0, draftsTotal: 0 })

onMounted(async () => {
  try {
    stats.value = await getDashboardStats()
  } catch (_) {}
})

const cards = computed(() => [
  { label: '总访问量 PV', value: stats.value.pv, extra: `今日 PV ${stats.value.todayPv}` },
  { label: '总访客数 UV', value: stats.value.uv, extra: `今日 UV ${stats.value.todayUv}` },
  { label: '文章总数',     value: stats.value.articlesTotal, extra: `其中 ${stats.value.draftsTotal} 篇草稿` },
  { label: '运行时长',      value: '14 天', extra: '自 2026-09-13 起' },
])
</script>

<style scoped>
.title { margin: 0 0 6px; font-size: 1.25rem; }
.sub { color: var(--ning-text-2); margin: 0 0 16px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px; }
.card { border-radius: 12px; }
.card__label { color: var(--ning-text-2); font-size: 13px; }
.card__value { font-size: 1.6rem; font-weight: 700; margin: 6px 0; }
.card__extra { font-size: 12px; color: var(--ning-text-2); }
.chart-card { border-radius: 12px; }
.chart-placeholder {
  height: 260px;
  display: flex; align-items: center; justify-content: center;
  color: var(--ning-text-2); font-size: 13px;
  border: 1px dashed var(--ning-divider); border-radius: 8px;
}
</style>
