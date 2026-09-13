/* 管理端逻辑：Supabase Auth 登录 / 看板 / 文章(草稿+自动保存) / 杂谈(文件上传) / 目录 / 友链 / 文件 / 设置 */
'use strict';

let CATEGORIES = [];
const BUCKET = 'media';

function confirmDel(msg) { return confirm(msg || '确定删除？'); }

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loadCategories() {
  CATEGORIES = await Supa.select('categories', { select: 'id,name,slug,parent_id,sort,description', order: 'sort.asc,id.asc', limit: 500, auth: true });
  return CATEGORIES;
}
function catName(id) { const c = CATEGORIES.find(x => x.id === +id); return c ? c.name : '—'; }
function buildTree(rows) {
  const byId = {}; const roots = [];
  rows.forEach(r => { byId[r.id] = Object.assign({ children: [] }, r); });
  rows.forEach(r => {
    if (r.parent_id && byId[r.parent_id]) byId[r.parent_id].children.push(byId[r.id]);
    else roots.push(byId[r.id]);
  });
  return roots;
}
function catOptions(selected, skipId) {
  function walk(nodes, depth) {
    let h = '';
    for (const c of nodes) {
      if (c.id === skipId) continue;
      h += `<option value="${c.id}" ${c.id === +selected ? 'selected' : ''}>${'　'.repeat(depth)}${escapeHtml(c.name)}</option>`;
      if (c.children) h += walk(c.children, depth + 1);
    }
    return h;
  }
  return `<option value="">（顶级分类）</option>` + walk(buildTree(CATEGORIES), 0);
}
// 上传到 Supabase Storage，返回 {url,name,mime,size}
async function uploadToStorage(file) {
  const safe = String(file.name).replace(/[\/\\:*?"<>|#?%]/g, '_');
  const path = `${BUCKET}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${encodeURIComponent(safe)}`;
  await Supa.storageUpload(path, file, file.type || 'application/octet-stream');
  return { url: Supa.storagePublicUrl(path), name: file.name, mime: file.type || 'application/octet-stream', size: file.size, path };
}

// ================= 登录 =================
function showLogin(msg) {
  $('#adminView').style.display = 'none';
  $('#loginView').style.display = 'block';
  $('#pwdInput').value = '';
  if (msg) toast(msg, true);
  $('#emailInput').focus();
}
async function tryLogin() {
  const email = $('#emailInput').value.trim();
  const pwd = $('#pwdInput').value;
  if (!email || !pwd) return toast('请输入邮箱和密码', true);
  $('#loginBtn').disabled = true; $('#loginBtn').textContent = '登录中…';
  try {
    await Supa.signIn(email, pwd);
    $('#loginBtn').disabled = false; $('#loginBtn').textContent = '登 录';
    showAdmin();
  } catch (e) {
    $('#loginBtn').disabled = false; $('#loginBtn').textContent = '登 录';
    toast(e.message || '登录失败', true);
  }
}
function showAdmin() {
  $('#loginView').style.display = 'none';
  $('#adminView').style.display = 'block';
  route();
}

// ================= 路由 =================
const VIEWS = {};
function route() {
  const hash = (location.hash || '#dashboard').slice(1);
  const [name, arg] = hash.split('/');
  const view = VIEWS[name] ? name : 'dashboard';
  $$('#admNav a[data-v]').forEach(a => a.classList.toggle('active', a.dataset.v === name));
  VIEWS[view](arg);
}
window.addEventListener('hashchange', route);

// ================= 看板 =================
VIEWS.dashboard = async function () {
  const el = $('#admMain');
  el.innerHTML = '<div class="loading">加载中…</div>';
  await loadCategories();
  const [posts, trend, talkCount, linkCount, stats] = await Promise.all([
    Supa.select('posts', { select: 'id,title,views,private,pinned,status,category_id,created_at', order: 'created_at.desc', limit: 500, auth: true }),
    Supa.rpc('get_visits_trend', {}, true).catch(() => []),
    Supa.countRows('talks', []),
    Supa.countRows('links', []),
    Supa.rpc('get_site_stats').catch(() => ({ pv: 0, uv: 0 })),
  ]);
  const days = (Array.isArray(trend) ? trend : []).slice(-14);
  const maxPv = Math.max(1, ...days.map(t => t.pv));
  const drafts = posts.filter(p => p.status === 'draft');
  el.innerHTML = `
    <div class="adm-h1">📊 数据看板 <span class="muted" style="font-size:13px;font-weight:400;">${escapeHtml(Supa.userEmail)}</span></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="s-num">${posts.length - drafts.length}</div><div class="s-label">已发布文章（${posts.filter(x => x.private).length} 篇私密）</div></div>
      <div class="stat-card"><div class="s-num">${drafts.length}</div><div class="s-label">草稿箱</div></div>
      <div class="stat-card"><div class="s-num">${posts.reduce((a, b) => a + (b.views || 0), 0)}</div><div class="s-label">文章总阅读</div></div>
      <div class="stat-card"><div class="s-num">${talkCount}</div><div class="s-label">杂谈说说</div></div>
      <div class="stat-card"><div class="s-num">${(stats && stats.pv) || 0}</div><div class="s-label">总访问量 PV</div></div>
      <div class="stat-card"><div class="s-num">${(stats && stats.uv) || 0}</div><div class="s-label">总访客数 UV</div></div>
      <div class="stat-card"><div class="s-num">${linkCount}</div><div class="s-label">友链</div></div>
    </div>
    <div class="panel"><h3>近 14 天访问趋势</h3>
      <div class="bar-list">${days.map(t =>
        `<div class="bar-item"><span class="bar-n">${t.pv}</span><div class="bar" style="height:${Math.round((t.pv || 0) / maxPv * 100)}%"></div><span class="bar-d">${String(t.day).slice(5)}</span></div>`).join('') || '<span class="muted">暂无访问数据</span>'}
      </div>
    </div>
    <div class="panel"><h3>最近文章</h3>
      <table class="tbl"><tbody>${posts.slice(0, 6).map(p =>
        `<tr><td><a href="#posts/${p.id}">${p.pinned ? '📌 ' : ''}${p.private ? '🔒 ' : ''}${escapeHtml(p.title)}</a></td>
        <td>${p.status === 'draft' ? '<span style="color:#d97706">草稿</span>' : catName(p.category_id)}</td>
        <td class="muted">${p.views} 阅读</td><td class="muted">${fmtDate(p.created_at)}</td></tr>`).join('') || '<tr><td class="muted">暂无</td></tr>'}</tbody></table>
    </div>`;
};

// ================= 文章管理 =================
VIEWS.posts = async function (editId) {
  const el = $('#admMain');
  if (editId) return postEditor(el, +editId);
  el.innerHTML = '<div class="loading">加载中…</div>';
  await loadCategories();
  let page = 1, q = '', cat = '';
  const SIZE = 15;

  async function load() {
    const filters = [];
    if (q) filters.push(`title=ilike.*${q.replace(/[(),*%]/g, '')}*`);
    if (cat) filters.push(`category_id=eq.${cat}`);
    const [items, total] = await Promise.all([
      Supa.select('posts', { select: 'id,title,description,category_id,tags,private,pinned,views,status,created_at,updated_at', filters, order: 'created_at.desc', limit: SIZE, offset: (page - 1) * SIZE, auth: true }),
      Supa.countRows('posts', filters, true),
    ]);
    const totalPage = Math.max(1, Math.ceil(total / SIZE));
    el.innerHTML = `
      <div class="adm-h1">📝 文章管理 <a class="btn sm" href="#posts/new">＋ 发布新文章</a></div>
      <div class="panel">
        <div class="form-inline" style="margin-bottom: 12px;">
          <div class="form-row"><input type="text" id="postQ" placeholder="搜索标题…" value="${escapeHtml(q)}"></div>
          <div class="form-row"><select id="postCat"><option value="">全部分类</option>${CATEGORIES.map(c => `<option value="${c.id}" ${+cat === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
          <div class="form-row" style="flex:0 0 auto;"><button class="btn sm" id="postSearch">搜索</button></div>
        </div>
        <table class="tbl">
          <thead><tr><th>标题</th><th>分类</th><th>状态</th><th>阅读</th><th>日期</th><th>操作</th></tr></thead>
          <tbody>${items.map(p => `
            <tr>
              <td>${p.pinned ? '📌 ' : ''}${p.private ? '🔒 ' : ''}<a href="#posts/${p.id}">${escapeHtml(p.title)}</a></td>
              <td>${escapeHtml(catName(p.category_id))}</td>
              <td>${p.status === 'draft' ? '<span style="color:#d97706">草稿</span>' : '已发布'}</td>
              <td>${p.views}</td>
              <td class="muted">${fmtDate(p.created_at)}</td>
              <td class="ops">
                ${p.status !== 'draft' ? `<a class="mini-btn" href="/post.html?id=${p.id}" target="_blank">预览</a>` : ''}
                <button class="mini-btn danger" data-del="${p.id}">删除</button>
              </td>
            </tr>`).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:30px">还没有文章</td></tr>'}
          </tbody>
        </table>
        <div class="pager">
          <button ${page <= 1 ? 'disabled' : ''} data-p="${page - 1}">‹</button>
          <span class="pinfo">${page} / ${totalPage} 页 · 共 ${total} 篇</span>
          <button ${page >= totalPage ? 'disabled' : ''} data-p="${page + 1}">›</button>
        </div>
      </div>`;
    $('#postSearch').addEventListener('click', () => { q = $('#postQ').value.trim(); cat = $('#postCat').value; page = 1; load(); });
    $('#postCat').addEventListener('change', () => { cat = $('#postCat').value; page = 1; load(); });
    $('#postQ').addEventListener('keydown', e => { if (e.key === 'Enter') $('#postSearch').click(); });
    $$('.pager button', el).forEach(b => b.addEventListener('click', () => { page = +b.dataset.p; load(); }));
    $$('button[data-del]', el).forEach(b => b.addEventListener('click', async () => {
      if (!confirmDel('确定删除这篇文章？不可恢复。')) return;
      await Supa.remove('posts', [`id=eq.${b.dataset.del}`]);
      toast('已删除'); load();
    }));
  }
  await load();
};

async function postEditor(el, id) {
  await loadCategories();
  const isNew = !(id > 0);
  const draftKey = 'nb_edit_' + (isNew ? 'new' : id);
  let post = isNew
    ? { title: '', description: '', content: '', cover: '', tags: '', private: false, pinned: false, status: 'published', category_id: '' }
    : (await Supa.select('posts', { select: '*', filters: [`id=eq.${id}`], auth: true }))[0];
  if (!post) { el.innerHTML = '<div class="empty">文章不存在</div>'; return; }

  // 恢复本地自动保存
  const local = localStorage.getItem(draftKey);
  if (local && confirm('检测到未保存的本地草稿，是否恢复？')) {
    try { Object.assign(post, JSON.parse(local)); toast('已恢复本地草稿'); } catch {}
  }
  const isDraft = post.status === 'draft';

  el.innerHTML = `
    <div class="adm-h1">${isNew ? '🆕 发布新文章' : '✏️ 编辑文章'} <a class="btn ghost sm" href="#posts">← 返回列表</a></div>
    <div class="panel">
      <div class="form-row"><label>标题 *</label><input type="text" id="fTitle" value="${escapeHtml(post.title)}" placeholder="文章标题"></div>
      <div class="form-inline">
        <div class="form-row"><label>发布到分类 *</label><select id="fCat">${catOptions(post.category_id)}</select></div>
        <div class="form-row"><label>标签（逗号分隔）</label><input type="text" id="fTags" value="${escapeHtml(post.tags || '')}" placeholder="如：Mac, 教程"></div>
      </div>
      <div class="form-row"><label>简介</label><textarea id="fDesc" rows="2" placeholder="显示在列表卡片上的摘要">${escapeHtml(post.description || '')}</textarea></div>
      <div class="form-row"><label>封面图片（可留空）</label>
        <div class="flex">
          <input type="text" id="fCover" value="${escapeHtml(post.cover || '')}" placeholder="https://… 或点击右侧上传" style="flex:1">
          <button class="btn ghost sm" id="coverUploadBtn">📎 上传</button>
          <input type="file" id="coverFile" accept="image/*" style="display:none">
        </div>
      </div>
      <div class="check-row">
        <label><input type="checkbox" id="fPrivate" ${post.private ? 'checked' : ''}>🔒 私密（仅私人空间可见）</label>
        <label><input type="checkbox" id="fPinned" ${post.pinned ? 'checked' : ''}>📌 置顶</label>
        <span class="muted" id="saveState" style="margin-left:auto;font-size:12px;">${isDraft ? '当前状态：草稿' : ''}</span>
      </div>
      <div class="form-row"><label>正文（Markdown，自动保存到本地）</label>
        <div class="editor-wrap">
          <textarea id="fContent" placeholder="# 在这里用 Markdown 写作…">${escapeHtml(post.content || '')}</textarea>
          <div class="editor-preview md" id="preview"></div>
        </div>
      </div>
      <div class="flex" style="flex-wrap:wrap;">
        <button class="btn" id="saveBtn">💾 ${isNew ? '发布' : '保存修改'}</button>
        <button class="btn ghost" id="draftBtn">✏️ ${isDraft ? '更新草稿' : '存为草稿'}</button>
        <span class="muted" style="font-size:13px;">支持 Markdown：标题、列表、表格、代码块、图片等</span>
      </div>
    </div>`;

  const pv = $('#preview');
  const renderPv = () => { pv.innerHTML = renderMd($('#fContent').value); };
  $('#fContent').addEventListener('input', renderPv);
  renderPv();

  // 封面上传
  $('#coverUploadBtn').addEventListener('click', () => $('#coverFile').click());
  $('#coverFile').addEventListener('change', async function () {
    const f = this.files[0]; if (!f) return;
    this.value = '';
    toast('上传中…');
    try { const m = await uploadToStorage(f); $('#fCover').value = m.url; toast('封面上传成功'); }
    catch (e) { toast('上传失败：' + e.message, true); }
  });

  // 收集表单
  function collectBody(status) {
    return {
      title: $('#fTitle').value.trim(),
      category_id: +$('#fCat').value,
      tags: $('#fTags').value.trim(),
      description: $('#fDesc').value.trim(),
      cover: $('#fCover').value.trim(),
      content: $('#fContent').value,
      private: $('#fPrivate').checked,
      pinned: $('#fPinned').checked,
      status,
    };
  }
  // 本地自动保存（每 3 秒；离开编辑页后自动停止）
  const autosaveTimer = setInterval(() => {
    if (!document.getElementById('fTitle')) { clearInterval(autosaveTimer); return; }
    const b = collectBody('autosave');
    if (b.title || b.content) {
      localStorage.setItem(draftKey, JSON.stringify(b));
      const s = $('#saveState');
      if (s) s.textContent = '已自动保存到本地 ' + new Date().toLocaleTimeString();
    }
  }, 3000);

  async function save(status) {
    const body = collectBody(status);
    if (!body.title) return toast('标题不能为空', true);
    if (!body.category_id) return toast('请选择分类', true);
    try {
      if (isNew) {
        const r = await Supa.insert('posts', body, true);
        localStorage.removeItem(draftKey);
        toast(status === 'draft' ? '草稿已保存' : '发布成功');
        location.hash = '#posts/' + r.id;
        location.reload();
      } else {
        body.updated_at = new Date().toISOString();
        await Supa.update('posts', [`id=eq.${id}`], body);
        localStorage.removeItem(draftKey);
        $('#saveState').textContent = status === 'draft' ? '当前状态：草稿' : '已保存 ✓';
        toast(status === 'draft' ? '草稿已保存' : '已保存');
      }
    } catch (e) { toast('保存失败：' + e.message, true); }
  }
  $('#saveBtn').addEventListener('click', () => save('published'));
  $('#draftBtn').addEventListener('click', () => save('draft'));
}

// ================= 杂谈说说 =================
VIEWS.talks = async function () {
  const el = $('#admMain');
  el.innerHTML = '<div class="loading">加载中…</div>';
  let media = [];
  let page = 1;
  const SIZE = 10;

  async function load() {
    const [items, total] = await Promise.all([
      Supa.select('talks', { select: 'id,content,media,created_at', order: 'created_at.desc', limit: SIZE, offset: (page - 1) * SIZE, auth: true }),
      Supa.countRows('talks', []),
    ]);
    const totalPage = Math.max(1, Math.ceil(total / SIZE));
    $('#talkList').innerHTML = items.map(t => `
      <div class="panel">
        <div class="flex">
          <div class="grow" style="white-space:pre-wrap;">${escapeHtml(t.content)}</div>
          <button class="mini-btn danger" data-del="${t.id}">删除</button>
        </div>
        ${t.media && t.media.length ? `<div class="upload-list">${t.media.map(m =>
          m.mime && m.mime.startsWith('image/') ? `<img src="${m.url}" style="width:64px;height:64px;object-fit:cover;border-radius:8px">`
          : `<a class="mini-btn" href="${m.url}" target="_blank">${escapeHtml(m.name || '附件')}</a>`).join('')}</div>` : ''}
        <div class="muted" style="font-size:12px;margin-top:8px;">${fmtDateTime(t.created_at)}</div>
      </div>`).join('') || '<div class="empty">还没有杂谈</div>';
    $('#talkPager').innerHTML = `<button ${page <= 1 ? 'disabled' : ''} data-p="${page - 1}">‹</button><span class="pinfo">${page}/${totalPage}</span><button ${page >= totalPage ? 'disabled' : ''} data-p="${page + 1}">›</button>`;
    $$('#talkPager button').forEach(b => b.addEventListener('click', () => { page = +b.dataset.p; load(); }));
    $$('button[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirmDel('删除这条杂谈？')) return;
      await Supa.remove('talks', [`id=eq.${b.dataset.del}`]);
      toast('已删除'); load();
    }));
  }

  el.innerHTML = `
    <div class="adm-h1">💬 杂谈说说</div>
    <div class="panel">
      <h3>发一条新杂谈</h3>
      <div class="form-row"><textarea id="tContent" rows="3" placeholder="此刻在想什么…（支持换行）"></textarea></div>
      <div class="upload-zone" id="tUpload">📎 点击选择图片 / 视频 / 音频 / 任意文件（可多选，单个建议 ≤50MB）</div>
      <input type="file" id="tFiles" multiple style="display:none">
      <div class="upload-list" id="tMediaList"></div>
      <div style="margin-top:14px;"><button class="btn" id="tPublish">🚀 发布</button></div>
    </div>
    <div id="talkList"></div>
    <div class="pager" id="talkPager"></div>`;

  function renderMediaList() {
    $('#tMediaList').innerHTML = media.map((m, i) => `
      <div class="upload-item">
        ${m.mime && m.mime.startsWith('image/') ? `<img src="${m.url}">`
          : m.mime && m.mime.startsWith('video/') ? `<video src="${m.url}"></video>`
          : `<div class="u-file">${m.mime && m.mime.startsWith('audio/') ? '🎵' : '📄'}</div>`}
        <div class="u-name">${escapeHtml(m.name || '')}</div>
        <button class="u-del" data-i="${i}">✕</button>
      </div>`).join('');
    $$('.u-del').forEach(b => b.addEventListener('click', () => { media.splice(+b.dataset.i, 1); renderMediaList(); }));
  }

  $('#tUpload').addEventListener('click', () => $('#tFiles').click());
  $('#tFiles').addEventListener('change', async function () {
    const files = Array.from(this.files || []);
    this.value = '';
    for (const f of files) {
      toast(`正在上传：${f.name}`);
      try {
        const m = await uploadToStorage(f);
        media.push(m);
        renderMediaList();
      } catch (e) { toast(`上传失败：${f.name}（${e.message}）`, true); }
    }
  });

  $('#tPublish').addEventListener('click', async () => {
    const content = $('#tContent').value.trim();
    if (!content) return toast('说点什么吧', true);
    try {
      await Supa.insert('talks', { content, media }, true);
      $('#tContent').value = ''; media = []; renderMediaList();
      toast('已发布 ✨'); load();
    } catch (e) { toast('发布失败：' + e.message, true); }
  });

  await load();
};

// ================= 目录结构 =================
VIEWS.cats = async function () {
  const el = $('#admMain');
  el.innerHTML = '<div class="loading">加载中…</div>';
  await loadCategories();

  function nodeHtml(nodes) {
    return (nodes || []).map(c => `
      <div class="cat-node">
        <span>📂</span><span class="cat-name">${escapeHtml(c.name)}</span><span class="cat-slug">/${escapeHtml(c.slug)}</span>
        <span class="ops">
          <button class="mini-btn" data-add-sub="${c.id}">＋子分类</button>
          <button class="mini-btn" data-edit="${c.id}">编辑</button>
          <button class="mini-btn danger" data-del="${c.id}">删除</button>
        </span>
      </div>
      ${c.children && c.children.length ? `<div class="cat-children">${nodeHtml(c.children)}</div>` : ''}
    `).join('');
  }

  el.innerHTML = `
    <div class="adm-h1">📂 目录结构 <button class="btn sm" id="addRoot">＋ 新增顶级分类</button></div>
    <div class="panel"><h3>分类树（前台导航按顶级分类显示，可嵌套）</h3>
      <div id="catTreeBox">${nodeHtml(buildTree(CATEGORIES)) || '<div class="muted">暂无分类</div>'}</div>
    </div>
    <div class="panel" id="catForm" style="display:none;">
      <h3 id="catFormTitle">新增分类</h3>
      <div class="form-inline">
        <div class="form-row"><label>名称 *</label><input type="text" id="cName"></div>
        <div class="form-row"><label>路径 slug（留空自动生成）</label><input type="text" id="cSlug"></div>
        <div class="form-row"><label>父分类</label><select id="cParent"></select></div>
        <div class="form-row"><label>排序（小的在前）</label><input type="text" id="cSort" value="0"></div>
      </div>
      <div class="form-row"><label>描述</label><input type="text" id="cDesc"></div>
      <button class="btn" id="cSave">保存</button>
    </div>`;

  let editId = null;
  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'cat-' + Date.now().toString(36);
  }
  function openForm(id, parentId, node) {
    editId = id || null;
    $('#catForm').style.display = 'block';
    $('#catFormTitle').textContent = id ? '编辑分类' : (parentId ? '新增子分类' : '新增顶级分类');
    $('#cName').value = node ? node.name : '';
    $('#cSlug').value = node ? node.slug : '';
    $('#cDesc').value = node ? (node.description || '') : '';
    $('#cSort').value = node ? node.sort : 0;
    $('#cParent').innerHTML = catOptions(node ? node.parent_id : parentId, id);
    $('#cName').focus();
  }

  $('#addRoot').addEventListener('click', () => openForm(null, null, null));
  el.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t || t.id === 'cSave') return;
    if (t.dataset.addSub) openForm(null, +t.dataset.addSub, null);
    if (t.dataset.edit) { const c = CATEGORIES.find(x => x.id === +t.dataset.edit); openForm(c.id, null, c); }
    if (t.dataset.del) {
      const c = CATEGORIES.find(x => x.id === +t.dataset.del);
      if (confirmDel(`删除分类「${c.name}」？（需先清空其文章与子分类）`)) {
        Supa.remove('categories', [`id=eq.${c.id}`])
          .then(() => { toast('已删除'); VIEWS.cats(); })
          .catch(e => toast(e.message, true));
      }
    }
  });

  $('#cSave').addEventListener('click', async () => {
    const body = {
      name: $('#cName').value.trim(),
      slug: ($('#cSlug').value.trim() || slugify($('#cName').value.trim())),
      description: $('#cDesc').value.trim(),
      parent_id: +$('#cParent').value || null,
      sort: +$('#cSort').value || 0,
    };
    if (!body.name) return toast('名称必填', true);
    try {
      if (editId) await Supa.update('categories', [`id=eq.${editId}`], body);
      else await Supa.insert('categories', body, true);
      toast('已保存'); VIEWS.cats();
    } catch (e) { toast(String(e.message).includes('duplicate') ? 'slug 已存在，请换一个' : e.message, true); }
  });
};

// ================= 友链 =================
VIEWS.links = async function () {
  const el = $('#admMain');
  el.innerHTML = '<div class="loading">加载中…</div>';
  async function load() {
    const items = await Supa.select('links', { select: 'id,name,url,avatar,description,sort', order: 'sort.asc,id.asc', limit: 200, auth: true });
    el.innerHTML = `
      <div class="adm-h1">🔗 友链管理</div>
      <div class="panel">
        <h3>新增友链</h3>
        <div class="form-inline">
          <div class="form-row"><label>名称 *</label><input type="text" id="lName"></div>
          <div class="form-row"><label>链接 *</label><input type="text" id="lUrl" placeholder="https://…"></div>
          <div class="form-row"><label>头像 URL</label><input type="text" id="lAvatar"></div>
          <div class="form-row"><label>排序</label><input type="text" id="lSort" value="0"></div>
        </div>
        <div class="form-row"><label>描述</label><input type="text" id="lDesc"></div>
        <button class="btn sm" id="lAdd">＋ 添加</button>
      </div>
      <div class="panel">
        <table class="tbl">
          <thead><tr><th>名称</th><th>链接</th><th>描述</th><th>排序</th><th>操作</th></tr></thead>
          <tbody>${items.map(l => `
            <tr data-id="${l.id}">
              <td><input class="edit-f" data-k="name" type="text" value="${escapeHtml(l.name)}" style="width:110px"></td>
              <td><input class="edit-f" data-k="url" type="text" value="${escapeHtml(l.url)}" style="width:190px"></td>
              <td><input class="edit-f" data-k="description" type="text" value="${escapeHtml(l.description || '')}" style="width:190px"></td>
              <td><input class="edit-f" data-k="sort" type="text" value="${l.sort}" style="width:52px"></td>
              <td class="ops">
                <button class="mini-btn" data-save="${l.id}">保存</button>
                <button class="mini-btn danger" data-del="${l.id}">删除</button>
              </td>
            </tr>`).join('') || '<tr><td colspan="5" class="muted" style="text-align:center;padding:26px">暂无友链</td></tr>'}
          </tbody>
        </table>
      </div>`;
    $('#lAdd').addEventListener('click', async () => {
      const body = { name: $('#lName').value.trim(), url: $('#lUrl').value.trim(), avatar: $('#lAvatar').value.trim(), description: $('#lDesc').value.trim(), sort: +$('#lSort').value || 0 };
      if (!body.name || !body.url) return toast('名称和链接必填', true);
      await Supa.insert('links', body, true);
      toast('已添加'); load();
    });
    $$('button[data-del]', el).forEach(b => b.addEventListener('click', async () => {
      if (!confirmDel()) return;
      await Supa.remove('links', [`id=eq.${b.dataset.del}`]);
      toast('已删除'); load();
    }));
    $$('button[data-save]', el).forEach(b => b.addEventListener('click', async () => {
      const tr = b.closest('tr');
      const body = {};
      $$('.edit-f', tr).forEach(f => body[f.dataset.k] = f.value.trim());
      body.sort = +body.sort || 0;
      await Supa.update('links', [`id=eq.${b.dataset.save}`], body);
      toast('已保存');
    }));
  }
  await load();
};

// ================= 文件管理（Supabase Storage） =================
VIEWS.files = async function () {
  const el = $('#admMain');
  el.innerHTML = '<div class="loading">加载中…</div>';
  let objects = [];
  try { objects = await Supa.storageList(BUCKET, 200); } catch (e) { }
  const totalSize = objects.reduce((a, b) => a + ((b.metadata && b.metadata.size) || 0), 0);
  el.innerHTML = `
    <div class="adm-h1">📦 文件管理 <span class="muted" style="font-size:14px;">共 ${objects.length} 个，占用 ${fmtSize(totalSize)}</span></div>
    <div class="panel">
      <div class="upload-zone" id="fUpload">📎 点击上传文件（存入 Supabase Storage）</div>
      <input type="file" id="fInput" style="display:none">
    </div>
    <div class="panel">
      <table class="tbl">
        <thead><tr><th>文件名</th><th>类型</th><th>大小</th><th>操作</th></tr></thead>
        <tbody>${objects.map(f => `
          <tr>
            <td>${escapeHtml(decodeURIComponent(f.name))}</td>
            <td class="muted">${escapeHtml((f.metadata && f.metadata.mimetype) || '')}</td>
            <td>${fmtSize((f.metadata && f.metadata.size) || 0)}</td>
            <td class="ops">
              <a class="mini-btn" href="${Supa.storagePublicUrl(BUCKET + '/' + f.name)}" target="_blank">查看</a>
              <button class="mini-btn" data-copy="${Supa.storagePublicUrl(BUCKET + '/' + f.name)}">复制链接</button>
              <button class="mini-btn danger" data-delpath="${f.name}">删除</button>
            </td>
          </tr>`).join('') || '<tr><td colspan="4" class="muted" style="text-align:center;padding:26px">暂无文件</td></tr>'}
        </tbody>
      </table>
    </div>`;
  $('#fUpload').addEventListener('click', () => $('#fInput').click());
  $('#fInput').addEventListener('change', async function () {
    const f = this.files[0]; if (!f) return;
    this.value = '';
    toast('上传中…');
    try { await uploadToStorage(f); toast('上传成功'); VIEWS.files(); }
    catch (e) { toast('上传失败：' + e.message, true); }
  });
  $$('button[data-copy]', el).forEach(b => b.addEventListener('click', () => {
    navigator.clipboard.writeText(b.dataset.copy).then(() => toast('链接已复制'));
  }));
  $$('button[data-delpath]', el).forEach(b => b.addEventListener('click', async () => {
    if (!confirmDel('删除该文件？引用它的内容将无法显示。')) return;
    try { await Supa.storageRemove(`${BUCKET}/${b.dataset.delpath}`); toast('已删除'); VIEWS.files(); }
    catch (e) { toast('删除失败：' + e.message, true); }
  }));
};

// ================= 设置 =================
VIEWS.settings = async function () {
  const el = $('#admMain');
  const rows = await Supa.select('settings', { select: 'key,value', limit: 100, auth: true });
  const s = {};
  rows.forEach(r => { s[r.key] = r.value; });
  el.innerHTML = `
    <div class="adm-h1">⚙️ 站点设置</div>
    <div class="panel">
      <h3>基本信息</h3>
      <div class="form-inline">
        <div class="form-row"><label>站点名称</label><input type="text" id="sName" value="${escapeHtml(s.site_name || '')}"></div>
        <div class="form-row"><label>副标题 / 个性签名</label><input type="text" id="sTagline" value="${escapeHtml(s.site_tagline || '')}"></div>
        <div class="form-row"><label>建站日期（运行时长起点）</label><input type="text" id="sStart" value="${escapeHtml(s.site_start || '')}" placeholder="2026-09-13"></div>
      </div>
      <button class="btn sm" id="sBasicSave">保存</button>
    </div>
    <div class="panel">
      <h3>关于我（Markdown）</h3>
      <div class="form-row"><textarea id="sAbout" rows="8">${escapeHtml(s.about_content || '')}</textarea></div>
      <button class="btn sm" id="sAboutSave">保存</button>
    </div>
    <div class="panel">
      <h3>私人空间访问码</h3>
      <p class="muted" style="margin-bottom:10px;font-size:13px;">修改后旧访问码立即失效，需重新输入。</p>
      <div class="form-row" style="max-width:320px;"><input type="text" id="sPrivateCode" placeholder="输入新的访问码（留空则不修改）"></div>
      <button class="btn sm" id="sPrivateSave">更新访问码</button>
    </div>
    <div class="panel">
      <h3>修改登录密码</h3>
      <p class="muted" style="margin-bottom:10px;font-size:13px;">即 Supabase Auth 账号密码，修改后需重新登录。</p>
      <div class="form-row" style="max-width:320px;"><input type="password" id="sNewPwd" placeholder="新密码（至少 6 位）"></div>
      <button class="btn sm" id="sPwdSave">修改密码</button>
    </div>`;

  async function saveSetting(key, value) {
    await Supa.upsert('settings', { key, value }, 'key');
  }
  $('#sBasicSave').addEventListener('click', async () => {
    await saveSetting('site_name', $('#sName').value.trim());
    await saveSetting('site_tagline', $('#sTagline').value.trim());
    await saveSetting('site_start', $('#sStart').value.trim());
    toast('已保存');
  });
  $('#sAboutSave').addEventListener('click', async () => {
    await saveSetting('about_content', $('#sAbout').value);
    toast('已保存');
  });
  $('#sPrivateSave').addEventListener('click', async () => {
    const v = $('#sPrivateCode').value.trim();
    if (!v) return toast('请输入新访问码', true);
    await saveSetting('private_code_hash', await sha256hex(v));
    $('#sPrivateCode').value = '';
    toast('访问码已更新');
  });
  $('#sPwdSave').addEventListener('click', async () => {
    const v = $('#sNewPwd').value;
    if (v.length < 6) return toast('密码至少 6 位', true);
    try {
      const token = await Supa.ensureToken();
      const res = await fetch(Supa.url + '/auth/v1/user', {
        method: 'PUT',
        headers: { 'apikey': Supa.key, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: v }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      $('#sNewPwd').value = '';
      toast('密码已修改，下次登录使用新密码');
    } catch (e) { toast('修改失败：' + e.message, true); }
  });
};

// ================= 启动 =================
$('#loginBtn').addEventListener('click', tryLogin);
$('#pwdInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
$('#emailInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#pwdInput').focus(); });
$('#logoutBtn').addEventListener('click', async () => { await Supa.signOut(); showLogin('已退出登录'); });

(function boot() {
  if (!checkConfig()) return;
  if (!Supa.hasSession) { showLogin(); return; }
  Supa.ensureToken().then(t => { if (t) showAdmin(); else showLogin('登录已过期，请重新登录'); });
})();
