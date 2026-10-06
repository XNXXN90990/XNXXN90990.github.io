<template>
    <header class="blog-header">

        <!-- 左侧：炫光竖线 + 标题 -->
        <div class="header-left">
            <!-- 炫光竖线 -->
            <div class="glow-line"></div>

            <!-- 左上角标题 -->
            <div class="header-title">
                <h1 @click="goHome" ref="title">寜的小站</h1>
            </div>
        </div>

        <!-- 右侧：PC 导航 + 主题切换 + 汉堡按钮 -->
        <div class="header-right">
            <!-- 导航栏的导航项（大屏显示） -->
            <nav class="header-nav">
                <ul>
                    <li
                        v-for="(item, index) in navEntries"
                        :key="index"
                        class="nav-item"
                    >
                        <a
                            v-if="item.href"
                            :href="item.href"
                            :target="item.external ? '_blank' : undefined"
                            :rel="item.external ? 'noopener noreferrer' : undefined"
                        >{{ item.name }}</a>
                        <a v-else @click.prevent="navigate(item.section)" href="#">{{ item.name }}</a>
                        <div class="fluorescent-bar"></div>
                    </li>
                </ul>
            </nav>

            <!-- 深色/浅色切换 -->
            <button
                class="theme-toggle"
                @click="onToggleTheme"
                :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
                :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
                <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
            </button>

            <!-- 汉堡按钮（小屏显示） -->
            <button
                class="hamburger-btn"
                :class="{ 'is-open': isMenuOpen }"
                @click="toggleMenu"
                aria-label="切换导航菜单"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>

        <!-- 侧边抽屉导航 -->
        <transition name="side-drawer">
            <aside
                v-if="isMenuOpen"
                class="side-drawer"
                @click.self="closeMenu"
            >
                <div class="side-drawer-panel">
                    <div class="side-drawer-header">
                        <div class="glow-line small"></div>
                        <span class="side-drawer-title">导航菜单</span>
                    </div>
                    <ul class="side-drawer-list">
                        <li
                            v-for="(item, index) in navEntries"
                            :key="'side-' + index"
                            class="side-drawer-item"
                            @click="handleDrawerItem(item)"
                        >
                            <span>
                                <i v-if="item.icon" :class="item.icon" class="side-drawer-icon"></i>
                                {{ item.name }}
                            </span>
                            <div class="side-drawer-bar"></div>
                        </li>
                        <li class="side-drawer-item" @click="onToggleTheme">
                            <span>
                                <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'" class="side-drawer-icon"></i>
                                {{ isDark ? '深色模式' : '浅色模式' }}
                            </span>
                            <div class="side-drawer-bar"></div>
                        </li>
                    </ul>
                </div>
            </aside>
        </transition>

        <!-- 页头下面的分割细线 -->
        <div class="header-divider"></div>

    </header>
</template>

<script>
import { toggleTheme } from '@/utils/theme';

const GITHUB_URL =
    (import.meta.env.VITE_GITHUB_URL && String(import.meta.env.VITE_GITHUB_URL).trim()) ||
    'https://github.com/XNXXN90990';

