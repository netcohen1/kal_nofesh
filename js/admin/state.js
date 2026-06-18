// ============================================================
// js/admin/state.js – מצב גלובלי לאזור הניהול
// ============================================================

(function () {
  const listeners = [];

  const state = {
    data: {
      properties: [], types: [], cities: [], image_categories: [],
      users: [],
      current_user: null,
      settings: { currency: '₪', publish_whatsapp: '' }
    },
    loaded: false
  };

  function notify() {
    listeners.forEach((fn) => {
      try { fn(state.data); } catch (e) { console.error(e); }
    });
  }

  async function load() {
    const d = await window.KN.api.getAdminData();
    state.data = {
      properties: d.properties || [],
      types: d.types || [],
      cities: d.cities || [],
      image_categories: d.image_categories || [],
      users: d.users || [],
      current_user: d.current_user || null,
      settings: d.settings || { currency: '₪', publish_whatsapp: '' }
    };
    state.loaded = true;
    notify();
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function setProperties(arr) { state.data.properties = arr; notify(); }
  function setList(kind, arr) { state.data[kind] = arr; notify(); }
  function setSettings(s)    { state.data.settings = s; notify(); }
  function setUsers(arr)     { state.data.users = arr; notify(); }

  function upsertProperty(p) {
    const arr = state.data.properties;
    const idx = arr.findIndex((x) => x.id === p.id);
    if (idx >= 0) arr[idx] = p; else arr.push(p);
    setProperties([...arr]);
  }
  function removeProperty(id) {
    setProperties(state.data.properties.filter((x) => x.id !== id));
  }

  function upsertListItem(kind, item) {
    const arr = state.data[kind] || [];
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx >= 0) arr[idx] = item; else arr.push(item);
    setList(kind, [...arr]);
  }
  function removeListItem(kind, id) {
    setList(kind, (state.data[kind] || []).filter((x) => x.id !== id));
    if (kind === 'image_categories') {
      const props = state.data.properties.map((p) => ({
        ...p,
        images: (p.images || []).map((im) => im && im.category_id === id ? { ...im, category_id: null } : im)
      }));
      setProperties(props);
      return;
    }
    const field = kind === 'types' ? 'type_id' : 'city_id';
    const props = state.data.properties.map((p) => p[field] === id
      ? { ...p, [field]: null, status: 'draft' }
      : p);
    setProperties(props);
  }

  function upsertUser(u) {
    const arr = state.data.users || [];
    const idx = arr.findIndex((x) => x.id === u.id);
    if (idx >= 0) arr[idx] = u; else arr.push(u);
    setUsers([...arr]);
  }
  function removeUser(id) {
    setUsers((state.data.users || []).filter((x) => x.id !== id));
  }

  window.KN = window.KN || {};
  window.KN.adminState = {
    get: () => state.data,
    isLoaded: () => state.loaded,
    load,
    onChange,
    upsertProperty,
    removeProperty,
    upsertListItem,
    removeListItem,
    setSettings,
    upsertUser,
    removeUser
  };
})();
