(function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapReady = true;

  console.log('[BOOT] Iniciando (function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapReady = true;

  console.log('[BOOT] Iniciando micro-boot…');

  async function waitForConfig() {
    let tries = 0;
    while (!global.APP_CONFIG && tries < 30) {
      console.warn('[BOOT] APP_CONFIG não encontrado, aguardando…');
      await new Promise(resolve => setTimeout(resolve, 100));
      tries++;
    }
  }

  async function waitForI18n() {
    if (global.i18n) {
      try {
        await global.i18n.waitForReady(5000);
        console.log('[BOOT] i18n pronto');
      } catch (e) {
        console.warn('[BOOT] i18n falhou ao ficar pronto');
      }
    } else {
      console.warn('[BOOT] i18n não encontrado, prosseguindo sem esperar');
    }
  }

  async function waitForJC() {
    let tries = 0;
    while (!(global.JC && typeof global.JC.init === 'function') && tries < 60) {
      await new Promise(resolve => setTimeout(resolve, 100));
      tries++;
    }
    if (global.JC && typeof global.JC.init === 'function') {
      console.log('[BOOT] JC disponível, iniciando...');
      try {
        global.JC.init(); // APENAS INICIALIZAÇÃO
        document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      } catch (e) {
        console.error('[BOOT] falha no JC.init()', e);
      }
    } else {
      console.error('[BOOT] Desisti: JC não disponível a tempo');
      window.toast?.('Falha ao iniciar a Jornada (JC não disponível).');
    }
  }
  
  async function startBootstrap() {
    try {
      await waitForConfig();
      await waitForI18n();
      await waitForJC();
    } catch (e) {
      console.error('[BOOT] Erro geral no bootstrap:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBootstrap, { once: true });
  } else {
    startBootstrap();
  }

  // CHAVE DA SINCRONIZAÇÃO: Carrega e só depois exibe
  document.addEventListener('bootstrapComplete', () => {
  console.log('[BOOT] bootstrapComplete recebido. Carregando etapa inicial...');
  if (window.carregarEtapa) {
    // 1. Carrega o HTML da 'intro'
    carregarEtapa('intro', () => {
      console.log('[BOOT] Etapa inicial carregada. Verificando #section-intro...');
      // 2. Verifica se o elemento #section-intro existe no DOM
      const sectionIntro = document.getElementById('section-intro');
      if (sectionIntro) {
        console.log('[BOOT] Elemento #section-intro encontrado. Exibindo...');
        window.JC?.show('section-intro');
      } else {
        console.error('[BOOT] Elemento #section-intro não encontrado após carregarEtapa.');
        console.log('[BOOT] Estado do DOM:', document.body.innerHTML);
        // Opcional: Tenta chamar JC.show com force para acionar o fallback
        window.JC?.show('section-intro', { force: true });
      }
    });
  } else {
    console.error('[BOOT] A função carregarEtapa não foi encontrada.');
    // Tenta exibir section-intro mesmo assim, usando o fallback
    window.JC?.show('section-intro', { force: true });
  }
});
})(window);micro-boot…');

  // ====== HELPERS ======
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function waitForEl(selector, { within = document, timeout = 8000, step = 100 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        const el = within.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) {
          return reject(new Error(`[BOOT] Timeout aguardando ${selector}`));
        }
        setTimeout(tick, step);
      };
      tick();
    });
  }

  async function waitForConfig() {
    let tries = 0;
    while (!global.APP_CONFIG && tries < 30) {
      console.warn('[BOOT] APP_CONFIG não encontrado, aguardando…');
      await sleep(100);
      tries++;
    }
  }

  async function waitForI18n() {
    if (global.i18n && typeof global.i18n.waitForReady === 'function') {
      try {
        await global.i18n.waitForReady(5000);
        console.log('[BOOT] i18n pronto');
      } catch (e) {
        console.warn('[BOOT] i18n falhou ao ficar pronto', e);
      }
    } else {
      console.warn('[BOOT] i18n não encontrado, prosseguindo sem esperar');
    }
  }

  async function waitForJC() {
    let tries = 0;
    while (!(global.JC && typeof global.JC.init === 'function') && tries < 60) {
      await sleep(100);
      tries++;
    }
    if (global.JC && typeof global.JC.init === 'function') {
      console.log('[BOOT] JC disponível, iniciando...');
      try {
        global.JC.init(); // apenas inicialização
        document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      } catch (e) {
        console.error('[BOOT] falha no JC.init()', e);
      }
    } else {
      console.error('[BOOT] Desisti: JC não disponível a tempo');
      global.toast?.('Falha ao iniciar a Jornada (JC não disponível).');
    }
  }

  // ====== CARREGAMENTO DA ETAPA INICIAL ======
  async function loadInitialSection() {
    console.log('[BOOT] bootstrapComplete recebido. Carregando etapa inicial...');

    if (typeof global.carregarEtapa !== 'function') {
      console.error('[BOOT] A função carregarEtapa não foi encontrada.');
      // último recurso: tentar exibir mesmo assim
      if (global.JC?.show) JC.show('section-intro'); else global.showSection?.('section-intro');
      return;
    }

    // Suporta carregarEtapa que retorna Promise OU que aceita callback
    try {
      const maybe = global.carregarEtapa('intro');
      if (maybe && typeof maybe.then === 'function') {
        // Promise-based
        await maybe;
      } else {
        // Callback-based (2º arg é callback)
        await new Promise((resolve) => {
          try {
            global.carregarEtapa('intro', resolve);
            // guarda-chuva: se o callback não for chamado, resolve assim mesmo
            setTimeout(resolve, 1500);
          } catch (e) {
            console.warn('[BOOT] carregarEtapa callback-mode falhou, seguindo', e);
            resolve();
          }
        });
      }
      console.log('[BOOT] Etapa inicial carregada. Verificando #section-intro...');
    } catch (e) {
      console.error('[BOOT] Falha ao carregar section-intro:', e);
    }

    // Aguarda a section aparecer no DOM (criada pelo loader)
    let sectionIntro = null;
    try {
      sectionIntro = await waitForEl('#section-intro', { timeout: 5000 });
      console.log('[BOOT] Elemento #section-intro encontrado. Exibindo...');
    } catch (e) {
      console.warn('[BOOT] #section-intro não apareceu a tempo. Tentando fallback de exibição.', e);
    }

    // Exibe (com ou sem section encontrada — alguns renderizadores mostram mesmo assim)
    try {
      if (global.JC?.show) {
        JC.show('section-intro');
      } else if (global.showSection) {
        showSection('section-intro');
      } else if (sectionIntro) {
        sectionIntro.classList.remove('hidden');
      } else {
        console.warn('[BOOT] Sem mecanismo de exibição disponível.');
      }
    } catch (e) {
      console.error('[BOOT] Erro ao exibir section-intro:', e);
    }
  }

  // ====== ORDEM DO BOOT ======
  async function startBootstrap() {
    try {
      await waitForConfig();
      await waitForI18n();
      await waitForJC();
    } catch (e) {
      console.error('[BOOT] Erro geral no bootstrap:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBootstrap, { once: true });
  } else {
    startBootstrap();
  }

  // Chave da sincronização: carrega e só depois exibe
  document.removeEventListener('bootstrapComplete', loadInitialSection);
  document.addEventListener('bootstrapComplete', loadInitialSection, { once: true });

})(window);
