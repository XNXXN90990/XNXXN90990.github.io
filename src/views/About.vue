<template>
  <div class="about-page">
    <div class="about-inner">
      <!-- 顶部：头像 + 标题 -->
      <section class="hero">
        <div class="hero-top">
          <img :src="avatarUrl" alt="寜的头像" class="hero-avatar" />
          <div class="hero-titles">
            <h1 class="hero-title-gradient">关于我</h1>
            <p class="hero-subtitle">寜 · Ning —— 宁静致远，记录学习、生活与思考。</p>
          </div>
        </div>
      </section>

      <!-- 正文：渲染 content/about.md -->
      <article class="about-card">
        <div class="about-content" v-html="renderedMarkdown"></div>
      </article>

      <!-- 联系方式卡片 -->
      <section class="contact-card">
        <h2 class="contact-title"><i class="fa-solid fa-paper-plane"></i> 联系我</h2>
        <p class="contact-desc">有问题、想交流或者想交换友链，可以通过下面的方式找到我：</p>
        <div class="contact-links">
          <a
            class="contact-item"
            href="https://github.com/XNXXN90990"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i class="fab fa-github"></i>
            <span>GitHub</span>
          </a>
          <button class="contact-item contact-item--btn" type="button" @click="showWechatCard = true">
            <i class="fab fa-weixin"></i>
            <span>微信（查看名片）</span>
          </button>
          <a class="contact-item" href="mailto:">
            <i class="fas fa-envelope"></i>
            <span>邮箱（待补充）</span>
          </a>
        </div>
      </section>
    </div>

    <!-- 微信名片弹层 -->
    <transition name="fade">
      <div v-if="showWechatCard" class="wechat-modal" @click.self="showWechatCard = false">
        <div class="wechat-modal-body">
          <button class="wechat-close" type="button" aria-label="关闭" @click="showWechatCard = false">×</button>
          <img :src="wechatCardUrl" alt="微信名片二维码" class="wechat-img" />
          <p class="wechat-tip">微信扫一扫，加个好友吧（点击空白处关闭）</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import aboutMarkdown from '../../content/about.md?raw';
import avatarUrl from '@/assets/imgs/avatar.jpg';
import wechatCardUrl from '@/assets/imgs/wechat-card.jpg';

const md = new MarkdownIt({ html: false, linkify: true });

export default {
  name: 'About',
  data() {
    return {
      avatarUrl,
      wechatCardUrl,
      showWechatCard: false
    };
  },
  computed: {
    renderedMarkdown() {
      return DOMPurify.sanitize(md.render(aboutMarkdown));
    }
  }
};
</script>

<style scoped>
.about-page {
  padding: 24px 20px 10px;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 68px);
}

.about-inner {
  width: 100%;
  max-width: 900px;
}

/* 顶部 */
.hero-top {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--card-border);
  box-shadow: 0 0 18px rgba(57, 255, 126, 0.28), var(--card-shadow);
}

:root[data-theme='light'] .hero-avatar {
  box-shadow: 0 0 14px rgba(15, 138, 56, 0.2), var(--card-shadow);
}

.hero-titles {
  min-width: 0;
}

.hero-title-gradient {
  margin: 0;
  font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
  font-size: 40px;
  letter-spacing: 6px;
  background-image: var(--title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

/* 正文卡片 */
.about-card {
  padding: 26px 30px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
  margin-bottom: 22px;
}

.about-content {
  line-height: 1.8;
  font-size: 15px;
  color: var(--text-primary);
  word-break: break-word;
}

.about-content :deep(h1),
.about-content :deep(h2),
.about-content :deep(h3) {
  color: var(--text-primary);
  margin: 1.2em 0 0.6em;
}

.about-content :deep(h1:first-child) {
  margin-top: 0;
}

.about-content :deep(h2) {
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 6px;
}

.about-content :deep(blockquote) {
  margin: 1em 0;
  padding: 10px 16px;
  border-left: 4px solid var(--accent);
  background: var(--pill-bg);
  color: var(--text-secondary);
  border-radius: 0 8px 8px 0;
}

.about-content :deep(code) {
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.9em;
}

.about-content :deep(a) {
  color: var(--blog-link-color);
}

.about-content :deep(ul),
.about-content :deep(ol) {
  padding-left: 1.4em;
}

/* 联系卡片 */
.contact-card {
  padding: 24px 30px 28px;
  border-radius: 14px;
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-inner-glow), var(--card-shadow);
}

.contact-title {
  margin: 0 0 8px;
  font-size: 20px;
}

.contact-title i {
  color: var(--accent);
  margin-right: 8px;
}

.contact-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.contact-links {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--surface-border);
  background: var(--btn-bg);
  color: var(--text-primary);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.contact-item:hover {
  transform: translateY(-2px);
  background: var(--btn-hover-bg);
  box-shadow: var(--card-hover-shadow);
}

.contact-item i {
  color: var(--accent);
}

/* 微信名片弹层 */
.wechat-modal {
  position: fixed;
  inset: 0;
  background: var(--overlay-mask);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.wechat-modal-body {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow: var(--card-shadow);
}

.wechat-img {
  width: 100%;
  border-radius: 10px;
  display: block;
}

.wechat-tip {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.wechat-close {
  position: absolute;
  top: 8px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 18px;
  cursor: pointer;
  z-index: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .about-page {
    padding: 16px 14px 10px;
  }

  .hero-top {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .hero-titles {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .about-card,
  .contact-card {
    padding: 20px 16px;
  }

  .contact-links {
    flex-direction: column;
  }

  .contact-item {
    justify-content: center;
  }
}
</style>
