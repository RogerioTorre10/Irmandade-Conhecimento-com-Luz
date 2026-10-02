// =====================================================
// SOM DO UNIVERSO — trilha ambiente do site e do portal
//
// - Ligado por padrão ("ON"); a escolha da pessoa fica guardada.
// - Se existir /assets/audio/musica-jornada.mp3, toca a música (suave, em
//   loop, continuando do ponto em que parou na página anterior).
//   Sem o arquivo, usa o som sintetizado (acorde místico + sinos).
// - A música passa por um GainNode (WebAudio): assim o volume funciona também
//   no iPhone, que ignora audio.volume.
// - Durante o efeito leitura (digitação ou voz) a música abaixa sozinha e
//   volta suavemente quando a leitura termina.
// - Os navegadores só liberam som depois de um toque/clique: se o início
//   automático for bloqueado, o som começa no primeiro toque na página.
// - Botão: qualquer elemento com [data-som-universo]; se a página não tiver
//   nenhum, um botão discreto é criado no canto inferior direito.
// =====================================================
(function () {
  'use strict';
  if (window.SomUniverso) return;

  const PREF_KEY = 'irmandade.somUniverso';     // 'on' | 'off'
  const TIME_KEY = 'irmandade.somUniverso.t';   // posição da música
  const MUSIC_SRC = '/assets/audio/musica-jornada.mp3';
  const MUSIC_VOLUME = 0.22;       // site e portal
  const MUSIC_VOLUME_JORNADA = 0.15; // dentro das sections: mais suave
  const MUSIC_DUCK_TYPING = 0.06;  // só a digitação (sem voz)
  const MUSIC_DUCK_VOICE = 0.012;  // enquanto o guia fala: quase inaudível
  const PAD_VOLUME = 0.55;
  const PAD_DUCK_TYPING = 0.18;
  const PAD_DUCK_VOICE = 0.04;
  const DUCK_RELEASE_MS = 900; // espera antes de voltar ao volume normal

  const listeners = new Set();
  let on = readPref();
  let started = false;
  let mode = null;            // 'music' | 'pad'
  let music = null;
  let ctx = null, master = null, padStarted = false, chimeTimer = 0;
  let fadeTimer = 0;
  let musicGain = null, pauseTimer = 0;
  let ducked = false;             // false | 'typing' | 'voice'
  let lastTypingAt = 0, lastVoiceAt = 0;
  const NA_JORNADA = /jornada/i.test(location.pathname);

  function readPref() {
    try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch { return true; }
  }
  function savePref() {
    try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch {}
  }
  function emit() { listeners.forEach((fn) => { try { fn(on); } catch {} }); renderButtons(); }

  // ---------- áudio sintetizado ----------
  function ensureCtx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return true;
  }

  function startPad() {
    if (padStarted || !ensureCtx()) return;
    const c = ctx;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = c.createGain(); g.gain.value = 0.12;
    lp.connect(g); g.connect(master);
    // acorde místico (Lá menor com nona), levemente desafinado
    [110, 164.81, 220, 246.94, 329.63].forEach((f, i) => {
      [-3, 3].forEach((det) => {
        const o = c.createOscillator();
        o.type = i < 2 ? 'sine' : 'triangle';
        o.frequency.value = f; o.detune.value = det;
        const og = c.createGain(); og.gain.value = i < 2 ? 0.22 : 0.08;
        o.connect(og); og.connect(lp); o.start();
      });
    });
    // respiração lenta do som
    const lfo = c.createOscillator(); const lg = c.createGain();
    lfo.frequency.value = 0.08; lg.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    padStarted = true;
  }

  function chime(level = 1) {
    if (!on || !ctx || ctx.state !== 'running') return;
    const c = ctx, t = c.currentTime;
    const notes = [880, 987.77, 1318.51, 1760, 1174.66];
    const f = notes[Math.floor(Math.random() * notes.length)];
    [1, 2.76].forEach((mult, k) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime((k ? 0.02 : 0.07) * level, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 3);
    });
  }

  // som da travessia (whoosh + acorde subindo) — toca mesmo com o som do universo desligado
  function whoosh() {
    if (!ensureCtx()) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch {}
    if (ctx.state !== 'running') return;
    const c = ctx, t = c.currentTime;
    const out = c.createGain(); out.gain.value = 0.55; out.connect(c.destination);
    const len = 2.2, buf = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 1.8);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
    src.connect(bp); bp.connect(g); g.connect(out); src.start(t);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      og.gain.setValueAtTime(0.0001, t + i * 0.18);
      og.gain.exponentialRampToValueAtTime(0.09, t + i * 0.18 + 0.05);
      og.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 1.6);
      o.connect(og); og.connect(out); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 1.7);
    });
  }

  // ---------- música (arquivo opcional) ----------
  let musicCheck = null;
  function musicAvailable() {
    if (!musicCheck) {
      musicCheck = fetch(MUSIC_SRC, { method: 'HEAD', cache: 'force-cache' })
        .then((r) => r.ok && /audio|mpeg|octet/i.test(r.headers.get('content-type') || 'audio'))
        .catch(() => false);
    }
    return musicCheck;
  }

  function fadeMusic(target, ms = 1800) {
    if (!music) return;
    clearInterval(fadeTimer);
    clearTimeout(pauseTimer);
    if (musicGain) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setTargetAtTime(target, ctx.currentTime, ms / 3000);
      if (target === 0) pauseTimer = setTimeout(() => { try { music.pause(); } catch {} }, ms + 200);
      return;
    }
    const start = music.volume, t0 = performance.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      music.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k >= 1) {
        clearInterval(fadeTimer);
        if (target === 0) { try { music.pause(); } catch {} }
      }
    }, 60);
  }

  async function startSound() {
    if (!on) return false;
    if (mode === null) mode = (await musicAvailable()) ? 'music' : 'pad';

    if (mode === 'music') {
      if (!music) {
        music = new Audio(MUSIC_SRC);
        music.loop = true;
        music.preload = 'auto';
        music.volume = 0;
        try {
          const t = Number(sessionStorage.getItem(TIME_KEY) || 0);
          if (t > 0) music.addEventListener('loadedmetadata', () => {
            try { music.currentTime = t % (music.duration || Infinity); } catch {}
          }, { once: true });
        } catch {}
        music.addEventListener('error', () => { mode = 'pad'; music = null; musicGain = null; startSound(); }, { once: true });
        if (ensureCtx()) {
          try {
            musicGain = ctx.createGain();
            musicGain.gain.value = 0;
            ctx.createMediaElementSource(music).connect(musicGain);
            musicGain.connect(ctx.destination);
            music.volume = 1;
          } catch { musicGain = null; }
        }
      }
      if (musicGain) {
        // sem o contexto de áudio rodando a música sairia muda: espera o toque
        try { if (ctx.state !== 'running') await ctx.resume(); } catch {}
        if (ctx.state !== 'running') return false;
      }
      try {
        await music.play();
        fadeMusic(targetVolume());
        started = true;
        return true;
      } catch {
        return false; // bloqueado até o primeiro toque
      }
    }

    // som sintetizado
    if (!ensureCtx()) return false;
    try { if (ctx.state === 'suspended') await ctx.resume(); } catch {}
    if (ctx.state !== 'running') return false;
    startPad();
    master.gain.setTargetAtTime(targetVolume(), ctx.currentTime, 0.8);
    clearInterval(chimeTimer);
    chimeTimer = setInterval(() => chime(Math.random() * 0.6 + 0.4), 5200);
    started = true;
    return true;
  }

  function stopSound() {
    clearInterval(chimeTimer);
    if (music) fadeMusic(0, 900);
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  }

  function setOn(v) {
    on = !!v;
    savePref();
    if (on) { unlockInGesture(); startSound(); } else stopSound();
    emit();
    return on;
  }

  // ---------- abaixa a música durante o efeito leitura ----------
  // voz do guia (navegador ou neural) ou vídeo com som
  function isVoice() {
    try {
      if (window.speechSynthesis && window.speechSynthesis.speaking) return true;
      if (window.JORNADA_NEURAL && typeof window.JORNADA_NEURAL.isPlaying === 'function' &&
          window.JORNADA_NEURAL.isPlaying()) return true;
      for (const v of document.querySelectorAll('video')) {
        if (!v.paused && !v.muted && !v.ended && v.volume > 0) return true;
      }
    } catch {}
    return false;
  }
  function isTyping() {
    try {
      for (const el of document.querySelectorAll('.typing-active')) if (el.getClientRects().length) return true;
    } catch {}
    return false;
  }

  function targetVolume() {
    if (mode === 'music') {
      if (ducked === 'voice') return MUSIC_DUCK_VOICE;
      if (ducked === 'typing') return MUSIC_DUCK_TYPING;
      return NA_JORNADA ? MUSIC_VOLUME_JORNADA : MUSIC_VOLUME;
    }
    if (ducked === 'voice') return PAD_DUCK_VOICE;
    if (ducked === 'typing') return PAD_DUCK_TYPING;
    return PAD_VOLUME;
  }

  function targetVolumeFor(state) {
    const prev = ducked; ducked = state;
    const v = targetVolume(); ducked = prev; return v;
  }

  function applyVolume(ms) {
    if (!on || !started) return;
    if (mode === 'music') { if (music && !music.paused) fadeMusic(targetVolume(), ms); }
    else if (ctx && master) master.gain.setTargetAtTime(targetVolume(), ctx.currentTime, ms / 3000);
  }

  setInterval(() => {
    const now = performance.now();
    if (isVoice()) lastVoiceAt = now;
    if (isTyping()) lastTypingAt = now;
    // a voz segura um pouco mais, para não "respirar" entre uma frase e outra
    const want = now - lastVoiceAt < DUCK_RELEASE_MS + 600 ? 'voice'
      : now - lastTypingAt < DUCK_RELEASE_MS ? 'typing' : false;
    if (want !== ducked) {
      const descendo = targetVolumeFor(want) < targetVolume();
      ducked = want;
      applyVolume(descendo ? 350 : 2600); // abaixa rápido, volta devagar
    }
  }, 200);

  // ---------- início automático / no primeiro toque ----------
  // iPhone: o áudio só destrava se resume()/play() forem chamados ainda dentro do toque
  function unlockInGesture() {
    try { if (ensureCtx() && ctx.state !== 'running') ctx.resume(); } catch {}
    try { if (mode === 'music' && music && music.paused) music.play().catch(() => {}); } catch {}
  }
  function onFirstGesture() {
    if (on && !isAudible()) { unlockInGesture(); startSound(); }
  }
  function isAudible() {
    if (mode === 'music') return !!music && !music.paused && (!musicGain || ctx.state === 'running');
    return !!ctx && ctx.state === 'running' && padStarted && on;
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) =>
    document.addEventListener(ev, onFirstGesture, { capture: true, passive: true })
  );

  // guarda a posição da música para continuar na próxima página
  window.addEventListener('pagehide', () => {
    try { if (music && !music.paused) sessionStorage.setItem(TIME_KEY, String(music.currentTime || 0)); } catch {}
  });

  // ---------- botões ----------
  function renderButtons() {
    document.querySelectorAll('[data-som-universo]').forEach((b) => {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      const label = b.querySelector('[data-som-label]');
      if (label) {
        label.textContent = mode === 'music'
          ? (on ? 'Música: ON' : 'Sem música')
          : (on ? 'Som do Universo: ON' : 'Som do Universo: OFF');
      }
      b.setAttribute('title', on ? 'Silenciar a música' : 'Ligar a música');
    });
  }

  function bindButtons() {
    let buttons = document.querySelectorAll('[data-som-universo]');
    if (!buttons.length) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'som-universo-flutuante';
      b.setAttribute('data-som-universo', '');
      b.setAttribute('aria-label', 'Ligar ou silenciar a música');
      b.innerHTML = '<span class="dot" aria-hidden="true"></span><span data-som-label>Som do Universo: ON</span>';
      document.body.appendChild(b);
      injectFloatingStyle();
      buttons = [b];
    }
    buttons.forEach((b) => {
      if (b.dataset.somBound) return;
      b.dataset.somBound = '1';
      b.addEventListener('click', (e) => {
        e.preventDefault();
        setOn(!on);
        if (on) setTimeout(() => chime(1), 400);
      });
    });
    renderButtons();
  }

  function injectFloatingStyle() {
    if (document.getElementById('som-universo-style')) return;
    const st = document.createElement('style');
    st.id = 'som-universo-style';
    st.textContent = `
      .som-universo-flutuante{
        position:fixed;right:14px;bottom:14px;z-index:60;
        display:inline-flex;align-items:center;gap:8px;cursor:pointer;
        padding:8px 12px;border-radius:999px;
        background:rgba(8,8,14,.72);border:1px solid rgba(247,213,139,.45);color:#e8dcc0;
        font:600 11px/1 ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;
        -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
        box-shadow:0 4px 14px rgba(0,0,0,.5);
      }
      .som-universo-flutuante:hover,.som-universo-flutuante:focus-visible{outline:none;border-color:#f7d58b;color:#f7d58b}
      .som-universo-flutuante .dot{width:8px;height:8px;border-radius:50%;background:#3a3a44}
      .som-universo-flutuante[aria-pressed="true"] .dot{background:#6dffb0;box-shadow:0 0 8px #6dffb0}
      @media (max-width:520px){ .som-universo-flutuante{right:10px;bottom:10px;padding:7px 10px;font-size:10px} }
      /* na jornada o canto inferior direito é da chama: o botão vai para a esquerda */
      body:has(#flame-bottom-right) .som-universo-flutuante{right:auto;left:14px}
      @media (max-width:520px){ body:has(#flame-bottom-right) .som-universo-flutuante{left:10px} }
    `;
    document.head.appendChild(st);
  }

  window.SomUniverso = {
    isOn: () => on,
    setOn,
    toggle: () => setOn(!on),
    chime,
    whoosh,
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    // diagnóstico: o que está tocando agora
    estado: () => ({
      ligado: on,
      modo: mode,
      tocando: isAudible(),
      posicaoMusica: music ? Number((music.currentTime || 0).toFixed(1)) : null,
      volumeMusica: music ? Number((musicGain ? musicGain.gain.value : music.volume).toFixed(2)) : null,
      abaixadaPorLeitura: ducked
    })
  };

  function boot() {
    bindButtons();
    musicAvailable().then((ok) => { if (mode === null) mode = ok ? 'music' : 'pad'; renderButtons(); });
    if (on) startSound(); // pode ser bloqueado: aí começa no primeiro toque
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
