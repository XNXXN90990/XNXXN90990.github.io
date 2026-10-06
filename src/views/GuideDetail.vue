<template>
  <div class="guide-detail">
    <div class="guide-detail-inner">
      <button class="back-btn" type="button" @click="$router.push('/guide')">
        <i class="fa-solid fa-angle-left"></i> 返回书架
      </button>

      <template v-if="guide">
        <div class="page-header">
          <div class="page-tagline">GUIDE</div>
          <div class="page-title-gradient">{{ guide.title }}</div>
        </div>

        <p class="guide-intro">{{ guide.intro }}</p>

        <!-- 出处标注 -->
        <div class="source-card">
          <div class="source-title"><i class="fa-solid fa-circle-info"></i> 本文收录自开源项目，版权归原作者所有</div>
          <div class="source-items">
            <span class="source-item"><i class="fa-solid fa-feather"></i> {{ guide.source.author }}</span>
            <a class="source-item source-link" :href="guide.source.site" target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-globe"></i> 在线原站
            </a>
            <a class="source-item source-link" :href="guide.source.repo" target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-github"></i> 源码仓库
            </a>
            <span class="source-item"><i class="fa-solid fa-scale-balanced"></i> {{ guide.source.license }}</span>
          </div>
        </div>

        <div class="toc-panel">
          <div class="toc-panel-title"><i class="fa-solid fa-list-ul"></i> 全书目录</div>
          <GuideToc :chapters="guide.chapters" :gid="guide.id" :default-open-depth="1" />
        </div>
      </template>

      <div v-else class="empty-state">没有找到这本指南。</div>
    </div>
  </div>
</template>

<script>
import { getGuideById } from '@/api';
import GuideToc from '@/components/GuideToc.vue';

export default {
  name: 'GuideDetail',
  components: { GuideToc },
  computed: {
    guide() {
      return getGuideById(this.$route.params.gid);
    }
  }
};
</script>

<style scoped>
.guide-detail {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 68px);
}

.guide-detail-inner {
  width: 100%;
  max-width: 900px;
}

.back-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: var(--btn-hover-bg);
}

.page-header {
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 10px;
}

.page-tagline {
  font-size: 20px;
  letter-spacing: 4px;
  color: var(--text-secondary);
}

.page-title-gradient {
  font-size: 46px;
  letter-spacing: 6px;
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.guide-intro {
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0 0 16px;
}

/* 出处卡 */
.source-card {
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  margin-bottom: 20px;
}

.source-title {
  font-size: 13px;
  color: var(--pill-text);
  margin-bottom: 10px;
}

.source-title i {
  color: var(--accent);
  margin-right: 6px;
}

.source-items {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.source-item i {
  color: var(--accent);
  margin-right: 4px;
}

.source-link {
  color: var(--blog-link-color);
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}

/* 目录面板 */
.toc-panel {
  padding: 18px 20px 22px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  margin-bottom: 24px;
}

.toc-panel-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.toc-panel-title i {
  color: var(--accent);
  margin-right: 8px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .guide-detail {
    padding: 16px 14px 10px;
  }

  .page-title-gradient {
    font-size: 36px;
  }
}
</style>
