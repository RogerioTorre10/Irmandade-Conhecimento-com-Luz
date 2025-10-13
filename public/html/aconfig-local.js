/* /assets/js/config.local.js */
;(function () {
  // Base local (ex.: backend em http://localhost:3000)
  const API_HOST = location.hostname || 'localhost';
  const API_BASE = `http://${API_HOST}:3000`;
  const REST     = `${API_BASE}/api`;

  // APP global
  window.APP_CONFIG = Object.assign({}, window.APP_CONFIG, {
    ENV: 'dev',
    API_BASE: REST,
  });

  // Jornada (estado + ids de canvas/conteúdo + senha de teste)
  window.JORNADA_CFG = Object.assign({
    STORAGE_KEY: 'jornada_local_state_v1',
    PASSWORD: 'iniciar',              // senha padrão de teste
    API_BASE: REST,
    CANVAS_ID: 'jornada-canvas',
    CONTENT_ID: 'jornada-conteudo',
  }, window.JORNADA_CFG || {});

  // Compat com scripts antigos (journey.js)
  window.API_URL                   = REST;
  window.TOKEN_VALIDATION_ENDPOINT = '/validate-token';
  window.JOURNEY_START_ENDPOINT    = '/start-journey';

  // Config dos guias (usa backends locais; ajuste se precisar)
  window.guiaConfigs = Object.assign({
    lumen: { apiUrlBase: `${API_BASE}/lumen`,  model: 'gpt-5',  voice: 'female' },
    zion:  { apiUrlBase: `${API_BASE}/zion`,   model: 'grok',   voice: 'male'   },
    arian: { apiUrlBase: `${API_BASE}/arian`,  model: 'gemini', voice: 'female' }
  }, window.guiaConfigs || {});

  // Toggles suaves (datilografia/voz)
  window.JORNADA = Object.assign({
    fullTypingMode: true,
    typing: { charDelay: 18, caret: false },
    tts: { enabled: true, lang: 'pt-BR', rate: 1.06, pitch: 1.0, voiceName: '', readingMode: 'after' }
  }, window.JORNADA || {});

  // Se o módulo API já existir, força PRIMARY/FALLBACK pro local
  (function syncApi(i = 0) {
    if (i > 50) return; // ~6s máx
    if (window.API && typeof window.API === 'object') {
      try {
        window.API.API_PRIMARY  = REST;
        window.API.API_FALLBACK = REST;
        console.log('[config.local] API_PRIMARY/FALLBACK fixados em', REST);
      } catch {}
      return;
    }
    setTimeout(() => syncApi(i + 1), 120);
  })();

  try { console.log('[config.local] ENV=dev · API_BASE=', REST); } catch {}
})();
