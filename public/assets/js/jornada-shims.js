(async function () {
  'use strict';
  console.log('[SHIMS] Aplicando shims v5.4...');

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  window.console = window.console || { log() {}, warn() {}, error() {} };
  const HIDE_CLASS = 'section-hidden';

  if (!q('#jornada-shims-style')) {
    const st = document.createElement('style');
    st.id = 'jornada-shims-style';
    st.textContent = `
      .${HIDE_CLASS} { display: none !important; }
      section[id^="section-"] { width: 100%; }
    `;
    document.head.appendChild(st);
  }

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

  window.handleInput = window.handleInput || function handleInput(ev) {
    try {
      const el = ev?.target;
      if (!el) return;
      const max = parseInt(el.getAttribute('maxlength') || '0', 10);
      if (max > 0 && el.value.length > max) el.value = el.value.slice(0, max);
      el.dataset.touched = '1';
    } catch (e) {
      console.error('[SHIMS] handleInput erro:', e);
    }
  };

  window.JORNADA_TYPE = window.JORNADA_TYPE || {
    run(rootSelector = '#perguntas-container') {
      try {
        const root = typeof rootSelector === 'string' ? q(rootSelector) : rootSelector;
        if (!root) return console.warn('[JORNADA_TYPE] root não encontrado');

        const firstText = q('[data-type="texto"], .j-texto, p, .typing', root);
        if (firstText) {
          if (window.TypingBridge?.play) {
            window.TypingBridge.play(firstText);
          } else if (window.typeTextOnce) {
            const text = firstText.dataset.text || firstText.textContent || '';
            window.typeTextOnce(firstText, text, 40);
          }
        }

        qa('textarea, input[type="text"], input[type="search"]', root).forEach(el => {
          el.removeEventListener('input', window.handleInput);
          el.addEventListener('input', window.handleInput);
        });

        console.log('[JORNADA_TYPE] run concluído');
      } catch (e) {
        console.error('[JORNADA_TYPE] erro:', e);
      }
    }
  };
})();

(function () {
  const SELECTOR = '[data-section]';
  const HIDE_CLASS = 'hidden';
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
    if (!el) {
      window.toast?.(`Seção ${id} não encontrada`);
      return;
    }
    hideAll();
    el.classList.remove(HIDE_CLASS);
    el.removeAttribute('aria-hidden');
    window.scrollTo(0, 0);
    window.G.__typingLock = false;
    console.log('[showSection] →', id);
  }

  window.showSection = show;
  window.JC = window.JC || {};
  if (typeof window.JC.show !== 'function') window.JC.show = show;
  if (typeof window.JC.goNext !== 'function') {
    window.JC.goNext = function (nextId) {
      console.log('[JC.goNext]', nextId || '(sem destino)');
      if (nextId) show(nextId);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const anyVisible = Array.from(document.querySelectorAll(SELECTOR))
      .some(s => !s.classList.contains(HIDE_CLASS));
    if (!anyVisible && document.getElementById('section-intro')) {
      show('section-intro');
    }
  });

  console.log('[SHIMS] v5.5 aplicados');
})();
