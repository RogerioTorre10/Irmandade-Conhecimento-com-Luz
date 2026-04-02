/* ============================================
   jornada-typing-font.js — typewriter global
   Expondo: window.JORNADA_TYPO
   ============================================ */
const paperLog = (...args) => console.log('[JORNADA_TYPING_FONT]', ...args);

;(function () {
  'use strict';

  const DEFAULTS = {
    speed: 34,
    cursor: true,
    maxNodeChars: 750,
    maxTotalMs: 7500,
    selectors: [
      'h1', 'h2', 'h3', 'h4',
      'p', 'li', 'blockquote', 'figcaption',
      'label', '.lead', '.subtitle', '.cta'
    ],
  };

  const prefersReduced = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function typeOne(el, text, speed, withCursor) {
    return new Promise(resolve => {
      if (!el) return resolve();

      el.textContent = '';
      let i = 0;
      let cursor = null;

      if (withCursor) {
        cursor = document.createElement('span');
        cursor.className = 'tty-cursor';
        cursor.textContent = '▌';
        el.appendChild(cursor);
      }

      const step = () => {
        if (i < text.length) {
          el.insertBefore(document.createTextNode(text[i++]), cursor || null);
          setTimeout(step, speed);
        } else {
          if (cursor) cursor.remove();
          resolve();
        }
      };

      step();
    });
  }

  async function typeAll(containerSelector = '#jornada-conteudo', opts = {}) {
    const cfg = Object.assign({}, DEFAULTS, opts);
    const root = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!root) return;

    if (!cfg.force && prefersReduced()) return;

    const nodes = Array.from(root.querySelectorAll(cfg.selectors.join(',')));

    const totalChars = nodes.reduce((n, el) => n + (el.textContent || '').trim().length, 0);
    const estMs = totalChars * cfg.speed;
    const factor = estMs > cfg.maxTotalMs ? (cfg.maxTotalMs / estMs) : 1;
    const speed = Math.max(8, Math.round(cfg.speed / factor));

    for (const el of nodes) {
      const original = (el.getAttribute('data-tty-text') || el.textContent || '').trim();
      const text = original || (el.textContent || '').trim();
      el.setAttribute('data-tty-text', text);

      if (!text.length) continue;

      if (text.length > cfg.maxNodeChars) {
        el.textContent = text;
        continue;
      }

      await typeOne(el, text, speed, cfg.cursor);
    }
  }

  function typeText(target, text, speed = DEFAULTS.speed, withCursor = true) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return Promise.resolve();
    return typeOne(el, text ?? el.textContent ?? '', speed, withCursor);
  }

  window.JORNADA_TYPO = { typeAll, typeText, DEFAULTS };
  window.__JORNADA_TYPO_READY__ = true;
})();

// Compat: micro-boot espera window.JTyping
window.JTyping = window.JTyping || {
  run: async (sel = '#jornada-conteudo', opts = {}) => {
    const root = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!root) return;

    if (
      window.__TypingBridgeReady &&
      (
        root.matches?.('.section-intro, #section-intro, [data-use-typing-bridge="true"]') ||
        root.querySelector?.('[data-use-typing-bridge="true"]')
      )
    ) {
      paperLog('Bridge ativo na intro; typeAll global não será aplicado aqui.');
      return;
    }

    return window.JORNADA_TYPO.typeAll(root, opts);
  },
  typeAll: window.JORNADA_TYPO.typeAll,
  typeText: window.JORNADA_TYPO.typeText,
  DEFAULTS: window.JORNADA_TYPO.DEFAULTS
};

// Só define fallback leve para quem chamar runTyping()
// sem o bridge principal já carregado
if (!window.runTyping && !window.__TypingBridgeReady) {
  window.runTyping = (root) => window.JORNADA_TYPO.typeAll(root || '#jornada-conteudo');
}
