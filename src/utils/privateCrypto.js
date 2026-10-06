/**
 * privateCrypto.js —— 私人空间前端解密工具
 *
 * 与 scripts/gen-content.mjs 的加密方案互为镜像：
 * PBKDF2(SHA-256, 150000 次) 从访问码派生密钥 → AES-GCM-256 解密。
 * 访问码错误时 AES-GCM 校验失败会抛错，UI 据此提示「访问码错误」。
 * 仓库里只有密文，明文访问码永远不出现在代码或构建产物中。
 */

function b642ab(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(code, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, [
    'deriveKey'
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** 解密 {salt, iv, ct} 结构，返回解析后的 JSON 对象；密码错误抛异常 */
export async function decryptJson(blob, code) {
  const key = await deriveKey(code, b642ab(blob.salt));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b642ab(blob.iv) },
      key,
      b642ab(blob.ct)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (e) {
    throw new Error('访问码错误');
  }
}
