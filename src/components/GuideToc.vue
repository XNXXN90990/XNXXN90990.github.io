<template>
  <div class="guide-toc">
    <template v-for="item in visibleItems" :key="item.key">
      <!-- 分组行（可折叠） -->
      <button
        v-if="item.hasChildren"
        class="toc-group-label"
        type="button"
        :style="{ paddingLeft: item.depth * 16 + 'px' }"
        @click="toggle(item.key)"
      >
        <i class="fa-solid" :class="isOpen(item.key) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
        <span class="toc-group-title">{{ item.title }}</span>
      </button>

      <!-- 文档行 -->
      <router-link
        v-else
        class="toc-doc"
        :class="{ 'is-current': currentPath === item.path }"
        :style="{ paddingLeft: item.depth * 16 + 22 + 'px' }"
        :to="`/guide/${gid}/${item.path.split('/').map(encodeURIComponent).join('/')}`"
      >
        {{ item.title }}
      </router-link>
    </template>
  </div>
</template>

<script>
/**
 * GuideToc —— 指南章节树（扁平化渲染版）
 *
 * 把树拍平成带 depth 的列表依次渲染，折叠时直接跳过子树，
 * 避免递归组件的注册/性能问题。
 */
export default {
  name: 'GuideToc',
  props: {
    chapters: { type: Array, required: true },
    gid: { type: String, required: true },
    currentPath: { type: String, default: '' },
    defaultOpenDepth: { type: Number, default: 1 }
  },
  data() {
    return { openSet: {} };
  },
  computed: {
    /** 折叠状态集合：depth < defaultOpenDepth 默认展开 */
    baseOpenSet() {
      // 用一个不可变引用即可，isOpen 里 depth < defaultOpenDepth 时始终视为展开
      return this.openSet;
    },
    flatTree() {
      const out = [];
      const walk = (nodes, depth) => {
        for (const node of nodes || []) {
          const hasChildren = Array.isArray(node.children) && node.children.length > 0;
          const key = (node.path || node.title || '?') + '#' + depth;
          out.push({ key, title: node.title || (node.path ? node.path : '目录'), path: node.path || null, depth, hasChildren });
          if (hasChildren) walk(node.children, depth + 1);
        }
      };
      walk(this.chapters, 0);
      return out;
    },
    visibleItems() {
      const visible = [];
      let hideUntilDepth = Infinity; // 被折叠分组的子树深度阈值
      for (const item of this.flatTree) {
        if (item.depth <= hideUntilDepth) {
          hideUntilDepth = Infinity; // 回到未折叠层级
        }
        if (item.depth > hideUntilDepth) continue;

        visible.push(item);
        if (item.hasChildren && !this.isOpen(item.key)) {
          hideUntilDepth = item.depth; // 折叠：跳过所有更深层级
        }
      }
      return visible;
    }
  },
  watch: {
    currentPath: {
      immediate: true,
      handler() {
        this.openAncestorsOf(this.chapters, []);
      }
    }
  },
  methods: {
    isOpen(key) {
      return this.openSet[key] ?? false;
    },
    toggle(key) {
      this.openSet = { ...this.openSet, [key]: !this.isOpen(key) };
    },
    /** 展开包含当前文档的各级分组 */
    openAncestorsOf(nodes, trail) {
      for (const node of nodes || []) {
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        if (node.path && node.path === this.currentPath) {
          // 命中：展开 trail 上的所有分组
          const next = { ...this.openSet };
          trail.forEach((key) => { next[key] = true; });
          this.openSet = next;
          return true;
        }
        if (hasChildren) {
          const key = (node.path || node.title || '?') + '#' + (trail.length);
          if (this.openAncestorsOf(node.children, trail.concat(key))) return true;
        }
      }
      return false;
    }
  }
};
</script>

<style scoped>
.guide-toc {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toc-group-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 4px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  box-sizing: border-box;
}

.toc-group-label:hover {
  color: var(--text-primary);
  background: var(--pill-bg);
}

.toc-group-label i {
  color: var(--accent);
  font-size: 10px;
  width: 12px;
  flex-shrink: 0;
}

.toc-group-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-doc {
  display: block;
  padding: 4px 6px;
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
  border-radius: 6px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-doc:hover {
  color: var(--text-primary);
  background: var(--pill-bg);
}

.toc-doc.is-current {
  color: var(--blog-link-color);
  background: var(--pill-bg);
  font-weight: 600;
}
</style>
