<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from './components/header.vue';
import Footer from './components/Footer.vue';
import { initSiteStore, siteStore, SITE_STATUS } from './utils/siteStore';

const router = useRouter();

onMounted(async () => {
  await initSiteStore();
  // 配置加载完才发现是维护/隐身状态时，补一次跳转
  if (siteStore.status !== SITE_STATUS.NORMAL && router.currentRoute.value.path !== '/maintenance') {
    router.replace('/maintenance');
  }
});
</script>

<template>
  <div class="app-root">
    <Header />

    <main class="app-main">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<style>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  /* 给固定头部让出空间，避免内容被遮挡 */
  padding-top: 68px;
}
</style>
