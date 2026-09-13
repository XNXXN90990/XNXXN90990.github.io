// js/supa.js — Supabase REST/Auth/Storage 轻封装（零依赖，直接对接 GitHub Pages 静态站）
'use strict';

const Supa = {
  url: '',
  key: '',

  init() {
    const cfg = window.NING_CONFIG || {};
    this.url = String(cfg.SUPABASE_URL || '').replace(/\/+$/, '');
    this.key = String(cfg.SUPABASE_ANON_KEY || '');
    return !!(this.url && this.key);
  },
  get configured() { return !!(this.url && this.key); },

  // ---------- Auth ----------
  _saveSession(d) {
    localStorage.setItem('nb_at', d.access_token || '');
    localStorage.setItem('nb_rt', d.refresh_token || '');
    localStorage.setItem('nb_exp', String((d.expires_in || 3600) + Math.floor(Date.now() / 1000)));
    if (d.user && d.user.email) localStorage.setItem('nb_email', d.user.email);
  },
  get accessToken() { return localStorage.getItem('nb_at') || ''; },
  get userEmail() { return localStorage.getItem('nb_email') || ''; },
  get hasSession() { return !!localStorage.getItem('nb_rt'); },

  async signIn(email, password) {
    const r = await this._fetch('/auth/v1/token?grant_type=password', {
      method: 'POST', body: { email, password }, auth: false,
    });
    this._saveSession(r);
    return r;
  },
  async signOut() {
    try { await this._fetch('/auth/v1/logout', { method: 'POST' }); } catch {}
    ['nb_at', 'nb_rt', 'nb_exp', 'nb_email'].forEach(k => localStorage.removeItem(k));
  },
  // 保证 access_token 有效（过期前 60s 自动刷新）
  async ensureToken() {
    const at = localStorage.getItem('nb_at');
    const exp = parseInt(localStorage.getItem('nb_exp') || '0', 10);
    if (at && exp - 60 > Date.now() / 1000) return at;
    const rt = localStorage.getItem('nb_rt');
    if (!rt) return null;
    try {
      const r = await this._fetch('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', body: { refresh_token: rt }, auth: false,
      });
      this._saveSession(r);
      return r.access_token;
    } catch {
      return null;
    }
  },

  // ---------- REST ----------
  async _fetch(path, opts) {
    opts = opts || {};
    const headers = {
      'apikey': this.key,
      'Content-Type': 'application/json',
    };
    if (opts.auth !== false) {
      const t = opts.token || this.accessToken;
      if (t) headers['Authorization'] = 'Bearer ' + t;
    }
    if (opts.prefer) headers['Prefer'] = opts.prefer;
    Object.assign(headers, opts.headers);
    const res = await fetch(this.url + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.rawBody != null ? opts.rawBody : (opts.body != null ? JSON.stringify(opts.body) : undefined),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error_description || data.error || data.hint)) || ('HTTP ' + res.status);
      const e = new Error(msg);
      e.status = res.status;
      throw e;
    }
    return { data, res, text };
  },

  // 通用数据表操作：auth=true 时带登录令牌（管理端），false 时匿名（前台）
  async select(table, { select, filters, order, limit, offset, auth, count } = {}) {
    let qs = [];
    if (select) qs.push('select=' + encodeURIComponent(select));
    (filters || []).forEach(f => qs.push(encodeURIComponent(f)));
    if (order) qs.push('order=' + encodeURIComponent(order));
    if (limit != null) qs.push('limit=' + limit);
    if (offset != null) qs.push('offset=' + offset);
    const token = auth ? (await this.ensureToken()) : null;
    const r = await this._fetch('/rest/v1/' + table + (qs.length ? '?' + qs.join('&') : ''), {
      method: 'GET',
      prefer: count ? 'count=exact' : undefined,
      token: token || undefined,
    });
    return r.data || [];
  },
  // 带 total 的列表查询
  async selectPage(table, opts) {
    const rows = await this.select(table, Object.assign({}, opts, { count: true }));
    return rows;
  },
  async countRows(table, filters, auth) {
    let qs = ['select=id', 'limit=1'];
    (filters || []).forEach(f => qs.push(encodeURIComponent(f)));
    const token = auth ? (await this.ensureToken()) : null;
    const r = await this._fetch('/rest/v1/' + table + '?' + qs.join('&'), {
      method: 'GET', prefer: 'count=exact', token: token || undefined,
    });
    const range = r.res.headers.get('content-range'); // "0-0/123" 或 "*/*"
    if (!range) return 0;
    const total = range.split('/')[1];
    return total === '*' ? 0 : (parseInt(total, 10) || 0);
  },
  async insert(table, body, auth) {
    const token = auth ? (await this.ensureToken()) : null;
    const r = await this._fetch('/rest/v1/' + table, {
      method: 'POST', body, prefer: 'return=representation', token: token || undefined,
    });
    return Array.isArray(r.data) ? r.data[0] : r.data;
  },
  async update(table, filters, body) {
    const token = await this.ensureToken();
    let qs = (filters || []).map(f => encodeURIComponent(f)).join('&');
    await this._fetch('/rest/v1/' + table + '?' + qs, { method: 'PATCH', body, prefer: 'return=minimal', token });
  },
  async remove(table, filters) {
    const token = await this.ensureToken();
    let qs = (filters || []).map(f => encodeURIComponent(f)).join('&');
    await this._fetch('/rest/v1/' + table + '?' + qs, { method: 'DELETE', token });
  },
  async upsert(table, body, onConflict) {
    const token = await this.ensureToken();
    const qs = onConflict ? '?on_conflict=' + encodeURIComponent(onConflict) : '';
    await this._fetch('/rest/v1/' + table + qs, {
      method: 'POST', body, prefer: 'resolution=merge-duplicates', token,
    });
  },
  async rpc(fn, params, auth) {
    const token = auth ? (await this.ensureToken()) : null;
    const r = await this._fetch('/rest/v1/rpc/' + fn, { method: 'POST', body: params || {}, token: token || undefined });
    return r.data;
  },

  // ---------- Storage ----------
  storagePublicUrl(path) {
    return `${this.url}/storage/v1/object/public/${path}`;
  },
  async storageUpload(path, blob, mime) {
    const token = await this.ensureToken();
    if (!token) throw new Error('未登录');
    const r = await this._fetch('/storage/v1/object/' + path, {
      method: 'POST',
      rawBody: blob,
      headers: {
        'Content-Type': mime || 'application/octet-stream',
        'x-upsert': 'true',
        'Authorization': 'Bearer ' + token,
      },
    });
    return r.data;
  },
  async storageList(bucket, limit) {
    const token = await this.ensureToken();
    if (!token) throw new Error('未登录');
    const r = await this._fetch(`/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      body: { prefix: '', limit: limit || 200, offset: 0, sortBy: { column: 'created_at', order: 'desc' } },
      token,
    });
    return r.data || [];
  },
  async storageRemove(path) {
    const token = await this.ensureToken();
    await this._fetch('/storage/v1/object/' + path, { method: 'DELETE', token });
  },
};
