/* /assets/js/jornada-progress-inline.js
 * v3.5 — FINAL: tema do guia em TODAS as auras + layout equilibrado preservado
 */
(function () {
  'use strict';
  if (window.__JPROG_INLINE_BOUND__) return;
  window.__JPROG_INLINE_BOUND__ = true;
  const MOD = '[JPROG-INLINE]';

  const q = (sel) => document.querySelector(sel);

  function applyImprovements() {
    const setImp = (el, prop, val) => el && el.style.setProperty(prop, val, 'important');

    // --------------------------------------------------
    // THEME: pega a cor do guia (prioriza --guide-*)
    // --------------------------------------------------
    const rs = getComputedStyle(document.documentElement);

    const guideColor = (rs.getPropertyValue('--guide-color') || '').trim();
    const guideGlow1 = (rs.getPropertyValue('--guide-glow-1') || '').trim();
    const guideGlow2 = (rs.getPropertyValue('--guide-glow-2') || '').trim();

    // fallback (compatibilidade antiga)
    const progMain = (rs.getPropertyValue('--progress-main') || '').trim();
    const progGlow1 = (rs.getPropertyValue('--progress-glow-1') || '').trim();
    const progGlow2 = (rs.getPropertyValue('--progress-glow-2') || '').trim();

    // escolha final (se não existir guia ainda, cai no dourado)
    const MAIN = guideColor || progMain || '#ffd700';
    const G1   = guideGlow1 || progGlow1 || 'rgba(255,210,120,0.85)';
    const G2   = guideGlow2 || progGlow2 || 'rgba(255,230,150,0.25)';

    // --------------------------------------------------
    // 1) ESPAÇO NO TOPO EQUILIBRADO (mantido)
    // --------------------------------------------------
    const topBar = q('.progress-top');
    if (topBar) {
      setImp(topBar, 'margin-bottom', '100px');
    }

    const content = q(
      '.perguntas-wrap .perguntas-content, .perguntas-wrap .perg-content, ' +
      '.perguntas-wrap .pergunta-area, .perguntas-wrap .perguntas-inner, ' +
      '#section-perguntas .perguntas-content, #section-perguntas .perg-content'
    );

    if (content) {
      setImp(content, 'padding-top', '120px'); // mantém seu ajuste atual
      setImp(content, 'margin-top', '0px');
    } else {
      const perguntasWrap = q('.perguntas-wrap, .section-perguntas');
      if (perguntasWrap) setImp(perguntasWrap, 'padding-top', '40px');
    }

    const questionTitle2 = q('#jp-question-typed, .perguntas-titulo');
    if (questionTitle2) {
      setImp(questionTitle2, 'margin-top', '20px');
    }

    // --------------------------------------------------
    // 2) MARCADOR (container do label + badge) — tema do guia + layout preservado
    // --------------------------------------------------
    const middleContainer = q('.progress-middle');
    if (middleContainer) {
      setImp(middleContainer, 'position', 'relative');   // mantém seu desenho
      setImp(middleContainer, 'bottom', '-140px');       // mantém seu valor clássico
      setImp(middleContainer, 'left', 'auto');
      setImp(middleContainer, 'transform', 'none');
      setImp(middleContainer, 'margin', '18px auto 10px');
      setImp(middleContainer, 'z-index', '20');

      setImp(middleContainer, 'display', 'flex');
      setImp(middleContainer, 'align-items', 'center');
      setImp(middleContainer, 'justify-content', 'center');
      setImp(middleContainer, 'gap', '12px');
      setImp(middleContainer, 'padding', '8px 18px');
      setImp(middleContainer, 'background', 'rgba(0,0,0,0.45)');
      setImp(middleContainer, 'border-radius', '30px');

      // ✅ AQUI: usa a cor do guia (não dourado fixo)
      setImp(middleContainer, 'border', `2px solid ${MAIN}`);
      setImp(middleContainer, 'box-shadow',
        `0 0 18px ${MAIN}, ` +
        `0 0 30px ${G1}, ` +
        `0 6px 18px rgba(0,0,0,0.6)`
      );

      const label = q('.progress-middle .progress-label');
      if (label) {
        setImp(label, 'color', MAIN);
        setImp(label, 'font-weight', '700');
        setImp(label, 'text-shadow', `0 0 15px ${MAIN}`);
      }

      const badge = q('.progress-question-value');
      if (badge) {
        setImp(badge, 'color', MAIN);
        setImp(badge, 'font-weight', '700');
        setImp(badge, 'font-size', '18px');
        setImp(badge, 'text-shadow', `0 0 15px ${MAIN}`);
      }
    }

    // --------------------------------------------------
    // 3) GLOW NAS BARRAS — agora pega tema do guia
    // --------------------------------------------------
    const topFill = q('.progress-top .progress-fill, #progress-block-fill');
    const blockFill = q('.progress-question-fill');

    [topFill, blockFill].forEach(bar => {
      if (!bar) return;
      setImp(bar, 'background', MAIN);
      setImp(bar, 'box-shadow',
        `0 0 25px ${MAIN}, ` +
        `0 0 50px ${G1}, ` +
        `inset 0 0 35px ${G2}`
      );
    });

    // --------------------------------------------------
    // 3.1) BARRA "PERGUNTAS NO BLOCO" — FORA DO PERGAMINHO (tema do guia)
    // --------------------------------------------------
    const qBar = q('.progress-question, .progress-question-bar, .progress-question-wrap, #progress-question');
    if (qBar) {
      setImp(qBar, 'position', 'relative');
      setImp(qBar, 'top', '32px');
      setImp(qBar, 'margin', '0 auto 6px');
      setImp(qBar, 'z-index', '30');

      setImp(qBar, 'background', 'rgba(0,0,0,0.45)');
      setImp(qBar, 'border-radius', '999px');
      setImp(qBar, 'padding', '10px 18px');

      // ✅ tema do guia
      setImp(qBar, 'border', `2px solid ${MAIN}`);
      setImp(qBar, 'box-shadow',
        `0 0 20px ${MAIN}, ` +
        `0 0 36px ${G1}, ` +
        `inset 0 0 20px rgba(255,230,150,0.2)`
      );
    }

    // --------------------------------------------------
    // 4) Aura nos títulos — tema do guia
    // --------------------------------------------------
    const blockTitle = q('.titulo-bloco, h3');
    const questionTitle = q('#jp-question-typed, .perguntas-titulo');

    if (blockTitle) {
      setImp(blockTitle, 'color', MAIN);
      setImp(blockTitle, 'text-shadow',
        `0 0 15px ${MAIN}, 0 0 30px ${G1}`
      );
    }

    if (questionTitle) {
      setImp(questionTitle, 'text-shadow',
        `0 0 12px ${MAIN}, 0 0 25px ${G1}`
      );
    }

    console.log(MOD, 'v3.5 aplicado: tema do guia em todas as auras + layout equilibrado preservado');
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
