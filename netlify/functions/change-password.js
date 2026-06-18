// ============================================================
// /api/change-password – שינוי סיסמה של משתמש קיים
// ============================================================
// payload: { userId, newPassword }
// המשתמש master לא ניתן לשינוי דרך ה-API (סיסמתו ב-env var).
// ============================================================
const { requireAuth, makePasswordRecord, MASTER_USER_ID } = require('./_lib/auth');
const { getJSON, setJSON } = require('./_lib/store');
const { isStr } = require('./_lib/validate');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'method_not_allowed');
  try {
    requireAuth(event);
    const body = await parseBody(event);
    if (!body.userId) return bad(400, 'missing_id');
    if (body.userId === MASTER_USER_ID) return bad(400, 'master_password_via_env');
    if (!isStr(body.newPassword || '', { min: 6, max: 200 })) return bad(400, 'weak_password');

    const users = await getJSON('users', []);
    const idx = users.findIndex((u) => u.id === body.userId);
    if (idx < 0) return bad(404, 'not_found');

    const rec = makePasswordRecord(body.newPassword);
    const next = [...users];
    next[idx] = { ...next[idx], salt: rec.salt, hash: rec.hash };
    await setJSON('users', next);
    return ok({ updated: body.userId });
  } catch (e) {
    return handleError(e);
  }
};
