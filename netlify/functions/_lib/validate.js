// ============================================================
// _lib/validate.js – ולידציה משותפת לשרת
// ============================================================
// סכמות פשוטות לישויות. הצד הלקוח מבצע ולידציה דומה.
// ============================================================

function isStr(v, { min = 1, max = 5000 } = {}) {
  return typeof v === 'string' && v.length >= min && v.length <= max;
}
function isNum(v, { min = -Infinity, max = Infinity } = {}) {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}
function isIntlPhone(v) {
  return typeof v === 'string' && /^\d{8,15}$/.test(v.replace(/\D/g, ''));
}

function normPhone(v) {
  return String(v || '').replace(/\D/g, '');
}

function validateProperty(p, lists) {
  const errors = [];
  if (!isStr(p.name, { max: 200 })) errors.push('name');
  if (!p.type_id || !lists.types.find((t) => t.id === p.type_id)) errors.push('type_id');
  if (!p.city_id || !lists.cities.find((c) => c.id === p.city_id)) errors.push('city_id');
  if (p.pricing_mode !== 'on_request') {
    if (!isNum(p.base_price, { min: 0, max: 10000000 })) errors.push('base_price');
  }
  if (p.rooms !== undefined && p.rooms !== null && !isNum(p.rooms, { min: 0, max: 100 })) errors.push('rooms');
  if (p.beds !== undefined && p.beds !== null && !isNum(p.beds, { min: 0, max: 200 })) errors.push('beds');
  if (p.max_guests !== undefined && p.max_guests !== null && !isNum(p.max_guests, { min: 0, max: 1000 })) errors.push('max_guests');
  if (p.description !== undefined && p.description !== '' && !isStr(p.description, { max: 5000 })) errors.push('description');
  if (!isIntlPhone(p.phone)) errors.push('phone');
  if (!['draft', 'published'].includes(p.status)) errors.push('status');
  if (!Array.isArray(p.images)) errors.push('images');
  if (!Array.isArray(p.services)) errors.push('services');
  if (!Array.isArray(p.pricing_rules)) errors.push('pricing_rules');
  return errors;
}

function validateSettings(s) {
  const errors = [];
  if (!isStr(s.currency, { max: 4 })) errors.push('currency');
  if (!isNum(s.price_min, { min: 0, max: 1000000 })) errors.push('price_min');
  if (!isNum(s.price_max, { min: 0, max: 1000000 })) errors.push('price_max');
  if (s.price_min >= s.price_max) errors.push('price_range');
  if (s.publish_whatsapp && !isIntlPhone(s.publish_whatsapp)) errors.push('publish_whatsapp');
  return errors;
}

function validateListItem(item) {
  return isStr(item.name, { max: 80 }) ? [] : ['name'];
}

module.exports = {
  isStr,
  isNum,
  isIntlPhone,
  normPhone,
  validateProperty,
  validateSettings,
  validateListItem
};
