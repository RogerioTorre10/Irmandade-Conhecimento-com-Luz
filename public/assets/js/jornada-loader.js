// Substituir TODO o conteúdo do /assets/js/jornada-loader.js
(function () {
  'use strict';

  // DEFINIÇÃO CENTRALIZADA DAS ETAPAS
  const etapas = {
    intro:    '/assets/html/section-intro.html',
    termos:   '/assets/html/section-termos.html',
    senha:    '/assets/html/section-senha.html',
    filme:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    guia:     '/assets/html/section-guia.html',
    filme:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    selfie:   '/assets/html/section-selfie.html',
    filme:    '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    perguntas:'/assets/html/section-perguntas.html', 
    filme:    '/assets/img/filme-5-fim-da-jornada.mp4',
    final:    '/assets/html/section-final.html'
    };

  const SECTION_CONTAINER_ID = 'section-conteudo';

  function checkCriticalElements(html, sectionId) {
    const container = document.createElement('div');
    container.innerHTML = html;
    const criticalSelectors = ['#intro-p1', '#intro-p2', '#btn-avancar', '[data-action="termos-next"]'];
    
    let section = container.querySelector('#' + sectionId);
    if (!section) {
      console.warn('[carregarEtapa] Seção principal #' + sectionId + ' não encontrada no HTML bruto! Forçando criação.');
      section = document.createElement('section');
      section.id = sectionId;
      // Tenta extrair o conteúdo interno, ignorando tags <html>, <body>, <meta>
      const content = container.querySelector('section') || container.firstElementChild;
      if (content) {
        section.innerHTML = content.innerHTML;
      } else {
        section.innerHTML = container.innerHTML.replace(/<html[^>]*>|<body[^>]*>|<meta[^>]*>/gi, '');
      }
    }

    const foundSelectors = {};
    for (const selector of criticalSelectors) {
      foundSelectors[selector] = !!section.querySelector(selector);
      if (foundSelectors[selector]) {
        console.log(`[carregarEtapa] Elemento crítico ${selector} ENCONTRADO.`);
      } else {
        console.warn(`[carregarEtapa] Elemento crítico ${selector} NÃO encontrado.`);
      }
    }
    
    // Se for section-intro e elementos críticos estiverem ausentes, usar HTML de fallback
    if (sectionId === 'section-intro' && (!foundSelectors['#intro-p1'] || !foundSelectors['#intro-p2'] || !foundSelectors['#btn-avancar'])) {
      console.warn('[carregarEtapa] Elementos críticos de section-intro ausentes. Usando HTML de fallback.');
      section.innerHTML = `
        <div id="jornada-content-wrapper">
          <div class="intro-wrap">
            <div id="intro-p1" class="intro-paragraph" data-typing="true" data-speed="36" data-cursor="true">
              Bem-vindo à Jornada Conhecimento com Luz.
            </div>
            <div id="intro-p2" class="intro-paragraph" data-typing="true" data-speed="36" data-cursor="true">
              Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.
            </div>
            <input id="name-input" type="text" placeholder="Digite seu nome">
            <div class="intro-actions">
              <button id="btn-avancar" class="btn btn-primary" data-action="avancar" disabled>Iniciar</button>
            </div>
          </div>
        </div>`;
    }

    return section;
  }

  async function carregarEtapa(nome) {
    let section = null; 
    const url = etapas[nome] || `/assets/html/section-${nome}.html`; 
    const id = `section-${nome}`;
    
    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Seção #${id} já está no DOM. Pulando fetch.`);
      section = document.getElementById(id);
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
          resolve(section);
        });
      });
    }

    console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[carregarEtapa] Falha HTTP ao carregar etapa:', res.status, url);
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    const html = await res.text();
    
    section = checkCriticalElements(html, id); 

    if (!section) {
      console.error(`[carregarEtapa] Falha crítica: Fragmento HTML da seção '${nome}' não pôde ser extraído.`);
      throw new Error(`Falha crítica: Fragmento HTML da seção '${nome}' não pôde ser extraído.`); 
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
    console.log('[carregarEtapa] Injetada e apensa no wrapper:', section.outerHTML.slice(0, 120) + '...');
    console.log('[carregarEtapa] Elemento #' + id + ' presente:', !!document.getElementById(id));
    console.log('[carregarEtapa] Elementos críticos presentes:', {
      introP1: !!section.querySelector('#intro-p1'),
      introP2: !!section.querySelector('#intro-p2'),
      btnAvancar: !!section.querySelector('#btn-avancar')
    });

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: id, name: nome, node: section }
        }));
        resolve(section); 
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
