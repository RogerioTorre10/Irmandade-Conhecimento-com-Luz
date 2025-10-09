(function () {
  'use strict';

  const etapas = {
    intro:  '/assets/html/section-intro.html',
    termos: '/assets/html/section-termos.html',
    senha:  '/assets/html/section-senha.html',
    barra:  '/assets/html/section_barracontador.html',
    olho:   '/assets/html/section_olhomagico.html',
    final:  '/assets/html/section-final.html'
  };

  const SECTION_CONTAINER_ID = 'section-conteudo';

// /assets/js/jornada-loader.js  [PATCH robusto]
async function carregarEtapa(nome) {
  const url = `/assets/html/section-${nome}.html`; // ✅ sem "public/"
  console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.warn('[carregarEtapa] HTTP', res.status, 'para', url);
    throw new Error(`HTTP ${res.status} em ${url}`);
  }
  const html = await res.text();
  console.log('[carregarEtapa] Tamanho do HTML recebido:', html.length);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let section =
    doc.querySelector('#section-' + nome) ||
    doc.querySelector(`[data-section="${nome}"]`);

  if (!section) {
    // aceita fragmento "solto" também
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    section =
      tmp.querySelector('#section-' + nome) ||
      tmp.querySelector(`[data-section="${nome}"]`) ||
      tmp.querySelector('section');
  }

  if (!section) {
    console.warn(`[carregarEtapa] Fragmento não encontrado para '${nome}', usando fallback.`);
    section = document.createElement('section');
    section.id = `section-${nome}`;
    section.className = 'section';
    section.innerHTML = `<div class="p-4">Seção ${nome} carregada, mas sem conteúdo.</div>`;
  } else {
    // higiene
    section.querySelectorAll('script').forEach(s => s.remove());
    if (!section.id) section.id = `section-${nome}`;
    section.classList.add('section');
    section.classList.remove('pergaminho', 'pergaminho-v'); // ❌ sem pergaminho dentro
  }

  const container = document.getElementById('section-conteudo') || document.body;
  container.querySelectorAll(`#section-${nome}`).forEach(n => n.remove());
  container.appendChild(section);
  console.log('[carregarEtapa] Injetada:', section.outerHTML.slice(0, 120) + '...');

  // 🔑 envia o node real pra quem escuta
  document.dispatchEvent(new CustomEvent('sectionLoaded', {
    detail: { sectionId: section.id, name: nome, node: section }
  }));
}


  window.carregarEtapa = carregarEtapa;
})();
