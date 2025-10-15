(function () {
  'use strict';

  if (window.__chamaBound) return;
  window.__chamaBound = true;

  const SAD_WORDS = ['triste', 'deprimido', 'sofrimento', 'dor', 'perda', 'fracasso'];
  const HAPPY_WORDS = ['feliz', 'alegria', 'sucesso', 'amor', 'esperança', 'vitória'];

  function analyzeResponse(text) {
    const normalized = text.toLowerCase();
    let sadScore = 0;
    let happyScore = 0;

    SAD_WORDS.forEach(word => {
      if (normalized.includes(word)) sadScore++;
    });
    HAPPY_WORDS.forEach(word => {
      if (normalized.includes(word)) happyScore++;
    });

    if (sadScore > happyScore) return 'fraca';
    if (happyScore > sadScore) return 'forte';
    return 'media';
  }

  function updateFlameIntensity(intensity) {
    const flames = document.querySelectorAll('.chama-icone');
    flames.forEach(flame => {
      flame.dataset.intensidade = intensity;
      console.log(`[jornada-chama] Intensidade da chama atualizada para: ${intensity}`);
    });
  }

  const handler = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'sec-wizard') return;

    const input = document.getElementById('q-input');
    if (!input) {
      console.error('[jornada-chama] Input #q-input não encontrado');
      return;
    }

    input.addEventListener('input', (e) => {
      const intensity = analyzeResponse(e.target.value);
      updateFlameIntensity(intensity);
    });

    // Aplicar intensidade inicial
    updateFlameIntensity('media');
  };

  document.addEventListener('sectionLoaded', handler, { passive: true });

  // Inicializar se sec-wizard já estiver visível
  setTimeout(() => {
    const visibleWizard = document.querySelector('#sec-wizard:not(.hidden)');
    if (visibleWizard) {
      handler({ detail: { sectionId: 'sec-wizard' } });
    }
  }, 100);
})();
