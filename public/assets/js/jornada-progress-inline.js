/* /assets/js/jornada-progress-inline.js
 * v3.1 — VERSÃO FINAL COM !important REAL + marcador perto dos botões + espaço no pergaminho
 */
(function () {
  'use strict';
  if (window.__JPROG_INLINE_BOUND__) return;
  window.__JPROG_INLINE_BOUND__ = true;
  const MOD = '[JPROG-INLINE]';

  const q = (sel) => document.querySelector(sel);

  function applyImprovements() {
    const setImp = (el, prop, val) => el && el.style.setProperty(prop, val, 'important');

    // 1) ESPAÇO NO TOPO: barra superior + conteúdo da pergunta desce
    const topBar = q('.progress-top');
    if (topBar) {
      setImp(topBar, 'margin-bottom', '18px'); // só um respiro; o "desce tudo" vai no conteúdo
    }

    // 🔽 ESTE É O PONTO-CHAVE: desce o CONJUNTO do conteúdo (títulos + pergunta)
    const content = q(
      '.perguntas-wrap .perguntas-content, .perguntas-wrap .perg-content, ' +
      '.perguntas-wrap .pergunta-area, .perguntas-wrap .perguntas-inner, ' +
      '#section-perguntas .perguntas-content, #section-perguntas .perg-content'
    );
       if (content) {
      setImp(content, 'padding-top', '80px'); // AUMENTADO: desce mais o conteúdo da pergunta
      setImp(content, 'margin-top', '20px'); // reforço maior
    } else {
      // fallback: se não achar o content, desce o wrap
      const perguntasWrap = q('.perguntas-wrap, .section-perguntas');
      if (perguntasWrap) setImp(perguntasWrap, 'padding-top', '100px'); // AUMENTADO forte
    }

    // 2) MARCADOR "PERGUNTAS NO BLOCO" deve ficar perto dos botões (acima da barra inferior)
    const middleContainer = q('.progress-middle');
    if (middleContainer) {
      // fixa no "rodapé" do pergaminho, acima dos botões
      setImp(middleContainer, 'position', 'absolute');
      setImp(middleContainer, 'left', '50%');
      setImp(middleContainer, 'transform', 'translateX(-50%)');
      setImp(middleContainer, 'bottom', '2px'); // ajuste fino: experimente 80px a 110px se precisar subir/descer mais
      setImp(middleContainer, 'z-index', '40');

      // mantém estilo bonito com glow do guia
      setImp(middleContainer, 'display', 'flex');
      setImp(middleContainer, 'align-items', 'center');
      setImp(middleContainer, 'justify-content', 'center');
      setImp(middleContainer, 'gap', '12px');
      setImp(middleContainer, 'padding', '10px 20px');
      setImp(middleContainer, 'background', 'rgba(0,0,0,0.50)');
      setImp(middleContainer, 'border-radius', '30px');
      setImp(middleContainer, 'border', '2px solid var(--progress-main, #ffd700)');
      setImp(middleContainer, 'box-shadow',
        '0 0 20px var(--progress-main, #ffd700), ' +
        '0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85)), ' +
        '0 6px 20px rgba(0,0,0,0.7)'
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

    // 3) GLOW NAS BARRAS (superior e do bloco)
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

    // 4) Aura nos títulos
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

    console.log(MOD, 'Melhorias aplicadas: layout (desceu) + marcador no rodapé + glow do guia');
  }

  // Executa quando a seção aparece
  const tryApply = () => {
    const sec = document.getElementById('section-perguntas');
    if (sec && !sec.classList.contains('hidden')) {
      applyImprovements();
    }
  };

  // Gatilhos múltiplos
  document.addEventListener('DOMContentLoaded', tryApply);
  document.addEventListener('sectionLoaded', () => setTimeout(tryApply, 200));
  document.addEventListener('perguntas:state-changed', applyImprovements);
  document.addEventListener('guia:changed', applyImprovements);
  window.addEventListener('resize', () => setTimeout(applyImprovements, 200));

  tryApply();
})();
