/**
 * 文章点赞计数 Worker（Cloudflare Workers 免费版即可）
 *
 * 部署步骤（详见站点教程《如何开启点赞功能》）：
 * 1. Cloudflare 控制台 → Workers & Pages → Create Worker，部署一个默认 Worker；
 * 2. Edit code，把本文件内容整体粘贴进去，Save and Deploy；
 * 3. Settings → Bindings → Add → KV Namespace，
 *    Variable name 填 LIKES，选择已创建的 KV 命名空间；
 * 4. 把得到的 workers.dev 地址填入 docs/.vitepress/config.mts 的 likeApi。
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8'
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id') || ''
    if (!/^[\w\-/.]{1,200}$/.test(id)) {
      return new Response(JSON.stringify({ error: 'invalid id' }), {
        status: 400,
        headers: cors
      })
    }
    const key = 'likes:' + id

    if (request.method === 'GET') {
      const value = await env.LIKES.get(key)
      return new Response(JSON.stringify({ id, likes: Number(value || 0) }), {
        headers: cors
      })
    }

    if (request.method === 'POST') {
      const current = Number(await env.LIKES.get(key)) || 0
      const next = current + 1
      await env.LIKES.put(key, String(next))
      return new Response(JSON.stringify({ id, likes: next }), { headers: cors })
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: cors
    })
  }
}
