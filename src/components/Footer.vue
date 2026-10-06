<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 站点创建时间（本地时间）—— 换成你自己的建站时间即可
const siteCreatedAt = new Date('2026-10-06T00:00:00');

const runningTimeText = ref('');
const statsVisible = ref(false); // 不蒜子加载成功才显示统计行
let timerId = null;
let busuanziTimer = null;

const updateRunningTime = () => {
  const now = new Date();
  let diffSeconds = Math.floor((now.getTime() - siteCreatedAt.getTime()) / 1000);
  if (diffSeconds < 0) diffSeconds = 0;

  const days = Math.floor(diffSeconds / (24 * 60 * 60));
  diffSeconds %= 24 * 60 * 60;
  const hours = Math.floor(diffSeconds / (60 * 60));
  diffSeconds %= 60 * 60;
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  runningTimeText.value = `本站已经运行 ${days} 天 ${pad(hours)} 时 ${pad(minutes)} 分 ${pad(seconds)} 秒`;
};

/** 加载不蒜子访问统计；服务不可用时静默隐藏统计行 */
const loadBusuanzi = () => {
  const script = document.createElement('script');
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  script.async = true;
  script.onload = () => {
    // 不蒜子异步拉取数值，稍等再检查是否渲染出来
    busuanziTimer = setTimeout(() => {
      const pv = document.getElementById('busuanzi_value_site_pv');
      const uv = document.getElementById('busuanzi_value_site_uv');
      if (pv && pv.textContent && uv && uv.textContent) {
        statsVisible.value = true;
      }
    }, 1200);
  };
  script.onerror = () => {
    console.warn('不蒜子统计加载失败，已隐藏统计行');
  };
  document.head.appendChild(script);
};

onMounted(() => {
  updateRunningTime();
  timerId = setInterval(updateRunningTime, 1000);
  loadBusuanzi();
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
  if (busuanziTimer) clearTimeout(busuanziTimer);
});
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <span class="footer-line">{{ runningTimeText }}</span>
      <span v-show="statsVisible" class="footer-line">
        总访问量（PV）：<span id="busuanzi_value_site_pv">...</span>
        ｜ 总访客数（UV）：<span id="busuanzi_value_site_uv">...</span>
      </span>
      <span class="footer-line">2026-2026 by 寜</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  margin-top: 60px;
  padding: 30px 16px 22px;
  background-color: var(--footer-bg);
  color: var(--footer-text);
  font-size: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid var(--footer-border);
  box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.18);
  transition: background-color 0.35s ease, color 0.35s ease;
}

.footer-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  text-align: center;
}

@media (max-width: 768px) {
  .site-footer {
    padding: 20px 10px 16px;
    font-size: 12px;
  }
}
</style>
