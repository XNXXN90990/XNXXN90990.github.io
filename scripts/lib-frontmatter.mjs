// 解析/生成简单的 YAML frontmatter（私密文章只用到 title/date/private/enc 字段）
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { data: {}, body: text, raw: '' }
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.startsWith('"') && v.endsWith('"')) {
      // 还原 buildFrontmatter 写入时的转义
      v = v.slice(1, -1).replace(/\\(["\\])/g, '$1')
    } else if (v.startsWith("'") && v.endsWith("'")) {
      v = v.slice(1, -1)
    }
    data[kv[1]] = v
  }
  return { data, body: text.slice(m[0].length), raw: m[1] }
}

export function buildFrontmatter(data) {
  const lines = []
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue
    lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`)
  }
  return `---\n${lines.join('\n')}\n---\n`
}
