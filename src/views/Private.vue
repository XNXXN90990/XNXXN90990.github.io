<template>
  <div class="private-page">
    <div class="private-inner">
      <div class="private-header">
        <div class="private-tagline">PRIVATE&nbsp;SPACE</div>
        <div class="private-title-gradient">私人空间</div>
      </div>
      <p class="private-subtitle">
        <i class="fa-solid fa-lock"></i>
        这里是只属于我的小抽屉，输入访问码才能进入。
      </p>

      <!-- 第一级门禁：空间访问码 -->
      <div v-if="!unlocked" class="gate-card">
        <div class="gate-icon"><i class="fa-solid fa-lock"></i></div>
        <p class="gate-title">输入空间访问码</p>
        <form class="gate-form" @submit.prevent="unlockSpace">
          <input
            v-model="spaceCodeInput"
            class="gate-input"
            type="password"
            placeholder="空间访问码"
            autocomplete="off"
          />
          <button class="gate-btn" type="submit" :disabled="busy">
            {{ busy ? '验证中...' : '解锁' }}
          </button>
        </form>
        <p v-if="gateError" class="gate-error"><i class="fa-solid fa-circle-exclamation"></i> {{ gateError }}</p>
      </div>

      <!-- 已解锁：文章列表 -->
      <template v-else-if="!openArticle">
        <div class="unlocked-bar">
          <span><i class="fa-solid fa-lock-open"></i> 已解锁 · {{ entries.length }} 篇私密文章</span>
          <button class="lock-btn" type="button" @click="lockAgain">重新上锁</button>
        </div>

        <div class="private-list">
          <div v-if="!entries.length" class="empty-state">
            空间里还没有文章。
          </div>

          <div
            v-for="entry in entries"
            :key="entry.id"
            class="private-item"
            role="button"
            tabindex="0"
            @click="openEntry(entry)"
            @keydown.enter.prevent="openEntry(entry)"
          >
            <div class="private-item-main">
              <div class="private-item-title"><i class="fa-solid fa-key private-key-icon"></i>{{ entry.title }}</div>
              <p class="private-item-desc">{{ entry.description || '（无摘要）' }}</p>
            </div>
            <div class="private-item-side">
              <span class="private-item-date">{{ formatDate(entry.date) }}</span>
              <span class="private-item-action">输入访问码阅读 <i class="fa-solid fa-angle-right"></i></span>
            </div>
          </div>
        </div>
      </template>

      <!-- 第二级门禁 + 文章正文 -->
      <div v-else class="article-view">
        <button class="back-btn" type="button" @click="closeArticle">
          <i class="fa-solid fa-angle-left"></i> 返回列表
        </button>

        <template v-if="articleError">
          <div class="gate-card">
            <div class="gate-icon"><i class="fa-solid fa-key"></i></div>
            <p class="gate-title">「{{ openArticle.title }}」已加密</p>
            <p class="gate-subtitle">这篇文章有独立的访问码，输入后才能阅读。</p>
            <form class="gate-form" @submit.prevent="decryptArticle">
              <input
                v-model="articleCodeInput"
                class="gate-input"
                type="password"
                placeholder="本文访问码"
                autocomplete="off"
              />
              <button class="gate-btn" type="submit" :disabled="busy">解锁阅读</button>
            </form>
            <p v-if="articleError" class="gate-error"><i class="fa-solid fa-circle-exclamation"></i> {{ articleError }}</p>
          </div>
        </template>

        <article v-else class="private-article">
          <h1 class="private-article-title">{{ articleMeta.title }}</h1>
          <div class="private-article-meta">
            <span v-if="articleMeta.date">发布于 {{ formatDate(articleMeta.date) }}</span>
            <span v-if="articleMeta.tags && articleMeta.tags.length">标签：{{ articleMeta.tags.join('、') }}</span>
          </div>
          <div class="private-article-content" v-html="renderedMarkdown"></div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import hljs from '@/utils/hljs';
import 'highlight.js/styles/github-dark.css';
import privateData from '@/content/private-encrypted.json';
import { decryptJson } from '@/utils/privateCrypto';
import { formatDate } from '@/utils/format';

const md = new MarkdownIt({
  html: false,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (_) { /* fallthrough */ }
    }
    return '';
  }
});

const ENTRIES_CACHE_KEY = 'ning-private-entries';

