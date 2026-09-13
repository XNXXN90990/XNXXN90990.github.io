<script setup lang="ts">
/**
 * PrivateIndex：私人区入口
 * 本地预览时由 privatePagesPlugin 注入 dev=true 的明文列表
 * 上线后是密文，需要主访问码解锁
 */
import { ref, computed } from 'vue'
import { decryptText } from '../crypto'
import { data } from 'virtual:private-index'

const masterCode = ref('')
const error = ref('')
const busy = ref(false)

const unlocked = computed(() => !data.dev && !!(plainList.value && plainList.value.length >= 0))

const plainList = ref<{ title: string; path: string; date: string; code: string }[] | null>(
  data.dev ? data.items : null
)

async function tryUnlock() {
  error.value = ''
  busy.value = true
  try {
    if (!data.blob) {
      error.value = '当前构建没有私密数据（密钥缺失）。'
      return
    }
    const json = await decryptText(data.blob, masterCode.value)
    const arr = JSON.parse(json)
    plainList.value = arr
    // 通过 cookie 让后续单篇文章自动用同一访问码
    document.cookie = `ning-pm=${encodeURIComponent(masterCode.value)}; path=/; max-age=3600`
  } catch (e: any) {
    error.value = '主访问码不正确，或数据已损坏。'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="private-shell">
    <div class="private-shell__title">🔒 私人文章列表</div>

    <div v-if="data.dev" class="private-shell__hint">
      本地预览模式：所有私人文章已直接以明文展示。
    </div>

    <div v-else>
      <div class="private-shell__hint">
        上线后列表是加密的，需要输入「主访问码」解锁后才能看到所有文章标题与文章访问码。
      </div>

      <div v-if="!plainList">
        <input
          v-model="masterCode"
          type="password"
          placeholder="主访问码"
          autocomplete="off"
          @keyup.enter="tryUnlock"
        />
        <button :disabled="busy || !masterCode" @click="tryUnlock">
          {{ busy ? '解锁中…' : '解锁' }}
        </button>
        <div v-if="error" class="private-err">{{ error }}</div>
      </div>
    </div>

    <div v-if="plainList" class="private-list" style="margin-top: 18px;">
      <a
        v-for="i in plainList"
        :key="i.path"
        :href="i.path"
        class="link"
        style="border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 10px 14px; color: inherit;"
      >
        <div class="title">{{ i.title }}</div>
        <div class="meta">
          {{ i.date || '未注明日期' }}
          <span v-if="i.code"> · 编号 {{ i.code }}</span>
        </div>
      </a>
      <div v-if="!plainList.length" style="color: var(--vp-c-text-3); font-size: 13px;">
        还没有私人文章。在本地 <code>docs/me/posts/</code> 目录新建一个 <code>.md</code> 即可。
      </div>
    </div>
  </div>
</template>
