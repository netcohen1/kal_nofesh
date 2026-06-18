// ============================================================
// /api/public-data – נתונים ציבוריים: נכסים מפורסמים + רשימות + הגדרות
// ============================================================
const { getPublic } = require('./_lib/store');
const { ok, bad, handleError } = require('./_lib/respond');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return bad(405, 'method_not_allowed');
  try {
    const data = await getPublic();
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // cache קצר ב-CDN, גולשים מקבלים גרסה טרייה
        'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=120'
      },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return handleError(e);
  }
};
