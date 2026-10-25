/**
 * siteStore.js —— 站点配置的响应式存储（水印/公告/文案/模块开关/维护状态）
 *
 * 应用启动时从后端拉一次配置；后端不可用则保持内置默认值（纯静态模式）。
 * 维护状态由路由守卫消费（maintenance/ghost 全站跳维护页）。
 */
import { reactive } from 'vue';
import { fetchSiteConfig } from '@/api';

/** 允许的配置键（与后端白名单一致） */
export const SITE_STATUS = { NORMAL: 'normal', MAINTENANCE: 'maintenance', GHOST: 'ghost' };

export const siteStore = reactive({
  loaded: false,
  /** normal | maintenance | ghost */
  status: SITE_STATUS.NORMAL,
  /** 后端返回的原始配置；后端不可用时为 {}（视图层用默认值兜底） */
  config: {}
});

const DEFAULTS = {
  watermark_text: '寜',
  watermark_enabled: '1',
  notice_text: '欢迎来到寜的小站！博客刚刚开张，文章持续更新中，也欢迎去「关于」页找我玩~',
  hero_line1: '你好，',
  hero_line2: "Welcome To Ning's Blog！",
  module_talks_enabled: '1',
  module_thoughts_enabled: '1',
  module_albums_enabled: '1',
  module_guides_enabled: '1'
};

/** 取配置项：后端值优先，默认值兜底 */
export function siteConfig(key) {
  const v = siteStore.config[key];
  if (v !== undefined && v !== null && v !== '') return v;
  return DEFAULTS[key];
}

/** 栏目模块是否开启 */
export function moduleEnabled(key) {
  return siteConfig(key) === '1';
}

/** 应用启动时调用：拉取站点配置（失败静默，纯静态模式照常浏览） */
export async function initSiteStore() {
  try {
    const config = await fetchSiteConfig();
    if (config && Object.keys(config).length) {
      siteStore.config = config;
      const status = config.site_status;
      siteStore.status = [SITE_STATUS.NORMAL, SITE_STATUS.MAINTENANCE, SITE_STATUS.GHOST].includes(status)
        ? status
        : SITE_STATUS.NORMAL;
    }
  } catch (e) {
    /* 后端不可用：保持默认 */
  } finally {
    siteStore.loaded = true;
  }
}
