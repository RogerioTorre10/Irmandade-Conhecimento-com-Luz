// /public/assets/js/config.js — compat + módulos (v1.0)
// Mantém variáveis antigas e fornece window.APP_CONFIG para os módulos novos.

(function () {
  // >>> Ajuste AQUI se seu backend mudar <<<
  const DEFAULT_API_BASE = "https://lumen-backend-api.onrender.com/api"; // com /api
  const DEFAULT_STORAGE_KEY = "jornada_essencial_v1";
  const DEFAULT_PASS = "iniciar";

  // Normaliza removendo "/" do final
  function normalizeBase(u) {
    return String(u || "").replace(/\/+$/, "");
  }

  // Preferir valor já definido na página; senão usar o default
  const baseFromPage =
    (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || DEFAULT_API_BASE;

  const API_BASE_NORM = normalizeBase(baseFromPage); // ex.: https://.../api
  const API_URL_NO_API = API_BASE_NORM.replace(/\/api$/, ""); // ex.: https://... (sem /api)

  // ===== NOVO: objeto central para os módulos =====
  window.APP_CONFIG = Object.assign(
    {
      ENV: "prod",
      API_BASE: API_BASE_NORM,          // usado pelos módulos; fallback com/sem /api é feito no código
      STORAGE_KEY: DEFAULT_STORAGE_KEY, // chave do localStorage
      PASS: DEFAULT_PASS,               // senha da jornada
    },
    window.APP_CONFIG || {}
  );

  // ===== LEGADO: manter variáveis antigas vivas =====
  // Base SEM /api para código antigo que espera raiz do host
  window.API_URL = window.API_URL || API_URL_NO_API;

  // Endpoints antigos (ajuste se seu backend usar outros caminhos)
  window.TOKEN_VALIDATION_ENDPOINT =
    window.TOKEN_VALIDATION_ENDPOINT || "/validate-token";
  window.JOURNEY_START_ENDPOINT =
    window.JOURNEY_START_ENDPOINT || "/start-journey";

  // Nomes dedicados à Jornada (usados por trechos antigos)
  window.JORNADA_API_BASE = window.JORNADA_API_BASE || API_BASE_NORM; // pode ficar com /api
  window.JORNADA_ENDPOINT_PATH =
    window.JORNADA_ENDPOINT_PATH || "/jornada"; // módulos chamam /jornada/pdf e /jornada/hq

  // (Opcional) expõe bases úteis para debug
  window.__API_DEBUG__ = {
    API_BASE: API_BASE_NORM,
    API_URL_NO_API
  };
  
    // ===== ALIAS LEGADO: para scripts que ainda leem JORNADA_CFG =====
  window.JORNADA_CFG = Object.assign(
    {
      STORAGE_KEY: window.APP_CONFIG.STORAGE_KEY,
      ESSENCIAL: true,                   // <- chave que o bootstrap verifica
      API_BASE: window.APP_CONFIG.API_BASE
    },
    window.JORNADA_CFG || {}
  );  
})();
