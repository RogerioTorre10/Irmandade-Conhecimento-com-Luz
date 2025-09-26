/* /public/assets/js/jornada-bootstrap.js */
(function () {
  'use strict';
  const log = (...args) => console.log('[BOOT]', ...args);
  let retryCount = 0;
  const MAX_RETRIES = 50;

  function startWhenReady(route = 'intro') {
    retryCount++;
    log(`Tentativa ${retryCount} de ${MAX_RETRIES} • rota: ${route}`);
    if (retryCount > MAX_RETRIES) {
      console.error('[BOOT] Máximo de tentativas excedido. Inicialização falhou.');
      return Promise.reject('Inicialização falhou: máximo de tentativas excedido');
    }

    // Verificar dependências
    const dependencies = {
      i18n: !!(window.i18n && window.i18n.ready),
      JC: !!(window.JC && window.JC.init),
      JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
      JORNADA_VIDEOS: !!window.JORNADA_VIDEOS,
      showSection: !!window.showSection,
      runTyping: !!window.runTyping,
      playTransition: !!window.playTransition
    };
    log('Dependências:', dependencies);

    if (dependencies.i18n && dependencies.JC && dependencies.JORNADA_BLOCKS && dependencies.JORNADA_VIDEOS && dependencies.showSection && dependencies.runTyping && dependencies.playTransition) {
      window.JC.init(route);
      log('Inicialização concluída com sucesso');
      return Promise.resolve();
    } else {
      // Fallback temporário se JC não estiver definido
      if (!window.JC) {
        log('JC não definido, inicializando fallback');
        window.JC = {
          nextSection: null,
          currentBloco: 0,
          goNext: () => {
            log('goNext (fallback) chamado');
            const sections = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-selfie', 'section-perguntas', 'section-final'];
            const current = window.__currentSectionId || 'section-intro';
            const idx = sections.indexOf(current);
            const next = window.JC.nextSection || sections[idx + 1];
            if (next) {
              window.JC.nextSection = null;
              window.showSection && window.showSection(next);
              log(`Navegando de ${current} para ${next}`);
            }
          },
          init: (route) => {
            log('Inicializando JC fallback');
            window.__currentSectionId = route === 'intro' ? 'section-intro' : route;
            window.showSection && window.showSection(window.__currentSectionId);
            log('Seção inicial:', window.__currentSectionId);
          }
        };
        window.JC.init(route);
        log('Inicialização concluída com fallback');
        return Promise.resolve();
      }
      log('Dependências não prontas, retry em 100ms');
      return new Promise((resolve, reject) => {
        setTimeout(() => startWhenReady(route).then(resolve).catch(reject), 100);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    log('Iniciando bootstrap');
    startWhenReady('intro').catch(err => console.error('[BOOT] Erro na inicialização:', err));
  });
})();
