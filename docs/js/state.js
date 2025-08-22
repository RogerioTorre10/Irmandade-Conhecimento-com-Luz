(function () {
  // Chaves usadas pelo frontend/api.js
  const RESP_KEY   = 'jornada_respostas';
  const PERFIL_KEY = 'jornada_perfil';

  // ---------- Utils de (de)serialização ----------
  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch { return JSON.parse(fallback); }
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
