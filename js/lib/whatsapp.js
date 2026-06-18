// ============================================================
// js/lib/whatsapp.js – בניית קישורי WhatsApp
// ============================================================
// לפי האפיון: https://wa.me/<מספר בלי + ובלי תווים>?text=<מקודד>
// ============================================================

(function () {
  function normalizePhone(raw) {
    if (!raw) return '';
    return String(raw).replace(/\D/g, '');
  }

  function isValidIntlPhone(raw) {
    const n = normalizePhone(raw);
    return n.length >= 8 && n.length <= 15;
  }

  function buildLink(phone, message) {
    const n = normalizePhone(phone);
    if (!isValidIntlPhone(n)) {
      throw new Error('invalid_whatsapp');
    }
    const text = encodeURIComponent(message || '');
    return `https://wa.me/${n}?text=${text}`;
  }

  function openWhatsapp(phone, message) {
    const url = buildLink(phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  window.KN = window.KN || {};
  window.KN.whatsapp = {
    normalizePhone,
    isValidIntlPhone,
    buildLink,
    openWhatsapp
  };
})();
