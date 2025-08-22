// docs/js/state.js
(function () {
  const { STORAGE_KEY } = window.JORNADA_CFG;
  const S = {};

  // Carregar estado salvo
  S.load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  };

  // Salvar estado completo
  S.save = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Apagar tudo
  S.clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Helpers para chave/valor
  S.get = (k, fallback) => {
    return S.load()[k] ?? fallback;
  };

  S.set = (k, v) => {
    const st = S.load();
    st[k] = v;
    S.save(st);
  };

  // Expor no escopo global
  window.JSTATE = S;
})();
