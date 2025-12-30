/* /assets/js/jornada-progress-inline.js
 * v1.8 — Versão FINAL: contador em linha única, aura total do guia, sem sobreposição
 */
(function () {
  'use strict';
  if (window.__JPROG_INLINE_BOUND__) return;
  window.__JPROG_INLINE_BOUND__ = true;
  const MOD = '[JPROG-INLINE]';
  let done = false;

  const byId = (id) => document.getElementById(id);
  const q = (sel, root = document) => root.querySelector(sel);

  function findBadge() {
    return byId('progress-question-value') || q('.progress-question-value');
  }
  function findBar() {
    return byId('progress-question-fill') || q('.progress-question-fill');
  }
  function findLabel() {
    return q('.progress-middle .progress-label') || q('.progress-middle');
  }

  function applyGuiaAura() {
    const guia = (document.body.getAttribute('data-guia') || 'default').toLowerCase();

    // Aplica aura no título do bloco e na pergunta (sutil)
    const blockTitle = q('.titulo-bloco, h3, .bloco-titulo');
    const questionTitle = byId('jp-question-typed') || q('.perguntas-titulo, .question-text');

    if (blockTitle) {
      blockTitle.style.textShadow = `
        0 0 10px var(--progress-main, #ffd700),
        0 0 20px var(--progress-glow-1, rgba(255,210,120,0.85))
      `;
      blockTitle.style.color = 'var(--progress-main, #ffd700)';
    }
    if (questionTitle) {
      questionTitle.style.textShadow = `
        0 0 8px var(--progress-main, #ffd700),
        0 0 16px var(--progress-glow-1, rgba(255,210,120,0.85))
      `;
    }

    // Barra superior (blocos)
    const topFill = q('.progress-top .progress-fill, #progress-block-fill');
    if (topFill) {
      topFill.style.background = 'var(--progress-main, #ffd700) !important';
      topFill.style.boxShadow = `
        0 0 20px var(--progress-main, #ffd700),
        0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85)),
        inset 0 0 30px var(--progress-glow-2, rgba(255,210,120,0.75))
      !important`;
      topFill.style.animation = 'barra-glow 4s infinite alternate !important';
    }

    // Barra inferior (perguntas no bloco)
    const bottomBar = findBar();
    if (bottomBar) {
      bottomBar.style.background = 'var(--progress-main, #ffd700) !important';
      bottomBar.style.boxShadow = `
        0 0 20px var(--progress-main, #ffd700),
        0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85)),
        inset 0 0 30px var(--progress-glow-2, rgba(255,210,120,0.75))
      !important`;
      bottomBar.style.animation = 'barra-glow 4s infinite alternate !important';
    }
  }

  function relocateOnce() {
    if (done) return;

    const sec = byId('section-perguntas');
    if (!sec) return;

    const badge = findBadge();
    const bar = findBar();
    let label = findLabel();

    if (!badge || !bar) return;

    // === MODIFICA O LABEL PARA FICAR EM UMA LINHA SÓ ===
    if (label) {
      // Força o texto em uma linha: "Perguntas no Bloco 1 / 3"
      const currentText = label.textContent || 'Perguntas no Bloco';
      const currentValue = badge.textContent || '1 / 3';
      label.textContent = `${currentText} ${currentValue}`;
      label.style.whiteSpace = 'nowrap';
      label.style.fontWeight = '600';
      label.style.marginRight = '12px';
    }

    let wrap = byId('progress-inline-bottom');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'progress-inline-bottom';
      wrap.className = 'progress-inline progress-bottom-inline';
      wrap.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 0 !important;
        margin: 24px auto 18px !important;
        width: fit-content !important;
        max-width: 90% !important;
        padding: 12px 24px !important;
        background: rgba(0,0,0,0.55) !important;
        border-radius: 40px !important;
        box-shadow: 
          0 0 20px var(--progress-main, #ffd700),
          0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85)),
          0 6px 20px rgba(0,0,0,0.8) !important;
        z-index: 20 !important;
        animation: barra-glow 4s infinite alternate !important;
        border: 1px solid var(--progress-main, #ffd700);
      `;
    } else {
      wrap.innerHTML = '';
    }

    // Ordem: só label (já com o contador dentro) + barra
    wrap.appendChild(label);
    wrap.appendChild(bar);
    // badge não precisa mais aparecer separado

    // Posiciona logo acima dos botões
    const controls = q('.perguntas-controls, .jp-controls, .bottom-buttons, #jp-buttons-wrapper');
    if (controls && controls.parentNode) {
      controls.insertAdjacentElement('beforebegin', wrap);
    } else {
      sec.appendChild(wrap);
    }

    // === ESPAÇO EXTRA NO TOPO PARA NÃO COBRIR A PERGUNTA ===
    const topBar = q('.progress-top');
    if (topBar) {
      topBar.style.marginBottom = '40px'; // dá respiro total para a pergunta
    }

    // Aplica aura completa do guia
    applyGuiaAura();

    done = true;
    console.log(MOD, 'Versão FINAL: contador em linha única, aura total do guia, sem sobreposição.');
  }

  const tryRelocate = () => {
    if (done) return;
    const sec = byId('section-perguntas');
    if (sec && (sec.dataset.initialized === 'true' || !sec.classList.contains('hidden'))) {
      relocateOnce();
    }
  };

  // Gatilhos
  document.addEventListener('DOMContentLoaded', tryRelocate);
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId === 'section-perguntas') setTimeout(tryRelocate, 150);
  });
  document.addEventListener('perguntas:state-changed', () => {
    // Atualiza o texto do label quando mudar pergunta
    if (!done) tryRelocate();
    else {
      const label = findLabel();
      const badge = findBadge();
      if (label && badge) {
        label.textContent = `Perguntas no Bloco ${badge.textContent}`;
      }
      applyGuiaAura();
    }
  });
  document.addEventListener('guia:changed', () => {
    applyGuiaAura();
    const wrap = byId('progress-inline-bottom');
    if (wrap) {
      wrap.style.boxShadow = `
        0 0 20px var(--progress-main, #ffd700),
        0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85)),
        0 6px 20px rgba(0,0,0,0.8)
      !important`;
      wrap.style.borderColor = 'var(--progress-main, #ffd700)';
    }
  });
  window.addEventListener('resize', () => setTimeout(tryRelocate, 250));

  tryRelocate();
})();
