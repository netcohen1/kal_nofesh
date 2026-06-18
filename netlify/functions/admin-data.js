// ============================================================
// /api/admin-data – נתונים מלאים לאזור הניהול (כולל טיוטות + משתמשים)
// ============================================================
const { requireAuth, MASTER_USER_ID } = require('./_lib/auth');
const { getAll, getJSON } = require('./_lib/store');
const { ok, bad, handleError } = require('./_lib/respond');

function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name, email: u.email || '', is_master: !!u.is_master };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return bad(405, 'method_not_allowed');
  try {
    const userId = requireAuth(event);
    const data = await getAll();
    const users = await getJSON('users', []);
    let current;
    if (userId === MASTER_USER_ID) {
      current = { id: MASTER_USER_ID, username: 'admin', name: 'מנהל ראשי', is_master: true };
    } else {
      const u = users.find((x) => x.id === userId);
      current = u ? publicUser(u) : null;
    }
    return ok({
      ...data,
      image_categories: data.image_categories || [],
      users: users.map(publicUser),
      current_user: current
    });
  } catch (e) {
    return handleError(e);
  }
};
