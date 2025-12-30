/* /assets/js/jornada-progress-inline.js
 * v1.6 — Correção de posicionamento + glow do guia dinâmico + anti-sobreposição
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
        margin: 12px auto 16px !important; /* Espaço extra abaixo do título do bloco */
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
    // Ordem: label + barra + badge (contador junto da barra)
    wrap.appendChild(label);
    wrap.appendChild(bar);
    wrap.appendChild(badge);
    // POSICIONAMENTO CORRETO: logo abaixo do título do bloco (não da pergunta), para ficar acima da pergunta e evitar sobreposição
    const blockTitle = q('.titulo-bloco, h3, .bloco-titulo'); // Seletor para o título "Bloco 1 - Raízes"
    if (blockTitle && blockTitle.parentNode) {
      blockTitle.insertAdjacentElement('afterend', wrap);
    } else {
      // Fallback: abaixo da barra superior
      const topBar = q('.progress-top');
      if (topBar) topBar.insertAdjacentElement('afterend', wrap);
      else sec.insertBefore(wrap, sec.firstChild.nextSibling); // Logo abaixo da HUD superior
    }
    // Adiciona margem na barra superior para descolar da pergunta (anti-sobreposição)
    const topBar = q('.progress-top');
    if (topBar) {
      topBar.style.marginBottom = '18px'; // Espaço extra abaixo da barra superior
    }
    // Reforça glow do guia DINÂMICO (usa variáveis CSS, não hardcode)
    const guia = (document.body.getAttribute('data-guia') || 'default').toLowerCase();
    if (bar) {
      bar.style.background = 'var(--progress-main, #ffd700)'; // Fallback dourado
      bar.style.boxShadow = `
        var(--progress-glow-1, 0 0 20px #ffd700),
        var(--progress-glow-2, 0 0 40px rgba(255,210,120,0.75))
      `;
      // Aplica também na barra superior para consistência
      const topFill = q('.progress-top .progress-fill');
      if (topFill) {
        topFill.style.background = bar.style.background;
        topFill.style.boxShadow = bar.style.boxShadow;
      }
    }
    done = true;
    console.log(MOD, 'Barra reposicionada: abaixo do título do bloco, com glow do guia e anti-sobreposição.');
  }
  // Executa quando a seção estiver pronta
  const tryRelocate = () => {
    if (done) return;
    const sec = byId('section-perguntas');
    if (sec && (sec.dataset.initialized === 'true' || !sec.classList.contains('hidden'))) {
      relocateOnce();
    }
  };
  // Múltiplos gatilhos + re-aplicação ao mudar guia/pergunta
  document.addEventListener('DOMContentLoaded', tryRelocate);
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId === 'section-perguntas') setTimeout(tryRelocate, 100);
  });
  document.addEventListener('guia:changed', tryRelocate); // Reaplica glow se guia mudar
  window.addEventListener('resize', () => setTimeout(tryRelocate, 200));
  tryRelocate();
})();
