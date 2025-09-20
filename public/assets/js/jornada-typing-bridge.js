/* =========================================================
   jornada-typing-bridge.js
   Ponte entre o engine novo (JORNADA_TYPE) e o legado:
   - runTyping(root)  -> JORNADA_TYPE.run(root)
   - speak()/readAloud() seguros via Web Speech
   - Reaplica datilografia quando o pergaminho muda
   ========================================================= */
;(function () {
  'use strict';
  console.log('[TypingBridge] Iniciando carregamento do script...');

  // Definir runTypingAdapter como fallback
  if (!window.runTypingAdapter) {
    window.runTypingAdapter = function (root) {
      console.warn('[TypingBridge] runTypingAdapter chamado antes da inicialização completa');
    };
  }

  // ---------- TTS seguro ----------
  if (!window.speak) {
    window.speak = function (text = '') {
      try {
        if (!('speechSynthesis' in window) || !text) {
          console.warn('[TypingBridge] SpeechSynthesis não disponível ou texto vazio');
          return;
        }
        window.speechSynthesis.cancel();
        const cfg = (window.JORNADA && JORNADA.tts) || {};
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = cfg.lang || 'pt-BR';
        u.rate = Number(cfg.rate ?? 1.06);
        u.pitch = Number(cfg.pitch ?? 1.0);
        window.speechSynthesis.speak(u);
      } catch (e) {
        console.error('[TypingBridge] Erro no speak:', e);
      }
    };
  }
  if (!window.readAloud) window.readAloud = (t) => window.speak(t);

  // ---------- Adapter: runTyping -> JORNADA_TYPE.run ----------
  function runTypingAdapter(root) {
    try {
      console.log('[TypingBridge] Executando runTypingAdapter com root:', root);
      const target =
        root ||
        document.getElementById('jornada-conteudo') ||
        document.querySelector('#jornada-conteudo') ||
        document;
      if (!target) {
        console.warn('[TypingBridge] Nenhum target encontrado para runTypingAdapter');
        return;
      }
      if (window.JORNADA_TYPE && typeof window.JORNADA_TYPE.run === 'function') {
        const cfg = (window.JORNADA && JORNADA.typing) || {};
        window.JORNADA_TYPE.run(target, {
          selector: '[data-typing]',
          speed: Number(cfg.charDelay ?? (window.JORNADA_TYPE.DEFAULTS && window.JORNADA_TYPE.DEFAULTS.speed) || 34),
          delay: 0,
          showCaret: Boolean(cfg.caret ?? (window.JORNADA_TYPE.DEFAULTS && window.JORNADA_TYPE.DEFAULTS.cursor) ?? true),
        });
        console.log('[TypingBridge] JORNADA_TYPE.run chamado com sucesso');
      } else {
        console.warn('[TypingBridge] JORNADA_TYPE não disponível ou run não é função');
      }
    } catch (e) {
      console.error('[TypingBridge] Erro ao executar runTypingAdapter:', e);
    }
  }
  if (!window.runTyping) window.runTyping = runTypingAdapter;
  console.log('[TypingBridge] window.runTypingAdapter definido:', typeof window.runTypingAdapter);

  // ---------- Auto reapply ----------
  function hookPergaminho() {
    console.log('[TypingBridge] Iniciando hookPergaminho...');
    const el =
      document.getElementById('jornada-conteudo') ||
      document.querySelector('#jornada-conteudo');
    if (!el) {
      console.warn('[TypingBridge] #jornada-conteudo não encontrado');
      return;
    }
    console.log('[TypingBridge] #jornada-conteudo encontrado:', el);
    setTimeout(() => {
      console.log('[TypingBridge] Executando runTypingAdapter via setTimeout');
      runTypingAdapter(el);
    }, 0);
    let t;
    const mo = new MutationObserver((mutations) => {
      const relevant = mutations.some(m => m.target.id !== 'toast');
      if (relevant) {
        console.log('[TypingBridge] Mutação relevante detectada:', mutations);
        clearTimeout(t);
        t = setTimeout(() => {
          console.log('[TypingBridge] Executando runTypingAdapter via MutationObserver');
          runTypingAdapter(el);
        }, 200);
      }
    });
    mo.observe(el, { childList: true, subtree: true });
    console.log('[TypingBridge] MutationObserver configurado para #jornada-conteudo');
  }

  if (document.readyState === 'loading') {
    console.log('[TypingBridge] Aguardando DOMContentLoaded para hookPergaminho');
    document.addEventListener('DOMContentLoaded', hookPergaminho, { once: true });
  } else {
    console.log('[TypingBridge] DOM já carregado, executando hookPergaminho');
    hookPergaminho();
  }

  // reaplica quando navega de seção
  (function wrapShowSection() {
    console.log('[TypingBridge] Configurando wrapShowSection...');
    const prev = window.showSection;
    if (typeof prev === 'function' && !prev.__wrapped) {
      window.showSection = function (id) {
        try {
          prev.apply(this, arguments);
          console.log('[TypingBridge] showSection chamado para id:', id);
          setTimeout(() => {
            console.log('[TypingBridge] Executando runTypingAdapter via showSection');
            runTypingAdapter();
          }, 60);
        } catch (e) {
          console.error('[TypingBridge] Erro em showSection:', e);
        }
      };
      window.showSection.__wrapped = true;
    }
    console.log('[TypingBridge] wrapShowSection configurado');
  })();

  console.log('[TypingBridge] pronto');
})();;
