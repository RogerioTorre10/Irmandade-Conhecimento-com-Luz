// jornada-bootstrap.js
(function() {
  const log = (...args) => console.log('[BOOT]', ...args);
  const MAX_ATTEMPTS = 200;
  let attempts = 0;

  function startWhenReady(route = 'intro') {
    log(`Tentando iniciar • rota: ${route}`);
    attempts++;

    if (window.JC && typeof window.JC.init === 'function' && window.JORNADA_BLOCKS) {
      log('JC.init concluído');
      window.JC.init(route);
      log('Inicialização concluída com sucesso');
      return Promise.resolve();
    } else if (attempts < MAX_ATTEMPTS) {
      log(`Tentativa ${attempts} de ${MAX_ATTEMPTS}`);
      return new Promise(resolve => setTimeout(() => resolve(startWhenReady(route)), 50));
    } else {
      log(`JC ou JORNADA_BLOCKS não disponível após ${MAX_ATTEMPTS} tentativas`);
      window.JC = window.JC || {
        init: (r) => {
          log('JC.init (fallback) aplicado');
          window.showSection && window.showSection(r === 'intro' ? 'section-intro' : r);
        },
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
        }
      };
      window.JC.init(route);
      log('Inicialização concluída com fallback');
      return Promise.resolve();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    startWhenReady('intro').finally(() => {
      log('startWhenReady concluído');
    });
  });

  log('jornada-bootstrap.js carregado');
})();
