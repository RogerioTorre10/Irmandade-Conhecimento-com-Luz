(function (global) {
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
})(window);
