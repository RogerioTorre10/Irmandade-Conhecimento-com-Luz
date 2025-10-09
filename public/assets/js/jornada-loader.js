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
async function carregarEtapa(nome) {
  try {
    const url = `/html/section-${nome}.html`;
    console.log('[carregarEtapa] Carregando etapa', `'${nome}'`, 'de:', url);

    const html = await fetch(url, { cache: 'no-store' }).then(r => r.text());
    console.log('[carregarEtapa] HTML recebido para', `'${nome}':`, html.slice(0, 200) + '...');

    // Parseia como documento isolado
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1) Tenta pegar a seção por id
    let section = doc.querySelector(`#section-${nome}`);

    // 2) Se não achar, tenta por data-section
    if (!section) section = doc.querySelector(`[data-section="${nome}"]`);

    // 3) Se ainda não achar, cria fallback bem formado
    if (!section) {
      console.warn(`[carregarEtapa] Fragmento de seção não encontrado para '${nome}'. Criando fallback...`);
      const tmp = document.createElement('section');
      tmp.id = `section-${nome}`;
      tmp.className = 'card';
      tmp.innerHTML = `<div class="p-4">Seção ${nome} carregada, mas sem conteúdo.</div>`;
      section = tmp;
    } else {
      // Remove <script> internos do fragmento pra evitar cargas duplicadas
      section.querySelectorAll('script').forEach(s => s.remove());
    }

    // Container onde as seções vivem
    const container = document.getElementById('jornada-conteudo') || document.getElementById('jornada-canvas') || document.body;

    // Remove seção anterior igual (se existir) e injeta a nova
    const old = container.querySelector(`#section-${nome}`);
    if (old) old.remove();
    container.appendChild(section);

    console.log('[carregarEtapa] Seção injetada com id:', section.id);

    // Dispara eventos pra quem escuta (section-intro.js, etc.)
    const ev = new CustomEvent('sectionLoaded', { detail: { sectionId: section.id, name: nome, node: section } });
    document.dispatchEvent(ev);

  } catch (err) {
    console.error('[carregarEtapa] Erro ao carregar etapa', nome, err);
    window.toast && window.toast(`Falha ao carregar etapa ${nome}.`);
  }
}


  window.carregarEtapa = carregarEtapa;
})();
