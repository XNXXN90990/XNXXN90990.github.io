<template>
  <div class="login-bg">
    <el-card class="login-card" shadow="never">
      <h2 class="title">寜的小站 · 管理端</h2>
      <p class="hint">本期为骨架演示。请使用 <code>ning / ning</code> 登录（部署后端后请改用真实凭据）。</p>
      <el-form @submit.prevent="onSubmit" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" placeholder="密码" type="password" show-password />
        </el-form-item>
        <el-button type="primary" class="submit" :loading="loading" @click="onSubmit">
          {{ loading ? '登录中…' : '登录' }}
        </el-button>
        <div v-if="err" class="err">{{ err }}</div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api'

const form = ref({ username: '', password: '' })
const loading = ref(false)
const err = ref('')
const route = useRoute()
const router = useRouter()

async function onSubmit() {
  err.value = ''
  loading.value = true
  try {
    const r = await login(form.value)
    localStorage.setItem('ning-admin-token', r.token)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    err.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(at 30% 30%, rgba(91,143,107,0.18), transparent 60%),
    radial-gradient(at 70% 70%, rgba(91,143,107,0.08), transparent 60%),
    var(--ning-bg-soft);
}
.login-card {
  width: 380px;
  border: 1px solid var(--ning-divider);
  border-radius: 14px;
  padding: 8px 12px;
}
.title { margin: 0 0 6px; font-size: 1.25rem; }
.hint  { color: var(--ning-text-2); font-size: 13px; margin: 0 0 16px; }
.submit { width: 100%; }
.err   { color: #c0392b; margin-top: 10px; font-size: 13px; }
</style>
