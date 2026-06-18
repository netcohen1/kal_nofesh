// ============================================================
// js/admin/users.js – ניהול מנהלים
// ============================================================
// יוצר/עורך/מוחק משתמשים. מאפשר לעדכן סיסמה.
// משתמש "admin" הראשי לא נמחק ולא נערך מכאן (סיסמתו ב-env var).
// ============================================================

(function () {
  const { api, ui, adminState } = window.KN;
  const COPY = window.COPY;

  function init() {
    adminState.onChange(render);
    if (adminState.isLoaded()) render(adminState.get());
  }

  function render() {
    const data = adminState.get();
    const host = document.getElementById('usersHost');
    if (!host) return;

    const e = ui.escapeHtml;
    const currentId = data.current_user && data.current_user.id;
    // הסרת המנהל הראשי מהרשימה כי מוצג בנפרד בשורה הסטטית למעלה
    const users = (data.users || []).filter((u) => !u.is_master);

    host.innerHTML = `
      <div class="adm-form" style="margin-bottom:1.4rem">
        <h2 style="font-family:var(--font-display); font-size:1.4rem; margin-bottom:1rem">הוספת מנהל חדש</h2>
        <div class="adm-form-grid">
          <div class="field">
            <label class="field-label" for="u_username">שם משתמש (אנגלית בלבד)</label>
            <input class="input" id="u_username" type="text" maxlength="40" placeholder="לדוגמה: dani" />
          </div>
          <div class="field">
            <label class="field-label" for="u_name">שם מלא</label>
            <input class="input" id="u_name" type="text" maxlength="80" placeholder="לדוגמה: דני כהן" />
          </div>
          <div class="field">
            <label class="field-label" for="u_email">אימייל (לא חובה)</label>
            <input class="input" id="u_email" type="email" maxlength="120" />
          </div>
          <div class="field">
            <label class="field-label" for="u_password">סיסמה (6 תווים לפחות)</label>
            <input class="input" id="u_password" type="password" minlength="6" />
          </div>
        </div>
        <div class="actions">
          <button class="btn" type="button" id="u_addBtn">הוספה <span class="arr">←</span></button>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>שם משתמש</th>
              <th>שם מלא</th>
              <th>אימייל</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>admin</strong> <span class="status-pill status-pill--published">ראשי</span></td>
              <td>מנהל ראשי</td>
              <td style="color:var(--ink-soft); font-size:.88rem">סיסמה ב-env var (ADMIN_PASSWORD)</td>
              <td><span style="color:var(--ink-soft); font-size:.88rem">לא ניתן לעריכה מכאן</span></td>
            </tr>
            ${users.length === 0
              ? `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:2rem">אין מנהלים נוספים. הוסיפו למעלה.</td></tr>`
              : users.map((u) => `
                <tr>
                  <td><strong>${e(u.username)}</strong>${currentId === u.id ? ' <span class="status-pill status-pill--published">אתה</span>' : ''}</td>
                  <td>${e(u.name)}</td>
                  <td>${e(u.email || '—')}</td>
                  <td>
                    <div class="actions">
                      <button data-act="edit" data-id="${e(u.id)}">פרטים</button>
                      <button data-act="pwd"  data-id="${e(u.id)}">סיסמה</button>
                      <button data-act="del"  data-id="${e(u.id)}" class="danger">${e(COPY.admin.del)}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    `;

    host.querySelector('#u_addBtn').addEventListener('click', addUser);
    host.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => handleAction(btn.dataset.act, btn.dataset.id));
    });

    function addUser() {
      const username = host.querySelector('#u_username').value.trim().toLowerCase();
      const name     = host.querySelector('#u_name').value.trim();
      const email    = host.querySelector('#u_email').value.trim();
      const password = host.querySelector('#u_password').value;
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
        ui.toast('שם משתמש חייב 3-40 תווים, אנגלית בלבד.', 'error'); return;
      }
      if (username === 'admin') {
        ui.toast('שם המשתמש "admin" שמור למנהל הראשי.', 'error'); return;
      }
      if (!name) { ui.toast('נא להזין שם מלא.', 'error'); return; }
      if (!password || password.length < 6) { ui.toast('סיסמה חייבת 6 תווים לפחות.', 'error'); return; }

      addBtnBusy(true);
      api.createUser({ username, name, email, password })
        .then((r) => {
          adminState.upsertUser(r.user);
          ui.toast(COPY.admin.saved, 'ok');
          host.querySelector('#u_username').value = '';
          host.querySelector('#u_name').value = '';
          host.querySelector('#u_email').value = '';
          host.querySelector('#u_password').value = '';
        })
        .catch((err) => {
          if (err.status === 409) ui.toast('שם משתמש כבר קיים.', 'error');
          else ui.toast('הוספה נכשלה: ' + (err.code || err.message), 'error');
        })
        .finally(() => addBtnBusy(false));
    }

    function addBtnBusy(b) {
      const btn = host.querySelector('#u_addBtn');
      btn.disabled = b;
      btn.style.opacity = b ? 0.6 : 1;
    }
  }

  async function handleAction(act, id) {
    const data = adminState.get();
    const user = (data.users || []).find((u) => u.id === id);
    if (!user) return;

    if (act === 'edit') {
      const newName = window.prompt('שם מלא:', user.name);
      if (newName == null) return;
      const newEmail = window.prompt('אימייל (השאירו ריק לדילוג):', user.email || '');
      if (newEmail == null) return;
      try {
        const r = await api.updateUser({ id, name: newName.trim(), email: newEmail.trim() });
        adminState.upsertUser(r.user);
        ui.toast(COPY.admin.saved, 'ok');
      } catch (err) {
        ui.toast('עדכון נכשל: ' + (err.code || err.message), 'error');
      }
      return;
    }

    if (act === 'pwd') {
      const newPwd = window.prompt('סיסמה חדשה (6 תווים לפחות):');
      if (newPwd == null) return;
      if (newPwd.length < 6) { ui.toast('סיסמה חייבת 6 תווים לפחות.', 'error'); return; }
      try {
        await api.changePassword({ userId: id, newPassword: newPwd });
        ui.toast('הסיסמה עודכנה.', 'ok');
      } catch (err) {
        ui.toast('עדכון סיסמה נכשל: ' + (err.code || err.message), 'error');
      }
      return;
    }

    if (act === 'del') {
      if (!window.confirm(`למחוק את ${user.username}? פעולה זו לא ניתנת לביטול.`)) return;
      try {
        await api.deleteUser(id);
        adminState.removeUser(id);
        ui.toast('המשתמש נמחק.', 'ok');
      } catch (err) {
        ui.toast('מחיקה נכשלה: ' + (err.code || err.message), 'error');
      }
    }
  }

  window.KN = window.KN || {};
  window.KN.adminUsers = { init };
})();
