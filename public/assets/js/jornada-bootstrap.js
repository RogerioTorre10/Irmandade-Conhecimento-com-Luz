(function () {
  'use strict';

  console.log('[BOOT] Iniciando micro-boot…');

  async function waitForJC(timeout = 10000) {
    const start = Date.now();
    while (!window.JC && Date.now() - start < timeout) {
      console.log('[BOOT] Aguardando JC... Tempo decorrido:', Date.now() - start, 'ms');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!window.JC) {
      console.error('[BOOT] Desisti: JC não disponível a tempo após', timeout, 'ms');
      throw new Error('JC not available');
    }
    console.log('[BOOT] JC disponível, iniciando...');
    return window.JC;
  }

  async function startBootstrap() {
    console.log('[BOOT] Iniciando sequência de inicialização...');
    
    // Aguarda i18n
    if (window.loadI18n) {
      try {
        await window.loadI18n('pt-BR');
        console.log('[BOOT] i18n pronto');
      } catch (e) {
        console.warn('[BOOT] Falha ao carregar i18n:', e);
      }
    }

    // Aguarda JC
    let JC;
    try {
      JC = await waitForJC();
    } catch (e) {
      console.error('[BOOT] Falha ao aguardar JC:', e);
      return;
    }

    // Define ordem das seções
    const order = [
      'section-intro',
      'section-termos',
      'section-senha',
      'section-filme-jardim',
      'section-guia',
      'section-filme-jardim',
      'section-selfie',
      'section-filme-ao-encontro',
      'section-perguntas',
      'section-filme-jardim',
      'section-final'
    ];
    JC.setOrder(order);

    // Inicia a jornada
    try {
      await JC.show('section-intro');
      console.log('[BOOT] bootstrapComplete recebido. Chamando startJourney...');
      if (window.JSecoes?.startJourney) {
        window.JSecoes.startJourney('section-intro');
      }
    } catch (e) {
      console.error('[BOOT] Falha ao iniciar a jornada:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBootstrap, { once: true });
  } else {
    startBootstrap();
  }
})();
