/**
 * crypto.ts：AES-GCM 加解密（与 scripts/lib-crypto.mjs 字段完全对齐）
 *
 * 字段约定（与 lib-crypto.mjs 一致）：
 *   s = salt    (base64, 16 字节)
 *   i = iv      (base64, 12 字节)
 *   d = data    (base64 = ciphertext || authTag，最后 16 字节是 tag)
 *
 * 派生：PBKDF2-SHA256，150,000 次，32 字节（256 位）密钥。
 */
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export interface EncBlob {
  s: string
  i: string
  d: string
  v?: number
}

/** 同步入口，调用方 await —— 让 try/catch 能捕获异步 reject */
export async function decryptTextAsync(input: any, pass: string): Promise<string> {
  const blob: EncBlob = typeof input === 'string' ? JSON.parse(input) : input
  const salt = b64ToBytes(blob.s)
  const iv = b64ToBytes(blob.i)
  const all = b64ToBytes(blob.d)
  if (all.length < 16) throw new Error('密文过短')

  // Web Crypto 的 GCM 模式接受 ciphertext+tag 一起解密
  const ciphertextWithTag = all
  const enc = new TextEncoder().encode(pass)

  const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertextWithTag)
  return new TextDecoder().decode(pt)
}

/**
 * 兼容同步调用 —— 让组件里 `const plain = decryptText(...)` 这种写法照常可用
 * 注意：返回的是一个 Promise（解密是异步的）
 */
export function decryptText(input: any, pass: string): Promise<string> {
  return decryptTextAsync(input, pass)
}
