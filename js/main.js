// ============================================================
// js/main.js – לוגיקת דף הבית
// ============================================================

(function () {
  const { api, ui, listing, whatsapp, dates, staticData } = window.KN;
  const COPY = window.COPY;

  let DATA = null;
  let selectedMonths = [];
  let locMode = 'region';
  const RECENT_LIMIT = 6;
  let showAll = false;
  let homeSort = 'featured';
  let msType, msRegion, msCity;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    applyStaticCopy();
    ui.initBurger();
    ui.initReveal();
    wireNameSearch();
    wireAdvancedSearch();
    wirePublishCta();
    wireLocationToggle();
    wireDateMode();
    wirePriceValidation();
    wireDateValidation();
    wireSmoothAnchors();
    wireHomeLink();
    wireDateKeyguard();
    wireShowMore();
    wireHomeSort();
    wireAdvToggle();

    try {
      DATA = await api.getPublicData();
    } catch (e) {
      console.error(e);
      DATA = { properties: [], types: [], cities: [], settings: defaultSettings() };
      ui.toast('בעיית רשת בטעינת הנתונים. נסו לרענן.', 'error');
    }

    populateLists();
    renderListings();
    renderRegionGrid();
    updatePublishVisibility();
  }

  function defaultSettings() {
    return { currency: '₪', price_min: 100, price_max: 3000, publish_whatsapp: '' };
  }

  function applyStaticCopy() {
    const btn = document.getElementById('publishBtn');
    if (btn) btn.innerHTML = `${ui.escapeHtml(COPY.home.publishStripCta)} <span class="arr">←</span>`;
  }

  function populateLists() {
    msType = window.KN.multiselect.mount({
      container: document.getElementById('typeMS'),
      items: DATA.types, selected: [], allLabel: 'כל הסוגים',
      onChange: (sel) => { document.getElementById('type').value = sel.join(','); }
    });
    msRegion = window.KN.multiselect.mount({
      container: document.getElementById('regionMS'),
      items: staticData.REGIONS, selected: [], allLabel: 'כל האזורים',
      onChange: (sel) => { document.getElementById('region').value = sel.join(','); }
    });
    msCity = window.KN.multiselect.mount({
      container: document.getElementById('cityMS'),
      items: DATA.cities, selected: [], allLabel: 'כל הערים',
      onChange: (sel) => { document.getElementById('city').value = sel.join(','); }
    });

    const today = dates.today();
    document.getElementById('dateFrom').min = today;
    document.getElementById('dateTo').min   = today;

    buildMonthGrid();
  }

  // ============================================================
  // Month grid (multi-select)
  // ============================================================
  function buildMonthGrid() {
    const host = document.getElementById('monthGrid');
    if (!host) return;
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const v = d.getFullYear() + '-' + dates.pad(d.getMonth() + 1);
      const label = dates.monthLabel(d.getFullYear(), d.getMonth());
      months.push({ v, label });
    }
    host.innerHTML = months.map((m) => {
      const checked = selectedMonths.includes(m.v) ? 'is-selected' : '';
      return `<button type="button" class="${checked}" data-m="${ui.escapeHtml(m.v)}">${ui.escapeHtml(m.label)}</button>`;
    }).join('');
    host.querySelectorAll('button[data-m]').forEach((b) => {
      b.addEventListener('click', () => {
        const v = b.dataset.m;
        if (selectedMonths.includes(v)) {
          selectedMonths = selectedMonths.filter((x) => x !== v);
        } else {
          selectedMonths = [...selectedMonths, v].sort();
        }
        document.getElementById('flexMonths').value = selectedMonths.join(',');
        buildMonthGrid();
      });
    });
    document.getElementById('flexMonths').value = selectedMonths.join(',');
  }

  // ============================================================
  // Name search (with clear)
  // ============================================================
  function wireNameSearch() {
    const form = document.getElementById('nameSearchForm');
    const input = document.getElementById('nameQ');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = listing.pagesPath() + 'results.html' + ui.writeQuery({ q });
    });
  }

  function wireDateMode() {
    const hidden = document.getElementById('dateMode');
    const exact  = document.getElementById('dateExactWrap');
    const flex   = document.getElementById('dateFlexWrap');
    const label  = document.getElementById('dateModeLabel');
    const toggle = document.getElementById('dateModeToggle');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo   = document.getElementById('dateTo');

    function apply(mode) {
      hidden.value = mode;
      if (mode === 'flex') {
        dateFrom.value = '';
        dateTo.value = '';
        exact.hidden = true;
        flex.hidden = false;
        label.textContent = 'בחירת חודשים גמישים';
        toggle.textContent = 'אפשר גם לבחור תאריך מדויק (כניסה / יציאה)';
      } else {
        selectedMonths = [];
        document.getElementById('flexMonths').value = '';
        buildMonthGrid();
        exact.hidden = false;
        flex.hidden = true;
        label.textContent = 'בחירת תאריך מדויק';
        toggle.textContent = 'אפשר גם לבחור תאריך גמיש (לפי חודש)';
      }
    }
    toggle.addEventListener('click', () => apply(hidden.value === 'flex' ? 'exact' : 'flex'));
    apply(hidden.value || 'exact');
  }

  function wirePriceValidation() {
    const min  = document.getElementById('priceMin');
    const max  = document.getElementById('priceMax');
    const form = max.closest('form');
    const submitBtn = form.querySelector('.search__go');
    let errEl = form.querySelector('.price-err');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'price-err hidden';
      errEl.textContent = 'שימו לב: מחיר המקסימום לא יכול להיות קטן ממחיר המינימום';
      form.querySelector('.search__body').appendChild(errEl);
    }
    function check() {
      const mn = Number(min.value);
      const mx = Number(max.value);
      const invalid = min.value !== '' && max.value !== '' &&
                      Number.isFinite(mn) && Number.isFinite(mx) && mx < mn;
      errEl.classList.toggle('hidden', !invalid);
      if (submitBtn) submitBtn.disabled = invalid;
    }
    min.addEventListener('input', check);
    max.addEventListener('input', check);
  }

  function wireDateValidation() {
    const f = document.getElementById('dateFrom');
    const t = document.getElementById('dateTo');
    function sync() {
      if (f.value) t.min = f.value;
      if (t.value && f.value && t.value < f.value) t.value = f.value;
    }
    f.addEventListener('change', sync);
    t.addEventListener('change', sync);
  }

  function wireSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const target = (id === 'search')
          ? document.getElementById('nameSearchForm')
          : document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
        // close mobile nav if open
        const nav = document.getElementById('nav');
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
          const burger = document.getElementById('burger');
          if (burger) burger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function wireHomeLink() {
    const path = window.location.pathname;
    const onHome = path === '/' || /\/(index\.html?)?$/.test(path);
    if (!onHome) return;
    const seen = new Set();
    document.querySelectorAll('a.brand[href], a[href="index.html"], a[href="./"], a[href="/"]').forEach((a) => {
      if (seen.has(a)) return;
      seen.add(a);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function wireDateKeyguard() {
    const allowed = new Set(['Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','F5']);
    document.querySelectorAll('input[type="date"], input[type="month"]').forEach((el) => {
      el.addEventListener('keydown', (e) => {
        if (!allowed.has(e.key)) e.preventDefault();
      });
    });
  }

  function wireAdvancedSearch() {
    const form = document.getElementById('searchForm');
    const liveCount = document.getElementById('liveCount');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const params = collectParams();
      window.location.href = listing.pagesPath() + 'results.html' + ui.writeQuery(params);
    });
    ['input', 'change'].forEach((evt) => {
      form.addEventListener(evt, updateLiveCount);
    });
    function updateLiveCount() {
      if (!DATA) return;
      const params = collectParams();
      const items = listing.filter(DATA.properties, params, DATA);
      liveCount.textContent = items.length === 1 ? 'תוצאה אחת' : `${items.length} תוצאות`;
    }
  }

  function collectParams() {
    const nameInput = document.getElementById('nameQ');
    const guestsEl = document.getElementById('guests');
    return {
      q:         nameInput ? nameInput.value.trim() : '',
      type:      document.getElementById('type').value,
      region:    locMode === 'region' ? document.getElementById('region').value : '',
      city:      locMode === 'city'   ? document.getElementById('city').value   : '',
      guests:    guestsEl ? guestsEl.value : '',
      dateMode:  document.getElementById('dateMode').value || 'any',
      dateFrom:  document.getElementById('dateFrom').value,
      dateTo:    document.getElementById('dateTo').value,
      flexMonths: document.getElementById('flexMonths').value,
      priceMin:  document.getElementById('priceMin').value,
      priceMax:  document.getElementById('priceMax').value
    };
  }

  function wireLocationToggle() {
    const toggle = document.getElementById('locToggle');
    if (!toggle) return;
    const regionHost = document.getElementById('regionMS');
    const cityHost   = document.getElementById('cityMS');
    const regionInput = document.getElementById('region');
    const cityInput   = document.getElementById('city');
    function apply(mode) {
      locMode = mode;
      toggle.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('active', b.dataset.loc === mode);
      });
      if (mode === 'region') {
        cityInput.value = '';
        msCity && msCity.setSelected([]);
        cityHost.hidden = true;
        regionHost.hidden = false;
      } else {
        regionInput.value = '';
        msRegion && msRegion.setSelected([]);
        regionHost.hidden = true;
        cityHost.hidden = false;
      }
    }
    toggle.querySelectorAll('button[data-loc]').forEach((b) => {
      b.addEventListener('click', () => apply(b.dataset.loc));
    });
    apply(locMode);
  }

  function renderListings() {
    const grid = document.getElementById('grid');
    const showMoreWrap = document.getElementById('showMoreWrap');
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (!DATA.properties.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <h3>אין כרגע מתחמים באתר.</h3>
          <p>המפרסם עדיין לא הזין מתחמים. נסו שוב מאוחר יותר.</p>
        </div>
      `;
      showMoreWrap.hidden = true;
      return;
    }
    const sorted = listing.sort(DATA.properties, homeSort);
    const display = showAll ? sorted : sorted.slice(0, RECENT_LIMIT);
    listing.renderGrid(grid, display, DATA, '');

    if (sorted.length > RECENT_LIMIT) {
      showMoreWrap.hidden = false;
      showMoreBtn.textContent = showAll
        ? 'הראה פחות ←'
        : `צפייה בכל המתחמים שלנו (${sorted.length}) ←`;
    } else {
      showMoreWrap.hidden = true;
    }
  }

  function wireAdvToggle() {
    const btn = document.getElementById('advToggle');
    const form = document.getElementById('searchForm');
    if (!btn || !form) return;
    btn.addEventListener('click', () => {
      const willOpen = form.hidden;
      form.hidden = !willOpen;
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      btn.classList.toggle('is-open', willOpen);
    });
  }

  function wireHomeSort() {
    const sel = document.getElementById('homeSort');
    if (!sel) return;
    sel.addEventListener('change', () => {
      homeSort = sel.value || 'featured';
      renderListings();
    });
  }

  function wireShowMore() {
    const btn = document.getElementById('showMoreBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showAll = !showAll;
      renderListings();
      if (!showAll) {
        document.getElementById('latest').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function renderRegionGrid() {
    if (!staticData) return;
    const host = document.getElementById('regionGrid');
    const section = document.getElementById('by-region');
    if (!host) return;
    const counts = {};
    DATA.properties.forEach((p) => {
      if (p.region_id) counts[p.region_id] = (counts[p.region_id] || 0) + 1;
    });
    const regionsWithData = staticData.REGIONS.filter((r) => (counts[r.id] || 0) > 0);
    // הסתרת הסקציה כאשר אין אזורים עם מתחמים
    if (section) section.hidden = regionsWithData.length === 0;
    if (!regionsWithData.length) {
      host.innerHTML = '';
      return;
    }
    const e = ui.escapeHtml;
    host.innerHTML = regionsWithData.map((r) => {
      const n = counts[r.id];
      const url = listing.pagesPath() + 'results.html' + ui.writeQuery({ region: r.id });
      return `
        <a class="region-card reveal" href="${e(url)}">
          <div class="region-card__poster">${staticData.regionSvg(r.id)}</div>
          <div class="region-card__cap">
            <h3>${e(r.name)}</h3>
            <span class="count">${n === 1 ? 'מתחם אחת' : `${n} מתחמים`}</span>
          </div>
        </a>
      `;
    }).join('');
    ui.initReveal();
  }

  function wirePublishCta() {
    const btn = document.getElementById('publishBtn');
    btn.addEventListener('click', () => {
      const num = DATA && DATA.settings && DATA.settings.publish_whatsapp;
      if (!num) {
        ui.toast('עדיין לא הוגדר מספר ווצאפ לפרסום. עדכנו בהגדרות הניהול.', 'error');
        return;
      }
      try {
        whatsapp.openWhatsapp(num, COPY.home.publishWhatsappMessage);
      } catch (e) {
        ui.toast('מספר הווצאפ לפרסום לא תקין.', 'error');
      }
    });
  }

  function updatePublishVisibility() {
    const section = document.getElementById('publish');
    if (!section) return;
    section.hidden = false;
    section.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
  }
})();
