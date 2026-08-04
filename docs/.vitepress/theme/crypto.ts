// 浏览器端解密（Web Crypto），参数与 scripts/lib-crypto.mjs 完全一致：
// PBKDF2-SHA256(150000) 派生密钥 + AES-256-GCM（密文末尾 16 字节为认证标签）
const ITERATIONS = 150000

export interface EncBlob {
  s: string
  i: string
  d: string
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
}

/** 密码错误时抛出异常 */
export async function decryptText(data: EncBlob, password: string): Promise<string> {
  const key = await deriveKey(password, b64ToBytes(data.s))
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(data.i) },
    key,
    b64ToBytes(data.d)
  )
  return new TextDecoder().decode(buf)
}
