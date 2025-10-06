// /assets/js/config.js — compat + módulos (v1.3)
// Mantém variáveis antigas e fornece window.APP_CONFIG, window.JORNADA_CFG e window.CONFIG.
// Inclui mapa de seções e aliases para máxima compatibilidade.

(function () {
  // >>> Ajuste AQUI se seu backend mudar <<<
  const DEFAULT_API_BASE     = "https://lumen-backend-api.onrender.com/api"; // com /api
  const DEFAULT_STORAGE_KEY  = "jornada_essencial_v1";
  const DEFAULT_PASS         = "IRMANDADE"; // Alinhado com jornada-auth.js

  function normalizeBase(u) { return String(u || "").replace(/\/+$/, ""); }

  const baseFromPage   = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || DEFAULT_API_BASE;
  const API_BASE_NORM  = normalizeBase(baseFromPage);           // ex.: https://.../api
  const API_URL_NO_API = API_BASE_NORM.replace(/\/api$/, "");   // ex.: https://... (sem /api)

  // Config geral da aplicação (mantém o que já existir e garante defaults)
  window.APP_CONFIG = Object.assign(
    {
      ENV: "prod",
      API_BASE: API_BASE_NORM,
      STORAGE_KEY: DEFAULT_STORAGE_KEY,
      PASS: DEFAULT_PASS
    },
    window.APP_CONFIG || {}
  );

  // Defaults da Jornada
  const JORNADA_DEFAULTS = {
    TOTAL_BLOCKS: 5,
    TOTAL_PERGUNTAS: 32,
    TYPING_HEADER: "Irmandade Conhecimento com Luz",
    TYPING_FOOTER: "Para além. E sempre!!",

    BLOCK_VIDEOS: [
      "/assets/img/A-Jornada-Conhecimento-com-Luz1-zip.mp4",
      "/assets/img/Bloco-2.mp4",
      "/assets/img/Bloco-3.mp4",
      "/assets/img/Bloco-4.mp4",
      "/assets/img/Bloco-5.mp4"
    ],

    API_PDF_URL: API_BASE_NORM + "/jornada/pdf",
    API_HQ_URL:  API_BASE_NORM + "/jornada/hq",

    ALLOWED_ORIGINS: [
      "https://irmandade-conhecimento-com-luz.onrender.com",
      "https://irmandade-conhecimento-com-luz-1.onrender.com",
      "http://localhost:3000"
    ],

    SECTIONS: {
      "01-HEADER": "topo, nav, logo",
      "02-CHAMA": "variações sm/md/lg",
      "03-PERGAMINHO": "vertical/horizontal (intro/perguntas/final)",
      "04-DATILOGRAFIA": "Respire…, Bem-vindo, Pergunta 1",
      "05-PERGUNTAS": "layout, textarea, placeholders",
      "06-NAVEGAÇÃO": "Voltar/Próxima + listeners",
      "07-VIDEOS": "vídeo homepage",
      "08-OLHO-MAGICO-E-SENHA": "input senha + eye toggle",
      "09-BARRA-PROGRESSO": "contador e %",
      "10-IDIOMAS": "switch pt/en",
      "11-FONTS": "fontes e @font-face",
      "12-PDF-E-HQ": "geração e download",
      "13-JORNADAS": "Amorosa, Vocacional",
      "14-ESTADO": "localStorage, índice, respostas",
      "15-EXTRAS": "apenas indispensável"
    },

    positiveWords: [/* ... palavras positivas ... */],
    negativeWords: [/* ... palavras negativas ... */]
  };

  window.JORNADA_CFG = Object.assign({}, JORNADA_DEFAULTS, window.JORNADA_CFG || {});

  // Aliases e globals de compatibilidade
  window.CONFIG = window.CONFIG || window.APP_CONFIG;
  window.API_URL = window.API_URL || API_URL_NO_API;
  window.TOKEN_VALIDATION_ENDPOINT = window.TOKEN_VALIDATION_ENDPOINT || "/validate-token";
  window.JOURNEY_START_ENDPOINT   = window.JOURNEY_START_ENDPOINT   || "/start-journey";
  window.JORNADA_API_BASE         = window.JORNADA_API_BASE         || API_BASE_NORM;
  window.JORNADA_ENDPOINT_PATH    = window.JORNADA_ENDPOINT_PATH    || "/jornada";

  // Para debug rápido em console
  window.__API_DEBUG__ = { API_BASE: API_BASE_NORM, API_URL_NO_API };
})();
