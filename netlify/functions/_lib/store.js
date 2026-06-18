// ============================================================
// _lib/store.js – שכבת גישה ל-Netlify Blobs
// ============================================================
// בלוב אחד "data" עבור הנתונים, אחד "images" עבור התמונות.
// כל ישות נשמרת כ-JSON תחת מפתח אחד (properties, types, cities, periods, settings).
// ============================================================

const { getStore } = require('@netlify/blobs');

function dataStore() {
  return getStore({ name: 'kal-nofesh-data', consistency: 'strong' });
}

function imageStore() {
  return getStore({ name: 'kal-nofesh-images' });
}

const DEFAULT_SETTINGS = {
  currency: '₪',
  price_min: 100,
  price_max: 3000,
  publish_whatsapp: ''
};

async function getJSON(key, fallback) {
  const v = await dataStore().get(key, { type: 'json' });
  return (v === null || v === undefined) ? fallback : v;
}

async function setJSON(key, value) {
  await dataStore().setJSON(key, value);
}

async function getAll() {
  const [properties, types, cities, image_categories, settings] = await Promise.all([
    getJSON('properties', []),
    getJSON('types', []),
    getJSON('cities', []),
    getJSON('image_categories', []),
    getJSON('settings', DEFAULT_SETTINGS)
  ]);
  return { properties, types, cities, image_categories, settings: { ...DEFAULT_SETTINGS, ...settings } };
}

// מודל ציבורי - בלי לחשוף את נכסי הטיוטה
async function getPublic() {
  const all = await getAll();
  return {
    properties: all.properties.filter((p) => p.status === 'published'),
    types: all.types,
    cities: all.cities,
    image_categories: all.image_categories,
    settings: all.settings
  };
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = {
  dataStore,
  imageStore,
  getJSON,
  setJSON,
  getAll,
  getPublic,
  newId,
  DEFAULT_SETTINGS
};
