/**
 * format.js —— 通用格式化工具
 */

/** 日期字符串 → zh-CN 日期（无效返回「未知」） */
export function formatDate(dateString) {
  const d = new Date(dateString || '');
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '未知';
  return d.toLocaleDateString('zh-CN');
}
