/**
 * theme.js —— 深色/浅色主题切换
 *
 * - 深色为默认主题（站点的霓虹绿赛博风格）
 * - 首次访问跟随系统 prefers-color-scheme
 * - 用户手动切换后写入 localStorage 永久记忆
 * - index.html <head> 里有同逻辑的内联脚本，在 Vue 挂载前就设置好主题，避免刷新闪白
 */

const THEME_KEY = 'ning-theme';

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
