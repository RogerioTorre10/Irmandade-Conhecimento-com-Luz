/* /assets/js/jornada-progress-inline.js
 * v3.0 — VERSÃO FINAL SIMPLES: melhora o contador nativo + glow do guia + espaço no topo
 */
(function () {
  'use strict';
  if (window.__JPROG_INLINE_BOUND__) return;
  window.__JPROG_INLINE_BOUND__ = true;
  const MOD = '[JPROG-INLINE]';

  const q = (sel) => document.querySelector(sel);

  function applyImprovements() {
    // 1. ESPAÇO NO TOPO para a pergunta respirar (resolve "coberta")
    const topBar = q('.progress-top');
    if (topBar) {
      topBar.style.marginBottom = '80px !important';
    }

    // Container principal das perguntas ganha padding top extra
    const perguntasWrap = q('.perguntas-wrap, .section-perguntas');
    if (perguntasWrap) {
      perguntasWrap.style.paddingTop = '60px !important';
    }

    // 2. MELHORA O CONTADOR NATIVO (o pequeno com barra + "1 / 3")
    const middleContainer = q('.progress-middle'); // container original do label + barra + badge
    if (middleContainer) {
      middleContainer.style.cssText += `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 14px !important;
        margin: 60px auto 30px !important;  /* AQUI: desce bastante a barra (60px de margem superior) */
        padding: 12px 24px !important;
        background: rgba(0,0,0,0.5) !important;
        border-radius: 40px !important;
        box-shadow: 
          0 0 25px var(--progress-main, #ffd700),
          0 0 50px var(--progress-glow-1, rgba(255,210,120,0.85)),
          0 8px 25px rgba(0,0,0,0.7) !important;
        border: 2px solid var(--progress-main, #ffd700) !important;
      `;

      // Label: "Perguntas no Bloco"
      const label = q('.progress-middle .progress-label');
      if (label) {
        label.style.color = 'var(--progress-main, #ffd700) !important';
        label.style.fontWeight = '700 !important';
        label.style.textShadow = '0 0 15px var(--progress-main, #ffd700) !important';
      }

      // Badge: "1 / 3" (já é dinâmico!)
      const badge = q('.progress-question-value');
      if (badge) {
        badge.style.color = 'var(--progress-main, #ffd700) !important';
        badge.style.fontWeight = '700 !important';
        badge.style.fontSize = '18px !important';
        badge.style.textShadow = '0 0 15px var(--progress-main, #ffd700) !important';
      }
    }

    // 3. GLOW FORTE NAS BARRAS (superior e do bloco)
    const bars = [
      q('.progress-top .progress-fill, #progress-block-fill'),
      q('.progress-question-fill')
    ];
    bars.forEach(bar => {
      if (bar) {
        bar.style.background = 'var(--progress-main, #ffd700) !important';
        bar.style.boxShadow = `
          0 0 25px var(--progress-main, #ffd700),
          0 0 50px var(--progress-glow-1),
          inset 0 0 35px var(--progress-glow-2)
        !important`;
      }
    });

    // 4. Aura nos títulos (bloco e pergunta)
    const blockTitle = q('.titulo-bloco, h3');
    const questionTitle = q('#jp-question-typed, .perguntas-titulo');
    if (blockTitle) {
      blockTitle.style.color = 'var(--progress-main, #ffd700) !important';
      blockTitle.style.textShadow = '0 0 15px var(--progress-main, #ffd700), 0 0 30px var(--progress-glow-1) !important';
    }
    if (questionTitle) {
      questionTitle.style.textShadow = '0 0 12px var(--progress-main, #ffd700), 0 0 25px var(--progress-glow-1) !important';
    }

    console.log(MOD, 'Melhorias aplicadas: contador nativo aprimorado + espaço + glow do guia');
  }

  // Executa quando a seção aparece
  const tryApply = () => {
    const sec = document.getElementById('section-perguntas');
    if (sec && !sec.classList.contains('hidden')) {
      applyImprovements();
    }
  };

  // Gatilhos
  document.addEventListener('DOMContentLoaded', tryApply);
  document.addEventListener('sectionLoaded', () => setTimeout(tryApply, 200));
  document.addEventListener('perguntas:state-changed', applyImprovements);
  document.addEventListener('guia:changed', applyImprovements);
  window.addEventListener('resize', () => setTimeout(applyImprovements, 200));

  tryApply();
})();
