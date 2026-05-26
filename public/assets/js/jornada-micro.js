/* /assets/js/jornada-micro.js
 * Motor único de microfone da Jornada Conhecimento com Luz
 * API pública:
 * - JORNADA_MICRO.attach(textarea, opts)
 * - JORNADA_MICRO.toggle(textarea, opts)
 * - JORNADA_MICRO.start(textarea, opts)
 * - JORNADA_MICRO.stop()
 * - JORNADA_MICRO.isActive()
 */
(function (window, document) {
  'use strict';

  const MOD = '[JORNADA_MICRO]';

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const state = {
    rec: null,
    textarea: null,
    button: null,
    opts: {},
    restartTimer: null,
    lastText: '',
    lastAt: 0,
    starting: false
  };

  function log(...args) {
    console.log(MOD, ...args);
  }

  function warn(...args) {
    console.warn(MOD, ...args);
  }

  function getLang() {
    return (
      window.i18n?.lang ||
      window.i18n?.currentLang ||
      document.documentElement.lang ||
      sessionStorage.getItem('jornada.lang') ||
      localStorage.getItem('JORNADA_LANG') ||
      'pt-BR'
    );
  }

  function isMobile() {
    return /iphone|ipad|ipod|android/i.test(navigator.userAgent || '');
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }

  function isSafari() {
    const ua = navigator.userAgent || '';
    return /^((?!chrome|android).)*safari/i.test(ua);
  }

  function setButton(active) {
    const btn =
      state.button ||
      document.getElementById('jp-btn-mic') ||
      document.querySelector('[data-action="mic"], .jp-mic-btn, .mic-btn');

    if (!btn) return;

    btn.classList.toggle('recording', !!active);
    btn.classList.toggle('rec', !!active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.dataset.active = active ? '1' : '0';

    if (active) {
      btn.style.setProperty('background', '#b30000', 'important');
      btn.style.setProperty(
        'box-shadow',
        '0 0 2px rgba(255,255,255,0.10), 0 0 14px rgba(255,0,0,0.45)',
        'important'
      );
      btn.style.setProperty('color', '#fff', 'important');
    } else {
      btn.style.removeProperty('background');
      btn.style.removeProperty('box-shadow');
      btn.style.removeProperty('color');
    }
  }

  function clearRestart() {
    clearTimeout(state.restartTimer);
    state.restartTimer = null;
    clearTimeout(window.__MIC_RESTART_TIMER__);
    window.__MIC_RESTART_TIMER__ = null;
  }

  function resetRefs() {
    state.rec = null;
    window.__REC__ = null;
    window.__MIC_INSTANCE__ = null;
  }

  function markStopped() {
    window.__MIC_WANT__ = false;
    window.__MIC_ACTIVE__ = false;
    state.starting = false;
    clearRestart();
    resetRefs();
    setButton(false);
  }

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function appendFinalText(text) {
    const ta =
    state.textarea ||
    window.__MIC_TARGET_TEXTAREA__ ||
    document.querySelector('#jp-answer-input') ||
    document.querySelector('.jp-answer-input') ||
    document.querySelector('textarea');
    if (!ta) return;

    const finalText = normalizeText(text);
    if (!finalText) return;

    const now = Date.now();
    const prevOriginal = String(ta.value || '').trim();
    const prev = normalizeText(prevOriginal);

    const finalLower = finalText.toLowerCase();
    const prevLower = prev.toLowerCase();
    const lastLower = normalizeText(state.lastText || window.__MIC_LAST_FINAL_TEXT__ || '').toLowerCase();
    const lastAt = Number(state.lastAt || window.__MIC_LAST_FINAL_AT__ || 0);

    if (lastLower && finalLower === lastLower && now - lastAt < 3500) {
      warn('trecho duplicado ignorado:', finalText);
      return;
    }

    if (prevLower && prevLower.endsWith(finalLower)) {
      warn('trecho já existe no final:', finalText);
      return;
    }

    let appendText = finalText;

    if (prev && finalText) {
      const prevWords = prev.split(' ');
      const newWords = finalText.split(' ');
      let overlap = 0;

      for (let size = Math.min(prevWords.length, newWords.length); size >= 1; size--) {
        const tail = prevWords.slice(-size).join(' ').toLowerCase();
        const head = newWords.slice(0, size).join(' ').toLowerCase();

        if (tail === head) {
          overlap = size;
          break;
        }
      }

      if (overlap > 0) {
        appendText = newWords.slice(overlap).join(' ').trim();
      }
    }

    if (!appendText) return;

    state.lastText = finalText;
    state.lastAt = now;
    window.__MIC_LAST_FINAL_TEXT__ = finalText;
    window.__MIC_LAST_FINAL_AT__ = now;

    ta.value = prevOriginal ? `${prevOriginal} ${appendText}` : appendText;
    ta.dispatchEvent(new Event('input', { bubbles: true }));

    log('texto anexado:', appendText);
  }

  function buildRecognizer() {
    if (!SR) return null;

    const rec = new SR();

    rec.lang = state.opts.lang || getLang() || 'pt-BR';
    rec.continuous = !(isIOS() || isSafari());
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      window.__MIC_STARTING__ = false;
      state.starting = false;
      window.__MIC_WANT__ = true;
      window.__MIC_ACTIVE__ = true;
      window.__REC__ = rec;
      window.__MIC_INSTANCE__ = rec;
      setButton(true);
      log('iniciado');
    };

    rec.onresult = (ev) => {
      try {
        let finalText = '';

        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const result = ev.results[i];
          if (!result || !result[0]) continue;

          const transcript = normalizeText(result[0].transcript);
          if (!transcript) continue;

          if (result.isFinal) {
            finalText += ' ' + transcript;
          }
        }

  finalText = normalizeText(finalText);

  if (finalText) {

    const textareaAtual =
      state.textarea ||
      document.querySelector('#jp-answer-input') ||
      document.querySelector('.jp-answer-input') ||
      document.querySelector('textarea');

  if (textareaAtual) {
     state.textarea = textareaAtual;
     window.__MIC_TARGET_TEXTAREA__ = textareaAtual;
  }

  appendFinalText(finalText);

  }

  } catch (e) {
    warn('falha no onresult:', e);
  }

 };

    rec.onerror = (ev) => {
      const code = ev?.error || '';
      window.__MIC_STARTING__ = false;
      warn('erro:', code);

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        markStopped();
        if (typeof window.toast === 'function') {
          window.toast('🎤 Permissão do microfone negada. Ative o microfone no navegador.');
        }
        return;
      }

      if (code === 'aborted') return;

      if (window.__MIC_WANT__ === true) {
        setButton(true);
      }
    };

    rec.onend = () => {
      window.__MIC_ACTIVE__ = false;

      if (window.__MIC_WANT__ !== true) {
        markStopped();
        return;
      }

      setButton(true);

      const delay = (isIOS() || isSafari()) ? 700 : 350;

      clearRestart();
      state.restartTimer = setTimeout(() => {
        if (window.__MIC_WANT__ !== true) {
          markStopped();
          return;
        }

        try {
          setButton(true);
          if (window.__MIC_STARTING__ === true) {
           return;
          }
          window.__MIC_STARTING__ = true;
          state.starting = true;
          rec.start();
          } catch (e) {
          warn('reinício falhou, recriando:', e);

          if (window.__MIC_WANT__ === true) {
            state.rec = null;
            start(state.textarea, state.opts);
          }
        }
      }, delay);

      window.__MIC_RESTART_TIMER__ = state.restartTimer;
    };

    return rec;
  }

  function start(textarea, opts = {}) {
    if (!SR) {
      warn('SpeechRecognition não suportado neste navegador.');
      setButton(false);
      return;
    }

    const ta = typeof textarea === 'string' ? document.querySelector(textarea) : textarea;
    if (!ta) {
      warn('textarea não encontrado.');
      return;
    }

    state.textarea = ta;
    window.__MIC_TARGET_TEXTAREA__ = ta;
    state.opts = opts || {};
    state.button =
      opts.button ||
      document.getElementById('jp-btn-mic') ||
      document.querySelector('[data-action="mic"], .jp-mic-btn, .mic-btn');

    if (window.__MIC_STARTING__ === true) {
      warn('start bloqueado — já iniciando');
      return;
    }

    window.__MIC_STARTING__ = true;

    window.__MIC_WANT__ = true;
    window.__MIC_ACTIVE__ = false;
    state.starting = true;
    setButton(true);

    clearRestart();

    try {
      if (state.rec) {
        try { state.rec.stop(); } catch (_) {}
      }
    } catch (_) {}

    state.rec = buildRecognizer();
    window.__REC__ = state.rec;
    window.__MIC_INSTANCE__ = state.rec;

    try {
      if (!isMobile()) {
        ta.focus();
      }

      state.rec.start();
    } catch (e) {
      warn('falha ao iniciar:', e);
      window.__MIC_STARTING__ = false;

      const delay = (isIOS() || isSafari()) ? 700 : 350;

      state.restartTimer = setTimeout(() => {
        if (window.__MIC_WANT__ === true) {
          start(state.textarea, state.opts);
        }
      }, delay);

      window.__MIC_RESTART_TIMER__ = state.restartTimer;
    }
  }

  function stop() {
    window.__MIC_STARTING__ = false;
    window.__MIC_WANT__ = false;
    window.__MIC_ACTIVE__ = false;
    state.starting = false;
    clearRestart();

    try { state.rec?.stop?.(); } catch (_) {}
    try { window.__REC__?.stop?.(); } catch (_) {}
    try { window.__MIC_INSTANCE__?.stop?.(); } catch (_) {}

    resetRefs();
    setButton(false);
    log('parado');
  }

  function toggle(textarea, opts = {}) {
    if (window.__MIC_WANT__ === true || window.__MIC_ACTIVE__ === true) {
      stop();
      return;
    }

    start(textarea, opts);
  }

  function attach(textarea, opts = {}) {
    const ta = typeof textarea === 'string' ? document.querySelector(textarea) : textarea;
    if (!ta) return null;

    ta.dataset.micReady = '1';

    return {
      start: () => start(ta, opts),
      stop,
      toggle: () => toggle(ta, opts)
    };
  }

  function attachAll(scope = document, opts = {}) {
    const root = scope || document;
    root.querySelectorAll('textarea').forEach((ta) => {
      if (ta.dataset.micReady === '1') return;
      attach(ta, opts);
    });
  }

  window.JORNADA_MICRO = {
    attach,
    attachAll,
    start,
    stop,
    toggle,
    isActive() {
      return window.__MIC_WANT__ === true || window.__MIC_ACTIVE__ === true;
    },
    _state: state
  };

  log('pronto');
})(window, document);
