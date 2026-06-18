// ============================================================
// /api/image – הגשת תמונה מ-Blobs
// ============================================================
// פרמטר query: key
// מחזיר את הבייטים עם content-type נכון.
// ============================================================

const { imageStore } = require('./_lib/store');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'method_not_allowed' };
  }
  const key = (event.queryStringParameters || {}).key;
  if (!key || /[^A-Za-z0-9._-]/.test(key)) {
    return { statusCode: 400, body: 'bad_key' };
  }
  try {
    const store = imageStore();
    const blob = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!blob) {
      return { statusCode: 404, body: 'not_found' };
    }
    const ct = (blob.metadata && blob.metadata.contentType) || 'application/octet-stream';
    return {
      statusCode: 200,
      headers: {
        'content-type': ct,
        'cache-control': 'public, max-age=31536000, immutable'
      },
      isBase64Encoded: true,
      body: Buffer.from(blob.data).toString('base64')
    };
  } catch (e) {
    console.error('image fetch:', e);
    return { statusCode: 500, body: 'internal_error' };
  }
};
