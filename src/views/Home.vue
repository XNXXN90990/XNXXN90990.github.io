<template>
  <div class="home">
    <!-- 首屏 Hero：左文右头像 -->
    <section class="hero">
      <!-- 星轨（仅深色模式）：参考天环引导页的 canvas 旋转星轨，轨迹累积成圆弧 -->
      <canvas ref="trailCanvas" class="star-trail-canvas" aria-hidden="true"></canvas>

      <!-- 星空/星座层 -->
      <svg class="star-layer" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <!-- 真实星座（d3-celestial 数据，scripts/gen-constellations.mjs 生成），错峰淡入淡出 + 缓慢漂浮 -->
        <g
          v-for="(c, ci) in constellationItems"
          :key="c.id"
          class="constellation"
          :style="constellationMotion(c, ci)"
        >
          <path v-for="(seg, i) in c.paths" :key="'p' + i" class="constellation-line" :d="seg" fill="none" />
          <circle v-for="(s, i) in c.stars" :key="'s' + i" class="constellation-star" :cx="s[0]" :cy="s[1]" r="2.1" />
          <text class="constellation-label" :x="c.label[0]" :y="c.label[1]" text-anchor="middle">{{ c.name }}</text>
        </g>

        <!-- 四芒星（点在真实亮星上，带十字光芒） -->
        <g class="star-flare star--t2" transform="translate(342.4, 115.3)">
          <path d="M 0 -14 L 2.2 -2.2 L 14 0 L 2.2 2.2 L 0 14 L -2.2 2.2 L -14 0 L -2.2 -2.2 Z" />
        </g>
        <g class="star-flare star-flare--sm" transform="translate(957.9, 173.2)">
          <path d="M 0 -10 L 1.8 -1.8 L 10 0 L 1.8 1.8 L 0 10 L -1.8 1.8 L -10 0 L -1.8 -1.8 Z" />
        </g>
        <g class="star-flare star--t3" transform="translate(184.6, 509.3)">
          <path d="M 0 -11 L 2 -2 L 11 0 L 2 2 L 0 11 L -2 2 L -11 0 L -2 -2 Z" />
        </g>
        <!-- 散星 -->
        <circle class="star" cx="90" cy="330" r="1.7" />
        <circle class="star star--t2" cx="230" cy="420" r="1.5" />
        <circle class="star star--t3" cx="380" cy="300" r="1.9" />
        <circle class="star" cx="520" cy="380" r="1.4" />
        <circle class="star star--t2" cx="700" cy="320" r="1.8" />
        <circle class="star star--t3" cx="860" cy="260" r="1.5" />
        <circle class="star" cx="1040" cy="330" r="1.8" />
        <circle class="star star--t2" cx="1180" cy="290" r="1.5" />
        <circle class="star star--t3" cx="1330" cy="360" r="1.9" />
        <circle class="star" cx="1420" cy="200" r="1.5" />
        <circle class="star star--t2" cx="150" cy="560" r="1.6" />
        <circle class="star star--t3" cx="330" cy="640" r="1.4" />
        <circle class="star" cx="600" cy="600" r="1.7" />
        <circle class="star star--t2" cx="820" cy="640" r="1.5" />
        <circle class="star star--t3" cx="1060" cy="600" r="1.8" />
        <circle class="star" cx="1290" cy="650" r="1.5" />
        <circle class="star star--t2" cx="60" cy="150" r="1.4" />
        <circle class="star star--t3" cx="700" cy="40" r="1.6" />
        <circle class="star" cx="1000" cy="60" r="1.4" />
        <circle class="star star--t2" cx="560" cy="60" r="1.3" />
      </svg>

      <!-- 书法水印 -->
      <div class="calligraphy-watermark" aria-hidden="true">寜</div>

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
            <router-link to="/about" class="hero-btn">
              <i class="fa-solid fa-address-card"></i>
              <span>关于我</span>
            </router-link>
            <button type="button" class="hero-btn hero-btn--ghost" @click="scrollToPosts">
              <span>看文章</span>
              <i class="fas fa-arrow-down"></i>
            </button>
          </div>

        </div>

        <!-- 右侧头像区：光辉 + 翻转 + 访客欢迎卡 -->
        <div class="hero-avatar">
          <div
            class="avatar-scene"
            @mouseenter="flipToBack"
            @mouseleave="flipToFront"
          >
            <div class="avatar-glow" aria-hidden="true"></div>
            <div
              class="avatar-flip"
              :class="{ 'flipped': avatarFlipped }"
              role="button"
              tabindex="0"
              aria-label="头像，悬停或点击翻面"
              @click="onAvatarClick"
              @keydown.enter.prevent="toggleFlip"
            >
              <div class="avatar-face avatar-front">
                <img :src="avatarUrl" alt="寜的头像" draggable="false" />
              </div>
              <div class="avatar-face avatar-back">
                <img :src="avatarBackCurrent" alt="头像背面" draggable="false" />
              </div>
            </div>
          </div>

          <!-- 访客欢迎卡（IP 归属地 + 时间问候 + 距离） -->
          <transition name="welcome-fade">
            <div v-if="welcome.show" class="welcome-card">
              <i class="fa-solid fa-location-dot welcome-icon"></i>
              <p class="welcome-text">
                欢迎来自 <b>{{ welcome.region }}</b> 的小伙伴，{{ welcome.greeting }}。<template v-if="welcome.distance">您现在距离站长约 <b>{{ welcome.distance }}</b>。</template>
              </p>
            </div>
          </transition>
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
      <p v-if="posts.length === 0" class="empty-state">
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
import { getPostCardBadges } from '@/utils/postCardBadges';
import avatarUrl from '@/assets/imgs/avatar.jpg';
import avatarBackUrl from '@/assets/imgs/avatar-back.jpg';
import avatarBack2Url from '@/assets/imgs/avatar-back2.png';
import constellationData from '@/content/constellations.json';

