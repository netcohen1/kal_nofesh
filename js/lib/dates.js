// ============================================================
// js/lib/dates.js – עזרי תאריכים, לוח שנה, וסינון לפי תפוסה
// ============================================================
// כל התאריכים מיוצגים כמחרוזות ISO 'YYYY-MM-DD' (בלי שעה).
// תפוסה של מתחם: occupied_dates – מערך של מחרוזות תאריך.
// ============================================================

(function () {

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function fromDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function today() { return fromDate(new Date()); }
  function parseISO(s) {
    if (!s || typeof s !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  function isValidISO(s) { return !!parseISO(s); }

  function addDays(iso, days) {
    const d = parseISO(iso);
    if (!d) return null;
    d.setDate(d.getDate() + days);
    return fromDate(d);
  }

  function listRange(fromISO, toISO) {
    const f = parseISO(fromISO);
    const t = parseISO(toISO);
    if (!f || !t || f > t) return [];
    const out = [];
    const cur = new Date(f);
    while (cur <= t) {
      out.push(fromDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  function listMonth(year, monthIdx) {
    // monthIdx: 0..11
    const out = [];
    const cur = new Date(year, monthIdx, 1);
    while (cur.getMonth() === monthIdx) {
      out.push(fromDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  function parseMonthString(s) {
    // 'YYYY-MM' → { year, monthIdx }
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return null;
    return { year: Number(m[1]), monthIdx: Number(m[2]) - 1 };
  }

  function monthLabel(year, monthIdx) {
    const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
    return `${months[monthIdx]} ${year}`;
  }

  function dayLabels() {
    // יום ראשון בעמודה הימנית ב-RTL → array order ראשון..שבת
    return ['א','ב','ג','ד','ה','ו','ש'];
  }

  // ============================================================
  // הפעלת לוח שנה (calendar widget)
  // ============================================================
  //
  // mountCalendar({
  //   container: HTMLElement,
  //   year, monthIdx,
  //   occupied: Set<string>,          // ימים תפוסים (read-only views)
  //   selectable: bool,               // האם לאפשר לחיצה
  //   onToggle: (iso) => void,        // לחיצה על יום (במצב admin)
  //   onMonthChange: (year, monthIdx) => void,
  //   minDate, maxDate: 'YYYY-MM-DD'  // טווח מותר
  // })
  //
  function mountCalendar(opts) {
    const c = opts.container;
    let year = opts.year ?? new Date().getFullYear();
    let monthIdx = opts.monthIdx ?? new Date().getMonth();
    const occupied = opts.occupied instanceof Set ? opts.occupied : new Set(opts.occupied || []);
    const selectable = !!opts.selectable;

    render();

    function render() {
      const first = new Date(year, monthIdx, 1);
      // ביום הראשון בחודש - באיזה יום בשבוע הוא נופל (0=ראשון)
      const startDayOfWeek = first.getDay();
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

      let cells = '';
      // padding cells לפני היום הראשון
      for (let i = 0; i < startDayOfWeek; i++) {
        cells += `<div class="cal__cell cal__cell--pad"></div>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = year + '-' + pad(monthIdx + 1) + '-' + pad(d);
        const isOcc = occupied.has(iso);
        const isPast = iso < today();
        const isToday = iso === today();
        const cls = [
          'cal__cell',
          isOcc ? 'cal__cell--occupied' : 'cal__cell--free',
          isPast ? 'cal__cell--past' : '',
          isToday ? 'cal__cell--today' : '',
          selectable && !isPast ? 'cal__cell--selectable' : ''
        ].filter(Boolean).join(' ');
        cells += `
          <button type="button" class="${cls}" data-iso="${iso}" ${(!selectable || isPast) ? 'disabled' : ''}>
            <span class="d">${d}</span>
            ${isOcc ? '<span class="tag">תפוס</span>' : ''}
          </button>
        `;
      }

      c.innerHTML = `
        <div class="cal">
          <div class="cal__nav">
            <button type="button" class="cal__btn" data-act="prev" aria-label="חודש קודם">→</button>
            <span class="cal__label">${monthLabel(year, monthIdx)}</span>
            <button type="button" class="cal__btn" data-act="next" aria-label="חודש הבא">←</button>
          </div>
          <div class="cal__weekdays">
            ${dayLabels().map((l) => `<div>${l}</div>`).join('')}
          </div>
          <div class="cal__grid">${cells}</div>
        </div>
      `;

      c.querySelector('button[data-act="prev"]').addEventListener('click', () => move(-1));
      c.querySelector('button[data-act="next"]').addEventListener('click', () => move(1));

      if (selectable) {
        c.querySelectorAll('button.cal__cell--selectable').forEach((btn) => {
          btn.addEventListener('click', () => {
            const iso = btn.dataset.iso;
            if (opts.onToggle) opts.onToggle(iso);
            // עדכון מקומי של ה-Set
            if (occupied.has(iso)) occupied.delete(iso);
            else occupied.add(iso);
            render();
          });
        });
      }
    }

    function move(delta) {
      monthIdx += delta;
      if (monthIdx < 0) { monthIdx = 11; year--; }
      if (monthIdx > 11) { monthIdx = 0; year++; }
      if (opts.onMonthChange) opts.onMonthChange(year, monthIdx);
      render();
    }

    return {
      setOccupied(nextSet) {
        // החלפה כוללת
        if (nextSet instanceof Set) {
          occupied.clear();
          nextSet.forEach((x) => occupied.add(x));
        } else {
          occupied.clear();
          (nextSet || []).forEach((x) => occupied.add(x));
        }
        render();
      },
      go(y, m) { year = y; monthIdx = m; render(); }
    };
  }

  // ============================================================
  // סינון מתחמים לפי תפוסה
  // ============================================================
  //
  // params.dateMode: 'any' | 'exact' | 'flex'
  //   'any':   ללא סינון לפי תאריך
  //   'exact': מחייב פנויות מלאה בטווח [dateFrom, dateTo]
  //   'flex':  מחייב פנויות של לפחות יום אחד בחודש flexMonth
  //
  function propertyAvailable(prop, params) {
    const occ = new Set(prop.occupied_dates || []);

    if (params.dateMode === 'exact') {
      if (!isValidISO(params.dateFrom) || !isValidISO(params.dateTo)) return true; // לא הוגדר תקין → לא לסנן
      const range = listRange(params.dateFrom, params.dateTo);
      if (!range.length) return true;
      return !range.some((d) => occ.has(d));
    }

    if (params.dateMode === 'flex') {
      const months = String(params.flexMonths || params.flexMonth || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      if (!months.length) return true;
      // לפחות חודש אחד שבו יש יום פנוי אחד או יותר
      return months.some((mStr) => {
        const m = parseMonthString(mStr);
        if (!m) return false;
        const all = listMonth(m.year, m.monthIdx);
        return all.some((d) => !occ.has(d));
      });
    }

    return true; // 'any'
  }

  window.KN = window.KN || {};
  window.KN.dates = {
    pad,
    today,
    fromDate,
    parseISO,
    isValidISO,
    addDays,
    listRange,
    listMonth,
    parseMonthString,
    monthLabel,
    dayLabels,
    mountCalendar,
    propertyAvailable
  };
})();
