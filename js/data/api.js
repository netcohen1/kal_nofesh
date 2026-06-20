// ============================================================
// js/data/api.js – Client API (עם fallback ל-localStorage)
// ============================================================
// בשלב הקריאה הראשונה לכל endpoint - אם נחזרה שגיאת רשת,
// העברה אוטומטית למצב local דרך window.KN.local.
// במצב local, הסיסמה היא 'demo' (KN.local.DEMO_PASSWORD).
// ============================================================

(function () {
  const TOKEN_KEY = 'kn_admin_token';
  let mode = 'auto'; // 'auto' | 'remote' | 'local'

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); }
    catch { return null; }
  }
  function setToken(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch {} }
  function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch {} }

  function isLocalToken(t) {
    return window.KN.local && window.KN.local.isToken(t);
  }

  function detectModeFromToken() {
    const t = getToken();
    if (t && isLocalToken(t)) mode = 'local';
  }
  detectModeFromToken();

  async function fetchJson(path, opts = {}) {
    const headers = { 'content-type': 'application/json' };
    if (opts.auth) {
      const t = getToken();
      if (!t) throw new ApiError(401, 'unauthorized');
      headers.authorization = `Bearer ${t}`;
    }
    const init = { method: opts.method || 'GET', headers };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    let res;
    try {
      res = await fetch(path, init);
    } catch (e) {
      throw new ApiError(0, 'network');
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch {}
    }
    if (!res.ok) {
      if (res.status === 401) clearToken();
      throw new ApiError(res.status, (data && data.error) || 'error', data);
    }
    return data;
  }

  class ApiError extends Error {
    constructor(status, code, data) {
      super(code);
      this.status = status;
      this.code = code;
      this.data = data;
    }
  }

  function isRemoteFailure(err) {
    // network OR 404 (endpoint missing - לא נטפלי) → fallback מקומי
    return err && (err.code === 'network' || err.status === 0 || err.status === 404);
  }

  // ============================================================
  // wrapper: מנסה רשת, נופל למקומי אם רשת לא זמינה
  // ============================================================
  async function withFallback(remoteFn, localFn) {
    if (mode === 'local') return localFn();
    try {
      const r = await remoteFn();
      mode = 'remote';
      return r;
    } catch (e) {
      if (isRemoteFailure(e)) {
        mode = 'local';
        showLocalBanner();
        return localFn();
      }
      throw e;
    }
  }

  function showLocalBanner() {
    if (document.querySelector('.dev-banner')) return;
    if (!document.body) return;
    const div = document.createElement('div');
    div.className = 'dev-banner';
    div.textContent = 'מצב פיתוח מקומי - הנתונים נשמרים בדפדפן הזה בלבד. סיסמת המפרסם: demo';
    document.body.prepend(div);
  }

  // ============================================================
  // public methods
  // ============================================================
  const api = {
    ApiError,
    getToken,
    setToken,
    clearToken,
    isLoggedIn: () => !!getToken(),
    getMode: () => mode,

    getPublicData: () => withFallback(
      () => fetchJson('/api/public-data'),
      () => window.KN.local.publicData()
    ),

    login: (password, username) => withFallback(
      () => fetchJson('/api/login', { method: 'POST', body: { password, username: username || undefined } }).then((r) => { setToken(r.token); return r; }),
      () => window.KN.local.login(password).then((r) => { setToken(r.token); return r; })
    ),

    logout: () => { clearToken(); mode = 'auto'; },

    getAdminData: () => withFallback(
      () => fetchJson('/api/admin-data', { auth: true }),
      () => window.KN.local.adminData(getToken())
    ),

    createProperty: (p) => withFallback(
      () => fetchJson('/api/properties', { method: 'POST', body: p, auth: true }),
      () => window.KN.local.createProperty(getToken(), p)
    ),
    updateProperty: (p) => withFallback(
      () => fetchJson('/api/properties', { method: 'PUT', body: p, auth: true }),
      () => window.KN.local.updateProperty(getToken(), p)
    ),
    deleteProperty: (id) => withFallback(
      () => fetchJson('/api/properties', { method: 'DELETE', body: { id }, auth: true }),
      () => window.KN.local.deleteProperty(getToken(), id)
    ),

    createListItem: (kind, item) => withFallback(
      () => fetchJson('/api/lists', { method: 'POST', body: { kind, item }, auth: true }),
      () => window.KN.local.createListItem(getToken(), kind, item)
    ),
    updateListItem: (kind, item) => withFallback(
      () => fetchJson('/api/lists', { method: 'PUT', body: { kind, item }, auth: true }),
      () => window.KN.local.updateListItem(getToken(), kind, item)
    ),
    deleteListItem: (kind, id) => withFallback(
      () => fetchJson('/api/lists', { method: 'DELETE', body: { kind, id }, auth: true }),
      () => window.KN.local.deleteListItem(getToken(), kind, id)
    ),

    updateSettings: (s) => withFallback(
      () => fetchJson('/api/settings', { method: 'PUT', body: s, auth: true }),
      () => window.KN.local.updateSettings(getToken(), s)
    ),

    uploadImage: async (file) => {
      // ננסה רשת - אם נופל, מקומי
      if (mode === 'local') return window.KN.local.uploadImage(getToken(), file);
      const dataBase64 = await fileToBase64(file);
      try {
        const r = await fetchJson('/api/upload', {
          method: 'POST',
          body: { name: file.name, contentType: file.type, dataBase64 },
          auth: true
        });
        mode = 'remote';
        return r;
      } catch (e) {
        if (isRemoteFailure(e)) {
          mode = 'local';
          showLocalBanner();
          return window.KN.local.uploadImage(getToken(), file);
        }
        throw e;
      }
    },

    // users
    createUser: (u) => withFallback(
      () => fetchJson('/api/users', { method: 'POST', body: u, auth: true }),
      () => window.KN.local.createUser(getToken(), u)
    ),
    updateUser: (u) => withFallback(
      () => fetchJson('/api/users', { method: 'PUT', body: u, auth: true }),
      () => window.KN.local.updateUser(getToken(), u)
    ),
    deleteUser: (id) => withFallback(
      () => fetchJson('/api/users', { method: 'DELETE', body: { id }, auth: true }),
      () => window.KN.local.deleteUser(getToken(), id)
    ),
    changePassword: (payload) => withFallback(
      () => fetchJson('/api/change-password', { method: 'POST', body: payload, auth: true }),
      () => window.KN.local.changePassword(getToken(), payload)
    )
  };

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = r.result;
        const idx = s.indexOf(',');
        resolve(idx >= 0 ? s.slice(idx + 1) : s);
      };
      r.onerror = () => reject(new Error('read_failed'));
      r.readAsDataURL(file);
    });
  }

  window.KN = window.KN || {};
  window.KN.api = api;
})();
