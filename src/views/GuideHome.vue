<template>
  <div class="guide-home">
    <div class="guide-inner">
      <div class="page-header">
        <div class="page-tagline">READING&nbsp;GUIDES</div>
        <div class="page-title-gradient">指南收藏</div>
      </div>
      <p class="page-subtitle">
        收录几本我认真读过、并且深受其益的开源手册。内容完整导入站内，方便随时查阅；
        <span class="highlight">版权归原作者所有</span>，每本书的出处都标在目录页里。
      </p>

      <div class="guide-grid">
        <div
          v-for="g in guides"
          :key="g.id"
          class="guide-card"
          role="link"
          tabindex="0"
          @click="openGuide(g.id)"
          @keydown.enter.prevent="openGuide(g.id)"
        >
          <div class="guide-card-head">
            <i class="fa-solid fa-book guide-card-icon"></i>
            <h2 class="guide-card-title">{{ g.title }}</h2>
          </div>
          <p class="guide-card-intro">{{ g.intro }}</p>
          <div class="guide-card-meta">
            <span class="guide-meta-item"><i class="fa-solid fa-feather"></i> {{ g.source.author }}</span>
            <span class="guide-meta-item"><i class="fa-solid fa-file-lines"></i> {{ docCount(g.id) }} 篇</span>
            <span class="guide-meta-item"><i class="fa-solid fa-scale-balanced"></i> {{ g.source.license }}</span>
          </div>
          <div class="guide-card-open">进入阅读 <i class="fa-solid fa-angle-right"></i></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchGuides, flattenGuideChapters } from '@/api';

export default {
  name: 'GuideHome',
  data() {
    return { guides: [] };
  },
  created() {
    this.guides = fetchGuides();
  },
  methods: {
    docCount(gid) {
      return flattenGuideChapters(this.guides.find((g) => g.id === gid)?.chapters).length;
    },
    openGuide(gid) {
      this.$router.push(`/guide/${gid}`);
    }
  }
};
</script>

<style scoped>
.guide-home {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 68px);
}

.guide-inner {
  width: 100%;
  max-width: 1000px;
}

.page-header {
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 8px;
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

.page-subtitle {
  margin-bottom: 24px;
  color: var(--text-secondary);
}

.highlight {
  color: var(--blog-link-color);
  font-weight: 600;
}

.guide-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.guide-card {
  padding: 22px 24px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  cursor: pointer;
  transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.guide-card:hover,
.guide-card:focus-visible {
  transform: translateY(-3px);
  border: 1px solid var(--accent-border);
  box-shadow: var(--card-hover-shadow);
}

.guide-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.guide-card-icon {
  color: var(--accent);
  font-size: 22px;
}

.guide-card-title {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.guide-card-intro {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.guide-card-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
}

.guide-card-meta i {
  color: var(--accent);
  margin-right: 4px;
}

.guide-card-open {
  margin-top: 14px;
  font-size: 13px;
  color: var(--blog-link-color);
}

@media (max-width: 768px) {
  .guide-home {
    padding: 16px 14px 10px;
  }

  .page-title-gradient {
    font-size: 36px;
  }
}
</style>
