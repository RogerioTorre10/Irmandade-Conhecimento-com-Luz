// jornada-bootstrap.js
(function() {
  const log = (...args) => console.log('[BOOT]', ...args);
  const MAX_ATTEMPTS = 100;
  let attempts = 0;

  function startWhenReady(route = 'intro') {
    log(`Tentando iniciar • rota: ${route}`);
    attempts++;

    if (window.JC && typeof window.JC.init === 'function') {
      log('JC.init concluído');
      window.JC.init(route);
      log('Inicialização concluída com sucesso');
      return Promise.resolve();
    } else if (attempts < MAX_ATTEMPTS) {
      log(`Tentativa ${attempts} de ${MAX_ATTEMPTS}`);
      return new Promise(resolve => setTimeout(() => resolve(startWhenReady(route)), 100));
    } else {
      log(`JC não disponível após ${MAX_ATTEMPTS} tentativas`);
      // Fallback: Definir JC básico
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
      // Timeout de segurança (20s)
      setTimeout(() => {
        if (!window.JC || typeof window.JC.init !== 'function') {
          log('Timeout de segurança atingido, forçando inicialização');
          window.JC = window.JC || { init: () => log('JC.init (timeout fallback)') };
          window.JC.init('intro');
        }
      }, 20000);
    });
  });

  log('jornada-bootstrap.js carregado');
})();
