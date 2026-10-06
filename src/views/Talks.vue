<template>
  <div class="talks-page">
    <div class="talks-inner">
      <div class="page-header">
        <div class="page-tagline">MOMENTS</div>
        <div class="page-title-gradient">说说</div>
      </div>
      <p class="page-subtitle">一些即时的心情和碎碎念，不成文章，但值得记录。</p>

      <div class="talks-timeline">
        <div v-for="(talk, index) in talks" :key="talk.id" class="talk-item" :style="{ animationDelay: (index * 0.06) + 's' }">
          <div class="talk-dot"></div>
          <div class="talk-card">
            <div class="talk-head">
              <img :src="avatarUrl" alt="寜" class="talk-avatar" />
              <div class="talk-author">
                <span class="talk-name">寜</span>
                <span class="talk-date">{{ formatDate(talk.date) }}</span>
              </div>
              <span v-if="talk.mood" class="talk-mood"><i class="fa-regular fa-face-smile"></i> {{ talk.mood }}</span>
            </div>
            <p class="talk-content">{{ talk.content }}</p>
            <div v-if="talk.tags && talk.tags.length" class="talk-tags">
              <span v-for="t in talk.tags" :key="t" class="talk-tag"># {{ t }}</span>
            </div>
          </div>
        </div>

        <div v-if="!talks.length && !loading" class="empty-state">还没有说说，快去 content/talks.json 里写第一条吧！</div>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchTalks } from '@/api';
import { formatDate } from '@/utils/format';
import avatarUrl from '@/assets/imgs/avatar.jpg';

export default {
  name: 'Talks',
  data() {
    return { talks: [], loading: true, avatarUrl };
  },
  async created() {
    try {
      const resp = await fetchTalks();
      this.talks = resp.data || [];
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(dateStr) {
      const d = new Date((dateStr || '').replace(' ', 'T'));
      if (Number.isNaN(d.getTime())) return '未知时间';
      return d.toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }
};
</script>

<style scoped>
.talks-page {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 68px);
}

.talks-inner {
  width: 100%;
  max-width: 760px;
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

.talks-timeline {
  position: relative;
  padding-left: 22px;
}

.talks-timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 6px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent), var(--surface-border));
  border-radius: 999px;
}

.talk-item {
  position: relative;
  margin-bottom: 18px;
  opacity: 0;
  transform: translateY(14px);
  animation: talkIn 0.5s ease forwards;
}

@keyframes talkIn {
  to { opacity: 1; transform: translateY(0); }
}

.talk-dot {
  position: absolute;
  left: -20px;
  top: 22px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

.talk-card {
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
}

.talk-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.talk-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--card-border);
}

.talk-author {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.talk-name {
  font-size: 14px;
  font-weight: 700;
}

.talk-date {
  font-size: 12px;
  color: var(--text-muted);
}

.talk-mood {
  font-size: 12px;
  color: var(--text-muted);
}

.talk-mood i {
  color: var(--accent);
  margin-right: 4px;
}

.talk-content {
  margin: 12px 0 0;
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.talk-tags {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.talk-tag {
  font-size: 12px;
  color: var(--blog-link-color);
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  border-radius: 999px;
  padding: 2px 10px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .talks-page {
    padding: 16px 14px 10px;
  }

  .page-title-gradient {
    font-size: 36px;
  }
}
</style>
