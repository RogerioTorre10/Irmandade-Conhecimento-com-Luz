(function () {
  'use strict';

  const JR = (window.JORNADA_RENDER = window.JORNADA_RENDER || {});

  function renderIntro() {
    console.log('[JORNADA_RENDER] Renderizando intro');
    const section = document.getElementById('section-intro');
    if (section) {
      section.classList.remove('hidden');
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.className = 'card pergaminho pergaminho-v';
        canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-vert.png)';
      }
    }
  }
  function updateCanvasBackground(sectionId) {
  const canvas = document.getElementById('jornada-canvas');
  if (canvas) {
    if (sectionId === 'section-perguntas') {
      canvas.className = 'card pergaminho pergaminho-h';
      canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-horiz.png)';
    } else {
      canvas.className = 'card pergaminho pergaminho-v';
      canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-vert.png)';
    }
  }
}

  function renderPerguntas(blocoIndex = 0) {
    console.log('[JORNADA_RENDER] Renderizando perguntas, bloco:', blocoIndex);
    const section = document.getElementById('section-perguntas');
    if (section) {
      section.classList.remove('hidden');
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.className = 'card pergaminho pergaminho-h';
        canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-horiz.png)';
      }
      const perguntasContainer = document.getElementById('perguntas-container');
      if (perguntasContainer) {
        const blocos = Array.from(perguntasContainer.querySelectorAll('.j-bloco'));
        if (blocos[blocoIndex]) {
          blocos.forEach(b => b.style.display = 'none');
          blocos[blocoIndex].style.display = 'block';
          const perguntas = Array.from(blocos[blocoIndex].querySelectorAll('.j-pergunta'));
          if (perguntas.length) {
            perguntas.forEach(p => p.classList.remove('active'));
            perguntas[0].classList.add('active'); // Exibe a primeira pergunta
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
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.className = 'card pergaminho pergaminho-v';
        canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-vert.png)';
      }
    }
  }

  JR.renderIntro = renderIntro;
  JR.renderPerguntas = renderPerguntas;
  JR.renderFinal = renderFinal;

  console.log('[JORNADA_RENDER] Módulo carregado');
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
