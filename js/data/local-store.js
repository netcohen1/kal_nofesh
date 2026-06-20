// ============================================================
// js/data/local-store.js – אחסון מקומי לצורכי פיתוח/בדיקה
// ============================================================
// נכנס לפעולה כש-API לא זמין (file:// או שרת ללא Functions).
// משכפל את התנהגות ה-Backend מול localStorage.
// במצב הזה הסיסמה היא DEMO_PASSWORD למטה.
// ============================================================

(function () {
  const KEY = 'kn_local_data_v1';
  const DEMO_PASSWORD = 'demo';
  const TOKEN_PREFIX  = 'local:';

  function getRaw() {
    try {
      const s = localStorage.getItem(KEY);
      if (!s) return null;
      return JSON.parse(s);
    } catch { return null; }
  }

  function defaults() {
    return {
      properties: [],
      types: [],
      cities: [],
      image_categories: [],
      users:    [{ id: 'u-admin-default', username: 'admin', name: 'מנהל ראשי', email: '', salt: '', hash: '__demo__', is_master: true }],
      settings: { currency: '₪', publish_whatsapp: '' }
    };
  }

  function ensure() {
    let d = getRaw();
    if (!d) { d = defaults(); save(d); return d; }
    // merge missing keys (forward compatibility)
    const def = defaults();
    Object.keys(def).forEach((k) => { if (d[k] === undefined) d[k] = def[k]; });
    return d;
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.warn('local store save failed', e); }
  }

  function newId() {
    return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function isToken(t) { return typeof t === 'string' && t.startsWith(TOKEN_PREFIX); }

  // ============================================================
  // public API (mirrors network endpoints)
  // ============================================================

  async function publicData() {
    const d = ensure();
    return {
      properties: d.properties.filter((p) => p.status === 'published'),
      types: d.types,
      cities: d.cities,
      image_categories: d.image_categories || [],
      settings: d.settings
    };
  }

  async function login(password) {
    if (password !== DEMO_PASSWORD) {
      const err = new Error('invalid_password'); err.status = 401; throw err;
    }
    return { token: TOKEN_PREFIX + Date.now(), user: { username: 'demo', name: 'מצב פיתוח' } };
  }

  async function adminData(token) {
    requireAuth(token);
    const d = ensure();
    // לא להחזיר hash/salt לצד הלקוח
    const safeUsers = (d.users || []).map((u) => ({
      id: u.id, username: u.username, name: u.name, email: u.email, is_master: !!u.is_master
    }));
    return {
      properties: d.properties,
      types: d.types,
      cities: d.cities,
      image_categories: d.image_categories || [],
      users: safeUsers,
      settings: d.settings,
      current_user: { username: 'demo', name: 'מצב פיתוח' }
    };
  }

  function requireAuth(token) {
    if (!isToken(token)) {
      const err = new Error('unauthorized'); err.status = 401; throw err;
    }
  }

  function cleanProperty(p) {
    const phone = String(p.phone || p.whatsapp || '').replace(/\D/g, '');
    const onRequest = p.pricing_mode === 'on_request';
    return {
      id: p.id,
      name: String(p.name || '').trim(),
      type_id: p.type_id,
      region_id: p.region_id || null,
      city_id: p.city_id,
      neighborhood: (p.neighborhood || '').trim() || null,
      pricing_mode: onRequest ? 'on_request' : 'fixed',
      base_price: onRequest ? 0 : Number(p.base_price ?? p.price_per_night),
      pricing_rules: onRequest ? [] : (Array.isArray(p.pricing_rules) ? p.pricing_rules : []),
      rooms: p.rooms === '' || p.rooms == null ? null : Number(p.rooms),
      beds: p.beds === '' || p.beds == null ? null : Number(p.beds),
      max_guests: p.max_guests === '' || p.max_guests == null ? null : Number(p.max_guests),
      is_featured: !!p.is_featured,
      description: (p.description || '').trim(),
      images: Array.isArray(p.images) ? p.images : [],
      occupied_dates: Array.isArray(p.occupied_dates) ? p.occupied_dates : [],
      services: Array.isArray(p.services) ? p.services : [],
      location_address: (p.location_address || '').trim() || null,
      phone,
      whatsapp: phone,
      status: p.status === 'published' ? 'published' : 'draft',
      created_at: p.created_at || Date.now(),
      updated_at: Date.now()
    };
  }

  async function createProperty(token, p) {
    requireAuth(token);
    const d = ensure();
    const clean = cleanProperty({ ...p, id: newId(), created_at: Date.now() });
    d.properties.push(clean);
    save(d);
    return { property: clean };
  }
  async function updateProperty(token, p) {
    requireAuth(token);
    const d = ensure();
    const idx = d.properties.findIndex((x) => x.id === p.id);
    if (idx < 0) { const err = new Error('not_found'); err.status = 404; throw err; }
    const merged = cleanProperty({ ...d.properties[idx], ...p, id: d.properties[idx].id, created_at: d.properties[idx].created_at });
    d.properties[idx] = merged;
    save(d);
    return { property: merged };
  }
  async function deleteProperty(token, id) {
    requireAuth(token);
    const d = ensure();
    d.properties = d.properties.filter((x) => x.id !== id);
    save(d);
    return { deleted: id };
  }

  async function createListItem(token, kind, item) {
    requireAuth(token);
    if (!['types', 'cities', 'image_categories'].includes(kind)) {
      const err = new Error('invalid_kind'); err.status = 400; throw err;
    }
    const d = ensure();
    const list = d[kind] || [];
    if (list.find((x) => x.name === (item.name || '').trim())) {
      const err = new Error('duplicate'); err.status = 409; throw err;
    }
    const obj = { id: newId(), name: String(item.name || '').trim() };
    if (kind === 'cities') obj.region_id = item.region_id || null;
    list.push(obj);
    d[kind] = list;
    save(d);
    return { item: obj };
  }
  async function updateListItem(token, kind, item) {
    requireAuth(token);
    const d = ensure();
    const list = d[kind] || [];
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx < 0) { const err = new Error('not_found'); err.status = 404; throw err; }
    list[idx] = { ...list[idx], ...item, name: String(item.name || list[idx].name).trim() };
    if (kind === 'cities') list[idx].region_id = item.region_id || null;
    save(d);
    return { item: list[idx] };
  }
  async function deleteListItem(token, kind, id) {
    requireAuth(token);
    const d = ensure();
    d[kind] = (d[kind] || []).filter((x) => x.id !== id);
    if (kind === 'image_categories') {
      d.properties = d.properties.map((p) => ({
        ...p,
        images: (p.images || []).map((im) => im && im.category_id === id ? { ...im, category_id: null } : im)
      }));
    } else {
      const field = kind === 'types' ? 'type_id' : 'city_id';
      d.properties = d.properties.map((p) => p[field] === id ? { ...p, [field]: null, status: 'draft' } : p);
    }
    save(d);
    return { deleted: id };
  }

  async function updateSettings(token, s) {
    requireAuth(token);
    const d = ensure();
    d.settings = {
      currency: (s.currency || d.settings.currency || '₪').toString().trim(),
      price_min: Number(s.price_min),
      price_max: Number(s.price_max),
      publish_whatsapp: String(s.publish_whatsapp || '').replace(/\D/g, '')
    };
    save(d);
    return { settings: d.settings };
  }

  async function uploadImage(token, file) {
    requireAuth(token);
    // במצב מקומי: שומרים כ-data URL ב-localStorage (לא אידאלי לתמונות גדולות)
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('read_failed'));
      r.readAsDataURL(file);
    });
    const key = newId();
    return { key, url: dataUrl, contentType: file.type };
  }

  // users CRUD (local stubs - מאחר ובמצב פיתוח יש משתמש אחד)
  async function createUser(token, u) {
    requireAuth(token);
    const d = ensure();
    const obj = { id: newId(), username: String(u.username || '').trim(), name: String(u.name || '').trim(), email: String(u.email || '').trim(), is_master: false };
    d.users.push(obj);
    save(d);
    return { user: { id: obj.id, username: obj.username, name: obj.name, email: obj.email, is_master: false } };
  }
  async function updateUser(token, u) {
    requireAuth(token);
    const d = ensure();
    const idx = d.users.findIndex((x) => x.id === u.id);
    if (idx < 0) { const err = new Error('not_found'); err.status = 404; throw err; }
    d.users[idx] = { ...d.users[idx], name: u.name ?? d.users[idx].name, email: u.email ?? d.users[idx].email };
    save(d);
    const x = d.users[idx];
    return { user: { id: x.id, username: x.username, name: x.name, email: x.email, is_master: !!x.is_master } };
  }
  async function deleteUser(token, id) {
    requireAuth(token);
    const d = ensure();
    d.users = d.users.filter((x) => x.id !== id);
    save(d);
    return { deleted: id };
  }
  async function changePassword(token, payload) {
    requireAuth(token);
    return { ok: true, note: 'במצב פיתוח לא משנים סיסמאות.' };
  }

  // ============================================================
  // exports
  // ============================================================
  window.KN = window.KN || {};
  window.KN.local = {
    DEMO_PASSWORD,
    isToken,
    reset: () => { try { localStorage.removeItem(KEY); } catch {} },
    publicData,
    login,
    adminData,
    createProperty,
    updateProperty,
    deleteProperty,
    createListItem,
    updateListItem,
    deleteListItem,
    updateSettings,
    uploadImage,
    createUser,
    updateUser,
    deleteUser,
    changePassword
  };
})();
