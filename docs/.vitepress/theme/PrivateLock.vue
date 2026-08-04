<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import MarkdownIt from 'markdown-it'
import { decryptText, type EncBlob } from './crypto'
import LikeButton from './LikeButton.vue'
import Giscus from './Giscus.vue'

const md = new MarkdownIt({ html: true, linkify: true })

const { frontmatter, page } = useData()

interface Payload {
  v: number
  a: EncBlob // 文章访问码加密
  m: EncBlob // 主访问码加密
}

let payload: Payload | null = null
try {
  if (frontmatter.value.payload) {
    payload = JSON.parse(atob(frontmatter.value.payload))
  }
} catch {
  payload = null
}

const MK_KEY = 'qz_master'
const articlePath = page.value.relativePath
const pkKey = 'qz_pk:' + articlePath

const state = ref<'locked' | 'unlocked' | 'nopayload'>(payload ? 'locked' : 'nopayload')
const input = ref('')
const error = ref('')
const busy = ref(false)
const contentHtml = ref('')

function formatDate(raw: unknown): string {
  if (!raw) return ''
  const str = String(raw)
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`
  return str
}

const publishDate = formatDate(frontmatter.value.date)

function renderContent(mdText: string) {
  contentHtml.value = md.render(mdText)
  state.value = 'unlocked'
}

// 先按文章访问码尝试，再按主访问码尝试；成功返回 true
async function tryUnlock(code: string, remember: boolean): Promise<boolean> {
  if (!payload) return false
  try {
    const text = await decryptText(payload.a, code)
    if (remember) localStorage.setItem(pkKey, code)
    renderContent(text)
    return true
  } catch {
    /* 不是文章访问码，继续尝试主访问码 */
  }
  try {
    const text = await decryptText(payload.m, code)
    if (remember) localStorage.setItem(MK_KEY, code)
    renderContent(text)
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
  const ok = await tryUnlock(code, true)
  busy.value = false
  if (!ok) {
    error.value = '访问码不正确，请检查一下再试。'
  } else {
    input.value = ''
  }
}

onMounted(async () => {
  if (!payload) return
  // 支持 链接?key=访问码 直链自动解锁
  const params = new URLSearchParams(location.search)
  const keyParam = params.get('key')
  if (keyParam) {
    history.replaceState(null, '', location.pathname)
    if (await tryUnlock(keyParam, true)) return
  }
  // 记住的主访问码 / 文章访问码自动解锁
  const mk = localStorage.getItem(MK_KEY)
  if (mk && (await tryUnlock(mk, false))) return
  const pk = localStorage.getItem(pkKey)
  if (pk && (await tryUnlock(pk, false))) return
})
</script>

<template>
  <div class="private-lock">
    <template v-if="state === 'unlocked'">
      <div class="private-meta">
        <span class="private-badge">私密文章</span>
        <span v-if="publishDate">发布于 {{ publishDate }}</span>
      </div>
      <div class="vp-doc private-doc" v-html="contentHtml"></div>
      <LikeButton />
      <Giscus />
    </template>

    <div v-else-if="state === 'nopayload'" class="lock-box">
      <h2>{{ frontmatter.title }}</h2>
      <p class="lock-tip">这篇文章处于锁定状态，且当前站点没有配置解密信息。如果你是站长，请检查私密配置（private-secrets.json 或 GitHub Actions 密钥）后重新部署。</p>
    </div>

    <div v-else class="lock-box">
      <svg class="lock-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h2>{{ frontmatter.title }}</h2>
      <p class="lock-tip">这是一篇私密文章。输入该文章的访问码，或站长的主访问码，即可解锁阅读。</p>
      <form class="lock-form" @submit.prevent="submit">
        <input
          v-model="input"
          type="password"
          placeholder="输入访问码"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="submit" :disabled="busy || !input.trim()">
          {{ busy ? '解密中…' : '解锁阅读' }}
        </button>
      </form>
      <p v-if="error" class="lock-error">{{ error }}</p>
    </div>
  </div>
</template>
