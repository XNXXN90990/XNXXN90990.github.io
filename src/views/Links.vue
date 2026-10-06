<template>
  <div class="links">
    <div class="links-inner">
      <div class="links-header">
        <div class="links-tagline">FRIEND&nbsp;LINKS</div>
        <div class="links-title-gradient">友情链接</div>
      </div>
      <p class="links-subtitle">这里是寜的友链小角落，欢迎互相串门。</p>
      <p v-if="loadingLinks" class="links-status">友链加载中...</p>
      <p v-else-if="linksError" class="links-status links-status-error">{{ linksError }}</p>

      <!-- 友链列表（按分组展示） -->
      <div v-for="(group, gIndex) in friendGroups" :key="gIndex" class="links-group">
        <h2 class="group-title">{{ group.class_name }}</h2>
        <p class="group-desc" v-if="group.class_desc">{{ group.class_desc }}</p>

        <div class="links-grid">
          <a v-for="(site, index) in group.link_list" :key="site.link || index" class="link-card row-reveal-item" :href="site.link"
            target="_blank" rel="noopener">
            <div class="link-card-header">
              <img class="link-avatar" :src="site.avatar" :alt="site.name" />
              <div class="link-meta">
                <h2 class="link-name">{{ site.name }}</h2>
                <p class="link-descr">
                  {{ site.descr || '这个站长有点酷，还没写简介~' }}
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>

      <!-- 友链说明 & 格式 -->
      <div class="links-rules">
        <h2 class="rules-title">想交换友链吗？</h2>
        <p>
          欢迎通过
          <a class="highlight highlight-link" href="https://github.com/XNXXN90990" target="_blank" rel="noopener">GitHub</a>
          或
          <router-link class="highlight highlight-link" to="/about">关于页</router-link>
          里的联系方式找我！
        </p>
        <p class="rules-subtitle">请先确保以下几点：</p>
        <ul>
          <li>
            你已经将
            <span class="highlight">寜的小站</span>
            添加至贵站友链
          </li>
          <li>
            你的网站内容
            <span class="highlight">健康合规</span>
          </li>
          <li>
            你的网站可以
            <span class="highlight">正常访问、加载流畅</span>
          </li>
        </ul>

        <h3 class="rules-subtitle-strong">我的友链信息：</h3>
        <pre class="links-code">
- name: 寜的小站
  link: https://xnxxn90990.github.io
  avatar: https://xnxxn90990.github.io/favicon.jpg
  descr: 宁静致远，记录学习、生活与思考
        </pre>

        <h3 class="rules-subtitle-strong">你可以按这个格式发给我：</h3>
        <pre class="links-code">
- name: //[网站标题]
  link: //[网站网址]
  avatar: //[头像链接]
  descr: //[一句话简介]
        </pre>

        <p class="links-tip">
          你的友链会在我看到信息的下次更新加上哦~ 如果发现我遗漏了可以戳戳我~
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchLinks } from '@/api';

