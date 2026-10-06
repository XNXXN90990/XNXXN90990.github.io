---
title: Git 入门：从第一次提交到团队协作
date: 2026-09-28
category: 教程
tags: [Git, 版本控制, 教程]
cover: /covers/git.svg
description: 从安装配置到分支协作，一篇讲清 Git 日常最常用的操作，适合刚开始写代码的同学。
pinned: true
---

> 这是一篇**示例文章**，用来展示博客的文章排版效果，你可以随时在 `content/posts/` 里删掉它，换成自己的文章。

## 为什么要用 Git

写代码改着改着就乱了，想回到昨天那个能跑的版本却回不去——Git 就是解决这个问题的：它给你的项目保留了每一次「存档点」，还能方便地和别人协作。

## 安装与初始配置

到 [git-scm.com](https://git-scm.com) 下载安装后，先告诉 Git 你是谁（提交记录会带上这个名字）：

```bash
git config --global user.name "你的名字"
git config --global user.email "you@example.com"
```

## 日常最常用的六个命令

```bash
git init                # 把当前文件夹变成 Git 仓库
git add .               # 把改动放进「暂存区」
git commit -m "说明"    # 存档，附上一句说明
git status              # 看看现在什么状态
git log --oneline       # 查看历史存档点
git diff                # 看看具体改了什么
```

建议的节奏：**完成一个小功能就 commit 一次**，说明写清楚做了什么。这样哪个版本出问题都能快速回退。

## 分支：并行开发的法宝

```bash
git branch login        # 新建 login 分支
git switch login        # 切换过去（老写法：git checkout login）
git switch -c feature-x # 新建并切换，一步到位
git merge login         # 在 main 上合并 login 的成果
git branch -d login     # 合并完删掉分支
```

常见的团队约定：`main` 分支永远保持可用，开发都在 `feature/*` 分支上进行，完成后合并回去。

## 远程仓库：推送到 GitHub

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main      # 第一次推送
git push                     # 以后每次推送
git pull                     # 拉取别人的更新
```

## 遇到问题怎么办

| 场景 | 命令 |
| --- | --- |
| 撤销工作区改动 | `git restore 文件名` |
| 撤销上一次 commit（保留改动） | `git reset --soft HEAD~1` |
| 想看某个版本的样子 | `git checkout 提交id`（看完 `git switch -` 回来） |
| 提交了不该提交的文件 | 先加进 `.gitignore`，再 `git rm --cached 文件名` |

## 小结

Git 的命令虽多，日常真正高频的就那几条：`add` / `commit` / `push` / `pull` / `switch` / `merge`。先把这些练熟，剩下的用到再查，完全来得及。
