// npm run src:lock
// 把 docs/private/posts/ 下所有明文私密文章加密为 enc 形式（用于安全提交到公开仓库）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { encryptText } from './lib-crypto.mjs'
import { loadSecrets } from './lib-secrets.mjs'
import { parseFrontmatter, buildFrontmatter } from './lib-frontmatter.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = path.join(root, 'docs', 'private', 'posts')

const secrets = loadSecrets(root)
if (!secrets || !secrets.masterCode) {
  console.error('缺少主访问码：请先创建 docs/.vitepress/private-secrets.json（含 masterCode 字段）')
  process.exit(1)
}

if (!fs.existsSync(postsDir)) {
  console.log('没有 docs/private/posts 目录，无事可做')
  process.exit(0)
}

let locked = 0
let skipped = 0
for (const f of fs.readdirSync(postsDir)) {
  if (!f.endsWith('.md')) continue
  const file = path.join(postsDir, f)
  const text = fs.readFileSync(file, 'utf8')
  const { data, body } = parseFrontmatter(text)
  if (data.enc) {
    skipped++
    continue
  }
  if (!body.trim()) {
    skipped++
    continue
  }
  const enc = encryptText(body, secrets.masterCode)
  const newData = { ...data, enc: JSON.stringify(enc) }
  fs.writeFileSync(file, buildFrontmatter(newData), 'utf8')
  locked++
  console.log('已加密：' + f)
}
console.log(`完成：新加密 ${locked} 篇，跳过 ${skipped} 篇（已是加密状态或为空）`)
