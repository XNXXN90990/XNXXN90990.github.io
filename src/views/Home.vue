<template>
  <div class="home">
    <!-- 开机终端加载动画 -->
    <LoadingSpinner v-if="isLoading" />

    <!-- 首屏 Hero：左文右头像 -->
    <section class="hero">
      <div class="hero-inner">
        <!-- 左侧文字区 -->
        <div class="hero-text">
          <div class="welcome-banner">
            <h1 class="hero-line line1" ref="line1"></h1>
            <h1 class="hero-line line2" ref="line2"></h1>
          </div>

          <!-- 打字机副标题：固定高度，防止内容变化引起布局跳动 -->
          <div class="typewriter-line" aria-live="polite">
            <span class="typewriter-text">{{ typewriterText }}</span><span class="type-caret" aria-hidden="true"></span>
          </div>

          <p class="hero-intro">很高兴与你相遇！这里会分享教程、学习路线、随笔与杂谈~</p>

          <div class="hero-actions">
            <a :href="githubUrl" target="_blank" rel="noopener noreferrer" class="hero-btn">
              <i class="fab fa-github"></i>
              <span>GitHub</span>
            </a>
            <button type="button" class="hero-btn hero-btn--ghost" @click="scrollToPosts">
              <span>看文章</span>
              <i class="fas fa-arrow-down"></i>
            </button>
          </div>
        </div>

        <!-- 右侧头像区：光辉 + 翻转 -->
        <div class="hero-avatar">
          <div class="avatar-scene">
            <div class="avatar-glow" aria-hidden="true"></div>
            <div
              class="avatar-flip"
              :class="{ 'flipped': avatarFlipped }"
              role="button"
              tabindex="0"
              aria-label="头像，悬停或点击翻面"
              @click="avatarFlipped = !avatarFlipped"
              @keydown.enter.prevent="avatarFlipped = !avatarFlipped"
            >
              <div class="avatar-face avatar-front">
                <img :src="avatarUrl" alt="寜的头像" draggable="false" />
              </div>
              <div class="avatar-face avatar-back">
                <img :src="avatarBackUrl" alt="头像背面" draggable="false" />
              </div>
            </div>
          </div>
          <p class="avatar-hint">
            <span class="hint-desktop">鼠标放到头像上试试 ✨</span>
            <span class="hint-mobile">点头像试试 ✨</span>
          </p>
        </div>
      </div>

      <!-- 下滑引导箭头 -->
      <div class="arrow-container" @click="scrollToPosts" role="button" aria-label="下滑查看文章">
        <div class="guide-line"></div>
        <div class="arrow-down"></div>
      </div>
    </section>

    <!-- 公告条 -->
    <div class="notice-strip">
      <i class="fas fa-bullhorn notice-icon"></i>
      <span>欢迎来到寜的小站！博客刚刚开张，文章持续更新中，也欢迎去「关于」页找我玩~</span>
    </div>

    <!-- 文章卡片展示区域 -->
    <div class="card-container">
      <div class="posts-container">
        <div
          v-for="(post, index) in posts"
          :key="post.id"
          class="post-card row-reveal-item"
          :data-post-id="post.id"
          :data-row-key="getPostRowKey(index)"
          role="link"
          tabindex="0"
          :aria-label="`打开文章：${post.title}`"
          :class="[
            {
              'scan-active': isActive(post.id) || hoveredCardId === post.id,
              'active-post': isActive(post.id),
              'row-revealed': isHomeRowRevealed(getPostRowKey(index))
            }
          ]"
          @mouseenter="hoveredCardId = post.id"
          @mouseleave="hoveredCardId = null"
          @click="goToPost(post.id)"
          @keydown.enter.prevent="goToPost(post.id)"
          @keydown.space.prevent="goToPost(post.id)">
          <div class="post-cover-wrap">
            <img :src="post.cover || defaultCover" :alt="post.title" class="post-cover" loading="lazy" />
            <div v-if="post.cardBadges && post.cardBadges.length" class="post-badges">
              <span
                v-for="b in post.cardBadges"
                :key="b.key"
                class="post-badge"
                :class="b.className"
              >{{ b.label }}</span>
            </div>
          </div>
          <div class="post-info">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-description">{{ truncateContent(post.description) }}</p>
            <p class="post-date">发布于 {{ formatDate(post.date) }}</p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <p v-if="!isLoading && posts.length === 0" class="empty-state">
        还没有文章，快去 content/posts/ 里写第一篇吧！
      </p>

      <!-- 分页控件 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchPosts } from '@/api';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { getPostCardBadges } from '@/utils/postCardBadges';
