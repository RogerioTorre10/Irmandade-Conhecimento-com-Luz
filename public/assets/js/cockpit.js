// Cockpit da Irmandade: relógio, sons, controles, LEDs, radar e sequência de ignição.
// Compartilhado entre o portal e a página principal.
(function () {
  const root = document.documentElement;
  const $ = (sel) => document.querySelector(sel);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Hora estelar ----------
  const clock = document.getElementById('starClock');
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    if (clock) clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  };
  tick();
  setInterval(tick, 1000);

  // ---------- Preferências salvas ----------
  const KEY = 'portal.cockpit.v1';
  const DEFAULTS = { bright: 100, hue: 197, vol: 60, som: true, scan: true, stars: true, radar: true };
  let cfg = Object.assign({}, DEFAULTS);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {} };

  // ---------- Sons sintetizados (sem arquivos) ----------
  const Sfx = {
    ctx: null, master: null,
    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.connect(this.ctx.destination);
          this.setVolume();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (_) {}
    },
    ready() { return this.ctx && this.ctx.state === 'running' && cfg.som && cfg.vol > 0; },
    setVolume() {
      if (!this.master) return;
      const v = cfg.som ? Math.pow(cfg.vol / 100, 1.6) : 0;
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    },
    tone(freq, dur, opt = {}) {
      if (!this.ready()) return;
      const c = this.ctx, t = c.currentTime + (opt.delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = opt.type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
      const peak = opt.gain ?? 0.25;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.01, dur / 4));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, opt = {}) {
      if (!this.ready()) return;
      const c = this.ctx, t = c.currentTime + (opt.delay || 0);
      const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = opt.freq || 2500; f.Q.value = 1.2;
      g.gain.value = opt.gain ?? 0.3;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t);
    },
    click()  { this.noise(0.03, { freq: 3200, gain: 0.35 }); this.tone(1400, 0.05, { type: 'triangle', to: 700, gain: 0.18 }); },
    hover()  { this.tone(2200, 0.03, { type: 'sine', gain: 0.04 }); },
    toggle(on) { this.noise(0.025, { freq: 1800, gain: 0.45 }); this.tone(on ? 520 : 340, 0.08, { type: 'square', gain: 0.07, delay: 0.02 }); },
    step()   { this.tone(1900, 0.025, { type: 'sine', gain: 0.07 }); },
    alert()  { this.tone(880, 0.12, { type: 'triangle', gain: 0.16, delay: 0.05 }); this.tone(660, 0.16, { type: 'triangle', gain: 0.16, delay: 0.2 }); },
    beep(i)  { this.tone(600 + i * 90, 0.07, { type: 'sine', gain: 0.12 }); },
    ignite() { this.tone(70, 1.6, { type: 'sawtooth', to: 220, gain: 0.08 }); this.tone(140, 1.6, { type: 'sine', to: 440, gain: 0.1 }); },
    online() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'sine', gain: 0.12, delay: i * 0.09 })); }
  };
  // O navegador só libera áudio depois de um toque/clique.
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
    document.addEventListener(ev, () => Sfx.unlock(), { capture: true, passive: true })
  );

  // ---------- LEDs ----------
  function flash(el) {
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
  const signal = document.getElementById('ledSignal');

  // ---------- Deslizantes ----------
  const sliders = {
    bright: { input: $('#ctlBright'), led: $('#ledBright'), dial: $('#dialBright'), min: 50, max: 130 },
    hue:    { input: $('#ctlHue'),    led: $('#ledHue'),    dial: $('#dialHue'),    min: 0,  max: 360 },
    vol:    { input: $('#ctlVol'),    led: $('#ledVol'),    dial: $('#dialVol'),    min: 0,  max: 100 }
  };
  document.querySelectorAll('.meter').forEach((m) => { m.innerHTML = '<i></i>'.repeat(10); });

  function renderScreen() {
    const scr = $('#ctlScreen');
    if (scr) scr.textContent = 'LUZ ' + cfg.bright + '% · COR ' + cfg.hue + '° · SOM ' + (cfg.som ? cfg.vol + '%' : 'MUDO');
  }

  function applySlider(key) {
    const sl = sliders[key];
    if (!sl.input) return;
    const v = cfg[key];
    const frac = (v - sl.min) / (sl.max - sl.min);
    sl.input.value = v;
    sl.input.style.setProperty('--p', (frac * 100) + '%');
    if (sl.dial) sl.dial.style.setProperty('--v', frac.toFixed(3));

    if (key === 'bright') root.style.setProperty('--bright', (v / 100).toFixed(2));
    if (key === 'hue') root.style.setProperty('--tech-h', v);
    if (key === 'vol') Sfx.setVolume();

    const meter = document.querySelector('.meter[data-meter="' + sl.input.id + '"]');
    if (meter) {
      const lit = Math.round(frac * 10);
      meter.querySelectorAll('i').forEach((i, idx) => {
        i.className = idx < lit ? ('on' + (idx >= 9 ? ' max' : idx >= 7 ? ' hi' : '')) : '';
      });
    }
    // LED do deslizante: mais forte quanto maior o valor (o de Luz/Som apaga no mínimo)
    if (sl.led && key !== 'hue') {
      sl.led.style.opacity = (0.25 + frac * 0.75).toFixed(2);
      sl.led.classList.toggle('off', key === 'vol' && (v === 0 || !cfg.som));
    }
    renderScreen();
  }

  let lastStep = 0;
  Object.keys(sliders).forEach((key) => {
    const sl = sliders[key];
    if (!sl.input) return;
    sl.input.addEventListener('input', () => {
      cfg[key] = Number(sl.input.value);
      applySlider(key);
      flash(sl.led);
      flash(signal);
      const now = performance.now();
      if (now - lastStep > 45) { Sfx.step(); lastStep = now; }
    });
    sl.input.addEventListener('change', save);
  });

  // ---------- Chaves ----------
  const toggles = document.querySelectorAll('.toggle[data-key]');
  function applyToggle(key) {
    const on = !!cfg[key];
    toggles.forEach((t) => { if (t.dataset.key === key) t.setAttribute('aria-checked', on ? 'true' : 'false'); });
    if (key === 'scan') document.body.classList.toggle('no-scan', !on);
    if (key === 'stars') document.body.classList.toggle('no-stars', !on);
    if (key === 'radar') document.body.classList.toggle('no-radar', !on);
    if (key === 'som') { Sfx.setVolume(); applySlider('vol'); }
    renderScreen();
  }
  toggles.forEach((t) => {
    t.addEventListener('click', () => {
      const key = t.dataset.key;
      cfg[key] = !cfg[key];
      if (key === 'som' && cfg.som) Sfx.unlock();
      applyToggle(key);
      Sfx.toggle(cfg[key]);
      flash(signal);
      save();
    });
  });

  Object.keys(sliders).forEach(applySlider);
  ['som', 'scan', 'stars', 'radar'].forEach(applyToggle);

  // ---------- Sons nos botões ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.btn, .back, .monitor, .reboot');
    if (!el) return;
    Sfx.click();
    flash(el.querySelector('.led'));
    flash(signal);
    if (el.matches('[data-coming-soon]')) Sfx.alert();
  }, true);
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest('.btn, .back, .reboot');
    if (el && !el.contains(e.relatedTarget)) Sfx.hover();
  });

  // API para outras partes da página (ex.: botão Entrar)
  window.Cockpit = { sfx: Sfx, flash: flash, signal: signal };

  // ---------- Radar: constelação sob a varredura ----------
  const CONST = [
    ['Cruzeiro do Sul', 219],
    ['Órion', 37],
    ['Escorpião', 139],
    ['Cassiopeia', 331],
    ['Ursa Maior', 283]
  ];
  const radarEl = document.getElementById('radarMain');
  const readout = document.getElementById('radarReadout');
  let lastName = '';
  function radarTick() {
    if (radarEl && readout && radarEl.getAnimations) {
      const sweepA = radarEl.querySelector('.sweep').getAnimations()[0];
      const skyA = radarEl.querySelector('.sky').getAnimations()[0];
      if (sweepA && skyA) {
        const sweepDur = Number(sweepA.effect.getTiming().duration) || 4000;
        const skyDur = Number(skyA.effect.getTiming().duration) || 160000;
        const sweep = ((sweepA.currentTime || 0) % sweepDur) / sweepDur * 360;
        const sky = -((skyA.currentTime || 0) % skyDur) / skyDur * 360;
        let hit = '';
        for (const [name, ang] of CONST) {
          const cur = ((ang + sky) % 360 + 360) % 360;
          const diff = ((sweep - cur) % 360 + 360) % 360;
          if (diff < 40) { hit = name; break; }
        }
        const txt = hit ? 'ALVO: ' + hit.toUpperCase() : 'VARRENDO O UNIVERSO…';
        if (txt !== lastName) {
          readout.textContent = txt;
          if (hit) flash(signal);
          lastName = txt;
        }
      }
    }
    requestAnimationFrame(radarTick);
  }
  requestAnimationFrame(radarTick);

  // ---------- Sequência de ignição ----------
  const boot = document.getElementById('boot');
  const log = document.getElementById('bootLog');
  const bar = document.getElementById('bootBar');
  const LINES = [
    ['Acendendo a chama', 'OK'],
    ['Calibrando instrumentos', 'OK'],
    ['Radar de luz', 'ATIVO'],
    ['Escudos da fé', '100%'],
    ['Canais de transmissão', '04/04'],
    ['Todos os sistemas', 'ATIVOS']
  ];
  let running = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function powerUp() {
    const plates = Array.from(document.querySelectorAll('.plate'));
    plates.forEach((pl, i) => { pl.style.animationDelay = (i * 0.15) + 's'; pl.classList.add('power-on'); });
    root.classList.remove('boot-pending');
    root.classList.add('leds-off');

    const leds = Array.from(document.querySelectorAll('.led'));
    const step = Math.max(12, Math.round(900 / Math.max(leds.length, 1)));
    leds.forEach((led, i) => later(() => {
      led.classList.add('lit');
      if (i % 4 === 0) Sfx.step();
    }, 250 + i * step));

    later(() => {
      root.classList.remove('leds-off');
      leds.forEach((led) => led.classList.remove('lit'));
      Sfx.online();
    }, 300 + leds.length * step);

    later(() => {
      plates.forEach((pl) => { pl.classList.remove('power-on'); pl.style.animationDelay = ''; });
      running = false;
    }, 1200 + plates.length * 150);
  }

  function finishBoot() {
    if (!boot) return;
    timers.forEach(clearTimeout); timers = [];
    boot.classList.add('out');
    try { sessionStorage.setItem('portal.boot', '1'); } catch (_) {}
    setTimeout(() => { boot.classList.remove('show', 'out'); }, 650);
    powerUp();
  }

  function runBoot() {
    if (!boot || running) return;
    running = true;
    timers.forEach(clearTimeout); timers = [];
    log.innerHTML = '';
    bar.style.width = '0';
    boot.classList.remove('out');
    boot.classList.add('show');
    root.classList.add('boot-pending', 'leds-off');
    Sfx.ignite();

    LINES.forEach(([label, status], i) => {
      later(() => {
        const li = document.createElement('li');
        li.innerHTML = '<span></span><b></b>';
        li.firstChild.textContent = label + '…';
        log.appendChild(li);
        later(() => { li.lastChild.textContent = status; Sfx.beep(i); }, 220);
        bar.style.width = (((i + 1) / LINES.length) * 100) + '%';
      }, 250 + i * 380);
    });
    later(finishBoot, 250 + LINES.length * 380 + 500);
  }

  if (boot) boot.addEventListener('click', () => { if (running) finishBoot(); });
  const reboot = document.getElementById('rebootBtn');
  if (reboot) reboot.addEventListener('click', () => { if (!running) runBoot(); });

  if (root.classList.contains('boot-pending')) {
    if (reduceMotion) { root.classList.remove('boot-pending', 'leds-off'); }
    else runBoot();
  } else {
    root.classList.remove('leds-off');
  }
})();
