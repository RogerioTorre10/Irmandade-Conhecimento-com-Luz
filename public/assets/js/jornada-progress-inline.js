/* /assets/js/jornada-progress-inline.js
 * v2.0 — SOLUÇÃO DEFINITIVA: espaço garantido + contador 100% dinâmico do badge real
 */
(function () {
  'use strict';
  if (window.__JPROG_INLINE_BOUND__) return;
  window.__JPROG_INLINE_BOUND__ = true;
  const MOD = '[JPROG-INLINE]';
  let done = false;

  const byId = (id) => document.getElementById(id);
  const q = (sel, root = document) => root.querySelector(sel);

  // Função para achar o badge REAL que mostra o contador atual (ex: "1 / 3")
  function getCurrentQuestionCount() {
    // Prioridade: o badge pequeno que já aparece na barra
    const badge = byId('progress-question-value') || q('.progress-question-value');
    if (badge && badge.textContent.trim().match(/^\d+\s*\/\s*\d+$/)) {
      return badge.textContent.trim(); // ex: "1 / 3"
    }
    // Fallback: qualquer elemento com texto tipo "X / Y"
    const all = document.querySelectorAll('*');
    for (let el of all) {
      const text = el.textContent.trim();
      if (text.match(/^\d+\s*\/\s*\d+$/) && el.offsetParent !== null) {
        return text;
      }
    }
    return '1 / 3'; // último recurso
  }

  function forceTopSpace() {
    const topBar = q('.progress-top, .hud-top, .progress-header');
    if (topBar) {
      topBar.style.marginBottom = '100px !important';
      topBar.style.paddingBottom = '20px !important';
    }

    // Força espaço no container da pergunta/pergaminho
    const questionContainer = q('.perguntas-wrap, .jp-question-wrapper, .question-container, .perguntas-panel');
    if (questionContainer) {
      questionContainer.style.paddingTop = '120px !important';
      questionContainer.style.marginTop = '40px !important';
    }

    // Força o pergaminho rasgado a não cobrir
    const pergaminho = q('.pergaminho, .background-pergaminho, .torn-paper');
    if (pergaminho) {
      pergaminho.style.marginTop = '80px !important';
    }

    // Garante que a pergunta tenha margem superior
    const questionText = byId('jp-question-typed') || q('.perguntas-titulo, .question-text');
    if (questionText) {
      questionText.style.marginTop = '80px !important';
      questionText.style.paddingTop = '40px !important';
      questionText.style.position = 'relative';
      questionText.style.zIndex = '10';
    }
  }

  function updateBottomLabel(label) {
    if (!label) return;
    const count = getCurrentQuestionCount();
    label.textContent = `Perguntas no Bloco ${count}`;
    label.style.cssText += `
      white-space: nowrap !important;
      font-weight: 700 !important;
      font-size: 17px !important;
      color: var(--progress-main, #ffd700) !important;
      text-shadow: 0 0 15px var(--progress-main, #ffd700) !important;
      margin-right: 20px !important;
    `;
  }

  function applyGuiaAura() {
    const elements = [
      q('.progress-top .progress-fill, #progress-block-fill'),
      q('.progress-question-fill')
    ];
    elements.forEach(el => {
      if (el) {
        el.style.background = 'var(--progress-main, #ffd700) !important';
        el.style.boxShadow = `
          0 0 25px var(--progress-main, #ffd700),
          0 0 50px var(--progress-glow-1),
          inset 0 0 35px var(--progress-glow-2)
        !important`;
      }
    });
  }

  function relocateOnce() {
    if (done) return;

    const sec = byId('section-perguntas');
    if (!sec) return;

    const bar = byId('progress-question-fill') || q('.progress-question-fill');
    let label = q('.progress-middle .progress-label, .progress-middle');

    if (!bar) return;

    // Cria ou reutiliza wrapper inferior
    let wrap = byId('progress-inline-bottom');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'progress-inline-bottom';
      wrap.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 0 !important;
        margin: 30px auto 22px !important;
        padding: 16px 32px !important;
        background: rgba(0,0,0,0.65) !important;
        border-radius: 60px !important;
        box-shadow: 
          0 0 30px var(--progress-main, #ffd700),
          0 0 60px var(--progress-glow-1),
          0 10px 30px rgba(0,0,0,0.9) !important;
        border: 3px solid var(--progress-main, #ffd700) !important;
        z-index: 30 !important;
      `;
    }
    wrap.innerHTML = '';

    // Cria label novo se o antigo não for bom
    if (!label || label.textContent.includes('10')) {
      label = document.createElement('div');
      label.className = 'progress-bottom-label';
    }

    updateBottomLabel(label);

    wrap.appendChild(label);
    wrap.appendChild(bar);

    // Insere acima dos botões
    const controls = q('.perguntas-controls, .jp-controls, #jp-buttons-wrapper');
    if (controls && controls.parentNode) {
      controls.insertAdjacentElement('beforebegin', wrap);
    } else {
      sec.appendChild(wrap);
    }

    // === FORÇA ESPAÇO NO TOPO COM VIOLÊNCIA (MAS NECESSÁRIA) ===
    forceTopSpace();

    applyGuiaAura();

    done = true;
    console.log(MOD, 'SOLUÇÃO DEFINITIVA aplicada: espaço forçado + contador dinâmico real');
  }

  const tryRelocate = () => {
    if (done) return;
    const sec = byId('section-perguntas');
    if (sec && !sec.classList.contains('hidden')) {
      relocateOnce();
    }
  };

  // Atualiza contador ao mudar pergunta
  document.addEventListener('perguntas:state-changed', () => {
    const label = q('.progress-bottom-label') || q('.progress-middle .progress-label');
    updateBottomLabel(label);
    applyGuiaAura();
    forceTopSpace(); // reforça sempre
  });

  document.addEventListener('guia:changed', () => {
    applyGuiaAura();
    forceTopSpace();
  });

  // Gatilhos
  document.addEventListener('DOMContentLoaded', tryRelocate);
  document.addEventListener('sectionLoaded', () => setTimeout(tryRelocate, 200));
  window.addEventListener('load', () => setTimeout(tryRelocate, 500));
  window.addEventListener('resize', () => {
    if (done) forceTopSpace();
    setTimeout(tryRelocate, 300);
  });

  tryRelocate();
})();
