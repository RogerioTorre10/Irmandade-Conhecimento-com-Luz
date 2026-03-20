(function () {
  'use strict';
  console.log('[BOOT] Iniciando micro-boot…');

 async function waitForCarregarEtapa(timeout = 10000) {
  console.log('[BOOT] Waiting for carregarEtapa...');
  const start = Date.now();

  while (typeof window.carregarEtapa !== 'function' && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (typeof window.carregarEtapa !== 'function') {
    console.error('[BOOT] carregarEtapa não disponível após timeout');
    return false;
  }

  console.log('[BOOT] carregarEtapa disponível');
  return true;
}

  let lastSection = null;
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
   console.log('[BOOT] JC disponível, iniciando...');

// BOOT = iniciador oficial
if (window.__JC_INITED__) {
  console.log('[BOOT] __JC_INITED__ já true, não chamando JC.init novamente');
} else {
  window.__JC_INITED__ = true;
  window.__JC_INIT_SOURCE__ = 'BOOT';

  if (typeof window.JC.init === 'function') {
    window.JC.init();
    console.log('[BOOT] JC.init executado pelo BOOT');
  }
}

window.JC.setOrder([
  'section-intro',
  'section-termos1',
  'section-termos2',
  'section-senha',
  'section-guia',
  'section-selfie',
  'section-card',
  'section-perguntas',
  'section-final'
]);


    console.log('[BOOT] Iniciando jornada com section-intro...');
    if (lastSection !== 'section-intro') {
      lastSection = 'section-intro';
      window.JC.show('section-intro');
    }
  }

  try {
    init();
  } catch (err) {
    console.error('[BOOT] Error during initialization:', err);
  }
})();
