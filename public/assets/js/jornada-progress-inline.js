/* /assets/js/jornada-progress-inline.js
 * v1.9 — VERSÃO FINAL: espaço total no topo + contador dinâmico correto (ex: 2 / 3)
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

  function updateBottomLabel() {
    const badge = findBadge();
    const label = findLabel();
    if (!badge || !label) return;

    // Pega o valor real do contador (ex: "2 / 3" ou "1 / 14")
    const countText = badge.textContent.trim(); // ex: "2 / 3"

    // Atualiza o label para "Perguntas no Bloco 2 / 3"
    label.textContent = `Perguntas no Bloco ${countText}`;
    label.style.whiteSpace = 'nowrap';
    label.style.fontWeight = '600';
    label.style.marginRight = '16px';
    label.style.fontSize = '16px';
  }

  function applyGuiaAura() {
    // Aura nos títulos (bloco e pergunta)
    const blockTitle = q('.titulo-bloco, h3, .bloco-titulo');
    const questionTitle = byId('jp-question-typed') || q('.perguntas-titulo, .question-text');

    if (blockTitle) {
      blockTitle.style.textShadow = `0 0 12px var(--progress-main, #ffd700), 0 0 24px var(--progress-glow-1)`;
      blockTitle.style.color = 'var(--progress-main, #ffd700)';
    }
    if (questionTitle) {
      questionTitle.style.textShadow = `0 0 10px var(--progress-main, #ffd700), 0 0 20px var(--progress-glow-1)`;
    }

    // Barras com glow forte
    ['.progress-top .progress-fill, #progress-block-fill', '.progress-question-fill'].forEach(selector => {
      const el = q(selector);
      if (el) {
        el.style.background = 'var(--progress-main, #ffd700) !important';
        el.style.boxShadow = `
          0 0 20px var(--progress-main, #ffd700),
          0 0 40px var(--progress-glow-1),
          inset 0 0 30px var(--progress-glow-2)
        !important`;
        el.style.animation = 'barra-glow 4s infinite alternate';
      }
    });
  }

  function relocateOnce() {
    if (done) return;

    const sec = byId('section-perguntas');
    if (!sec) return;

    const badge = findBadge();
    const bar = findBar();
    let label = findLabel();

    if (!badge || !bar || !label) return;

    // Atualiza o label com o contador real
    updateBottomLabel();

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
        margin: 28px auto 20px !important;
        width: fit-content !important;
        padding: 14px 28px !important;
        background: rgba(0,0,0,0.6) !important;
        border-radius: 50px !important;
        box-shadow: 
          0 0 25px var(--progress-main, #ffd700),
          0 0 50px var(--progress-glow-1),
          0 8px 25px rgba(0,0,0,0.8) !important;
        border: 2px solid var(--progress-main, #ffd700);
        z-index: 20 !important;
        animation: barra-glow 4s infinite alternate;
      `;
    } else {
      wrap.innerHTML = '';
    }

    wrap.appendChild(label);
    wrap.appendChild(bar);

    // Posiciona acima dos botões
    const controls = q('.perguntas-controls, .jp-controls, .bottom-buttons, #jp-buttons-wrapper');
    if (controls && controls.parentNode) {
      controls.insertAdjacentElement('beforebegin', wrap);
    } else {
      sec.appendChild(wrap);
    }

    // === ESPAÇO EXTRA NO TOPO PARA A PERGUNTA RESPIRAR ===
    const topBar = q('.progress-top');
    if (topBar) {
      topBar.style.marginBottom = '60px'; // Agora sim, espaço total!
    }

    applyGuiaAura();

    done = true;
    console.log(MOD, 'VERSÃO FINAL: espaço total no topo + contador dinâmico correto (ex: 2 / 3)');
  }

  const tryRelocate = () => {
    if (done) return;
    const sec = byId('section-perguntas');
    if (sec && (sec.dataset.initialized === 'true' || !sec.classList.contains('hidden'))) {
      relocateOnce();
    }
  };

  // Atualiza o contador sempre que mudar pergunta
  document.addEventListener('perguntas:state-changed', () => {
    updateBottomLabel();
    applyGuiaAura();
  });

  document.addEventListener('guia:changed', applyGuiaAura);

  // Gatilhos iniciais
  document.addEventListener('DOMContentLoaded', tryRelocate);
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId === 'section-perguntas') setTimeout(tryRelocate, 200);
  });
  window.addEventListener('resize', () => setTimeout(tryRelocate, 300));

  tryRelocate();
})();
