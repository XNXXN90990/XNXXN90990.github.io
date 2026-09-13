# 寜的小站 · 管理端骨架

> Vue 3 + Vite + Element Plus，**目前是骨架**，下一轮接通 Cloudflare Worker API。

## 本地启动

```bash
cd admin
npm install
npm run dev
# 默认 http://localhost:4173
```

默认演示账号：

```
用户名：ning
密码：ning
```

## 下一轮要做的清单

| 序号 | 项目 | 备注 |
| --- | --- | --- |
| 1 | Cloudflare Worker：D1 + R2 + KV | 容器化后端，统一 API 入口 |
| 2 | 真实登录（JWT / Cookie session） | 替换 `src/api/index.js` 中的 mock |
| 3 | 文章 CRUD 接 D1 | 直接生成 md 文件提交 GitHub 触发自动构建 |
| 4 | 上传文件（R2） | 图片 / 视频 / 通用文件 |
| 5 | PV / UV 真实接入 | Worker 暴露 `/stats` 端点 |
| 6 | 部署到 Cloudflare Pages | 独立子域 `admin.xnxxn90990.github.io` 或自有域 |

## API 契约（占位）

```text
POST   /api/auth/login        → { token }
GET    /api/me                → { username, role }
GET    /api/articles          → { rows: Article[], total }
POST   /api/articles          → Article
PATCH  /api/articles/:id      → Article
DELETE /api/articles/:id      → { ok: true }
GET    /api/moments           → { rows: Moment[] }
POST   /api/upload            → { url: 'https://r2.example.com/...' }
GET    /api/dashboard         → { pv, uv, todayPv, todayUv, ... }
GET    /api/categories        → { rows: Category[] }
PATCH  /api/categories/order  → { ok: true }
```

## 部署到 Cloudflare Pages 的注意事项

1. 构建命令：`npm run build`
2. 构建输出目录：`dist`
3. 环境变量：`VITE_API_BASE=https://ning-api.example.workers.dev/api`
4. 入口：单页应用，直接上传 `dist/` 即可，不需要服务端路由