const TYPE_PHRASES = [
  '寜的小站·Ning\'s Blog',
  '宁静致远 | 记录学习、生活与思考',
  '教程/学习路线/随笔/杂谈说说'
];

// 站长坐标（杭州 · 拱墅），用于计算与访客的距离；想改位置改这里即可
const OWNER_LOCATION = { lat: 30.3197, lon: 120.1419 };

// 省级中心坐标（IP 归属地到经纬度的轻量兜底；海外/未知则不显示距离）
const PROVINCE_CENTERS = {
  浙江省: [30.27, 120.15], 江苏省: [32.06, 118.78], 上海市: [31.23, 121.47], 北京市: [39.9, 116.4],
  广东省: [23.13, 113.26], 四川省: [30.66, 104.07], 湖北省: [30.59, 114.3], 湖南省: [28.23, 112.94],
  陕西省: [34.34, 108.94], 山东省: [36.67, 116.99], 河南省: [34.75, 113.62], 河北省: [38.04, 114.51],
  安徽省: [31.82, 117.23], 福建省: [26.08, 119.3], 江西省: [28.68, 115.86], 辽宁省: [41.8, 123.43],
  吉林省: [43.88, 125.32], 黑龙江省: [45.8, 126.53], 山西省: [37.87, 112.55], 内蒙古自治区: [40.82, 111.65],
  重庆: [29.56, 106.55], 天津市: [39.13, 117.2], 贵州省: [26.65, 106.63], 云南省: [25.04, 102.71],
  广西壮族自治区: [22.82, 108.32], 海南省: [20.02, 110.35], 甘肃省: [36.06, 103.83], 青海省: [36.62, 101.78],
  宁夏回族自治区: [38.49, 106.23], 新疆维吾尔自治区: [43.79, 87.62], 西藏自治区: [29.65, 91.14],
  香港特别行政区: [22.32, 114.17], 澳门特别行政区: [22.2, 113.55], 台湾省: [25.03, 121.57]
};

function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return '清晨好，一日之计在于晨';
  if (h >= 8 && h < 11) return '上午好，今天也要元气满满';
  if (h >= 11 && h < 13) return '中午好，记得吃午饭呀';
  if (h >= 13 && h < 18) return '下午好，来杯茶歇一歇';
  if (h >= 18 && h < 23) return '晚上好，今天过得怎么样';
  return '夜深了，早点休息，少熬夜';
}

/** 球面距离（km） */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return '就在站长身边';
  if (km < 100) return `${Math.round(km)} 公里`;
  return `${Math.round(km / 10) * 10} 公里`;
}