import avatarUrl from '@/assets/imgs/avatar.jpg';
import avatarBackUrl from '@/assets/imgs/avatar-back.jpg';

const TYPE_PHRASES = [
  '寜的小站·Ning\'s Blog',
  '宁静致远·记录学习、生活与思考',
  '教程/学习路线/随笔/杂谈说说'
];

export default {
  name: 'Home',
  components: {
    LoadingSpinner
  },
  data() {
    return {
      // 素材
      avatarUrl,
      avatarBackUrl,
      githubUrl:
        (import.meta.env.VITE_GITHUB_URL && String(import.meta.env.VITE_GITHUB_URL).trim()) ||
        'https://github.com/XNXXN90990',
      defaultCover: '/covers/git.svg',

      // 文章数据
      posts: [],
      currentPage: 1,
      pageSize: 12,
      total: 0,

      // 头像翻转（触屏点击用；桌面端走 CSS hover）
      avatarFlipped: false,

      // 打字机
      typewriterText: '',
      typewriterTimer: null,
      isTypewriterDeleting: false,
      typewriterPhraseIndex: 0,

      // 悬停卡片 ID
      hoveredCardId: null,

      // 手机端滚动时处于视口中间区域的文章卡片 ID 列表
      activePostIds: [],

      // 已经触发滚动显现动画的行 key
      revealedRowKeys: [],

      // 卡片滚动观察器
      cardObserver: null,
      resizeTimer: null,

      // 加载状态
      isLoading: true
    };
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize));
    }
  },
  async mounted() {
    try {
      await Promise.all([this.loadPosts(), this.delay(1100)]);
    } finally {
      this.isLoading = false; // 隐藏加载动画
      this.animateText(); // 触发大标题动画
      this.startTypewriter(); // 启动打字机
      window.addEventListener('scroll', this.updateActivePosts, { passive: true });
      window.addEventListener('resize', this.handleHomeResize, { passive: true });
      this.setupHomeRowReveal();
      this.warmupRouteChunks();
    }
  },
  beforeUnmount() {
    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
    window.removeEventListener('scroll', this.updateActivePosts);
    window.removeEventListener('resize', this.handleHomeResize);
    if (this.cardObserver) {
      this.cardObserver.disconnect();
      this.cardObserver = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  },
  methods: {
    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    // ---------- 打字机 ----------
    startTypewriter() {
      if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
      this.isTypewriterDeleting = false;
      const type = () => {
        const current = TYPE_PHRASES[this.typewriterPhraseIndex] || '';
        if (!this.isTypewriterDeleting) {
          this.typewriterText = current.slice(0, this.typewriterText.length + 1);
          if (this.typewriterText === current) {
            // 打完停顿一会再删除
            this.typewriterTimer = setTimeout(() => {
              this.isTypewriterDeleting = true;
              type();
            }, 2200);
            return;
          }
          this.typewriterTimer = setTimeout(type, 95);
        } else {
          this.typewriterText = current.slice(0, this.typewriterText.length - 1);
          if (this.typewriterText === '') {
            // 删完切下一句
            this.isTypewriterDeleting = false;
            this.typewriterPhraseIndex = (this.typewriterPhraseIndex + 1) % TYPE_PHRASES.length;
            this.typewriterTimer = setTimeout(type, 450);
            return;
          }
          this.typewriterTimer = setTimeout(type, 38);
        }
      };
      type();
    },

    // ---------- 大标题逐字动画 ----------
    animateText() {
      if (!this.$refs.line1 || !this.$refs.line2) return;

      const line1Text = '你好，';
      const line2Text = "Welcome To Ning's Blog！";

      // 第一行：中文，逐字浮现
      this.$refs.line1.innerHTML = line1Text
        .split('')
        .map((char, index) => `<span class="char" style="animation-delay:${index * 0.12}s">${char}</span>`)
        .join('');

      // 第二行：英文，整体渐变 + 弹性滑入
      this.$refs.line2.textContent = line2Text;
    },

    // ---------- 滚动与分页 ----------
    scrollToPosts() {
      const el = document.querySelector('.notice-strip');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    goToPost(postId) {
      this.$router.push({ name: 'PostDetail', params: { id: postId } });
    },
    async loadPosts() {
      try {
        const response = await fetchPosts(this.currentPage, this.pageSize);
        const payload = response?.data || {};
        const rows = payload.rows || [];
        this.posts = rows.map((p) => ({
          ...p,
          cardBadges: getPostCardBadges(p)
        }));
        this.total = Number(payload.total) || 0;
        this.$nextTick(() => {
          this.updateActivePosts();
          this.revealedRowKeys = [];
          this.setupHomeRowReveal();
        });
      } catch (error) {
        console.error('加载文章失败:', error);
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadPosts();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadPosts();
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString || '');
      if (Number.isNaN(date.getTime())) return '未知';
      return date.toLocaleDateString('zh-CN');
    },
    truncateContent(description) {
      if (!description) return '暂无描述';
      return description.length > 100 ? description.substring(0, 100) + '...' : description;
    },

    // ---------- 手机端滚动高亮 ----------
    isMobileView() {
      return window.innerWidth <= 768;
    },
    updateActivePosts() {
      if (!this.isMobileView()) {
        this.activePostIds = [];
        return;
      }

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // 往下滑动到文章区域之前，不高亮任何文章
      if (scrollY < viewportHeight * 0.7) {
        this.activePostIds = [];
        return;
      }

      const cards = document.querySelectorAll('.posts-container .post-card');
      if (!cards.length) {
        this.activePostIds = [];
        return;
      }

      const viewportCenterY = window.innerHeight / 2;
      const distances = [];

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenterY - viewportCenterY);
        const idAttr = card.getAttribute('data-post-id');
        if (idAttr) {
          distances.push({ id: idAttr, distance });
        }
      });

      distances.sort((a, b) => a.distance - b.distance);
      const nearestIds = distances.map((item) => item.id);

      const active = [];
      if (nearestIds.length > 0) active.push(nearestIds[0]);
      if (scrollY >= viewportHeight * 1.0 && nearestIds.length > 1) active.push(nearestIds[1]);

      this.activePostIds = active;
    },
    isActive(postId) {
      return this.activePostIds.includes(String(postId));
    },
    handleHomeResize() {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.revealedRowKeys = [];
        this.setupHomeRowReveal();
      }, 140);
    },
    getPostColumns() {
      return window.innerWidth <= 768 ? 1 : 3;
    },
    getPostRowKey(index) {
      const columns = this.getPostColumns();
      return `post-row-${Math.floor(index / columns)}`;
    },
    isHomeRowRevealed(rowKey) {
      return this.revealedRowKeys.includes(rowKey);
    },
    setupHomeRowReveal() {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
      if (this.cardObserver) this.cardObserver.disconnect();

      this.cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const rowKey = entry.target.getAttribute('data-row-key');
          if (rowKey && !this.revealedRowKeys.includes(rowKey)) {
            this.revealedRowKeys.push(rowKey);
          }
          this.cardObserver.unobserve(entry.target);
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
      });

      const postCards = document.querySelectorAll('.posts-container .post-card.row-reveal-item');
      const columns = this.getPostColumns();
      for (let i = 0; i < postCards.length; i += columns) {
        this.cardObserver.observe(postCards[i]);
      }
    },
    warmupRouteChunks() {
      // 省流模式/慢网：不预取，避免浪费流量
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const saveData = !!conn?.saveData;
      const effectiveType = conn?.effectiveType;
      const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';
      if (saveData || isSlow) return;

      const prefetch = () => {
        import('@/views/About.vue');
        import('@/views/Archive.vue');
        import('@/views/Links.vue');
        import('@/views/PostDetail.vue');
        import('@/views/Private.vue');
      };

      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(prefetch, { timeout: 2500 });
      } else {
        setTimeout(prefetch, 900);
      }
    }
  }
};
</script>

