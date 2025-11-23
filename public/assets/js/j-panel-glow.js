// /assets/js/j-panel-glow.js — LUZ VIVA GLOBAL (singleton)
(function () {
  'use strict';

  const root = document.documentElement;

  // evita recriar se já existir
  if (window.Luz) return;

  window.Luz = {
    set(v = 1) {
      root.style.setProperty('--luz-intensity', String(v));
    },

    // pulso contínuo (usa requestAnimationFrame)
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

    // pulso curto de impacto (ex.: quando API responde)
    bump({ peak = 1.4, ms = 450 } = {}) {
      this.set(peak);
      clearTimeout(this._bumpT);
      this._bumpT = setTimeout(() => this.set(1), ms);
    }
  };

  // estado inicial
  window.Luz.set(1);
})();
