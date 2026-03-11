// /assets/js/jornada-typing-bridge.js — FINAL (Voice Manager + anti-eco seguro + latch)
// - Voz correta por idioma + guia
// - Aguarda voices carregarem
// - Anti-eco NÃO deixa texto sumir (forceShow)
// - getLangNow alinhado: i18n.currentLang + sessionStorage jornada.lang + etc.

(function (window) {
  'use strict';

  if (window.__TypingBridgeReady) return;
  window.__TypingBridgeReady = true;

  // =========================
  // DEBUG (desliga logs por padrão)
  // Use no console: window.DEBUG_TYPING = true
  // =========================
  const typingLog = (...args) => {
    if (window.DEBUG_TYPING) console.log('[TypingBridge]', ...args);
  };

  function getLangNow() {
    return (
      window.i18n?.currentLang ||
      window.i18n?.lang ||
      sessionStorage.getItem('jornada.lang') ||
      sessionStorage.getItem('i18n.lang') ||
      localStorage.getItem('jc.lang') ||
      localStorage.getItem('i18n_lang') ||
      document.documentElement?.lang ||
      'pt-BR'
    );
  }

  function getGuideNow() {
    return String(
      sessionStorage.getItem('jornada.guide') ||
      sessionStorage.getItem('guiaEscolhido') ||
      localStorage.getItem('jornada.guide') ||
      localStorage.getItem('guiaEscolhido') ||
      window.currentGuide ||
      'lumen'
    ).trim().toLowerCase();
  }

  // =========================
  // VOICE MANAGER (global)
  // - aguarda voices carregarem (voiceschanged / timeout)
  // - cache por idioma + guia
  // =========================
  let __voices = [];
  let __voicesPromise = null;
  const __voiceCache = new Map(); // `${lang}::${guide}` -> SpeechSynthesisVoice|null

  const GUIDE_VOICE_PROFILE = {
    zion:  { gender: 'male',   style: 'firm' },
    lumen: { gender: 'female', style: 'warm' },
    arian: { gender: 'female', style: 'inspiring' },
    ariane:{ gender: 'female', style: 'inspiring' }
  };

  function __loadVoicesNow() {
    try {
      __voices = speechSynthesis.getVoices?.() || [];
    } catch {
      __voices = [];
    }
    return __voices;
  }

  function __normalizeLang(lang) {
    const raw = String(lang || 'pt-BR').trim().replace('_', '-');

    const map = {
      pt: 'pt-BR',
      'pt-br': 'pt-BR',
      en: 'en-US',
      'en-us': 'en-US',
      es: 'es-ES',
      'es-es': 'es-ES'
    };

    return map[raw.toLowerCase()] || raw;
  }

  function __ensureVoicesReady(timeoutMs = 1400) {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    __loadVoicesNow();
    if (__voices.length) return Promise.resolve();

    if (!__voicesPromise) {
      __voicesPromise = new Promise((resolve) => {
        const t0 = Date.now();
        let done = false;

        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };

        const tick = () => {
          __loadVoicesNow();
          if (__voices.length) return finish();
          if (Date.now() - t0 > timeoutMs) return finish();
          setTimeout(tick, 80);
        };

        try {
          const prev = speechSynthesis.onvoiceschanged;
          speechSynthesis.onvoiceschanged = () => {
            try { if (typeof prev === 'function') prev(); } catch {}
            __loadVoicesNow();
            finish();
          };
        } catch {}

        tick();
      });
    }

    return __voicesPromise;
  }

  function __voiceNameScore(name, profile = {}) {
    const n = String(name || '').toLowerCase();
    let score = 0;

    // gênero
    if (profile.gender === 'male') {
      if (/male|man|homem|masculin/.test(n)) score += 40;
      if (/daniel|david|alex|jorge|paul|carlos|felipe|ricardo|antonio|bruno|google uk english male/.test(n)) score += 30;
    }

    if (profile.gender === 'female') {
      if (/female|woman|mulher|feminin/.test(n)) score += 40;
      if (/zira|samantha|helena|luciana|maria|sofia|victoria|ana|paulina|monica|google uk english female/.test(n)) score += 30;
    }

    // estilo
    if (profile.style === 'warm') {
      if (/helena|luciana|maria|sofia|samantha|paulina|monica/.test(n)) score += 12;
    }

    if (profile.style === 'inspiring') {
      if (/sofia|victoria|helena|maria|ana|paulina|monica/.test(n)) score += 12;
    }

    if (profile.style === 'firm') {
      if (/alex|daniel|david|jorge|carlos|paul|ricardo|antonio|bruno/.test(n)) score += 12;
    }

    return score;
  }

  function __rankVoices(candidates, lang, profile) {
    const L = String(lang || '').toLowerCase();
    const prefix = L.split('-')[0];

    return candidates
      .map((v) => {
        let score = __voiceNameScore(v.name, profile);

        const vLang = String(v.lang || '').toLowerCase();

        if (vLang === L) score += 25;
        else if (vLang.startsWith(prefix)) score += 14;

        if (typeof v.localService === 'boolean' && v.localService) score += 8;

        // Algumas vozes do Google / Microsoft costumam ser mais estáveis
        if (/google|microsoft|natural|neural/i.test(String(v.name || ''))) score += 6;

        return { v, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  function __pickBestVoice(lang, guide) {
    lang = __normalizeLang(lang);
    guide = String(guide || 'lumen').toLowerCase();

    const cacheKey = `${lang}::${guide}`;
    if (__voiceCache.has(cacheKey)) return __voiceCache.get(cacheKey);

    const L = lang.toLowerCase();
    const prefix = L.split('-')[0];
    const profile = GUIDE_VOICE_PROFILE[guide] || GUIDE_VOICE_PROFILE.lumen;

    // 1) candidatos exatos do idioma
    let candidates = __voices.filter(v => String(v.lang || '').toLowerCase() === L);

    // 2) candidatos por prefixo
    if (!candidates.length) {
      candidates = __voices.filter(v => String(v.lang || '').toLowerCase().startsWith(prefix));
    }

    // 3) fallback global
    if (!candidates.length) {
      candidates = [...__voices];
    }

    if (!candidates.length) {
      __voiceCache.set(cacheKey, null);
      return null;
    }

    const ranked = __rankVoices(candidates, lang, profile);
    const best = ranked[0]?.v || null;

    __voiceCache.set(cacheKey, best);
    return best;
  }

  async function __applyVoice(utt, lang) {
    if (!utt || !('speechSynthesis' in window)) return;

    await __ensureVoicesReady();

    const guide = getGuideNow();
    const voice = __pickBestVoice(lang, guide);

    if (voice) {
      utt.voice = voice;
      utt.lang = voice.lang || __normalizeLang(lang);
    } else {
      utt.lang = __normalizeLang(lang);
    }
  }

  // Teste rápido (console):
  // window.TYPING_DEBUG_VOICES()
  window.TYPING_DEBUG_VOICES = async function () {
    if (!('speechSynthesis' in window)) {
      console.log('speechSynthesis não disponível.');
      return;
    }

    await __ensureVoicesReady();

    const guide = getGuideNow();
    const lang = __normalizeLang(getLangNow());
    const picked = __pickBestVoice(lang, guide);

    const list = (__voices || []).map(v => ({
      name: v.name,
      lang: v.lang,
      local: v.localService,
      default: v.default
    }));

    console.table(list);
    console.log('Idiomas detectados:', [...new Set(list.map(x => x.lang))]);
    console.log('Guia atual:', guide);
    console.log('Idioma atual:', lang);
    console.log('Voz escolhida:', picked ? { name: picked.name, lang: picked.lang } : null);
  };

  // ====== ESTILO DO CURSOR ======
  (function ensureStyle() {
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret {
        display: inline-block;
        width: 0.6ch;
        margin-left: 2px;
        animation: blink 1s step-end infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }

      [data-typing="true"] { opacity: 0; transition: opacity 0.1s; }
      .typing-done[data-typing] { opacity: 1 !important; }
    `;
    document.head.appendChild(st);
  })();

  let abortCurrent = null;

  // ====== FUNÇÕES DE LOCK ======
  function lock() { window.__typingLock = true; }
  function unlock() { window.__typingLock = false; }

  // ====== HELPERS ======
  function makeTypingSig(text) {
    const lang = getLangNow();
    const t = String(text || '').trim();
    return `${lang}::${t}`;
  }

  // Anti-eco GLOBAL (segura cascatas mesmo se DOM recriou)
  let __lastTypingSig = '';
  let __lastTypingAt = 0;

  function shouldSkipTyping(sig) {
    const now = Date.now();
    if (sig === __lastTypingSig && (now - __lastTypingAt) < 1400) return true;
    __lastTypingSig = sig;
    __lastTypingAt = now;
    return false;
  }

  // ✅ IMPORTANTÍSSIMO: quando pular, NÃO pode deixar vazio.
  function forceShow(element, text) {
    if (!element) return;
    element.textContent = String(text || '');
    element.style.opacity = '1';
    element.classList.add('typing-done');
    element.dataset.typingDone = '1';
    try { element.dataset.typingSig = makeTypingSig(text); } catch {}
  }

  // ====== DATILOGRAFIA ======
  async function typeText(element, text, speed = 40, showCursor = true) {
    return new Promise(resolve => {
      if (!element || !text) return resolve();

      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => (abort = true);

      element.classList.remove('typing-done');
      element.style.opacity = '0';

      let caret = element.querySelector('.typing-caret');
      if (!caret) {
        caret = document.createElement('span');
        caret.className = 'typing-caret';
        caret.textContent = '|';
      }

      element.textContent = '';
      if (showCursor) element.appendChild(caret);
      element.style.opacity = '1';

      let i = 0;
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          return resolve();
        }

        element.textContent = text.slice(0, i + 1);
        if (showCursor) element.appendChild(caret);

        try { window.Luz?.bump({ peak: 1.18, ms: 120 }); } catch {}

        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          element.classList.add('typing-done');
          element.dataset.typingDone = '1';
          resolve();
        }
      }, speed);
    });
  }

  // ====== API PRINCIPAL ======
  window.runTyping = (element, text, callback, options = {}) => {
    const speed = options.speed || 36;
    const showCursor = options.cursor ?? true;

    try {
      const sig = makeTypingSig(text);

      // 1) anti-eco GLOBAL (NUNCA deixa vazio)
      if (shouldSkipTyping(sig)) {
        forceShow(element, text);
        if (typeof callback === 'function') setTimeout(callback, 0);
        return;
      }

      // 2) latch por elemento (mesmo texto/idioma, mesmo elemento)
      const prev = element?.dataset?.typingSig;
      if (element && prev === sig && element.classList.contains('typing-done')) {
        forceShow(element, text);
        if (typeof callback === 'function') setTimeout(callback, 0);
        return;
      }

      if (element) element.dataset.typingSig = sig;
    } catch {}

    typingLog('Iniciando runTyping…');
    lock();

    try { window.Luz?.startPulse({ min: 1, max: 1.25, speed: 140 }); } catch {}

    typeText(element, text, speed, showCursor).then(() => {
      try { window.Luz?.stopPulse(); } catch {}
      unlock();
      if (callback) callback();
    });
  };

  // ===========================================================
  //  EFEITOS DE VOZ
  // ===========================================================
  window.EffectCoordinator = window.EffectCoordinator || {};

  let __lastSpeakSig = '';
  let __lastSpeakAt = 0;

  window.EffectCoordinator.speak = (text, options = {}) => {
    if (!text || !('speechSynthesis' in window)) return;

    const lang = __normalizeLang(getLangNow());
    const clean = String(text).trim();
    const sig = `${lang}::${clean}`;
    const now = Date.now();

    if (sig === __lastSpeakSig && (now - __lastSpeakAt) < 1600) return;
    __lastSpeakSig = sig;
    __lastSpeakAt = now;

    try { speechSynthesis.cancel(); } catch {}

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = lang;
    utt.rate = options.rate ?? 1.03;
    utt.pitch = options.pitch ?? 1.0;
    utt.volume = options.volume ?? 1.0;

    utt.onboundary = () => {
      try { window.Luz?.startPulse({ min: 1, max: 1.45, speed: 120 }); } catch {}
    };
    utt.onend = () => {
      try { window.Luz?.stopPulse(); } catch {}
    };
    utt.onerror = () => {
      try { window.Luz?.stopPulse(); } catch {}
    };

    const speakNow = () => {
      try {
        speechSynthesis.speak(utt);
        typingLog(
          'TTS falando…',
          {
            lang: utt.lang,
            guide: getGuideNow(),
            voice: utt.voice?.name || '(default)'
          }
        );
      } catch {}
    };

    Promise.resolve(__applyVoice(utt, lang))
      .catch(() => {})
      .finally(speakNow);
  };

  // ===========================================================
  //  typeAndSpeak — datilografa e fala (voz correta)
  // ===========================================================
  window.typeAndSpeak = async function (element, text, speed = 36) {
    if (!text || !element) return;

    try {
      const sig = makeTypingSig(text);

      // latch por elemento
      if (element.dataset.typingSig === sig && element.classList.contains('typing-done')) return;

      // anti-eco global (NUNCA deixa vazio)
      if (shouldSkipTyping(sig)) {
        forceShow(element, text);
        return;
      }

      element.dataset.typingSig = sig;
    } catch {}

    let terminou = false;

    if ('speechSynthesis' in window) {
      const lang = __normalizeLang(getLangNow());
      const utt = new SpeechSynthesisUtterance(String(text).trim());

      utt.lang = lang;
      utt.rate = 0.95;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      utt.onend = () => { terminou = true; };
      utt.onerror = () => { terminou = true; };

      try { await __applyVoice(utt, lang); } catch {}

      try { speechSynthesis.cancel(); } catch {}
      try { speechSynthesis.speak(utt); } catch { terminou = true; }
    } else {
      terminou = true;
    }

    await window.runTyping(element, text, null, { speed });

    while (!terminou) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 80));
    }
  };

  typingLog('TypingBridge pronto');
})(window);
