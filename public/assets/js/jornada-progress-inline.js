/* /assets/js/jornada-progress-inline.js
 * v1.7 — Contador de perguntas movido para BAIXO (próximo dos botões) + glow perfeito
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
    return q('.progress-middle .progress-label') || q('.progress-middle .progress-label-text') || q('.progress-middle');
  }

  function relocateOnce() {
    if (done) return;

    const sec = byId('section-perguntas');
    if (!sec) return;

    const badge = findBadge();
    const bar = findBar();
    const label = findLabel();

    if (!badge || !bar || !label) return;

    let wrap = byId('progress-inline-bottom');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'progress-inline-bottom';
      wrap.className = 'progress-inline progress-bottom-inline';
      wrap.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 12px !important;
        margin: 20px auto 16px !important; /* Espaço acima dos botões */
        width: fit-content !important;
        max-width: 90% !important;
        padding: 10px 20px !important;
        background: rgba(0,0,0,0.5) !important;
        border-radius: 30px !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.7) !important;
        z-index: 15 !important;
        font-size: 15px !important;
      `;
    } else {
      wrap.innerHTML = '';
    }

    // Ordem: label + barra + badge
    wrap.appendChild(label);
    wrap.appendChild(bar);
    wrap.appendChild(badge);

    // POSICIONAMENTO FINAL: logo acima dos botões inferiores
    const controls = q('.perguntas-controls, .jp-controls, .bottom-buttons, #jp-buttons-wrapper');
    if (controls && controls.parentNode) {
      controls.insertAdjacentElement('beforebegin', wrap);
    } else {
      // Fallback: acima da base da seção
      const bottomHud = q('.progress-bottom, .hud-bottom');
      if (bottomHud) {
        bottomHud.insertAdjacentElement('beforebegin', wrap);
      } else {
        sec.appendChild(wrap); // último recurso
      }
    }

    // Garante espaço extra no topo para evitar qualquer sobreposição residual
    const topBar = q('.progress-top');
    if (topBar) {
      topBar.style.marginBottom = '30px';
    }

    // Glow do guia dinâmico e pulsante (usa variáveis CSS + reforço)
    if (bar) {
      bar.style.background = 'var(--progress-main, #ffd700) !important';
      bar.style.boxShadow = `
        0 0 20px var(--progress-main, #ffd700),
        0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85)),
        inset 0 0 25px var(--progress-glow-2, rgba(255,210,120,0.75))
      !important`;

      // Adiciona pulsação sutil (já tem animação no CSS, mas reforça)
      bar.style.animation = 'barra-glow 4s infinite alternate !important';
    }

    // Aplica glow também no wrapper para ficar mágico
    wrap.style.boxShadow = `
      0 0 20px var(--progress-main, #ffd700),
      0 0 40px var(--progress-glow-1, rgba(255,210,120,0.85))
    !important`;

    done = true;
    console.log(MOD, 'Contador de perguntas movido para BAIXO (próximo dos botões) com glow do guia aplicado.');
  }

  const tryRelocate = () => {
    if (done) return;
    const sec = byId('section-perguntas');
    if (sec && (sec.dataset.initialized === 'true' || !sec.classList.contains('hidden'))) {
      relocateOnce();
    }
  };

  // Gatilhos múltiplos + reaplicação ao mudar pergunta/guia
  document.addEventListener('DOMContentLoaded', tryRelocate);
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId === 'section-perguntas') setTimeout(tryRelocate, 150);
  });
  document.addEventListener('perguntas:state-changed', tryRelocate);
  document.addEventListener('guia:changed', tryRelocate);
  window.addEventListener('resize', () => setTimeout(tryRelocate, 250));

  tryRelocate();
})();
