# 我的个人小站

基于 [VitePress](https://vitepress.dev/) 的个人网站，托管于 GitHub Pages。

## 功能一览

- 日间 / 夜间模式（跟随系统 + 手动切换）
- 中文全文搜索（本地索引，免费）
- 分类导航：学习路线 / 技术教程 / 随笔杂谈 / 工具与资源
- 每篇文章显示发布时间，底部显示最后更新时间
- 首页访问量 / 访客数、文章阅读量（不蒜子统计，上线后生效）
- 评论区（giscus，读者无需登录即可看评论）——需一次性配置
- 点赞按钮（Cloudflare Workers 全站共享计数）——需一次性配置
- 私密文章：正文构建期 AES 加密，不出现在任何列表，凭编号/标题搜索 + 访问码阅读；站长凭主访问码查看全部
- 回到顶部按钮、GitHub Actions 推送即自动部署

## 本地运行

前提：已安装 [Node.js](https://nodejs.org/) 18+。

```bash
npm install    # 首次运行，安装依赖
npm run dev    # 启动本地预览，默认 http://localhost:5173
```

改动保存后页面自动刷新。`npm run build` 构建产物到 `docs/.vitepress/dist`，`npm run preview` 预览构建结果。

## 目录结构

```
个人页/
├── docs/                          # 站点全部内容
│   ├── index.md                   # 首页
│   ├── about.md                   # 关于本站
│   ├── learning-path/             # 学习路线
│   ├── tutorials/                 # 技术教程
│   ├── essays/                    # 随笔杂谈
│   ├── resources/                 # 工具与资源
│   ├── private/                   # 私密区
│   │   ├── index.md               # 私密区入口页（公开，仅解锁界面）
│   │   └── posts/                 # 私密文章（明文本地保存，推送前加密）
│   ├── public/                    # 图标等静态资源
│   └── .vitepress/
│       ├── config.mts             # 站点配置
│       ├── private-plugin.ts      # 私密文章构建期加密插件
│       ├── private-secrets.json   # 私密密钥（已 gitignore，切勿提交）
│       └── theme/                 # 自定义主题组件
├── scripts/                       # 私密文章管理脚本
├── cloudflare/like-worker.js      # 点赞计数 Worker 源码
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
└── package.json
```

## 写一篇公开文章

完整流程见 `docs/tutorials/how-to-write.md`。简要三步：

1. 在对应分类目录下新建 `.md` 文件，文件头写上 `title` 和 `date`。
2. 在 `docs/.vitepress/config.mts` 的 `sidebar` 中登记该文章。
3. `git push` 后自动部署上线。

## 写一篇私密文章

完整流程见 `docs/tutorials/how-to-hide.md`。简要四步：

```bash
npm run src:new "文章标题"   # 新建私密文章并生成访问编号
npm run dev                  # 本地写作预览（本地能看到全部私密文章）
npm run src:lock             # 推送前加密源文件（重要！）
git add . && git commit -m "新增私密文章" && git push
```

私密机制说明：

- 私密文章不出现在导航、侧边栏、首页、分类列表里；
- 正文在构建时加密（AES-256-GCM，文章访问码 + 主访问码双重密钥），网页与 JS 里没有明文；
- 别人在搜索框输入文章的**编号**或**标题**可以找到文章，输入访问码解锁阅读；
- 你在本地预览时能看到全部私密文章；在线上通过 [/private/](docs/private/index.md) 页输入主访问码管理全部私密内容；
- 密钥在 `docs/.vitepress/private-secrets.json`（本地，已 gitignore）。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，命名为 `XNXXN90990.github.io`（这样访问地址最干净）。
2. 在本目录执行：

   ```bash
   git init
   git add .
   git commit -m "初始化站点"
   git remote add origin https://github.com/XNXXN90990/XNXXN90990.github.io.git
   git push -u origin main
   ```

3. 打开仓库 Settings → Pages，把 Source 设为 **GitHub Actions**。
4. 打开仓库 Settings → Secrets and variables → Actions → New repository secret，新建名为 `PRIVATE_SECRETS` 的 secret，内容就是本地 `docs/.vitepress/private-secrets.json` 文件的完整 JSON 文本（私密文章云端构建需要）。
5. 等待 Actions 运行完成，访问 `https://xnxxn90990.github.io` 即可。

> 如果仓库名不是 `XNXXN90990.github.io`，还需要把 `docs/.vitepress/config.mts` 里的 `base` 改成 `'/仓库名/'`，并同步修改 `editLink.pattern`。

## 上线后的配置清单

| 事项 | 位置 | 说明 |
| --- | --- | --- |
| 站点名字 | `config.mts` 的 `title`、`theme/SiteFooter.vue`、`docs/index.md` | 目前占位为「我的个人小站」 |
| 评论区 | `config.mts` 的 `themeConfig.giscus` | 按《如何开启评论区》获取 repoId / categoryId |
| 点赞 | `config.mts` 的 `themeConfig.likeApi` | 按《如何开启点赞功能》部署 Worker |
| 私密内容 | GitHub 仓库 secret `PRIVATE_SECRETS` | 内容同本地 private-secrets.json |

## 说明与限制

- 访问量 / 访客数 / 文章阅读量由[不蒜子](https://busuanzi.ibruce.info/)统计，**部署上线后才开始计数**，本地预览显示 `…` 是正常现象。
- 「最后更新时间」依赖 Git 提交历史，首次推送后生效。
- 私密文章是「不展示 + 访问码」级别的保护，不是服务器级权限控制；真正机密的内容请勿放在任何网站上。
- 更换主访问码：修改 `private-secrets.json` 的 `masterCode`（并同步更新 GitHub secret）后重新部署；已用旧码解锁过的浏览器需重新输入。
