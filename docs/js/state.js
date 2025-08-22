(function(){
  const { STORAGE_KEY } = window.JORNADA_CFG;
  const S = {};

  S.load = () => { try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }catch(_){ return {}; } };
  S.save = (data) => localStorage.setItem('jornada_respostas', JSON.stringify([
  "Minha resposta 1", "Minha resposta 2", "Minha resposta 3"
]));
  S.save = (data) =>localStorage.setItem('jornada_perfil', JSON.stringify({ nome: "Rogério", jornada: "Essencial" }));
  S.clearAll = () => localStorage.removeItem(STORAGE_KEY);

  S.get = (k, fallback) => (S.load()[k] ?? fallback);
  S.set = (k, v) => { const st = S.load(); st[k] = v; S.save(st); };

  window.JSTATE = S;
})();

