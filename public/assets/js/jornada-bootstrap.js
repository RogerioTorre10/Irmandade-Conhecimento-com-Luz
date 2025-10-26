(function () {
  'use strict';

  console.log('[BOOT] Iniciando micro-boot…');

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

    const jcAvailable = await waitForJC();
    if (!jcAvailable) {
      console.error('[BOOT] Aborting: JC not available');
      return;
    }

    if (window.JC?.currentSection !== 'section-intro') {
      console.log('[BOOT] Iniciando jornada com section-intro...');
      window.JC.show('section-intro');
    }
  }

  try {
    init();
  } catch (err) {
    console.error('[BOOT] Error during initialization:', err);
  }
})();
