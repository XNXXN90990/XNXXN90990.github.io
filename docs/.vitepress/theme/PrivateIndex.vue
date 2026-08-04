<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { data } from 'virtual:private-index'
import { decryptText, type EncBlob } from './crypto'

interface Item {
  title: string
  path: string
  date: string
  code: string
}

const indexData = data as { dev?: boolean; items?: Item[]; blob?: EncBlob | null }

const MK_KEY = 'qz_master'
const unlocked = ref(false)
const isDev = ref(false)
const input = ref('')
const error = ref('')
const busy = ref(false)
const items = ref<Item[]>([])
const copied = ref('')

async function loadItems(master: string): Promise<boolean> {
  try {
    if (indexData.dev) {
      items.value = indexData.items || []
      isDev.value = true
      return true
    }
    if (!indexData.blob) return false
    items.value = JSON.parse(await decryptText(indexData.blob, master))
    return true
  } catch {
    return false
  }
}

async function submit() {
  const code = input.value.trim()
  if (!code || busy.value) return
  busy.value = true
  error.value = ''
  const ok = await loadItems(code)
  busy.value = false
  if (ok) {
    localStorage.setItem(MK_KEY, code)
    unlocked.value = true
    input.value = ''
  } else {
    error.value = '主访问码不正确，请检查一下再试。'
  }
}

function logout() {
  localStorage.removeItem(MK_KEY)
  unlocked.value = false
  items.value = []
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = code
    setTimeout(() => (copied.value = ''), 1500)
  } catch {
    /* 剪贴板不可用时忽略 */
  }
}

onMounted(async () => {
  const mk = localStorage.getItem(MK_KEY)
  if (mk && (await loadItems(mk))) {
    unlocked.value = true
  } else if (indexData.dev) {
    // 本地预览模式无需解锁
    await loadItems('')
    unlocked.value = true
  }
})
</script>

<template>
  <div class="private-index">
    <template v-if="unlocked">
      <div class="pi-head">
        <p class="pi-note">
          已解锁私密区<template v-if="isDev">（本地预览模式）</template>，共 {{ items.length }} 篇私密文章。
        </p>
        <button v-if="!isDev" class="pi-logout" @click="logout">退出解锁</button>
      </div>
      <p v-if="items.length === 0" class="pi-empty">还没有私密文章。在项目根目录运行 <code>npm run src:new "标题"</code> 创建第一篇。</p>
      <ul v-else class="pi-list">
        <li v-for="it in items" :key="it.path">
          <a :href="it.path">{{ it.title }}</a>
          <span v-if="it.date" class="pi-date">{{ it.date }}</span>
          <button v-if="it.code" class="pi-code" :title="'复制访问编号'" @click="copyCode(it.code)">
            编号 {{ it.code }}{{ copied === it.code ? '（已复制）' : '' }}
          </button>
        </li>
      </ul>
      <p class="pi-tip">把「编号」告诉想分享的人：对方在站内搜索框输入编号即可找到文章，输入同样的编号即可阅读；也可以直接发送 文章链接?key=编号。</p>
    </template>

    <div v-else class="lock-box pi-lock">
      <svg class="lock-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <p class="lock-tip">这里是站长的私密内容管理入口。输入主访问码后，可以查看和解锁全部私密文章。</p>
      <form class="lock-form" @submit.prevent="submit">
        <input v-model="input" type="password" placeholder="输入主访问码" autocomplete="off" spellcheck="false" />
        <button type="submit" :disabled="busy || !input.trim()">{{ busy ? '验证中…' : '进入私密区' }}</button>
      </form>
      <p v-if="error" class="lock-error">{{ error }}</p>
    </div>
  </div>
</template>
