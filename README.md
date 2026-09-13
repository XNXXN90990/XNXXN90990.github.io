# 寜的小站 · Ning's Blog

极简风、全宽自适应的个人博客。前台托管在 **GitHub Pages**（完全免费），数据存在 **Supabase** 云数据库（免费额度足够个人使用）。

> 风格参考：[Wcowin 的博客](https://wcowin.work/) · 管理端参考：[阿叶的博客](https://blog.ayeez.cn)

## 功能一览

- 🏠 首页（个人卡片 + 置顶/最新文章 + 最近杂谈）
- 📚 内容板块：教程 / 学习路线 / 随笔 —— 目录可在后台自由增删调整
- 💬 杂谈说说：朋友圈式时间线，支持图片、视频、音频、任意文件上传
- ✍️ 后台管理 `/admin/`：邮箱登录、数据看板（PV/UV/阅读/14天趋势）、Markdown 写作（实时预览 + 草稿箱 + 每 3 秒本地自动保存）、分类目录树管理、友链、文件管理、站点设置
- 🔐 私人空间：私密文章需要访问码，只在你的设备解锁后可见
- 📊 页脚统计：运行时长 / 访问量 / 访客数
- 🛡️ 反调试：F12、控制台等操作会被打断
- 🌙 深色模式、移动端适配

## 首次部署（三步）

### 第 1 步：初始化 Supabase（约 5 分钟）

1. 注册并登录 [supabase.com](https://supabase.com)（免费）
2. 新建一个项目（随意命名，如 `ning-blog`，选离你近的区域）
3. 进入 **SQL Editor** → New query → 把 [`sql/setup.sql`](sql/setup.sql) 的全部内容粘贴进去 → **Run**
4. 进入 **Authentication → Users → Add user**：创建一个管理员账号（邮箱 + 密码，勾选 Auto Confirm）
5. 进入 **Project Settings → API**，记下两项：
   - `Project URL`（形如 `https://abcd1234.supabase.co`）
   - `anon public` key（一长串）

### 第 2 步：填写配置

打开本仓库的 `config.js`，填入上面两项：

```js
window.NING_CONFIG = {
  SUPABASE_URL: 'https://abcd1234.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
};
```

> anon key 本身就是公开密钥，配合了行级安全（RLS），提交到仓库是安全的。

### 第 3 步：推送到 GitHub Pages

1. 在 GitHub 创建名为 **`XNXXN90990.github.io`** 的仓库（必须是这个名字）
2. 把本目录所有文件推上去：

```bash
git init
git add .
git commit -m "寜的小站上线"
git remote add origin https://github.com/XNXXN90990/XNXXN90990.github.io.git
git push -u origin main
```

3. 稍等一两分钟，访问 **https://XNXXN90990.github.io** 即可看到站点
4. 管理端入口：**https://XNXXN90990.github.io/admin/**

## 日常使用

| 想做的事 | 怎么做 |
|---|---|
| 写文章 | 管理端 → 文章管理 → 发布新文章（选分类、可置顶/私密/存草稿） |
| 发说说 | 管理端 → 杂谈说说 → 输入内容、传图片视频 → 发布 |
| 存草稿 | 编辑器右下「存为草稿」；写作过程每 3 秒自动保存到本地，意外关闭也能恢复 |
| 改目录/加分类 | 管理端 → 目录结构（支持子分类、排序，前台导航自动更新） |
| 私密文章 | 发布时勾选「私密」→ 只有在私人空间输入过访问码的设备能看 |
| 改私人访问码 | 管理端 → 站点设置 → 私人空间访问码（默认 `DBDprivate`，**请尽快修改**） |
| 改登录密码 | 管理端 → 站点设置 → 修改登录密码 |
| 改样式/布局 | 直接编辑仓库里的 `css/main.css`（全宽变量 `--pad-x`、主色 `--accent` 等都在开头） |

## 本地预览

任意静态服务器即可，例如：

```bash
npx serve .
# 或 python -m http.server
```

注意：`crypto.subtle`（管理端改密码/访问码用）需要 `http://localhost` 或 HTTPS 环境。

## 目录结构

```
├── index.html            # 首页
├── category.html         # 分类列表（含目录树侧栏）
├── post.html             # 文章详情
├── talks.html            # 杂谈说说
├── links.html            # 友链
├── about.html            # 关于我
├── private.html          # 私人空间（访问码解锁）
├── admin/                # 管理端
├── config.js             # ★ Supabase 配置（部署前必填）
├── sql/setup.sql         # ★ Supabase 初始化脚本
├── css/main.css          # 全部样式（含暗色模式）
├── js/common.js          # 前台公共逻辑（导航/页脚/统计/反调试）
├── js/supa.js            # Supabase REST/Auth/Storage 封装
└── vendor/               # marked.min.js、disable-devtool.min.js
```

## 安全说明

- 匿名访问受 RLS 保护：只能读「已发布且非私密」的文章和公开设置项
- 私密文章通过服务端函数校验访问码哈希后返回，数据库中不存明文码
- 上传文件仅登录后可写，公开只读
- 反调试库会打断 F12 / 控制台 / debugger 等操作（自己要调试时可在浏览器禁用 JS 或用无痕窗口 + 禁用该脚本）
