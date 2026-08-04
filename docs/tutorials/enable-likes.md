---
title: "如何开启点赞功能"
date: "2026-08-04"
---

# 如何开启点赞功能

点赞计数需要一个小小的免费后端，我们用 Cloudflare Workers：免费额度对个人站绰绰有余（每天 10 万次请求），无需信用卡，全程在浏览器里操作，大约 10 分钟。

## 第一步：注册 Cloudflare

访问 <https://dash.cloudflare.com/sign-up>，用邮箱注册一个免费账号。

## 第二步：创建 KV 存储

进入控制台后，点左侧 **Workers & Pages** → 上方选 **KV** → **Create a namespace**，名字填 `likes`，创建。

## 第三步：创建并部署 Worker

1. 左侧 **Workers & Pages** → **Create application** → **Create Worker**，随便起个名字（例如 `like-api`），点 **Deploy**；
2. 部署成功后点 **Edit code**，把编辑器里的默认代码全部删掉，换成仓库根目录 `cloudflare/like-worker.js` 的内容（站点教程区也贴了一份，见下方）；
3. 点右上角 **Save and deploy**。

<details>
<summary>Worker 代码（点击展开）</summary>

```js
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
```

</details>

## 第四步：绑定 KV

回到该 Worker 页面 → **Settings** → **Bindings** → **Add** → 选 **KV Namespace**：

- Variable name 填 `LIKES`（必须大写，和代码里一致）
- KV namespace 选第二步创建的 `likes`

保存。

## 第五步：接入站点

Worker 页面顶部会显示它的地址，形如 `https://like-api.你的子域.workers.dev`。打开 `docs/.vitepress/config.mts`，把 `themeConfig.likeApi` 设置为这个地址：

```ts
likeApi: 'https://like-api.xxxx.workers.dev'
```

提交推送后，每篇文章（包括私密文章解锁后）底部就会出现点赞按钮。每位访客在同一浏览器里对同一篇文章只能点一次赞；点赞总数全站共享。

## 常见问题

- **按钮没出现**：确认 `likeApi` 地址以 `https://` 开头且没有多余的 `/`；浏览器直接访问 `地址?id=test` 应该返回一段 JSON。
- **计数不准/丢失**：KV 是全球分布式存储，极端并发下可能有秒级延迟，个人站可以忽略。