export default {
  name: 'Home',
  data() {
    return {
      // 素材
      avatarUrl,
      avatarBackUrl,
      avatarBack2Url,
      defaultCover: '/covers/git.svg',

      // 文章数据
      posts: [],
      currentPage: 1,
      pageSize: 12,
      total: 0,

      // 头像翻转（触屏点击用；桌面端走 hover）
      avatarFlipped: false,
      // 翻到背面的次数：奇数次显示头像背面，偶数次显示头像背面2
      flipCount: 0,

      // 访客欢迎卡
      welcome: { show: false, region: '', greeting: timeGreeting(), distance: '' },

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

      // canvas 星轨
      trailRaf: null,
      trailFrame: 0,
      trailState: null,
      themeObserver: null
  };
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize));
    },
    /** 当前背面图：第 1、3、5…次翻面显示头像背面，第 2、4…次显示头像背面2 */
    avatarBackCurrent() {
      return this.flipCount % 2 === 1 ? this.avatarBackUrl : this.avatarBack2Url;
    },
    /** 真实星座渲染数据：连线 path、去重后的星点、拉丁名标签位置 */
    constellationItems() {
      return constellationData.items.map((item) => {
        const pts = item.stars;
        const minX = Math.min(...pts.map((p) => p[0]));
        const maxX = Math.max(...pts.map((p) => p[0]));
        const maxY = Math.max(...pts.map((p) => p[1]));
        const seen = new Set();
        const stars = pts.filter((p) => {
          const key = p[0] + ',' + p[1];
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return {
          id: item.id,
          name: item.name,
          paths: item.lines.map((seg) => 'M ' + seg.map((p) => p[0] + ' ' + p[1]).join(' L ')),
          stars,
          label: [Math.round((minX + maxX) / 2), maxY + 20]
        };
      });
    }
  },
  mounted() {
    this.animateText(); // 大标题逐字动画
    this.startTypewriter(); // 打字机
    this.loadPosts();
    this.loadWelcome(); // 访客欢迎卡（失败静默）
    window.addEventListener('scroll', this.updateActivePosts, { passive: true });
    window.addEventListener('resize', this.handleHomeResize, { passive: true });
    this.setupHomeRowReveal();
    this.setupStarTrails(); // canvas 星轨（仅深色模式）
    this.warmupRouteChunks();
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
    this.teardownStarTrails();
  },
  methods: {
    // ---------- canvas 星轨（参考天环引导页：星场盖印 + 旋转累积 + 周期淡出） ----------
    isDarkTheme() {
      return document.documentElement.getAttribute('data-theme') !== 'light';
    },
    setupStarTrails() {
      // 系统开了"减少动态效果"就不启动
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // 深浅色切换时启停
      this.themeObserver = new MutationObserver(() => {
        if (this.isDarkTheme()) this.startStarTrails();
        else this.stopStarTrails();
      });
      this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      if (this.isDarkTheme()) this.startStarTrails();
    },
    startStarTrails() {
      const canvas = this.$refs.trailCanvas;
      if (!canvas || this.trailRaf || !canvas.getContext) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const hero = canvas.parentElement;
      const w = (canvas.width = hero.clientWidth);
      const h = (canvas.height = hero.clientHeight);
      const n = Math.max(w, h);

      // 离屏星场：随机散布的小星点
      const os = Math.round(2.3 * n);
      const off = document.createElement('canvas');
      off.width = os;
      off.height = os;
      const octx = off.getContext('2d');
      const count = Math.min(4200, Math.round((os * os) / 3200));
      for (let i = 0; i < count; i++) {
        const x = Math.random() * os;
        const y = Math.random() * os;
        const r = 0.35 + Math.random() * 0.5;
        // 彩色星轨：三通道随机取值，像参考站的彩虹星迹
        const cr = 120 + Math.round(Math.random() * 135);
        const cg = 120 + Math.round(Math.random() * 135);
        const cb = 120 + Math.round(Math.random() * 135);
        const alpha = 0.1 + Math.random() * 0.3;
        octx.beginPath();
        octx.arc(x, y, r, 0, Math.PI * 2, true);
        octx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        octx.fill();
      }

      // 天极（旋转中心）放在 hero 右上区域
      const pivotX = w * 0.82;
      const pivotY = h * 0.02;
      ctx.clearRect(0, 0, w, h);
      ctx.translate(pivotX, pivotY);

      this.trailFrame = 0;
      let lastDraw = 0;
      const step = (time) => {
        this.trailRaf = requestAnimationFrame(step);
        if (time - lastDraw < 33) return; // ~30fps 足够
        lastDraw = time;
        const state = this.trailState;
        if (!state) return;
        // 盖印星场（不清屏，轨迹自然累积）
        state.ctx.drawImage(state.off, -state.os / 2, -state.os / 2);
        state.ctx.rotate((0.035 * Math.PI) / 180);
        this.trailFrame++;
        // 周期性轻微擦除，让旧轨迹慢慢消失
        if (this.trailFrame > 90 && this.trailFrame % 5 === 0) {
          state.ctx.globalCompositeOperation = 'destination-out';
          state.ctx.fillStyle = 'rgba(0,0,0,0.08)';
          state.ctx.fillRect(-3 * state.n, -3 * state.n, 6 * state.n, 6 * state.n);
          state.ctx.globalCompositeOperation = 'source-over';
        }
      };

      this.trailState = { ctx, off, os, n };
      this.trailRaf = requestAnimationFrame(step);
    },
    stopStarTrails() {
      if (this.trailRaf) {
        cancelAnimationFrame(this.trailRaf);
        this.trailRaf = null;
      }
      this.trailState = null;
      const canvas = this.$refs.trailCanvas;
      if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    },
    teardownStarTrails() {
      this.stopStarTrails();
      if (this.themeObserver) {
        this.themeObserver.disconnect();
        this.themeObserver = null;
      }
    },
    handleTrailResize() {
      if (this.isDarkTheme()) {
        this.stopStarTrails();
        this.startStarTrails();
      }
    },

    // ---------- 星座动效参数（错峰淡入淡出 + 缓慢漂浮，确定性伪随机） ----------
    constellationMotion(c, index) {
      const cycle = 16 + ((index * 7) % 10);           // 16-25s 一个周期
      const delay = -((index * 11) % 24);              // 负延迟错开相位
      const floatDur = 11 + ((index * 5) % 8);         // 11-18s 漂浮
      const floatDelay = -((index * 5) % 11);
      return {
        animation: `constellation-cycle ${cycle}s ease-in-out ${delay}s infinite, constellation-float ${floatDur}s ease-in-out ${floatDelay}s infinite alternate`
      };
    },

    // ---------- 头像翻面 ----------
    flipToBack() {
      if (this.avatarFlipped) return;
      this.flipCount++;
      this.avatarFlipped = true;
    },
    flipToFront() {
      this.avatarFlipped = false;
    },
    toggleFlip() {
      if (this.avatarFlipped) this.flipToFront();
      else this.flipToBack();
    },
    // 触屏/无悬停设备用点击翻转；桌面端 hover 已接管，点击不动作
    onAvatarClick() {
      if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover)').matches) {
        this.toggleFlip();
      }
    },

    // ---------- 访客欢迎卡 ----------
    async loadWelcome() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        // 主源：中文归属地（纯真库数据）；备用：ipwho.is（带经纬度，海外/兜底）
        let region = '';
        let lat = null;
        let lon = null;
        try {
          const resp = await fetch('https://api.vore.top/api/IPdata', { signal: controller.signal });
          const data = await resp.json();
          if (data && data.code === 200 && data.ipinfo) {
            const info = data.ipinfo;
            const prov = info.province || '';
            const city = info.city || '';
            region = [prov, city !== prov ? city : ''].filter(Boolean).join(' ');
            lat = PROVINCE_CENTERS[prov] ? PROVINCE_CENTERS[prov][0] : null;
            lon = PROVINCE_CENTERS[prov] ? PROVINCE_CENTERS[prov][1] : null;
          }
        } catch (e) {
          /* 尝试备用源 */
        }

        if (!region) {
          const resp = await fetch('https://ipwho.is/', { signal: controller.signal });
          const data = await resp.json();
          if (data && data.success !== false) {
            const parts = [data.region || '', data.city || ''].filter(Boolean);
            // 归属地与城市同名时（如 Hong Kong, Hong Kong）只保留一个
            region = parts.filter((p, i) => i === 0 || p !== parts[0]).join(', ');
            lat = Number(data.latitude);
            lon = Number(data.longitude);
          }
        }

        if (!region) return; // 两个源都失败：不显示卡片

        let distance = '';
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          distance = formatDistance(haversineKm(lat, lon, OWNER_LOCATION.lat, OWNER_LOCATION.lon));
        }
        this.welcome = { show: true, region, greeting: timeGreeting(), distance };
      } catch (e) {
        // 网络/超时/被墙：静默隐藏，不影响页面
      } finally {
        clearTimeout(timer);
      }
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
        this.handleTrailResize();
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
        import('@/views/Talks.vue');
        import('@/views/Thoughts.vue');
        import('@/views/Albums.vue');
        import('@/views/GuideHome.vue');
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
  padding: 12px 20px 0;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* =========================
   Hero 首屏
   ========================= */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  /* 首屏占满一屏：文章卡片下滑再出现 */
  min-height: calc(100vh - 68px);
}

