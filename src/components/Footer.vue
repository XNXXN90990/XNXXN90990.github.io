<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { trackVisit, fetchVisitStats } from '@/api';

// ==================== 配置区 ====================
const siteCreatedAt = new Date('2026-06-14T01:06:14');
// ==================== 配置区结束 ==================

const runningTimeText = ref('');
const sitePv = ref('');
const siteUv = ref('');
const statsVisible = ref(false);
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
  runningTimeText.value = `本站已经运行 ${days} 天 ${pad(hours)} 时 ${pad(minutes)} 分 ${pad(seconds)} 秒`;
};

// 自托管访问计数：上报本次访问 + 拉统计；后端不在线（纯静态模式）就静默隐藏
const loadVisitStats = async () => {
  trackVisit(location.pathname);
  const stats = await fetchVisitStats();
  if (stats && Number(stats.totalPv) > 0) {
    sitePv.value = String(stats.totalPv);
    siteUv.value = String(stats.totalUv);
    statsVisible.value = true;
  }
};

onMounted(() => {
  updateRunningTime();
  timerId = setInterval(updateRunningTime, 1000);
  loadVisitStats();
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <!-- 运行时间 -->
      <span class="footer-line runtime-line">{{ runningTimeText }}</span>

      <!-- 访问量统计（自托管，数据在本站数据库） -->
      <span v-show="statsVisible" class="footer-line stats-line">
        <span class="stat-item">
          <span class="stat-label">总访问量（PV）：</span>
          <span class="stat-value">{{ sitePv }}</span>
        </span>
        <span class="stat-separator">|</span>
        <span class="stat-item">
          <span class="stat-label">总访客数（UV）：</span>
          <span class="stat-value">{{ siteUv }}</span>
        </span>
      </span>

      <!-- 版权 + 隐私政策 + 框架说明 -->
      <span class="footer-line copyright-line">
        <!-- © 直接当普通文字，不要圆圈边框了 -->
        <span class="copyright-power">Copyright</span>
        <span> © </span>
        <span class="copyright-year">2026~{{ new Date().getFullYear() }}</span>
        <span class="copyright-author"> 寜</span>
        <span class="copyright-separator"> | </span>
        <span class="copyright-tech">
          Made with <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer" class="link-hover">Vue 3</a> + <a href="https://vite.dev" target="_blank" rel="noopener noreferrer" class="link-hover">Vite</a>
        </span>   
        <span class="copyright-separator"> | </span>             
        <a href="/privacy" class="link-hover">隐私政策</a>
      </span>
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
  gap: 12px; /* 三行统一等距间隔，不需要分隔线了 */
  text-align: center;
}

.footer-line {
  line-height: 1.6;
}

.runtime-line {
  font-size: 12px;
  opacity: 0.85;
}

.stats-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.stat-label {
  opacity: 0.7;
}

.stat-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-separator {
  margin: 0 6px;
  opacity: 0.4;
}

.copyright-line {
  font-size: 12px;
  opacity: 0.75;
}

.copyright-separator {
  margin: 0 4px;
  opacity: 0.5;
}

.copyright-tech {
  font-style: italic;
  opacity: 0.8;
}

a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed var(--footer-border);
  transition: all 0.2s ease;
}

a:hover {
  color: var(--accent, #409eff);
  border-bottom-color: var(--accent, #409eff);
}

@media (max-width: 768px) {
  .site-footer {
    padding: 20px 10px 16px;
    font-size: 12px;
  }

  .footer-content {
    gap: 10px;
  }

  .stats-line {
    flex-wrap: wrap;
  }

  .copyright-line {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>