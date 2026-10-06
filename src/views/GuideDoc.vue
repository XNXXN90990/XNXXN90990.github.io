<template>
  <div class="guide-doc">
    <!-- 顶部出处条 -->
    <div class="doc-source-bar">
      <button class="bar-btn" type="button" @click="$router.push(`/guide/${gid}`)">
        <i class="fa-solid fa-list-ul"></i> <span class="bar-btn-text">目录</span>
      </button>
      <span class="bar-source">{{ guide ? guide.title : '指南' }} · 收录自开源项目（{{ guide ? guide.source.license : '' }}）</span>
      <a
        v-if="guide"
        class="bar-btn bar-link"
        :href="guide.source.site"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="fa-solid fa-globe"></i> <span class="bar-btn-text">原站</span>
      </a>
    </div>

    <div class="doc-layout">
      <!-- 左侧目录（可收起） -->
      <aside
        v-if="guide"
        class="doc-toc"
        :class="{ 'doc-toc--collapsed': tocCollapsed }"
      >
        <button
          class="toc-collapse-btn"
          type="button"
          :title="tocCollapsed ? '展开目录' : '收起目录'"
          @click="tocCollapsed = !tocCollapsed"
        >
          <i class="fa-solid" :class="tocCollapsed ? 'fa-indent' : 'fa-outdent'"></i>
        </button>
        <div v-show="!tocCollapsed" class="doc-toc-scroll">
          <GuideToc :chapters="guide.chapters" :gid="gid" :current-path="docPath" :default-open-depth="2" />
        </div>
      </aside>

      <!-- 正文 -->
      <main class="doc-main">
        <div class="doc-card">
          <template v-if="loading">
            <p class="doc-status">加载中...</p>
          </template>
          <template v-else-if="loadError">
            <p class="doc-status doc-status--error">{{ loadError }}</p>
          </template>
          <template v-else>
            <h1 class="doc-title">{{ currentTitle }}</h1>
            <div class="doc-meta">
              <span><i class="fa-solid fa-feather"></i> {{ guide ? guide.source.author : '' }}</span>
              <span><i class="fa-solid fa-scale-balanced"></i> 版权归原作者所有，本站仅作学习收录</span>
            </div>
            <div class="doc-content" v-html="renderedMarkdown"></div>

            <!-- 上一篇 / 下一篇 -->
            <div class="doc-pager">
              <button v-if="prevDoc" class="pager-btn" type="button" @click="goDoc(prevDoc)">
                <i class="fa-solid fa-angle-left"></i>
                <span class="pager-text">{{ prevDoc.title }}</span>
              </button>
              <span v-else class="pager-placeholder"></span>
              <button v-if="nextDoc" class="pager-btn pager-btn--next" type="button" @click="goDoc(nextDoc)">
                <span class="pager-text">{{ nextDoc.title }}</span>
                <i class="fa-solid fa-angle-right"></i>
              </button>
            </div>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';
import markdownItTexmath from 'markdown-it-texmath';
import katex from 'katex';
import DOMPurify from 'dompurify';
import hljs from '@/utils/hljs';
import { getGuideById, fetchGuideDoc, flattenGuideChapters } from '@/api';
import GuideToc from '@/components/GuideToc.vue';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

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
md.use(markdownItTexmath, { engine: katex, delimiters: 'dollars' });

export default {
  name: 'GuideDoc',
  components: { GuideToc },
  data() {
    return {
      content: '',
      loading: true,
      loadError: '',
      tocCollapsed: false,
      docUnsubscribe: null
    };
  },
  computed: {
    gid() {
      return this.$route.params.gid;
    },
    guide() {
      return getGuideById(this.gid);
    },
    docPath() {
      // 路由通配参数：/guide/:gid/:doc(.*) 可能包含多级路径，需解码
      const raw = this.$route.params.doc || '';
      const path = raw.split('/').map((seg) => {
        try { return decodeURIComponent(seg); } catch (e) { return seg; }
      }).join('/');
      return path.replace(/\.md$/i, '');
    },
    flatDocs() {
      return flattenGuideChapters(this.guide ? this.guide.chapters : []);
    },
    currentIndex() {
      return this.flatDocs.findIndex((d) => d.path === this.docPath);
    },
    currentTitle() {
      const flat = this.flatDocs[this.currentIndex];
      if (flat && flat.title) return flat.title;
      // 文档内首个 h1 兜底
      const m = this.content.match(/^#\s+(.+)$/m);
      return m ? m[1] : '未命名章节';
    },
    prevDoc() {
      return this.currentIndex > 0 ? this.flatDocs[this.currentIndex - 1] : null;
    },
    nextDoc() {
      return this.currentIndex >= 0 && this.currentIndex < this.flatDocs.length - 1
        ? this.flatDocs[this.currentIndex + 1]
        : null;
    },
    renderedMarkdown() {
      if (!this.content) return '';
      return DOMPurify.sanitize(md.render(this.content));
    }
  },
  watch: {
    docPath: {
      immediate: true,
      handler() {
        this.loadDoc();
      }
    }
  },
  methods: {
    async loadDoc() {
      this.loading = true;
      this.loadError = '';
      try {
        const resp = await fetchGuideDoc(this.gid, this.docPath);
        this.content = resp.data.content;
        document.title = `${this.currentTitle} · ${this.guide ? this.guide.title : ''} - 寜的小站`;
        // 跳转/切换章节回到顶部（Lenis 接管时同步）
        this.$nextTick(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        });
      } catch (e) {
        this.loadError = '文档加载失败，可能链接已失效。';
        console.error('指南文档加载失败:', e);
      } finally {
        this.loading = false;
      }
    },
    goDoc(doc) {
      const encoded = doc.path.split('/').map(encodeURIComponent).join('/');
      this.$router.push(`/guide/${this.gid}/${encoded}`);
    }
  }
};
</script>

