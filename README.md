# 寜的小站 · Ning's Blog

> 极简、自适应、好维护的个人小站。VitePress + GitHub Pages 主体 + Vue3 AdminPanel 骨架。

## 一、本地运行

```bash
npm install                  # 一次即可
npm run dev                  # http://localhost:5173
npm run build                # 把站点编译到 docs/.vitepress/dist/

# 管理端（独立启动；目前是 mock 数据）
npm run admin:dev            # http://localhost:4173，演示账号 ning / ning
```

## 二、怎么写（最常用的两个动作）

### 1. 一键新建

```bash
npm run new moment         "今天天气好"           # 发布版说说
npm run new tutorial       "如何写教程"           # 发布版教程
npm run new essay          "偶尔的思考"           # 随笔
npm run new learning-path  "智能车路线"           # 学习路线
npm run new me             "私人备忘"             # 私人文章（加密）
npm run new tutorial       "在写的教程" --draft   # ← 草稿！
```

跑完会输出文件路径，VS Code 打开直接写。

### 2. 草稿怎么管

| 动作 | 怎么做 |
| --- | --- |
| 写一篇草稿 | 创建时加 `--draft`，会在 frontmatter 加 `draft: true` |
| 草稿在哪里 | 文件就在 `docs/<分类>/<slug>.md` 本地，**只是 sidebar 不会列出来** |
| 草稿能否发布 | 任何时候把 `draft: true` 这一行删掉就行 |
| URL 仍能访问 | 是，本地 `npm run dev` 后直接打开 URL 看到 |
| 搜索引擎 | 草稿上线后 head 自动加 `<meta name="robots" content="noindex">`，不会被收录 |

> 草稿完全由 git 管理—— 你写的每一份草稿都在仓库里，不会丢，换电脑 `git clone` 就回来。

### 3. 自己写一篇公开文章（手动流程）

如果你不想用 CLI：

1. 在 `docs/<分类>/<slug>.md` 里新建文件
2. 文件头写：
   ```yaml
   ---
   title: 你的标题
   date: 2026-09-13
   ---
   ```
3. 写正文
4. 提交并推送：`git add . && git commit -m "..." && git push`

> sidebar 会自动扫描目录，不需要再改任何配置。

### 4. 写一篇私人文章

1. `npm run new me "标题"` 创建文件，或在 `docs/me/posts/` 手动新建
2. 编辑正文
3. 提交并推送前 `npm run src:lock` —— 把源码加密（构建产物是密文，源码在仓库里仍是明文，方便你本地编辑）
4. 推送，部署
5. 线上 `/me/<文章编号或主访问码>` 可解锁

> 解锁机制：单篇访问码 vs 主访问码（一次解锁全部）。密钥在 `docs/.vitepress/private-secrets.json`，已 gitignore。

### 5. 文章里插图片 / 视频 / 文件

把文件放到 `docs/public/uploads/...`，然后在 markdown 里：

```markdown
![图](/uploads/2026-09-13/img.png)
<video src="/uploads/2026-09-13/clip.mp4" controls></video>
```

`public/` 下的文件会原样拷贝到部署根目录。

## 三、日常提交流程

```bash
git status                                # 看看改了啥
git diff                                   # 看看具体内容
git add .                                  # 暂存所有改动
git commit -m "写一条新教程"                # 写说明
git push                                   # 自动触发 Actions → 自动部署
```

部署完成后 → `https://XNXXN90990.github.io`

## 四、部署（首发）

> 推送到 `main` 会自动跑 `.github/workflows/deploy.yml` → GitHub Pages。

### 第一次部署的前两步

#### ① 在 GitHub 创建仓库

仓库名：`XNXXN90990.github.io`（这样路径最干净，最终 URL 是 `https://XNXXN90990.github.io`）

如果你用了别的名字，下面 `base` 要相应改。

#### ② 给仓库开启 Pages

`Settings → Pages → Build and deployment → Source = GitHub Actions`

#### ③ 把代码推上去

```bash
cd <这个工程目录>
git init                    # 如果还没有 .git
git add .
git commit -m "初始化寜的小站"
git branch -M main
git remote add origin https://github.com/XNXXN90990/XNXXN90990.github.io.git
git push -u origin main
```

#### ④ 加私密密钥 secret（强烈推荐，不加也行）

让 Actions 在云端也能用主访问码构建私人文章。

1. 本机打开 `docs/.vitepress/private-secrets.json`，把整个 JSON 复制
2. GitHub：`Settings → Secrets and variables → Actions → New repository secret`
3. 名字必须叫 `PRIVATE_SECRETS`，内容粘贴整段 JSON
4. 保存。等下次 push，Actions 会识别。

> 不加 `PRIVATE_SECRETS`：私人文章仍会构建，但产物里的列表是「未解锁」状态——只有你本地预览能看到。

### 改动 → 部署

之后只要 `git push`，Actions 会自动 build + deploy。改动一两分钟就上线了。

### 想用自定义域名

把 `docs/public/CNAME` 改成你的域名（新建这个文件，只有一行）。然后去你的 DNS 服务商把 CNAME 指向 `XNXXN90990.github.io`。

### 仓库名不是 `XNXXN90990.github.io`？

需要把 `docs/.vitepress/config.mts` 里 `base: '/'` 改成 `base: '/仓库名/'`，把 `editLink.pattern` 同步改成带仓库名的路径，再 `npm run build` 验证。

## 五、目录速查

```
docs/                          # 站点全部内容，加文章只动这里
├── index.md                   # 首页
├── tutorials/  moments/  learning-path/  essays/  links/  about/
├── me/posts/                  # 私人文章（目录里 .md 都是源码，构建加密）
└── .vitepress/
    ├── config.mts             # 站点配置（导航、侧边栏、主题）
    ├── private-plugin.ts      # 私人文章构建期加密插件
    ├── private-secrets.json   # 私密密钥（gitignored）
    └── theme/                 # 自定义主题
scripts/                       # CLI 工具：新建内容 / 加解密 / 锁文件
admin/                         # 管理端骨架（下一轮接后端）
.github/workflows/deploy.yml   # 自动部署
```

## 六、F12 防调试

`DisableDevtool` 已经集成，普通访客按 F12 会被打断。三种白名单：

- **临时**：URL 后加 `?devtools=1`
- **本机**：F12 打开控制台 → `localStorage.setItem('ning-devtools','true')` → 刷新
- **快捷键**：按 `Ctrl+Shift+D` 切换白名单

## 七、下一轮要做

`admin/README.md` 写得最清楚。简单列：

- 后端接 Cloudflare Worker + D1 + R2
- 登录 / 文章 CRUD / 文件上传 / PV-UV 真实接入
- AdminPanel 部署到 Cloudflare Pages
