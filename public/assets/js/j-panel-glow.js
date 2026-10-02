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


// =====================================================
// PRESENÇA DO GUIA — luz sobre o painel da section atual
// Acende quando a leitura começa, cresce conforme o texto avança,
// pulsa enquanto a voz fala e se apaga suavemente ao terminar.
// Só visual: não altera o HTML das sections nem o fluxo da jornada.
// =====================================================
(function () {
  'use strict';
  if (window.__GUIA_PRESENCA__) return;
  window.__GUIA_PRESENCA__ = true;

  const GOLD = '#d4af37';
  const GUIDE_COLORS = { lumen: '#00ff9d', zion: '#00aaff', arian: '#ff00ff' };
  // até a escolha do guia (inclusive na própria section do guia) a luz é dourada
  const PRE_GUIDE = new Set(['section-intro', 'section-termos1', 'section-termos2', 'section-senha', 'section-guia']);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let layer = null;
  let raio = null;        // clarão branco-quente do relâmpago
  let ceu = null;         // reflexo do relâmpago na tela
  let value = 0;          // intensidade atual (0..1)
  let flash = 0;          // intensidade do clarão (0..1)
  let nextFlashAt = 0;
  let pendingFlicker = 0; // segundo pulso da "piscada dupla"
  let running = false;
  let lastColor = '';

  function ensureLayer() {
    if (layer && document.body.contains(layer)) return layer;
    layer = document.createElement('div');
    layer.id = 'guia-presenca';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<span class="gp-halo"></span><span class="gp-raio"></span>';
    raio = layer.querySelector('.gp-raio');
    ceu = document.createElement('div');
    ceu.id = 'guia-relampago';
    ceu.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ceu);
    document.body.appendChild(layer);
    return layer;
  }

  // Relâmpago: clarões irregulares enquanto o guia fala.
  // No máximo 2 clarões por segundo (limite seguro para fotossensibilidade).
  function updateFlash(t, active) {
    if (reduceMotion) { flash = 0; return; }
    if (active) {
      if (!nextFlashAt) nextFlashAt = t + 700 + Math.random() * 900;
      if (t >= nextFlashAt) {
        flash = 1;
        pendingFlicker = Math.random() < 0.45 ? t + 140 + Math.random() * 90 : 0;
        nextFlashAt = t + 2000 + Math.random() * 2400;
      } else if (pendingFlicker && t >= pendingFlicker) {
        flash = Math.max(flash, 0.75);
        pendingFlicker = 0;
      }
    } else {
      nextFlashAt = 0;
      pendingFlicker = 0;
    }
    flash *= 0.88; // decai rápido, como um relâmpago
    if (flash < 0.01) flash = 0;
  }

  function currentSectionEl() {
    const id = window.JC?.currentSection;
    const el = id ? document.getElementById(id) : null;
    if (el) return el;
    return document.querySelector('.typing-active')?.closest('section') || null;
  }

  function guideColor(sectionId) {
    if (!sectionId || PRE_GUIDE.has(sectionId)) return GOLD;
    const raw = String(
      document.body?.dataset?.guia ||
      window.JORNADA_STATE?.guiaSelecionado ||
      sessionStorage.getItem('JORNADA_GUIA') ||
      sessionStorage.getItem('jornada.guia') || ''
    ).toLowerCase();
    if (raw.includes('lumen')) return GUIDE_COLORS.lumen;
    if (raw.includes('zion')) return GUIDE_COLORS.zion;
    if (raw.includes('arian') || raw.includes('arion')) return GUIDE_COLORS.arian;
    return GOLD;
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05;
  }

  function targetPanel() {
    const typing = document.querySelector('.typing-active');
    const fromTyping = typing?.closest('.j-panel-glow');
    if (isVisible(fromTyping)) return fromTyping;
    const sec = currentSectionEl();
    const panels = sec ? sec.querySelectorAll('.j-panel-glow') : [];
    for (const p of panels) if (isVisible(p)) return p;
    return null;
  }

  function speaking() {
    try { if (window.JORNADA_NEURAL?.isPlaying?.()) return true; } catch {}
    try { return !!window.speechSynthesis?.speaking; } catch { return false; }
  }

  // progresso da digitação do texto atual (0..1)
  function typingProgress() {
    const el = document.querySelector('.typing-active');
    if (!el) return null;
    const total = String(el.dataset?.text || el.getAttribute('data-text') || '').length;
    if (!total) return 0.6;
    return Math.min(1, (el.textContent || '').length / total);
  }

  function frame(t) {
    const videoOn = !!document.getElementById('vt-overlay');
    const prog = typingProgress();
    const talking = speaking();
    const reading = !videoOn && (prog !== null || talking);

    // alvo: acende ao começar e cresce conforme o texto avança
    let target = 0;
    if (reading) target = prog !== null ? 0.62 + 0.38 * prog : 0.9;
    value += (target - value) * (target > value ? 0.06 : 0.035);

    updateFlash(t, reading && talking);

    const panel = value > 0.01 ? targetPanel() : null;
    const L = ensureLayer();

    if (!panel || value <= 0.01) {
      L.style.opacity = '0';
      if (raio) raio.style.opacity = '0';
      if (ceu) ceu.style.opacity = '0';
      if (!reading && value <= 0.01) { running = false; value = 0; flash = 0; return; }
    } else {
      const r = panel.getBoundingClientRect();
      const cs = getComputedStyle(panel);
      L.style.transform = `translate(${Math.round(r.left)}px, ${Math.round(r.top)}px)`;
      L.style.width = `${Math.round(r.width)}px`;
      L.style.height = `${Math.round(r.height)}px`;
      L.style.borderRadius = cs.borderRadius || '24px';

      const color = guideColor(window.JC?.currentSection || panel.closest('section')?.id);
      if (color !== lastColor) {
        L.style.setProperty('--presenca-cor', color);
        ceu.style.setProperty('--presenca-cor', color);
        lastColor = color;
      }

      // pulsa com a voz (respiração) + clarões de relâmpago
      const pulse = talking && !reduceMotion ? 0.82 + 0.18 * Math.sin(t / 210) : 1;
      L.style.opacity = Math.min(1, value * pulse + flash * 0.6).toFixed(3);
      if (raio) raio.style.opacity = (flash * Math.min(1, value + 0.3)).toFixed(3);
      if (ceu) {
        ceu.style.setProperty('--cx', `${Math.round(r.left + r.width / 2)}px`);
        ceu.style.setProperty('--cy', `${Math.round(r.top + r.height / 2)}px`);
        ceu.style.opacity = (flash * 0.8).toFixed(3);
      }
    }
    requestAnimationFrame(frame);
  }

  function wake() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  // acorda quando algo começa a ser digitado ou falado
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.target?.classList?.contains('typing-active')) { wake(); return; }
    }
  });
  function start() {
    obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    setInterval(() => { if (!running && speaking()) wake(); }, 400);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();


// =====================================================
// BOTÕES PRONTOS — o botão de avançar se ilumina quando a
// leitura da section terminou e ele já está liberado.
// Padrão em toda a jornada: botão luminoso = pode seguir.
// =====================================================
(function () {
  'use strict';
  if (window.__BOTOES_PRONTOS__) return;
  window.__BOTOES_PRONTOS__ = true;

  const GOLD = '#d4af37';
  const GUIDE_COLORS = { lumen: '#00ff9d', zion: '#00aaff', arian: '#ff00ff' };
  const PRE_GUIDE = new Set(['section-intro', 'section-termos1', 'section-termos2', 'section-senha', 'section-guia']);
  const ADVANCE = [
    '#btn-intro',
    '#section-termos1 .nextBtn', '#section-termos1 [data-action="avancar"]',
    '#section-termos2 .avancarBtn', '#section-termos2 [data-action="avancar"]',
    '#btn-senha-avancar',
    '#btn-confirmar-nome',
    '#btn-selfie-confirm',
    '#section-card #btnNext',
    '#btn-dp-continuar',
    '[data-jornada-avancar]'
  ].join(',');

  const quiet = new WeakMap(); // há quantos ciclos a section está sem leitura

  // condições extras de "página concluída" (mesma regra da validação da section)
  const EXTRA_READY = {
    // dados pessoais: o nome completo é o único campo obrigatório
    'btn-dp-continuar': () => (document.getElementById('dp-nome')?.value || '').trim().length >= 2
  };

  function formComplete(btn, sec) {
    const extra = EXTRA_READY[btn.id];
    if (extra) { try { if (!extra()) return false; } catch {} }
    if (!sec) return true;
    // campos marcados como obrigatórios precisam estar preenchidos
    return ![...sec.querySelectorAll('input[required], select[required], textarea[required]')]
      .some((f) => f.offsetParent !== null && !String(f.value || '').trim());
  }

  function guideColor(sectionId) {
    if (!sectionId || PRE_GUIDE.has(sectionId)) return GOLD;
    const raw = String(
      document.body?.dataset?.guia ||
      window.JORNADA_STATE?.guiaSelecionado ||
      sessionStorage.getItem('JORNADA_GUIA') ||
      sessionStorage.getItem('jornada.guia') || ''
    ).toLowerCase();
    if (raw.includes('lumen')) return GUIDE_COLORS.lumen;
    if (raw.includes('zion')) return GUIDE_COLORS.zion;
    if (raw.includes('arian') || raw.includes('arion')) return GUIDE_COLORS.arian;
    return GOLD;
  }

  function speaking() {
    try { if (window.JORNADA_NEURAL?.isPlaying?.()) return true; } catch {}
    try { return !!window.speechSynthesis?.speaking; } catch { return false; }
  }

  function usable(btn) {
    if (!btn || btn.disabled) return false;
    if (btn.getAttribute('aria-disabled') === 'true') return false;
    if (btn.classList.contains('is-hidden') || btn.classList.contains('disabled')) return false;
    const r = btn.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    const cs = getComputedStyle(btn);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.2;
  }

  function tick() {
    const videoOn = !!document.getElementById('vt-overlay');
    document.querySelectorAll(ADVANCE).forEach((btn) => {
      const sec = btn.closest('section');
      // ainda há texto visível esperando para ser digitado?
      const pendingText = !!sec && [...sec.querySelectorAll('[data-typing="true"]')].some((el) =>
        el.offsetParent !== null &&
        !el.classList.contains('typing-done') && !el.classList.contains('type-done') &&
        String(el.dataset?.text || el.getAttribute('data-text') || '').trim() !== ''
      );
      const reading = pendingText || !!sec?.querySelector('.typing-active') || speaking();
      const n = reading || videoOn ? 0 : (quiet.get(btn) || 0) + 1;
      quiet.set(btn, n);
      // ~0,6 s de silêncio + botão liberado = pronto
      const ready = n >= 2 && usable(btn) && formComplete(btn, sec) && !btn.dataset.prontoClicado;
      if (ready) {
        btn.style.setProperty('--pronto-cor', guideColor(sec?.id));
        btn.classList.add('jornada-btn-pronto');
      } else {
        btn.classList.remove('jornada-btn-pronto');
      }
    });
  }

  // ao clicar, apaga (a section seguinte vai acender o próprio botão)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('.jornada-btn-pronto');
    if (!btn) return;
    btn.classList.remove('jornada-btn-pronto');
    btn.dataset.prontoClicado = '1';
    setTimeout(() => { delete btn.dataset.prontoClicado; }, 2500);
  }, true);

  setInterval(tick, 300);
})();
