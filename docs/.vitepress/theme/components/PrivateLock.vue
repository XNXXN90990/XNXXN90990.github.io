<script setup lang="ts">
/**
 * PrivateLock：单篇私人文章的锁屏
 * 站点访问到 /me/posts/<file> 时，只有本文 frontmatter 有 encrypted:* 元数据时才会把内容锁起来。
 * 解锁流程：输入文章访问码 -> 解密正文 -> 渲染。
 */
import { ref, onMounted } from 'vue'
import { decryptText } from '../crypto'

const props = defineProps<{
  blob: { iv: string; ct: string; tag?: string }
  hint?: string
}>()

const code = ref('')
const error = ref('')
const busy = ref(false)
const plain = ref<string | null>(null)

async function tryUnlock() {
  error.value = ''
  busy.value = true
  try {
    plain.value = await decryptText(props.blob, code.value)
    document.cookie = `ning-pp=${encodeURIComponent(code.value)}; path=/; max-age=600`
  } catch (e) {
    error.value = '访问码不正确'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  // 尝试从 cookie 中读取访问码（用户已经解锁过一次）
  const m = document.cookie.match(/(?:^| )ning-pp=([^;]+)/)
  if (m) {
    try {
      code.value = decodeURIComponent(m[1])
      tryUnlock()
    } catch (_) {}
  }
})
</script>

<template>
  <div v-if="plain" class="private-decrypted" v-html="plain" />
  <div v-else class="private-shell">
    <div class="private-shell__title">🔒 这是一篇私人文章</div>
    <div class="private-shell__hint">
      请输入这篇文章的访问码解锁。
      <span v-if="hint">提示：{{ hint }}</span>
    </div>
    <input v-model="code" type="password" placeholder="文章访问码" autocomplete="off" @keyup.enter="tryUnlock" />
    <button :disabled="busy || !code" @click="tryUnlock">{{ busy ? '解锁中…' : '解锁' }}</button>
    <div v-if="error" class="private-err">{{ error }}</div>
  </div>
</template>

<style scoped>
.private-decrypted :deep(h1) { font-size: 1.6rem; margin-top: 24px; }
.private-decrypted :deep(p)  { line-height: 1.85; }
.private-decrypted :deep(img) { max-width: 100%; height: auto; border-radius: 8px; }
</style>
