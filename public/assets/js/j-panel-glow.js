// /assets/js/j-panel-glow.js — LUZ VIVA GLOBAL (AUTO-HOOK)
(function () {
  'use strict';

  const root = document.documentElement;
  if (window.Luz) return;

  const Luz = {
    set(v = 1) {
      root.style.setProperty('--luz-intensity', String(v));
    },
    startPulse({ min = 1, max = 1.35, speed = 140 } = {}) {
      this.stopPulse();
      let running = true;

      const tick = () => {
        if (!running) return;
        const val = min + (Math.sin(Date.now() / speed) * (max - min));
        root.style.setProperty('--luz-intensity', val.toFixed(3));
        requestAnimationFrame(tick);
      };

      this._pulseStopper = () => { running = false; };
      requestAnimationFrame(tick);
    },
    stopPulse() {
      if (this._pulseStopper) this._pulseStopper();
      this._pulseStopper = null;
      this.set(1);
    },
    bump({ peak = 1.5, ms = 420 } = {}) {
      this.set(peak);
      clearTimeout(this._bumpT);
      this._bumpT = setTimeout(() => this.set(1), ms);
    }
  };

  window.Luz = Luz;
  Luz.set(1);

  // ---------------- AUTO-HOOK NA VOZ ----------------
  try {
    const oldSpeak = window.speechSynthesis?.speak?.bind(window.speechSynthesis);
    if (oldSpeak) {
      window.speechSynthesis.speak = function (utter) {
        try {
          // se alguém já configurou, respeita
          const prevBoundary = utter.onboundary;
          const prevEnd = utter.onend;

          utter.onboundary = function (e) {
            Luz.startPulse({ min: 1, max: 1.45, speed: 120 });
            if (prevBoundary) prevBoundary.call(this, e);
          };
          utter.onend = function (e) {
            Luz.stopPulse();
            if (prevEnd) prevEnd.call(this, e);
          };
        } catch {}

        return oldSpeak(utter);
      };
    }
  } catch {}

  // ---------------- AUTO-HOOK NA DATILOGRAFIA ----------------
  // Se existir TypingBridge, pulsar durante typing.
  function hookTypingBridge() {
    const TB = window.TypingBridge || window.JTypingBridge;
    if (!TB || TB.__LUZ_HOOKED__) return false;

    TB.__LUZ_HOOKED__ = true;
    const oldRun = TB.runTyping?.bind(TB);
    if (!oldRun) return false;

    TB.runTyping = async function (...args) {
      Luz.startPulse({ min: 1, max: 1.25, speed: 150 });
      try {
        const r = await oldRun(...args);
        return r;
      } finally {
        Luz.stopPulse();
      }
    };
    return true;
  }

  if (!hookTypingBridge()) {
    // fallback: observa mudanças de texto nos principais alvos
    const targets = ['#jp-question-typed', '#jp-ai-response'];
    const obs = new MutationObserver(() => Luz.bump({ peak: 1.25, ms: 180 }));
    targets.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) obs.observe(el, { childList: true, subtree: true, characterData: true });
    });
  }

})();
