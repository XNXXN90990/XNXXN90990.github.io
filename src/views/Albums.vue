<template>
  <div class="albums-page">
    <div class="albums-inner">
      <div class="page-header">
        <div class="page-tagline">GALLERY</div>
        <div class="page-title-gradient">相册</div>
      </div>
      <p class="page-subtitle">用照片存下时间。</p>

      <div class="albums-grid">
        <div
          v-for="album in albums"
          :key="album.id"
          class="album-card"
          role="link"
          tabindex="0"
          @click="openAlbum(album.id)"
          @keydown.enter.prevent="openAlbum(album.id)"
        >
          <div class="album-cover-wrap">
            <img :src="album.cover" :alt="album.name" class="album-cover" loading="lazy" />
            <span class="album-count"><i class="fa-regular fa-images"></i> {{ (album.photos || []).length }}</span>
          </div>
          <div class="album-info">
            <h2 class="album-name">{{ album.name }}</h2>
            <p class="album-desc">{{ album.description }}</p>
            <span class="album-date"><i class="fa-regular fa-calendar"></i> {{ formatDate(album.date) }}</span>
          </div>
        </div>
      </div>

      <div v-if="!albums.length && !loading" class="empty-state">相册空空如也，去 content/albums.json 里建一本吧！</div>
    </div>
  </div>
</template>

<script>
import { fetchAlbums } from '@/api';
import { formatDate } from '@/utils/format';

export default {
  name: 'Albums',
  data() {
    return { albums: [], loading: true };
  },
  async created() {
    try {
      const resp = await fetchAlbums();
      this.albums = resp.data || [];
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate,
    openAlbum(id) {
      this.$router.push({ name: 'AlbumDetail', params: { id } });
    }
  }
};
</script>

<style scoped>
.albums-page {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 68px);
}

.albums-inner {
  width: 100%;
  max-width: 1100px;
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

.albums-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.album-card {
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  cursor: pointer;
  transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.album-card:hover,
.album-card:focus-visible {
  transform: translateY(-4px);
  border: 1px solid var(--accent-border);
  box-shadow: var(--card-hover-shadow);
}

.album-cover-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.album-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(35%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.album-card:hover .album-cover {
  filter: grayscale(0%);
  transform: scale(1.04);
}

.album-count {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 999px;
  padding: 3px 10px;
  backdrop-filter: blur(3px);
}

.album-info {
  padding: 14px 16px 16px;
}

.album-name {
  margin: 0 0 6px;
  font-size: 16px;
  color: var(--text-primary);
}

.album-desc {
  margin: 0 0 10px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.album-date {
  font-size: 12px;
  color: var(--text-muted);
}

.album-date i {
  color: var(--accent);
  margin-right: 4px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .albums-page {
    padding: 16px 14px 10px;
  }

  .page-title-gradient {
    font-size: 36px;
  }

  .albums-grid {
    grid-template-columns: 1fr;
  }
}
</style>
