// ============================================================
// copy.he.js – כל הטקסטים בעברית במקום אחד.
// ============================================================
// "מתחם" / "מתחמים" - מילים אחידות לאתר (לוילות ומתחמי אירועים).
// ============================================================

window.COPY = {
  brand: {
    name:    'קל נופש',
    tagline: 'מתחמי נופש · ישראל'
  },

  nav: {
    home:    'דף הבית',
    search:  'חיפוש מתחמים',
    publish: 'פרסום מתחם',
    admin:   'אזור מפרסם'
  },

  home: {
    heroTitleLine1: 'מקום שמרגיש שלכם מהרגע שנכנסתם.',
    heroTitleLine2: '',
    heroSub:        'לסגור בקלות ובמהירות את מתחם הנופש הטוב ביותר, לאירוע והחופשה שלכם.',

    searchTitle: 'איזה מתחם יתאים לכם?',

    listingsTitle:    'המתחמים שלנו',
    listingsSubtitle: 'השתמשו בחיפוש כדי לסנן לפי סוג, אזור, עיר, תאריכים ומחיר.',

    emptyTitle: 'אין כרגע מתחמים באתר.',
    emptyBody:  'המפרסם עדיין לא הזין מתחמים. נסו שוב מאוחר יותר.',

    publishStripText: 'מעוניינים לפרסם את מתחם הנופש שלכם? בא נדבר',
    publishStripCta:  'שליחה בווצאפ',

    publishWhatsappMessage: 'היי, מעוניין לפרסם את מתחם הנופש שלי באתר קל נופש. אפשר לשמוע פרטים?'
  },

  search: {
    nameLabel:    'שם המתחם',
    namePlaceholder: 'לדוגמה: וילה ים',
    typeLabel:    'סוג נכס',
    typeAll:      'כל הסוגים',
    cityLabel:    'עיר',
    cityAll:      'כל הערים',
    periodLabel:  'תקופה',
    periodAll:    'כל התקופות',
    priceLabel:   'מחיר ללילה',
    priceFrom:    'מ-',
    priceTo:      'עד',
    submit:       'חיפוש',
    reset:        'איפוס',
    resultsCount: (n) => n === 1 ? 'תוצאה אחת' : `${n} תוצאות`
  },

  results: {
    title:       'תוצאות החיפוש',
    sortLabel:   'מיון',
    sortFeatured:'מומלצים תחילה',
    sortNewest:  'חדשים תחילה',
    sortPriceUp: 'מחיר: מהזול ליקר',
    sortPriceDn: 'מחיר: מהיקר לזול',
    emptyTitle:  'לא נמצאו תוצאות',
    emptyBody:   'נסו להרחיב את החיפוש - הסירו פילטרים או הרחיבו את טווח המחיר.',
    detailsBtn:  'לפרטים נוספים'
  },

  property: {
    notFoundTitle: 'המתחם לא נמצא',
    notFoundBody:  'יכול להיות שהוא הוסר או שהקישור שגוי.',
    backToSearch:  'חזרה לחיפוש',

    rooms:        (n) => `${n} חדרים`,
    beds:         (n) => `${n} מיטות`,
    perNight:     'ללילה',

    sectionAbout:   'על המתחם',
    sectionDetails: 'פרטי המתחם',
    sectionContact: 'יצירת קשר',

    contactIntro:  'מעוניינים במתחם? נחזור אליכם מיד.',
    callBtn:       'התקשרו',
    whatsappBtn:   'שליחה בווצאפ',

    propertyWhatsappMessage: (clientName, propertyName) =>
      `היי, שמי ${clientName}. אני מעוניין בפרטים נוספים ולשוחח על סגירת מתחם הנופש ${propertyName}.`
  },

  contactModal: {
    title:       'לפני שליחת ההודעה',
    intro:       'מה השם שלכם? נוסיף אותו להודעת הווצאפ.',
    nameLabel:   'שם פרטי',
    namePlaceholder: 'איך לקרוא לכם?',
    nameError:   'נא להזין שם.',
    submit:      'המשך לווצאפ',
    cancel:      'ביטול'
  },

  footer: {
    rights: '© 2026 קל נופש. כל הזכויות שמורות.',
    builtBy: 'בנוי בישראל'
  },

  admin: {
    loginTitle:    'אזור מפרסם',
    loginIntro:    'הכניסו את סיסמת הניהול כדי להמשיך.',
    passwordLabel: 'סיסמה',
    loginBtn:      'כניסה',
    loginError:    'סיסמה שגויה.',
    logout:        'יציאה',

    dashTitle:     'לוח בקרה',
    statPublished: 'מתחמים מפורסמים',
    statDraft:     'מתחמים בטיוטה',
    quickAdd:      'הוספת מתחם',
    quickSettings: 'הגדרות',

    tabProperties: 'מתחמים',
    tabLists:      'הגדרת שדות',
    tabSettings:   'הגדרות',

    propsTitle:    'ניהול מתחמים',
    addProperty:   'הוספת מתחם',
    editProperty:  'עריכת מתחם',
    deleteConfirm: 'למחוק את המתחם? פעולה זו לא ניתנת לביטול.',
    statusDraft:   'טיוטה',
    statusPublished: 'מפורסם',
    publish:       'פרסום',
    unpublish:     'השהיה',
    edit:          'עריכה',
    del:           'מחיקה',
    save:          'שמירה',
    cancel:        'ביטול',
    saved:         'נשמר בהצלחה',
    saveError:     'שמירה נכשלה. נסו שוב.',

    fName:        'שם המתחם',
    fType:        'סוג נכס',
    fCity:        'עיר',
    fNeighborhood: 'שכונה / אזור (לא חובה)',
    fPeriods:     'תקופות (בחרו אחת או יותר)',
    fPrice:       'מחיר ללילה',
    fRooms:       'מספר חדרים',
    fBeds:        'מספר מיטות',
    fDescription: 'תיאור',
    fImages:      'תמונות (תמונה ראשונה היא הראשית)',
    fPhone:       'טלפון מפרסם למתחם',
    fWhatsapp:    'ווצאפ למתחם (פורמט בינלאומי, לדוגמה 9725XXXXXXXX)',
    fStatus:      'סטטוס פרסום',

    uploadBtn:    'העלאת תמונות',
    uploading:    'מעלה...',
    removeImage:  'הסרה',
    setMain:      'הגדרה כראשית',

    listsTitle:   'הגדרת שדות',
    types:        'סוגי נכס',
    cities:       'ערים',
    periods:      'תקופות',
    addNew:       'הוספה',
    cityRegion:   'אזור',
    inUseWarn:    'הפריט בשימוש במתחם אחד או יותר. מחיקה תסיר אותו גם משם.',

    settingsTitle: 'הגדרות כלליות',
    currencyLabel: 'מטבע תצוגה',
    priceMinLabel: 'גבול תחתון למחיר ללילה',
    priceMaxLabel: 'גבול עליון למחיר ללילה',
    publishWhatsappLabel: 'מספר ווצאפ ל"פרסום מתחם" בדף הבית (פורמט בינלאומי)',
    saveSettings:  'שמירת הגדרות'
  },

  errors: {
    required:        'שדה חובה',
    invalidPhone:    'מספר טלפון לא תקין',
    invalidWhatsapp: 'מספר ווצאפ חייב להיות בפורמט בינלאומי (לדוגמה 9725XXXXXXXX)',
    priceRange:      'המחיר מחוץ לטווח שהוגדר',
    networkErr:      'בעיית רשת. נסו שוב.',
    unauthorized:    'אינך מחובר. נא להתחבר מחדש.'
  }
};
