(function () {
  'use strict';

  const etapas = {
    intro:  '/html/jornada-intro.html',
    termos: '/html/jornada-termos.html',
    senha:  '/html/jornada-senha.html',
    barra:  '/html/jornada_barracontador.html',
    olho:   '/html/jornada_olhomagico.html',
    final:  '/html/jornada-final.html'
  };

  window.carregarEtapa = function (nome, callback) {
    const url = etapas[nome];
    if (!url) {
      console.warn(`[Loader] Etapa "${nome}" não encontrada`);
      return;
    }

    fetch(url)
      .then(res => res.text())
      .then(html => {
        const app = document.getElementById('jornada-conteudo');
        if (app) {
          app.innerHTML = html;
          if (typeof callback === 'function') callback();
        }
      })
      .catch(err => console.error(`[Loader] Erro ao carregar etapa "${nome}"`, err));
  };

  document.addEventListener('DOMContentLoaded', () => {
    carregarEtapa('intro', () => {
      window.JC?.show('section-intro');
    });
  });
})();
