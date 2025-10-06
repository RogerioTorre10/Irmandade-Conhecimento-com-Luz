/* ============================================
   jornada-core.js  (IIFE – sem import/export)
   Config central + estado + helpers de API
   Expondo: window.JORNADA_CORE e window.APP_CONFIG
   ============================================ */
;(function () {
  'use strict';

  // --- Normalização de base -----------------------
  const normalizeBase = (u) => String(u || '').replace(/\/+$/, '');
  const ensureApiSuffix = (u) =>
    normalizeBase(u).endsWith('/api') ? normalizeBase(u) : normalizeBase(u) + '/api';

  // --- APP_CONFIG unificado -----------------------
  const DEFAULT_APP = { API_BASE: 'https://conhecimento-com-luz-api.onrender.com/api' };
  const incoming = typeof window !== 'undefined' && window.APP_CONFIG ? window.APP_CONFIG : {};
  const APP = Object.assign({}, DEFAULT_APP, incoming);
  APP.API_BASE = ensureApiSuffix(APP.API_BASE);

  window.APP_CONFIG = APP;
  window.CONFIG = window.CONFIG || APP;

  // --- Utils (com fallback no-op) -----------------
  const U = window.JORNADA_UTILS || {
    saveLocal: () => {},
    loadLocal: () => ({}),
    clearLocal: () => {}
  };

  // --- Estado central -----------------------------
  const STATE = { respostas: {} };

  function iniciarFluxo() {
    STATE.respostas = {};
  }

  function salvarRespostas(data) {
    if (data && typeof data === 'object') {
      Object.assign(STATE.respostas, data);
    }
    try {
      U.saveLocal('jornada_respostas', STATE.respostas);
    } catch {}
  }

  async function baixarArquivos(payload = {}) {
    if (typeof window.JORNADA_DOWNLOAD !== 'function') {
      (window.toast || console.log)('[JORNADA] Download indisponível no momento.', 'warn');
      return;
    }
    return window.JORNADA_DOWNLOAD(payload);
  }

  // --- Exports ------------------------------------
  window.JORNADA_CORE = {
    iniciarFluxo,
    salvarRespostas,
    baixarArquivos,
    STATE
  };

  // --- UI helpers ---------------------------------
  window.JORNADA_UI = Object.assign(window.JORNADA_UI || {}, {
    setProgressoBlocos(blocoIdx0, totalBlocos) {
      const el = document.getElementById('badgeProgressoBlocos');
      if (!el || !totalBlocos) return;
      const pct = Math.round(((blocoIdx0 + 1) / totalBlocos) * 100);
      el.textContent = `${pct}% concluído`;
    },
    setProgressoPerguntas(percent) {
      const bar = document.getElementById('progressBar');
      if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent | 0))}%`;
    }
  });
})();
