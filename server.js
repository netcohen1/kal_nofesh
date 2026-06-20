// ============================================================
// server.js – שרת Express יחיד לאתר קל נופש
// ============================================================
// מחליף את 8 ה-Netlify Functions בשרת אחד גלוי וניתן לעריכה.
// מגיש את הקבצים הסטטיים (index.html, css, js, pages) ומספק את
// ה-API תחת /api/*. הנתונים נשמרים בקבצים (server/store.js).
//
// משתני סביבה נדרשים:
//   ADMIN_PASSWORD  – סיסמת המנהל הראשי (username: admin)
//   SESSION_SECRET  – מחרוזת אקראית >= 16 תווים לחתימת טוקנים
//   PORT            – פורט (ברירת מחדל 3000; הפלטפורמה מזריקה אוטומטית)
//   DATA_DIR        – (אופציונלי) מיקום תיקיית הנתונים
// ============================================================

const path = require('path');
const express = require('express');

const store = require('./server/store');
const auth = require('./netlify/functions/_lib/auth');
const validate = require('./netlify/functions/_lib/validate');

const app = express();
app.use(express.json({ limit: '60mb' }));

// ---------- עזרי תגובה ----------
function fail(res, status, code, extra) {
  res.status(status).json({ error: code, ...(extra || {}) });
}
function requireAuth(req) {
  // auth.requireAuth מצפה ל-event עם headers; נספק מ-req
  return auth.requireAuth({ headers: req.headers });
}
function guard(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      if (e && (e.statusCode === 401 || e.message === 'unauthorized')) {
        return fail(res, 401, 'unauthorized');
      }
      console.error('API error:', e);
      fail(res, 500, 'internal_error');
    }
  };
}

const noStore = (res) => res.set('cache-control', 'no-store');

// ============================================================
// AUTH
// ============================================================
app.post('/api/login', guard(async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const password = req.body.password;
  if (!password) return fail(res, 400, 'missing_password');

  if (!username || username === 'admin') {
    if (!auth.checkMasterPassword(password)) return fail(res, 401, 'invalid_credentials');
    noStore(res);
    return res.json({
      token: auth.issueToken(auth.MASTER_USER_ID),
      user: { id: auth.MASTER_USER_ID, username: 'admin', name: 'מנהל ראשי', is_master: true }
    });
  }

  const users = await store.getJSON('users', []);
  const user = users.find((u) => (u.username || '').toLowerCase() === username);
  if (!user) return fail(res, 401, 'invalid_credentials');
  if (!auth.verifyPasswordRecord(password, { salt: user.salt, hash: user.hash })) {
    return fail(res, 401, 'invalid_credentials');
  }
  noStore(res);
  res.json({
    token: auth.issueToken(user.id),
    user: { id: user.id, username: user.username, name: user.name, email: user.email, is_master: false }
  });
}));