/* 星空/星座层 */
.star-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.star {
  fill: var(--star-color-dim);
}

.star--big {
  fill: var(--star-color);
}

.star--t2 { animation: twinkle 3.2s ease-in-out 0.8s infinite; }
.star--t3 { animation: twinkle 4.1s ease-in-out 1.9s infinite; }

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

/* ---- canvas 星轨（仅深色模式，JS 驱动；浅色由 JS 暂停 + CSS 双保险） ---- */
.star-trail-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.55;
}

:root[data-theme='light'] .star-trail-canvas {
  display: none;
}

/* ---- 真实星座（错峰淡入淡出 + 漂浮） ---- */
.constellation-line {
  stroke: var(--constellation-real);
  stroke-width: 1.4;
  stroke-dasharray: 6 6;
}

.constellation-star {
  fill: var(--constellation-star);
}

.constellation-label {
  fill: var(--constellation-label);
  font-size: 11px;
  letter-spacing: 3.5px;
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
}

@keyframes constellation-cycle {
  0% { opacity: 0; }
  12% { opacity: 1; }
  46% { opacity: 1; }
  58% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes constellation-float {
  from { transform: translateY(-6px); }
  to { transform: translateY(6px); }
}

/* 四芒星（十字光芒） */
.star-flare {
  fill: var(--star-color);
  animation: twinkle 4.5s ease-in-out 0.4s infinite;
}

.star-flare--sm {
  opacity: 0.85;
}

/* 书法水印「寜」：桌面端贴最右侧、字号顶天立地；
   fixed 定位 —— 首页上下滚动时水印固定在屏幕同一位置，文章卡片从其上方滑过 */
.calligraphy-watermark {
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

.hero-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1150px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 10px 30px;
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
  text-shadow: 0 0 18px var(--accent-glow-strong);
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
  margin-top: 16px;
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
  box-shadow: 0 0 8px var(--accent-glow-strong);
  animation: caretBlink 0.9s step-end infinite;
  flex-shrink: 0;
}

@keyframes caretBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.hero-intro {
  margin: 12px 0 0;
  font-size: 16px;
  color: var(--text-muted);
  max-width: 520px;
}

.hero-actions {
  margin-top: 20px;
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
  gap: 16px;
  /* 头像及欢迎卡往左移：与标题右端间距减半（手机端恢复居中） */
  margin-right: 156px;
}

.avatar-scene {
  position: relative;
  width: 290px;
  height: 290px;
  perspective: 1100px; /* 3D 透视：翻转更有立体感 */
}

/* 光辉圆环：头像背后的发光层 */
.avatar-glow {
  position: absolute;
  inset: -18px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow-strong) 0%, var(--accent-soft) 45%, transparent 70%);
  filter: blur(10px);
  opacity: 0.75;
  transition: opacity 0.45s ease, transform 0.45s ease;
  animation: glowBreath 3.6s ease-in-out infinite;
  pointer-events: none;
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

