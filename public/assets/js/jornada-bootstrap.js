(function () {
  'use strict';

  console.log('[BOOT] Iniciando micro-boot…');

  // Função para esperar JC estar disponível
  async function waitForJC(timeout = 10000) {
    console.log('[BOOT] Waiting for JC...');
    const start = Date.now();
    while (!window.JC && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!window.JC) {
      console.error('[BOOT] JC not available after timeout');
      return false;
    }
    console.log('[BOOT] JC available');
    return true;
  }

  // Função principal de inicialização
  async function init() {
    console.log('[BOOT] Iniciando sequência de inicialização...');

    // Espera pelo i18n
    console.log('[BOOT] Waiting for i18n...');
    while (!window.i18n) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('[BOOT] i18n pronto');

    // Espera pelo JC
    const jcAvailable = await waitForJC();
    if (!jcAvailable) {
      console.error('[BOOT] Aborting: JC not available');
      return;
    }

    console.log('[BOOT] JC disponível, iniciando...');
    window.JC.setOrder([
      'section-intro',
    'section-filme1',
    'section-termos1',
    'section-termos2',
    'section-filme2',
    'section-senha',
    'section-filme3',
    'section-guia',
    'section-filme4',
    'section-selfie',
    'section-filme5',
    'section-perguntas',
    'section-filme6',
    'section-final'
    ]);

    // Inicia a jornada
    console.log('[BOOT] Iniciando jornada com section-intro...');
    window.JC.show('section-intro');
  }

  // Executa a inicialização
  try {
    init();
  } catch (err) {
    console.error('[BOOT] Error during initialization:', err);
  }
})();
