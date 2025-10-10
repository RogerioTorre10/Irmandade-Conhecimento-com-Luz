(function () {
  'use strict';

  const etapas = {
    intro:     'assets/html/section-intro.html',
    termos:    'assets/html/section-termos.html',
    senha:     'assets/html/section-senha.html',
    guia:      'assets/html/section-guia.html',
    selfie:    'assets/html/section-selfie.html',
    perguntas: 'assets/html/section-perguntas.html',
    final:     'assets/html/section-final.html',
    
    
  };

 const SECTION_CONTAINER_ID = 'section-conteudo';

  // O objetivo desta função é GARANTIR que a seção esteja no DOM antes de resolver
  async function carregarEtapa(nome) {
    // Corrigido o erro de escopo: 'section' agora é declarado AQUI.
    let section = null; 
    
    const url = etapas[nome] || `/assets/html/section-${nome}.html`; 
    const id = `section-${nome}`;
    
    // Se já estiver no DOM, retorna o elemento
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
    
    // Tenta encontrar o fragmento
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // ATENÇÃO: A variável 'section' já foi declarada lá em cima.
    section = doc.querySelector('#' + id) || doc.querySelector(`[data-section="${nome}"]`) || doc.querySelector('section');

    if (!section) {
      console.error(`[carregarEtapa] Fragmento HTML da seção '${nome}' não encontrado no arquivo recebido!`);
      throw new Error(`Fragmento HTML da seção '${nome}' não encontrado.`); 
    } 
    
    // Limpa e prepara a seção
    section.querySelectorAll('script').forEach(s => s.remove());
    if (!section.id) section.id = id;
    section.classList.add('section');

    // O container auxiliar (#jornada-content-wrapper) que adicionamos no index.html
    const container = document.getElementById('jornada-content-wrapper');

    if (!container) {
        console.error('[carregarEtapa] Content Wrapper (#jornada-content-wrapper) não encontrado!');
        throw new Error('Jornada Content Wrapper não encontrado.');
    }

    // Limpa o wrapper e anexa a nova seção
    container.innerHTML = '';
    container.appendChild(section);
    console.log('[carregarEtapa] Injetada e apensa no wrapper:', section.outerHTML.slice(0, 120) + '...');

    // *** NOVA LÓGICA DE SINCRONIZAÇÃO E RETORNO ***
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: id, name: nome, node: section }
        }));
        resolve(section); // Retorna a seção APÓS a injeção no próximo frame.
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
