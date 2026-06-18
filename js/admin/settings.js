// ============================================================
// js/admin/settings.js – ניהול הגדרות גלובליות (מינימליסטי)
// ============================================================
// כרגע רק מספר ווצאפ לפרסום. מטבע=₪ קבוע, ללא גבולות מחיר.
// ============================================================

(function () {
  const { api, ui, adminState, whatsapp } = window.KN;
  const COPY = window.COPY;

  function init() {
    adminState.onChange(render);
    if (adminState.isLoaded()) render(adminState.get());
  }

  function render() {
    const s = adminState.get().settings || {};
    const e = ui.escapeHtml;
    const host = document.getElementById('settingsHost');
    host.innerHTML = `
      <form class="adm-form" id="settingsForm">
        <div class="adm-form-grid">
          <div class="field full">
            <label class="field-label" for="s_pubWa">מספר ווצאפ ל"פרסום מתחם" בדף הבית</label>
            <input class="input" id="s_pubWa" type="tel" placeholder="9725XXXXXXXX" value="${e(s.publish_whatsapp || '')}" />
            <span style="font-size:.8rem; color:var(--ink-soft); margin-top:.3rem">
              מספר זה יקבל פניות מבעלי מתחמים שרוצים להירשם. פורמט בינלאומי בלבד, בלי + ובלי תווים נוספים.
            </span>
          </div>
        </div>
        <div class="actions">
          <button type="submit" class="btn">שמירה <span class="arr">←</span></button>
        </div>
      </form>
    `;

    host.querySelector('#settingsForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const num = whatsapp.normalizePhone(host.querySelector('#s_pubWa').value);
      if (num && !whatsapp.isValidIntlPhone(num)) {
        ui.toast('מספר ווצאפ חייב להיות בפורמט בינלאומי תקין.', 'error');
        return;
      }
      // נשמרים גם השדות הקבועים כדי לא לאבד תאימות
      const next = {
        currency: '₪',
        price_min: 0,
        price_max: 1000000,
        publish_whatsapp: num
      };
      const btn = host.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const r = await api.updateSettings(next);
        adminState.setSettings(r.settings);
        ui.toast('נשמר בהצלחה', 'ok');
      } catch (err) {
        ui.toast('שמירה נכשלה: ' + (err.code || err.message), 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  window.KN = window.KN || {};
  window.KN.adminSettings = { init };
})();
