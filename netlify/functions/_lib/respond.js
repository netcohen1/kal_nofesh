// ============================================================
// _lib/respond.js – עזרי תגובה לפונקציות
// ============================================================

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function ok(body) {
  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

function bad(status, message, extra) {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: message, ...(extra || {}) })
  };
}

async function parseBody(event) {
  if (!event.body) return {};
  try {
    return event.isBase64Encoded
      ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf8'))
      : JSON.parse(event.body);
  } catch (e) {
    const err = new Error('invalid_json');
    err.statusCode = 400;
    throw err;
  }
}

function handleError(e) {
  if (e && e.statusCode) {
    return bad(e.statusCode, e.message || 'error');
  }
  console.error('function error:', e);
  return bad(500, 'internal_error');
}

module.exports = { ok, bad, parseBody, handleError, JSON_HEADERS };
