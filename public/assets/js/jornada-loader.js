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

const sectionCache = {};
function carregarEtapa(nome, callback) {
  if (nome === 'intro') {
    console.log('[carregarEtapa] Ignorando intro, tratado por jornada-intro.js');
    document.dispatchEvent(new CustomEvent('sectionLoaded', {
      detail: { sectionId: `section-${nome}` }
    }));
    if (callback) callback();
    return;
  }

  const url = `/assets/html/jornada-${nome}.html`;
  if (sectionCache[url]) {
    console.log(`[carregarEtapa] Cache hit para ${url}`);
    const container = document.getElementById('jornada-conteudo');
    container.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = sectionCache[url];
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.body.appendChild(newScript);
    });
    scripts.forEach(s => s.remove());
    while (temp.firstChild) {
      container.appendChild(temp.firstChild);
    }
    setTimeout(() => {
      const root = container.querySelector(`#section-${nome}`);
      console.log(`[carregarEtapa] Root encontrado para section-${nome}:`, root);
      if (!root) {
        console.error(`[carregarEtapa] Elemento #section-${nome} não encontrado após injeção (cache)`);
      }
      document.dispatchEvent(new CustomEvent('sectionLoaded', {
        detail: { sectionId: `section-${nome}`, root }
      }));
      if (callback) callback();
    }, 0);
    return;
  }

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(html => {
      console.log(`[carregarEtapa] HTML retornado para ${nome}:`, html);
      sectionCache[url] = html;
      const container = document.getElementById('jornada-conteudo');
      container.innerHTML = '';
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const scripts = temp.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
      });
      scripts.forEach(s => s.remove());
      while (temp.firstChild) {
        container.appendChild(temp.firstChild);
      }
      setTimeout(() => {
        const root = container.querySelector(`#section-${nome}`);
        console.log(`[carregarEtapa] Root encontrado para section-${nome}:`, root);
        if (!root) {
          console.error(`[carregarEtapa] Elemento #section-${nome} não encontrado após injeção`);
        }
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: `section-${nome}`, root }
        }));
        if (callback) callback();
      }, 0);
    })
    .catch(err => {
      console.error(`[carregarEtapa] Erro ao carregar etapa ${nome}:`, err);
      window.toast?.('Erro ao carregar etapa. Tente novamente.');
    });
}
  
  // Torna a função acessível globalmente
  window.carregarEtapa = carregarEtapa;

})();
