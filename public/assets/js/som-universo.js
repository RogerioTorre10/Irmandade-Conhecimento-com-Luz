// =====================================================
// SOM DO UNIVERSO — trilha ambiente do site e do portal
//
// - Ligado por padrão ("ON"); a escolha da pessoa fica guardada.
// - Toca as músicas da trilha (suaves) uma depois da outra, sem parar:
//   quando uma termina, começa a outra. Ao trocar de página continua na
//   mesma música e no mesmo ponto.
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
  const TRACK_KEY = 'irmandade.somUniverso.faixa'; // qual música está tocando
  // "O Pleno Existencial" — versões autorais criadas no Suno Pro
  // (uso comercial), tocadas em sequência
  const PLAYLIST = [
    '/assets/audio/musica-jornada-1.mp3', // versão piano
    '/assets/audio/musica-jornada-2.mp3'  // versão violino
  ];
  const MUSIC_SRC = PLAYLIST[0];
  let track = 0;
  try { track = Math.abs(Number(sessionStorage.getItem(TRACK_KEY)) || 0) % PLAYLIST.length; } catch {}
  let trackErrors = 0;
  // Níveis com o controle deslizante em 100%; o controle multiplica todos eles.
  const MUSIC_VOLUME = 0.2;          // site e portal
  const MUSIC_VOLUME_JORNADA = 0.13; // dentro das sections: mais suave
  const MUSIC_DUCK_TYPING = 0.04;    // só a digitação (sem voz)
  const MUSIC_DUCK_VOICE = 0.005;    // enquanto o guia fala: praticamente inaudível
  const VOL_KEY = 'irmandade.somUniverso.vol'; // posição do controle (0..1)
  const VOL_PADRAO = 0.7;
  const PAD_VOLUME = 0.55;
  const PAD_DUCK_TYPING = 0.18;
  const PAD_DUCK_VOICE = 0.04;
  const DUCK_RELEASE_MS = 900; // espera antes de voltar ao volume normal

  const listeners = new Set();
  let on = readPref();
  let userVol = readVol();
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
  function readVol() {
    try {
      const v = parseFloat(localStorage.getItem(VOL_KEY));
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : VOL_PADRAO;
    } catch { return VOL_PADRAO; }
  }
  function saveVol() {
    try { localStorage.setItem(VOL_KEY, String(userVol)); } catch {}
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
        music = new Audio(PLAYLIST[track]);
        music.loop = PLAYLIST.length === 1;
        music.preload = 'auto';
        // terminou uma música: começa a próxima (volta à primeira no fim)
        music.addEventListener('ended', () => nextTrack());
        music.addEventListener('playing', () => { trackErrors = 0; });
        music.volume = 0;
        try {
          const t = Number(sessionStorage.getItem(TIME_KEY) || 0);
          if (t > 0) music.addEventListener('loadedmetadata', () => {
            try { music.currentTime = t % (music.duration || Infinity); } catch {}
          }, { once: true });
        } catch {}
        // uma faixa com problema: tenta a próxima; se nenhuma tocar, usa o som sintetizado
        music.addEventListener('error', () => {
          trackErrors++;
          if (trackErrors < PLAYLIST.length) { nextTrack(); return; }
          try { music.pause(); } catch {}
          mode = 'pad'; music = null; musicGain = null; startSound();
        });
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

  function nextTrack() {
    if (!music) return;
    track = (track + 1) % PLAYLIST.length;
    try {
      sessionStorage.setItem(TRACK_KEY, String(track));
      sessionStorage.setItem(TIME_KEY, '0');
    } catch {}
    music.src = PLAYLIST[track];
    try { music.load(); } catch {}
    if (on) {
      const p = music.play();
      if (p && p.catch) p.catch(() => {});
    }
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
    return baseVolume() * userVol;
  }
  function baseVolume() {
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
    try {
      if (music && !music.paused) {
        sessionStorage.setItem(TIME_KEY, String(music.currentTime || 0));
        sessionStorage.setItem(TRACK_KEY, String(track));
      }
    } catch {}
  });

  // ---------- controle de volume (deslizante) ----------
  // Ícone (toque = silenciar/voltar) + controle deslizante. Arrastar até o
  // fim à esquerda = sem música. Fica no rodapé de cada página.
  const ICONE_SOM = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path class="onda1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M16 9.2a4 4 0 0 1 0 5.6"/><path class="onda2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M18.6 6.6a7.6 7.6 0 0 1 0 10.8"/><path class="mudo" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M16.5 9.5l5 5m0-5l-5 5"/></svg>';

  function volumeVisivel() { return on ? Math.round(userVol * 100) : 0; }

  function renderButtons() {
    document.querySelectorAll('.som-controle').forEach((c) => {
      const v = volumeVisivel();
      c.classList.toggle('is-mudo', v === 0);
      c.classList.toggle('is-baixo', v > 0 && v < 45);
      const r = c.querySelector('input[type="range"]');
      if (r && document.activeElement !== r) r.value = String(v);
      if (r) {
        r.style.setProperty('--nivel', v + '%');
        r.setAttribute('aria-valuetext', v === 0 ? 'Sem música' : `Volume ${v}%`);
      }
      const b = c.querySelector('.som-controle__icone');
      if (b) {
        b.setAttribute('aria-pressed', v === 0 ? 'false' : 'true');
        b.setAttribute('title', v === 0 ? 'Ligar a música' : 'Silenciar a música');
      }
    });
    // botões antigos de liga/desliga, se alguma página ainda tiver
    document.querySelectorAll('[data-som-universo]:not(.som-controle__icone)').forEach((b) => {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      const label = b.querySelector('[data-som-label]');
      if (label) label.textContent = on ? 'Música: ON' : 'Sem música';
    });
  }

  function setVolume(v, { fromSlider = false } = {}) {
    v = Math.min(1, Math.max(0, Number(v) || 0));
    if (v <= 0.001) {
      if (on) setOn(false);
      return;
    }
    userVol = v;
    saveVol();
    if (!on) setOn(true);
    else applyVolume(fromSlider ? 120 : 600);
    renderButtons();
  }

  function criarControle(flutuante) {
    const c = document.createElement('div');
    c.className = 'som-controle' + (flutuante ? ' som-controle--flutuante' : '');
    c.setAttribute('role', 'group');
    c.setAttribute('aria-label', 'Volume da música');
    c.innerHTML =
      '<button type="button" class="som-controle__icone" aria-label="Silenciar ou ligar a música">' + ICONE_SOM + '</button>' +
      '<input type="range" class="som-controle__barra" min="0" max="100" step="1" aria-label="Volume da música">';
    const icone = c.querySelector('.som-controle__icone');
    const barra = c.querySelector('.som-controle__barra');
    icone.addEventListener('click', (e) => {
      e.preventDefault();
      if (on) setOn(false);
      else { if (userVol < 0.05) userVol = VOL_PADRAO; saveVol(); setOn(true); setTimeout(() => chime(1), 400); }
      renderButtons();
    });
    barra.addEventListener('input', () => setVolume(barra.value / 100, { fromSlider: true }));
    barra.addEventListener('change', () => { barra.blur?.(); renderButtons(); });
    return c;
  }

  function bindButtons() {
    injectStyle();
    const antigos = document.querySelectorAll('[data-som-universo]:not([data-som-bound])');
    if (antigos.length) {
      // a página tem o seu próprio lugar para o som: o controle entra ali
      antigos.forEach((b) => {
        b.dataset.somBound = '1';
        b.replaceWith(criarControle(false));
      });
    } else if (!document.querySelector('.som-controle')) {
      document.body.appendChild(criarControle(true));
    }
    renderButtons();
  }

  function injectStyle() {
    if (document.getElementById('som-universo-style')) return;
    const st = document.createElement('style');
    st.id = 'som-universo-style';
    st.textContent = `
      .som-controle{
        display:inline-flex;align-items:center;gap:8px;
        padding:6px 12px 6px 8px;border-radius:999px;
        background:rgba(8,8,14,.72);border:1px solid rgba(247,213,139,.45);color:#f7d58b;
        -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
        box-shadow:0 4px 14px rgba(0,0,0,.5);
      }
      .som-controle--flutuante{position:fixed;right:14px;bottom:14px;z-index:60}
      .som-controle__icone{
        display:inline-flex;align-items:center;justify-content:center;
        width:30px;height:30px;padding:0;border:0;border-radius:50%;cursor:pointer;
        background:transparent;color:inherit;
      }
      .som-controle__icone:focus-visible{outline:2px solid #f7d58b;outline-offset:2px}
      .som-controle .mudo{display:none}
      .som-controle.is-mudo{color:#8b8573}
      .som-controle.is-mudo .mudo{display:inline}
      .som-controle.is-mudo .onda1,.som-controle.is-mudo .onda2,.som-controle.is-baixo .onda2{display:none}
      .som-controle__barra{
        -webkit-appearance:none;appearance:none;width:110px;height:22px;margin:0;
        background:transparent;cursor:pointer;--nivel:70%;
      }
      .som-controle__barra:focus-visible{outline:2px solid #f7d58b;outline-offset:3px;border-radius:999px}
      .som-controle__barra::-webkit-slider-runnable-track{
        height:4px;border-radius:999px;
        background:linear-gradient(90deg,#f7d58b var(--nivel),rgba(255,255,255,.18) var(--nivel));
      }
      .som-controle__barra::-moz-range-track{height:4px;border-radius:999px;background:rgba(255,255,255,.18)}
      .som-controle__barra::-moz-range-progress{height:4px;border-radius:999px;background:#f7d58b}
      .som-controle__barra::-webkit-slider-thumb{
        -webkit-appearance:none;width:16px;height:16px;margin-top:-6px;border-radius:50%;
        background:#fff3d0;border:2px solid #d4af37;box-shadow:0 0 8px rgba(247,213,139,.8);
      }
      .som-controle__barra::-moz-range-thumb{
        width:14px;height:14px;border-radius:50%;
        background:#fff3d0;border:2px solid #d4af37;box-shadow:0 0 8px rgba(247,213,139,.8);
      }
      @media (max-width:520px){
        .som-controle--flutuante{right:10px;bottom:10px;padding:4px 10px 4px 6px}
        .som-controle__barra{width:88px}
      }
      /* na jornada o canto inferior direito é da chama: o controle vai para a esquerda */
      body:has(#flame-bottom-right) .som-controle--flutuante{right:auto;left:14px}
      @media (max-width:520px){ body:has(#flame-bottom-right) .som-controle--flutuante{left:10px} }
    `;
    document.head.appendChild(st);
  }

  window.SomUniverso = {
    isOn: () => on,
    setOn,
    toggle: () => setOn(!on),
    volume: () => (on ? userVol : 0),
    setVolume,
    chime,
    whoosh,
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    // diagnóstico: o que está tocando agora
    estado: () => ({
      ligado: on,
      modo: mode,
      tocando: isAudible(),
      faixa: mode === 'music' ? track + 1 : null,
      posicaoMusica: music ? Number((music.currentTime || 0).toFixed(1)) : null,
      volumeMusica: music ? Number((musicGain ? musicGain.gain.value : music.volume).toFixed(2)) : null,
      abaixadaPorLeitura: ducked,
      controle: volumeVisivel()
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
