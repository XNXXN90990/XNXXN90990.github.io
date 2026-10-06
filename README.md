# 寜的小站 · Ning's Blog

> 宁静致远 · 记录学习、生活与思考

基于 [AyeezBlog](https://github.com/Ayeez757/AyeezBlog) 开源项目修改的纯静态个人博客（Vue 3 + Vite），部署在 GitHub Pages：<https://xnxxn90990.github.io>

## 特性

- 🖥️ **纯静态、零成本**：无后端、无数据库，GitHub Pages 直接托管
- 📝 **Markdown 写作**：一个 `.md` 文件就是一篇文章
- 📚 **指南收藏**：站内完整收录三本开源手册（CS 自学指南 / 上交生存手册 / IC 自学指南），带目录树、出处标注与上一篇/下一篇
- 💬 **说说 / 杂想 / 相册**：编辑 `content/` 下 JSON 或 Markdown 即可
- 🔐 **私人空间**：两级访问码门禁，文章内容 AES-GCM 加密后才会发布
- 🌗 **深色 / 浅色模式 + 六色主题色**：一键切换，跟随系统，自动记忆
- ⚡ **轻量**：代码高亮按需加载，文章与指南正文全部懒加载

## 如何写文章

### 公开文章

1. 在 `content/posts/` 里新建一个 `我的文章.md`（文件名就是文章链接，建议用英文或拼音）
2. 文件开头写好信息（front-matter）：

   ```markdown
   ---
   title: 文章标题
   date: 2026-10-06
   category: 教程
   tags: [标签1, 标签2]
   cover: /covers/git.svg
   description: 一两句话的摘要，显示在卡片上
   pinned: true        # 可选：置顶
   featured: true      # 可选：推荐
   ---

   正文从这里开始，支持 Markdown、代码高亮、表格、公式（$$...$$）。
   ```

3. `git push` 推送后自动发布

> 封面图：把图片放进 `public/covers/`，然后 cover 写 `/covers/图片名.jpg`。不写 cover 会用默认封面。

### 私人空间文章

1. 在 `content/private/` 里新建 `我的秘密文章.md`：

   ```markdown
   ---
   title: 文章标题
   date: 2026-10-06
   访问码: 我自己定的访问码      # ← 每篇文章一个访问码，就写在这里
   description: 摘要
   ---

   只有输入访问码才能看到的正文。
   ```

2. 空间的**总门码**在 `content/private/空间配置.json` 里改：

   ```json
   { "spaceCode": "空间门码" }
   ```

3. 本地跑一次 `npm run build`（或 `npm run dev`）——脚本会自动把文章加密成密文写入 `src/content/private-encrypted.json`，把这个生成的文件一起提交即可。
4. ⚠️ `content/private/` 整个文件夹已在 `.gitignore` 里，**永远不会**被上传；明文访问码只存在你自己电脑上。

> 换访问码：改 md 或 空间配置.json 里的码 → 重新 `npm run build` → 提交更新的 `private-encrypted.json`。

## 导入指南（可选）

三本开源手册已导入并提交（`content/guide/` + `public/guide-assets/` + `src/content/guides.json`）。若要更新或重新导入：

```bash
# 把三个指南项目放到 ../素材/ 下（北大CS自学指南、上海交通大学生存手册、IC自学指南）
npm run import-guides
```

导入脚本会按各项目的导航（mkdocs.yml / SUMMARY.md）收录章节、重写站内链接、拷贝图片到 `public/guide-assets/<指南id>/`。素材原始文件夹不入仓库，但 `content/guide/` 产物需要提交。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 构建到 dist/
npm run preview  # 本地预览构建结果
```

## 部署（GitHub Pages）

- 推送到 `main` 分支后，GitHub Actions 会自动构建并发布
- 仓库 Settings → Pages → Source 选择 **GitHub Actions**（首次部署前需要设置一次）

## 自定义

| 想改什么 | 去哪里改 |
| --- | --- |
| 站点名 / 导航 | `src/components/header.vue` |
| 首页大标题、打字机语句、公告条 | `src/views/Home.vue`（顶部常量与模板） |
| 打字机三句话 | `src/views/Home.vue` 里的 `TYPE_PHRASES` |
| 头像 / 头像背面 / 微信名片 | 替换 `src/assets/imgs/` 下同名文件 |
| 背景图 | `src/assets/css/style.css` 顶部注释说明 |
| 深浅色配色 | `src/assets/css/theme-vars.css` |
| 朋友（友链） | `content/links.json` |
| 说说 | `content/talks.json` |
| 杂想 | `content/thoughts/` 下加 `.md`（front-matter 同文章） |
| 相册 | 照片放 `public/albums/<相册id>/`，编辑 `content/albums.json` |
| 主题色 | header 调色板按钮（六色可选），定义在 `src/assets/css/theme-vars.css` |
| 关于页 | `content/about.md` |
| 页脚 | `src/components/Footer.vue` |

## 致谢

- 原项目：[AyeezBlog](https://github.com/Ayeez757/AyeezBlog)（MIT License），感谢原作者的开源分享
