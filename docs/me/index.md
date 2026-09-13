---
title: 我的
---

# 🔒 我的

这里是一个**只给自己看的入口**。站点本身会把里面的内容加密推到线上：

- 本地预览：站长可正常查看与写作
- 部署上线：正文是 AES-256-GCM 加密的密文，需输入访问码才能解锁

<div class="me-shell">
  <ClientOnly>
    <PrivateIndex />
  </ClientOnly>
</div>

## 解锁方式

1. **本地预览**（`npm run dev`）——站长直接可见正文。
2. **线上解锁**——浏览 `/me/<文章编号>` 输入文章对应的访问码解锁单篇；输入**主访问码**可解锁站点上所有私人文章。

<style>
.me-shell { margin: 18px 0 0; }
</style>
