<template>
  <div class="maintenance-page">
    <div class="wm" aria-hidden="true">寜</div>
    <div class="wrap">
      <div class="card">
        <div class="emoji">{{ isGhost ? '🌙' : '💤' }}</div>
        <h1>{{ isGhost ? '小站暂时隐身中' : '小站正在打盹，马上回来' }}</h1>
        <p>
          <template v-if="isGhost">寜暂时把内容收进了抽屉。<br />页面稍后恢复，别走开太久。</template>
          <template v-else>寜跑去后台搬砖了，瓦片正在重新码放。<br />泡杯茶等一下，或者去别处逛逛。<br />稍等，正在把星星擦亮 ✨</template>
        </p>
        <div class="sub"><span class="dots"><i></i><i></i><i></i></span></div>
      </div>
    </div>
  </div>
</template>

<script>
import { siteStore, SITE_STATUS } from '@/utils/siteStore';

export default {
  name: 'Maintenance',
  computed: {
    isGhost() {
      return siteStore.status === SITE_STATUS.GHOST;
    }
  }
};
</script>

<style>
.maintenance-page {
  min-height: calc(100vh - 68px);
  position: relative;
  overflow: hidden;
}

/* 与首页同款书法水印 */
.maintenance-page .wm {
  position: fixed;
  right: -6%;
  top: 47%;
  bottom: auto;
  transform: translateY(-50%);
  font-family: 'Ma Shan Zheng', 'KaiTi', 'STKaiti', 'BiauKai', serif;
  font-size: min(96vh, 54vw);
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2.5px var(--watermark-stroke);
  opacity: var(--watermark-opacity);
  pointer-events: none;
  user-select: none;
  z-index: 0;
  white-space: nowrap;
}

.maintenance-page .wrap {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 68px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.maintenance-page .card {
  max-width: 520px;
  text-align: center;
  padding: 40px 36px;
  border-radius: 18px;
  background: var(--card-gradient);
  border: 1px solid var(--accent-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  backdrop-filter: blur(10px);
}

.maintenance-page .emoji {
  font-size: 42px;
  line-height: 1;
}

.maintenance-page h1 {
  margin: 16px 0 10px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.maintenance-page p {
  margin: 0;
  line-height: 2;
  color: var(--text-secondary);
  font-size: 15px;
}

.maintenance-page .sub {
  margin-top: 18px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.maintenance-page .dots i {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin: 0 2px;
  border-radius: 50%;
  background: var(--accent-strong);
  animation: mDotsBlink 1.4s infinite both;
}

.maintenance-page .dots i:nth-child(2) { animation-delay: 0.2s; }
.maintenance-page .dots i:nth-child(3) { animation-delay: 0.4s; }

@keyframes mDotsBlink {
  0%, 80%, 100% { opacity: 0.25; }
  40% { opacity: 1; }
}
</style>
