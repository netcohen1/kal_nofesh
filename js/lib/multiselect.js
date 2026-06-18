// ============================================================
// js/lib/multiselect.js – רכיב multi-select עם תיבות סימון
// ============================================================
// שימוש:
//   const ms = window.KN.multiselect.mount({
//     container: HTMLElement,
//     items: [{ id, name }],
//     selected: [],                  // array of ids
//     allLabel: 'כל הסוגים',
//     label: 'סוג נכס',
//     onChange: (selectedIds) => {}
//   });
//   ms.setSelected([...]);
//   ms.getSelected();
// ============================================================

(function () {
  const ui = window.KN.ui;

  function mount(opts) {
    const container = opts.container;
    const items = opts.items || [];
    let selected = (opts.selected || []).filter(Boolean);

    function render() {
      const e = ui.escapeHtml;
      const btnText = !selected.length
        ? (opts.allLabel || 'הכל')
        : selected.length === 1
          ? (items.find((it) => it.id === selected[0]) || {}).name || '1 נבחר'
          : `${selected.length} נבחרים`;

      container.innerHTML = `
        <div class="ms">
          <button type="button" class="ms__btn" aria-haspopup="listbox" aria-expanded="false">
            <span class="ms__txt">${e(btnText)}</span>
            <span class="ms__caret">▾</span>
          </button>
          <div class="ms__pop" hidden>
            ${items.length === 0 ? '<p class="ms__empty">אין פריטים מוגדרים</p>' : ''}
            ${items.map((it) => `
              <label class="ms__opt">
                <input type="checkbox" value="${e(it.id)}" ${selected.includes(it.id) ? 'checked' : ''} />
                <span>${e(it.name)}</span>
              </label>
            `).join('')}
            ${items.length > 0 ? `
              <div class="ms__foot">
                <button type="button" class="ms__clear">נקה הכל</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const root = container.querySelector('.ms');
      const btn  = root.querySelector('.ms__btn');
      const pop  = root.querySelector('.ms__pop');
      const checks = root.querySelectorAll('.ms__opt input[type="checkbox"]');

      function close() {
        pop.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
      function open() {
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pop.hidden) open(); else close();
      });

      checks.forEach((cb) => {
        cb.addEventListener('change', () => {
          if (cb.checked) {
            if (!selected.includes(cb.value)) selected = [...selected, cb.value];
          } else {
            selected = selected.filter((x) => x !== cb.value);
          }
          // עדכן רק את כותרת הכפתור בלי לרנדר מחדש (כדי שהפופאפ ישאר פתוח)
          updateBtnLabel(btn);
          if (opts.onChange) opts.onChange(selected);
        });
      });

      const clearBtn = root.querySelector('.ms__clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          selected = [];
          checks.forEach((cb) => { cb.checked = false; });
          updateBtnLabel(btn);
          if (opts.onChange) opts.onChange(selected);
        });
      }

      // סגירה בלחיצה מחוץ
      document.addEventListener('click', (e) => {
        if (!root.contains(e.target)) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    }

    function updateBtnLabel(btn) {
      const txt = btn.querySelector('.ms__txt');
      const btnText = !selected.length
        ? (opts.allLabel || 'הכל')
        : selected.length === 1
          ? (items.find((it) => it.id === selected[0]) || {}).name || '1 נבחר'
          : `${selected.length} נבחרים`;
      txt.textContent = btnText;
    }

    render();

    return {
      getSelected: () => [...selected],
      setSelected: (next) => {
        selected = (next || []).filter(Boolean);
        render();
      },
      setItems: (nextItems) => {
        // לשמור על סלקציה שעדיין רלוונטית
        const validIds = new Set(nextItems.map((i) => i.id));
        selected = selected.filter((id) => validIds.has(id));
        opts.items = nextItems;
        items.length = 0;
        nextItems.forEach((i) => items.push(i));
        render();
      }
    };
  }

  window.KN = window.KN || {};
  window.KN.multiselect = { mount };
})();
