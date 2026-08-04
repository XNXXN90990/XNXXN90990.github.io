---
title: 如何在这个站点写一篇文章
date: "2026-08-04"
---

# 如何在这个站点写一篇文章

这是本站点的「使用说明书」。以后你想发新文章，照着下面几步来就行。

## 前提

电脑上已安装 [Node.js](https://nodejs.org/)（18 及以上版本），并且本站点的依赖已经装好（在项目根目录运行过一次 `npm install`）。

## 第一步：新建文章文件

所有文章都是普通的 Markdown 文件（`.md`），按分类放在 `docs/` 下对应的目录里：

| 分类 | 目录 |
| --- | --- |
| 学习路线 | `docs/learning-path/` |
| 技术教程 | `docs/tutorials/` |
| 随笔杂谈 | `docs/essays/` |
| 工具与资源 | `docs/resources/` |

比如要在「随笔杂谈」里发一篇新文章，就新建 `docs/essays/my-new-post.md`。文件名用英文小写加短横线，方便做网址。

## 第二步：写文件头和正文

每个文章文件的开头都要有一段「文件头」（frontmatter），用两行 `---` 包起来，写上标题和发布日期：

```md
---
title: 我的新文章
date: "2026-08-04"
---

# 我的新文章

正文从这里开始，用 Markdown 语法书写……
```

日期请按 `YYYY-MM-DD` 的格式填写。文章页会自动显示「发布于 X 年 X 月 X 日」，就是读取的这个字段。

## 第三步：把文章挂到侧边栏

打开 `docs/.vitepress/config.mts`，找到 `sidebar` 里对应分类的那一段，在 `items` 数组里加一行：

```ts
{ text: '我的新文章', link: '/essays/my-new-post' }
```

注意 `link` 是文件路径去掉 `.md` 后缀，以 `/` 开头。

如果希望文章也出现在分类首页的「全部文章」列表里，再去对应分类的 `index.md` 里加一行链接即可。

## 第四步：本地预览

在项目根目录运行：

```bash
npm run dev
```

浏览器打开终端提示的地址（一般是 `http://localhost:5173`），就能实时看到效果。改完文件保存后页面会自动刷新。

## 第五步：发布上线

确认没问题后，把改动提交并推送到 GitHub：

```bash
git add .
git commit -m "新增文章：我的新文章"
git push
```

推送后 GitHub Actions 会自动重新构建并部署，一两分钟后线上就能看到新文章了。

## 延伸阅读

- [如何发布一篇私密文章](/tutorials/how-to-hide) —— 想发只有特定人能看到的内容时看这篇
- [如何开启评论区](/tutorials/enable-comments) —— 一次性配置，之后每篇文章自动带评论区
- [如何开启点赞功能](/tutorials/enable-likes) —— 一次性配置，之后每篇文章自动带点赞按钮
