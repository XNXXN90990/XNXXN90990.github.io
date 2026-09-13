<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import SiteFooter from './components/SiteFooter.vue'
import DisableDevtool from './components/DisableDevtool.vue'

const { Layout } = DefaultTheme
const route = useRoute()

// 在挂载前根据路径判断是不是私人文章页，是的话在 body 加一个标记
onMounted(() => {
  const path = route.path
  if (path.startsWith('/me/posts/')) {
    document.body.classList.add('is-private-page')
  }
})
</script>

<template>
  <!-- 防 devtools 拦截器（非阻塞脚本、加白名单） -->
  <DisableDevtool />

  <Layout>
    <template #doc-footer-before>
      <!-- 站点底部：所有页面共用 -->
      <SiteFooter />
    </template>
  </Layout>
</template>
