// jornada-loader.js
(function () {
  'use strict';

  // DEFINIÇÃO CENTRALIZADA DAS ETAPAS
  // ATENÇÃO: Há chaves duplicadas ('filme'), a última prevalece. Mantenha essa estrutura se for o comportamento desejado pelo sistema.
  const etapas = {
    intro:    '/html/section-intro.html',
    termos:   '/html/section-termos.html',
    senha:    '/html/section-senha.html',
    filme1:   '/assets/img/conhecimento-com-luz-jardim.mp4', // Renomeado para filme1
    guia:     '/html/section-guia.html',
    filme2:   '/assets/img/conhecimento-com-luz-jardim.mp4', // Renomeado para filme2
    selfie:   '/html/section-selfie.html',
    filme3:   '/assets/img/filme-0-ao-encontro-da-jornada.mp4', // Renomeado para filme3
    perguntas:'/html/section-perguntas.html', 
    filme4:   '/assets/img/filme-5-fim-da-jornada.mp4', // Renomeado para filme4
    final:    '/html/section-final.html'
    };

  const SECTION_CONTAINER_ID = 'section-conteudo';

  // Função auxiliar para verificar elementos críticos no HTML
  function checkCriticalElements(html, sectionId) {
    const container = document.createElement('div');
    container.innerHTML = html;
    const criticalSelectors = ['#intro-p1', '#intro-p2', '#btn-avancar', '[data-action="termos-next"]'];
    
    let section = container.querySelector('#' + sectionId) || container.querySelector('section');
    if (!section) {
      console.error('[carregarEtapa] Seção principal não encontrada no HTML bruto!');
      return null; // Retorna nulo se não encontrar a seção principal
    }

    for (const selector of criticalSelectors) {
      if (section.querySelector(selector)) {
        console.log(`[carregarEtapa] Elemento crítico ${selector} ENCONTRADO.`);
      }
    }
    
    return section; // Retorna a seção se for encontrada
  }


  async function carregarEtapa(nome) {
    let section = null; 
    // Usa o mapeamento em 'etapas', ou tenta um nome padrão (fallback de URL)
    const url = etapas[nome] || `/html/section-${nome}.html`; 
    const id = `section-${nome}`;
    
    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Seção #${id} já está no DOM. Pulando fetch.`);
      section = document.getElementById(id);
      // Se a seção já existe, apenas dispara o evento de carregamento para re-inicializar
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
          resolve(section);
        });
      });
    }

    console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

    // Garante que o cache seja ignorado para obter o conteúdo HTML mais recente
    const res = await fetch(url, { cache: 'no-store' }); 
    if (!res.ok) {
      console.error('[carregarEtapa] Falha HTTP ao carregar etapa:', res.status, url);
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    const html = await res.text();
    
    // Lógica de extração do HTML
    section = checkCriticalElements(html, id); 

    if (!section) {
      console.error(`[carregarEtapa] Falha crítica: Fragmento HTML da seção '${nome}' não pôde ser extraído.`);
      throw new Error(`Falha crítica: Fragmento HTML da seção '${nome}' não pôde ser extraído.`); 
    } 
    
    // Limpa e prepara a seção
    section.querySelectorAll('script').forEach(s => s.remove());
    if (!section.id) section.id = id;
    section.classList.add('section');

    const container = document.getElementById('jornada-content-wrapper');

    if (!container) {
        console.error('[carregarEtapa] Content Wrapper (#jornada-content-wrapper) não encontrado!');
        throw new Error('Jornada Content Wrapper não encontrado.');
    }

    // *** SOLUÇÃO DO PROBLEMA DO FALLBACK: Limpa antes de anexar! ***
    container.innerHTML = '';
    container.appendChild(section);
    console.log('[carregarEtapa] Injetada e apensa no wrapper:', section.outerHTML.slice(0, 120) + '...');

    // Reaplica fundo de pergaminho vertical/horizontal se necessário
   const canvas = document.getElementById('jornada-canvas');
    if (canvas) {
      // Limpa todas as classes de pergaminho antes de aplicar a nova
      canvas.classList.remove('pergaminho', 'pergaminho-v', 'pergaminho-h');

      if (['intro', 'termos', 'senha', 'guia', 'selfie', 'final'].includes(nome)) {
        canvas.classList.add('pergaminho', 'pergaminho-v');
        console.log('[carregarEtapa] Fundo de pergaminho VERTICAL aplicado ao canvas.');
      }

      if (nome === 'perguntas') {
        canvas.classList.add('pergaminho', 'pergaminho-h');
        console.log('[carregarEtapa] Fundo de pergaminho HORIZONTAL aplicado ao canvas.');
      }
    }
      
    // Resolve a Promise após a injeção
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
