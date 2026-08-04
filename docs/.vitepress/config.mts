import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { privatePagesPlugin } from './private-plugin'
import { parseFrontmatter } from '../../scripts/lib-frontmatter.mjs'
import { loadSecrets } from '../../scripts/lib-secrets.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../..')
const privateSecrets = loadSecrets(projectRoot)

/** 本地预览时，把 docs/private 下的文章动态挂到侧边栏（线上不显示） */
function devPrivateSidebar() {
  const items: { text: string; link: string }[] = [
    { text: '私密区入口', link: '/private/' }
  ]
  const postsDir = path.join(projectRoot, 'docs', 'private', 'posts')
  if (fs.existsSync(postsDir)) {
    for (const f of fs.readdirSync(postsDir).sort()) {
      if (!f.endsWith('.md')) continue
      try {
        const { data } = parseFrontmatter(
          fs.readFileSync(path.join(postsDir, f), 'utf8')
        )
        items.push({
          text: (data.title || f) + '（私密）',
          link: '/private/posts/' + f.replace(/\.md$/, '')
        })
      } catch {
        /* 解析失败就跳过 */
      }
    }
  }
  return items
}

// =====================================================================
//  站点配置
//  上线前后需要关注的位置都用 TODO 标出了：
//  1. title / description：站点名字和简介
//  2. themeConfig.giscus：评论区的两个 ID（见 docs/tutorials/enable-comments.md）
//  3. themeConfig.likeApi：点赞服务地址（见 docs/tutorials/enable-likes.md）
//  4. 私密内容：见 docs/tutorials/how-to-hide.md
//  5. 如果仓库名不是 XNXXN90990.github.io，需要把 base 改成 '/仓库名/'
// =====================================================================

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    lang: 'zh-CN',
    title: '我的个人小站', // TODO: 改成你的站点名字
    description: '记录、教程与学习路线——写给自己，也写给后来人。',
    base: '/',

    // 日间 / 夜间模式：默认跟随系统，右上角可手动切换
    appearance: 'dark',
    lastUpdated: true,

    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // 不蒜子统计：首页访问量 / 访客数、文章阅读量（部署上线后才开始计数）
      [
        'script',
        { async: 'true', src: '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js' }
      ]
    ],

    markdown: {
      lineNumbers: true
    },

    vite: {
      plugins: [privatePagesPlugin({ root: projectRoot, dev: isDev })]
    },

    themeConfig: {
      nav: [
        { text: '首页', link: '/' },
        { text: '学习路线', link: '/learning-path/', activeMatch: '/learning-path/' },
        { text: '技术教程', link: '/tutorials/', activeMatch: '/tutorials/' },
        { text: '随笔杂谈', link: '/essays/', activeMatch: '/essays/' },
        { text: '工具与资源', link: '/resources/', activeMatch: '/resources/' },
        { text: '关于本站', link: '/about' }
      ],

      sidebar: {
        '/learning-path/': [
          {
            text: '学习路线',
            items: [{ text: '学习路线模板', link: '/learning-path/template' }]
          }
        ],
        '/tutorials/': [
          {
            text: '技术教程',
            items: [
              { text: '如何在这个站点写一篇文章', link: '/tutorials/how-to-write' },
              { text: '如何发布一篇私密文章', link: '/tutorials/how-to-hide' },
              { text: '如何开启评论区', link: '/tutorials/enable-comments' },
              { text: '如何开启点赞功能', link: '/tutorials/enable-likes' }
            ]
          }
        ],
        '/essays/': [
          {
            text: '随笔杂谈',
            items: [
              { text: '写在开篇：为什么我想做这个网站', link: '/essays/hello-world' }
            ]
          }
        ],
        '/resources/': [
          {
            text: '工具与资源',
            items: [{ text: '我收藏的宝藏网站', link: '/resources/favorites' }]
          }
        ],
        // 私密区：只在本地预览时显示完整列表，线上不出现在任何侧边栏
        ...(isDev
          ? { '/private/': [{ text: '私密区（仅本地显示）', items: devPrivateSidebar() }] }
          : {})
      },

      // 本地搜索（免费、无需第三方服务，支持中文）
      // 私密文章的正文不会被收录（构建时已加密），只有标题和访问编号可被搜到
      search: {
        provider: 'local',
        options: {
          translations: {
            button: {
              buttonText: '搜索',
              buttonAriaLabel: '搜索'
            },
            modal: {
              displayDetails: '显示详情',
              resetButtonTitle: '清空查询',
              backButtonTitle: '关闭',
              noResultsText: '没有找到相关内容',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭'
              }
            }
          },
          miniSearch: {
            options: {
              // 中文按单字切分，保证中文搜索可用
              tokenize: (text: string) =>
                text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_]+/g) || []
            },
            searchOptions: {
              fuzzy: 0.2,
              prefix: true
            }
          },
          // 搜索索引直接读取磁盘上的 md 源文件（绕过页面构建），
          // 私密文章在这里拦截：只收录标题和访问编号，正文绝不进索引
          _render: async (md_src: string, env: any, mdRenderer: any) => {
            const file = String(env.path || '').replace(/\\/g, '/')
            if (file.includes('/private/posts/') && file.endsWith('.md')) {
              const { data } = parseFrontmatter(md_src)
              const rel = 'posts/' + path.basename(file)
              const code = privateSecrets?.codes?.[rel] || ''
              // 只把标题和编号交给渲染器（生成带 anchor 的标题才能被索引收录）
              return mdRenderer.render(`# ${data.title || ''}\n\n${code}\n`, env)
            }
            const html = mdRenderer.render(md_src, env)
            return env.frontmatter?.search === false ? '' : html
          }
        }
      },

      socialLinks: [{ icon: 'github', link: 'https://github.com/XNXXN90990' }],

      outline: {
        level: [2, 3],
        label: '本页目录'
      },

      docFooter: {
        prev: '上一篇',
        next: '下一篇'
      },

      lastUpdated: {
        text: '最后更新于'
      },

      darkModeSwitchLabel: '外观',
      darkModeSwitchTitle: '切换到夜间模式',
      lightModeSwitchTitle: '切换到日间模式',
      sidebarMenuLabel: '菜单',
      returnToTopLabel: '回到顶部',

      editLink: {
        pattern: 'https://github.com/XNXXN90990/XNXXN90990.github.io/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页'
      },

      // ================= 评论区（giscus） =================
      // 开启方法见 docs/tutorials/enable-comments.md
      giscus: {
        repo: 'XNXXN90990/XNXXN90990.github.io',
        repoId: 'REPO_ID_PLACEHOLDER', // TODO: 替换成真实 ID 后评论区才会显示
        category: 'General',
        categoryId: 'CATEGORY_ID_PLACEHOLDER' // TODO: 替换成真实 ID
      },

      // ================= 点赞 =================
      // 开启方法见 docs/tutorials/enable-likes.md，填上 Worker 地址后按钮才会显示
      likeApi: '' // TODO: 例如 'https://like-api.xxxx.workers.dev'
    }
  }
})
