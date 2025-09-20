/* =========================================================
   jornada-typing-bridge.js
   Ponte entre o engine novo (JORNADA_TYPO) e o legado:
   - runTyping(root)  -> JORNADA_TYPO.typeAll(root)
   - speak()/readAloud() seguros via Web Speech
   - Reaplica datilografia quando o pergaminho muda
   ========================================================= */
;(function () {
  'use strict';

  // ---------- TTS seguro ----------
  if (!window.speak) {
    window.speak = function (text = '') {
      try {
        if (!('speechSynthesis' in window) || !text) return;
        try { window.speechSynthesis.cancel(); } catch (_) {}
        const cfg = (window.JORNADA && JORNADA.tts) || {};
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang  = cfg.lang  || 'pt-BR';
        u.rate  = Number(cfg.rate  ?? 1.06);
        u.pitch = Number(cfg.pitch ?? 1.0);
        window.speechSynthesis.speak(u);
      } catch (_) {}
    };
  }
  if (!window.readAloud) window.readAloud = (t) => window.speak(t);

  // ---------- Adapter: runTyping -> JORNADA_TYPO.typeAll ----------
 function runTypingAdapter(root) {
  try {
    const target =
      root ||
      document.getElementById('jornada-conteudo') ||
      document.querySelector('#jornada-conteudo') ||
      document;
    if (window.JORNADA_TYPE && typeof window.JORNADA_TYPE.run === 'function') {
      const cfg = (window.JORNADA && JORNADA.typing) || {};
      window.JORNADA_TYPE.run(target, {
        selector: '[data-typing]',
        speed: Number(cfg.charDelay ?? (window.JORNADA_TYPE.DEFAULTS && window.JORNADA_TYPE.DEFAULTS.speed) || 34),
        delay: 0,
        showCaret: Boolean(cfg.caret ?? (window.JORNADA_TYPE.DEFAULTS && window.JORNADA_TYPE.DEFAULTS.cursor) ?? true),
      });
    } else {
      console.warn('[TypingBridge] JORNADA_TYPE não disponível ou run não é função');
    }
  } catch (e) {
    console.error('[TypingBridge] Erro ao executar runTypingAdapter:', e);
  }
}
  if (!window.runTyping) window.runTyping = runTypingAdapter;

  // ---------- Auto reapply ----------
  function hookPergaminho() {
    const el =
      document.getElementById('jornada-conteudo') ||
      document.querySelector('#jornada-conteudo');
    if (!el) return;

    setTimeout(() => runTypingAdapter(el), 0);

    let t;
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => runTypingAdapter(el), 80);
    });
    mo.observe(el, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookPergaminho, { once: true });
  } else {
    hookPergaminho();
  }

  // reaplica quando navega de seção
  (function wrapShowSection() {
    const prev = window.showSection;
    if (typeof prev === 'function' && !prev.__wrapped) {
      window.showSection = function (id) {
        try { prev.apply(this, arguments); } finally {
          setTimeout(() => runTypingAdapter(), 60);
        }
      };
      window.showSection.__wrapped = true;
    }
  })();

  try { console.log('[TypingBridge] pronto'); } catch (_) {}
})();;
