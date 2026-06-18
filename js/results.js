// ============================================================
// js/results.js – לוגיקת דף התוצאות
// ============================================================

(function () {
  const { api, ui, listing, dates, staticData } = window.KN;
  let DATA = null;
  let selectedMonths = [];
  let locMode = 'region';
  let msType, msRegion, msCity;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    ui.initBurger();
    try {
      DATA = await api.getPublicData();
    } catch (e) {
      console.error(e);
      DATA = { properties: [], types: [], cities: [], settings: { currency: '₪' } };
      ui.toast('בעיית רשת בטעינת הנתונים.', 'error');
    }
    populateLists();
    hydrateFromQuery();
    wireLocationToggle();
    wireDateMode();
    wirePriceValidation();
    wireDateValidation();
    wireNameClear();
    wireForms();
    wireDateKeyguard();
    wireMobileNav();
    rerender();
    updateSubmitMode();
    updateSortVisibility();
    scrollToResults();
  }

  function populateLists() {
    msType = window.KN.multiselect.mount({
      container: document.getElementById('typeMS'),
      items: DATA.types, selected: [], allLabel: 'כל הסוגים',
      onChange: (sel) => { document.getElementById('type').value = sel.join(','); rerenderDeferred(); }
    });
    msRegion = window.KN.multiselect.mount({
      container: document.getElementById('regionMS'),
      items: staticData.REGIONS, selected: [], allLabel: 'כל האזורים',
      onChange: (sel) => { document.getElementById('region').value = sel.join(','); rerenderDeferred(); }
    });
    msCity = window.KN.multiselect.mount({
      container: document.getElementById('cityMS'),
      items: DATA.cities, selected: [], allLabel: 'כל הערים',
      onChange: (sel) => { document.getElementById('city').value = sel.join(','); rerenderDeferred(); }
    });
    const today = dates.today();
    document.getElementById('dateFrom').min = today;
    document.getElementById('dateTo').min   = today;
    buildMonthGrid();
  }

  function _placeholderNoop() {}

  let _rerenderTimer;
  function rerenderDeferred() {
    clearTimeout(_rerenderTimer);
    _rerenderTimer = setTimeout(() => { rerender(); updateSubmitMode(); updateSortVisibility(); }, 50);
  }

  function buildMonthGrid() {
    const host = document.getElementById('monthGrid');
    if (!host) return;
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const v = d.getFullYear() + '-' + dates.pad(d.getMonth() + 1);
      months.push({ v, label: dates.monthLabel(d.getFullYear(), d.getMonth()) });
    }
    host.innerHTML = months.map((m) => {
      const checked = selectedMonths.includes(m.v) ? 'is-selected' : '';
      return `<button type="button" class="${checked}" data-m="${ui.escapeHtml(m.v)}">${ui.escapeHtml(m.label)}</button>`;
    }).join('');
    host.querySelectorAll('button[data-m]').forEach((b) => {
      b.addEventListener('click', () => {
        const v = b.dataset.m;
        if (selectedMonths.includes(v)) selectedMonths = selectedMonths.filter((x) => x !== v);
        else selectedMonths = [...selectedMonths, v].sort();
        document.getElementById('flexMonths').value = selectedMonths.join(',');
        buildMonthGrid();
      });
    });
    document.getElementById('flexMonths').value = selectedMonths.join(',');
  }

  function hydrateFromQuery() {
    const q = ui.readQuery();
    ['q','dateMode','dateFrom','dateTo','flexMonths','priceMin','priceMax'].forEach((k) => {
      const el = document.getElementById(k);
      if (el && q[k] != null) el.value = q[k];
    });
    // ערכי multi-select - מחרוזת מופרדת בפסיקים
    if (q.type) {
      document.getElementById('type').value = q.type;
      msType && msType.setSelected(q.type.split(',').filter(Boolean));
    }
    if (q.region) {
      document.getElementById('region').value = q.region;
      msRegion && msRegion.setSelected(q.region.split(',').filter(Boolean));
    }
    if (q.city) {
      document.getElementById('city').value = q.city;
      msCity && msCity.setSelected(q.city.split(',').filter(Boolean));
    }
    if (q.flexMonths) selectedMonths = q.flexMonths.split(',').filter(Boolean);
    if (q.sort) document.getElementById('sort').value = q.sort;
    if (q.city) locMode = 'city';
    else locMode = 'region';
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
        label.textContent = 'חודשים גמישים';
        toggle.textContent = 'אפשר גם לבחור תאריך מדויק (כניסה / יציאה)';
        buildMonthGrid();
      } else {
        selectedMonths = [];
        document.getElementById('flexMonths').value = '';
        buildMonthGrid();
        exact.hidden = false;
        flex.hidden = true;
        label.textContent = 'תאריך כניסה - תאריך יציאה';
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
      const mn = Number(min.value), mx = Number(max.value);
      const invalid = min.value !== '' && max.value !== '' && Number.isFinite(mn) && Number.isFinite(mx) && mx < mn;
      errEl.classList.toggle('hidden', !invalid);
      if (submitBtn) submitBtn.disabled = invalid;
    }
    min.addEventListener('input', check);
    max.addEventListener('input', check);
    check();
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

  function wireDateKeyguard() {
    const allowed = new Set(['Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','F5']);
    document.querySelectorAll('input[type="date"], input[type="month"]').forEach((el) => {
      el.addEventListener('keydown', (e) => { if (!allowed.has(e.key)) e.preventDefault(); });
    });
  }

  function wireNameClear() { /* X button removed by user request */ }

  function wireMobileNav() {
    document.querySelectorAll('a[href*="#"]').forEach((a) => {
      a.addEventListener('click', () => {
        const nav = document.getElementById('nav');
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
          const burger = document.getElementById('burger');
          if (burger) burger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function collectParams() {
    const guestsEl = document.getElementById('guests');
    return {
      q:        document.getElementById('q').value.trim(),
      type:     document.getElementById('type').value,
      region:   locMode === 'region' ? document.getElementById('region').value : '',
      city:     locMode === 'city'   ? document.getElementById('city').value   : '',
      guests:   guestsEl ? guestsEl.value : '',
      dateMode: document.getElementById('dateMode').value || 'any',
      dateFrom: document.getElementById('dateFrom').value,
      dateTo:   document.getElementById('dateTo').value,
      flexMonths: document.getElementById('flexMonths').value,
      priceMin: document.getElementById('priceMin').value,
      priceMax: document.getElementById('priceMax').value,
      sort:     document.getElementById('sort').value || 'featured'
    };
  }

  // האם יש פילטר פעיל כלשהו?
  function hasActiveFilters(p) {
    return !!(p.q || p.type || p.region || p.city || p.guests
      || (p.dateMode === 'exact' && (p.dateFrom || p.dateTo))
      || (p.dateMode === 'flex' && p.flexMonths)
      || p.priceMin || p.priceMax);
  }

  function isOnlyNameQuery(p) {
    return !!p.q && !p.type && !p.region && !p.city && !p.guests
      && !(p.dateMode === 'exact' && (p.dateFrom || p.dateTo))
      && !(p.dateMode === 'flex' && p.flexMonths)
      && !p.priceMin && !p.priceMax;
  }

  function wireForms() {
    const nameForm = document.getElementById('nameSearchForm');
    const advForm  = document.getElementById('searchForm');
    const submitBtn = document.getElementById('searchSubmit');

    function submit() {
      const p = collectParams();
      history.replaceState(null, '', 'results.html' + ui.writeQuery(p));
      rerender();
      updateSubmitMode();
      updateSortVisibility();
      scrollToResults();
    }

    function resetAll() {
      // איפוס = חזרה למצב שלפני החיפוש, כלומר לדף הבית
      window.location.href = '../index.html';
    }

    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameBtn = document.getElementById('nameSearchSubmit');
      if (nameBtn && nameBtn.dataset.mode === 'reset') {
        document.getElementById('q').value = '';
        const p = collectParams();
        history.replaceState(null, '', 'results.html' + ui.writeQuery(p));
        rerender();
        updateSubmitMode();
        updateSortVisibility();
        return;
      }
      submit();
    });
    advForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn.dataset.mode === 'reset') return resetAll();
      submit();
    });
    document.getElementById('sort').addEventListener('change', submit);
  }

  function updateSubmitMode() {
    const submitBtn  = document.getElementById('searchSubmit');
    const nameBtn    = document.getElementById('nameSearchSubmit');
    // משתמשים ב-URL ולא בטופס - הכפתור הופך לאיפוס רק אחרי חיפוש שבוצע
    const urlParams = ui.readQuery();
    const onlyName = isOnlyNameQuery(urlParams);
    const anyOther = !onlyName && hasActiveFilters(urlParams);

    if (submitBtn) {
      if (anyOther) {
        submitBtn.dataset.mode = 'reset';
        submitBtn.innerHTML = 'איפוס חיפוש <span class="arr">←</span>';
        submitBtn.classList.add('search__go--reset');
      } else {
        submitBtn.dataset.mode = 'search';
        submitBtn.innerHTML = (anyOther ? 'איפוס' : 'חיפוש') + ' <span class="arr">←</span>';
        submitBtn.classList.remove('search__go--reset');
      }
    }
    if (nameBtn) {
      if (onlyName) {
        nameBtn.dataset.mode = 'reset';
        nameBtn.innerHTML = '<span style="font-weight:700">איפוס</span>';
        nameBtn.classList.add('name-search--reset');
      } else {
        nameBtn.dataset.mode = 'search';
        nameBtn.classList.remove('name-search--reset');
        nameBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
          </svg>
          חיפוש`;
      }
    }
  }

  // מיון תמיד גלוי בדף התוצאות
  function updateSortVisibility() {
    const sortWrap = document.querySelector('.results-toolbar .sort');
    if (!sortWrap) return;
    sortWrap.hidden = false;
  }

  function rerender() {
    if (!DATA) return;
    const params = collectParams();
    let items = listing.filter(DATA.properties, params, DATA);
    items = listing.sort(items, params.sort || 'featured');
    document.getElementById('count').textContent = items.length === 1 ? 'תוצאה אחת' : `${items.length} תוצאות`;
    const grid = document.getElementById('grid');
    if (!items.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <h3>לא נמצאו תוצאות</h3>
          <p>נסו להרחיב את החיפוש - הסירו פילטרים או הרחיבו את טווח המחיר.</p>
        </div>`;
    } else {
      grid.innerHTML = items.map((p) => listing.cardHtml(p, DATA)).join('');
      ui.initReveal();
    }
  }

  function scrollToResults() {
    const target = document.getElementById('results');
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: 'smooth' });
  }
})();