export default {
  name: 'Links',
  data() {
    return {
      friendGroups: [],
      loadingLinks: false,
      linksError: '',
      rowObserver: null,
      resizeTimer: null
    };
  },
  async mounted() {
    await this.loadLinks();
    this.$nextTick(() => {
      this.setupRowReveal();
    });
    window.addEventListener('resize', this.handleResize, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.rowObserver) {
      this.rowObserver.disconnect();
      this.rowObserver = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  },
  methods: {
    async loadLinks() {
      this.loadingLinks = true;
      this.linksError = '';
      try {
        const res = await fetchLinks();
        if (res && res.code === 200 && Array.isArray(res.data)) {
          this.friendGroups = res.data.map((group) => ({
            class_name: group.class_name ?? group.className ?? '',
            class_desc: group.class_desc ?? group.classDesc ?? '',
            link_list: Array.isArray(group.link_list ?? group.linkList)
              ? (group.link_list ?? group.linkList).map((site) => ({
                name: site.name ?? '',
                link: site.link ?? '',
                avatar: site.avatar ?? '',
                descr: site.descr ?? ''
              }))
              : []
          }));
        } else {
          this.friendGroups = [];
          this.linksError = '友链数据暂时不可用，请稍后再试。';
        }
      } catch (e) {
        this.friendGroups = [];
        this.linksError = '友链加载失败，请稍后刷新重试。';
        console.error('获取友链列表失败', e);
      } finally {
        this.loadingLinks = false;
      }
    },
    handleResize() {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.setupRowReveal();
      }, 140);
    },
    setupRowReveal() {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

      if (this.rowObserver) this.rowObserver.disconnect();
      const cards = document.querySelectorAll('.links-grid .row-reveal-item');
      cards.forEach((card) => {
        card.classList.remove('row-revealed');
        card.removeAttribute('data-row-key');
      });

      this.rowObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const rowKey = entry.target.getAttribute('data-row-key');
          if (!rowKey) return;
          const rowItems = document.querySelectorAll(`.links-grid .row-reveal-item[data-row-key="${rowKey}"]`);
          rowItems.forEach((item) => item.classList.add('row-revealed'));
          this.rowObserver.unobserve(entry.target);
        });
      }, {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px'
      });

      const groups = document.querySelectorAll('.links-group');
      groups.forEach((group, groupIndex) => {
        const groupCards = group.querySelectorAll('.links-grid .row-reveal-item');
        const rowTops = [];
        const rowFirstCard = new Map();

        groupCards.forEach((card) => {
          const top = card.offsetTop;
          let rowIndex = rowTops.findIndex((item) => Math.abs(item - top) < 6);
          if (rowIndex === -1) {
            rowTops.push(top);
            rowIndex = rowTops.length - 1;
          }
          const rowKey = `group-${groupIndex}-row-${rowIndex}`;
          card.setAttribute('data-row-key', rowKey);
          if (!rowFirstCard.has(rowKey)) rowFirstCard.set(rowKey, card);
        });

        rowFirstCard.forEach((firstCard) => this.rowObserver.observe(firstCard));
      });
    }
  }
};
</script>

<style scoped>
.links {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  color: var(--text-primary);
  background: transparent;
  display: flex;
  justify-content: center;
}

.links-inner {
  width: 100%;
  max-width: 1300px;
}

.links-header {
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 8px;
}

.links-tagline {
  font-size: 20px;
  letter-spacing: 4px;
  color: var(--text-secondary);
}

.links-title-gradient {
  font-size: 46px;
  letter-spacing: 6px;
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.links-subtitle {
  margin-bottom: 24px;
  color: var(--text-secondary);
}

.links-status {
  margin: 0 0 20px;
  color: var(--text-secondary);
}

.links-status-error {
  color: var(--error-text);
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.link-card {
  position: relative;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  border-radius: 10px;
  background: var(--card-gradient);
  border: 2px solid transparent;
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  overflow: hidden;
  transition: transform 0.3s ease, border 0.3s ease, box-shadow 0.3s ease, opacity 0.55s ease;
  opacity: 0;
  transform: translateY(24px);
}

.link-card.row-revealed {
  opacity: 1;
  transform: translateY(0);
}

.link-card::before {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to bottom, transparent, var(--accent), transparent);
  z-index: 1;
  opacity: 0;
}

.link-card:hover {
  transform: translateY(-5px);
  border: 2px solid var(--accent);
  box-shadow: var(--card-hover-shadow);
}

.link-card:hover::before {
  opacity: 1;
  animation: scanLine 1s ease-in-out;
}

.link-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--card-border);
  background: var(--input-bg);
}

.link-meta {
  overflow: hidden;
}

.link-name {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin: 0 0 4px 0;
}

.link-descr {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: normal;
  text-overflow: clip;
  overflow: visible;
}

.links-rules {
  margin-top: 24px;
  margin-bottom: 24px;
  padding: 16px 18px;
  background-color: var(--surface);
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  font-size: 0.95rem;
}

.rules-title {
  margin-top: 0;
  margin-bottom: 6px;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.rules-subtitle {
  margin: 4px 0;
  color: var(--text-secondary);
}

.rules-subtitle-strong {
  margin: 10px 0 4px;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.links-rules ul {
  padding-left: 1.2em;
  margin: 8px 0 16px;
}

.links-rules li {
  margin: 4px 0;
}

.highlight {
  color: var(--blog-link-color);
  font-weight: 600;
}

.highlight-link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

@keyframes scanLine {
  0% {
    top: -10px;
  }

  100% {
    top: 100%;
  }
}

.links-code {
  background-color: var(--input-bg);
  color: var(--text-primary);
  border-radius: 6px;
  padding: 10px 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre;
  overflow-x: auto;
  border: 1px solid var(--input-border);
  margin-bottom: 12px;
}

.links-tip {
  margin-top: 4px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .links {
    padding: 16px;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>
