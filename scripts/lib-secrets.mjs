// 读取私密配置：优先环境变量 PRIVATE_SECRETS（GitHub Actions 用），其次本地文件
import fs from 'node:fs'
import path from 'node:path'

export function secretsFilePath(root) {
  return path.join(root, 'docs', '.vitepress', 'private-secrets.json')
}

export function loadSecrets(root) {
  if (process.env.PRIVATE_SECRETS) {
    try {
      return JSON.parse(process.env.PRIVATE_SECRETS)
    } catch (e) {
      console.warn('[private] 环境变量 PRIVATE_SECRETS 不是合法 JSON，已忽略')
    }
  }
  const file = secretsFilePath(root)
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      console.warn('[private] private-secrets.json 解析失败：' + e.message)
    }
  }
  return null
}

export function saveSecrets(root, secrets) {
  fs.writeFileSync(secretsFilePath(root), JSON.stringify(secrets, null, 2) + '\n', 'utf8')
}