export default {
  name: 'PrivateSpace',
  data() {
    return {
      unlocked: false,
      entries: [],
      spaceCodeInput: '',
      gateError: '',

      openArticle: null, // { id, title, blob }
      articleCodeInput: '',
      articleError: '', // 非空时显示文章访问码输入框
      articleMeta: {},
      articleContent: '',

      busy: false
    };
  },
  computed: {
    renderedMarkdown() {
      if (!this.articleContent) return '';
      return DOMPurify.sanitize(md.render(this.articleContent));
    }
  },
  created() {
    // 会话内缓存：刷新页面前不必重复输入空间门码
    try {
      const cached = sessionStorage.getItem(ENTRIES_CACHE_KEY);
      if (cached) {
        this.entries = JSON.parse(cached);
        this.unlocked = true;
      }
    } catch (e) {
      /* ignore */
    }
  },
  beforeUnmount() {
    document.body.style.overflow = '';
  },
  methods: {
    formatDate,

    // 第一级：用空间访问码解密「文章目录」，解密成功即门禁通过
    async unlockSpace() {
      const code = this.spaceCodeInput.trim();
      if (!code) {
        this.gateError = '请输入访问码';
        return;
      }
      if (!privateData || !privateData.space || !privateData.space.blob) {
        this.gateError = '私人空间尚未配置（缺少空间门码），请在 content/private/空间配置.json 里设置';
        return;
      }
      this.busy = true;
      this.gateError = '';
      try {
        const data = await decryptJson(privateData.space.blob, code);
        this.entries = data.entries || [];
        this.unlocked = true;
        try {
          sessionStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(this.entries));
        } catch (e) {
          /* ignore */
        }
      } catch (e) {
        this.gateError = '访问码错误，再想想？';
      } finally {
        this.busy = false;
      }
    },

    lockAgain() {
      this.unlocked = false;
      this.entries = [];
      this.closeArticle();
      try {
        sessionStorage.removeItem(ENTRIES_CACHE_KEY);
      } catch (e) {
        /* ignore */
      }
    },

    openEntry(entry) {
      const article = (privateData.articles || []).find((a) => a.id === entry.id);
      if (!article) {
        return;
      }
      this.openArticle = article;
      this.articleMeta = { title: entry.title, date: entry.date, tags: entry.tags };
      this.articleCodeInput = '';
      // 已解锁过的文章在同一会话内不再重复要码
      const cached = this.getArticleCache(entry.id);
      if (cached) {
        this.articleContent = cached.content;
        this.articleMeta = cached.meta;
        this.articleError = '';
      } else {
        this.articleContent = '';
        this.articleError = 'NEED_CODE';
      }
    },

    getArticleCache(id) {
      try {
        const raw = sessionStorage.getItem('ning-private-article-' + id);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    // 第二级：用文章自己的访问码解密正文
    async decryptArticle() {
      const code = this.articleCodeInput.trim();
      if (!code) {
        this.articleError = '请输入访问码';
        return;
      }
      this.busy = true;
      try {
        const data = await decryptJson(this.openArticle.blob, code);
        const { attributes, body } = this.parseFrontMatter(data.content || '');
        this.articleMeta = {
          title: attributes.title || data.title,
          date: attributes.date || data.date,
          tags: attributes.tags || data.tags || []
        };
        this.articleContent = body;
        this.articleError = '';
        try {
          sessionStorage.setItem(
            'ning-private-article-' + this.openArticle.id,
            JSON.stringify({ content: body, meta: this.articleMeta })
          );
        } catch (e) {
          /* ignore */
        }
      } catch (e) {
        this.articleError = '访问码错误，再想想？';
      } finally {
        this.busy = false;
      }
    },

    closeArticle() {
      this.openArticle = null;
      this.articleContent = '';
      this.articleMeta = {};
      this.articleCodeInput = '';
      this.articleError = '';
    },

    // 极简 front-matter 解析（私人文章正文自带）
    parseFrontMatter(raw) {
      if (!raw.startsWith('---')) return { attributes: {}, body: raw };
      const end = raw.indexOf('\n---', 3);
      if (end === -1) return { attributes: {}, body: raw };
      const head = raw.slice(3, end).trim();
      const body = raw.slice(raw.indexOf('\n', end + 1) + 1);
      const attributes = {};
      for (const line of head.split('\n')) {
        const m = line.match(/^([A-Za-z_\u4e00-\u9fa5][^:]*):\s*(.*)$/);
        if (!m) continue;
        attributes[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
      return { attributes, body };
    }
  }
};
</script>

<style scoped>
.private-page {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  color: var(--text-primary);
  background: var(--surface);
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 68px);
}

.private-inner {
  width: 100%;
  max-width: 900px;
}

.private-header {
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 8px;
}

.private-tagline {
  font-size: 20px;
  letter-spacing: 4px;
  color: var(--text-secondary);
}

.private-title-gradient {
  font-size: 46px;
  letter-spacing: 6px;
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.private-subtitle {
  margin-bottom: 22px;
  color: var(--text-secondary);
}

.private-subtitle i {
  color: var(--accent);
  margin-right: 6px;
}

/* 门禁卡片 */
.gate-card {
  margin: 30px auto;
  max-width: 460px;
  padding: 34px 28px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  text-align: center;
}

.gate-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--accent);
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  box-shadow: var(--glow-shadow);
}

.gate-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.gate-subtitle {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.gate-form {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.gate-input {
  flex: 1;
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--input-text);
  padding: 0 14px;
  outline: none;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.gate-input:focus {
  border: 1px solid var(--accent-border);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.gate-btn {
  height: 42px;
  padding: 0 22px;
  border-radius: 10px;
  border: 1px solid var(--accent-border);
  background: var(--accent-soft);
  color: var(--text-primary);
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.gate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--btn-hover-bg);
}

.gate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gate-error {
  margin: 14px 0 0;
  color: var(--error-text);
  font-size: 13px;
}

/* 已解锁栏 */
.unlocked-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  color: var(--pill-text);
  font-size: 14px;
  margin-bottom: 16px;
}

.unlocked-bar i {
  color: var(--accent);
  margin-right: 4px;
}

.lock-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 13px;
  cursor: pointer;
}

.lock-btn:hover {
  background: var(--btn-hover-bg);
}

/* 文章列表 */
.private-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.private-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.private-item:hover,
.private-item:focus-visible {
  transform: translateY(-2px);
  border: 1px solid var(--accent-border);
  box-shadow: var(--card-hover-shadow);
}

.private-item-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.private-key-icon {
  color: var(--accent);
  margin-right: 8px;
  font-size: 14px;
}

.private-item-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.private-item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.private-item-date {
  font-size: 12px;
  color: var(--text-muted);
}

.private-item-action {
  font-size: 12px;
  color: var(--blog-link-color);
  white-space: nowrap;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  color: var(--text-secondary);
}

/* 文章视图 */
.back-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: var(--btn-hover-bg);
}

