(function () {
  'use strict';

  const etapas = {
    intro:  '/html/section-intro.html',
    termos: '/assets/html/jornada-termos.html',
    senha:  '/assets/html/jornada-senha.html',
    barra:  '/assets/html/jornada_barracontador.html',
    olho:   '/assets/html/jornada_olhomagico.html',
    final:  '/assets/html/jornada-final.html'
  };

  const JORNADA_CONTAINER_ID = 'jornada-conteudo';

 // /assets/js/jornada-loader.js  (patch no carregarEtapa)
// /assets/js/jornada-loader.js  (ajuste de URL + checagem de status)
async function carregarEtapa(nome) {
  try {
    const url = `/html/section-${nome}.html`; // ✅ sem "public/"
    console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('[carregarEtapa] HTTP', res.status, 'para', url);
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // tenta achar a section certinha
    let section = doc.querySelector('#section-' + nome) 
                || doc.querySelector(`[data-section="${nome}"]`);

    // Se veio página inteira por engano, tenta extrair a primeira <section ...>
    if (!section) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      section = tmp.querySelector('#section-' + nome) 
             || tmp.querySelector(`[data-section="${nome}"]`)
             || tmp.querySelector('section');
    }

    if (!section) {
      console.warn(`[carregarEtapa] Fragmento não encontrado para '${nome}', usando fallback.`);
      const fb = document.createElement('section');
      fb.id = `section-${nome}`;
      fb.className = 'card';
      fb.innerHTML = `<div class="p-4">Seção ${nome} carregada, mas sem conteúdo.</div>`;
      section = fb;
    } else {
      section.querySelectorAll('script').forEach(s => s.remove());
      // garante o id correto
      if (!section.id) section.id = `section-${nome}`;
    }

    const container = document.getElementById('jornada-conteudo') || document.body;
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
