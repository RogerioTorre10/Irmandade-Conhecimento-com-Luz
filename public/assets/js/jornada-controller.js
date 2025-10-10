(function () {
  'use strict';

  if (window.JC) return;
  window.JC = {};

  let currentSectionIndex = -1;
  let sectionsOrder = [];

  function createFallbackElement(id) {
    console.log('[JC.createFallbackElement] Criando fallback para', id);
    const section = document.createElement('section');
    section.id = id;
    section.className = 'section';
    section.innerHTML = `<h1>Erro: Seção ${id} não carregada.</h1>`;
    return section;
  }

  async function show(sectionId) {
    const nome = sectionId.replace('section-', '');
    console.log('[JC.show] Tentando exibir:', sectionId);

    const container = document.getElementById('jornada-content-wrapper');
    if (!container) {
      console.error('[JC.show] Content Wrapper (#jornada-content-wrapper) não encontrado!');
      return;
    }

    // Limpa todas as seções existentes
    container.innerHTML = '';

    let section;
    try {
      section = await window.carregarEtapa(nome);
    } catch (e) {
      console.error('[JC.show] Falha ao carregar etapa:', e);
      section = createFallbackElement(sectionId);
      container.appendChild(section);
    }

    // Garante que apenas a seção atual seja visível
    document.querySelectorAll('.section').forEach(s => {
      if (s.id !== sectionId) s.classList.add('hidden');
    });
    section.classList.remove('hidden');
    section.style.display = 'flex';

    console.log('[JC.show] Exibido com sucesso:', sectionId);
  }

  function setOrder(order) {
    sectionsOrder = order;
    console.log('[JC.setOrder] Ordem das seções definida:', sectionsOrder);
  }

  async function goNext(nextSection) {
    if (!nextSection && currentSectionIndex < sectionsOrder.length - 1) {
      currentSectionIndex++;
      nextSection = sectionsOrder[currentSectionIndex];
    }
    if (nextSection) {
      await show(nextSection);
    }
  }

  async function init() {
    console.log('[JC.init] Controlador inicializado com sucesso.');
  }

  window.JC.show = show;
  window.JC.setOrder = setOrder;
  window.JC.goNext = goNext;
  window.JC.init = init;

  init();
})();
