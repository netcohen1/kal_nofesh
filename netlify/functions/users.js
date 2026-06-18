// ============================================================
// /api/users – ניהול משתמשי מנהל
// ============================================================
// POST   – הוספת משתמש (body: { username, name, email, password })
// PUT    – עדכון פרטים (body: { id, name, email })
// DELETE – מחיקה (body: { id })
// ============================================================
const { requireAuth, makePasswordRecord } = require('./_lib/auth');
const { getJSON, setJSON, newId } = require('./_lib/store');
const { isStr } = require('./_lib/validate');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name, email: u.email || '', is_master: !!u.is_master };
}

exports.handler = async (event) => {
  try {
    requireAuth(event);
    const body = await parseBody(event);
    const users = await getJSON('users', []);

    if (event.httpMethod === 'POST') {
      const username = String(body.username || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const password = body.password;

      if (!/^[a-z0-9._-]{3,40}$/.test(username)) return bad(400, 'invalid_username');
      if (username === 'admin') return bad(400, 'reserved_username');
      if (!isStr(name, { max: 80 })) return bad(400, 'invalid_name');
      if (!isStr(password || '', { min: 6, max: 200 })) return bad(400, 'weak_password');
      if (users.find((u) => (u.username || '').toLowerCase() === username)) return bad(409, 'duplicate');

      const rec = makePasswordRecord(password);
      const user = {
        id: newId(),
        username,
        name,
        email,
        salt: rec.salt,
        hash: rec.hash,
        created_at: Date.now()
      };
      const next = [...users, user];
      await setJSON('users', next);
      return ok({ user: publicUser(user) });
    }

    if (event.httpMethod === 'PUT') {
      if (!body.id) return bad(400, 'missing_id');
      const idx = users.findIndex((u) => u.id === body.id);
      if (idx < 0) return bad(404, 'not_found');
      const updated = {
        ...users[idx],
        name: isStr(body.name, { max: 80 }) ? body.name.trim() : users[idx].name,
        email: typeof body.email === 'string' ? body.email.trim() : users[idx].email
      };
      const next = [...users];
      next[idx] = updated;
      await setJSON('users', next);
      return ok({ user: publicUser(updated) });
    }

    if (event.httpMethod === 'DELETE') {
      if (!body.id) return bad(400, 'missing_id');
      const target = users.find((u) => u.id === body.id);
      if (!target) return bad(404, 'not_found');
      const next = users.filter((u) => u.id !== body.id);
      await setJSON('users', next);
      return ok({ deleted: body.id });
    }

    return bad(405, 'method_not_allowed');
  } catch (e) {
    return handleError(e);
  }
};
