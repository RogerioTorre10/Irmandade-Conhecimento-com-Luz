/* /assets/js/jornada-progress-inline.js
 * v1.5 — Posicionamento fixo correto + auras preservadas em qualquer tela
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

  function relocateOnce() {
    if (done) return;

    const sec = byId('section-perguntas');
    if (!sec) return;

    const badge = findBadge();
    const bar = findBar();
    const label = findLabel();

    if (!badge || !bar || !label) return;

    let wrap = byId('progress-inline');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'progress-inline';
      wrap.className = 'progress-inline progress-middle-inline';
      wrap.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
        margin: 20px auto !important;
        width: fit-content !important;
        padding: 8px 16px !important;
        background: rgba(0,0,0,0.4) !important;
        border-radius: 20px !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6) !important;
        z-index: 10 !important;
      `;
    } else {
      wrap.innerHTML = '';
    }

    // Ordem: label + barra + badge
    wrap.appendChild(label);
    wrap.appendChild(bar);
    wrap.appendChild(badge);

    // POSICIONAMENTO FIXO: sempre logo abaixo do título da pergunta
    const title = byId('jp-question-typed') || q('.perguntas-titulo');
    if (title && title.parentNode) {
      title.insertAdjacentElement('afterend', wrap);
    } else {
      sec.insertBefore(wrap, sec.children[2] || sec.firstChild);
    }

    // Reforça aura do guia na barra (caso CSS não pegue após mover)
    const guia = (document.body.getAttribute('data-guia') || 'lumen').toLowerCase();
    let glow = '';
    if (guia === 'lumen') glow = '0 0 20px #00ff9d, 0 0 40px rgba(0,255,157,0.8)';
    if (guia === 'zion') glow = '0 0 20px #00aaff, 0 0 40px rgba(0,170,255,0.8)';
    if (guia === 'arian') glow = '0 0 25px #ff00ff, 0 0 50px rgba(255,120,255,0.9)';

    if (glow && bar) {
      bar.style.boxShadow = glow;
      bar.style.background = 'var(--progress-main, #00ff9d)';
    }

    done = true;
    console.log(MOD, 'Barra reposicionada corretamente em qualquer tela.');
  }

  // Executa quando a seção estiver pronta
  const tryRelocate = () => {
    if (done) return;
    const sec = byId('section-perguntas');
    if (sec && (sec.dataset.initialized === 'true' || !sec.classList.contains('hidden'))) {
      relocateOnce();
    }
  };

  // Múltiplos gatilhos
  document.addEventListener('DOMContentLoaded', tryRelocate);
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId === 'section-perguntas') setTimeout(tryRelocate, 100);
  });
  window.addEventListener('resize', () => setTimeout(tryRelocate, 200)); // reposiciona ao redimensionar

  tryRelocate();
})();
