// npm run src:new "文章标题"
// 新建一篇私密文章：生成文件、分配访问编号、登记到 private-secrets.json
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { loadSecrets, saveSecrets } from './lib-secrets.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = path.join(root, 'docs', 'private', 'posts')

const title = process.argv[2]
if (!title) {
  console.error('用法：npm run src:new "文章标题"')
  process.exit(1)
}

let secrets = loadSecrets(root)
if (!secrets) {
  console.error('缺少 docs/.vitepress/private-secrets.json，请先创建（至少包含 masterCode 字段）')
  process.exit(1)
}

fs.mkdirSync(postsDir, { recursive: true })

const now = new Date()
const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
const slug = `note-${ymd}-${crypto.randomBytes(2).toString('hex')}`
const file = `${slug}.md`
if (fs.existsSync(path.join(postsDir, file))) {
  console.error('极端巧合：文件名冲突，请重试一次')
  process.exit(1)
}

const code = crypto.randomBytes(4).toString('hex').toUpperCase()
const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const content = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${dateStr}"
private: true
---

# ${title}

在这里写正文……

> 提示：私密文章请使用标准 Markdown 语法；图片请放到 docs/public/ 并用绝对路径（如 /img/xxx.png）引用，或直接用外链图片。
`

fs.writeFileSync(path.join(postsDir, file), content, 'utf8')

secrets.codes = secrets.codes || {}
secrets.codes[`posts/${file}`] = code
saveSecrets(root, secrets)

console.log('已创建私密文章：docs/private/posts/' + file)
console.log('访问编号：' + code)
console.log('下一步：')
console.log('  1. npm run dev 本地写作预览')
console.log('  2. 推送前运行 npm run src:lock 加密源文件')
console.log('  3. 分享方式：告诉对方编号（站内搜索即可找到），或发送 文章链接?key=' + code)
