/* ============================================
   jornada-core.js  (IIFE – sem import/export)
   Config central + estado + helpers de API
   Expondo: window.JORNADA_CORE e window.APP_CONFIG
   ============================================ */
;(function () {
  const DEFAULT_APP = { API_BASE: "https://conhecimento-com-luz-api.onrender.com" };
  const APP = (typeof window !== "undefined" && window.APP_CONFIG) ? Object.assign({}, DEFAULT_APP, window.APP_CONFIG) : DEFAULT_APP;
  window.APP_CONFIG = APP;

  const U = window.JORNADA_UTILS || {};

  const STATE = {
    respostas: {},
  };

  function iniciarFluxo() {
    STATE.respostas = {};
  }

  function salvarRespostas(data) {
    if (data && typeof data === "object") {
      Object.assign(STATE.respostas, data);
    }
    U.saveLocal("jornada_respostas", STATE.respostas);
  }

  async function baixarArquivos(payload = {}) {
    return await window.JORNADA_DOWNLOAD(payload);
  }

  window.JORNADA_CORE = {
    iniciarFluxo,
    salvarRespostas,
    baixarArquivos,
    STATE,
  };

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
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
