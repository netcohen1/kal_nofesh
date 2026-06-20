// ============================================================
// server/store.js – אחסון נתונים
// ============================================================
// שני מצבים:
//   1) LOCAL  – קבצים על הדיסק (פיתוח, או שרת עם דיסק קבוע).
//   2) GITHUB – הנתונים נשמרים בענף נפרד בריפו ב-GitHub.
//              נבחר אוטומטית כש-GITHUB_TOKEN + GITHUB_REPO מוגדרים.
//              כך הנתונים שורדים בין פריסות (חינם), ויש גישה ישירה
//              לקבצים דרך הריפו.
//
// הנתונים נשמרים בענף נפרד (ברירת מחדל "site-data") שאינו מפעיל
// פריסה מחדש (Render עוקב אחרי main בלבד).
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

const DEFAULT_SETTINGS = {
  currency: '₪',
  price_min: 0,
  price_max: 1000000,
  publish_whatsapp: ''
};

// ---------- GitHub config ----------
const GH = {
  token: process.env.GITHUB_TOKEN || '',
  repo: process.env.GITHUB_REPO || '',          // "owner/name"
  branch: process.env.GITHUB_DATA_BRANCH || 'site-data',
  codeBranch: process.env.GITHUB_CODE_BRANCH || 'main'
};
const USE_GITHUB = !!(GH.token && GH.repo);

const shaCache = {}; // path -> sha (גרסה נוכחית של כל קובץ בגיטהאב)

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
function fileFor(key) { return path.join(DATA_DIR, `${key}.json`); }

// ============================================================
// GitHub API helpers
// ============================================================
async function gh(method, apiPath, body) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      'authorization': `Bearer ${GH.token}`,
      'accept': 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'kal-nofesh-server'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

