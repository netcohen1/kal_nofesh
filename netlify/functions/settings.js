// ============================================================
// /api/settings – עדכון הגדרות גלובליות
// ============================================================
const { requireAuth } = require('./_lib/auth');
const { getJSON, setJSON, DEFAULT_SETTINGS } = require('./_lib/store');
const { validateSettings, normPhone } = require('./_lib/validate');
const { ok, bad, parseBody, handleError } = require('./_lib/respond');

exports.handler = async (event) => {
  if (event.httpMethod !== 'PUT') return bad(405, 'method_not_allowed');
  try {
    requireAuth(event);
    const body = await parseBody(event);
    const current = { ...DEFAULT_SETTINGS, ...(await getJSON('settings', {})) };
    const next = {
      currency: String(body.currency || current.currency).trim(),
      price_min: Number(body.price_min),
      price_max: Number(body.price_max),
      publish_whatsapp: normPhone(body.publish_whatsapp || '')
    };
    const errs = validateSettings(next);
    if (errs.length) return bad(400, 'validation', { fields: errs });
    await setJSON('settings', next);
    return ok({ settings: next });
  } catch (e) {
    return handleError(e);
  }
};