export default {
    data() {
        return {
            isMenuOpen: false,
            isDark: document.documentElement.dataset.theme !== 'light'
        };
    },
    computed: {
        navEntries() {
            return [
                { name: '首页', section: '' },
                { name: '归档', section: 'archive' },
                { name: '友链', section: 'links' },
                { name: '关于', section: 'about' },
                { name: '私人空间', section: 'private', icon: 'fa-solid fa-lock' },
                { name: 'GitHub', href: GITHUB_URL, external: true }
            ];
        }
    },
    mounted() {
        /// 确保 DOM 渲染完成后再执行动画
        this.$nextTick(() => {
            this.animateTitle(); // 执行标题动画
            this.animateNavItems(); // 执行导航项动画
        });

        window.addEventListener("resize", this.handleResize);
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.handleResize);
    },
    methods: {
        animateTitle() {
            const titleElement = this.$refs.title;
            if (!titleElement) return;

            const text = titleElement.textContent;
            titleElement.innerHTML = ""; // 清空原始内容

            text.split("").forEach((char, index) => {
                const span = document.createElement("span");
                span.textContent = char === " " ? "\u00A0" : char;

                // 初始状态：透明 + 下方偏移 + 缩小
                span.style.opacity = "0";
                span.style.transform = "translateY(20px) scale(0.5)";
                span.style.display = "inline-block";
                span.style.transition = `all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s`;

                titleElement.appendChild(span);

                // 触发动画：恢复位置 + 显示 + 放大
                setTimeout(() => {
                    span.style.opacity = "1";
                    span.style.transform = "translateY(0) scale(1)";
                }, index * 100);
            });
        },
        animateNavItems() {
            this.$nextTick(() => {
                const navItems = document.querySelectorAll(".nav-item");

                // 使用保守的延迟时间确保所有项都能显示
                navItems.forEach((item, index) => {
                    // 先重置样式确保正确初始状态
                    item.style.opacity = "0";
                    item.style.transform = "translateX(100%)";
                    item.style.position = "relative";

                    const delay = index * 200 + 400; // 每200ms一个间隔

                    setTimeout(() => {
                        item.style.transition = "all 0.6s ease-out";
                        item.style.transform = "translateX(0)";
                        item.style.opacity = "1";
                    }, delay);
                });
            });
        },
        goHome() {
            this.$router.push("/");
        },
        navigate(section) {
            this.$router.push(`/${section}`);
        },
        onToggleTheme() {
            const next = toggleTheme();
            this.isDark = next !== 'light';
            this.closeMenu();
        },
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },
        closeMenu() {
            this.isMenuOpen = false;
        },
        handleMenuClick(section) {
            this.navigate(section);
            this.closeMenu();
        },
        handleDrawerItem(item) {
            if (item.href) {
                if (item.external) {
                    window.open(item.href, "_blank", "noopener,noreferrer");
                } else {
                    window.location.assign(item.href);
                }
                this.closeMenu();
                return;
            }
            this.handleMenuClick(item.section);
        },
        handleResize() {
            // 大屏时强制关闭抽屉，防止布局错乱
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.isMenuOpen = false;
            }
        }
    }
};
</script>

<style>
/* 炫光竖线样式 */
.glow-line {
    width: 4px;
    height: 40px;
    background: linear-gradient(180deg, var(--accent), var(--accent-strong), var(--accent));
    border-radius: 2px;
    box-shadow: var(--glow-shadow);
    animation: glow-pulse 2s infinite alternate;
}

/* 炫光脉冲动画 */
@keyframes glow-pulse {
    0% {
        opacity: 0.6;
        transform: scaleY(1);
    }

    100% {
        opacity: 1;
        transform: scaleY(1.2);
    }
}

/* 页头整体样式 */
.blog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 40px;
    background-color: var(--header-bg);
    backdrop-filter: blur(6px);
    color: var(--header-text);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    box-sizing: border-box;
    transition: background-color 0.35s ease, color 0.35s ease;
}

.header-left {
    display: flex;
    flex-direction: row;
    gap: 2vw;
    align-items: center;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* 标题样式 */
.header-title h1 {
    margin: 0;
    font-size: 24px;
    cursor: pointer;
    transition: color 0.3s ease;
    white-space: nowrap;
}

.header-title h1:hover {
    color: var(--accent-bright);
}

/* 导航栏样式 */
.header-nav ul {
    list-style: none;
    display: flex;
    gap: 30px;
    width: 100%;
    min-width: max-content;
    margin: 0;
    padding: 0;
}

.header-nav {
    overflow: visible;
    white-space: nowrap;
}

.header-nav a {
    text-decoration: none;
    color: var(--header-link);
    font-size: 18px;
    transition: color 0.3s ease;
}

.header-nav a:hover {
    color: var(--accent-bright);
}

/* 标题字符默认样式 */
.header-title h1 span {
    display: inline-block;
    font-size: 24px;
    font-weight: bold;
    color: var(--text-primary);
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 鼠标悬停时的交互效果 */
.header-title h1:hover span {
    color: var(--accent-bright);
    text-shadow: var(--glow-shadow);
}

/* 页头下侧横线样式 */
.header-divider {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0.5px;
    background: var(--header-border);
    z-index: 1001;
}

/* 导航项容器样式 */
.nav-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    overflow: visible;
}

/* 荧光条样式 */
.fluorescent-bar {
    position: absolute;
    bottom: -19px;
    transform: translateY(100%);
    width: 130%;
    height: 1px;
    background: linear-gradient(90deg, var(--accent), var(--accent-strong), var(--accent));
    box-shadow: 0 -15px 30px rgba(6, 204, 26, 0.55), 0 -20px 40px rgba(37, 252, 145, 0.35);
    opacity: 1;
    z-index: 1002;
}

/* 深浅色切换按钮 */
.theme-toggle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--surface-border);
    background: var(--btn-bg);
    color: var(--btn-text);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    transition: transform 0.2s ease, background-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
    flex-shrink: 0;
}

