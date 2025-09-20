/* =========================================================
   jornada-bootstrap.js
   Inicialização da jornada com tolerância a erros e espera por dependências
   ========================================================= */
;(function () {
  'use strict';
  console.log('[BOOT] Iniciando micro-boot...');

  // Lista de scripts carregados
  const scripts = [
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/assets/js/toast-safe.js' },
    { defer: false, src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js' },
    { defer: false, src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js' },
    { defer: false, src: '(inline)' },
    { defer: false, src: '(inline)' },
    { defer: false, src: '(inline)' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/config.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-utils.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-core.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-auth.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-chama.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-paper-qa.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-typing.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/assets/js/jornada-typing-bridge.js?v=1' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-controller.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-render.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-bootstrap.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-micro.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/i18n/i18n.js?v=5' },
    { defer: true, src: 'https://irmandade-conhecimento-com-luz.onrender.com/api.js?v=5' },
    { defer: false, src: '(inline)' }
  ];
  console.log('[BOOT] scripts carregados (ordem):', scripts);

  // Sondagem de módulos
  const must = ['CONFIG', 'JUtils', 'JCore', 'JAuth', 'JChama', 'JPaperQA', 'JTyping', 'JController', 'JRender', 'JBootstrap', 'JMicro', 'I18N', 'API'];
  const missing = must.filter(k => !(k in window));
  if (missing.length) console.warn('[BOOT] Módulos ausentes:', missing);

  // Definição segura de API_BASE
  const PRIMARY_DEFAULT = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'https://conhecimento-com-luz-api.onrender.com';
  const API = window.API || {};
  const API_PRIMARY = API.API_PRIMARY || PRIMARY_DEFAULT;
  const API_FALLBACK = API.API_FALLBACK || API_PRIMARY;

  async function chooseBase() {
    if (typeof API.health === 'function') {
      try {
        const ok = await API.health();
        window.API_BASE = ok ? API_PRIMARY : API_FALLBACK;
      } catch {
        console.warn('[BOOT] Health falhou, usando FALLBACK');
        window.API_BASE = API_FALLBACK;
      }
    } else {
      window.API_BASE = API_PRIMARY;
    }
    console.log('[BOOT] API_BASE =', window.API_BASE);
  }

  // Função de inicialização
  async function boot() {
    console.log('[BOOT] tentando iniciar • rota:', location.hash || 'intro');
    const route = (location.hash || '#intro').slice(1);
    if (!window.JORNADA_RENDER || !window.JC || !window.JC._state) {
      console.warn('[BOOT] JORNADA_RENDER, JC ou estado não disponível ainda. Aguardando...');
      return;
    }
    try {
      if (route === 'intro') {
        console.log('[BOOT] → renderIntro()');
        window.JORNADA_RENDER.renderIntro();
      } else {
        window.JORNADA_RENDER.render(route);
      }
      await window.JC.init();
      console.log('[BOOT] inicialização concluída.');
    } catch (e) {
      console.error('[BOOT] Erro ao iniciar:', e);
    }
  }

  // Espera dependências com timeout maior
  function startWhenReady() {
    let tries = 0;
    const maxTries = 50; // Aumentado para 5 segundos (50 * 100ms)
    const interval = setInterval(async () => {
      tries++;
      console.log('[BOOT] Tentativa', tries, 'de', maxTries);
      if (window.JORNADA_RENDER && window.JC && window.JC._state) {
        clearInterval(interval);
        await boot();
      } else if (tries >= maxTries) {
        clearInterval(interval);
        console.error('[BOOT] desisti de iniciar: JORNADA_RENDER ou JC não ficou disponível a tempo.');
      }
    }, 100);
  }

  // Iniciar após escolher API_BASE
  chooseBase().finally(() => {
    console.log('[BOOT] API_BASE escolhido, iniciando startWhenReady...');
    startWhenReady();
  });

  // Reexecuta boot no load
  window.addEventListener('load', () => {
    console.log('[BOOT] Inicialização final no load...');
    boot();
  });
})();;
