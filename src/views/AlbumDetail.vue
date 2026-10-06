<template>
  <div class="album-detail">
    <div class="album-detail-inner">
      <button class="back-btn" type="button" @click="$router.push('/albums')">
        <i class="fa-solid fa-angle-left"></i> 返回相册
      </button>

      <template v-if="album">
        <div class="page-header">
          <div class="page-tagline">ALBUM</div>
          <div class="page-title-gradient">{{ album.name }}</div>
        </div>
        <p class="album-desc">{{ album.description }} · {{ (album.photos || []).length }} 张照片</p>

        <div class="photos-grid">
          <div
            v-for="(photo, index) in album.photos"
            :key="photo.src + index"
            class="photo-item"
            role="button"
            tabindex="0"
            @click="openLightbox(index)"
            @keydown.enter.prevent="openLightbox(index)"
          >
            <img :src="photo.src" :alt="photo.caption || album.name" class="photo-img" loading="lazy" />
            <span v-if="photo.caption" class="photo-caption">{{ photo.caption }}</span>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">没有找到这个相册。</div>
    </div>

    <!-- 简易灯箱 -->
    <transition name="fade">
      <div v-if="lightboxIndex !== null" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" type="button" aria-label="关闭" @click="closeLightbox">×</button>
        <button class="lightbox-nav lightbox-prev" type="button" aria-label="上一张" @click.stop="step(-1)">
          <i class="fa-solid fa-angle-left"></i>
        </button>
        <figure class="lightbox-body">
          <img :src="currentPhoto.src" :alt="currentPhoto.caption || ''" class="lightbox-img" />
          <figcaption v-if="currentPhoto.caption" class="lightbox-caption">{{ currentPhoto.caption }}</figcaption>
        </figure>
        <button class="lightbox-nav lightbox-next" type="button" aria-label="下一张" @click.stop="step(1)">
          <i class="fa-solid fa-angle-right"></i>
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { fetchAlbumById } from '@/api';

export default {
  name: 'AlbumDetail',
  data() {
    return { album: null, lightboxIndex: null, escHandler: null };
  },
  computed: {
    currentPhoto() {
      return (this.album && this.album.photos[this.lightboxIndex]) || {};
    }
  },
  async created() {
    try {
      const resp = await fetchAlbumById(this.$route.params.id);
      this.album = resp.data;
    } catch (e) {
      this.album = null;
    }
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.step(-1);
      if (e.key === 'ArrowRight') this.step(1);
    };
    window.addEventListener('keydown', this.escHandler);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.escHandler);
  },
  methods: {
    openLightbox(index) {
      this.lightboxIndex = index;
      document.body.style.overflow = 'hidden';
    },
    closeLightbox() {
      this.lightboxIndex = null;
      document.body.style.overflow = '';
    },
    step(delta) {
      const photos = (this.album && this.album.photos) || [];
      if (!photos.length || this.lightboxIndex === null) return;
      this.lightboxIndex = (this.lightboxIndex + delta + photos.length) % photos.length;
    }
  }
};
</script>

<style scoped>
.album-detail {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 68px);
}

.album-detail-inner {
  width: 100%;
  max-width: 1100px;
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
  margin-bottom: 8px;
}

.page-tagline {
  font-size: 20px;
  letter-spacing: 4px;
  color: var(--text-secondary);
}

.page-title-gradient {
  font-size: 42px;
  letter-spacing: 6px;
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.album-desc {
  margin: 0 0 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.photo-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--card-hover-shadow);
}

.photo-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}

.photo-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 22px 12px 8px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

/* 灯箱 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--overlay-mask);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
}

.lightbox-body {
  margin: 0;
  max-width: min(920px, 90vw);
  text-align: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 78vh;
  border-radius: 10px;
  display: block;
  margin: 0 auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.lightbox-caption {
  margin-top: 12px;
  color: #f0f4f0;
  font-size: 14px;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--btn-bg);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.lightbox-nav {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.lightbox-nav:hover {
  background: var(--btn-hover-bg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .album-detail {
    padding: 16px 14px 10px;
  }

  .page-title-gradient {
    font-size: 34px;
  }

  .photos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
