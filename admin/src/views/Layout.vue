<template>
  <div class="layout">
    <aside class="side">
      <div class="brand">寜的小站 · 管理</div>
      <el-menu :default-active="active" router>
        <el-menu-item index="/dashboard">📊 仪表盘</el-menu-item>
        <el-menu-item index="/articles">📝 文章</el-menu-item>
        <el-menu-item index="/moments">💬 说说</el-menu-item>
        <el-menu-item index="/categories">🗂 分类</el-menu-item>
        <el-menu-item index="/links">🔗 友链</el-menu-item>
        <el-menu-item index="/settings">⚙️ 设置</el-menu-item>
      </el-menu>
      <div class="logout">
        <el-button size="small" @click="onLogout">退出登录</el-button>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const active = computed(() => route.path)
const router = useRouter()

function onLogout() {
  localStorage.removeItem('ning-admin-token')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}
.side {
  background: var(--ning-bg-soft);
  border-right: 1px solid var(--ning-divider);
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.brand {
  font-weight: 700;
  padding: 4px 12px 16px;
  border-bottom: 1px solid var(--ning-divider);
}
.logout {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--ning-divider);
}
.main { padding: 24px; background: var(--el-bg-color); }
@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }
  .side { display: none; }
}
</style>