/* 翻转统一由 JS 驱动（桌面 hover / 手机点击），背面图轮流显示 */
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
  box-shadow: var(--card-shadow), 0 0 22px var(--accent-glow-strong);
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

/* 访客欢迎卡 */
.welcome-card {
  max-width: 340px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
}

.welcome-icon {
  color: var(--accent);
  margin-top: 3px;
  flex-shrink: 0;
}

.welcome-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.welcome-text b {
  color: var(--text-primary);
}

.welcome-fade-enter-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.welcome-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

/* 下滑引导箭头 */
.arrow-container {
  position: relative;
  z-index: 1;
  align-self: center;
  margin-top: -14px;
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
  height: 36px;
  background-color: var(--accent);
  border-radius: 999px;
  box-shadow: 0 0 5px var(--accent-glow-mid);
}

.arrow-down {
  width: 28px;
  height: 28px;
  background-color: var(--accent-strong);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E") no-repeat center;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E") no-repeat center;
}

@keyframes floatAndBlink {
  0%, 100% {
    transform: translateY(0);
    opacity: 1;
  }

  50% {
    transform: translateY(-5px);
    opacity: 0.72;
  }
}

/* =========================
   公告条 + 文章卡片
   ========================= */
.notice-strip {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1150px;
  margin: 10px auto 18px;
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
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1150px;
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
    gap: 20px;
    padding-bottom: 30px;
    text-align: center;
  }

  .hero-avatar {
    margin-right: 0; /* 手机端头像保持居中 */
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
    width: 220px;
    height: 220px;
  }

  .calligraphy-watermark {
    font-size: 88vh;
    right: auto;
    left: 50%;
    top: 50%;
    bottom: auto;
    transform: translate(-50%, -50%);
    opacity: var(--watermark-opacity);
  }

  .welcome-card {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .home {
    padding: 10px 16px 0;
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
  .star--t2,
  .star--t3,
  .avatar-glow,
  .arrow-container,
  .star-trail-canvas {
    animation: none;
  }

  /* canvas 星轨由 JS 停用；星座动画关闭并保持可见 */
  .constellation {
    animation: none !important;
    opacity: 0.75;
  }

  .line2 {
    animation-duration: 0.01s;
  }
}
</style>
