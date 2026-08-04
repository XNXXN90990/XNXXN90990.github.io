<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <!-- TODO: 站点名字确定后，记得同步修改这里 -->
      <p class="site-footer-text">
        © {{ year }} 我的个人小站 · 记录与分享 · 转载请注明出处
      </p>
      <p class="site-footer-count">
        本站总访问量 <span id="busuanzi_value_site_pv">…</span> 次
        <span class="site-footer-divider">|</span>
        总访客数 <span id="busuanzi_value_site_uv">…</span> 人
      </p>
      <p class="site-footer-private">
        <a href="/private/" title="私密区">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </a>
      </p>
    </div>
  </footer>
</template>
