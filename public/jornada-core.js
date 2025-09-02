/* ============================================
   jornada-core.js  (IIFE – sem import/export)
   Config central + estado + helpers de API
   Expondo: window.JORNADA_CORE e window.APP_CONFIG
   ============================================ */
;(function () {
  // Config global (pode ser sobrescrita antes de carregar os scripts)
  // Ex.: window.APP_CONFIG = { API_BASE: "https://..." } no <head>
  const DEFAULT_APP = { API_BASE: "https://conhecimento-com-luz-api.onrender.com" };
  const APP = (typeof window !== "undefined" && window.APP_CONFIG) ? Object.assign({}, DEFAULT_APP, window.APP_CONFIG) : DEFAULT_APP;
  window.APP_CONFIG = APP; // garante disponível para outros módulos

  const U = window.JORNADA_UTILS || {};

  // ----------------- Estado simples -----------------
  const STATE = {
    respostas: {},
  };

  function iniciarFluxo() {
    // sua lógica de início (reset, logs, etc.)
    STATE.respostas = {};
  }

  function salvarRespostas(data) {
    // mescla e persiste
    if (data && typeof data === "object") {
      Object.assign(STATE.respostas, data);
    }
    U.saveLocal("jornada_respostas", STATE.respostas);
  }

  async function baixarArquivos(payload = {}) {
    // exemplo de POST para gerar PDF/HQ – ajuste a rota conforme seu backend
    // return await U.apiPost("/gerar", payload);
    return true; // placeholder
  }

  // ----------------- Exporta no namespace -----------
  window.JORNADA_CORE = {
    iniciarFluxo,
    salvarRespostas,
    baixarArquivos,
    STATE,
  };
})();

// --- Progresso Unificado ---
window.JORNADA_UI = Object.assign(window.JORNADA_UI || {}, {
  setProgressoBlocos(blocoIdx0, totalBlocos) {
    const el = document.getElementById('badgeProgressoBlocos');
    if (!el || !totalBlocos) return;
    const pct = Math.round(((blocoIdx0 + 1) / totalBlocos) * 100);
    el.textContent = `${pct}% concluído`;
  },
  setProgressoPerguntas(percent) {
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent|0))}%`;
  }
});

