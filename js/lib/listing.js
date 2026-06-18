// ============================================================
// js/lib/listing.js – לוגיקה משותפת לחיפוש ולכרטיסי מתחם
// ============================================================

(function () {
  const ui = window.KN.ui;
  const staticData = window.KN.staticData;

  // נתיב נכון לדפים בהתאם למיקום הנוכחי
  function pagesPath() {
    return /\/pages\//.test(window.location.pathname) ? '' : 'pages/';
  }

  function nameMatches(prop, q) {
    if (!q) return true;
    return (prop.name || '').toLowerCase().includes(q.toLowerCase().trim());
  }

  // מחיר התחלתי למתחם - המינימום בין מחיר הבסיס לכל החריגות
  function startingPrice(prop) {
    const base = Number(prop.base_price ?? prop.price_per_night);
    if (!Number.isFinite(base)) return null;
    const candidates = [base];
    (prop.pricing_rules || []).forEach((r) => {
      const p = Number(r.price);
      if (Number.isFinite(p)) candidates.push(p);
    });
    return Math.min(...candidates);
  }

  // מחיר עבור תאריך בודד - לחישוב בחיפוש לפי תאריכים
  function priceForDate(prop, isoDate) {
    if (!isoDate) return Number(prop.base_price ?? prop.price_per_night) || 0;
    // 1. תקופות מותאמות אישית קודמות
    for (const rule of (prop.pricing_rules || [])) {
      if (rule.type === 'range' && rule.from && rule.to) {
        if (isoDate >= rule.from && isoDate <= rule.to) {
          return Number(rule.price) || 0;
        }
      }
    }
    // 2. כללי שבוע
    const d = new Date(isoDate);
    if (Number.isFinite(d.getTime())) {
      const dow = d.getDay();
      for (const rule of (prop.pricing_rules || [])) {
        if (rule.type === 'weekly' && Array.isArray(rule.days) && rule.days.includes(dow)) {
          return Number(rule.price) || 0;
        }
      }
    }
    return Number(prop.base_price ?? prop.price_per_night) || 0;
  }

  // ממוצע ללילה בטווח [from, to]
  function avgPriceInRange(prop, fromISO, toISO) {
    const dates = window.KN.dates;
    if (!fromISO || !toISO) return startingPrice(prop);
    const range = dates.listRange(fromISO, toISO);
    if (!range.length) return startingPrice(prop);
    const total = range.reduce((sum, d) => sum + priceForDate(prop, d), 0);
    return total / range.length;
  }

  function parseList(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    return String(v).split(',').map((s) => s.trim()).filter(Boolean);
  }

  function filter(properties, params, data) {
    const dates = window.KN.dates;
    const types   = parseList(params.type);
    const regions = parseList(params.region);
    const cities  = parseList(params.city);
    const cityRegionMap = {};
    if (data && data.cities) {
      data.cities.forEach((c) => { cityRegionMap[c.id] = c.region_id; });
    }
    function propertyRegionId(p) {
      return p.region_id || cityRegionMap[p.city_id] || null;
    }
    const guests = params.guests ? Number(params.guests) : 0;
    return properties.filter((p) => {
      if (!nameMatches(p, params.q)) return false;
      if (types.length   && !types.includes(p.type_id))   return false;
      if (cities.length  && !cities.includes(p.city_id))  return false;
      if (regions.length && !regions.includes(propertyRegionId(p))) return false;
      // סינון לפי כמות אורחים מקסימלית של המתחם
      if (guests > 0) {
        const cap = Number(p.max_guests);
        if (Number.isFinite(cap) && cap > 0 && cap < guests) return false;
      }
      // מחיר בתיאום אישי לא נסנן לפי טווח מחיר
      const onRequest = p.pricing_mode === 'on_request';
      if (onRequest) {
        // לא נכלל בסינון מחיר
      } else {

      let priceForCheck = startingPrice(p);
      if (params.dateMode === 'exact' && params.dateFrom && params.dateTo) {
        priceForCheck = avgPriceInRange(p, params.dateFrom, params.dateTo);
      }
      if (priceForCheck != null) {
        if (params.priceMin !== '' && params.priceMin != null && params.priceMin !== undefined && priceForCheck < Number(params.priceMin)) return false;
        if (params.priceMax !== '' && params.priceMax != null && params.priceMax !== undefined && priceForCheck > Number(params.priceMax)) return false;
      }
      }

      // זמינות לפי תאריכים
      if (dates && params.dateMode && params.dateMode !== 'any') {
        if (!dates.propertyAvailable(p, params)) return false;
      }
      return true;
    });
  }

  function sort(properties, mode) {
    const arr = [...properties];
    if (mode === 'price_asc') {
      arr.sort((a, b) => (startingPrice(a) || 0) - (startingPrice(b) || 0));
    } else if (mode === 'price_desc') {
      arr.sort((a, b) => (startingPrice(b) || 0) - (startingPrice(a) || 0));
    } else if (mode === 'newest') {
      arr.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    } else {
      // 'featured' (default): מומלצים תחילה, אחר כך החדשים
      arr.sort((a, b) => {
        const fa = a.is_featured ? 1 : 0;
        const fb = b.is_featured ? 1 : 0;
        if (fa !== fb) return fb - fa;
        return (b.created_at || 0) - (a.created_at || 0);
      });
    }
    return arr;
  }

  function lookupCity(cities, id)  { return cities.find((c) => c.id === id) || null; }
  function lookupType(types, id)   { return types.find((t)  => t.id === id) || null; }

  function imageUrl(img) {
    if (!img) return null;
    if (typeof img === 'string') return img;
    return img.url || (img.key ? `/api/image?key=${encodeURIComponent(img.key)}` : null);
  }

  function cardHtml(prop, data) {
    const e = ui.escapeHtml;
    const cityRegionMap = {};
    (data.cities || []).forEach((c) => { cityRegionMap[c.id] = c.region_id; });
    const city   = lookupCity(data.cities, prop.city_id);
    const type   = lookupType(data.types, prop.type_id);
    const regionId = prop.region_id || cityRegionMap[prop.city_id];
    const region = staticData ? staticData.lookupRegion(regionId) : null;
    const main   = (prop.images && prop.images[0]) ? imageUrl(prop.images[0]) : null;
    const mainIsVideo = prop.images && prop.images[0] && /^video\//.test(prop.images[0].contentType || '');
    const onRequest = prop.pricing_mode === 'on_request';
    const sp = onRequest ? null : startingPrice(prop);
    const priceTxt = onRequest
      ? 'מחיר בתיאום אישי'
      : (sp != null ? `החל מ-${ui.formatPrice(sp, data.settings.currency)} / לילה` : '');
    const regionTxt = [type && type.name, city && city.name, region && region.name].filter(Boolean).join(' · ');
    const metaBits = [];
    if (prop.rooms) metaBits.push(`${prop.rooms} חדרים`);
    if (prop.beds)  metaBits.push(`${prop.beds} מיטות`);
    if (prop.max_guests) metaBits.push(`עד ${prop.max_guests} אורחים`);
    if (prop.neighborhood) metaBits.push(e(prop.neighborhood));

    let poster;
    if (main && mainIsVideo) {
      poster = `<video src="${e(main)}" muted playsinline preload="metadata"></video>`;
    } else if (main) {
      poster = `<img src="${e(main)}" alt="${e(prop.name)}" loading="lazy" />`;
    } else {
      poster = `<div class="placeholder">${e(prop.name).slice(0, 1) || '·'}</div>`;
    }

    return `
      <a class="card reveal" href="${pagesPath()}property.html?id=${e(prop.id)}">
        <div class="card__poster">
          ${poster}
          ${prop.is_featured ? '<span class="card__badge">מומלץ</span>' : ''}
          ${priceTxt ? `<span class="card__price">${e(priceTxt)}</span>` : ''}
        </div>
        <div class="card__body">
          ${regionTxt ? `<p class="card__region">${e(regionTxt)}</p>` : ''}
          <h3 class="card__name">${e(prop.name)}</h3>
          ${metaBits.length ? `<p class="card__meta">${metaBits.join(' · ')}</p>` : ''}
          <div class="card__foot">
            <span class="more">לפרטים <span class="arr">←</span></span>
          </div>
        </div>
      </a>
    `;
  }

  function renderGrid(target, items, data, emptyHtml) {
    if (!items.length) {
      target.innerHTML = emptyHtml || '';
      return;
    }
    target.innerHTML = items.map((p) => cardHtml(p, data)).join('');
    ui.initReveal();
  }

  window.KN = window.KN || {};
  window.KN.listing = {
    filter,
    sort,
    cardHtml,
    renderGrid,
    imageUrl,
    lookupCity,
    lookupType,
    startingPrice,
    priceForDate,
    avgPriceInRange,
    pagesPath
  };
})();