// ============================================================
// PUBLIC DATA
// ============================================================
app.get('/api/public-data', guard(async (req, res) => {
  const data = await store.getPublic();
  res.set('cache-control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
  res.json(data);
}));

// ============================================================
// ADMIN DATA (protected)
// ============================================================
app.get('/api/admin-data', guard(async (req, res) => {
  requireAuth(req);
  const all = await store.getAll();
  // לא חושפים hash/salt של משתמשים
  const safeUsers = (all.users || []).map((u) => ({
    id: u.id, username: u.username, name: u.name, email: u.email || '', is_master: !!u.is_master
  }));
  // המנהל הראשי מוצג כפריט קבוע
  const master = { id: auth.MASTER_USER_ID, username: 'admin', name: 'מנהל ראשי', email: '', is_master: true };
  noStore(res);
  res.json({
    properties: all.properties,
    types: all.types,
    cities: all.cities,
    image_categories: all.image_categories,
    users: [master, ...safeUsers],
    settings: all.settings,
    current_user: parseCurrentUser(req)
  });
}));

function parseCurrentUser(req) {
  try {
    const token = auth.getBearer({ headers: req.headers });
    const parsed = auth.parseToken(token);
    if (!parsed) return null;
    if (parsed.userId === auth.MASTER_USER_ID) return { id: auth.MASTER_USER_ID, username: 'admin', name: 'מנהל ראשי', is_master: true };
    return { id: parsed.userId };
  } catch { return null; }
}

// ============================================================
// PROPERTIES (protected)
// ============================================================
function cleanOccupied(arr) {
  if (!Array.isArray(arr)) return [];
  const re = /^\d{4}-\d{2}-\d{2}$/;
  return [...new Set(arr.filter((d) => typeof d === 'string' && re.test(d)))].sort();
}

function cleanPricingRules(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => {
    if (!r || typeof r !== 'object') return null;
    const price = Number(r.price);
    if (!Number.isFinite(price) || price < 0) return null;
    if (r.type === 'weekly') {
      const days = (r.days || []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      if (!days.length) return null;
      return { id: String(r.id || ''), type: 'weekly', name: String(r.name || '').slice(0, 80), days, price };
    }
    if (r.type === 'range') {
      const reDate = /^\d{4}-\d{2}-\d{2}$/;
      if (!reDate.test(r.from) || !reDate.test(r.to) || r.to < r.from) return null;
      return { id: String(r.id || ''), type: 'range', name: String(r.name || '').slice(0, 80), from: r.from, to: r.to, price };
    }
    return null;
  }).filter(Boolean);
}

function cleanProperty(p) {
  const phone = validate.normPhone(p.phone || p.whatsapp);
  const onRequest = p.pricing_mode === 'on_request';
  return {
    id: p.id,
    name: String(p.name || '').trim(),
    type_id: p.type_id,
    region_id: typeof p.region_id === 'string' ? p.region_id : null,
    city_id: p.city_id,
    neighborhood: (p.neighborhood || '').trim() || null,
    pricing_mode: onRequest ? 'on_request' : 'fixed',
    base_price: onRequest ? 0 : Number(p.base_price ?? p.price_per_night),
    pricing_rules: onRequest ? [] : cleanPricingRules(p.pricing_rules),
    rooms: p.rooms === '' || p.rooms == null ? null : Number(p.rooms),
    beds:  p.beds  === '' || p.beds  == null ? null : Number(p.beds),
    max_guests: p.max_guests === '' || p.max_guests == null ? null : Number(p.max_guests),
    is_featured: !!p.is_featured,
    description: (p.description || '').trim(),
    images: Array.isArray(p.images) ? p.images : [],
    occupied_dates: cleanOccupied(p.occupied_dates),
    services: Array.isArray(p.services) ? p.services.filter((s) => typeof s === 'string').slice(0, 100) : [],
    location_address: (p.location_address || '').toString().trim().slice(0, 200) || null,
    phone,
    whatsapp: phone,
    status: p.status === 'published' ? 'published' : 'draft',
    created_at: p.created_at || Date.now(),
    updated_at: Date.now()
  };
}

app.post('/api/properties', guard(async (req, res) => {
  requireAuth(req);
  const all = await store.getAll();
  const lists = { types: all.types, cities: all.cities };
  const p = cleanProperty({ ...req.body, id: store.newId(), created_at: Date.now() });
  const errors = validate.validateProperty(p, lists);
  if (errors.length) return fail(res, 400, 'validation', { fields: errors });
  await store.setJSON('properties', [...all.properties, p]);
  noStore(res);
  res.json({ property: p });
}));

app.put('/api/properties', guard(async (req, res) => {
  requireAuth(req);
  if (!req.body.id) return fail(res, 400, 'missing_id');
  const all = await store.getAll();
  const existing = all.properties.find((x) => x.id === req.body.id);
  if (!existing) return fail(res, 404, 'not_found');
  const p = cleanProperty({ ...existing, ...req.body, id: existing.id, created_at: existing.created_at });
  const errors = validate.validateProperty(p, { types: all.types, cities: all.cities });
  if (errors.length) return fail(res, 400, 'validation', { fields: errors });
  await store.setJSON('properties', all.properties.map((x) => (x.id === p.id ? p : x)));
  noStore(res);
  res.json({ property: p });
}));

app.delete('/api/properties', guard(async (req, res) => {
  requireAuth(req);
  if (!req.body.id) return fail(res, 400, 'missing_id');
  const all = await store.getAll();
  const target = all.properties.find((x) => x.id === req.body.id);
  if (!target) return fail(res, 404, 'not_found');
  await store.setJSON('properties', all.properties.filter((x) => x.id !== req.body.id));
  (target.images || []).forEach((img) => { if (img && img.key) store.deleteImage(img.key); });
  noStore(res);
  res.json({ deleted: req.body.id });
}));

// ============================================================
// LISTS: types / cities / image_categories (protected)
// ============================================================
const LIST_KINDS = ['types', 'cities', 'image_categories'];

function refField(kind) {
  if (kind === 'types') return 'type_id';
  if (kind === 'cities') return 'city_id';
  return null;
}

async function detachFromProperties(kind, removedId, all) {
  if (kind === 'image_categories') {
    let changed = false;
    const updated = all.properties.map((p) => {
      const imgs = p.images || [];
      let hit = false;
      const next = imgs.map((im) => (im && im.category_id === removedId ? (hit = true, { ...im, category_id: null }) : im));
      return hit ? (changed = true, { ...p, images: next }) : p;
    });
    if (changed) await store.setJSON('properties', updated);
    return;
  }
  const field = refField(kind);
  let changed = false;
  const updated = all.properties.map((p) => (p[field] === removedId ? (changed = true, { ...p, [field]: null, status: 'draft' }) : p));
  if (changed) await store.setJSON('properties', updated);
}

function cleanListItem(kind, item) {
  const base = { id: item.id, name: String(item.name || '').trim() };
  if (kind === 'cities') base.region_id = (typeof item.region_id === 'string' && item.region_id) ? item.region_id : null;
  return base;
}

app.post('/api/lists', guard(async (req, res) => {
  requireAuth(req);
  const kind = req.body.kind;
  if (!LIST_KINDS.includes(kind)) return fail(res, 400, 'invalid_kind');
  const list = await store.getJSON(kind, []);
  const item = cleanListItem(kind, { ...req.body.item, id: store.newId() });
  if (validate.validateListItem(item).length) return fail(res, 400, 'validation');
  if (list.find((x) => x.name === item.name)) return fail(res, 409, 'duplicate');
  await store.setJSON(kind, [...list, item]);
  noStore(res);
  res.json({ item });
}));

app.put('/api/lists', guard(async (req, res) => {
  requireAuth(req);
  const kind = req.body.kind;
  if (!LIST_KINDS.includes(kind)) return fail(res, 400, 'invalid_kind');
  if (!req.body.item || !req.body.item.id) return fail(res, 400, 'missing_id');
  const list = await store.getJSON(kind, []);
  const existing = list.find((x) => x.id === req.body.item.id);
  if (!existing) return fail(res, 404, 'not_found');
  const item = cleanListItem(kind, { ...existing, ...req.body.item });
  if (validate.validateListItem(item).length) return fail(res, 400, 'validation');
  await store.setJSON(kind, list.map((x) => (x.id === item.id ? item : x)));
  noStore(res);
  res.json({ item });
}));

app.delete('/api/lists', guard(async (req, res) => {
  requireAuth(req);
  const kind = req.body.kind;
  if (!LIST_KINDS.includes(kind)) return fail(res, 400, 'invalid_kind');
  if (!req.body.id) return fail(res, 400, 'missing_id');
  const list = await store.getJSON(kind, []);
  if (!list.find((x) => x.id === req.body.id)) return fail(res, 404, 'not_found');
  await store.setJSON(kind, list.filter((x) => x.id !== req.body.id));
  await detachFromProperties(kind, req.body.id, await store.getAll());
  noStore(res);
  res.json({ deleted: req.body.id });
}));

// ============================================================
// SETTINGS (protected)
// ============================================================
app.put('/api/settings', guard(async (req, res) => {
  requireAuth(req);
  const current = { ...store.DEFAULT_SETTINGS, ...(await store.getJSON('settings', {})) };
  const next = {
    currency: String(req.body.currency || current.currency).trim() || '₪',
    price_min: Number(req.body.price_min ?? current.price_min),
    price_max: Number(req.body.price_max ?? current.price_max),
    publish_whatsapp: validate.normPhone(req.body.publish_whatsapp || '')
  };
  const errs = validate.validateSettings(next);
  if (errs.length) return fail(res, 400, 'validation', { fields: errs });
  await store.setJSON('settings', next);
  noStore(res);
  res.json({ settings: next });
}));

// ============================================================
// USERS (protected)
// ============================================================
function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name, email: u.email || '', is_master: !!u.is_master };
}

