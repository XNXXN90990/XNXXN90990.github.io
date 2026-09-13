// VitePress 私密文章插件（适配 /me/ 路径）
// ------------------------------------------------------------------
// 规则：
// - docs/me/posts/*.md 为私密文章。
// - 本地预览（npm run dev）：自动解密，站长可正常查看与写作。
// - 构建（npm run build）：正文用「文章访问码」与「主访问码」双重 AES-GCM
//   加密后替换为 <PrivateLock /> 锁屏占位，明文不会进入网页与 JS 产物。
// - 访问码藏在隐藏 span 中供站内搜索命中（搜编号/标题可找到文章）。
// - 密钥来源：环境变量 PRIVATE_SECRETS（GitHub Actions）或本地
//   docs/.vitepress/private-secrets.json（已加入 .gitignore）。
import fs from 'node:fs'
import path from 'node:path'
import { encryptText, decryptText } from '../../scripts/lib-crypto.mjs'
import { loadSecrets } from '../../scripts/lib-secrets.mjs'
import { parseFrontmatter, buildFrontmatter } from '../../scripts/lib-frontmatter.mjs'

const VIRTUAL_ID = 'virtual:private-index'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

export function privatePagesPlugin(options: { root: string; dev: boolean }) {
  const { root, dev } = options
  const postsDir = path.join(root, 'docs', 'me', 'posts')
  const secrets = loadSecrets(root)

  if (!secrets || !secrets.masterCode) {
    console.warn(
      '[private] 未找到私密配置（private-secrets.json 或环境变量 PRIVATE_SECRETS）。' +
        '私密文章将以"无法解锁"的状态构建。'
    )
  }

  const normalize = (id: string) => id.split('?')[0].replace(/\\/g, '/')
  const isPrivatePost = (id: string) => {
    const p = normalize(id)
    return p.endsWith('.md') && p.includes('/me/posts/')
  }

  /** 读取某私密文章的明文正文（必要时用主访问码解密 enc 字段） */
  const readPlaintext = (data: any, body: string, file: string): string | null => {
    if (!data.enc) return body
    if (!secrets || !secrets.masterCode) {
      console.warn(`[private] ${file} 已加密但缺少主访问码，无法处理`)
      return null
    }
    try {
      return decryptText(JSON.parse(data.enc), secrets.masterCode)
    } catch (e) {
      console.warn(`[private] ${file} 解密失败（主访问码不匹配？）`)
      return null
    }
  }

  /** 私密区入口页的列表数据（dev 明文；构建时用主访问码加密） */
  const buildIndexData = () => {
    const items: { title: string; path: string; date: string; code: string }[] = []
    if (fs.existsSync(postsDir)) {
      for (const f of fs.readdirSync(postsDir).sort()) {
        if (!f.endsWith('.md')) continue
        const text = fs.readFileSync(path.join(postsDir, f), 'utf8')
        const { data } = parseFrontmatter(text)
        const rel = `posts/${f}`
        items.push({
          title: data.title || f,
          path: '/me/posts/' + f.replace(/\.md$/, ''),
          date: data.date || '',
          code: secrets?.codes?.[rel] || ''
        })
      }
    }
    if (dev) {
      return { dev: true, items }
    }
    let blob: any = null
    if (secrets && secrets.masterCode) {
      blob = encryptText(JSON.stringify(items), secrets.masterCode)
    }
    return { dev: false, blob }
  }

  return {
    name: 'vitepress-private-pages',
    enforce: 'pre' as const,

    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
    },

    load(id: string) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return `export const data = ${JSON.stringify(buildIndexData())}`
      }
    },

    transform(code: string, id: string) {
      if (!isPrivatePost(id)) return
      const file = path.basename(normalize(id))
      const { data, body } = parseFrontmatter(code)
      const plaintext = readPlaintext(data, body, file)

      const baseFm = {
        title: data.title || file.replace(/\.md$/, ''),
        date: data.date || '',
        private: 'true'
      }

      // 本地预览：站长直接看到明文
      if (dev) {
        if (plaintext === null) {
          return (
            buildFrontmatter(baseFm) +
            '\n> 提示：这篇文章已加密，但本地缺少主访问码，无法预览。请配置 docs/.vitepress/private-secrets.json。\n'
          )
        }
        return buildFrontmatter(baseFm) + plaintext
      }

      // 构建：加密替换，明文不出产物
      const rel = `posts/${file}`
      const articleCode = secrets?.codes?.[rel]

      if (plaintext === null || !articleCode || !secrets?.masterCode) {
        if (!articleCode && plaintext !== null) {
          console.warn(
            `[private] ${file} 没有配置访问码（private-secrets.json 的 codes 字段），该文章将以无法解锁的状态发布。`
          )
        }
        return buildFrontmatter(baseFm) + '\n<PrivateLock />\n'
      }

      const payload = {
        v: 1,
        a: encryptText(plaintext, articleCode),
        m: encryptText(plaintext, secrets.masterCode)
      }
      // 整体 base64 编码后写入 frontmatter，避免引号转义问题
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64')

      return (
        buildFrontmatter({ ...baseFm, payload: payloadB64 }) +
        `\n<span class="pv-code" aria-hidden="true">${articleCode}</span>\n\n<PrivateLock />\n`
      )
    }
  }
}
