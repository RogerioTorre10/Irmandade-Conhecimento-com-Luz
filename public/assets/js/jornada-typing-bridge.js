(function (window) {
  'use strict';

  if (window.__TypingBridgeReady) return;
  window.__TypingBridgeReady = true;

  const typingLog = (...args) => {
    if (window.DEBUG_TYPING) console.log('[TypingBridge]', ...args);
  };

  function __normalizeLang(lang) {
    const raw = String(lang || 'pt-BR').trim().replace('_', '-');
    const lower = raw.toLowerCase();

    const map = {
      pt: 'pt-BR',
      'pt-br': 'pt-BR',
      'pt-pt': 'pt-BR',
      en: 'en-US',
      'en-us': 'en-US',
      'en-gb': 'en-US',
      es: 'es-ES',
      'es-es': 'es-ES',
      'es-mx': 'es-ES',
      'es-ar': 'es-ES',
      fr: 'fr-FR',
      'fr-fr': 'fr-FR',
      'fr-ca': 'fr-FR',
      ja: 'ja-JP',
      'ja-jp': 'ja-JP',
      zh: 'zh-CN',
      'zh-cn': 'zh-CN',
      'zh-hans': 'zh-CN',
      'zh-sg': 'zh-CN',
      'cmn-hans-cn': 'zh-CN',
      de: 'de-DE',
      'de-de': 'de-DE',
      'de-at': 'de-DE',
      'de-ch': 'de-DE'
    };

    return map[lower] || raw;
  }

  function getLangNow() {
    const raw =
      window.i18n?.currentLang ||
      window.i18n?.lang ||
      sessionStorage.getItem('jornada.lang') ||
      sessionStorage.getItem('i18n.lang') ||
      localStorage.getItem('jc.lang') ||
      localStorage.getItem('i18n_lang') ||
      document.documentElement?.lang ||
      'pt-BR';

    return __normalizeLang(raw);
  }

  function getGuideNow() {
    return String(
      sessionStorage.getItem('jornada.guide') ||
      sessionStorage.getItem('guiaEscolhido') ||
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('jornada.guide') ||
      localStorage.getItem('guiaEscolhido') ||
      localStorage.getItem('jornada.guia') ||
      window.currentGuide ||
      'lumen'
    ).trim().toLowerCase();
  }

  let __voices = [];
  let __voicesPromise = null;
  const __voiceCache = new Map();

  const GUIDE_VOICE_PROFILE = {
   zion:  { gender: 'male',   style: 'imperial' },
   lumen: { gender: 'female', style: 'bright' },
   arian: { gender: 'female', style: 'counselor' },
   ariane:{ gender: 'female', style: 'counselor' },
   arion: { gender: 'female', style: 'counselor' }
 };

  function __loadVoicesNow() {
    try {
      __voices = speechSynthesis.getVoices?.() || [];
    } catch {
      __voices = [];
    }
    return __voices;
  }

  function __ensureVoicesReady(timeoutMs = 1600) {
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

  function __voiceNameScore(name, profile = {}, lang = '') {
    const n = String(name || '').toLowerCase();
    const L = String(lang || '').toLowerCase();
    let score = 0;

    if (profile.gender === 'male') {
      if (/male|man|homem|masculin|masculine/.test(n)) score += 40;
      if (/daniel|david|alex|jorge|paul|carlos|felipe|ricardo|antonio|bruno|thomas/.test(n)) score += 30;
    }

    if (profile.gender === 'female') {
      if (/female|woman|mulher|feminin|feminine/.test(n)) score += 40;
      if (/zira|samantha|helena|luciana|maria|sofia|victoria|ana|paulina|monica|marie|amelie|celine|audrey|denise/.test(n)) score += 30;
    }

    if (L.startsWith('fr')) {
      if (/hortense|thomas|amelie|marie|celine|audrey|denise/.test(n)) score += 18;
    }

    if (L.startsWith('zh')) {
      if (/huihui|yaoyao|xiaoxiao|xiaoyi|yunxi|yunyang/.test(n)) score += 18;
    }

    if (L.startsWith('ja')) {
      if (/haruka|ayumi|ichiro|takumi|kyoko|otoya|sayaka/.test(n)) score += 18;
    }

    if (L.startsWith('es')) {
      if (/jorge|carlos|maria|sofia|paulina|helena/.test(n)) score += 14;
    }

    if (L.startsWith('pt')) {
      if (/luciana|maria|helena|ricardo|antonio|bruno/.test(n)) score += 14;
    }

    if (profile.style === 'warm') {
      if (/helena|luciana|maria|sofia|samantha|paulina|monica|amelie|celine/.test(n)) score += 12;
    }

    if (profile.style === 'inspiring') {
      if (/sofia|victoria|helena|maria|ana|paulina|monica|xiaoxiao|yaoyao/.test(n)) score += 12;
    }

    if (profile.style === 'firm') {
      if (/alex|daniel|david|jorge|carlos|paul|ricardo|antonio|bruno|thomas/.test(n)) score += 12;
    }

    if (profile.style === 'imperial') {
      if (/thomas|daniel|david|alex|jorge|carlos|ricardo|antonio|bruno|paul/.test(n)) score += 18;
      if (/male|man|masculine|masculin/.test(n)) score += 14;
      if (/neural|natural|microsoft|google/i.test(n)) score += 8;
    }

    if (profile.style === 'bright') {
      if (/samantha|sofia|victoria|luciana|maria|ana|zira|paulina|sayaka/.test(n)) score += 18;
      if (/female|woman|feminine|feminin/.test(n)) score += 14;
      if (/neural|natural|google|microsoft/i.test(n)) score += 8;
    }

    if (profile.style === 'counselor') {
      if (/helena|monica|paulina|marie|amelie|celine|denise|audrey|kyoko/.test(n)) score += 18;
      if (/female|woman|feminine|feminin/.test(n)) score += 12;
      if (/neural|natural|google|microsoft/i.test(n)) score += 8;
    }

    return score;
  }

  function __rankVoices(candidates, lang, profile) {
    const L = String(lang || '').toLowerCase();
    const prefix = L.split('-')[0];

    return candidates
      .map((v) => {
        let score = __voiceNameScore(v.name, profile, lang);
        const vLang = String(v.lang || '').toLowerCase();

        if (vLang === L) score += 25;
        else if (vLang.startsWith(prefix)) score += 14;

        if (typeof v.localService === 'boolean' && v.localService) score += 8;
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

    let exact = __voices.filter(v => String(v.lang || '').toLowerCase() === L);
    let family = __voices.filter(v => String(v.lang || '').toLowerCase().startsWith(prefix));

    if (!exact.length && prefix === 'zh') {
      family = __voices.filter(v =>
        /zh|cmn|chinese/i.test(String(v.lang || '') + ' ' + String(v.name || ''))
      );
    }

    if (!exact.length && prefix === 'fr') {
      family = __voices.filter(v =>
        /fr|french/i.test(String(v.lang || '') + ' ' + String(v.name || ''))
      );
    }

    if (!exact.length && prefix === 'ja') {
      family = __voices.filter(v =>
        /ja|japanese/i.test(String(v.lang || '') + ' ' + String(v.name || ''))
      );
    }

    let candidates = exact.length ? exact : family;

    if (!candidates.length) {
      typingLog('Nenhuma voz compatível com o idioma. Usando fallback global.', {
        requestedLang: lang,
        guide
      });
      candidates = [...__voices];
    }

    if (!candidates.length) {
      __voiceCache.set(cacheKey, null);
      return null;
    }

    const ranked = __rankVoices(candidates, lang, profile);
    const best = ranked[0]?.v || null;

    typingLog('Voz escolhida', {
      requestedLang: lang,
      chosenVoice: best?.name || null,
      chosenVoiceLang: best?.lang || null,
      guide
    });

    __voiceCache.set(cacheKey, best);
    return best;
  }

  async function __applyVoice(utt, lang) {
    if (!utt || !('speechSynthesis' in window)) return;

    const normalizedLang = __normalizeLang(lang || getLangNow());

    await __ensureVoicesReady();

    const guide = getGuideNow();
    const voice = __pickBestVoice(normalizedLang, guide);

    if (voice) {
      utt.voice = voice;
      utt.lang = __normalizeLang(voice.lang || normalizedLang);
    } else {
      utt.voice = null;
      utt.lang = normalizedLang;
    }

    typingLog('Aplicando voz ao utterance', {
      guide,
      requestedLang: normalizedLang,
      finalLang: utt.lang,
      voice: utt.voice?.name || '(default)'
    });
  }

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
      .typing-done[data-typing],
      .typing-done { opacity: 1 !important; }
      .typing-active { opacity: 1 !important; }
    `;
    document.head.appendChild(st);
  })();

  let abortCurrent = null;

  function lock() { window.__typingLock = true; }
  function unlock() { window.__typingLock = false; }

  function getElementTypingKey(element) {
    if (!element) return 'no-element';

    return String(
      element.id ||
      element.getAttribute?.('data-typing-id') ||
      element.getAttribute?.('data-i18n-key') ||
      element.className ||
      element.tagName ||
      'anon'
    ).trim();
  }

  function makeTypingSig(text, element) {
    const lang = getLangNow();
    const t = String(text || '').trim();
    const elKey = getElementTypingKey(element);
    return `${lang}::${elKey}::${t}`;
  }

  function shouldSkipTyping(sig, element, options = {}) {
    if (options.forceReplay) return false;
    if (!sig) return false;

    const now = Date.now();
    const lastSig = element?.dataset?.typingLastSig || '';
    const lastAt = Number(element?.dataset?.typingLastAt || 0);

    if (sig === lastSig && (now - lastAt) < 1200) return true;

    if (element?.dataset) {
      element.dataset.typingLastSig = sig;
      element.dataset.typingLastAt = String(now);
    }

    return false;
  }

  function forceShow(element, text) {
    if (!element) return;
    element.textContent = String(text || '');
    element.style.opacity = '1';
    element.classList.remove('typing-active');
    element.classList.add('typing-done');
    element.dataset.typingDone = '1';
    try { element.dataset.typingSig = makeTypingSig(text, element); } catch {}
  }

  function clearTypingRuntimeState(element) {
    if (!element) return;

    const caret = element.querySelector?.('.typing-caret');
    if (caret) caret.remove();

    element.classList.remove('typing-active', 'typing-done', 'type-done');
    delete element.dataset.typingDone;

    if (element.dataset?.forceReplayNow === '1') {
      delete element.dataset.typingSig;
      delete element.dataset.typingLastSig;
      delete element.dataset.typingLastAt;
      delete element.dataset.forceReplayNow;
    }
  }

  async function typeText(element, text, speed = 40, showCursor = true) {
    return new Promise((resolve) => {
      if (!element || !text) return resolve();

      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => { abort = true; };

      clearTypingRuntimeState(element);
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      element.textContent = '';

let caret = element.querySelector('.typing-caret');
  if (!caret) {
    caret = document.createElement('span');
    caret.className = 'typing-caret';
    caret.textContent = '|';
}

element.classList.add('typing-active');

if (showCursor) element.appendChild(caret);

      let i = 0;
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          element.classList.remove('typing-active');
          return resolve();
        }

  const partial = text.slice(0, i + 1);
     element.textContent = partial;

  if (showCursor) {
    element.appendChild(caret);
 }

        try { window.Luz?.bump({ peak: 1.18, ms: 120 }); } catch {}

        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          element.classList.remove('typing-active');
          element.classList.add('typing-done');
          element.dataset.typingDone = '1';
          resolve();
        }
      }, speed);
    });
  }

  window.runTyping = (element, text, callback, options = {}) => {
    const speed = options.speed || 42;
    const showCursor = options.cursor ?? true;
    const clean = String(text || '').replace(/\s+/g, ' ').trim();

    if (!element || !clean) {
      if (typeof callback === 'function') setTimeout(callback, 0);
      return Promise.resolve();
    }

    if (options.forceReplay) {
      element.dataset.forceReplayNow = '1';
      clearTypingRuntimeState(element);
      element.textContent = '';
    }

    try {
      const sig = makeTypingSig(clean, element);

      if (shouldSkipTyping(sig, element, options)) {
        forceShow(element, clean);
        if (typeof callback === 'function') setTimeout(callback, 0);
        return Promise.resolve();
      }

      const prev = element?.dataset?.typingSig;
      if (
        !options.forceReplay &&
        element &&
        prev === sig &&
        element.classList.contains('typing-done')
      ) {
        forceShow(element, clean);
        if (typeof callback === 'function') setTimeout(callback, 0);
        return Promise.resolve();
      }

      if (element) element.dataset.typingSig = sig;
    } catch {}

    typingLog('Iniciando runTyping…');
    lock();

    try { window.Luz?.startPulse({ min: 1, max: 1.25, speed: 140 }); } catch {}

    return typeText(element, clean, speed, showCursor).then(() => {
      try { window.Luz?.stopPulse(); } catch {}
      unlock();
      if (callback) callback();
    });
  };

  window.EffectCoordinator = window.EffectCoordinator || {};

  function getGuideSpeechTuning(guide, lang) {
    const g = String(guide || 'lumen').toLowerCase();
    const L = String(lang || 'pt-BR');

    let baseRate = 1.0;
    let basePitch = 1.0;

    if (L.startsWith('zh')) {
      baseRate = 0.92;
      basePitch = 1.0;
    } else if (L.startsWith('ja')) {
      baseRate = 0.94;
      basePitch = 1.0;
    } else if (L.startsWith('fr')) {
      baseRate = 0.98;
      basePitch = 1.0;
    } else if (L.startsWith('es')) {
      baseRate = 0.99;
      basePitch = 1.0;
    } else if (L.startsWith('en')) {
      baseRate = 1.0;
      basePitch = 1.0;
    }

    if (g === 'zion') {
      return { rate: Math.max(0.88, baseRate - 0.06), pitch: 0.82, volume: 1.0 };
    }

    if (g === 'lumen') {
      return { rate: Math.min(1.08, baseRate + 0.03), pitch: 1.14, volume: 1.0 };
    }

    return { rate: Math.max(0.90, baseRate - 0.02), pitch: 0.96, volume: 1.0 };
  }

  let __lastSpeakSig = '';
  let __lastSpeakAt = 0;

  window.EffectCoordinator.speak = (text, options = {}) => {
    if (!text || !('speechSynthesis' in window)) return;

    const lang = getLangNow();
    const guide = getGuideNow();
    const tuning = getGuideSpeechTuning(guide, lang);

    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (!clean) return;

    const sig = `${lang}::${guide}::${clean}`;
    const now = Date.now();

    if (sig === __lastSpeakSig && (now - __lastSpeakAt) < 1600) return;
    __lastSpeakSig = sig;
    __lastSpeakAt = now;

    try { speechSynthesis.cancel(); } catch {}

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = lang;
    utt.rate = options.rate ?? tuning.rate;
    utt.pitch = options.pitch ?? tuning.pitch;
    utt.volume = options.volume ?? tuning.volume;

    utt.onstart = () => {
      typingLog('TTS iniciou', {
        lang: utt.lang,
        guide,
        voice: utt.voice?.name || '(default)',
        rate: utt.rate,
        pitch: utt.pitch
      });
    };

    utt.onboundary = () => {
      try { window.Luz?.startPulse({ min: 1, max: 1.45, speed: 120 }); } catch {}
    };

    utt.onend = () => {
      try { window.Luz?.stopPulse(); } catch {}
    };

    utt.onerror = (ev) => {
      typingLog('TTS erro', {
        error: ev?.error || 'unknown',
        lang: utt.lang,
        guide,
        voice: utt.voice?.name || '(default)'
      });
      try { window.Luz?.stopPulse(); } catch {}
    };

    Promise.resolve(__applyVoice(utt, lang))
      .then(() => {
        try { speechSynthesis.speak(utt); } catch {}
      })
      .catch(() => {
        try { speechSynthesis.speak(utt); } catch {}
      });
  };

  window.typeAndSpeak = async function (element, text, speed = 42, options = {}) {
    if (!text || !element) return;

    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (!clean) return;

    if (options.forceReplay) {
      element.dataset.forceReplayNow = '1';
      clearTypingRuntimeState(element);
      element.textContent = '';
    }

    try {
      const sig = makeTypingSig(clean, element);

      if (
        !options.forceReplay &&
        element.dataset.typingSig === sig &&
        element.classList.contains('typing-done')
      ) {
        return;
      }

      element.dataset.typingSig = sig;
    } catch {}

    const lang = getLangNow();
    const guide = getGuideNow();
    const tuning = getGuideSpeechTuning(guide, lang);

    let speechDone = !('speechSynthesis' in window);
    let utt = null;

    const chars = clean.length;
    const estimatedSpeechMs = Math.max(
      1800,
      Math.min(9000, (chars / 14) * 1000 / Math.max(0.72, tuning.rate))
    );

    const typingSpeed = options.speed
      ? options.speed
      : Math.max(20, Math.min(46, Math.round(estimatedSpeechMs / Math.max(chars, 1))));

    if ('speechSynthesis' in window) {
      utt = new SpeechSynthesisUtterance(clean);
      utt.lang = lang;
      utt.rate = options.rate ?? tuning.rate;
      utt.pitch = options.pitch ?? tuning.pitch;
      utt.volume = options.volume ?? tuning.volume;

      utt.onstart = () => {
        typingLog('typeAndSpeak iniciou', {
          lang: utt.lang,
          guide,
          voice: utt.voice?.name || '(default)',
          typingSpeed
        });
      };

      utt.onend = () => { speechDone = true; };
      utt.onerror = () => { speechDone = true; };

      try { await __applyVoice(utt, lang); } catch {}
    }

    if (utt) {
      try { speechSynthesis.cancel(); } catch {}
      try { speechSynthesis.speak(utt); } catch { speechDone = true; }
      await new Promise(r => setTimeout(r, 90));
    }

    await window.runTyping(element, clean, null, {
      speed: typingSpeed,
      cursor: options.cursor ?? true,
      forceReplay: options.forceReplay ?? false
    });

    while (!speechDone) {
      await new Promise(r => setTimeout(r, 60));
    }
  };

  window.__TEST_TTS_JORNADA = async function (sampleText) {
    const lang = getLangNow();
    const guide = getGuideNow();

    await __ensureVoicesReady();

    const voice = __pickBestVoice(lang, guide);
    const text = String(
      sampleText ||
      ({
        'pt-BR': 'Meu coração permanece firme na luz.',
        'en-US': 'My heart remains steady in the light.',
        'es-ES': 'Mi corazón permanece firme en la luz.',
        'fr-FR': 'Mon cœur demeure ferme dans la lumière.',
        'ja-JP': '私の心は光の中で揺るがずにいます。',
        'zh-CN': '我的心在光中保持坚定。',
        'de-DE': 'Mein Herz bleibt standhaft im Licht.'
      }[lang] || 'Teste de voz da jornada.')
    );

    console.log('[TEST_TTS_JORNADA]', {
      lang,
      guide,
      voice: voice ? { name: voice.name, lang: voice.lang } : null,
      text
    });

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    if (voice) utt.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  };

  typingLog('TypingBridge pronto');
})(window);
