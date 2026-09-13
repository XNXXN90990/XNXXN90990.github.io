#!/usr/bin/env node
/**
 * 一键新建内容
 *
 * 用法：
 *   node scripts/new-content.mjs <category> <title> [--draft]
 *
 * category：
 *   moment          → docs/moments/<slug>.md        （杂谈说说 / 朋友圈）
 *   tutorial        → docs/tutorials/<slug>.md      （教程）
 *   learning-path   → docs/learning-path/<slug>.md  （学习路线）
 *   essay           → docs/essays/<slug>.md         （随笔）
 *   me              → docs/me/posts/<slug>.md       （私人文章）
 *
 * --draft              → 在 frontmatter 加 draft: true（sidebar 跳过）
 *
 * slug 默认是「日期 + 8 位随机」，写完后你随时可以重命名文件，frontmatter 会跟着保留。
 *
 * 示例：
 *   node scripts/new-content.mjs moment "今天天气好"
 *   node scripts/new-content.mjs tutorial "如何写一篇教程" --draft
 *   node scripts/new-content.mjs me "私人备忘"
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const CATEGORIES = {
  moment:        { dir: 'docs/moments',       label: '杂谈说说' },
  tutorial:      { dir: 'docs/tutorials',     label: '教程' },
  'learning-path': { dir: 'docs/learning-path', label: '学习路线' },
  essay:         { dir: 'docs/essays',        label: '随笔' },
  me:            { dir: 'docs/me/posts',      label: '私人文章' },
}

function help(exitCode = 0) {
  console.log(`
用法：node scripts/new-content.mjs <category> <title> [--draft]

category：${Object.keys(CATEGORIES).join(' | ')}

可选参数：
  --draft    创建草稿（frontmatter 加 draft: true，sidebar 跳过它）

示例：
  node scripts/new-content.mjs moment "今天天气好"
  node scripts/new-content.mjs tutorial "如何写一篇教程" --draft
  node scripts/new-content.mjs me "私人备忘"
`)
  process.exit(exitCode)
}

function makeSlug(prefix = '') {
  const d = new Date()
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const rnd = Math.random().toString(16).slice(2, 10)
  return prefix ? `${prefix}-${ymd}-${rnd}` : `${ymd}-${rnd}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function buildFrontmatter({ title, date, draft, slug }) {
  const lines = ['---', `title: "${title.replace(/"/g, '\\"')}"`, `date: ${date}`]
  if (draft) lines.push('draft: true')
  lines.push(`slug: ${slug}`)
  // 草稿自动加 noindex（避免被搜索引擎收录草稿），同时不影响 URL 访问
  if (draft) {
    lines.push('head:')
    lines.push('  - - meta')
    lines.push('    - name: robots')
    lines.push('      content: noindex')
  }
  lines.push('---')
  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') help(0)

  const category = args[0]
  const title = args[1]
  const draft = args.includes('--draft')
  if (!title) help(1)

  const meta = CATEGORIES[category]
  if (!meta) {
    console.error(`未知分类：${category}\n可选：${Object.keys(CATEGORIES).join(', ')}`)
    process.exit(1)
  }

  const dir = path.join(projectRoot, meta.dir)
  fs.mkdirSync(dir, { recursive: true })

  // 找一个不冲突的 slug
  let slug = makeSlug()
  let filePath = path.join(dir, `${slug}.md`)
  let n = 1
  while (fs.existsSync(filePath)) {
    slug = makeSlug(`${String(n).padStart(2, '0')}`)
    filePath = path.join(dir, `${slug}.md`)
    n++
    if (n > 99) {
      console.error('slug 一直撞，试一次新的标题？')
      process.exit(1)
    }
  }

  const content = `${buildFrontmatter({ title, date: today(), draft, slug })}\n\n> 开始写吧。\n\n`
  fs.writeFileSync(filePath, content, 'utf8')

  const rel = path.relative(projectRoot, filePath).replace(/\\/g, '/')
  console.log(`✓ 已${draft ? '创建草稿' : '新建文章'}：`)
  console.log(`  分类：${meta.label}`)
  console.log(`  文件：${rel}`)
  console.log(`  状态：${draft ? '草稿（draft: true，sidebar 不列，URL 仍可访问）' : '已发布'}`)
  console.log()
  console.log(`下一步：直接打开文件写。完成后 git add、git commit、git push 即可。`)
  if (draft) {
    console.log(`发布草稿：把 frontmatter 里的 'draft: true' 删掉，再提交。`)
  }
}

main()
