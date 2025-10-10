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
    const url = etapas[nome] || `/assets/html/section-${nome}.html`; 
    const id = `section-${nome}`;
    
    // Se já estiver no DOM, não precisa carregar (ECONOMIA DE RECURSOS)
    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Seção #${id} já está no DOM. Pulando fetch.`);
      return document.getElementById(id);
    }

    console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

   const container = document.getElementById('jornada-content-wrapper');

    if (!container) {
        console.error('[carregarEtapa] Content Wrapper (#jornada-content-wrapper) não encontrado!');
        throw new Error('Jornada Content Wrapper não encontrado.');
    }

    // Limpa o wrapper e anexa a nova seção
    container.innerHTML = '';
    container.appendChild(section);
    console.log('[carregarEtapa] Injetada e apensa no wrapper:', section.outerHTML.slice(0, 120) + '...');

    // *** NOVA LÓGICA DE SINCRONIZAÇÃO ***
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: id, name: nome, node: section }
        }));
        resolve(section); // Retorna a seção APÓS a injeção no próximo frame.
      });
    })
  }
  window.carregarEtapa = carregarEtapa;
})();