.theme-toggle:hover {
    transform: scale(1.08);
    background: var(--btn-hover-bg);
    box-shadow: var(--glow-shadow);
}

/* 汉堡按钮 */
.hamburger-btn {
    position: relative;
    width: 32px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: none; /* 默认在大屏隐藏，媒体查询中显示 */
}

.hamburger-btn span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-strong), var(--accent));
    border-radius: 999px;
    box-shadow: 0 0 8px rgba(6, 204, 26, 0.8);
    transition: transform 0.25s ease, opacity 0.2s ease, top 0.25s ease, background 0.25s ease;
}

.hamburger-btn span:nth-child(1) {
    top: 0;
}

.hamburger-btn span:nth-child(2) {
    top: 10px;
}

.hamburger-btn span:nth-child(3) {
    top: 20px;
}

.hamburger-btn.is-open span:nth-child(1) {
    top: 10px;
    transform: rotate(45deg);
}

.hamburger-btn.is-open span:nth-child(2) {
    opacity: 0;
}

.hamburger-btn.is-open span:nth-child(3) {
    top: 10px;
    transform: rotate(-45deg);
}

/* 侧边抽屉基础样式 */
.side-drawer {
    position: fixed;
    inset: 0;
    background: var(--overlay-mask);
    backdrop-filter: blur(4px);
    z-index: 1200;
    display: flex;
    justify-content: flex-end;
}

.side-drawer-panel {
    width: 70%;
    max-width: 320px;
    height: 100%;
    background: var(--drawer-bg);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
    border-left: 1px solid var(--surface-border);
    display: flex;
    flex-direction: column;
    padding: 18px 18px 28px;
}

.side-drawer-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
}

.glow-line.small {
    height: 26px;
    width: 3px;
    box-shadow: var(--glow-shadow);
}

.side-drawer-title {
    font-size: 18px;
    color: var(--header-text);
    letter-spacing: 0.08em;
}

.side-drawer-list {
    list-style: none;
    margin: 0;
    padding: 8px 0 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.side-drawer-item {
    position: relative;
    padding: 10px 4px;
    color: var(--header-text);
    font-size: 16px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: color 0.2s ease;
}

.side-drawer-item span {
    z-index: 1;
}

.side-drawer-icon {
    margin-right: 8px;
    color: var(--accent);
}

.side-drawer-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--accent), var(--accent-strong), var(--accent));
    box-shadow: 0 -10px 24px rgba(6, 204, 26, 0.6);
    transition: width 0.3s ease;
}

.side-drawer-item:hover {
    color: var(--accent-bright);
}

.side-drawer-item:hover .side-drawer-bar {
    width: 100%;
}

/* 侧边抽屉过渡动画 */
.side-drawer-enter-active,
.side-drawer-leave-active {
    transition: opacity 0.25s ease;
}

.side-drawer-enter,
.side-drawer-leave-to {
    opacity: 0;
}

.side-drawer-panel {
    transform: translateX(0);
    transition: transform 0.25s ease;
}

.side-drawer-enter .side-drawer-panel,
.side-drawer-leave-to .side-drawer-panel {
    transform: translateX(100%);
}

/* 响应式：小屏使用汉堡菜单，大屏保持原布局 */
@media (max-width: 768px) {
    .blog-header {
        padding: 10px 25px;
    }

    .header-left {
        gap: 10px;
    }

    .header-nav {
        display: none;
    }

    .hamburger-btn {
        display: block;
    }

    .header-title h1,
    .header-title h1 span {
        font-size: 20px;
    }
}
</style>
