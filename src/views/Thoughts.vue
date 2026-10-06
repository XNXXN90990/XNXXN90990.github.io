<template>
  <div class="thoughts-page">
    <div class="thoughts-inner">
      <div class="page-header">
        <div class="page-tagline">THOUGHTS</div>
        <div class="page-title-gradient">杂想</div>
      </div>
      <p class="page-subtitle">不成体系的思考、方法论的碎片区，想到什么写什么。</p>

      <div class="thoughts-grid">
        <div
          v-for="t in thoughts"
          :key="t.id"
          class="thought-card"
          role="link"
          tabindex="0"
          @click="openThought(t.id)"
          @keydown.enter.prevent="openThought(t.id)"
        >
          <h2 class="thought-title">{{ t.title }}</h2>
          <p class="thought-desc">{{ t.description || '暂无摘要' }}</p>
          <div class="thought-meta">
            <span class="thought-date"><i class="fa-regular fa-calendar"></i> {{ formatDate(t.date) }}</span>
            <span v-for="tag in t.tags.slice(0, 2)" :key="tag" class="thought-tag"># {{ tag }}</span>
          </div>
        </div>
      </div>

      <div v-if="!thoughts.length && !loading" class="empty-state">
        还没有杂想，快去 content/thoughts/ 里写第一篇吧！
      </div>
    </div>
  </div>
</template>

<script>
import { fetchThoughts } from '@/api';
import { formatDate } from '@/utils/format';

export default {
  name: 'Thoughts',
  data() {
    return { thoughts: [], loading: true };
  },
  async created() {
    try {
      const resp = await fetchThoughts(1, 100);
      this.thoughts = resp.data.rows || [];
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate,
    openThought(id) {
      this.$router.push({ name: 'ThoughtDetail', params: { id } });
    }
  }
};
</script>

<style scoped>
.thoughts-page {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 68px);
}

.thoughts-inner {
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
  margin-bottom: 22px;
  color: var(--text-secondary);
}

.thoughts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.thought-card {
  padding: 20px 22px;
  border-radius: 12px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  cursor: pointer;
  transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.thought-card:hover,
.thought-card:focus-visible {
  transform: translateY(-3px);
  border: 1px solid var(--accent-border);
  box-shadow: var(--card-hover-shadow);
}

.thought-title {
  margin: 0 0 10px;
  font-size: 17px;
  color: var(--text-primary);
}

.thought-desc {
  margin: 0 0 14px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.thought-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
}

.thought-date i {
  color: var(--accent);
  margin-right: 4px;
}

.thought-tag {
  color: var(--blog-link-color);
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .thoughts-page {
    padding: 16px 14px 10px;
  }

  .page-title-gradient {
    font-size: 36px;
  }

  .thoughts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
