<script setup lang="ts">
/**
 * 站点底部：运行时长 + PV/UV（不蒜子）+ 作者 DBD
 *
 * 运行时长：从 SITE_BIRTH_ISO 这个时刻起计时
 * PV/UV：用 busuanzi，在浏览器加载后异步注入
 */
import { ref } from 'vue'
import RuntimeClock from './RuntimeClock.vue'

const SITE_BIRTH_ISO = '2026-09-13T17:51:00+08:00'
const AUTHOR = 'DBD'
const SITE_NAME = '寜的小站'
</script>

<template>
  <footer class="ning-footer">
    <div class="ning-footer__inner">
      <div class="ning-footer__row">
        <span class="ning-footer__brand">{{ SITE_NAME }}</span>
        <span class="ning-footer__sep">·</span>
        <span>本站已运行 <RuntimeClock :birth="SITE_BIRTH_ISO" /></span>
      </div>

      <div class="ning-footer__row">
        <span class="ning-footer__item">
          总访问量 <span id="busuanzi_value_site_pv">…</span>
        </span>
        <span class="ning-footer__sep">·</span>
        <span class="ning-footer__item">
          访客数 <span id="busuanzi_value_site_uv">…</span>
        </span>
        <span class="ning-footer__sep">·</span>
        <span class="ning-footer__item">作者：{{ AUTHOR }}</span>
      </div>

      <div class="ning-footer__row" style="font-size: 13px;">
        <span>Powered by VitePress</span>
        <span class="ning-footer__sep">·</span>
        <span>Hosted on GitHub Pages</span>
        <span class="ning-footer__sep">·</span>
        <span>本站内容采用 CC BY-NC-SA 4.0 协议授权</span>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
// 不蒜子：异步插入，仅在浏览器里挂一次
export default {
  mounted() {
    if (typeof window === 'undefined') return
    if ((window as any).__busuanzi_loaded) return
    ;(window as any).__busuanzi_loaded = true
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
    document.body.appendChild(s)
  }
}
</script>
