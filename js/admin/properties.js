// ============================================================
// js/admin/properties.js – CRUD למתחמים: טופס + תמונות + לוח שנה + תמחור
// ============================================================

(function () {
  const { api, ui, adminState, listing, whatsapp, dates, staticData } = window.KN;
  const COPY = window.COPY;

  function init() {
    document.getElementById('addPropBtn').addEventListener('click', () => openEditor(null));
    document.getElementById('propSearch').addEventListener('input', renderTable);
    document.getElementById('propStatusFilter').addEventListener('change', renderTable);
    adminState.onChange(renderTable);
    if (adminState.isLoaded()) renderTable(adminState.get());
  }

  function renderTable() {
    const data = adminState.get();
    const host = document.getElementById('propsHost');
    const q = document.getElementById('propSearch').value.trim().toLowerCase();
    const statusFilter = document.getElementById('propStatusFilter').value;

    let items = [...data.properties];
    if (q) items = items.filter((p) => (p.name || '').toLowerCase().includes(q));
    if (statusFilter) items = items.filter((p) => p.status === statusFilter);
    items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

    if (!items.length) {
      host.innerHTML = `
        <div class="empty">
          <h3>אין כרגע מתחמים${q || statusFilter ? ' לפי הפילטר הזה' : ''}.</h3>
          <p>${q || statusFilter ? 'נסו להסיר פילטרים.' : 'לחצו על "הוספת מתחם" כדי להתחיל.'}</p>
        </div>
      `;
      return;
    }

    const e = ui.escapeHtml;
    host.innerHTML = `
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>שם המתחם</th>
              <th>סוג</th>
              <th>עיר / אזור</th>
              <th>החל מ-</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((p) => {
              const type   = listing.lookupType(data.types, p.type_id);
              const city   = listing.lookupCity(data.cities, p.city_id);
              const region = staticData.lookupRegion(p.region_id);
              const sp     = listing.startingPrice(p);
              return `
                <tr>
                  <td><strong>${e(p.name)}</strong></td>
                  <td>${e(type ? type.name : '—')}</td>
                  <td>${e([city && city.name, region && region.name].filter(Boolean).join(' / ') || '—')}</td>
                  <td>${sp != null ? e(ui.formatPrice(sp, data.settings.currency)) : '—'}</td>
                  <td>
                    <span class="status-pill status-pill--${p.status}">${
                      e(p.status === 'published' ? COPY.admin.statusPublished : COPY.admin.statusDraft)
                    }</span>
                  </td>
                  <td>
                    <div class="actions">
                      <button data-act="edit" data-id="${e(p.id)}">${e(COPY.admin.edit)}</button>
                      <button data-act="prices" data-id="${e(p.id)}">עדכון מחירים</button>
                      <button data-act="avail" data-id="${e(p.id)}">זמינות</button>
                      <button data-act="toggle" data-id="${e(p.id)}">${
                        e(p.status === 'published' ? COPY.admin.unpublish : COPY.admin.publish)
                      }</button>
                      <button class="danger" data-act="del" data-id="${e(p.id)}">${e(COPY.admin.del)}</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    host.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => handleAction(btn.dataset.act, btn.dataset.id));
    });
  }

  async function handleAction(act, id) {
    const data = adminState.get();
    const prop = data.properties.find((p) => p.id === id);
    if (!prop) return;
    if (act === 'edit') return openEditor(prop);
    if (act === 'avail') return openAvailability(prop);
    if (act === 'prices') return openPricesOnly(prop);

    if (act === 'toggle') {
      const next = { ...prop, status: prop.status === 'published' ? 'draft' : 'published' };
      try {
        const r = await api.updateProperty(next);
        adminState.upsertProperty(r.property);
        ui.toast(COPY.admin.saved, 'ok');
      } catch (e) {
        ui.toast('שמירה נכשלה: ' + (e.code || e.message), 'error');
      }
      return;
    }

    if (act === 'del') {
      if (!window.confirm(COPY.admin.deleteConfirm)) return;
      try {
        await api.deleteProperty(id);
        adminState.removeProperty(id);
        ui.toast('המתחם נמחקה.', 'ok');
      } catch (e) {
        ui.toast('מחיקה נכשלה: ' + (e.code || e.message), 'error');
      }
    }
  }

  // ============================================================
  // עורך מתחם - פרטים, אזור, שירותים, מיקום, תמחור
  // ============================================================
  function openEditor(existing) {
    const data = adminState.get();
    const isNew = !existing;
    const draft = existing ? deepClone(existing) : blankProperty();
    let images = Array.isArray(draft.images) ? [...draft.images] : [];
    let pricingRules = Array.isArray(draft.pricing_rules) ? [...draft.pricing_rules] : [];

    const e = ui.escapeHtml;
    const modal = ui.openModal(`
      <h2>${e(isNew ? 'הוספת מתחם' : 'עריכת מתחם')}</h2>
      <form id="propForm" class="adm-form" style="border:0; padding:0; background:transparent">
        <!-- שדה מומלץ בולט בראש הטופס -->
        <div class="featured-row" style="background:color-mix(in srgb,var(--coral) 12%,var(--paper-2)); border:2px solid var(--coral); border-radius:var(--r); padding:.9rem 1rem; margin-bottom:1.2rem; display:flex; align-items:center; gap:.7rem">
          <input type="checkbox" id="f_featured" style="width:20px; height:20px; accent-color:var(--coral)" />
          <label for="f_featured" style="cursor:pointer; flex:1">
            <strong style="font-size:1rem; color:var(--coral-deep)">סמן את המתחם כמומלץ ★</strong>
            <span style="display:block; font-size:.85rem; color:var(--ink-soft); margin-top:.15rem">המתחם יופיע בראש הרשימה עם תג "מומלץ"</span>
          </label>
        </div>

        <div class="adm-form-grid">

          <div class="field">
            <label class="field-label" for="f_name">שם המתחם</label>
            <input class="input" id="f_name" type="text" required maxlength="200" />
          </div>
          <div class="field">
            <label class="field-label" for="f_type">סוג נכס</label>
            <select class="select" id="f_type" required>
              <option value="">—</option>
              ${data.types.map((t) => `<option value="${e(t.id)}">${e(t.name)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="f_city">עיר</label>
            <select class="select" id="f_city" required>
              <option value="">—</option>
              ${data.cities.map((c) => {
                const reg = staticData.lookupRegion(c.region_id);
                const sub = reg ? ` (${reg.name})` : '';
                return `<option value="${e(c.id)}">${e(c.name + sub)}</option>`;
              }).join('')}
            </select>
            <span style="font-size:.8rem; color:var(--ink-soft); margin-top:.3rem">האזור נקבע אוטומטית לפי הגדרת העיר</span>
          </div>
          <div class="field">
            <label class="field-label" for="f_neighborhood">שכונה / אזור פנים-עירוני (לא חובה)</label>
            <input class="input" id="f_neighborhood" type="text" maxlength="80" />
          </div>
          <div class="field">
            <label class="field-label" for="f_status">סטטוס פרסום</label>
            <select class="select" id="f_status">
              <option value="draft">טיוטה</option>
              <option value="published">מפורסם</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="f_rooms">מספר חדרים</label>
            <input class="input" id="f_rooms" type="number" min="0" step="1" inputmode="numeric" />
          </div>
          <div class="field">
            <label class="field-label" for="f_beds">מספר מיטות</label>
            <input class="input" id="f_beds" type="number" min="0" step="1" inputmode="numeric" />
          </div>
          <div class="field">
            <label class="field-label" for="f_max_guests">כמות אורחים מקסימלית</label>
            <input class="input" id="f_max_guests" type="number" min="0" step="1" inputmode="numeric" placeholder="לדוגמה: 30" />
          </div>

          <div class="field full">
            <label class="field-label" for="f_description">תיאור</label>
            <textarea class="textarea" id="f_description" maxlength="5000"></textarea>
          </div>

          <div class="field full">
            <label class="field-label" for="f_phone">טלפון / ווצאפ של המפרסם (פורמט בינלאומי, לדוגמה 9725XXXXXXXX)</label>
            <input class="input" id="f_phone" type="tel" placeholder="9725XXXXXXXX" required />
            <span style="font-size:.8rem; color:var(--ink-soft); margin-top:.3rem">המספר ישמש גם להתקשרות וגם לשליחת ווצאפ ללקוחות</span>
          </div>

          <div class="field full">
            <label class="field-label" for="f_address">מיקום (כתובת מלאה)</label>
            <input class="input" id="f_address" type="text" maxlength="200" placeholder="לדוגמה: רחוב הרצל 12, ירושלים" />
            <span style="font-size:.8rem; color:var(--ink-soft); margin-top:.3rem">יוצג ללקוח עם מפת גוגל מובנית והוראות ניווט</span>
          </div>

          <!-- שירותים מקובצים לפי קטגוריה - כל קטגוריה מתקפלת -->
          <div class="field full">
            <span class="field-label">שירותים זמינים במתחם (סמנו את הרלוונטיים)</span>
            <div class="adm-svc-cats">
              ${staticData.SERVICE_CATEGORIES.map((cat, ci) => {
                const items = staticData.SERVICES.filter((s) => s.cat === cat.id);
                if (!items.length) return '';
                return `
                  <div class="svc-cat-coll ${ci === 0 ? 'is-open' : ''}" data-adm-svc-cat>
                    <button type="button" class="svc-cat-coll__head">
                      <span><strong>${e(cat.name)}</strong> <span style="color:var(--ink-soft); font-weight:500; font-size:.82rem">(${items.length} שירותים)</span></span>
                      <span class="ch-arr">▾</span>
                    </button>
                    <div class="svc-cat-coll__body">
                      <div class="svc-checks" data-cat="${e(cat.id)}">
                        ${items.map((s) => `
                          <label data-svc="${e(s.id)}">
                            <input type="checkbox" value="${e(s.id)}" />
                            ${staticData.serviceIconSvg(s)}
                            ${e(s.name)}
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- מצב תמחור -->
          <div class="field full">
            <label class="toggle-row" style="display:flex; align-items:center; gap:.5rem; background:var(--paper); border:1.5px solid var(--ink); padding:.6em .9em; border-radius:var(--r); cursor:pointer">
              <input type="checkbox" id="f_on_request" />
              <span><strong>מחיר בתיאום אישי</strong> – לא צריך למלא מחירים, ייצוג כ"בתיאום אישי" ללקוח</span>
            </label>
          </div>

          <!-- תמחור -->
          <div class="field full" id="f_priceWrap">
            <span class="field-label">מחיר בסיס ללילה (אמצע השבוע)</span>
            <input class="input" id="f_base_price" type="number" min="0" step="1" inputmode="numeric" />
          </div>

          <div class="field full" id="f_rulesWrap">
            <span class="field-label">כללי תמחור נוספים</span>
            <p style="font-size:.85rem; color:var(--ink-soft); margin-bottom:.5rem">
              ניתן להוסיף כלל לימי השבוע (לדוגמה: סופ"ש שישי-שבת), או כלל לטווח תאריכים מסוים (חגים, פסטיבלים).
            </p>
            <div id="f_rules"></div>
            <div style="display:flex; gap:.5rem; margin-top:.6rem">
              <button type="button" class="btn btn--small" id="addWeeklyRule">+ כלל ימי שבוע</button>
              <button type="button" class="btn btn--small btn--ghost" id="addRangeRule">+ כלל לטווח תאריכים</button>
            </div>
          </div>

          <!-- תמונות וסרטונים -->
          <div class="field full">
            <span class="field-label">תמונות וסרטונים (הראשון הוא הראשי; סרטון ראשי מנגן אוטומטית)</span>
            <div class="img-upload">
              <span>בחרו קבצי תמונה או וידאו (ניתן לבחור כמה בבת אחת)</span>
              <input type="file" id="f_imgInput" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" multiple />
              <div id="f_imgStatus" style="font-size:.85rem; color:var(--ink-soft); margin-top:.4rem"></div>
            </div>
            <div class="img-grid" id="f_imgGrid"></div>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn--ghost" id="f_cancel">ביטול</button>
          <button type="submit" class="btn" id="f_save">שמירה <span class="arr">←</span></button>
        </div>
      </form>
    `);

    modal.body.style.maxWidth = '920px';
    modal.body.style.maxHeight = '92dvh';
    modal.body.style.overflowY = 'auto';

    // populate
    modal.body.querySelector('#f_name').value         = draft.name || '';
    modal.body.querySelector('#f_type').value         = draft.type_id || '';
    modal.body.querySelector('#f_city').value         = draft.city_id || '';
    modal.body.querySelector('#f_neighborhood').value = draft.neighborhood || '';
    modal.body.querySelector('#f_status').value       = draft.status || 'draft';
    modal.body.querySelector('#f_rooms').value        = draft.rooms ?? '';
    modal.body.querySelector('#f_beds').value         = draft.beds ?? '';
    modal.body.querySelector('#f_max_guests').value   = draft.max_guests ?? '';
    modal.body.querySelector('#f_featured').checked   = !!draft.is_featured;
    modal.body.querySelector('#f_on_request').checked = draft.pricing_mode === 'on_request';
    modal.body.querySelector('#f_description').value  = draft.description || '';
    // הסתרת שדות מחיר אם תיאום אישי
    const priceWrap = modal.body.querySelector('#f_priceWrap');
    const rulesWrap = modal.body.querySelector('#f_rulesWrap');
    function syncPricingMode() {
      const on = modal.body.querySelector('#f_on_request').checked;
      priceWrap.hidden = on;
      rulesWrap.hidden = on;
    }
    syncPricingMode();
    modal.body.querySelector('#f_on_request').addEventListener('change', syncPricingMode);
    // ברירת מחדל לטלפון: של המפרסם הראשי אם זו מתחם חדשה ולא הוזן ערך
    const defaultPhone = (data.settings && data.settings.publish_whatsapp) || '';
    modal.body.querySelector('#f_phone').value        = draft.phone || draft.whatsapp || (!existing ? defaultPhone : '');
    modal.body.querySelector('#f_address').value      = draft.location_address || '';
    modal.body.querySelector('#f_base_price').value   = (draft.base_price ?? draft.price_per_night) ?? '';

    // services checkboxes (all categories combined)
    const svcChecks = modal.body.querySelectorAll('.svc-checks input[type="checkbox"]');
    // wire collapsible admin service categories
    modal.body.querySelectorAll('[data-adm-svc-cat]').forEach((c) => {
      const head = c.querySelector('.svc-cat-coll__head');
      head.addEventListener('click', (ev) => { ev.preventDefault(); c.classList.toggle('is-open'); });
    });
    // אם יש קטגוריה שיש בה שירות מסומן - לפתוח אותה אוטומטית
    setTimeout(() => {
      modal.body.querySelectorAll('[data-adm-svc-cat]').forEach((c) => {
        const anyChecked = Array.from(c.querySelectorAll('input[type="checkbox"]')).some((cb) => cb.checked);
        if (anyChecked) c.classList.add('is-open');
      });
    }, 0);
    const selSvcs = new Set(draft.services || []);
    svcChecks.forEach((cb) => {
      cb.checked = selSvcs.has(cb.value);
      const lbl = cb.parentElement;
      lbl.classList.toggle('is-checked', cb.checked);
      cb.addEventListener('change', () => lbl.classList.toggle('is-checked', cb.checked));
    });

    // pricing rules UI
    renderPricingRules();
    modal.body.querySelector('#addWeeklyRule').addEventListener('click', () => {
      pricingRules = [...pricingRules, { id: 'r' + Date.now().toString(36), type: 'weekly', name: 'סופ"ש', days: [5, 6], price: '', _editing: true }];
      renderPricingRules();
    });
    modal.body.querySelector('#addRangeRule').addEventListener('click', () => {
      pricingRules = [...pricingRules, { id: 'r' + Date.now().toString(36), type: 'range', name: 'חגים', from: '', to: '', price: '', _editing: true }];
      renderPricingRules();
    });

    // images
    renderImageGrid(modal.body.querySelector('#f_imgGrid'), images, (next) => { images = next; }, data.image_categories || []);
    modal.body.querySelector('#f_imgInput').addEventListener('change', async (e2) => {
      const files = Array.from(e2.target.files || []);
      if (!files.length) return;
      const statusEl = modal.body.querySelector('#f_imgStatus');
      statusEl.textContent = `מעלה... (${files.length})`;
      e2.target.disabled = true;
      try {
        for (const f of files) {
          try {
            const r = await api.uploadImage(f);
            images.push({ key: r.key, url: r.url, contentType: r.contentType, category_id: null });
            renderImageGrid(modal.body.querySelector('#f_imgGrid'), images, (next) => { images = next; }, data.image_categories || []);
          } catch (err) {
            ui.toast('העלאת תמונה נכשלה: ' + (err.code || err.message), 'error');
          }
        }
        statusEl.textContent = '';
      } finally {
        e2.target.disabled = false;
        e2.target.value = '';
      }
    });

    modal.body.querySelector('#f_cancel').addEventListener('click', modal.close);
    modal.body.querySelector('#propForm').addEventListener('submit', async (e2) => {
      e2.preventDefault();
      const phoneNum = whatsapp.normalizePhone(modal.body.querySelector('#f_phone').value);
      const cityId = modal.body.querySelector('#f_city').value;
      const cityRec = data.cities.find((c) => c.id === cityId);
      const derivedRegion = cityRec ? cityRec.region_id : null;
      const onRequest = modal.body.querySelector('#f_on_request').checked;
      const payload = {
        ...(existing ? { id: existing.id } : {}),
        name:         modal.body.querySelector('#f_name').value.trim(),
        type_id:      modal.body.querySelector('#f_type').value,
        region_id:    derivedRegion,
        city_id:      cityId,
        neighborhood: modal.body.querySelector('#f_neighborhood').value.trim(),
        rooms:        modal.body.querySelector('#f_rooms').value === '' ? null : Number(modal.body.querySelector('#f_rooms').value),
        beds:         modal.body.querySelector('#f_beds').value === '' ? null : Number(modal.body.querySelector('#f_beds').value),
        max_guests:   modal.body.querySelector('#f_max_guests').value === '' ? null : Number(modal.body.querySelector('#f_max_guests').value),
        is_featured:  modal.body.querySelector('#f_featured').checked,
        pricing_mode: onRequest ? 'on_request' : 'fixed',
        description:  modal.body.querySelector('#f_description').value.trim(),
        phone:        phoneNum,
        whatsapp:     phoneNum,
        location_address: modal.body.querySelector('#f_address').value.trim(),
        services:     Array.from(svcChecks).filter((c) => c.checked).map((c) => c.value),
        base_price:   onRequest ? 0 : Number(modal.body.querySelector('#f_base_price').value),
        pricing_rules: onRequest ? [] : pricingRules.map(cleanRule).filter((r) => r),
        status:       modal.body.querySelector('#f_status').value,
        images,
        occupied_dates: draft.occupied_dates || []
      };

      const errs = clientValidate(payload, data);
      if (errs.length) {
        ui.toast('יש למלא: ' + errs.join(', '), 'error');
        return;
      }

      const btn = modal.body.querySelector('#f_save');
      btn.disabled = true;
      try {
        const r = existing ? await api.updateProperty(payload) : await api.createProperty(payload);
        adminState.upsertProperty(r.property);
        ui.toast('נשמר בהצלחה', 'ok');
        modal.close();
      } catch (err) {
        if (err.data && err.data.fields) {
          ui.toast('ולידציה: ' + err.data.fields.join(', '), 'error');
        } else {
          ui.toast('שמירה נכשלה: ' + (err.code || err.message), 'error');
        }
      } finally {
        btn.disabled = false;
      }
    });

    function renderPricingRules() {
      renderRulesInto(modal.body.querySelector('#f_rules'), pricingRules, (next) => {
        pricingRules = next;
        renderPricingRules();
      });
    }
  }

  // משותף - לרינדור רשימת כללי תמחור עם מצב editing/collapsed
  function renderRulesInto(host, rulesRef, onUpdate) {
    if (!rulesRef.length) {
      host.innerHTML = `<p style="color:var(--ink-soft); font-size:.88rem; padding:.5rem 0">אין כללים נוספים. כל הימים יתומחרו לפי מחיר הבסיס.</p>`;
      return;
    }
    const e2 = ui.escapeHtml;
    host.innerHTML = rulesRef.map((r, i) => r._editing ? editRow(r, i) : collapsedRow(r, i)).join('');

    rulesRef.forEach((r, i) => {
      const row = host.querySelector(`[data-rule-i="${i}"]`);
      if (!row) return;
      if (r._editing) {
        // עדכון שדות
        row.querySelectorAll('[data-field]').forEach((el) => {
          const sync = () => {
            const field = el.dataset.field;
            if (field === 'days') {
              const days = Array.from(row.querySelectorAll(`input[data-field="days"]`))
                .filter((cb) => cb.checked).map((cb) => Number(cb.value));
              rulesRef[i].days = days;
            } else {
              rulesRef[i][field] = el.value;
            }
          };
          el.addEventListener('input', sync);
          el.addEventListener('change', sync);
        });
        const saveBtn = row.querySelector('button[data-act="save"]');
        const cancelBtn = row.querySelector('button[data-act="cancel"]');
        const removeBtn = row.querySelector('button[data-act="remove"]');
        if (saveBtn) saveBtn.addEventListener('click', () => {
          // ולידציה בסיסית
          const price = Number(rulesRef[i].price);
          if (!Number.isFinite(price) || price < 0) { ui.toast('הזינו מחיר תקין', 'error'); return; }
          if (rulesRef[i].type === 'weekly' && (!rulesRef[i].days || !rulesRef[i].days.length)) {
            ui.toast('סמנו לפחות יום אחד', 'error'); return;
          }
          if (rulesRef[i].type === 'range' && (!rulesRef[i].from || !rulesRef[i].to)) {
            ui.toast('בחרו תאריך התחלה וסיום', 'error'); return;
          }
          if (!rulesRef[i].name) rulesRef[i].name = rulesRef[i].type === 'weekly' ? 'כלל שבועי' : 'תקופה';
          rulesRef[i]._editing = false;
          onUpdate([...rulesRef]);
        });
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
          // אם הכלל חדש (לא היה לו קודם name + price) - מחק
          if (!rulesRef[i].price && !rulesRef[i].name) {
            const next = rulesRef.filter((_, j) => j !== i);
            onUpdate(next);
          } else {
            rulesRef[i]._editing = false;
            onUpdate([...rulesRef]);
          }
        });
        if (removeBtn) removeBtn.addEventListener('click', () => {
          const next = rulesRef.filter((_, j) => j !== i);
          onUpdate(next);
        });
      } else {
        const editBtn = row.querySelector('button[data-act="edit"]');
        const delBtn  = row.querySelector('button[data-act="del"]');
        if (editBtn) editBtn.addEventListener('click', () => {
          rulesRef[i]._editing = true;
          onUpdate([...rulesRef]);
        });
        if (delBtn) delBtn.addEventListener('click', () => {
          const next = rulesRef.filter((_, j) => j !== i);
          onUpdate(next);
        });
      }
    });
  }

  function collapsedRow(rule, i) {
    const e2 = ui.escapeHtml;
    let summary = '';
    if (rule.type === 'weekly') {
      const days = (rule.days || []).map((d) => (staticData.WEEKDAYS[d] || {}).name).filter(Boolean).join(', ');
      summary = `<strong>${e2(rule.name)}</strong> – ${e2(ui.formatPrice(rule.price, '₪'))} / לילה <span style="color:var(--ink-soft); font-size:.85rem">(${e2(days || '—')})</span>`;
    } else {
      summary = `<strong>${e2(rule.name)}</strong> – ${e2(ui.formatPrice(rule.price, '₪'))} / לילה <span style="color:var(--ink-soft); font-size:.85rem">(${e2(rule.from)} עד ${e2(rule.to)})</span>`;
    }
    return `
      <div class="rule-row rule-row--collapsed" data-rule-i="${i}" style="display:flex; align-items:center; justify-content:space-between; gap:.7rem; background:var(--paper-2); border:1px solid var(--line); border-radius:var(--r); padding:.6rem .8rem; margin-bottom:.4rem">
        <span>${summary}</span>
        <span style="display:flex; gap:.4rem">
          <button type="button" class="btn btn--small btn--ghost" data-act="edit">עריכה</button>
          <button type="button" class="btn btn--small" style="background:var(--coral-deep); border-color:var(--coral-deep); color:#fff" data-act="del">מחיקה</button>
        </span>
      </div>
    `;
  }

  function editRow(rule, i) {
    const e2 = ui.escapeHtml;
    if (rule.type === 'weekly') {
      return `
        <div class="rule-row" data-rule-i="${i}" style="background:var(--paper); border:1.5px solid var(--ink); border-radius:var(--r); padding:.8rem; margin-bottom:.5rem">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-bottom:.6rem">
            <input class="input" data-field="name" placeholder="שם הכלל (לדוג' סופ&quot;ש)" value="${e2(rule.name || '')}" />
            <input class="input" data-field="price" type="number" min="0" step="1" placeholder="מחיר ללילה" value="${e2(rule.price ?? '')}" />
          </div>
          <div style="display:flex; gap:.3rem; flex-wrap:wrap; margin-bottom:.7rem">
            ${staticData.WEEKDAYS.map((w) => `
              <label style="display:inline-flex; align-items:center; gap:.3em; background:var(--paper-2); padding:.25em .6em; border-radius:99px; font-size:.82rem">
                <input type="checkbox" data-field="days" value="${w.id}" ${(rule.days||[]).includes(w.id) ? 'checked' : ''} />
                ${e2(w.name)}
              </label>
            `).join('')}
          </div>
          <div style="display:flex; gap:.4rem; justify-content:flex-end">
            <button type="button" class="btn btn--small btn--ghost" data-act="cancel">ביטול</button>
            <button type="button" class="btn btn--small btn--ghost" data-act="remove" style="color:var(--coral-deep)">מחיקה</button>
            <button type="button" class="btn btn--small" data-act="save">שמירה</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="rule-row" data-rule-i="${i}" style="background:var(--paper); border:1.5px solid var(--ink); border-radius:var(--r); padding:.8rem; margin-bottom:.5rem">
        <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr 1fr; gap:.5rem; margin-bottom:.7rem">
          <input class="input" data-field="name" placeholder="שם (לדוג' חגים)" value="${e2(rule.name || '')}" />
          <input class="input" data-field="from" type="date" value="${e2(rule.from || '')}" />
          <input class="input" data-field="to" type="date" value="${e2(rule.to || '')}" />
          <input class="input" data-field="price" type="number" min="0" step="1" placeholder="מחיר" value="${e2(rule.price ?? '')}" />
        </div>
        <div style="display:flex; gap:.4rem; justify-content:flex-end">
          <button type="button" class="btn btn--small btn--ghost" data-act="cancel">ביטול</button>
          <button type="button" class="btn btn--small btn--ghost" data-act="remove" style="color:var(--coral-deep)">מחיקה</button>
          <button type="button" class="btn btn--small" data-act="save">שמירה</button>
        </div>
      </div>
    `;
  }

  // עורך מיוחד למחירים בלבד
  function openPricesOnly(prop) {
    const e = ui.escapeHtml;
    const draft = JSON.parse(JSON.stringify(prop));
    let rules = Array.isArray(draft.pricing_rules) ? [...draft.pricing_rules] : [];
    const modal = ui.openModal(`
      <h2>עדכון מחירים - ${e(prop.name)}</h2>
      <p style="color:var(--ink-soft); margin-bottom:1rem">עדכון מחיר בסיס וכללי תמחור בלי לגעת בפרטים האחרים.</p>
      <form id="pricesForm" class="adm-form" style="border:0; padding:0; background:transparent">
        <div class="adm-form-grid">
          <div class="field full">
            <label class="field-label" for="p_base">מחיר בסיס ללילה (אמצע השבוע)</label>
            <input class="input" id="p_base" type="number" min="0" step="1" required value="${e(draft.base_price ?? draft.price_per_night ?? '')}" />
          </div>
          <div class="field full">
            <span class="field-label">כללי תמחור נוספים</span>
            <div id="p_rules"></div>
            <div style="display:flex; gap:.5rem; margin-top:.6rem">
              <button type="button" class="btn btn--small" id="p_addWeekly">+ כלל ימי שבוע</button>
              <button type="button" class="btn btn--small btn--ghost" id="p_addRange">+ כלל לטווח תאריכים</button>
            </div>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--ghost" id="p_cancel">ביטול</button>
          <button type="submit" class="btn" id="p_save">שמירה <span class="arr">←</span></button>
        </div>
      </form>
    `);
    modal.body.style.maxWidth = '720px';
    modal.body.style.maxHeight = '90dvh';
    modal.body.style.overflowY = 'auto';

    function rerender() {
      renderRulesInto(modal.body.querySelector('#p_rules'), rules, (next) => {
        rules = next;
        rerender();
      });
    }
    rerender();

    modal.body.querySelector('#p_addWeekly').addEventListener('click', () => {
      rules.push({ id: 'r' + Date.now().toString(36), type: 'weekly', name: 'סופ"ש', days: [5, 6], price: '', _editing: true });
      rerender();
    });
    modal.body.querySelector('#p_addRange').addEventListener('click', () => {
      rules.push({ id: 'r' + Date.now().toString(36), type: 'range', name: 'חגים', from: '', to: '', price: '', _editing: true });
      rerender();
    });
    modal.body.querySelector('#p_cancel').addEventListener('click', modal.close);
    modal.body.querySelector('#pricesForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const base = Number(modal.body.querySelector('#p_base').value);
      if (!Number.isFinite(base) || base < 0) { ui.toast('מחיר בסיס לא תקין', 'error'); return; }
      const cleanRules = rules.map(cleanRule).filter(Boolean);
      const payload = { ...prop, base_price: base, pricing_rules: cleanRules };
      const btn = modal.body.querySelector('#p_save');
      btn.disabled = true;
      try {
        const r = await api.updateProperty(payload);
        adminState.upsertProperty(r.property);
        ui.toast('מחירים עודכנו', 'ok');
        modal.close();
      } catch (err) {
        ui.toast('שמירה נכשלה: ' + (err.code || err.message), 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function cleanRule(r) {
    if (!r) return null;
    const price = Number(r.price);
    if (!Number.isFinite(price) || price < 0) return null;
    if (r.type === 'weekly') {
      const days = (r.days || []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      if (!days.length) return null;
      return { id: r.id, type: 'weekly', name: String(r.name || '').trim() || 'כלל שבועי', days, price };
    }
    if (r.type === 'range') {
      if (!r.from || !r.to) return null;
      if (r.to < r.from) return null;
      return { id: r.id, type: 'range', name: String(r.name || '').trim() || 'תקופה', from: r.from, to: r.to, price };
    }
    return null;
  }

  // ============================================================
  // מסך זמינות בלבד (לוח שנה לעדכון תפוסה)
  // ============================================================
  function openAvailability(prop) {
    const e = ui.escapeHtml;
    let occupied = new Set(prop.occupied_dates || []);

    const modal = ui.openModal(`
      <h2>זמינות - ${e(prop.name)}</h2>
      <p style="color:var(--ink-soft); margin-bottom:1rem">
        לחיצה על יום מסמנת אותו כתפוס. לחיצה חוזרת משחררת.
      </p>
      <div id="availCal"></div>
      <div class="cal-legend">
        <span><span class="sw sw--free"></span> פנוי</span>
        <span><span class="sw sw--occ"></span> תפוס</span>
        <span style="color:var(--ink-soft)">סך הכל ימים תפוסים: <strong id="occCount">${occupied.size}</strong></span>
        <button type="button" id="clearAll" style="background:none; border:0; color:var(--coral); font-weight:700; cursor:pointer">איפוס כל היומן</button>
      </div>
      <div class="modal__actions" style="margin-top:1.4rem">
        <button type="button" class="btn btn--ghost" id="availCancel">ביטול</button>
        <button type="button" class="btn" id="availSave">שמירה <span class="arr">←</span></button>
      </div>
    `);
    modal.body.style.maxWidth = '720px';
    modal.body.style.maxHeight = '92dvh';
    modal.body.style.overflowY = 'auto';

    function updateCount() {
      modal.body.querySelector('#occCount').textContent = String(occupied.size);
    }
    function mount() {
      dates.mountCalendar({
        container: modal.body.querySelector('#availCal'),
        year: new Date().getFullYear(),
        monthIdx: new Date().getMonth(),
        occupied,
        selectable: true,
        onToggle: updateCount
      });
    }
    mount();

    modal.body.querySelector('#clearAll').addEventListener('click', () => {
      if (!window.confirm('לאפס את כל הימים התפוסים?')) return;
      occupied = new Set();
      updateCount();
      mount();
    });
    modal.body.querySelector('#availCancel').addEventListener('click', modal.close);
    modal.body.querySelector('#availSave').addEventListener('click', async () => {
      const next = { ...prop, occupied_dates: Array.from(occupied).sort() };
      try {
        const r = await api.updateProperty(next);
        adminState.upsertProperty(r.property);
        ui.toast('זמינות נשמרה', 'ok');
        modal.close();
      } catch (err) {
        ui.toast('שמירה נכשלה: ' + (err.code || err.message), 'error');
      }
    });
  }

  function renderImageGrid(host, images, setImages, categories) {
    const e = ui.escapeHtml;
    const cats = categories || [];
    if (!images.length) {
      host.innerHTML = `<p style="color:var(--ink-soft); padding:.5rem">אין תמונות עדיין.</p>`;
      return;
    }
    host.innerHTML = images.map((img, i) => {
      const url = listing.imageUrl(img);
      const curCat = img.category_id || '';
      const isVideo = /^video\//.test(img.contentType || '') || /\.(mp4|webm|mov)$/i.test(url || '');
      const media = isVideo
        ? `<video src="${e(url)}" muted playsinline preload="metadata"></video><span class="media-badge">סרטון</span>`
        : `<img src="${e(url)}" alt="תמונה ${i + 1}" />`;
      return `
        <div class="img-cell" data-i="${i}">
          ${i === 0 ? '<span class="main-flag">ראשי</span>' : ''}
          ${media}
          <select class="img-cat" data-i="${i}" aria-label="קטגוריה">
            <option value="">כללי</option>
            ${cats.map((c) => `<option value="${e(c.id)}" ${curCat === c.id ? 'selected' : ''}>${e(c.name)}</option>`).join('')}
          </select>
          <div class="img-actions">
            ${i !== 0 ? `<button type="button" data-act="setMain" data-i="${i}">הגדר כראשי</button>` : ''}
            <button type="button" class="danger" data-act="remove" data-i="${i}">הסר</button>
          </div>
        </div>
      `;
    }).join('');
    host.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i);
        if (btn.dataset.act === 'remove') {
          const next = images.filter((_, j) => j !== i);
          setImages(next);
          renderImageGrid(host, next, setImages, cats);
        } else if (btn.dataset.act === 'setMain') {
          const next = [images[i], ...images.filter((_, j) => j !== i)];
          setImages(next);
          renderImageGrid(host, next, setImages, cats);
        }
      });
    });
    host.querySelectorAll('select.img-cat').forEach((sel) => {
      sel.addEventListener('change', () => {
        const i = Number(sel.dataset.i);
        images[i] = { ...images[i], category_id: sel.value || null };
        setImages(images);
      });
    });
  }

  function clientValidate(p, data) {
    const errs = [];
    if (!p.name) errs.push('שם');
    if (!p.type_id || !data.types.find((t) => t.id === p.type_id)) errs.push('סוג נכס');
    if (!p.city_id || !data.cities.find((c) => c.id === p.city_id)) errs.push('עיר');
    const city = data.cities.find((c) => c.id === p.city_id);
    if (city && !city.region_id) errs.push('העיר חייבת להיות משויכת לאזור (עדכנו ב"הגדרת שדות")');
    if (p.pricing_mode !== 'on_request') {
      if (!Number.isFinite(p.base_price) || p.base_price < 0) errs.push('מחיר בסיס');
    }
    if (!whatsapp.isValidIntlPhone(p.phone)) errs.push('טלפון / ווצאפ תקין');
    return errs;
  }

  function blankProperty() {
    return {
      name: '', type_id: '', region_id: '', city_id: '', neighborhood: '',
      rooms: '', beds: '', max_guests: '',
      is_featured: false,
      pricing_mode: 'fixed',
      description: '',
      phone: '', whatsapp: '',
      location_address: '',
      services: [],
      base_price: '',
      pricing_rules: [],
      status: 'draft',
      images: [],
      occupied_dates: []
    };
  }

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  window.KN = window.KN || {};
  window.KN.adminProperties = { init, openEditor };
})();
