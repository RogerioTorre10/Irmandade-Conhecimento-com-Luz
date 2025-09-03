// /assets/js/config.js — compat + módulos (v1.2)
// Mantém variáveis antigas e fornece window.APP_CONFIG e window.JORNADA_CFG,
// agora com o MAPA DE SEÇÕES padronizado.

// ===== [00-CONFIG] núcleo =====
(function () {
  // >>> Ajuste AQUI se seu backend mudar <<<
  const DEFAULT_API_BASE   = "https://lumen-backend-api.onrender.com/api"; // com /api
  const DEFAULT_STORAGE_KEY = "jornada_essencial_v1";
  const DEFAULT_PASS        = "iniciar";

  function normalizeBase(u) { return String(u || "").replace(/\/+$/, ""); }

  // Preferir valor já definido na página; senão usar o default
  const baseFromPage  = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || DEFAULT_API_BASE;
  const API_BASE_NORM = normalizeBase(baseFromPage);          // ex.: https://.../api
  const API_URL_NO_API = API_BASE_NORM.replace(/\/api$/, ""); // ex.: https://... (sem /api)

  // ===== [00-CONFIG] APP_CONFIG (merge não destrutivo)
  window.APP_CONFIG = Object.assign(
    {
      ENV: "prod",
      API_BASE: API_BASE_NORM,          // módulos usam com /api
      STORAGE_KEY: DEFAULT_STORAGE_KEY, // localStorage
      PASS: DEFAULT_PASS                // senha da jornada
    },
    window.APP_CONFIG || {}
  );

  // ===== [00-CONFIG] JORNADA_CFG (dados funcionais da jornada)
  const JORNADA_DEFAULTS = {
    TOTAL_BLOCKS: 5,
    TOTAL_PERGUNTAS: 32,
    TYPING_HEADER: "Irmandade Conhecimento com Luz",
    TYPING_FOOTER: "Para além. E sempre!!",

    // ===== [07-VIDEOS] vídeos por bloco
    BLOCK_VIDEOS: [
      "/assets/img/A-Jornada-Conhecimento-com-Luz1-zip.mp4",
      "/assets/img/Bloco-2.mp4",
      "/assets/img/Bloco-3.mp4",
      "/assets/img/Bloco-4.mp4",
      "/assets/img/Bloco-5.mp4"
    ],

    // ===== [12-PDF E HQ] endpoints (pode manter placeholders)
    API_PDF_URL: (API_BASE_NORM + "/jornada/pdf"),
    API_HQ_URL:  (API_BASE_NORM + "/jornada/hq"),

    // CORS (frentes autorizadas)
    ALLOWED_ORIGINS: [
      "https://irmandade-conhecimento-com-luz.onrender.com",
      "https://irmandade-conhecimento-com-luz-1.onrender.com",
      "http://localhost:3000"
    ],

    // ===== [MAPA-DE-SECOES] — para padronizar em todos os arquivos
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
      "08-ESTADO": "localStorage, índice, respostas", // mantido para compat
      "09-EXTRAS": "apenas indispensável"
    }
  };

  // Merge não destrutivo com possíveis overrides existentes
  window.JORNADA_CFG = Object.assign({}, JORNADA_DEFAULTS, window.JORNADA_CFG || {});

  // ===== [LEGADO] variáveis antigas (compat)
  // Base SEM /api para código antigo que espera raiz do host
  window.API_URL = window.API_URL || API_URL_NO_API;

  // Endpoints antigos (ajuste se o backend usar outros caminhos)
  window.TOKEN_VALIDATION_ENDPOINT =
    window.TOKEN_VALIDATION_ENDPOINT || "/validate-token";
  window.JOURNEY_START_ENDPOINT =
    window.JOURNEY_START_ENDPOINT || "/start-journey";

  // Nomes dedicados à Jornada (usados por trechos antigos)
  window.JORNADA_API_BASE   = window.JORNADA_API_BASE   || API_BASE_NORM; // pode ficar com /api
  window.JORNADA_ENDPOINT_PATH = window.JORNADA_ENDPOINT_PATH || "/jornada";

  // Debug opcional
  window.__API_DEBUG__ = { API_BASE: API_BASE_NORM, API_URL_NO_API };
})();
