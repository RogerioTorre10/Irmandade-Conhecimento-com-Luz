(function () {
  // Chaves usadas pelo frontend/api.js
  const RESP_KEY   = 'jornada_respostas';
  const PERFIL_KEY = 'jornada_perfil';

  // ---------- Utils de (de)serialização ----------
  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch { return JSON.parse(fal(function () {
  // Chaves de dados "oficiais" usadas no PDF/HQ
  const RESP_KEY   = 'jornada_respostas';
  const PERFIL_KEY = 'jornada_perfil';

  // Estado genérico do wizard (etapa, flags etc.)
  const STATE_KEY  = 'jornada_state'; // aqui vai { etapa, ... }

  // ---------- Utils ----------
  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch { return JSON.parse(fallback); }
  };
  const writeJSON = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // ---------- Respostas ----------
  function loadRespostas() {
    return readJSON(RESP_KEY, '[]');
  }
  function saveRespostas(respostas) {
    writeJSON(RESP_KEY, Array.isArray(respostas) ? respostas : []);
  }
  function setRespostaAt(index, texto) {
    const arr = loadRespostas();
    arr[index] = texto;
    saveRespostas(arr);
  }
  function pushResposta(texto) {
    const arr = loadRespostas();
    arr.push(texto);
    saveRespostas(arr);
  }
  function clearRespostas() {
    localStorage.removeItem(RESP_KEY);
  }

  // ---------- Perfil ----------
  function loadPerfil() {
    return readJSON(PERFIL_KEY, '{}');
  }
  function savePerfil(perfil) {
    writeJSON(PERFIL_KEY, perfil && typeof perfil === 'object' ? perfil : {});
  }
  function updatePerfil(patch) {
    const p = loadPerfil();
    Object.assign(p, patch || {});
    savePerfil(p);
  }
  function clearPerfil() {
    localStorage.removeItem(PERFIL_KEY);
  }

  // ---------- Estado genérico (wizard etc.) ----------
  function loadState() {
    return readJSON(STATE_KEY, '{}');
  }
  function saveState(state) {
    writeJSON(STATE_KEY, state && typeof state === 'object' ? state : {});
  }
  function setStateKey(k, v) {
    const st = loadState();
    st[k] = v;
    saveState(st);
  }
  function getStateKey(k, fallback) {
    const st = loadState();
    return (k in st) ? st[k] : fallback;
  }
  function clearState() {
    localStorage.removeItem(STATE_KEY);
  }

  // ---------- Limpa tudo ----------
  function clearAll() {
    clearRespostas();
    clearPerfil();
    clearState();
  }

  // API nova
  window.JSTATE = {
    // respostas
    loadRespostas, saveRespostas, setRespostaAt, pushResposta, clearRespostas,
    // perfil
    loadPerfil, savePerfil, updatePerfil, clearPerfil,
    // state genérico
    loadState, saveState, setStateKey, getStateKey, clearState,
    // geral
    clearAll,
    // chaves
    RESP_KEY, PERFIL_KEY, STATE_KEY
  };

  // ===== Shim de compatibilidade =====
  // Mantém o main.js antigo funcionando (usa chaves: 'respostas', 'perfil', e genéricas).
  window.ST = {
    // ST.load()  -> { respostas, perfil, ...stateGen }
    load() {
      return {
        respostas: loadRespostas(),
        perfil: loadPerfil(),
        ...loadState()
      };
    },
    // ST.save(obj) -> mescla no state genérico e atualiza respostas/perfil se vierem
    save(obj) {
      if (!obj || typeof obj !== 'object') return;
      if ('respostas' in obj) saveRespostas(obj.respostas);
      if ('perfil'    in obj) savePerfil(obj.perfil);

      const { respostas, perfil, ...rest } = obj;
      if (Object.keys(rest).length) {
        const st = loadState();
        saveState(Object.assign(st, rest));
      }
    },
    // ST.get('respostas'|'perfil'|<qualquer chave do state>) -> valor
    get(k, fallback) {
      if (k === 'respostas') return loadRespostas();
      if (k === 'perfil')    return loadPerfil();
      return getStateKey(k, fallback);
    },
    // ST.set('respostas'|'perfil'|<qualquer chave do state>, valor)
    set(k, v) {
      if (k === 'respostas') return saveRespostas(v);
      if (k === 'perfil')    return savePerfil(v);
      return setStateKey(k, v);
    },
    // ST.clearAll()
    clearAll
  };
})();
lback); }
  };
  const writeJSON = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // ---------- Estado: respostas ----------
  function loadRespostas() {
    return readJSON(RESP_KEY, '[]');
  }
  function saveRespostas(respostas) {
    writeJSON(RESP_KEY, Array.isArray(respostas) ? respostas : []);
  }
  function setRespostaAt(index, texto) {
    const arr = loadRespostas();
    arr[index] = texto;
    saveRespostas(arr);
  }
  function pushResposta(texto) {
    const arr = loadRespostas();
    arr.push(texto);
    saveRespostas(arr);
  }
  function clearRespostas() {
    localStorage.removeItem(RESP_KEY);
  }

  // ---------- Estado: perfil ----------
  function loadPerfil() {
    return readJSON(PERFIL_KEY, '{}');
  }
  function savePerfil(perfil) {
    writeJSON(PERFIL_KEY, perfil && typeof perfil === 'object' ? perfil : {});
  }
  function updatePerfil(patch) {
    const p = loadPerfil();
    Object.assign(p, patch || {});
    savePerfil(p);
  }
  function clearPerfil() {
    localStorage.removeItem(PERFIL_KEY);
  }

  // ---------- Geral ----------
  function clearAll() {
    clearRespostas();
    clearPerfil();
  }

  // Exponha uma API simples e clara para o restante do app
  window.JSTATE = {
    // respostas
    loadRespostas, saveRespostas, setRespostaAt, pushResposta, clearRespostas,
    // perfil
    loadPerfil, savePerfil, updatePerfil, clearPerfil,
    // geral
    clearAll,
    // chaves (se precisar em outro lugar)
    RESP_KEY, PERFIL_KEY
  };
})();
