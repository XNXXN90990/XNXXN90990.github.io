<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const cfg = ((theme.value as any).giscus || {}) as {
  repo?: string
  repoId?: string
  category?: string
  categoryId?: string
}

const configured = !!(
  cfg.repo &&
  cfg.repoId &&
  !String(cfg.repoId).includes('PLACEHOLDER') &&
  cfg.categoryId &&
  !String(cfg.categoryId).includes('PLACEHOLDER')
)
const dev = import.meta.env.DEV

let observer: MutationObserver | undefined

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function syncTheme() {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (!iframe || !iframe.contentWindow) return
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: currentTheme() } } },
    'https://giscus.app'
  )
}

onMounted(() => {
  if (!configured) return
  const container = document.getElementById('giscus-box')
  if (!container) return

  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', cfg.repo!)
  s.setAttribute('data-repo-id', cfg.repoId!)
  s.setAttribute('data-category', cfg.category || 'General')
  s.setAttribute('data-category-id', cfg.categoryId!)
  s.setAttribute('data-mapping', 'pathname')
  s.setAttribute('data-strict', '0')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-input-position', 'top')
  s.setAttribute('data-theme', currentTheme())
  s.setAttribute('data-lang', 'zh-CN')
  container.appendChild(s)

  // 跟随站点的日间/夜间切换
  observer = new MutationObserver(syncTheme)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <section v-if="configured" class="giscus-wrap">
    <h2 class="giscus-title">评论</h2>
    <div id="giscus-box"></div>
  </section>
  <div v-else-if="dev" class="dev-hint">
    评论区尚未开启：请参考《如何开启评论区》填写 giscus 的 repoId 与 categoryId。
  </div>
</template>
