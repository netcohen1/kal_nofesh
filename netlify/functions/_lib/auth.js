// ============================================================
// _lib/auth.js – אימות מפרסם בצד השרת
// ============================================================
// שני סוגי משתמשים:
//   1) Master  – username='admin', מאומת מול ADMIN_PASSWORD (env var)
//   2) Users   – נוסף ב-Blobs (kal-nofesh-data/users), עם hash+salt
// בהצלחה - מנפיקים טוקן חתום: "<ts>.<userId>.<hmac>"
// HMAC מבוסס SESSION_SECRET. תקף לשבוע.
// ============================================================

const crypto = require('crypto');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET חסר או קצר מדי. הגדירו אותו ב-Netlify env vars (לפחות 16 תווים).');
  }
  return s;
}

function signParts(ts, userId) {
  return crypto.createHmac('sha256', getSecret())
    .update(ts + '.' + userId)
    .digest('hex');
}

function issueToken(userId) {
  const ts = Date.now();
  return `${ts}.${userId}.${signParts(ts, userId)}`;
}

function parseToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const ts = parseInt(parts[0], 10);
  const userId = parts[1];
  const sig = parts[2];
  if (!Number.isFinite(ts) || !userId || !sig) return null;
  if (Date.now() - ts > TOKEN_TTL_MS) return null;
  const expected = signParts(ts, userId);
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return null;
  try {
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch { return null; }
  return { ts, userId };
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
function makePasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { salt, hash };
}
function verifyPasswordRecord(password, record) {
  if (!record || !record.salt || !record.hash) return false;
  const candidate = hashPassword(password, record.salt);
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(record.hash, 'utf8');
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}

function checkMasterPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('ADMIN_PASSWORD לא מוגדר ב-Netlify env vars.');
  }
  if (typeof input !== 'string' || input.length === 0) return false;
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getBearer(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m ? m[1].trim() : null;
}

// מחזיר את ה-userId המאומת, או זורק 401
function requireAuth(event) {
  const token = getBearer(event);
  const parsed = parseToken(token);
  if (!parsed) {
    const err = new Error('unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return parsed.userId;
}

const MASTER_USER_ID = 'master';

module.exports = {
  issueToken,
  parseToken,
  getBearer,
  requireAuth,
  checkMasterPassword,
  makePasswordRecord,
  verifyPasswordRecord,
  hashPassword,
  MASTER_USER_ID
};