.private-article {
  padding: 26px 28px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
}

.private-article-title {
  margin: 0 0 10px;
  font-size: 26px;
  color: var(--text-primary);
}

.private-article-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-muted);
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--surface-border);
  margin-bottom: 8px;
}

/* markdown 正文基础排版（浅色下自动跟随主题文字色） */
.private-article-content {
  line-height: 1.75;
  font-size: 15px;
  color: var(--text-primary);
  word-break: break-word;
}

.private-article-content :deep(h1),
.private-article-content :deep(h2),
.private-article-content :deep(h3),
.private-article-content :deep(h4) {
  color: var(--text-primary);
  margin: 1.2em 0 0.6em;
}

.private-article-content :deep(h2) {
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 6px;
}

.private-article-content :deep(p) {
  margin: 0.8em 0;
}

.private-article-content :deep(blockquote) {
  margin: 1em 0;
  padding: 8px 16px;
  border-left: 4px solid var(--accent);
  background: var(--pill-bg);
  color: var(--text-secondary);
  border-radius: 0 8px 8px 0;
}

.private-article-content :deep(code) {
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.9em;
  color: var(--text-primary);
}

.private-article-content :deep(pre) {
  border-radius: 10px;
  overflow-x: auto;
  padding: 14px 16px;
  background: #0d1117;
}

.private-article-content :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: #e6edf3;
}

.private-article-content :deep(ul),
.private-article-content :deep(ol) {
  padding-left: 1.4em;
}

.private-article-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.private-article-content :deep(th),
.private-article-content :deep(td) {
  border: 1px solid var(--surface-border);
  padding: 8px 12px;
  text-align: left;
}

.private-article-content :deep(th) {
  background: var(--pill-bg);
}

.private-article-content :deep(a) {
  color: var(--blog-link-color);
}

@media (max-width: 768px) {
  .private-page {
    padding: 16px;
  }

  .private-title-gradient {
    font-size: 36px;
  }

  .private-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .private-item-side {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }

  .private-article {
    padding: 20px 16px;
  }

  .gate-form {
    flex-direction: column;
  }
}
</style>
