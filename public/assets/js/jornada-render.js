(function () {
  'use strict';

  const JR = (window.JORNADA_RENDER = window.JORNADA_RENDER || {});

  function setCanvas(mode /* 'v' | 'h' */) {
    const canvas = document.getElementById('jornada-canvas');
    if (!canvas) return;
    canvas.className = `card pergaminho pergaminho-${mode}`;
    canvas.style.backgroundImage =
      mode === 'h'
        ? 'url(/assets/img/pergaminho-rasgado-horiz.png)'
        : 'url(/assets/img/pergaminho-rasgado-vert.png)';
  }

  function renderInicio() {
    const section = document.getElementById('section-intro');
    if (section) {
      const extraBtns = section.querySelectorAll(
        '[data-action="pre-visualizar"], [data-action="capturar"], [data-action="pular-selfie"], [data-action="confirmar"]'
      );
      extraBtns.forEach(btn => btn.remove());
      section.classList.remove('hidden');
      setCanvas('v');
    }
  }

  function updateCanvasBackground(sectionId) {
    const mode = sectionId === 'section-perguntas' ? 'h' : 'v';
    setCanvas(mode);
  }

  function renderPerguntas(blocoIndex = 0) {
    const section = document.getElementById('section-perguntas');
    if (!section) return;

    section.classList.remove('hidden');
    setCanvas('h');

    const perguntasContainer = document.getElementById('perguntas-container');
    if (!perguntasContainer) return;

    const blocos = Array.from(perguntasContainer.querySelectorAll('.j-bloco'));
    if (!blocos[blocoIndex]) return;

    blocos.forEach(b => (b.style.display = 'none'));
    blocos[blocoIndex].style.display = 'block';

    const perguntas = Array.from(blocos[blocoIndex].querySelectorAll('.j-pergunta'));
    if (perguntas.length) {
      perguntas.forEach(p => p.classList.remove('active'));
      perguntas[0].classList.add('active');
    }
  }

  function renderFinal() {
    const section = document.getElementById('section-final');
    if (section) {
      section.classList.remove('hidden');
      setCanvas('v');
    }
  }

  // Exports
  JR.renderInicio = renderInicio;
  JR.renderPerguntas = renderPerguntas;
  JR.renderFinal = renderFinal;
  JR.updateCanvasBackground = updateCanvasBackground;
  window.updateCanvasBackground = updateCanvasBackground;
})();