<style>
/* 本地 Bebas Neue 字体（用于英文大标题） */
@font-face {
  font-family: 'Bebas Neue';
  src: url('@/assets/fonts/BebasNeue-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.home {
  padding: 20px 20px 0;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* =========================
   Hero 首屏
   ========================= */
.hero {
  position: relative;
  min-height: calc(100vh - 108px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-inner {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 30px 10px 70px;
}

.hero-text {
  flex: 1 1 0;
  min-width: 0; /* 允许内容收缩，防止长文本撑破布局 */
}

.welcome-banner {
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
  text-align: left;
}

.hero-line {
  margin: 0;
  font-weight: normal;
  letter-spacing: 2px;
  line-height: 1.15;
  overflow-wrap: break-word;
}

.line1 {
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: clamp(28px, 4vw, 46px);
  font-weight: 700;
}

.line2 {
  font-size: clamp(30px, 4.6vw, 58px);
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: pre-wrap;
  display: inline-block;
  opacity: 0;
  transform: translateX(60px);
  animation: slideInLeft 1.6s cubic-bezier(0.68, -0.45, 0.265, 1.45) 0.35s forwards;
}

.line1 .char {
  display: inline-block;
  opacity: 0;
  color: var(--text-primary);
  text-shadow: 0 0 18px rgba(57, 255, 126, 0.35);
  animation: fadeIn 0.5s forwards;
}

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* 打字机副标题（固定高度防跳动） */
.typewriter-line {
  margin-top: 18px;
  min-height: 2.1em;
  font-size: clamp(17px, 2vw, 23px);
  line-height: 1.7;
  color: var(--text-secondary);
  display: flex;
  align-items: flex-start;
  max-width: 560px;
}

.typewriter-text {
  word-break: break-word;
}

.type-caret {
  display: inline-block;
  width: 2px;
  height: 1.15em;
  margin-left: 4px;
  margin-top: 0.3em;
  background: var(--accent-strong);
  box-shadow: 0 0 8px rgba(57, 255, 126, 0.7);
  animation: caretBlink 0.9s step-end infinite;
  flex-shrink: 0;
}

@keyframes caretBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.hero-intro {
  margin: 14px 0 0;
  font-size: 16px;
  color: var(--text-muted);
  max-width: 520px;
}

.hero-actions {
  margin-top: 26px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 20px;
  border-radius: 999px;
  border: 1px solid var(--accent-border);
  background: var(--accent-soft);
  color: var(--text-primary);
  font-size: 15px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-hover-shadow);
}

.hero-btn--ghost {
  background: transparent;
  border-color: var(--surface-border);
}

/* =========================
   头像：光辉 + 3D 翻转
   ========================= */
.hero-avatar {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.avatar-scene {
  position: relative;
  width: 280px;
  height: 280px;
  perspective: 1100px; /* 3D 透视：翻转更有立体感 */
}

/* 光辉圆环：头像背后的发光层 */
.avatar-glow {
  position: absolute;
  inset: -18px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(57, 255, 126, 0.4) 0%, rgba(0, 184, 40, 0.16) 45%, transparent 70%);
  filter: blur(10px);
  opacity: 0.75;
  transition: opacity 0.45s ease, transform 0.45s ease;
  animation: glowBreath 3.6s ease-in-out infinite;
  pointer-events: none;
}

:root[data-theme='light'] .avatar-glow {
  background: radial-gradient(circle, rgba(15, 138, 56, 0.3) 0%, rgba(15, 138, 56, 0.12) 45%, transparent 70%);
}

@keyframes glowBreath {
  0%, 100% { transform: scale(1); opacity: 0.65; }
  50% { transform: scale(1.05); opacity: 0.95; }
}

/* 悬停时光辉变亮 */
.avatar-scene:hover .avatar-glow,
.avatar-scene:focus-within .avatar-glow {
  opacity: 1;
  transform: scale(1.1);
  animation: none;
}

.avatar-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.4, 0.1, 0.2, 1);
  cursor: pointer;
}

.avatar-scene:hover .avatar-flip,
.avatar-flip.flipped {
  transform: rotateY(180deg);
}

.avatar-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: 4px solid var(--card-border);
  box-shadow: var(--card-shadow), 0 0 22px rgba(57, 255, 126, 0.28);
}

