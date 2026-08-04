// npm run src:unlock
// 把 docs/private/posts/ 下的加密文章解密回明文，方便本地写作和预览（写完记得再 src:lock）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { decryptText } from './lib-crypto.mjs'
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

let unlocked = 0
let skipped = 0
for (const f of fs.readdirSync(postsDir)) {
  if (!f.endsWith('.md')) continue
  const file = path.join(postsDir, f)
  const text = fs.readFileSync(file, 'utf8')
  const { data } = parseFrontmatter(text)
  if (!data.enc) {
    skipped++
    continue
  }
  let body
  try {
    body = decryptText(JSON.parse(data.enc), secrets.masterCode)
  } catch (e) {
    console.error(`解密失败（主访问码不匹配？）：${f}`)
    process.exit(1)
  }
  const newData = { ...data }
  delete newData.enc
  fs.writeFileSync(file, buildFrontmatter(newData) + body, 'utf8')
  unlocked++
  console.log('已解密：' + f)
}
console.log(`完成：解密 ${unlocked} 篇，跳过 ${skipped} 篇（本就是明文）`)
