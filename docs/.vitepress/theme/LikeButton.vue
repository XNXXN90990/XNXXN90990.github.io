<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const { theme, page } = useData()
const api = String((theme.value as any).likeApi || '').replace(/\/$/, '')
const pageId = page.value.relativePath
const flagKey = 'qz_liked:' + pageId

const count = ref<number | null>(null)
const liked = ref(false)
const busy = ref(false)
const broken = ref(false)
const dev = import.meta.env.DEV

async function call(method: 'GET' | 'POST') {
  const sep = api.includes('?') ? '&' : '?'
  const res = await fetch(`${api}${sep}id=${encodeURIComponent(pageId)}`, { method })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

onMounted(async () => {
  if (!api) return
  liked.value = localStorage.getItem(flagKey) === '1'
  try {
    const d = await call('GET')
    count.value = Number(d.likes) || 0
  } catch {
    broken.value = true
  }
})

async function like() {
  if (!api || liked.value || busy.value) return
  busy.value = true
  try {
    const d = await call('POST')
    count.value = Number(d.likes) || (count.value || 0) + 1
    liked.value = true
    localStorage.setItem(flagKey, '1')
  } catch {
    /* 网络失败时保持原状 */
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="api && !broken" class="like-wrap">
    <button
      class="like-btn"
      :class="{ liked }"
      :disabled="liked || busy"
      :title="liked ? '已经点过赞啦' : '觉得有用就点个赞吧'"
      @click="like"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
      <span>{{ liked ? '已赞' : '点赞' }}</span>
      <span v-if="count !== null" class="like-count">{{ count }}</span>
    </button>
  </div>
  <div v-else-if="dev" class="dev-hint">
    点赞功能尚未开启：请参考《如何开启点赞功能》部署 Cloudflare Worker 并填写 likeApi。
  </div>
</template>