:root[data-theme='light'] .avatar-face {
  box-shadow: var(--card-shadow), 0 0 18px rgba(15, 138, 56, 0.2);
}

.avatar-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  user-select: none;
}

.avatar-back {
  transform: rotateY(180deg);
}

.avatar-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.hint-mobile {
  display: none;
}

/* 下滑引导箭头 */
.arrow-container {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  cursor: pointer;
  animation: floatAndBlink 3.6s infinite ease-in-out;
  will-change: transform;
}

.guide-line {
  width: 2px;
  height: 40px;
  background-color: var(--accent);
  border-radius: 999px;
  box-shadow: 0 0 5px var(--accent);
}

.arrow-down {
  width: 30px;
  height: 30px;
  background-color: var(--accent-strong);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E") no-repeat center;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E") no-repeat center;
}

@keyframes floatAndBlink {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  50% {
    transform: translateX(-50%) translateY(-5px);
    opacity: 0.72;
  }
}

/* =========================
   公告条 + 文章卡片
   ========================= */
.notice-strip {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 18px;
  padding: 12px 18px;
  border-radius: 12px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  font-size: 14px;
  scroll-margin-top: 84px; /* 平滑滚动定位时给固定头部留出空间 */
}

.notice-icon {
  color: var(--accent);
  flex-shrink: 0;
}

