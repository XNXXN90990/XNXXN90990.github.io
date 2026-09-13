<script setup lang="ts">
/**
 * RuntimeClock：显示从 birth 起到当前的运行时长
 * 形如 "12 天 5 时 33 分 02 秒"，每秒更新
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{ birth: string }>()

const now = ref(Date.now())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

const text = computed(() => {
  const start = new Date(props.birth).getTime()
  let diff = Math.max(0, Math.floor((now.value - start) / 1000))
  const days = Math.floor(diff / 86400)
  diff -= days * 86400
  const hours = Math.floor(diff / 3600)
  diff -= hours * 3600
  const mins = Math.floor(diff / 60)
  const secs = diff - mins * 60
  return `${days} 天 ${hours} 时 ${String(mins).padStart(2, '0')} 分 ${String(secs).padStart(2, '0')} 秒`
})
</script>

<template>
  <span class="runtime-clock">
    <span class="runtime-clock__num">{{ text }}</span>
  </span>
</template>
