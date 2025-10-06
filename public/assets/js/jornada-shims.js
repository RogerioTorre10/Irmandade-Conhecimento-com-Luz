(async function () {
  'use strict';
  console.log('[SHIMS] Aplicando shims v5.4...');

  // Helpers leves
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Evita quebra se console não existir
  window.console = window.console || { log() {}, warn() {}, error() {} };

  // Classe usada para esconder seções
  const HIDE_CLASS = 'section-hidden';

  // Garante a classe CSS básica
  if (!q('#jornada-shims-style')) {
    const st = document.createElement('style');
    st.id = 'jornada-shims-style';
    st.textContent = `
      .${HIDE_CLASS} { display: none !important; }
      section[id^="section-"] { width: 100%; }
    `;
    document.head.appendChild(st);
  }

  // Shims para módulos ausentes
  window.CONFIG = window.CONFIG || {};
  window.JUtils = window.JUtils || {};
  window.JCore = window.JCore || {};
  window.JAuth = window.JAuth || {};
  window.JChama = window.JChama || {};
  window.JPaperQA = window.JPaperQA || {};
  window.JTyping = window.JTyping || {};
  window.JController = window.JController || {};
  window.JRender = window.JRender || {};
  window.JBootstrap = window.JBootstrap || {};
  window.JMicro = window.JMicro || {};
  window.i18n = window.i18n || {};
  window.API = window.API || { base: (window.API_BASE || '') };

  // Handler leve para inputs
  window.handleInput = window.handleInput || function handleInput(ev) {
    try {
      const el = ev && ev.target ? ev.target : null;
      if (!el) return;
      const max = parseInt(el.getAttribute('maxlength') || '0', 10);
      if (max > 0 && el.value.length > max) el.value = el.value.slice(0, max);
      el.dataset.touched = '1';
    } catch (e) {
      console.error('[SHIMS] handleInput erro:', e);
    }
  };

  // Ponte mínima para datilografia
  window.JORNADA_TYPE = window.JORNADA_TYPE || {
    run(rootSelector = '#perguntas-container') {
      try {
        const root = (typeof rootSelector === 'string')
          ? (window.q ? window.q(rootSelector) : document.querySelector(rootSelector))
          : rootSelector;
        if (!root) {
          console.warn('[JORNADA_TYPE] root não encontrado');
          return;
        }
        const firstText = (window.q ? window.q('[data-type="texto"], .j-texto, p, .typing', root)
          : root.querySelector('[data-type="texto"], .j-texto, p, .typing'));
        if (firstText) {
          if (window.TypingBridge && typeof window.TypingBridge.play === 'function') {
            window.TypingBridge.play(firstText);
          } else if (window.typeTextOnce) {
            const text = firstText.getAttribute('data-text') || firstText.textContent || '';
            window.typeTextOnce(firstText, text, 40);
          }
        }
        const inputs = (window.qa ? window.qa('textarea, input[type="text"], input[type="search"]', root)
          : Array.from(root.querySelectorAll('textarea, input[type="text"], input[type="search"]')));
        inputs.forEach(el => {
          el.removeEventListener('input', window.handleInput);
          el.addEventListener('input', window.handleInput);
        });
        console.log('[JORNADA_TYPE] run concluído');
      } catch (e) {
        console.error('[JORNADA_TYPE] erro:', e);
      }
    }
  };

// jornada-shims.js — SHIMS UNIFICADOS (v5.5)
(function () {
  const SELECTOR = '[data-section]';
  const HIDE_CLASS = 'hidden';

  // evita travas antigas de typing
  window.G = window.G || {};
  window.G.__typingLock = false;

  function hideAll() {
    document.querySelectorAll(SELECTOR).forEach(s => {
      s.classList.add(HIDE_CLASS);
      s.setAttribute('aria-hidden', 'true');
    });
  }

  function show(id) {
    const el = document.getElementById(id);
    if (!el) { window.toast && window.toast(`Seção ${id} não encontrada`); return; }
    hideAll();
    el.classList.remove(HIDE_CLASS);
    el.removeAttribute('aria-hidden');
    window.scrollTo(0, 0);
    window.G.__typingLock = false; // solta qualquer lock antigo
    console.log('[showSection] →', id);
  }

  // Ponto único de navegação
  window.showSection = show;

  // Wrapper JC.* (só define se não existir)
  window.JC = window.JC || {};
  if (typeof window.JC.show !== 'function') window.JC.show = show;
  if (typeof window.JC.goNext !== 'function') {
    window.JC.goNext = function (nextId) {
      console.log('[JC.goNext]', nextId || '(sem destino)');
      if (nextId) show(nextId);
    };
  }

  // Seção inicial: se nenhuma visível, abre a intro
  document.addEventListener('DOMContentLoaded', () => {
    const anyVisible = Array.from(document.querySelectorAll(SELECTOR))
      .some(s => !s.classList.contains(HIDE_CLASS));
    if (!anyVisible && document.getElementById('section-intro')) {
      show('section-intro');
    }
  });

  console.log('[SHIMS] v5.5 aplicados');
})();
  


