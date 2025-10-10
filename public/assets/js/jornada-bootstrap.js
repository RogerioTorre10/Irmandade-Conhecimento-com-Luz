(function () {
  'use strict';

  console.log('[BOOT] Iniciando micro-boot…');

  async function waitForJC(timeout = 15000) {
    const start = Date.now();
    while (!window.JC || typeof window.JC.setOrder !== 'function') {
      console.log('[BOOT] Aguardando JC e JC.setOrder... Tempo decorrido:', Date.now() - start, 'ms');
      if (Date.now() - start >= timeout) {
        console.error('[BOOT] Desisti: JC ou JC.setOrder não disponível a tempo após', timeout, 'ms');
        throw new Error('JC or JC.setOrder not available');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('[BOOT] JC e JC.setOrder disponíveis, iniciando...');
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
      // Fallback: tenta reiniciar a inicialização
      console.log('[BOOT] Tentando reiniciar inicialização do controlador...');
      if (window.JC && typeof window.JC.init === 'function') {
        await window.JC.init();
        JC = window.JC;
      } else {
        console.error('[BOOT] Fallback falhou: JC não disponível');
        return;
      }
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
    try {
      JC.setOrder(order);
    } catch (e) {
      console.error('[BOOT] Falha ao definir ordem das seções:', e);
      return;
    }

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