.card-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.posts-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px 0;
  width: 100%;
  box-sizing: border-box;
}

.post-card {
  background: var(--card-gradient);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: opacity 0.55s ease, transform 0.55s ease, border 0.3s ease, box-shadow 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  cursor: pointer;
  outline: none;
  opacity: 0;
  transform: translateY(24px);
}

.post-card.row-revealed {
  opacity: 1;
  transform: translateY(0);
}

.post-card:hover,
.post-card:focus-visible {
  transform: translateY(-5px);
  border: 2px solid var(--accent);
  box-shadow: var(--card-hover-shadow);
}

/* 扫描线动画 */
.post-card::before {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to bottom, transparent, var(--accent), transparent);
  z-index: 10;
}

.post-card.scan-active::before {
  animation: scanLine 1s ease-in-out;
}

@keyframes scanLine {
  0% { top: 0%; }
  100% { top: 100%; }
}

.post-cover-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.post-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: calc(100% - 16px);
  pointer-events: none;
}

.post-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  color: #fff;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.post-badge--pinned {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.post-badge--featured {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.post-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.post-card:hover .post-cover,
.active-post .post-cover {
  filter: grayscale(0%);
}

.post-info {
  padding: 15px;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 10px;
  color: var(--text-primary);
}

.post-date {
  font-size: 12px;
  color: var(--text-muted);
  margin: 3px 0 0;
  text-align: right;
}

.post-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.3;
  margin: 0;
}

.empty-state {
  padding: 40px 0;
  color: var(--text-secondary);
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  color: var(--text-secondary);
}

.pagination button {
  padding: 8px 16px;
  background: var(--btn-bg);
  border: 1px solid var(--surface-border);
  border-radius: 5px;
  color: var(--btn-text);
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  background: var(--btn-hover-bg);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* =========================
   平板 / 手机适配
   ========================= */
@media (max-width: 900px) {
  .hero-inner {
    flex-direction: column-reverse; /* 手机端：头像在上，文字在下 */
    gap: 22px;
    padding-bottom: 60px;
    text-align: center;
  }

  .hero-text {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .welcome-banner {
    text-align: center;
  }

  .typewriter-line {
    justify-content: center;
    max-width: 100%;
  }

  .hero-intro {
    text-align: center;
  }

  .hero-actions {
    justify-content: center;
  }

  .avatar-scene {
    width: 210px;
    height: 210px;
  }

  .hint-desktop {
    display: none;
  }

  .hint-mobile {
    display: inline;
  }
}

@media (max-width: 768px) {
  .home {
    padding: 16px 16px 0;
  }

  .posts-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .post-cover {
    height: 130px;
  }

  .post-title {
    font-size: 16px;
  }

  .post-description {
    font-size: 12px;
  }

  .post-date {
    font-size: 11px;
  }

  .pagination {
    margin-top: 14px;
  }

  .notice-strip {
    font-size: 13px;
    padding: 10px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arrow-container,
  .avatar-glow {
    animation: none;
  }

  .line2 {
    animation-duration: 0.01s;
  }
}
</style>
