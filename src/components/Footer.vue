<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 站点创建时间（本地时间）—— 换成你自己的建站时间即可
const siteCreatedAt = new Date('2026-10-06T00:00:00');

const runningTimeText = ref('');
let timerId = null;

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

  runningTimeText.value = `本站已运行 ${days} 天 ${pad(hours)} 时 ${pad(minutes)} 分 ${pad(seconds)} 秒`;
};

onMounted(() => {
  updateRunningTime();
  timerId = setInterval(updateRunningTime, 1000);
});

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <span class="footer-line">宁静致远 · 记录学习、生活与思考</span>
      <span class="footer-line">{{ runningTimeText }}</span>
      <span class="footer-line">
        © 2026 寜 Ning ·
        <a href="https://github.com/XNXXN90990" target="_blank" rel="noopener noreferrer">GitHub</a>
        · Powered by Vue &amp; GitHub Pages
      </span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  margin-top: 60px;
  padding: 34px 16px 24px;
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

.footer-line:first-child {
  margin-top: 6px;
}

.site-footer a {
  color: var(--blog-link-color);
  text-decoration: none;
}

.site-footer a:hover {
  color: var(--blog-link-hover-color);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .site-footer {
    padding: 22px 10px 20px;
    font-size: 12px;
  }
}
</style>
