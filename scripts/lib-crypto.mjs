// 私密内容加解密核心（Node 端，构建与脚本共用）
// 算法：PBKDF2-SHA256(150000 次) 派生密钥 + AES-256-GCM
// 浏览器端在 docs/.vitepress/theme/crypto.ts 中用 Web Crypto 实现相同参数，二者兼容
import crypto from 'node:crypto'

const ITERATIONS = 150000

function b64(buf) {
  return Buffer.from(buf).toString('base64')
}

function unb64(str) {
  return Buffer.from(str, 'base64')
}

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
}

/** 用密码加密文本，返回 { s: salt, i: iv, d: 密文+认证标签 }（均为 base64） */
export function encryptText(text, password) {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = deriveKey(password, salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return { s: b64(salt), i: b64(iv), d: b64(Buffer.concat([enc, tag])) }
}

/** 用密码解密，密码错误时抛出异常 */
export function decryptText(data, password) {
  const salt = unb64(data.s)
  const iv = unb64(data.i)
  const all = unb64(data.d)
  const key = deriveKey(password, salt)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(all.subarray(all.length - 16))
  const dec = Buffer.concat([
    decipher.update(all.subarray(0, all.length - 16)),
    decipher.final()
  ])
  return dec.toString('utf8')
}
