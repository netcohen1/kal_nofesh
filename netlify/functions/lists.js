// ============================================================
// /api/lists – ניהול רשימות חיפוש: סוגי נכס, ערים, תקופות
// ============================================================
// כל הפעולות מקבלות שדה kind: "types" | "cities" | "periods"
// POST   – הוספה
// PUT    – עדכון
// DELETE – מחיקה (גם מסיר מנכסים שמשתמשים בפריט)
// ============================================================

const { requireAuth } = require('./_lib/auth');
const { getAll, setJSON, newId } = require('./_lib/store');
const { validateListItem, isStr } = require('./_lib/validate');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

const KINDS = ['types', 'cities', 'image_categories'];

function cleanItem(kind, item) {
  const base = {
    id: item.id,
    name: String(item.name || '').trim()
  };
  if (kind === 'cities') {
    base.region_id = typeof item.region_id === 'string' && item.region_id ? item.region_id : null;
  }
  return base;
}

function refField(kind) {
  if (kind === 'types') return 'type_id';
  if (kind === 'cities') return 'city_id';
  return null;
}

async function detachFromProperties(kind, removedId, all) {
  if (kind === 'image_categories') {
    // הסר את הקטגוריה מתמונות בכל הדירות
    let changed = false;
    const updated = all.properties.map((p) => {
      const imgs = (p.images || []);
      let hit = false;
      const nextImgs = imgs.map((im) => {
        if (im && im.category_id === removedId) { hit = true; return { ...im, category_id: null }; }
        return im;
      });
      if (hit) { changed = true; return { ...p, images: nextImgs }; }
      return p;
    });
    if (changed) await setJSON('properties', updated);
    return;
  }
  const field = refField(kind);
  if (!field) return;
  let changed = false;
  const updated = all.properties.map((p) => {
    if (p[field] === removedId) {
      changed = true;
      return { ...p, [field]: null, status: 'draft' };
    }
    return p;
  });
  if (changed) await setJSON('properties', updated);
}

exports.handler = async (event) => {
  try {
    requireAuth(event);
    const body = await parseBody(event);
    const kind = body.kind;
    if (!KINDS.includes(kind)) return bad(400, 'invalid_kind');

    const all = await getAll();
    const list = all[kind] || [];

    if (event.httpMethod === 'POST') {
      const item = cleanItem(kind, { ...body.item, id: newId() });
      const errs = validateListItem(item);
      if (errs.length) return bad(400, 'validation', { fields: errs });
      if (list.find((x) => x.name === item.name)) return bad(409, 'duplicate');
      const next = [...list, item];
      await setJSON(kind, next);
      return ok({ item });
    }

    if (event.httpMethod === 'PUT') {
      if (!body.item || !body.item.id) return bad(400, 'missing_id');
      const existing = list.find((x) => x.id === body.item.id);
      if (!existing) return bad(404, 'not_found');
      const item = cleanItem(kind, { ...existing, ...body.item });
      const errs = validateListItem(item);
      if (errs.length) return bad(400, 'validation', { fields: errs });
      const next = list.map((x) => (x.id === item.id ? item : x));
      await setJSON(kind, next);
      return ok({ item });
    }

    if (event.httpMethod === 'DELETE') {
      if (!body.id) return bad(400, 'missing_id');
      if (!list.find((x) => x.id === body.id)) return bad(404, 'not_found');
      const next = list.filter((x) => x.id !== body.id);
      await setJSON(kind, next);
      await detachFromProperties(kind, body.id, all);
      return ok({ deleted: body.id });
    }

    return bad(405, 'method_not_allowed');
  } catch (e) {
    return handleError(e);
  }
};
