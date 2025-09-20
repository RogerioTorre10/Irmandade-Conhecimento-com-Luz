// docs/js/state.js — resiliente e compatível
(function () {
  // ---- Config segura (sem quebrar se JORNADA_CFG não existir)
  const CFG = window.JORNADA_CFG || {};
  const STORAGE_KEY = CFG.STORAGE_KEY || 'JORNADA_STATE';

  // ---- localStorage com fallback em memória
  const mem = { value: '{}' };
  const ls = (() => {
    try {
      const testKey = '__j_state_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (_) {
      return {
        getItem: () => mem.value,
        setItem: (_, v) => { mem.value = String(v ?? '{}'); },
        removeItem: () => { mem.value = '{}'; }
      };
    }
  })();

  // ---- cache para evitar JSON.parse a cada chamada
  let cache = null;

  function read() {
    if (cache) return cache;
    try {
      const raw = ls.getItem(STORAGE_KEY) || '{}';
      cache = JSON.parse(raw);
    } catch (_) {
      cache = {};
    }
    return cache;
  }

  function write(obj) {
    cache = obj && typeof obj === 'object' ? obj : {};
    try {
      ls.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (_) {
      // quota ou privado – mantém só em memória
    }
  }

  const S = {};

  // Carregar estado salvo (objeto)
  S.load = () => read();

  // Salvar estado completo (substitui)
  S.save = (data) => write(data || {});

  // Apagar tudo
  S.clearAll = () => {
    try { ls.removeItem(STORAGE_KEY); } catch (_) {}
    cache = {};
  };

  // Helpers chave/valor
  S.get = (k, fallback) => (read()[k] !== undefined ? read()[k] : fallback);

  S.set = (k, v) => {
    const st = read();
    st[k] = v;
    write(st);
  };

  // (novo) Remover chave específica
  S.remove = (k) => {
    const st = read();
    if (k in st) { delete st[k]; write(st); }
  };

  // Mantém cache sincronizado entre abas
  try {
    window.addEventListener('storage', (ev) => {
      if (ev.key === STORAGE_KEY) {
        try { cache = JSON.parse(ev.newValue || '{}'); }
        catch { cache = {}; }
      }
    });
  } catch (_) {}

  // Expor no escopo global
  window.JSTATE = S;
})();
