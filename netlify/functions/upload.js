// ============================================================
// /api/upload – העלאת תמונה ל-Netlify Blobs
// ============================================================
// גוף הבקשה: { name: "kitchen.jpg", contentType: "image/jpeg", dataBase64: "..." }
// מחזיר: { key, url, contentType }
// ============================================================

const { requireAuth } = require('./_lib/auth');
const { imageStore, newId } = require('./_lib/store');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime'
]);
const MAX_BYTES_IMG = 5 * 1024 * 1024;    // 5MB
const MAX_BYTES_VID = 50 * 1024 * 1024;   // 50MB

const EXT = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4':  'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'method_not_allowed');
  try {
    requireAuth(event);
    const body = await parseBody(event);
    const contentType = String(body.contentType || '').toLowerCase();
    if (!ALLOWED.has(contentType)) return bad(415, 'unsupported_type');
    if (!body.dataBase64 || typeof body.dataBase64 !== 'string') return bad(400, 'missing_data');

    const buf = Buffer.from(body.dataBase64, 'base64');
    if (buf.length === 0) return bad(400, 'empty_file');
    const isVideo = /^video\//.test(contentType);
    const maxBytes = isVideo ? MAX_BYTES_VID : MAX_BYTES_IMG;
    if (buf.length > maxBytes) return bad(413, 'too_large');

    const ext = EXT[contentType];
    const key = `${newId()}.${ext}`;
    const store = imageStore();
    await store.set(key, buf, { metadata: { contentType } });

    return ok({
      key,
      url: `/api/image?key=${encodeURIComponent(key)}`,
      contentType
    });
  } catch (e) {
    return handleError(e);
  }
};
