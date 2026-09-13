/* 公共层（Material/Wcowin 外观版）：配置检查 / 导航填充 / 页脚统计 / 访问统计 / 反调试 */
'use strict';

// ---------- 反调试 ----------
if (window.DisableDevtool) {
  new DisableDevtool({ disableMenu: true, clearLog: true, stopIntervalTime: 1800 });
}

// ---------- 工具 ----------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

function toast(msg, isErr) {
  let t = $('#ningToast');
  if (!t) { t = document.createElement('div'); t.id = 'ningToast'; t.className = 'ning-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'ning-toast show' + (isErr ? ' err' : '');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => { t.className = 'ning-toast'; }, 2200);
}
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s).slice(0, 10);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtSize(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function renderMd(md) {
  if (window.marked && marked.parse) return marked.parse(md || '', { breaks: true, gfm: true });
  let h = escapeHtml(md || '');
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  h = h.split(/\n{2,}/).map(b => /^<(h\d|ul|ol|pre|table)/.test(b.trim()) ? b : '<p>' + b.replace(/\n/g, '<br>') + '</p>').join('');
  return h;
}

// ---------- 配置检查 ----------
function checkConfig() {
  if (!Supa.init() || !Supa.configured) {
    const inner = document.querySelector('.md-content__inner');
    if (inner) inner.innerHTML = `
      <div class="ning-lock-panel">
        <div class="lp-icon">🛠️</div>
        <h2>站点尚未配置</h2>
        <p>请先完成 Supabase 初始化：<br>1. 注册 <a href="https://supabase.com" target="_blank">supabase.com</a>（免费）<br>2. 新建项目 → SQL Editor 运行 <code>sql/setup.sql</code><br>3. Authentication → Users 创建管理员邮箱密码<br>4. 把项目 URL 和 anon key 填入 <code>config.js</code><br><br>详细步骤见仓库 README.md</p>
      </div>`;
    return false;
  }
  return true;
}

// ---------- 访问统计上报 ----------
(function trackVisit() {
  if (!Supa.init()) return;
  let vid = localStorage.getItem('vid');
  if (!vid) {
    vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('vid', vid);
  }
  Supa.insert('visits', { visitor_id: vid }, false).catch(() => {});
})();

// ---------- 站点数据 ----------
let SITE = null;
let CAT_MAP = null;

async function loadSiteData() {
  const [cats, settings, stats] = await Promise.all([
    Supa.select('categories', { select: 'id,name,slug,parent_id,sort,description', order: 'sort.asc,id.asc', limit: 500 }),
    Supa.select('settings', { select: 'key,value', limit: 100 }),
    Supa.rpc('get_site_stats').catch(() => ({ pv: 0, uv: 0 })),
  ]);
  const sMap = {};
  (settings || []).forEach(r => { sMap[r.key] = r.value; });
  const byId = {}; const roots = [];
  (cats || []).forEach(c => { c.children = []; byId[c.id] = c; });
  (cats || []).forEach(c => {
    if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].children.push(c);
    else roots.push(c);
  });
  CAT_MAP = byId;
  SITE = { nav: roots, settings: sMap, stats: stats || { pv: 0, uv: 0 } };
  return SITE;
}
function catName(id) { const c = CAT_MAP && CAT_MAP[id]; return c ? c.name : ''; }
function navItems() {
  const items = [{ key: 'home', name: '首页', href: '/' }];
  for (const c of (SITE ? SITE.nav : [])) items.push({ key: 'cat:' + c.slug, name: c.name, href: '/category.html?cat=' + c.slug });
  items.push({ key: 'talks', name: '杂谈说说', href: '/talks.html' });
  items.push({ key: 'links', name: '友链', href: '/links.html' });
  items.push({ key: 'about', name: '关于我', href: '/about.html' });
  items.push({ key: 'private', name: '私人空间', href: '/private.html' });
  return items;
}

// ---------- 页面初始化：填导航 + 页脚统计 ----------
async function initPage(activeKey) {
  try { await loadSiteData(); } catch (e) { console.error(e); }

  // 顶部 tabs
  const tabs = $('#ningTabs');
  if (tabs) {
    tabs.innerHTML = navItems().map(i =>
      `<li class="md-tabs__item${i.key === activeKey ? ' md-tabs__item--active' : ''}">
        <a href="${i.href}" class="md-tabs__link${i.key === activeKey ? ' md-tabs__link--active' : ''}">${escapeHtml(i.name)}</a>
      </li>`).join('');
  }

  // 侧栏抽屉导航
  const drawer = $('#ningDrawerNav');
  if (drawer) {
    let html = navItems().map(i =>
      `<li class="md-nav__item${i.key === activeKey ? ' md-nav__item--active' : ''}">
        <a href="${i.href}" class="md-nav__link">${escapeHtml(i.name)}</a>
      </li>`).join('');
    for (const c of (SITE ? SITE.nav : [])) {
      if (c.children && c.children.length) {
        html += c.children.map(s =>
          `<li class="md-nav__item">
            <a href="/category.html?cat=${s.slug}" class="md-nav__link" style="padding-left:1.6rem;font-size:.78rem;">└ ${escapeHtml(s.name)}</a>
          </li>`).join('');
      }
    }
    drawer.innerHTML = html;
  }

  // 页脚统计
  const pv = $('#ningPv'), uv = $('#ningUv');
  if (pv) pv.textContent = String(SITE ? SITE.stats.pv : 0);
  if (uv) uv.textContent = String(SITE ? SITE.stats.uv : 0);
  const start = new Date(((SITE && SITE.settings.site_start) || '2026-09-13') + 'T00:00:00+08:00');
  function tick() {
    const d = $('#ningDays'); if (!d) return;
    const ms = Date.now() - start.getTime();
    d.textContent = String(Math.floor(ms / 86400000));
    const h = Math.floor(ms / 3600000) % 24, mi = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    $('#ningTime').textContent = `${h} 时 ${mi} 分 ${s} 秒`;
  }
  tick(); setInterval(tick, 1000);
}

// 私人空间访问码（本机保存）
function getPrivateCode() { return localStorage.getItem('private_code'); }
