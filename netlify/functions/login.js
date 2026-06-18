// ============================================================
// /api/login – התחברות מפרסם
// ============================================================
// payload: { username?, password }
// אם username = "admin" או חסר → בדיקת ADMIN_PASSWORD (משתמש master).
// אחרת → חיפוש משתמש ב-Blobs לפי username, אימות hash.
// ============================================================
const { checkMasterPassword, verifyPasswordRecord, issueToken, MASTER_USER_ID } = require('./_lib/auth');
const { getJSON } = require('./_lib/store');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'method_not_allowed');
  try {
    const body = await parseBody(event);
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password;

    if (!password) return bad(400, 'missing_password');

    // Master path (admin)
    if (!username || username === 'admin') {
      if (!checkMasterPassword(password)) return bad(401, 'invalid_credentials');
      return ok({
        token: issueToken(MASTER_USER_ID),
        user: { id: MASTER_USER_ID, username: 'admin', name: 'מנהל ראשי', is_master: true }
      });
    }

    // Regular user
    const users = await getJSON('users', []);
    const user = users.find((u) => (u.username || '').toLowerCase() === username);
    if (!user) return bad(401, 'invalid_credentials');
    if (!verifyPasswordRecord(password, { salt: user.salt, hash: user.hash })) {
      return bad(401, 'invalid_credentials');
    }
    return ok({
      token: issueToken(user.id),
      user: { id: user.id, username: user.username, name: user.name, email: user.email, is_master: false }
    });
  } catch (e) {
    return handleError(e);
  }
};
