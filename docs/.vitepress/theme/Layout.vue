<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import PostMeta from './PostMeta.vue'
import SiteFooter from './SiteFooter.vue'
import BackToTop from './BackToTop.vue'
import LikeButton from './LikeButton.vue'
import Giscus from './Giscus.vue'

const { Layout } = DefaultTheme
const { page, frontmatter } = useData()
</script>

<template>
  <Layout>
    <!-- 文章正文上方：发布时间 + 本文阅读量 -->
    <template #doc-before>
      <PostMeta />
    </template>

    <!-- 文章正文下方：点赞 + 评论区（私密文章由 PrivateLock 解锁后自行渲染，避免重复） -->
    <template #doc-after>
      <template v-if="!frontmatter.private">
        <LikeButton :key="'like-' + page.relativePath" />
        <Giscus :key="'giscus-' + page.relativePath" />
      </template>
    </template>

    <!-- 所有页面底部：版权信息 + 本站访问量 / 访客数 -->
    <template #layout-bottom>
      <SiteFooter />
      <BackToTop />
    </template>
  </Layout>
</template>
