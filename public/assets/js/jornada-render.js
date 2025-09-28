(function () {
  'use strict';
  
  const JR = (window.JORNADA_RENDER = window.JORNADA_RENDER || {});

  // Helper único para ajustar canvas + imagem de fundo
  function setCanvas(mode /* 'v' | 'h' */) {
    const canvas = document.getElementById('jornada-canvas');
    if (!canvas) return;
    if (mode === 'h') {
      canvas.className = 'card pergaminho pergaminho-h';
      canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-horiz.png)';
    } else {
      canvas.className = 'card pergaminho pergaminho-v';
      canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-vert.png)';
    }
  }

  function renderinicio() {
    console.log('[JORNADA_RENDER] Renderizando inicio');
    const section = document.getElementById('section-inicio');
    if (section) {
      section.classList.remove('hidden');
      setCanvas('v');
    }
  }

  // Exportada/Global: controller chama isso
  function updateCanvasBackground(sectionId) {
    // perguntas = horizontal; demais = vertical
    const mode = (sectionId === 'section-perguntas') ? 'h' : 'v';
    setCanvas(mode);
  }
  function renderBlocks() {
  const container = document.querySelector('#perguntas-container');
  JORNADA_BLOCKS.forEach(block => {
    const blockElement = document.createElement('div');
    blockElement.id = block.id;
    blockElement.innerHTML = `<h2>${block.content.title}</h2><p>${block.content.description}</p>`;
    container.appendChild(blockElement);
  });
}

  function renderPerguntas(blocoIndex = 0) {
    console.log('[JORNADA_RENDER] Renderizando perguntas, bloco:', blocoIndex);
    const section = document.getElementById('section-perguntas');
    if (section) {
      section.classList.remove('hidden');
      setCanvas('h');

      const perguntasContainer = document.getElementById('perguntas-container');
      if (perguntasContainer) {
        const blocos = Array.from(perguntasContainer.querySelectorAll('.j-bloco'));
        if (blocos[blocoIndex]) {
          blocos.forEach(b => b.style.display = 'none');
          blocos[blocoIndex].style.display = 'block';
          const perguntas = Array.from(blocos[blocoIndex].querySelectorAll('.j-pergunta'));
          if (perguntas.length) {
            perguntas.forEach(p => p.classList.remove('active'));
            perguntas[0].classList.add('active');
            console.log('Exibindo pergunta inicial do bloco:', blocoIndex);
          } else {
            console.warn('Nenhuma pergunta encontrada no bloco:', blocoIndex);
          }
        } else {
          console.error('Bloco não encontrado no índice:', blocoIndex);
        }
      }
    }
  }

  function renderFinal() {
    console.log('[JORNADA_RENDER] Renderizando final');
    const section = document.getElementById('section-final');
    if (section) {
      section.classList.remove('hidden');
      setCanvas('v');
    }
  }

  // Exports
  JR.renderInicio = renderinicio;
  JR.renderPerguntas = renderPerguntas;
  JR.renderFinal = renderFinal;
  JR.updateCanvasBackground = updateCanvasBackground;     // export no namespace
  window.updateCanvasBackground = updateCanvasBackground;  // export global (chamado pelo controller)

  console.log('[JORNADA_RENDER] Módulo carregado');
})();
