// ============================================================
// js/data/static-data.js – נתונים מוגדרים מראש
// ============================================================
// אזורים (איורים בסגנון הקובץ העיצובי), שירותים מורחבים
// לוילות ומתחמי אירועים, מקובצים לקטגוריות.
// ============================================================

(function () {
  // ============================================================
  // אזורים + איור (SVG) לכל אזור
  // ============================================================
  const REGIONS = [
    { id: 'jerusalem', name: 'ירושלים והרי יהודה' },
    { id: 'center',    name: 'תל אביב והמרכז' },
    { id: 'sharon',    name: 'שרון' },
    { id: 'shfela',    name: 'שפלה' },
    { id: 'haifa',     name: 'חיפה והכרמל' },
    { id: 'galilee',   name: 'הגליל' },
    { id: 'golan',     name: 'גולן' },
    { id: 'south',     name: 'הנגב' },
    { id: 'eilat',     name: 'אילת והערבה' },
    { id: 'deadsea',   name: 'ים המלח' }
  ];

  // איורים בסגנון הקובץ העיצובי (שכבות צבע, שמש, גבעות)
  const REGION_SVG = {
    jerusalem: `
      <rect width="300" height="200" fill="#EBD9B4"/>
      <circle cx="60" cy="55" r="32" fill="#E6AC36"/>
      <path d="M0 140 Q90 115 180 140 T300 132 V200 H0Z" fill="#7d8a48"/>
      <rect y="140" width="300" height="60" fill="#D7B26B"/>
      <g fill="#F4ECD8" stroke="#23211B" stroke-width="1.4">
        <rect x="40" y="98" width="56" height="48"/>
        <rect x="100" y="86" width="64" height="60"/>
        <rect x="168" y="92" width="58" height="54"/>
        <rect x="230" y="100" width="48" height="46"/>
      </g>
      <g fill="#23211B" opacity="0.55">
        <rect x="50" y="110" width="8" height="14"/>
        <rect x="74" y="110" width="8" height="14"/>
        <rect x="116" y="104" width="9" height="16"/>
        <rect x="140" y="104" width="9" height="16"/>
        <rect x="184" y="108" width="8" height="14"/>
        <rect x="210" y="108" width="8" height="14"/>
        <rect x="244" y="116" width="8" height="14"/>
      </g>
      <path d="M120 86 a26 26 0 0 1 52 0Z" fill="#E6AC36"/>
      <rect x="143" y="60" width="6" height="14" fill="#E6AC36"/>
      <circle cx="146" cy="58" r="3" fill="#E6AC36"/>
      <g transform="translate(20 95)">
        <rect x="-3" y="32" width="6" height="20" fill="#3a2a1c"/>
        <path d="M0 -4 C13 30 11 52 0 62 C-11 52 -13 30 0 -4Z" fill="#2f4a22"/>
      </g>
      <g transform="translate(280 100)">
        <rect x="-3" y="28" width="6" height="18" fill="#3a2a1c"/>
        <path d="M0 -2 C11 26 9 46 0 54 C-9 46 -11 26 0 -2Z" fill="#2f4a22"/>
      </g>`,
    center: `
      <rect width="300" height="200" fill="#EBCB8A"/>
      <circle cx="240" cy="55" r="30" fill="#DC5A38"/>
      <rect y="130" width="300" height="70" fill="#1E7A78"/>
      <g fill="#23211B" opacity="0.85">
        <rect x="30" y="70" width="22" height="60"/>
        <rect x="60" y="50" width="26" height="80"/>
        <rect x="96" y="80" width="20" height="50"/>
        <rect x="128" y="60" width="24" height="70"/>
        <rect x="170" y="74" width="22" height="56"/>
        <rect x="210" y="58" width="26" height="72"/>
      </g>
      <g fill="#E6AC36" opacity="0.9">
        <rect x="34" y="80" width="3" height="3"/><rect x="42" y="80" width="3" height="3"/>
        <rect x="64" y="62" width="3" height="3"/><rect x="74" y="62" width="3" height="3"/>
        <rect x="174" y="84" width="3" height="3"/><rect x="184" y="84" width="3" height="3"/>
        <rect x="216" y="70" width="3" height="3"/><rect x="226" y="70" width="3" height="3"/>
      </g>
      <path d="M0 152 q30 -6 60 0 t60 0 t60 0 t60 0 v8 H0Z" fill="#3C9290"/>`,
    sharon: `
      <rect width="300" height="200" fill="#F0DCA8"/>
      <rect width="300" height="115" fill="#EBCB8A"/>
      <circle cx="60" cy="55" r="30" fill="#E6AC36"/>
      <rect y="125" width="300" height="75" fill="#1E7A78"/>
      <g fill="#3C9290" opacity="0.7">
        <path d="M0 145 q30 -6 60 0 t60 0 t60 0 t60 0 v8 H0Z"/>
      </g>
      <path d="M0 120 Q90 110 180 120 T300 118 V140 H0 Z" fill="#D7B26B"/>
      <g transform="translate(230 105)">
        <rect x="-3" y="0" width="6" height="40" fill="#5a3b27"/>
        <path d="M0 -8 c20 -2 24 18 0 22 c-24 -4 -20 -24 0 -22 Z" fill="#3a5a2c"/>
        <path d="M-20 -2 q20 -14 40 0 q-20 12 -40 0 Z" fill="#3a5a2c"/>
      </g>
      <g transform="translate(50 110)">
        <rect x="-3" y="0" width="6" height="30" fill="#5a3b27"/>
        <path d="M-16 0 q16 -14 32 0 q-16 10 -32 0 Z" fill="#3a5a2c"/>
      </g>`,
    shfela: `
      <rect width="300" height="200" fill="#EBD0A6"/>
      <rect width="300" height="115" fill="#E8C089"/>
      <circle cx="220" cy="55" r="32" fill="#E6AC36"/>
      <path d="M0 115 Q90 80 180 115 T300 105 V145 H0Z" fill="#a4b66c"/>
      <path d="M0 145 Q100 120 200 145 T300 140 V175 H0Z" fill="#7d8a48"/>
      <path d="M0 175 Q120 160 240 175 T300 173 V200 H0Z" fill="#5a6a2d"/>
      <g transform="translate(60 145)">
        <rect x="-2" y="0" width="4" height="15" fill="#3a2a1c"/>
        <path d="M0 -2 C10 16 8 28 0 36 C-8 28 -10 16 0 -2Z" fill="#34522a"/>
      </g>
      <g transform="translate(110 155)">
        <rect x="-2" y="0" width="4" height="13" fill="#3a2a1c"/>
        <path d="M0 -2 C8 14 6 24 0 30 C-6 24 -8 14 0 -2Z" fill="#2f4a22"/>
      </g>`,
    haifa: `
      <rect width="300" height="200" fill="#CFE0DA"/>
      <circle cx="230" cy="55" r="34" fill="#E6AC36"/>
      <rect y="105" width="300" height="95" fill="#1E7A78"/>
      <path d="M0 125 q40 -8 80 0 t80 0 t80 0 t80 0 v8 H0Z" fill="#3C9290"/>
      <path d="M0 165 Q90 150 180 168 T300 162 V200 H0Z" fill="#D7B26B"/>
      <path d="M70 105 l24 -42 l24 42Z" fill="#F4ECD8"/>
      <path d="M150 105 l28 -50 l28 50Z" fill="#62702F"/>
      <g transform="translate(40 130)">
        <rect x="0" y="0" width="36" height="28" fill="#F4ECD8"/>
        <rect x="0" y="-3" width="36" height="4" fill="#DC5A38"/>
        <rect x="14" y="10" width="8" height="12" fill="#1E7A78"/>
      </g>`,
    galilee: `
      <rect width="300" height="200" fill="#D8E3CC"/>
      <circle cx="60" cy="60" r="34" fill="#E6AC36"/>
      <path d="M0 110 Q90 80 180 110 T300 100 V200 H0Z" fill="#7d8a48"/>
      <path d="M0 150 Q100 125 220 150 T300 145 V200 H0Z" fill="#5a6a2d"/>
      <g transform="translate(210 95)">
        <rect x="-3" y="40" width="6" height="22" fill="#3a2a1c"/>
        <path d="M0 -4 C13 30 11 52 0 62 C-11 52 -13 30 0 -4Z" fill="#2f4a22"/>
      </g>
      <g transform="translate(250 110)">
        <rect x="-2" y="30" width="4" height="18" fill="#3a2a1c"/>
        <path d="M0 -2 C10 22 8 40 0 48 C-8 40 -10 22 0 -2Z" fill="#34522a"/>
      </g>
      <g transform="translate(80 135)">
        <rect x="0" y="0" width="40" height="28" fill="#E9D9B8"/>
        <path d="M-4 4 L20 -12 L44 4 Z" fill="#DC5A38"/>
        <rect x="14" y="14" width="10" height="14" fill="#3a2a1c"/>
      </g>`,
    golan: `
      <rect width="300" height="200" fill="#CFE0DA"/>
      <circle cx="240" cy="50" r="28" fill="#E6AC36"/>
      <path d="M0 110 L60 60 L120 110 Z" fill="#3E7B6E"/>
      <path d="M30 110 L60 60 L90 100 Z" fill="#F4ECD8"/>
      <path d="M90 110 L170 40 L250 110 Z" fill="#3E7B6E"/>
      <path d="M140 110 L170 40 L200 95 Z" fill="#F4ECD8"/>
      <path d="M190 110 L250 70 L300 110 Z" fill="#62702F"/>
      <rect y="110" width="300" height="90" fill="#7d8a48"/>
      <path d="M0 140 Q90 125 180 140 T300 138 V200 H0Z" fill="#5a6a2d"/>
      <g transform="translate(100 155)">
        <rect x="-2" y="0" width="4" height="14" fill="#3a2a1c"/>
        <path d="M0 -2 C10 14 8 26 0 32 C-8 26 -10 14 0 -2Z" fill="#34522a"/>
      </g>`,
    south: `
      <rect width="300" height="200" fill="#F0DCA8"/>
      <circle cx="80" cy="60" r="36" fill="#DC5A38"/>
      <path d="M180 80 h120 v40 h-120Z" fill="#C8632F"/>
      <path d="M180 80 l24 -18 h96 v18Z" fill="#A94e24"/>
      <path d="M0 120 Q90 95 180 122 T300 115 V200 H0Z" fill="#D7B26B"/>
      <path d="M0 155 Q100 135 220 160 T300 155 V200 H0Z" fill="#C29A52"/>
      <g transform="translate(110 130)">
        <path d="M0 30 V0" stroke="#5a3b27" stroke-width="4"/>
        <path d="M0 8 l-16 -6 M0 5 l16 -8" stroke="#5a3b27" stroke-width="3"/>
        <ellipse cx="0" cy="-6" rx="32" ry="10" fill="#62702F"/>
      </g>`,
    eilat: `
      <rect width="300" height="200" fill="#F1DEAE"/>
      <circle cx="60" cy="50" r="28" fill="#E6AC36"/>
      <path d="M0 90 L60 40 L110 80 L170 30 L240 90 L300 60 V140 H0Z" fill="#C8632F"/>
      <path d="M30 90 L60 40 L80 75 Z" fill="#A94e24"/>
      <path d="M140 90 L170 30 L200 75 Z" fill="#A94e24"/>
      <rect y="140" width="300" height="60" fill="#1E7A78"/>
      <g fill="#3C9290" opacity="0.7">
        <path d="M0 160 q30 -6 60 0 t60 0 t60 0 t60 0 v8 H0Z"/>
        <path d="M0 180 q30 -6 60 0 t60 0 t60 0 t60 0 v8 H0Z"/>
      </g>
      <g fill="#DC5A38" opacity="0.6">
        <circle cx="80" cy="178" r="3"/>
        <circle cx="180" cy="184" r="3"/>
      </g>`,
    deadsea: `
      <rect width="300" height="200" fill="#EAE0CB"/>
      <circle cx="240" cy="55" r="30" fill="#E6AC36"/>
      <path d="M0 100 L90 60 L160 95 L240 60 L300 95 V120 H0Z" fill="#8E83A0"/>
      <rect y="120" width="300" height="80" fill="#56B0B2"/>
      <g fill="#F4ECD8">
        <ellipse cx="100" cy="160" rx="28" ry="10"/>
        <ellipse cx="210" cy="170" rx="34" ry="12"/>
        <ellipse cx="50" cy="180" rx="18" ry="6"/>
      </g>
      <g stroke="#F4ECD8" stroke-width="2" opacity="0.6">
        <path d="M40 145 q10 8 20 0 q10 -8 20 0"/>
        <path d="M180 150 q10 8 20 0 q10 -8 20 0"/>
      </g>`
  };

  function regionSvg(id) {
    const inner = REGION_SVG[id];
    if (!inner) return '';
    return `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
  }

  // ============================================================
  // קטגוריות שירותים - מורחב לוילות ואירועים
  // ============================================================
  const SERVICE_CATEGORIES = [
    { id: 'basic',         name: 'בסיסי' },
    { id: 'kitchen',       name: 'מטבח ואוכל' },
    { id: 'entertainment', name: 'בידור ופנאי' },
    { id: 'outdoor',       name: 'בחוץ ונוף' },
    { id: 'family',        name: 'משפחות' },
    { id: 'events',        name: 'אירועים וקבוצות' },
    { id: 'kosher',        name: 'שמירת הלכה' },
    { id: 'access',        name: 'נגישות' }
  ];

  const SERVICES = [
    // basic
    { id: 'wifi',     cat: 'basic', name: 'אינטרנט אלחוטי', icon: '<path d="M12 21l3.5-4.5a4.5 4.5 0 0 0-7 0L12 21zm-7-9a11 11 0 0 1 14 0l-2 2a8 8 0 0 0-10 0l-2-2zm-3.5-3.5a16 16 0 0 1 21 0l-2 2a13 13 0 0 0-17 0l-2-2z"/>' },
    { id: 'parking',  cat: 'basic', name: 'חניה', icon: '<path d="M5 3h6a5 5 0 0 1 0 10H8v8H5V3zm3 3v4h3a2 2 0 0 0 0-4H8z"/>' },
    { id: 'parking_many', cat: 'basic', name: 'חניה לקבוצה גדולה', icon: '<path d="M2 18h20v3H2zM4 6h4l1 8H3zm6 0h4l1 8H9zm6 0h4l1 8h-6z"/>' },
    { id: 'ac',       cat: 'basic', name: 'מזגנים בכל החדרים', icon: '<path d="M3 5h18v4H3V5zm0 6h18v3H3v-3z"/><path d="M6 17c0 2 2 4 3 4M12 17c0 2 2 4 3 4M18 17c0 2-2 4-3 4" fill="none" stroke="currentColor"/>' },
    { id: 'heating',  cat: 'basic', name: 'חימום מרכזי', icon: '<path d="M9 3v6c-1.5 1-2.5 2.6-2.5 4.5a5.5 5.5 0 0 0 11 0c0-1.9-1-3.5-2.5-4.5V3H9z"/>' },
    { id: 'tv',       cat: 'basic', name: 'טלוויזיה (גם בכבלים/לוויין)', icon: '<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M8 21h8" stroke="currentColor"/>' },
    { id: 'safe',     cat: 'basic', name: 'כספת', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="13" cy="12" r="3"/><path d="M19 9v6" stroke="currentColor"/>' },
    { id: 'linens',   cat: 'basic', name: 'מצעים ומגבות', icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 12h18M9 5v14" stroke="currentColor" fill="none"/>' },
    { id: 'cleaning', cat: 'basic', name: 'שירותי ניקיון', icon: '<path d="M9 2h6l-2 4h-2zM10 8h4l-1 3h-2zM7 12h10v9H7z"/>' },
    { id: 'security', cat: 'basic', name: 'מערכת אבטחה / מצלמות', icon: '<rect x="3" y="6" width="14" height="9"/><path d="M17 8l4-2v12l-4-2z"/>' },

    // kitchen
    { id: 'kitchen_full', cat: 'kitchen', name: 'מטבח מאובזר מלא', icon: '<path d="M6 2h12v3H6V2zm0 5h12v15H6V7zm2 2v3h8V9H8zm0 5v2h8v-2H8z"/>' },
    { id: 'dishwasher', cat: 'kitchen', name: 'מדיח כלים', icon: '<rect x="4" y="3" width="16" height="18"/><path d="M4 7h16M8 11h8M8 15h8" stroke="currentColor" fill="none"/>' },
    { id: 'coffee',   cat: 'kitchen', name: 'מכונת קפה', icon: '<rect x="6" y="4" width="12" height="14"/><circle cx="12" cy="11" r="3"/><path d="M6 18h12v3H6z"/>' },
    { id: 'fridge_big', cat: 'kitchen', name: 'מקרר גדול', icon: '<rect x="5" y="2" width="14" height="20"/><path d="M5 9h14M8 5v2M8 12v3" stroke="currentColor" fill="none"/>' },
    { id: 'oven',     cat: 'kitchen', name: 'תנור', icon: '<rect x="4" y="4" width="16" height="16"/><path d="M4 11h16M7 7h2M11 7h2M15 7h2" stroke="currentColor" fill="none"/>' },
    { id: 'microwave', cat: 'kitchen', name: 'מיקרוגל', icon: '<rect x="3" y="6" width="18" height="12"/><rect x="5" y="8" width="10" height="8"/><circle cx="18" cy="10" r="1"/><circle cx="18" cy="14" r="1"/>' },
    { id: 'dining_big', cat: 'kitchen', name: 'פינת אוכל לקבוצה גדולה', icon: '<rect x="2" y="9" width="20" height="3"/><path d="M5 12v9M19 12v9M9 12v9M15 12v9"/>' },
    { id: 'water_cooler', cat: 'kitchen', name: 'בר מים חמים/קרים', icon: '<rect x="8" y="2" width="8" height="10"/><path d="M9 12h6l-1 10h-4z"/>' },

    // entertainment
    { id: 'pool',     cat: 'entertainment', name: 'בריכה פרטית', icon: '<path d="M2 18c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1v3c-2 0-2 1-4 1s-2-1-4-1-2 1-4 1-2-1-4-1-2 1-4 1v-3zm4-2V8a2 2 0 0 1 4 0v8h4V8a2 2 0 0 1 4 0v8"/>' },
    { id: 'pool_heated', cat: 'entertainment', name: 'בריכה מחוממת', icon: '<path d="M2 18c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1v3c-2 0-2 1-4 1s-2-1-4-1-2 1-4 1-2-1-4-1z"/><path d="M8 4c-1 2 1 3 0 5M14 4c-1 2 1 3 0 5"/>' },
    { id: 'pool_kids', cat: 'entertainment', name: 'בריכת ילדים', icon: '<ellipse cx="12" cy="14" rx="9" ry="5"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>' },
    { id: 'jacuzzi',  cat: 'entertainment', name: 'ג׳קוזי / ספא', icon: '<path d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6zm2-7h2v6H6V4zm10 0h2v6h-2V4z"/>' },
    { id: 'sauna',    cat: 'entertainment', name: 'סאונה', icon: '<rect x="3" y="3" width="18" height="18"/><path d="M3 8h18M3 13h18M3 18h18" stroke="currentColor" fill="none"/>' },
    { id: 'gameroom', cat: 'entertainment', name: 'חדר משחקים', icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>' },
    { id: 'pingpong', cat: 'entertainment', name: 'שולחן פינג-פונג', icon: '<rect x="3" y="11" width="18" height="3"/><circle cx="18" cy="9" r="2"/>' },
    { id: 'pool_table', cat: 'entertainment', name: 'שולחן ביליארד', icon: '<rect x="2" y="9" width="20" height="6" rx="1"/><circle cx="7" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="17" cy="12" r="1"/>' },
    { id: 'arcade',   cat: 'entertainment', name: 'משחקי ארקייד', icon: '<rect x="6" y="3" width="12" height="18"/><rect x="8" y="6" width="8" height="6"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>' },
    { id: 'home_cinema', cat: 'entertainment', name: 'מקרן / חדר קולנוע', icon: '<rect x="2" y="6" width="20" height="12"/><circle cx="12" cy="12" r="3"/>' },
    { id: 'sound',    cat: 'entertainment', name: 'מערכת סאונד', icon: '<rect x="6" y="3" width="12" height="18"/><circle cx="12" cy="9" r="2"/><circle cx="12" cy="15" r="3"/>' },
    { id: 'karaoke',  cat: 'entertainment', name: 'קריוקי', icon: '<circle cx="12" cy="8" r="3"/><path d="M12 11v8M9 21h6"/>' },
    { id: 'bbq',      cat: 'entertainment', name: 'מנגל / גריל', icon: '<path d="M4 6h16l-2 6H6L4 6zm2 7h12l-1.5 4h-9L6 13zm3 6h6l-1 3H10l-1-3z"/>' },
    { id: 'fire_pit', cat: 'entertainment', name: 'מדורה / פייר פיט', icon: '<path d="M12 3c-2 3 0 5-2 7s0 7 2 9c2-2 4-7 2-9s0-4-2-7z"/>' },
    { id: 'books',    cat: 'entertainment', name: 'ספרייה / משחקי חברה', icon: '<rect x="3" y="3" width="6" height="18"/><rect x="11" y="3" width="6" height="18"/>' },

    // outdoor / view
    { id: 'yard_big', cat: 'outdoor', name: 'חצר גדולה ופרטית', icon: '<rect x="2" y="14" width="20" height="7"/><path d="M5 14V6h14v8"/>' },
    { id: 'lawn',     cat: 'outdoor', name: 'דשא מטופח', icon: '<rect x="2" y="14" width="20" height="7"/><path d="M3 14l1-3M7 14l1-3M11 14l1-3M15 14l1-3M19 14l1-3"/>' },
    { id: 'garden',   cat: 'outdoor', name: 'גינה / מטעים', icon: '<circle cx="12" cy="8" r="3"/><path d="M12 11v10M6 17c0-3 2-5 6-5s6 2 6 5"/>' },
    { id: 'balcony',  cat: 'outdoor', name: 'מרפסת', icon: '<path d="M3 11h18v2H3v-2zm0 4h18v6H3v-6zm2 1v4h2v-4H5zm4 0v4h2v-4H9zm4 0v4h2v-4h-2zm4 0v4h2v-4h-2zM6 4h12v6H6V4z"/>' },
    { id: 'private_entrance', cat: 'outdoor', name: 'כניסה פרטית', icon: '<rect x="6" y="3" width="12" height="18"/><circle cx="14" cy="12" r="1"/>' },
    { id: 'view_sea', cat: 'outdoor', name: 'נוף לים', icon: '<circle cx="6" cy="6" r="3"/><path d="M2 14q4 -3 8 0 t8 0 t4 0 v6 H2z"/>' },
    { id: 'view_mountain', cat: 'outdoor', name: 'נוף הרים', icon: '<path d="M2 20 L8 10 L13 16 L17 8 L22 20 Z"/>' },
    { id: 'view_pastoral', cat: 'outdoor', name: 'נוף פסטורלי', icon: '<rect x="2" y="14" width="20" height="7"/><path d="M2 14q5 -5 10 0 t10 0"/>' },
    { id: 'gated',    cat: 'outdoor', name: 'מתחם סגור עם שער', icon: '<rect x="4" y="6" width="3" height="15"/><rect x="17" y="6" width="3" height="15"/><path d="M7 6h10v5H7z"/>' },
    { id: 'pergola',  cat: 'outdoor', name: 'פרגולה / סוכת צל', icon: '<path d="M3 6h18M3 10h18M5 6v15M19 6v15"/>' },
    { id: 'sun_loungers', cat: 'outdoor', name: 'מיטות שיזוף', icon: '<rect x="3" y="11" width="18" height="3"/><path d="M3 14v3M21 14v3"/>' },
    { id: 'trampoline', cat: 'outdoor', name: 'טרמפולינה', icon: '<ellipse cx="12" cy="14" rx="9" ry="3"/><path d="M4 14v3M20 14v3"/>' },
    { id: 'playground', cat: 'outdoor', name: 'מתקני שעשוע לילדים', icon: '<path d="M4 21V8l8-4 8 4v13"/><path d="M4 21h16"/>' },
    { id: 'petting_zoo', cat: 'outdoor', name: 'פינת חי', icon: '<circle cx="9" cy="12" r="4"/><circle cx="17" cy="14" r="3"/>' },

    // family
    { id: 'crib',     cat: 'family', name: 'מיטת תינוק', icon: '<path d="M3 8h18v2H3V8zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8zm3 2v6h12v-6H6z"/>' },
    { id: 'high_chair', cat: 'family', name: 'כיסא תינוק', icon: '<rect x="8" y="6" width="8" height="3"/><path d="M9 9v8h6V9M10 17v4M14 17v4"/>' },
    { id: 'baby_bath', cat: 'family', name: 'אמבטיה לתינוק', icon: '<path d="M3 12h18v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/>' },
    { id: 'baby_gates', cat: 'family', name: 'גדרות בטיחות', icon: '<rect x="3" y="6" width="3" height="15"/><rect x="9" y="6" width="3" height="15"/><rect x="15" y="6" width="3" height="15"/>' },
    { id: 'kids_room', cat: 'family', name: 'חדר ילדים מאובזר', icon: '<rect x="3" y="10" width="18" height="11"/><path d="M3 10l9-7 9 7"/>' },
    { id: 'pets',     cat: 'family', name: 'חיות מחמד מותרות', icon: '<circle cx="6" cy="9" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><path d="M12 11a6 6 0 0 0-6 6c0 2 2 4 6 4s6-2 6-4a6 6 0 0 0-6-6z"/>' },
    { id: 'family_friendly', cat: 'family', name: 'ידידותי למשפחות', icon: '<circle cx="8" cy="7" r="3"/><circle cx="16" cy="7" r="3"/><path d="M3 21v-3a5 5 0 0 1 10 0v3M11 21v-3a5 5 0 0 1 10 0v3"/>' },

    // events & groups (NEW)
    { id: 'event_space', cat: 'events', name: 'אולם / שטח אירועים', icon: '<rect x="2" y="6" width="20" height="14"/><path d="M2 10h20"/>' },
    { id: 'dance_floor', cat: 'events', name: 'רחבת ריקודים', icon: '<rect x="3" y="11" width="18" height="9"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>' },
    { id: 'stage',    cat: 'events', name: 'במה', icon: '<rect x="2" y="13" width="20" height="6"/><path d="M2 13l4-5h12l4 5"/>' },
    { id: 'pa_system', cat: 'events', name: 'מערכת הגברה', icon: '<rect x="6" y="4" width="4" height="16"/><path d="M10 8l8-3v14l-8-3"/>' },
    { id: 'lighting', cat: 'events', name: 'מערכת תאורה', icon: '<path d="M9 3h6l-1 6h-4z"/><path d="M11 9v8h2V9"/><path d="M3 11h4M17 11h4"/>' },
    { id: 'tables_chairs', cat: 'events', name: 'שולחנות וכיסאות לאירוע', icon: '<rect x="3" y="9" width="18" height="3"/><path d="M5 12v9M19 12v9M9 12v9M15 12v9"/>' },
    { id: 'catering_kitchen', cat: 'events', name: 'מטבח לקייטרינג', icon: '<rect x="3" y="3" width="18" height="6"/><rect x="3" y="11" width="18" height="10"/><path d="M3 16h18"/>' },
    { id: 'wedding_canopy', cat: 'events', name: 'חופה / מקום לטקס', icon: '<path d="M3 8h18M5 8v13M19 8v13"/><path d="M3 8c2-4 7-4 9 0c2-4 7-4 9 0"/>' },
    { id: 'large_capacity', cat: 'events', name: 'התאמה לקבוצות גדולות (50+)', icon: '<circle cx="6" cy="6" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/><path d="M2 18v3h20v-3"/>' },
    { id: 'multi_units', cat: 'events', name: 'מספר יחידות דיור', icon: '<rect x="3" y="11" width="6" height="10"/><rect x="11" y="6" width="6" height="15"/><rect x="19" y="9" width="2" height="12"/>' },
    { id: 'multi_bathrooms', cat: 'events', name: 'מספר מקלחות / שירותים', icon: '<rect x="3" y="6" width="6" height="15"/><rect x="11" y="6" width="6" height="15"/><circle cx="6" cy="10" r="1"/><circle cx="14" cy="10" r="1"/>' },
    { id: 'group_dining', cat: 'events', name: 'חדר אוכל לקבוצה', icon: '<rect x="3" y="11" width="18" height="3"/><path d="M5 14v7M19 14v7M9 14v7M15 14v7"/>' },
    { id: 'shabbat_groups', cat: 'events', name: 'התאמה לשבתות ארגון', icon: '<circle cx="12" cy="6" r="3"/><path d="M6 21v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3"/>' },

    // kosher / halacha
    { id: 'shabbat_plate', cat: 'kosher', name: 'פלטה של שבת', icon: '<rect x="3" y="9" width="18" height="6" rx="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><path d="M5 16v4M19 16v4"/>' },
    { id: 'urn',      cat: 'kosher', name: 'מיחם מים חמים', icon: '<rect x="6" y="4" width="12" height="14" rx="2"/><path d="M6 9h12M10 18v3M14 18v3M11 12h2"/>' },
    { id: 'kosher_kitchen', cat: 'kosher', name: 'מטבח כשר (בשר/חלב נפרדים)', icon: '<rect x="3" y="3" width="8" height="18"/><rect x="13" y="3" width="8" height="18"/><path d="M5 7v10M15 7v10"/>' },
    { id: 'shabbat_clock', cat: 'kosher', name: 'שעון שבת לחשמל', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>' },
    { id: 'shabbat_lights', cat: 'kosher', name: 'תאורת שבת מוכנה', icon: '<path d="M12 3v6M9 9h6l-1 4h-4z"/><path d="M11 13v6h2v-6"/>' },
    { id: 'synagogue_in', cat: 'kosher', name: 'בית כנסת בתוך המתחם', icon: '<rect x="4" y="10" width="16" height="11"/><path d="M12 2l9 8H3z"/><path d="M12 5v4M10 7h4"/>' },
    { id: 'mikveh_in', cat: 'kosher', name: 'מקווה במתחם', icon: '<path d="M12 2c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>' },
    { id: 'eruv',     cat: 'kosher', name: 'בתוך עירוב', icon: '<rect x="3" y="6" width="18" height="13" stroke-dasharray="3 2" fill="none" stroke="currentColor" stroke-width="2"/>' },
    { id: 'mehadrin', cat: 'kosher', name: 'כשרות מהדרין מאושרת', icon: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>' },
    { id: 'kosher_pets', cat: 'kosher', name: 'ללא חיות מחמד', icon: '<circle cx="12" cy="9" r="4"/><path d="M6 22l12-12" stroke="currentColor" stroke-width="2"/>' },

    // access
    { id: 'wheelchair', cat: 'access', name: 'נגיש לכיסא גלגלים', icon: '<circle cx="12" cy="4" r="2"/><path d="M9 7v6h6l-2 8h-2l1-6H9c-2 0-2-2-2-2V7c0-1 1-1 2 0z"/>' },
    { id: 'elevator', cat: 'access', name: 'מעלית', icon: '<rect x="4" y="3" width="16" height="18"/><path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4"/>' },
    { id: 'ground_floor', cat: 'access', name: 'קומת קרקע (ללא מדרגות)', icon: '<rect x="3" y="14" width="18" height="7"/><path d="M3 14h18"/>' },
    { id: 'wide_doors', cat: 'access', name: 'דלתות רחבות', icon: '<rect x="6" y="3" width="12" height="18"/>' },
    { id: 'accessible_bathroom', cat: 'access', name: 'שירותים נגישים', icon: '<rect x="4" y="3" width="16" height="18"/><circle cx="12" cy="9" r="2"/><path d="M9 14h6v6H9z"/>' }
  ];

  function serviceIconSvg(service) {
    if (!service) return '';
    return `<svg class="svc-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${service.icon}</svg>`;
  }

  function lookupRegion(id)  { return REGIONS.find((r) => r.id === id) || null; }
  function lookupService(id) { return SERVICES.find((s) => s.id === id) || null; }
  function lookupServiceCategory(id) { return SERVICE_CATEGORIES.find((c) => c.id === id) || null; }

  function servicesByCategory(selectedIds) {
    const set = new Set(selectedIds || []);
    const result = [];
    SERVICE_CATEGORIES.forEach((cat) => {
      const items = SERVICES.filter((s) => s.cat === cat.id && set.has(s.id));
      if (items.length) result.push({ cat, items });
    });
    return result;
  }

  const WEEKDAYS = [
    { id: 0, name: 'ראשון' },
    { id: 1, name: 'שני' },
    { id: 2, name: 'שלישי' },
    { id: 3, name: 'רביעי' },
    { id: 4, name: 'חמישי' },
    { id: 5, name: 'שישי' },
    { id: 6, name: 'שבת' }
  ];

  window.KN = window.KN || {};
  window.KN.staticData = {
    REGIONS,
    SERVICES,
    SERVICE_CATEGORIES,
    WEEKDAYS,
    lookupRegion,
    lookupService,
    lookupServiceCategory,
    servicesByCategory,
    serviceIconSvg,
    regionSvg
  };
})();
