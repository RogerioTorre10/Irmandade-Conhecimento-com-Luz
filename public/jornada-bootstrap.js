/* /jornada-bootstrap.js */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(() => {
    const ns = window.JORNADA || {};

    // Botão "Iniciar Jornada" na home/jornadas.html
    const btn = document.getElementById('btnComecar');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof ns.renderIntro === 'function') ns.renderIntro();
        else if (typeof ns.renderPerguntas === 'function') ns.renderPerguntas(0);
        else console.warn('[JORNADA] renderIntro/renderPerguntas não encontrados.');
      });
    }

    // Respeita hash ao abrir direto
    if (location.hash === '#intro' && typeof ns.renderIntro === 'function') {
      ns.renderIntro();
    } else if (location.hash === '#perguntas' && typeof ns.renderPerguntas === 'function') {
      ns.renderPerguntas(0);
    }
  });
})();
