// ============================================================
// js/property.js – דף נכס יחיד
// ============================================================

(function () {
  const { api, ui, listing, whatsapp, dates, staticData } = window.KN;

  let DATA = null;
  let PROP = null;
  let galleryIdx = 0;
  let galleryCat = '';        // קטגוריה פעילה ('' = הכל)
  let galleryImages = [];     // תמונות מסוננות נוכחיות

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    ui.initBurger();

    const id = ui.readQuery().id;
    if (!id) return renderNotFound();

    try {
      DATA = await api.getPublicData();
    } catch (e) {
      console.error(e);
      ui.toast('בעיית רשת בטעינת המתחם.', 'error');
      return renderNotFound();
    }

    PROP = DATA.properties.find((p) => p.id === id);
    if (!PROP) return renderNotFound();

    render();
  }

  function renderNotFound() {
    document.getElementById('propBody').innerHTML = `
      <div class="empty">
        <h3>המתחם לא נמצאה</h3>
        <p>יכול להיות שהיא הוסרה או שהקישור שגוי.</p>
        <p style="margin-top:1.4rem"><a class="btn btn--ghost" href="results.html">חזרה לחיפוש</a></p>
      </div>
    `;
  }

  function render() {
    const e = ui.escapeHtml;
    const type    = listing.lookupType(DATA.types, PROP.type_id);
    const city    = listing.lookupCity(DATA.cities, PROP.city_id);
    const region  = staticData ? staticData.lookupRegion(PROP.region_id || (city && city.region_id)) : null;
    const groupedSvc = staticData ? staticData.servicesByCategory(PROP.services || []) : [];
    const onRequest = PROP.pricing_mode === 'on_request';
    const regionTxt = [type && type.name, city && city.name, region && region.name, PROP.neighborhood].filter(Boolean).join(' · ');
    const sp = listing.startingPrice(PROP);
    const priceTxt = sp != null ? ui.formatPrice(sp, DATA.settings.currency) : '';

    document.title = `${PROP.name} · קל נופש`;

    const meta = [];
    if (PROP.rooms) meta.push(`<span><em class="d">●</em> ${e(PROP.rooms)} חדרים</span>`);
    if (PROP.beds)  meta.push(`<span><em class="d">●</em> ${e(PROP.beds)} מיטות</span>`);
    if (PROP.max_guests) meta.push(`<span><em class="d">●</em> עד ${e(PROP.max_guests)} אורחים</span>`);
    if (type)       meta.push(`<span><em class="d">●</em> ${e(type.name)}</span>`);
    if (region)     meta.push(`<span><em class="d">●</em> ${e(region.name)}</span>`);

    // מחירים - בסיס + כללים
    const priceBreakdown = buildPriceBreakdown(PROP, DATA.settings.currency);

    document.getElementById('propBody').innerHTML = `
      <div class="prop__layout">
        <div class="prop__main">
          ${buildGalleryHtml(PROP)}
          ${regionTxt ? `<span class="prop__region">${e(regionTxt)}</span>` : ''}
          <h1>${e(PROP.name)}</h1>
          <div class="prop__meta">${meta.join('')}</div>

          ${PROP.description ? `
            <section class="prop__section">
              <h2>על המתחם</h2>
              <p class="prop__description">${e(PROP.description)}</p>
            </section>
          ` : ''}

          ${groupedSvc.length ? `
            <section class="prop__section">
              <h2>שירותים</h2>
              <div class="svc-categories-flat">
                ${groupedSvc.map((grp) => `
                  <div class="svc-cat-flat">
                    <p class="svc-cat__title">${e(grp.cat.name)}</p>
                    <div class="svc-grid">
                      ${grp.items.map((s) => `
                        <span class="svc-item">${staticData.serviceIconSvg(s)} ${e(s.name)}</span>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          ${priceBreakdown ? `
            <section class="prop__section">
              <h2>מחירים</h2>
              ${priceBreakdown}
            </section>
          ` : ''}

          ${PROP.location_address ? `
            <section class="coll" id="collLocation">
              <button type="button" class="coll__head" aria-expanded="false">
                מיקום
                <span class="ch-arr">▾</span>
              </button>
              <div class="coll__body">
                <p style="margin-bottom:.8rem; color:var(--ink-soft)">${e(PROP.location_address)}</p>
                <iframe
                  src="https://www.google.com/maps?q=${encodeURIComponent(PROP.location_address)}&output=embed"
                  width="100%" height="280" style="border:0; border-radius:var(--r)"
                  loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                  title="מפה - ${e(PROP.name)}"></iframe>
                <p style="margin-top:.6rem">
                  <a class="tlink" target="_blank" rel="noopener"
                     href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(PROP.location_address)}">
                    ניווט במפות גוגל ←
                  </a>
                </p>
              </div>
            </section>
          ` : ''}

          <section class="coll" id="collCalendar">
            <button type="button" class="coll__head" aria-expanded="false">
              זמינות
              <span class="ch-arr">▾</span>
            </button>
            <div class="coll__body">
              <div id="calHost"></div>
              <div class="cal-legend" style="margin-top:.8rem">
                <span><span class="sw sw--free"></span> פנוי</span>
                <span><span class="sw sw--occ"></span> תפוס</span>
              </div>
            </div>
          </section>
        </div>

        <aside class="prop__side">
          ${PROP.is_featured ? '<span class="prop__badge">מומלץ</span>' : ''}
          <div class="prop__price">
            ${onRequest ? `
              <span class="n">מחיר בתיאום אישי</span>
            ` : `
              <span class="from">החל מ-</span>
              <span class="n">${e(priceTxt)}</span>
              <span class="u">ללילה</span>
            `}
          </div>
          <h3>יצירת קשר</h3>
          <p>מעוניינים במתחם? נחזור אליכם מיד.</p>
          ${PROP.phone ? `<a class="btn btn--ghost" href="tel:+${e(PROP.phone)}">התקשרו</a>` : ''}
          <button class="btn btn--wa" type="button" id="waBtn">שליחה בווצאפ</button>
        </aside>
      </div>
    `;

    wireGallery();
    wireCollapsibles();
    document.getElementById('waBtn').addEventListener('click', openContactFlow);

    // mount calendar inside collapsible
    if (window.KN.dates) {
      window.KN.dates.mountCalendar({
        container: document.getElementById('calHost'),
        year: new Date().getFullYear(),
        monthIdx: new Date().getMonth(),
        occupied: new Set(PROP.occupied_dates || []),
        selectable: false
      });
    }

    ui.initReveal();
  }

  function buildPriceBreakdown(prop, currency) {
    const base = Number(prop.base_price ?? prop.price_per_night) || 0;
    const rules = prop.pricing_rules || [];
    if (!rules.length) return null;
    const e = ui.escapeHtml;
    const lines = [];
    lines.push(`<p class="price-line">אמצע השבוע, החל מ-${e(ui.formatPrice(base, currency))} ללילה</p>`);
    rules.forEach((r) => {
      const p = Number(r.price) || 0;
      lines.push(`<p class="price-line">${e(r.name || 'כלל')}, החל מ-${e(ui.formatPrice(p, currency))} ללילה</p>`);
    });
    return lines.join('');
  }

  function isVideoMedia(m) {
    return m && (/^video\//.test(m.contentType || '') || /\.(mp4|webm|ogg|mov)$/i.test(m.url || m.key || ''));
  }

  function buildGalleryHtml(prop) {
    const allMedia = (prop.images || []).filter((img) => listing.imageUrl(img));
    const e = ui.escapeHtml;
    if (!allMedia.length) {
      return `
        <div class="gallery">
          <div class="gallery__main">
            <div class="placeholder">${e(prop.name).slice(0, 1) || '·'}</div>
          </div>
        </div>
      `;
    }
    const cats = DATA.image_categories || [];
    const usedCatIds = new Set(allMedia.map((im) => im.category_id).filter(Boolean));
    const tabs = [{ id: '', name: 'הכל' }].concat(cats.filter((c) => usedCatIds.has(c.id)));
    const showTabs = tabs.length > 1;

    return `
      <div class="gallery" id="gallery">
        ${showTabs ? `
          <div class="gallery__tabs" id="galleryTabs">
            ${tabs.map((t) => `<button type="button" data-cat="${e(t.id)}" class="${t.id === '' ? 'is-active' : ''}">${e(t.name)}</button>`).join('')}
          </div>
        ` : ''}
        <div class="gallery__main" id="galleryMain"></div>
        <div class="gallery__thumbs" id="galleryThumbs"></div>
      </div>
    `;
  }

  function wireGallery() {
    const allMedia = (PROP.images || []).filter((img) => listing.imageUrl(img));
    if (!allMedia.length) return;
    const mainHost = document.getElementById('galleryMain');
    const thumbsHost = document.getElementById('galleryThumbs');
    const e = ui.escapeHtml;

    function applyCat(cat) {
      galleryCat = cat;
      galleryImages = !cat
        ? allMedia
        : allMedia.filter((im) => im.category_id === cat);
      galleryIdx = 0;
      renderThumbs();
      show(0, true);
      const tabs = document.querySelectorAll('#galleryTabs button[data-cat]');
      tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.cat === cat));
    }
    function renderThumbs() {
      if (!thumbsHost) return;
      if (galleryImages.length <= 1) { thumbsHost.innerHTML = ''; thumbsHost.style.display = 'none'; return; }
      thumbsHost.style.display = '';
      thumbsHost.innerHTML = galleryImages.map((m, i) => {
        const url = listing.imageUrl(m);
        const isVid = isVideoMedia(m);
        const thumb = isVid
          ? `<div class="thumb-vid"><video src="${e(url)}" muted playsinline preload="metadata"></video><span class="thumb-vid__play">▶</span></div>`
          : `<img src="${e(url)}" alt="" />`;
        return `<button type="button" data-i="${i}" class="${i === 0 ? 'is-active' : ''}">${thumb}</button>`;
      }).join('');
      thumbsHost.querySelectorAll('button').forEach((t) => {
        t.addEventListener('click', () => show(Number(t.dataset.i), true));
      });
    }
    function show(i, autoplay) {
      if (!galleryImages.length) return;
      galleryIdx = (i + galleryImages.length) % galleryImages.length;
      const m = galleryImages[galleryIdx];
      const url = listing.imageUrl(m);
      const isVid = isVideoMedia(m);
      const onlyOne = galleryImages.length <= 1;
      const navHtml = onlyOne ? '' : `
        <button type="button" class="gallery__nav gallery__nav--prev" id="galleryPrev" aria-label="קודם">→</button>
        <button type="button" class="gallery__nav gallery__nav--next" id="galleryNext" aria-label="הבא">←</button>
        <span class="gallery__index">${galleryIdx + 1} / ${galleryImages.length}</span>
      `;
      if (isVid) {
        // הוידאו הראשי (אינדקס 0) מתנגן אוטומטית כאשר הוא מסומן כראשי
        const isMain = galleryIdx === 0;
        const autoAttr = (autoplay && isMain) ? ' autoplay' : '';
        mainHost.innerHTML = `
          <video src="${e(url)}" controls playsinline${autoAttr} muted></video>
          ${navHtml}
        `;
      } else {
        mainHost.innerHTML = `
          <img src="${e(url)}" alt="${e(PROP.name)}" />
          ${navHtml}
        `;
      }
      if (!onlyOne) {
        document.getElementById('galleryPrev').addEventListener('click', () => show(galleryIdx - 1, true));
        document.getElementById('galleryNext').addEventListener('click', () => show(galleryIdx + 1, true));
      }
      thumbsHost.querySelectorAll('button').forEach((t, j) => t.classList.toggle('is-active', j === galleryIdx));
    }

    document.addEventListener('keydown', (ev) => {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
      if (ev.key === 'ArrowLeft')  show(galleryIdx + 1, true);
      if (ev.key === 'ArrowRight') show(galleryIdx - 1, true);
    });
    const tabs = document.querySelectorAll('#galleryTabs button[data-cat]');
    tabs.forEach((t) => t.addEventListener('click', () => applyCat(t.dataset.cat)));

    applyCat('');
  }

  function wireSvcCollapse() {
    document.querySelectorAll('[data-svc-cat]').forEach((c) => {
      const head = c.querySelector('.svc-cat-coll__head');
      head.addEventListener('click', () => c.classList.toggle('is-open'));
    });
  }

  function wireCollapsibles() {
    document.querySelectorAll('.coll').forEach((c) => {
      const head = c.querySelector('.coll__head');
      head.addEventListener('click', () => {
        const open = c.classList.toggle('is-open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function openContactFlow() {
    if (!PROP.whatsapp) {
      ui.toast('מספר ווצאפ חסר למתחם. נסו לחייג ישירות.', 'error');
      return;
    }
    const e = ui.escapeHtml;
    const m = ui.openModal(`
      <h2>לפני שליחת ההודעה</h2>
      <p>מה השם שלכם? נוסיף אותו להודעת הווצאפ.</p>
      <form id="nameForm" novalidate>
        <div class="field">
          <label for="clientName" class="field-label">שם פרטי</label>
          <input class="input" type="text" id="clientName" required minlength="1" placeholder="איך לקרוא לכם?" />
          <span class="field-error hidden" id="nameError">נא להזין שם.</span>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">ביטול</button>
          <button type="submit" class="btn">המשך לווצאפ <span class="arr">←</span></button>
        </div>
      </form>
    `);

    const form = m.body.querySelector('#nameForm');
    const input = m.body.querySelector('#clientName');
    const error = m.body.querySelector('#nameError');
    setTimeout(() => input.focus(), 30);

    m.body.querySelector('#cancelBtn').addEventListener('click', m.close);

    form.addEventListener('submit', (e2) => {
      e2.preventDefault();
      const name = input.value.trim();
      if (!name) {
        error.classList.remove('hidden');
        input.focus();
        return;
      }
      try {
        const msg = `היי, שמי ${name}. אני מעוניין בפרטים נוספים ולשוחח על סגירת מתחם הנופש ${PROP.name}.`;
        whatsapp.openWhatsapp(PROP.whatsapp, msg);
        m.close();
      } catch (err) {
        ui.toast('מספר ווצאפ לא תקין.', 'error');
      }
    });
  }
})();