<style scoped>
.guide-doc {
  padding: 12px 16px 10px;
  color: var(--text-primary);
  min-height: calc(100vh - 68px);
  max-width: 1400px;
  margin: 0 auto;
}

/* 出处条 */
.doc-source-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--pill-text);
}

.bar-source {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.bar-btn:hover {
  background: var(--btn-hover-bg);
}

/* 布局 */
.doc-layout {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.doc-toc {
  flex: 0 0 280px;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow: hidden;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  transition: flex-basis 0.25s ease, width 0.25s ease;
}

.doc-toc--collapsed {
  flex: 0 0 44px;
}

.toc-collapse-btn {
  width: 100%;
  height: 38px;
  border: none;
  border-bottom: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  cursor: pointer;
  font-size: 14px;
}

.toc-collapse-btn:hover {
  background: var(--btn-hover-bg);
}

.doc-toc-scroll {
  padding: 10px 12px 16px;
  overflow-y: auto;
  max-height: calc(100vh - 152px);
}

/* 正文 */
.doc-main {
  flex: 1 1 0;
  min-width: 0;
}

.doc-card {
  padding: 26px 30px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
}

.doc-status {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}

.doc-status--error {
  color: var(--error-text);
}

.doc-title {
  margin: 0 0 12px;
  font-size: 28px;
  line-height: 1.35;
  color: var(--text-primary);
}

.doc-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--surface-border);
  margin-bottom: 10px;
}

.doc-meta i {
  color: var(--accent);
  margin-right: 4px;
}

/* markdown 正文 */
.doc-content {
  line-height: 1.8;
  font-size: 15px;
  color: var(--text-primary);
  word-break: break-word;
}

.doc-content :deep(h1),
.doc-content :deep(h2),
.doc-content :deep(h3),
.doc-content :deep(h4) {
  color: var(--text-primary);
  margin: 1.4em 0 0.6em;
  line-height: 1.4;
}

.doc-content :deep(h1) {
  font-size: 24px;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 8px;
}

.doc-content :deep(h2) {
  font-size: 21px;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 6px;
}

.doc-content :deep(h3) {
  font-size: 18px;
}

.doc-content :deep(p) {
  margin: 0.8em 0;
}

.doc-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 10px 0;
}

.doc-content :deep(a) {
  color: var(--blog-link-color);
}

.doc-content :deep(blockquote) {
  margin: 1em 0;
  padding: 8px 16px;
  border-left: 4px solid var(--accent);
  background: var(--pill-bg);
  color: var(--text-secondary);
  border-radius: 0 8px 8px 0;
}

.doc-content :deep(code) {
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.88em;
}

.doc-content :deep(pre) {
  border-radius: 10px;
  overflow-x: auto;
  padding: 14px 16px;
  background: #0d1117;
}

.doc-content :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: #e6edf3;
}

.doc-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  display: block;
  overflow-x: auto;
}

.doc-content :deep(th),
.doc-content :deep(td) {
  border: 1px solid var(--surface-border);
  padding: 8px 12px;
  text-align: left;
}

.doc-content :deep(th) {
  background: var(--pill-bg);
}

.doc-content :deep(ul),
.doc-content :deep(ol) {
  padding-left: 1.5em;
}

.doc-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--surface-border);
  margin: 1.5em 0;
}

/* 上/下一篇 */
.doc-pager {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px dashed var(--surface-border);
}

.pager-btn {
  max-width: 48%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 13px;
  cursor: pointer;
}

.pager-btn:hover {
  background: var(--btn-hover-bg);
  border-color: var(--accent-border);
}

.pager-btn--next {
  margin-left: auto;
}

.pager-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pager-placeholder {
  flex: 1;
}

/* 手机端 */
@media (max-width: 900px) {
  .doc-layout {
    flex-direction: column;
  }

  .doc-toc {
    position: static;
    flex: none;
    width: 100%;
    max-height: none;
    order: -1;
  }

  .doc-toc--collapsed .doc-toc-scroll {
    display: none;
  }

  .doc-toc-scroll {
    max-height: 40vh;
  }

  .doc-card {
    padding: 20px 16px;
  }

  .bar-btn-text {
    display: none;
  }

  .bar-btn {
    padding: 0 8px;
  }
}
</style>
