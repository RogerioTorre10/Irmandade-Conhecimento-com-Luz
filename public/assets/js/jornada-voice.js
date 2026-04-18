(function (window, document) {
  'use strict';

  if (window.__JORNADA_VOICE__) return;
  window.__JORNADA_VOICE__ = true;

  const MOD = '[JORNADA_VOICE]';

  function log(...a) { console.log(MOD, ...a); }
  function warn(...a) { console.warn(MOD, ...a); }

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

  function normalizeGuide(raw) {
    const x = String(raw || '').trim().toLowerCase();
    if (!x) return 'lumen';
    if (x === 'arian') return 'arian';
    if (x === 'arion') return 'arian';
    if (x.includes('lumen')) return 'lumen';
    if (x.includes('zion')) return 'zion';
    if (x.includes('arian') || x.includes('arion')) return 'arian';
    return 'lumen';
  }

  function getGuide() {
    const raw =
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('JORNADA_GUIA') ||
      localStorage.getItem('jornada.guia') ||
      document.body.dataset.guia ||
      document.documentElement.dataset.guia ||
      'lumen';

    return normalizeGuide(raw);
  }

  function stop() {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  }

  function allVoices() {
    try {
      return window.speechSynthesis?.getVoices?.() || [];
    } catch {
      return [];
    }
  }

  function baseLang(lang) {
    return String(lang || 'pt-BR').toLowerCase().split('-')[0];
  }

  function genderHintsForGuide(guide) {
    if (guide === 'zion') {
      return {
        preferred: 'male',
        wanted: [
          'male', 'man', 'mascul', 'homem',
          'daniel', 'jorge', 'paulo', 'ricardo',
          'david', 'thomas', 'matthew', 'microsoft david',
          'google português', 'google us english male'
        ]
      };
    }

    // Lumen e Arian = feminino
    return {
      preferred: 'female',
      wanted: [
        'female', 'woman', 'femin', 'mulher',
        'maria', 'helena', 'luciana', 'samantha', 'victoria',
        'zira', 'hazel', 'aria', 'ana', 'google português do brasil',
        'microsoft zira', 'google us english'
      ]
    };
  }

  function scoreVoice(v, lang, guide) {
    const name = String(v?.name || '').toLowerCase();
    const vlang = String(v?.lang || '').toLowerCase();
    const full = String(lang || 'pt-BR').toLowerCase();
    const short = baseLang(lang);
    const hints = genderHintsForGuide(guide);

    let score = 0;

    // idioma exato
    if (vlang === full) score += 100;
    // idioma parcial
    else if (vlang.startsWith(short)) score += 60;

    // vozes locais costumam soar melhor
    if (v?.localService) score += 10;
    if (v?.default) score += 8;

    // gênero/identidade por guia
    for (const hint of hints.wanted) {
      if (name.includes(hint)) score += 25;
    }

    // alguns idiomas têm nomes comuns de voz
    if (short === 'pt') {
      if (name.includes('portugu')) score += 12;
      if (name.includes('brazil')) score += 10;
      if (name.includes('brasil')) score += 10;
    }

    if (short === 'en') {
      if (name.includes('english')) score += 10;
      if (name.includes('us')) score += 8;
    }

    if (short === 'es') {
      if (name.includes('spanish')) score += 10;
      if (name.includes('espa')) score += 10;
    }

    if (short === 'fr') {
      if (name.includes('french')) score += 10;
      if (name.includes('fran')) score += 10;
    }

    if (short === 'zh') {
      if (name.includes('chinese')) score += 10;
      if (name.includes('mandarin')) score += 12;
      if (name.includes('zh')) score += 8;
    }

    return score;
  }

  function pickVoice(lang = getLang(), guide = getGuide()) {
    const voices = allVoices();
    if (!voices.length) return null;

    const ranked = voices
      .map(v => ({ voice: v, score: scoreVoice(v, lang, guide) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.voice || null;

    if (best) {
      log('voz escolhida:', {
        guide,
        lang,
        name: best.name,
        voiceLang: best.lang
      });
    }

    return best;
  }

  function speak(text, opts = {}) {
    const clean = String(text || '').trim();
    if (!clean) return Promise.resolve();

    const guide = normalizeGuide(opts.guide || getGuide());
    const lang = String(opts.lang || getLang()).trim() || 'pt-BR';
    const rate = Number(opts.rate ?? 0.94);
    const pitch = Number(opts.pitch ?? 1.0);
    const volume = Number(opts.volume ?? 1.0);

    return new Promise((resolve) => {
      try {
        stop();

        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = lang;
        utter.rate = rate;
        utter.pitch = pitch;
        utter.volume = volume;

        const voice = pickVoice(lang, guide);
        if (voice) utter.voice = voice;

        utter.onend = () => resolve();
        utter.onerror = () => resolve();

        window.speechSynthesis.speak(utter);
      } catch (e) {
        warn('falha no speak:', e);
        resolve();
      }
    });
  }

  function preload() {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices(); } catch {}
      };
    } catch {}
  }

  window.JORNADA_VOICE = {
    getLang,
    getGuide,
    normalizeGuide,
    pickVoice,
    speak,
    stop,
    preload
  };

  preload();
})(window, document);
