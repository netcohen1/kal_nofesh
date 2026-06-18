// ============================================================
// js/lib/ui.js – עזרי UI: toast, modal, reveal, escape
// ============================================================

(function () {
  // ---------- escape HTML ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- toast ----------
  function ensureToastHost() {
    let host = document.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    return host;
  }
  function toast(message, type = 'info', ms = 3500) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = `toast toast--${type === 'error' ? 'err' : type === 'ok' ? 'ok' : ''}`;
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity .25s, transform .25s';
      setTimeout(() => el.remove(), 280);
    }, ms);
  }

  // ---------- modal ----------
  function openModal(html) {
    const host = document.createElement('div');
    host.className = 'modal-host';
    host.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(host);
    document.body.style.overflow = 'hidden';

    const close = () => {
      document.body.style.overflow = '';
      host.remove();
    };
    host.addEventListener('click', (e) => {
      if (e.target === host) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', esc);
      }
    });
    return { host, close, body: host.querySelector('.modal') };
  }

  // ---------- reveal on scroll ----------
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => obs.observe(el));
  }

  // ---------- burger menu ----------
  function initBurger() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (!burger || !nav) return;
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---------- format ----------
  function formatPrice(n, currency) {
    if (n == null || !Number.isFinite(Number(n))) return '';
    return `${currency || '₪'}${Math.round(Number(n)).toLocaleString('he-IL')}`;
  }

  // ---------- query string ----------
  function readQuery() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
  }
  function writeQuery(params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) usp.set(k, v);
    });
    const qs = usp.toString();
    return qs ? `?${qs}` : '';
  }

  window.KN = window.KN || {};
  window.KN.ui = {
    escapeHtml,
    toast,
    openModal,
    initReveal,
    initBurger,
    formatPrice,
    readQuery,
    writeQuery
  };
})();
