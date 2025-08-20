(function(){
  const { STORAGE_KEY } = window.JORNADA_CFG;
  const S = {};

  S.load = () => { try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }catch(_){ return {}; } };
  S.save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  S.clearAll = () => localStorage.removeItem(STORAGE_KEY);

  S.get = (k, fallback) => (S.load()[k] ?? fallback);
  S.set = (k, v) => { const st = S.load(); st[k] = v; S.save(st); };

  window.JSTATE = S;
})();

