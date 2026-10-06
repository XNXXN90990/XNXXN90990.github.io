/**
 * theme.js —— 深色/浅色主题切换
 *
 * - 深色为默认主题（站点的霓虹绿赛博风格）
 * - 首次访问跟随系统 prefers-color-scheme
 * - 用户手动切换后写入 localStorage 永久记忆
 * - index.html <head> 里有同逻辑的内联脚本，在 Vue 挂载前就设置好主题，避免刷新闪白
 */

const THEME_KEY = 'ning-theme';
const ACCENT_KEY = 'ning-accent';

/** 可选主题色（header 调色板展示用，color 为色板圆点颜色） */
export const ACCENTS = [
  { id: 'green', name: '荧光绿', color: '#00b828' },
  { id: 'blue', name: '深海蓝', color: '#00a8cc' },
  { id: 'purple', name: '星辉紫', color: '#8b5cf6' },
  { id: 'orange', name: '暖阳橙', color: '#f59e0b' },
  { id: 'pink', name: '樱花粉', color: '#ec4899' },
  { id: 'red', name: '烈焰红', color: '#ef4444' }
];

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) {
    /* 隐私模式等场景下 localStorage 不可用，忽略 */
  }
  return null;
}

export function getEffectiveTheme() {
  const saved = getSavedTheme();
  if (saved) return saved;
  const prefersLight =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function initTheme() {
  applyTheme(getEffectiveTheme());
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    /* ignore */
  }
  return next;
}

/* ---------- 主题色（accent） ---------- */

export function getAccent() {
  try {
    const saved = localStorage.getItem(ACCENT_KEY);
    if (saved && ACCENTS.some((a) => a.id === saved)) return saved;
  } catch (e) {
    /* ignore */
  }
  return 'green';
}

export function applyAccent(accent) {
  document.documentElement.dataset.accent = accent;
}

export function initAccent() {
  applyAccent(getAccent());
}

export function setAccent(accent) {
  if (!ACCENTS.some((a) => a.id === accent)) return;
  applyAccent(accent);
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch (e) {
    /* ignore */
  }
}
