// ============================================================
// js/admin/login.js – מסך התחברות מפרסם
// ============================================================

(function () {
  const { api, ui } = window.KN;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (api.isLoggedIn()) {
      window.location.href = 'admin-dashboard.html';
      return;
    }

    const form = document.getElementById('loginForm');
    const user = document.getElementById('username');
    const pwd  = document.getElementById('password');
    const err  = document.getElementById('loginError');
    const btn  = document.getElementById('loginBtn');

    setTimeout(() => user.focus(), 30);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.add('hidden');
      if (!pwd.value) {
        err.textContent = 'נא להזין סיסמה.';
        err.classList.remove('hidden');
        return;
      }
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = '...';
      try {
        await api.login(pwd.value, user.value.trim());
        window.location.href = 'admin-dashboard.html';
      } catch (e2) {
        if (e2.status === 401) {
          err.textContent = 'פרטי כניסה שגויים.';
        } else if (e2.code === 'network') {
          err.textContent = 'בעיית רשת. נסו שוב.';
        } else {
          err.textContent = 'שגיאה: ' + (e2.code || e2.message);
        }
        err.classList.remove('hidden');
        pwd.select();
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }
})();
