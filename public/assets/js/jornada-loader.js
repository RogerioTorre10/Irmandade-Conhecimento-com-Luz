(function () {
  'use strict';

  // Definição de URLs para seções
 const etapas = {
    intro:    '/html/section-intro.html',
    termos:   '/assets/js/html/section-termos.html',
    senha:    '/assets/js/html/section-senha.html',
    filme:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    guia:     '/assets/js/html/section-guia.html',
    filme:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    selfie:   '/assets/js/html/section-selfie.html',
    filme:    '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    perguntas:'/assets/js/html/section-perguntas.html', 
    filme:    '/assets/img/filme-5-fim-da-jornada.mp4',
    final:    '/assets/js/html/section-final.html'
    };

 // Função para verificar elementos críticos no HTML
  function checkCriticalElements(section, sectionId) {
    const criticalSelectors = {
      'section-intro': ['#intro-p1', '#intro-p2', '#btn-avancar'],
      'section-termos': ['[data-action="termos-next"]'],
      // Adicione seletores para outras seções, se necessário
    }[sectionId] || [];

    const found = {};
    for (const selector of criticalSelectors) {
      found[selector] = !!section.querySelector(selector);
      if (found[selector]) {
        console.log(`[carregarEtapa] Critical element ${selector} FOUND.`);
      } else {
        console.warn(`[carregarEtapa] Critical element ${selector} NOT found.`);
      }
    }
    return found;
  }

  async function carregarEtapa(nome) {
    const id = `section-${nome}`;
    console.log('[carregarEtapa] Starting load for', nome, 'ID:', id);

    // Verifica se a seção já existe no DOM
    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Section #${id} already in DOM. Skipping.`);
      const section = document.getElementById(id);
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
          resolve(section);
        });
      });
    }

    // Carrega o HTML via fetch
    const url = etapas[nome] || `/assets/html/section-${nome}.html`;
    console.log('[carregarEtapa] Loading via fetch:', url);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[carregarEtapa] HTTP failure loading stage:', res.status, url);
      throw new Error(`HTTP ${res.status} at ${url}`);
    }
    const html = await res.text();

    // Cria um contêiner temporário para processar o HTML
    const container = document.createElement('div');
    container.innerHTML = html;
    let section = container.querySelector('#' + id);
    if (!section) {
      console.warn('[carregarEtapa] Section #' + id + ' not found in HTML. Using first element or creating new.');
      section = container.firstElementChild || document.createElement('section');
      section.id = id;
      section.innerHTML = container.innerHTML;
    }

    // Garante que o ID e a classe estejam corretos
    section.id = id;
    section.classList.add('section');
    const criticalElements = checkCriticalElements(section, id);

    // Verifica se o wrapper existe
    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) {
      console.error('[carregarEtapa] Wrapper #jornada-content-wrapper not found!');
      throw new Error('Wrapper #jornada-content-wrapper not found.');
    }

    // Limpa o wrapper e injeta a seção
    wrapper.innerHTML = '';
    wrapper.appendChild(section);
    console.log('[carregarEtapa] Injected into wrapper:', section.outerHTML.slice(0, 120) + '...');
    console.log('[carregarEtapa] Section #' + id + ' present:', !!document.getElementById(id));
    console.log('[carregarEtapa] Critical elements present:', criticalElements);

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
        resolve(section);
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