async function ghGetFile(repoPath) {
  const res = await gh('GET', `/repos/${GH.repo}/contents/${encodeURIComponent(repoPath).replace(/%2F/g, '/')}?ref=${GH.branch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`github get ${repoPath}: ${res.status}`);
  const json = await res.json();
  shaCache[repoPath] = json.sha;
  return json; // { content (base64), sha, ... }
}

async function ghPutFile(repoPath, buffer, message) {
  const body = {
    message: message || `update ${repoPath}`,
    content: buffer.toString('base64'),
    branch: GH.branch
  };
  if (shaCache[repoPath]) body.sha = shaCache[repoPath];
  let res = await gh('PUT', `/repos/${GH.repo}/contents/${repoPath}`, body);
  // קונפליקט sha → לרענן ולנסות שוב פעם אחת
  if (res.status === 409 || res.status === 422) {
    const cur = await ghGetFile(repoPath);
    body.sha = cur ? cur.sha : undefined;
    res = await gh('PUT', `/repos/${GH.repo}/contents/${repoPath}`, body);
  }
  if (!res.ok) throw new Error(`github put ${repoPath}: ${res.status}`);
  const json = await res.json();
  shaCache[repoPath] = json.content && json.content.sha;
  return json;
}

async function ghDeleteFile(repoPath) {
  let sha = shaCache[repoPath];
  if (!sha) {
    const cur = await ghGetFile(repoPath);
    if (!cur) return;
    sha = cur.sha;
  }
  const res = await gh('DELETE', `/repos/${GH.repo}/contents/${repoPath}`, {
    message: `delete ${repoPath}`, branch: GH.branch, sha
  });
  if (res.ok || res.status === 404) { delete shaCache[repoPath]; return; }
  throw new Error(`github delete ${repoPath}: ${res.status}`);
}

async function ghEnsureBranch() {
  const res = await gh('GET', `/repos/${GH.repo}/branches/${GH.branch}`);
  if (res.ok) return;
  if (res.status !== 404) throw new Error(`github branch check: ${res.status}`);
  // ענף לא קיים → ליצור אותו מתוך ענף הקוד
  const refRes = await gh('GET', `/repos/${GH.repo}/git/ref/heads/${GH.codeBranch}`);
  if (!refRes.ok) throw new Error(`github base ref: ${refRes.status}`);
  const ref = await refRes.json();
  const mk = await gh('POST', `/repos/${GH.repo}/git/refs`, {
    ref: `refs/heads/${GH.branch}`,
    sha: ref.object.sha
  });
  if (!mk.ok && mk.status !== 422) throw new Error(`github create branch: ${mk.status}`);
}

// ============================================================
// init – טעינת נתונים מגיטהאב לדיסק המקומי בעת עליית השרת
// ============================================================
const JSON_KEYS = ['properties', 'types', 'cities', 'image_categories', 'users', 'settings'];

async function init() {
  ensureDirs();
  if (!USE_GITHUB) {
    console.log('store: מצב מקומי (קבצים על הדיסק).');
    return;
  }
  console.log(`store: מצב GitHub (ריפו ${GH.repo}, ענף נתונים ${GH.branch}).`);
  try {
    await ghEnsureBranch();
    for (const key of JSON_KEYS) {
      const file = await ghGetFile(`data/${key}.json`);
      if (file && file.content) {
        const buf = Buffer.from(file.content, 'base64');
        fs.writeFileSync(fileFor(key), buf);
      }
    }
    console.log('store: נתונים נטענו מגיטהאב.');
  } catch (e) {
    console.error('store: טעינה מגיטהאב נכשלה (ממשיכים עם מה שיש מקומית):', e.message);
  }
}

// ============================================================
// JSON read/write
// ============================================================
async function getJSON(key, fallback) {
  ensureDirs();
  const f = fileFor(key);
  if (!fs.existsSync(f)) return fallback;
  try {
    const raw = fs.readFileSync(f, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`store: קריאת ${key} נכשלה:`, e.message);
    return fallback;
  }
}

async function setJSON(key, value) {
  ensureDirs();
  const buf = Buffer.from(JSON.stringify(value, null, 2), 'utf8');
  const tmp = fileFor(key) + '.tmp';
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, fileFor(key));
  if (USE_GITHUB) {
    try { await ghPutFile(`data/${key}.json`, buf, `update ${key}`); }
    catch (e) { console.error(`store: סנכרון ${key} לגיטהאב נכשל:`, e.message); }
  }
}

async function getAll() {
  const [properties, types, cities, image_categories, users, settings] = await Promise.all([
    getJSON('properties', []),
    getJSON('types', []),
    getJSON('cities', []),
    getJSON('image_categories', []),
    getJSON('users', []),
    getJSON('settings', DEFAULT_SETTINGS)
  ]);
  return { properties, types, cities, image_categories, users, settings: { ...DEFAULT_SETTINGS, ...settings } };
}

async function getPublic() {
  const all = await getAll();
  return {
    properties: all.properties.filter((p) => p.status === 'published'),
    types: all.types,
    cities: all.cities,
    image_categories: all.image_categories,
    settings: all.settings
  };
}

// ============================================================
// images / video
// ============================================================
function imageMetaFile(key) { return path.join(IMAGES_DIR, key + '.meta.json'); }

async function saveImage(key, buffer, contentType) {
  ensureDirs();
  fs.writeFileSync(path.join(IMAGES_DIR, key), buffer);
  fs.writeFileSync(imageMetaFile(key), JSON.stringify({ contentType }), 'utf8');
  if (USE_GITHUB) {
    try {
      await ghPutFile(`data/images/${key}`, buffer, `upload ${key}`);
      await ghPutFile(`data/images/${key}.meta.json`, Buffer.from(JSON.stringify({ contentType })), `meta ${key}`);
    } catch (e) { console.error('store: סנכרון תמונה לגיטהאב נכשל:', e.message); }
  }
}

async function readImage(key) {
  const f = path.join(IMAGES_DIR, key);
  if (!fs.existsSync(f)) {
    // לא במטמון מקומי → לנסות להביא מגיטהאב
    if (USE_GITHUB) {
      try {
        const file = await ghGetFile(`data/images/${key}`);
        if (file) {
          let buf = null;
          if (file.content) {
            // קבצים קטנים (<1MB) - התוכן מוחזר ישירות כ-base64
            buf = Buffer.from(file.content, 'base64');
          } else if (file.download_url) {
            // קבצים גדולים (וידאו) - ה-API לא מחזיר תוכן, מורידים מהקישור הישיר
            const dl = await fetch(file.download_url);
            if (dl.ok) buf = Buffer.from(await dl.arrayBuffer());
          }
          if (buf && buf.length) {
            fs.writeFileSync(f, buf);
            const meta = await ghGetFile(`data/images/${key}.meta.json`);
            if (meta && meta.content) fs.writeFileSync(imageMetaFile(key), Buffer.from(meta.content, 'base64'));
          }
        }
      } catch (e) { console.error('store: שליפת תמונה מגיטהאב נכשלה:', e.message); }
    }
    if (!fs.existsSync(f)) return null;
  }
  let contentType = 'application/octet-stream';
  const mf = imageMetaFile(key);
  if (fs.existsSync(mf)) {
    try { contentType = JSON.parse(fs.readFileSync(mf, 'utf8')).contentType || contentType; } catch {}
  }
  return { data: fs.readFileSync(f), contentType };
}

async function deleteImage(key) {
  try { fs.unlinkSync(path.join(IMAGES_DIR, key)); } catch {}
  try { fs.unlinkSync(imageMetaFile(key)); } catch {}
  if (USE_GITHUB) {
    try { await ghDeleteFile(`data/images/${key}`); await ghDeleteFile(`data/images/${key}.meta.json`); }
    catch (e) { console.error('store: מחיקת תמונה מגיטהאב נכשלה:', e.message); }
  }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = {
  DATA_DIR, IMAGES_DIR, DEFAULT_SETTINGS,
  USE_GITHUB,
  init,
  getJSON, setJSON, getAll, getPublic,
  saveImage, readImage, deleteImage,
  newId
};
