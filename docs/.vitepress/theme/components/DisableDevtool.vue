<script setup lang="ts">
/**
 * DisableDevtool：通过 CDN 引入 disable-devtool
 * 三种白名单方式让自己的电脑能照常用 F12：
 *   1. URL 上加 ?devtools=1
 *   2. localStorage 里保存 ning-devtools=true
 *   3. 按下 Ctrl+Shift+D 切换白名单状态
 */
import { ref, onMounted, onUnmounted } from 'vue'

const enabled = ref(true)
const scriptLoaded = ref(false)

const showWhitelistHint = () => {
  // 顶部轻量提示 3 秒
  const div = document.createElement('div')
  div.textContent = '已加入白名单：F12 在本机本次访问内不会被拦截。'
  div.style.cssText =
    'position:fixed;top:24px;left:50%;transform:translateX(-50%);' +
    'z-index:99999;padding:8px 14px;background:#5b8f6b;color:#fff;' +
    'border-radius:8px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.15);'
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 2200)
}

const toggleWhitelist = () => {
  if (typeof window === 'undefined') return
  const cur = localStorage.getItem('ning-devtools') === 'true'
  if (cur) {
    localStorage.setItem('ning-devtools', '')
    alert('已退出白名单。下次进首页会生效。')
  } else {
    localStorage.setItem('ning-devtools', 'true')
    showWhitelistHint()
  }
}

const onKey = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
    e.preventDefault()
    toggleWhitelist()
  }
}

const init = () => {
  if (typeof window === 'undefined') return
  if (scriptLoaded.value) return

  // URL ?devtools=1 也写入白名单（只要本次会话内有效）
  const params = new URLSearchParams(window.location.search)
  if (params.get('devtools') === '1') {
    sessionStorage.setItem('ning-devtools-session', 'true')
  }

  // 只要本机标记或本次会话标记在，就不加载拦截脚本
  const whitelisted =
    localStorage.getItem('ning-devtools') === 'true' ||
    sessionStorage.getItem('ning-devtools-session') === 'true'

  if (whitelisted) {
    enabled.value = false
    return
  }

  // 加载 CDN 版 disable-devtool
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/disable-devtool'
  s.async = false
  s.defer = false
  s.setAttribute('disable-devtool-auto', '')
  s.onload = () => { scriptLoaded.value = true }
  s.onerror = () => { /* 静默失败，不影响页面 */ }
  document.head.appendChild(s)
}

onMounted(() => {
  init()
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})

defineExpose({ toggleWhitelist })
</script>

<template>
  <!-- 该组件不渲染任何 UI -->
</template>

