(function () {
  'use strict';

  console.log('[BOOT] Iniciando micro-boot…');

  async function waitForCarregarEtapa(timeout = 10000) {
    console.log('[BOOT] Waiting for carregarEtapa...');
    const start = Date.now();

    while (
      typeof window.carregarEtapa !== 'function' &&
      Date.now() - start < timeout
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (typeof window.carregarEtapa !== 'function') {
      console.error('[BOOT] carregarEtapa não disponível após timeout');
      return false;
    }

    console.log('[BOOT] carregarEtapa disponível');
    return true;
  }

  async function waitForJC(timeout = 10000) {
    console.log('[BOOT] Waiting for JC...');
    const start = Date.now();

    while (
      (!window.JC || typeof window.JC.init !== 'function') &&
      Date.now() - start < timeout
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!window.JC || typeof window.JC.init !== 'function') {
      console.error('[BOOT] JC não disponível após timeout');
      return false;
    }

    console.log('[BOOT] JC disponível');
    return true;
  }

  async function init() {
    console.log('[BOOT] Iniciando sequência de inicialização...');

    console.log('[BOOT] Waiting for i18n...');
    while (!window.i18n) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('[BOOT] i18n pronto');

    const loaderReady = await waitForCarregarEtapa();
    if (!loaderReady) {
      console.error('[BOOT] Abortando: loader não disponível');
      return;
    }

    const jcAvailable = await waitForJC();
    if (!jcAvailable) {
      console.error('[BOOT] Abortando: JC não disponível');
      return;
    }

    console.log('[BOOT] JC disponível, configurando ordem...');

    // A ordem precisa existir ANTES do JC.init(), pois o controller
    // a utiliza para comparar o checkpoint local/remoto na retomada.
    window.JC.setOrder([
      'section-intro',
      'section-termos1',
      'section-termos2',
      'section-senha',
      'section-guia',
      'section-selfie',
      'section-card',
      'section-dados-pessoais',
      'section-perguntas-raizes',
      'section-perguntas-reflexoes',
      'section-perguntas-crescimento',
      'section-perguntas-integracao',
      'section-perguntas-sintese',
      'section-final'
    ]);

    console.log('[BOOT] Ordem das sections configurada.');

    // O JC.init() decide sozinho se a Jornada:
    // - começa na intro;
    // - retoma seção local;
    // - retoma seção remota;
    // - exige reautenticação.
    //
    // O Bootstrap NÃO força mais section-intro.
    if (window.__JC_INITED__) {
      console.log(
        '[BOOT] __JC_INITED__ já true, não chamando JC.init novamente'
      );
    } else {
      window.__JC_INITED__ = true;
      window.__JC_INIT_SOURCE__ = 'BOOT';

      if (typeof window.JC.init === 'function') {
        await window.JC.init();
        console.log('[BOOT] JC.init concluído pelo BOOT');
      }
    }

    console.log(
      '[BOOT] Inicialização concluída. Controller responsável pela seção inicial/retomada.'
    );
  }

  init().catch(err => {
    console.error('[BOOT] Error during initialization:', err);
  });

})();
