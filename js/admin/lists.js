// ============================================================
// js/admin/lists.js – ניהול שדות מוגדרים: סוגי נכס, ערים, קטגוריות תמונות
// ============================================================
// עיר חייבת להיות משויכת לאזור מתוך הרשימה הקבועה.
// אזור המתחם נשלף אוטומטית מהעיר בעת קביעת המתחם.
// ============================================================

(function () {
  const { api, ui, adminState, staticData } = window.KN;
  const COPY = window.COPY;

  const KINDS = [
    { kind: 'types',            title: 'סוגי נכס',        needsRegion: false },
    { kind: 'cities',           title: 'ערים',           needsRegion: true  },
    { kind: 'image_categories', title: 'קטגוריות תמונות', needsRegion: false }
  ];

  function init() {
    adminState.onChange(render);
    if (adminState.isLoaded()) render(adminState.get());
  }

  function render() {
    const data = adminState.get();
    const host = document.getElementById('listsHost');
    const e = ui.escapeHtml;

    host.innerHTML = KINDS.map(({ kind, title, needsRegion }) => {
      const items = data[kind] || [];
      const regionOpts = staticData.REGIONS.map((r) => `<option value="${e(r.id)}">${e(r.name)}</option>`).join('');
      return `
        <div class="list-card" data-kind="${e(kind)}">
          <h3>${e(title)}</h3>

          <div class="add-row">
            <input class="input" type="text" placeholder="שם חדש" data-role="name" maxlength="80" />
            ${needsRegion ? `
              <select class="select" data-role="region">
                <option value="">בחרו אזור</option>
                ${regionOpts}
              </select>
            ` : ''}
            <button class="btn btn--small" type="button" data-role="add">${e(COPY.admin.addNew)}</button>
          </div>

          <ul>
            ${items.length === 0 ? `<li style="justify-content:center; color:var(--ink-soft); border:0; background:transparent">אין פריטים עדיין.</li>` : ''}
            ${items.map((it) => {
              const reg = needsRegion ? staticData.lookupRegion(it.region_id) : null;
              const regTxt = reg ? reg.name : (needsRegion ? '(לא משויכת)' : '');
              return `
                <li data-id="${e(it.id)}">
                  <span>
                    <strong>${e(it.name)}</strong>
                    ${needsRegion ? `<span style="color:${reg ? 'var(--teal)' : 'var(--coral-deep)'}; font-weight:500"> · ${e(regTxt)}</span>` : ''}
                  </span>
                  <span class="actions">
                    <button type="button" data-act="rename">${e(COPY.admin.edit)}</button>
                    <button type="button" class="danger" data-act="del">${e(COPY.admin.del)}</button>
                  </span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }).join('');

    host.querySelectorAll('.list-card').forEach((card) => {
      const kind = card.dataset.kind;
      const needsRegion = KINDS.find((k) => k.kind === kind).needsRegion;

      card.querySelector('button[data-role="add"]').addEventListener('click', async () => {
        const nameEl = card.querySelector('input[data-role="name"]');
        const regionEl = card.querySelector('select[data-role="region"]');
        const name = nameEl.value.trim();
        if (!name) { ui.toast('נא להזין שם.', 'error'); return; }
        if (needsRegion && regionEl && !regionEl.value) {
          ui.toast('עיר חייבת להיות משויכת לאזור.', 'error');
          return;
        }
        try {
          const item = { name };
          if (needsRegion && regionEl) item.region_id = regionEl.value;
          const r = await api.createListItem(kind, item);
          adminState.upsertListItem(kind, r.item);
          nameEl.value = '';
          if (regionEl) regionEl.value = '';
        } catch (err) {
          if (err.status === 409) ui.toast('פריט עם שם זה כבר קיים.', 'error');
          else ui.toast('הוספה נכשלה: ' + (err.code || err.message), 'error');
        }
      });

      card.querySelectorAll('li[data-id]').forEach((li) => {
        const id = li.dataset.id;
        const item = (adminState.get()[kind] || []).find((x) => x.id === id);
        if (!item) return;

        li.querySelector('button[data-act="rename"]').addEventListener('click', async () => {
          const newName = window.prompt('שם חדש:', item.name);
          if (newName == null) return;
          const trimmed = newName.trim();
          let region_id = item.region_id;
          if (needsRegion) {
            const regList = staticData.REGIONS.map((r, i) => `${i + 1}. ${r.name}`).join('\n');
            const current = staticData.lookupRegion(region_id);
            const prompt = `אזור (מספר):\n${regList}`;
            const ans = window.prompt(prompt, current ? String(staticData.REGIONS.findIndex((r) => r.id === region_id) + 1) : '');
            if (ans != null && ans.trim()) {
              const idx = Number(ans.trim()) - 1;
              if (idx >= 0 && idx < staticData.REGIONS.length) {
                region_id = staticData.REGIONS[idx].id;
              }
            }
          }
          if (trimmed === item.name && region_id === item.region_id) return;
          try {
            const payload = { ...item, name: trimmed };
            if (needsRegion) payload.region_id = region_id;
            const r = await api.updateListItem(kind, payload);
            adminState.upsertListItem(kind, r.item);
          } catch (err) {
            ui.toast('עדכון נכשל: ' + (err.code || err.message), 'error');
          }
        });

        li.querySelector('button[data-act="del"]').addEventListener('click', async () => {
          const inUse = isInUse(kind, id, adminState.get());
          const msg = inUse
            ? COPY.admin.inUseWarn + '\n\nלמחוק בכל זאת?'
            : 'למחוק את הפריט?';
          if (!window.confirm(msg)) return;
          try {
            await api.deleteListItem(kind, id);
            adminState.removeListItem(kind, id);
          } catch (err) {
            ui.toast('מחיקה נכשלה: ' + (err.code || err.message), 'error');
          }
        });
      });
    });
  }

  function isInUse(kind, id, data) {
    if (kind === 'image_categories') {
      return data.properties.some((p) => (p.images || []).some((im) => im && im.category_id === id));
    }
    const f = kind === 'types' ? 'type_id' : 'city_id';
    return data.properties.some((p) => p[f] === id);
  }

  window.KN = window.KN || {};
  window.KN.adminLists = { init };
})();
