(function () {
  'use strict';

  const etapas = {
    intro: 'assets/html/section-intro.html',
    termos: 'assets/html/section-termos.html',
    senha: 'assets/html/section-senha.html',
    guia: 'assets/html/section-guia.html',
    selfie: 'assets/html/section-selfie.html',
    perguntas: 'assets/html/section-perguntas.html',
    final: 'assets/html/section-final.html',
  };

  const SECTION_CONTAINER_ID = 'section-conteudo';

  function checkCriticalElements(container, nome) {
    if (nome !== 'intro') return true;

    const criticalElements = ['#intro-p1', '#intro-p2', '#btn-avancar'];
    let allFound = true;
    for (const selector of criticalElements) {
      const el = container.querySelector(selector);
      if (!el) {
        console.warn(`[carregarEtapa] Elemento crítico ${selector} não encontrado em #jornada-content-wrapper`);
        allFound = false;
      }
    }
    console.log(`[carregarEtapa] Elementos críticos ${allFound ? 'encontrados' : 'NÃO encontrados'} para ${nome}`);
    return allFound;
  }

  async function carregarEtapa(nome) {
    let section = null;
    const url = etapas[nome] || `/assets/html/section-${nome}.html`;
    const id = `section-${nome}`;

    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Seção #${id} já está no DOM. Pulando fetch.`);
      return document.getElementById(id);
    }

    console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[carregarEtapa] Falha HTTP ao carregar etapa:', res.status, url);
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    section = doc.querySelector('#' + id) || doc.querySelector(`[data-section="${nome}"]`) || doc.querySelector('section');

    if (!section) {
      console.error(`[carregarEtapa] Fragmento HTML da seção '${nome}' não encontrado no arquivo recebido! HTML bruto:`, html);
      throw new Error(`Fragmento HTML da seção '${nome}' não encontrado.`);
    }

    section.querySelectorAll('script').forEach(s => s.remove());
    if (!section.id) section.id = id;
    section.classList.add('section');

    const container = document.getElementById('jornada-content-wrapper');
    if (!container) {
      console.error('[carregarEtapa] Content Wrapper (#jornada-content-wrapper) não encontrado!');
      throw new Error('Jornada Content Wrapper não encontrado.');
    }

    container.innerHTML = '';
    container.appendChild(section);
    console.log('[carregarEtapa] Injetada e apensa no wrapper. Conteúdo:', container.innerHTML);

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const elementsFound = checkCriticalElements(container, nome);
          console.log(`[carregarEtapa] DOM pronto, disparando sectionLoaded para ${nome}`);
          document.dispatchEvent(new CustomEvent('sectionLoaded', {
            detail: { sectionId: id, name: nome, node: section }
          }));
          if (!elementsFound) {
            console.error(`[carregarEtapa] Falha ao encontrar elementos críticos para ${nome}`);
            window.toast?.(`Falha ao carregar elementos da seção ${nome}. Verifique o HTML.`, 'error');
          }
          resolve(section);
        });
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
