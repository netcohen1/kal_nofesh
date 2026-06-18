// ============================================================
// /api/properties – יצירה / עדכון / מחיקה של דירה
// ============================================================
// POST   – יצירה (גוף: שדות הדירה, בלי id)
// PUT    – עדכון (גוף: שדות הדירה כולל id)
// DELETE – מחיקה (גוף: { id })
// ============================================================

const { requireAuth } = require('./_lib/auth');
const { getAll, setJSON, newId, imageStore } = require('./_lib/store');
const { validateProperty, normPhone } = require('./_lib/validate');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

function cleanOccupied(arr) {
  if (!Array.isArray(arr)) return [];
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    if (typeof v === 'string' && re.test(v) && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out.sort();
}

function cleanPricingRules(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => {
    if (!r || typeof r !== 'object') return null;
    const price = Number(r.price);
    if (!Number.isFinite(price) || price < 0) return null;
    if (r.type === 'weekly') {
      const days = (r.days || []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      if (!days.length) return null;
      return { id: String(r.id || ''), type: 'weekly', name: String(r.name || '').slice(0, 80), days, price };
    }
    if (r.type === 'range') {
      const reDate = /^\d{4}-\d{2}-\d{2}$/;
      if (!reDate.test(r.from) || !reDate.test(r.to)) return null;
      if (r.to < r.from) return null;
      return { id: String(r.id || ''), type: 'range', name: String(r.name || '').slice(0, 80), from: r.from, to: r.to, price };
    }
    return null;
  }).filter(Boolean);
}

function clean(p) {
  const phone = normPhone(p.phone || p.whatsapp);
  const onRequest = p.pricing_mode === 'on_request';
  return {
    id: p.id,
    name: String(p.name || '').trim(),
    type_id: p.type_id,
    region_id: typeof p.region_id === 'string' ? p.region_id : null,
    city_id: p.city_id,
    neighborhood: (p.neighborhood || '').trim() || null,
    pricing_mode: onRequest ? 'on_request' : 'fixed',
    base_price: onRequest ? 0 : Number(p.base_price ?? p.price_per_night),
    pricing_rules: onRequest ? [] : cleanPricingRules(p.pricing_rules),
    rooms: p.rooms === '' || p.rooms === null || p.rooms === undefined ? null : Number(p.rooms),
    beds:  p.beds  === '' || p.beds  === null || p.beds  === undefined ? null : Number(p.beds),
    max_guests: p.max_guests === '' || p.max_guests == null ? null : Number(p.max_guests),
    is_featured: !!p.is_featured,
    description: (p.description || '').trim(),
    images: Array.isArray(p.images) ? p.images : [],
    occupied_dates: cleanOccupied(p.occupied_dates),
    services: Array.isArray(p.services) ? p.services.filter((s) => typeof s === 'string').slice(0, 100) : [],
    location_address: (p.location_address || '').toString().trim().slice(0, 200) || null,
    phone,
    whatsapp: phone,
    status: p.status === 'published' ? 'published' : 'draft',
    created_at: p.created_at || Date.now(),
    updated_at: Date.now()
  };
}

exports.handler = async (event) => {
  try {
    requireAuth(event);

    const all = await getAll();
    const lists = { types: all.types, cities: all.cities };

    if (event.httpMethod === 'POST') {
      const body = await parseBody(event);
      const p = clean({ ...body, id: newId(), created_at: Date.now() });
      const errors = validateProperty(p, lists);
      if (errors.length) return bad(400, 'validation', { fields: errors });
      const next = [...all.properties, p];
      await setJSON('properties', next);
      return ok({ property: p });
    }

    if (event.httpMethod === 'PUT') {
      const body = await parseBody(event);
      if (!body.id) return bad(400, 'missing_id');
      const existing = all.properties.find((x) => x.id === body.id);
      if (!existing) return bad(404, 'not_found');
      const p = clean({ ...existing, ...body, id: existing.id, created_at: existing.created_at });
      const errors = validateProperty(p, lists);
      if (errors.length) return bad(400, 'validation', { fields: errors });
      const next = all.properties.map((x) => (x.id === p.id ? p : x));
      await setJSON('properties', next);
      return ok({ property: p });
    }

    if (event.httpMethod === 'DELETE') {
      const body = await parseBody(event);
      if (!body.id) return bad(400, 'missing_id');
      const target = all.properties.find((x) => x.id === body.id);
      if (!target) return bad(404, 'not_found');
      const next = all.properties.filter((x) => x.id !== body.id);
      await setJSON('properties', next);
      // ניקוי תמונות מ-Blobs
      if (Array.isArray(target.images)) {
        const istore = imageStore();
        await Promise.all(
          target.images.map((img) => istore.delete(img.key).catch(() => null))
        );
      }
      return ok({ deleted: body.id });
    }

    return bad(405, 'method_not_allowed');
  } catch (e) {
    return handleError(e);
  }
};
