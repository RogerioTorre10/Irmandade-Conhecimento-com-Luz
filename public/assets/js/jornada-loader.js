(function () {
  'use strict';

  const etapas = {
    intro:  '/assets/html/section-intro.html',
    termos: '/assets/html/jornada-termos.html',
    senha:  '/assets/html/jornada-senha.html',
    barra:  '/assets/html/jornada_barracontador.html',
    olho:   '/assets/html/jornada_olhomagico.html',
    final:  '/assets/html/jornada-final.html'
  };

  const JORNADA_CONTAINER_ID = 'jornada-conteudo';

// /assets/js/jornada-loader.js
async function carregarEtapa(nome) {
  try {
    const url = `/assets/html/section-${nome}.html`; // <- sem "public/"
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    const html = await res.text();

    // parse seguro (aceita fragmento ou página inteira)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let section =
      doc.querySelector('#section-' + nome) ||
      doc.querySelector(`[data-section="${nome}"]`);

    if (!section) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      section =
        tmp.querySelector('#section-' + nome) ||
        tmp.querySelector(`[data-section="${nome}"]`) ||
        tmp.querySelector('section');
    }

    if (!section) {
      const fb = document.createElement('section');
      fb.id = `section-${nome}`;
      fb.className = 'section';
      fb.innerHTML = `<div class="p-4">Seção ${nome} carregada, mas sem conteúdo.</div>`;
      section = fb;
    } else {
      // remove qualquer script acidental do fragmento
      section.querySelectorAll('script').forEach(s => s.remove());
      // força id e classe padrão
      if (!section.id) section.id = `section-${nome}`;
      section.classList.add('section');
      section.classList.remove('pergaminho', 'pergaminho-v'); // <- garante sem fundo
    }

    const container = document.getElementById('jornada-conteudo') || document.body;
    // remove somente a section homônima já existente
    container.querySelectorAll(`#section-${nome}`).forEach(n => n.remove());
    container.appendChild(section);

    document.dispatchEvent(new CustomEvent('sectionLoaded', {
      detail: { sectionId: section.id, name: nome, node: section }
    }));
  } catch (err) {
    console.error('[carregarEtapa] Erro:', err);
    window.toast?.(`Falha ao carregar etapa ${nome}.`, 'error');
  }
}



  window.carregarEtapa = carregarEtapa;
})();
