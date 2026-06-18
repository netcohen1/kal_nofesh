// ============================================================
// js/admin/dashboard.js – מנהל הדשבורד: ניווט, סטטים, אתחול
// ============================================================

(function () {
  const { api, ui, adminState } = window.KN;
  const COPY = window.COPY;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    if (!api.isLoggedIn()) {
      window.location.href = 'admin-login.html';
      return;
    }

    wireNav();
    wireLogout();
    wireQuickActions();

    try {
      await adminState.load();
    } catch (e) {
      if (e.status === 401) {
        api.logout();
        window.location.href = 'admin-login.html';
        return;
      }
      ui.toast('שגיאה בטעינת הנתונים: ' + (e.code || e.message), 'error');
      return;
    }

    adminState.onChange(renderStats);
    adminState.onChange(updateCurrentUserLabel);
    renderStats(adminState.get());
    updateCurrentUserLabel(adminState.get());

    // אתחול מודולים
    window.KN.adminProperties.init();
    window.KN.adminLists.init();
    window.KN.adminUsers.init();
    window.KN.adminSettings.init();

    const initSection = (window.location.hash || '#dashboard').slice(1);
    showSection(initSection);
  }

  function wireNav() {
    document.querySelectorAll('.adm__nav button[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => showSection(btn.dataset.section));
    });
  }

  function wireQuickActions() {
    document.querySelectorAll('button[data-quick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.quick;
        if (kind === 'add-property') {
          showSection('properties');
          window.KN.adminProperties.openEditor(null);
        } else {
          showSection(kind);
        }
      });
    });
  }

  function showSection(name) {
    document.querySelectorAll('.adm__nav button[data-section]').forEach((b) => {
      b.classList.toggle('active', b.dataset.section === name);
    });
    document.querySelectorAll('.adm-section').forEach((s) => {
      s.classList.toggle('active', s.dataset.section === name);
    });
    window.location.hash = name;
  }

  function wireLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      api.logout();
      window.location.href = 'admin-login.html';
    });
  }

  function renderStats(data) {
    const host = document.getElementById('statsHost');
    const pubs = data.properties.filter((p) => p.status === 'published').length;
    const drafts = data.properties.filter((p) => p.status === 'draft').length;
    const types = data.types.length;
    const cities = data.cities.length;

    host.innerHTML = `
      <div class="adm-stat adm-stat--coral">
        <div class="l">${ui.escapeHtml(COPY.admin.statPublished)}</div>
        <div class="n">${pubs}</div>
      </div>
      <div class="adm-stat">
        <div class="l">${ui.escapeHtml(COPY.admin.statDraft)}</div>
        <div class="n">${drafts}</div>
      </div>
      <div class="adm-stat">
        <div class="l">סוגי נכס מוגדרים</div>
        <div class="n">${types}</div>
      </div>
      <div class="adm-stat">
        <div class="l">ערים מוגדרות</div>
        <div class="n">${cities}</div>
      </div>
    `;
  }

  function updateCurrentUserLabel(data) {
    const el = document.getElementById('currentUserLabel');
    if (!el || !data.current_user) return;
    el.textContent = `מחובר: ${data.current_user.name || data.current_user.username}`;
  }
})();
