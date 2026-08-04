---
title: "如何开启评论区"
date: "2026-08-04"
---

# 如何开启评论区

本站评论区使用 [giscus](https://giscus.app/zh-CN)，评论存放在 GitHub 仓库的 Discussions（讨论区）里。读者**不需要登录**就能阅读文章和所有评论，只有想发言时才需要 GitHub 账号。评论会自动跟随站点的日间/夜间模式切换。

## 开启步骤

1. **先把站点推送到 GitHub**：评论区依赖仓库 `XNXXN90990/XNXXN90990.github.io`（见 [README](/) 的部署说明）。

2. **开启 Discussions**：打开仓库页面 → Settings → 向下找到 Features 区域 → 勾选 **Discussions**。

3. **安装 giscus 应用**：访问 <https://github.com/apps/giscus>，点 Install，Repository access 选 **Only select repositories**，选中上面的仓库。

4. **获取两个 ID**：访问 <https://giscus.app/zh-CN>，在「repository」一栏填入 `XNXXN90990/XNXXN90990.github.io`，选择讨论分类（可以直接用 General，也可以在仓库 Discussions 里新建一个叫 Comments 的分类再选它）。页面下方会生成一段配置代码，从中找到这两个值：
   - `data-repo-id="R_kgDO..."` → 这就是 **repoId**
   - `data-category-id="DIC_kwDO..."` → 这就是 **categoryId**

5. **填入站点配置**：打开 `docs/.vitepress/config.mts`，找到 `themeConfig.giscus`，替换两个占位符：

   ```ts
   giscus: {
     repo: 'XNXXN90990/XNXXN90990.github.io',
     repoId: 'R_kgDO...',          // 替换这里
     category: 'General',          // 和第 4 步选择的分类一致
     categoryId: 'DIC_kwDO...'     // 替换这里
   }
   ```

6. 提交并推送，等 Actions 部署完成，每篇文章底部就会出现评论区。

## 常见问题

- **评论区没出现**：检查两个 ID 是否复制完整（都以 `DO` 开头的长串）；确认仓库是公开的、Discussions 已勾选、giscus 应用已安装。
- **想换评论分类**：修改 `category` 和 `categoryId` 后重新部署即可，旧评论仍在原分类的讨论里。
- **评论管理**：所有评论都是仓库 Discussions 里的帖子，你可以在 GitHub 上直接删除或编辑。
