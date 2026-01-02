/* /assets/js/jornada-progress-inline.js
 * v3.4 — VERSÃO FINAL EQUILIBRADA: container subido + espaço perfeito + botões no lugar
 */
(function () {
  'use strict';
  if (window.__JPROG_INLINE_BOUND__) return;
  window.__JPROG_INLINE_BOUND__ = true;
  const MOD = '[JPROG-INLINE]';

  const q = (sel) => document.querySelector(sel);

  function applyImprovements() {
    const setImp = (el, prop, val) => el && el.style.setProperty(prop, val, 'important');

    // 1) ESPAÇO NO TOPO EQUILIBRADO
    const topBar = q('.progress-top');
    if (topBar) {
      setImp(topBar, 'margin-bottom', '40px');
    }

    const content = q(
      '.perguntas-wrap .perguntas-content, .perguntas-wrap .perg-content, ' +
      '.perguntas-wrap .pergunta-area, .perguntas-wrap .perguntas-inner, ' +
      '#section-perguntas .perguntas-content, #section-perguntas .perg-content'
    );
    if (content) {
      setImp(content, 'padding-top', '150px'); // valor equilibrado: sobe o conteúdo
      setImp(content, 'margin-top', '0px');
    } else {
      const perguntasWrap = q('.perguntas-wrap, .section-perguntas');
      if (perguntasWrap) setImp(perguntasWrap, 'padding-top', '160px');
    }
    const questionTitle2 = q('#jp-question-typed, .perguntas-titulo');
     if (questionTitle2) {
     setImp(questionTitle2, 'margin-top', '60px');
    }

    // 2) MARCADOR FORA DO PERGAMINHO, mas não tão baixo
    const middleContainer = q('.progress-middle');
    if (middleContainer) {
      setImp(middleContainer, 'position', 'relative');   // 🔥 CRÍTICO
      setImp(middleContainer, 'bottom', '-145px'); // valor clássico: coloca o marcador dentro do pergaminho, logo acima da caixa de resposta
      setImp(middleContainer, 'left', 'auto');
      setImp(middleContainer, 'transform', 'none');
      setImp(middleContainer, 'margin', '18px auto 10px'); // entre pergunta e botões
      setImp(middleContainer, 'z-index', '20');
      setImp(middleContainer, 'display', 'flex');
      setImp(middleContainer, 'align-items', 'center');
      setImp(middleContainer, 'justify-content', 'center');
      setImp(middleContainer, 'gap', '12px');
      setImp(middleContainer, 'padding', '8px 18px');
      setImp(middleContainer, 'background', 'rgba(0,0,0,0.45)');
      setImp(middleContainer, 'border-radius', '30px');
      setImp(middleContainer, 'border', '2px solid var(--progress-main, #ffd700)');
      setImp(middleContainer, 'box-shadow',
        '0 0 18px var(--progress-main, #ffd700), ' +
        '0 0 30px var(--progress-glow-1, rgba(255,210,120,0.7)), ' +
        '0 6px 18px rgba(0,0,0,0.6)'
      );

      const label = q('.progress-middle .progress-label');
      if (label) {
        setImp(label, 'color', 'var(--progress-main, #ffd700)');
        setImp(label, 'font-weight', '700');
        setImp(label, 'text-shadow', '0 0 15px var(--progress-main, #ffd700)');
      }

      const badge = q('.progress-question-value');
      if (badge) {
        setImp(badge, 'color', 'var(--progress-main, #ffd700)');
        setImp(badge, 'font-weight', '700');
        setImp(badge, 'font-size', '18px');
        setImp(badge, 'text-shadow', '0 0 15px var(--progress-main, #ffd700)');
      }
    }

    // 3) GLOW NAS BARRAS (mantido)
    const topFill = q('.progress-top .progress-fill, #progress-block-fill');
    const blockFill = q('.progress-question-fill');
    [topFill, blockFill].forEach(bar => {
      if (!bar) return;
      setImp(bar, 'background', 'var(--progress-main, #ffd700)');
      setImp(bar, 'box-shadow',
        '0 0 25px var(--progress-main, #ffd700), ' +
        '0 0 50px var(--progress-glow-1, rgba(255,210,120,0.85)), ' +
        'inset 0 0 35px var(--progress-glow-2, rgba(255,230,150,0.25))'
      );
    });
    // 3.1) BARRA "PERGUNTAS NO BLOCO" — FORA DO PERGAMINHO
    const qBar = q('.progress-question, .progress-question-bar, .progress-question-wrap, #progress-question');
    if (qBar) {
    setImp(qBar, 'position', 'relative');
    setImp(qBar, 'top', '32px');                 // empurra para fora do pergaminho
    setImp(qBar, 'margin', '0 auto 6px');        // aproxima dos botões
    setImp(qBar, 'z-index', '30');

    setImp(qBar, 'background', 'rgba(0,0,0,0.45)');
    setImp(qBar, 'border', '2px solid var(--progress-main, #ffd700)');
    setImp(qBar, 'border-radius', '999px');
    setImp(qBar, 'padding', '10px 18px');

    setImp(qBar, 'box-shadow',
      '0 0 20px var(--progress-main, #ffd700), ' +
      '0 0 36px var(--progress-glow-1, rgba(255,210,120,0.75)), ' +
      'inset 0 0 20px rgba(255,230,150,0.2)'
    );
   }

    
    // 4) Aura nos títulos (mantido)
    const blockTitle = q('.titulo-bloco, h3');
    const questionTitle = q('#jp-question-typed, .perguntas-titulo');
    if (blockTitle) {
      setImp(blockTitle, 'color', 'var(--progress-main, #ffd700)');
      setImp(blockTitle, 'text-shadow',
        '0 0 15px var(--progress-main, #ffd700), 0 0 30px var(--progress-glow-1, rgba(255,210,120,0.85))'
      );
    }
    if (questionTitle) {
      setImp(questionTitle, 'text-shadow',
        '0 0 12px var(--progress-main, #ffd700), 0 0 25px var(--progress-glow-1, rgba(255,210,120,0.85))'
      );
    }

    console.log(MOD, 'VERSÃO FINAL EQUILIBRADA: container subido + botões no lugar + caixa de resposta livre');
  }

  const tryApply = () => {
    const sec = document.getElementById('section-perguntas');
    if (sec && !sec.classList.contains('hidden')) {
      applyImprovements();
    }
  };

  document.addEventListener('DOMContentLoaded', tryApply);
  document.addEventListener('sectionLoaded', () => setTimeout(tryApply, 200));
  document.addEventListener('perguntas:state-changed', applyImprovements);
  document.addEventListener('guia:changed', applyImprovements);
  window.addEventListener('resize', () => setTimeout(applyImprovements, 200));

  tryApply();
})();
