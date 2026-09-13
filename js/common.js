/* 公共层：配置检查 / 导航 / 页脚统计 / 主题切换 / 访问统计 / 反调试 */
'use strict';

// ---------- 反调试：F12 / 控制台 / debugger 等操作会被打断 ----------
if (window.DisableDevtool) {
  new DisableDevtool({
    disableMenu: true,      // 禁用右键菜单
    clearLog: true,         // 清空控制台
    stopIntervalTime: 1800, // 检测间隔
  });
}

// ---------- 工具 ----------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

function toast(msg, isErr) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => { t.className = 'toast'; }, 2200);
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
    document.body.innerHTML = `
      <div class="lock-panel">
        <div class="lock-icon">🛠️</div>
        <h2>站点尚未配置</h2>
        <p>请先完成 Supabase 初始化：<br>1. 注册 <a href="https://supabase.com" target="_blank">supabase.com</a>（免费）<br>2. 新建项目 → SQL Editor 运行 <code>sql/setup.sql</code><br>3. Authentication → Users 创建管理员邮箱密码<br>4. 把项目 URL 和 anon key 填入 <code>config.js</code><br><br>详细步骤见仓库 README.md</p>
      </div>`;
    return false;
  }
  return true;
}

// ---------- 访问统计上报（匿名插入 visits 表，RLS 允许） ----------
(function trackVisit() {
  if (!Supa.init()) return;
  let vid = localStorage.getItem('vid');
  if (!vid) {
    vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('vid', vid);
  }
  Supa.insert('visits', { visitor_id: vid }, false).catch(() => {});
})();

// ---------- 主题 ----------
(function initTheme() {
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);
})();
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// ---------- 导航与页脚 ----------
let SITE = null;      // { nav, settings, stats }
let CAT_MAP = null;   // id -> category

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

async function initShell(activeKey) {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <a class="site-title" href="/">
        <svg class="logo" viewBox="0 0 44 44"><rect width="44" height="44" rx="11" fill="var(--accent)"/><text x="22" y="30" font-size="22" fill="#fff" text-anchor="middle" font-weight="700">寜</text></svg>
        <span>寜的小站<span class="en">Ning's Blog</span></span>
      </a>
      <nav class="main-nav" id="mainNav"></nav>
      <div class="header-actions">
        <button class="icon-btn" id="themeBtn" title="切换主题">🌙</button>
        <button class="icon-btn" id="menuToggle" title="菜单">☰</button>
      </div>
    </div>`;
  document.body.prepend(header);

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-stats">
        <span>本站已运行 <b id="ftDays">-</b> 天 <i id="ftTime">-</i></span>
        <span>访问量 <b id="ftPv">-</b> 次</span>
        <span>访客数 <b id="ftUv">-</b> 人</span>
        <span>作者 <b>DBD</b></span>
      </div>
      <div class="footer-copy">© <span id="ftYear"></span> 寜的小站 Ning's Blog · 由 <a href="/admin/" target="_blank">寜</a> 用心经营</div>
    </div>`;
  document.body.appendChild(footer);

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = '<img alt="">';
  document.body.appendChild(lb);
  lb.addEventListener('click', () => { lb.style.display = 'none'; });
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('.t-media')) {
      $('#lightbox img').src = e.target.src;
      $('#lightbox').style.display = 'flex';
    }
  });

  $('#themeBtn').addEventListener('click', function () {
    toggleTheme();
    this.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  });
  $('#menuToggle').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
  $('#themeBtn').textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';

  await loadSiteData();

  // 导航
  const nav = $('#mainNav');
  const items = [{ key: 'home', name: '首页', href: '/' }];
  for (const c of SITE.nav) items.push({ key: 'cat:' + c.slug, name: c.name, href: '/category.html?cat=' + c.slug });
  items.push({ key: 'talks', name: '杂谈说说', href: '/talks.html' });
  items.push({ key: 'links', name: '友链', href: '/links.html' });
  items.push({ key: 'about', name: '关于我', href: '/about.html' });
  items.push({ key: 'private', name: '私人空间', href: '/private.html' });
  nav.innerHTML = items.map(i =>
    `<a href="${i.href}" class="${i.key === activeKey ? 'active' : ''}">${i.name}</a>`).join('');

  // 页脚统计
  $('#ftPv').textContent = String(SITE.stats.pv || 0);
  $('#ftUv').textContent = String(SITE.stats.uv || 0);
  const start = new Date((SITE.settings.site_start || '2026-09-13') + 'T00:00:00+08:00');
  function tick() {
    const ms = Date.now() - start.getTime();
    const days = Math.floor(ms / 86400000);
    const h = Math.floor(ms / 3600000) % 24;
    const mi = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    const el = $('#ftDays'); if (!el) return;
    el.textContent = String(days);
    $('#ftTime').textContent = `${h} 时 ${mi} 分 ${s} 秒`;
  }
  tick(); setInterval(tick, 1000);
  $('#ftYear').textContent = String(new Date().getFullYear());
}

// 私人空间访问码（本机保存）
function getPrivateCode() { return localStorage.getItem('private_code'); }
