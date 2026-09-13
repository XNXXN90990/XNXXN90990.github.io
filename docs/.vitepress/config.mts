import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { privatePagesPlugin } from './private-plugin'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../..')

/**
 * 本地预览时把 docs/me/posts 下的所有 .md 文件动态挂到导航和侧边栏
 * 线上不显示（线上是加密门禁）
 */
function devPrivateList() {
  const out: { text: string; link: string }[] = []
  const postsDir = path.join(projectRoot, 'docs', 'me', 'posts')
  if (fs.existsSync(postsDir)) {
    for (const f of fs.readdirSync(postsDir).sort()) {
      if (!f.endsWith('.md')) continue
      if (isDraftMd(postsDir, f)) continue
      out.push({
        text: f.replace(/\.md$/, ''),
        link: '/me/posts/' + f.replace(/\.md$/, ''),
      })
    }
  }
  return out
}

/** 简单 frontmatter 解析（够用，只读 draft/title） */
function parseFm(text: string): Record<string, string> {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const out: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\(["\\])/g, '$1')
    else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1)
    out[kv[1]] = v
  }
  return out
}

function isDraftMd(dir: string, file: string): boolean {
  const text = fs.readFileSync(path.join(dir, file), 'utf8')
  const fm = parseFm(text)
  return fm.draft === 'true' || fm.draft === 'true'
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  // 各分类的 sidebar：从磁盘读 .md 文件，自动跳过 draft
  function listMd(dir: string) {
    const full = path.join(projectRoot, 'docs', dir)
    if (!fs.existsSync(full)) return []
    return fs
      .readdirSync(full)
      .filter((f) => f.endsWith('.md') && f !== 'index.md')
      .filter((f) => !isDraftMd(full, f))
      .sort()
      .map((f) => ({
        text: f.replace(/\.md$/, ''),
        link: '/' + dir.replace(/\/$/, '') + '/' + f.replace(/\.md$/, ''),
      }))
  }

  const tut = listMd('tutorials')
  const mom = listMd('moments')
  const lp  = listMd('learning-path')
  const es  = listMd('essays')

  const nav: any[] = [
    { text: '首页', link: '/' },
    { text: '教程', link: '/tutorials/', activeMatch: '/tutorials/' },
    { text: '杂谈说说', link: '/moments/', activeMatch: '/moments/' },
    { text: '学习路线', link: '/learning-path/', activeMatch: '/learning-path/' },
    { text: '随笔', link: '/essays/', activeMatch: '/essays/' },
    { text: '友链', link: '/links/', activeMatch: '/links/' },
    { text: '关于', link: '/about/', activeMatch: '/about/' },
  ]

  // 私人入口：本地预览才在导航上显示
  if (isDev) {
    nav.push({ text: '我的 · 本地', link: '/me/', activeMatch: '/me/' })
  }

  return {
    lang: 'zh-CN',
    title: '寜的小站',
    titleTemplate: ["寜的小站", "Ning's Blog"],
    description: '一点教程、一点杂谈、偶尔的思考，还有一处只属于自己的小角落。',
    base: '/',
    cleanUrls: true,
    lastUpdated: true,

    appearance: 'dark',
    ignoreDeadLinks: true,

    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // 不蒜子（PV / UV）。注意：客户端侧挂载，避免对搜索有副作用。
      [
        'meta',
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    ],

    markdown: {
      lineNumbers: false,
      container: { tipLabel: '提示', warningLabel: '警告', dangerLabel: '危险', infoLabel: 'info' },
    },

    vite: {
      plugins: [privatePagesPlugin({ root: projectRoot, dev: isDev })],
    },

    themeConfig: {
      nav,
      logo: undefined,
      siteTitle: '寜的小站',

      sidebar: {
        '/tutorials/': [
          { text: '教程', items: [{ text: '概览', link: '/tutorials/' }, ...tut] },
        ],
        '/moments/': [
          { text: '杂谈说说', items: [{ text: '概览', link: '/moments/' }, ...mom] },
        ],
        '/learning-path/': [
          { text: '学习路线', items: [{ text: '概览', link: '/learning-path/' }, ...lp] },
        ],
        '/essays/': [
          { text: '随笔', items: [{ text: '概览', link: '/essays/' }, ...es] },
        ],
        '/links/':  [{ text: '友链',  items: [{ text: '友链', link: '/links/' }] }],
        '/about/':  [{ text: '关于',  items: [{ text: '关于', link: '/about/' }] }],
        // 私人区：本地预览才有完整列表
        ...(isDev
          ? { '/me/': [{ text: '我的（仅本地）', items: [{ text: '入口', link: '/me/' }, ...devPrivateList()] }] }
          : {}),
      },

      outline: { level: [2, 3], label: '本页目录' },
      docFooter: { prev: '上一篇', next: '下一篇' },
      lastUpdated: { text: '最后更新于' },

      darkModeSwitchLabel: '外观',
      darkModeSwitchTitle: '切换到夜间模式',
      lightModeSwitchTitle: '切换到日间模式',
      sidebarMenuLabel: '菜单',
      returnToTopLabel: '回到顶部',

      socialLinks: [{ icon: 'github', link: 'https://github.com/XNXXN90990' }],

      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: { tokenize: (text: string) => text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_]+/g) || [] },
            searchOptions: { fuzzy: 0.2, prefix: true },
          },
        },
      },

      // 关闭默认 footer —— 我们自己有更克制的
      hideDarkModeToggle: false,
    },
  }
})