app.post('/api/users', guard(async (req, res) => {
  requireAuth(req);
  const users = await store.getJSON('users', []);
  const username = String(req.body.username || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const password = req.body.password;
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return fail(res, 400, 'invalid_username');
  if (username === 'admin') return fail(res, 400, 'reserved_username');
  if (!validate.isStr(name, { max: 80 })) return fail(res, 400, 'invalid_name');
  if (!validate.isStr(password || '', { min: 6, max: 200 })) return fail(res, 400, 'weak_password');
  if (users.find((u) => (u.username || '').toLowerCase() === username)) return fail(res, 409, 'duplicate');
  const rec = auth.makePasswordRecord(password);
  const user = { id: store.newId(), username, name, email, salt: rec.salt, hash: rec.hash, created_at: Date.now() };
  await store.setJSON('users', [...users, user]);
  noStore(res);
  res.json({ user: publicUser(user) });
}));

app.put('/api/users', guard(async (req, res) => {
  requireAuth(req);
  if (!req.body.id) return fail(res, 400, 'missing_id');
  const users = await store.getJSON('users', []);
  const idx = users.findIndex((u) => u.id === req.body.id);
  if (idx < 0) return fail(res, 404, 'not_found');
  const updated = {
    ...users[idx],
    name: validate.isStr(req.body.name, { max: 80 }) ? req.body.name.trim() : users[idx].name,
    email: typeof req.body.email === 'string' ? req.body.email.trim() : users[idx].email
  };
  const next = [...users]; next[idx] = updated;
  await store.setJSON('users', next);
  noStore(res);
  res.json({ user: publicUser(updated) });
}));

app.delete('/api/users', guard(async (req, res) => {
  requireAuth(req);
  if (!req.body.id) return fail(res, 400, 'missing_id');
  const users = await store.getJSON('users', []);
  if (!users.find((u) => u.id === req.body.id)) return fail(res, 404, 'not_found');
  await store.setJSON('users', users.filter((u) => u.id !== req.body.id));
  noStore(res);
  res.json({ deleted: req.body.id });
}));

app.post('/api/change-password', guard(async (req, res) => {
  requireAuth(req);
  if (!req.body.userId) return fail(res, 400, 'missing_id');
  if (req.body.userId === auth.MASTER_USER_ID) return fail(res, 400, 'master_password_via_env');
  if (!validate.isStr(req.body.newPassword || '', { min: 6, max: 200 })) return fail(res, 400, 'weak_password');
  const users = await store.getJSON('users', []);
  const idx = users.findIndex((u) => u.id === req.body.userId);
  if (idx < 0) return fail(res, 404, 'not_found');
  const rec = auth.makePasswordRecord(req.body.newPassword);
  const next = [...users]; next[idx] = { ...next[idx], salt: rec.salt, hash: rec.hash };
  await store.setJSON('users', next);
  noStore(res);
  res.json({ updated: req.body.userId });
}));

// ============================================================
// UPLOAD + IMAGE
// ============================================================
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']);
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const MAX_IMG = 5 * 1024 * 1024;
const MAX_VID = 50 * 1024 * 1024;

app.post('/api/upload', guard(async (req, res) => {
  requireAuth(req);
  const contentType = String(req.body.contentType || '').toLowerCase();
  if (!ALLOWED.has(contentType)) return fail(res, 415, 'unsupported_type');
  if (!req.body.dataBase64) return fail(res, 400, 'missing_data');
  const buf = Buffer.from(req.body.dataBase64, 'base64');
  if (!buf.length) return fail(res, 400, 'empty_file');
  const isVideo = /^video\//.test(contentType);
  if (buf.length > (isVideo ? MAX_VID : MAX_IMG)) return fail(res, 413, 'too_large');
  const key = `${store.newId()}.${EXT[contentType]}`;
  store.saveImage(key, buf, contentType);
  noStore(res);
  res.json({ key, url: `/api/image?key=${encodeURIComponent(key)}`, contentType });
}));

app.get('/api/image', (req, res) => {
  const key = req.query.key;
  if (!key || /[^A-Za-z0-9._-]/.test(key)) return res.status(400).send('bad_key');
  const blob = store.readImage(key);
  if (!blob) return res.status(404).send('not_found');
  res.set('content-type', blob.contentType);
  res.set('cache-control', 'public, max-age=31536000, immutable');
  res.send(blob.data);
});

// ============================================================
// STATIC FILES (frontend)
// ============================================================
const ROOT = __dirname;
app.use(express.static(ROOT, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    // HTML/CSS/JS - תמיד לאמת מול השרת כדי שלא ייתקע cache ישן אחרי עדכון
    if (/\.(html|css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// כל שאר הנתיבים → index.html לא נדרש (אתר רב-עמודי), אבל ניתן fallback
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3000;

(async () => {
  // טעינת נתונים מהמקור (גיטהאב או דיסק) לפני שמתחילים להגיש
  try { await store.init(); }
  catch (e) { console.error('אתחול אחסון נכשל:', e.message); }

  app.listen(PORT, () => {
    console.log(`קל נופש – שרת רץ על פורט ${PORT}`);
    console.log(`אחסון: ${store.USE_GITHUB ? 'GitHub (נתונים בריפו)' : 'קבצים מקומיים'} · ${store.DATA_DIR}`);
    if (!process.env.ADMIN_PASSWORD) console.warn('אזהרה: ADMIN_PASSWORD לא מוגדר - התחברות מנהל תיכשל.');
    if (!process.env.SESSION_SECRET) console.warn('אזהרה: SESSION_SECRET לא מוגדר - התחברות תיכשל.');
  });
})();
