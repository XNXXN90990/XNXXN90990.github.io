---
title: Vite + Vue3 项目起步清单
date: 2026-08-30
category: 教程
tags: [Vue, Vite, 前端, 教程]
cover: /covers/vue.svg
description: 新建一个 Vue3 项目时的标准动作清单：脚手架、目录规划、路由与代码规范一步到位。
---

> 这是一篇**示例文章**（教程类），展示代码块与列表排版，欢迎替换。

## 一分钟创建项目

```bash
npm create vite@latest my-app -- --template vue
cd my-app
npm install
npm run dev
```

浏览器打开 <http://localhost:5173>，项目就跑起来了。

## 推荐的目录结构

```text
my-app/
├── public/            # 原样拷贝的静态资源
├── src/
│   ├── api/           # 接口封装
│   ├── assets/        # 图片、字体、全局样式
│   ├── components/    # 通用组件
│   ├── router/        # 路由
│   ├── utils/         # 工具函数
│   ├── views/         # 页面级组件
│   ├── App.vue
│   └── main.js
└── vite.config.js
```

## 路由与别名

```js
// vite.config.js
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

配好 `@` 别名后，所有 import 都从 src 出发，再也不用 `../../..` 数点点。

## 三个值得第一时间养成的习惯

1. **组件文件用多词命名**（如 `UserCard.vue`），避免和原生标签冲突
2. **接口统一封装**到 `src/api/`，别在组件里到处写 fetch
3. **常量与配置集中管理**，改一处全局生效

## 构建与部署

```bash
npm run build    # 产物在 dist/
npm run preview  # 本地预览构建结果
```

`dist/` 是纯静态文件，扔到任何静态托管上都能跑——GitHub Pages、Vercel、Netlify 都可以，本站的部署方案就是 GitHub Pages。

## 小结

起步阶段不必追求完美配置，先跑通「开发 → 构建 → 部署」的完整闭环，再逐步往里加东西。
