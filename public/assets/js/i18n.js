/* i18n.js — blindado global 6 idiomas + trava na intro + cache + fallback */
(function (window) {
  'use strict';

  if (window.__i18nReadyShim) return;
  window.__i18nReadyShim = true;

  const MOD = 'i18n.js';

  const STORAGE_KEY = 'i18n_lang';
  const LOCK_KEY = 'i18n_locked';
  const DEFAULT = 'pt-BR';
  const SUPPORTED = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'ja-JP', 'zh-CN'];

  const FORCE_LANG =
    (window.JORNADA_CFG && window.JORNADA_CFG.LANG) ||
    (document.documentElement && document.documentElement.getAttribute('data-lang')) ||
    window.__FORCE_LANG ||
    null;

  const state = {
    lang: DEFAULT,
    ready: false,
    dict: {},
    _langPromise: null
  };

  window.__I18N_DICT_CACHE__ = window.__I18N_DICT_CACHE__ || {};
  const DICT_CACHE = window.__I18N_DICT_CACHE__;

  window.__I18N_READY_LOGGED__ = window.__I18N_READY_LOGGED__ || {};

  function log() {
    console.log(`[${MOD}]`, ...arguments);
  }

  function warn() {
    console.warn(`[${MOD}]`, ...arguments);
  }

  function err() {
    console.error(`[${MOD}]`, ...arguments);
  }

  function normalizeLang(lang) {
    const raw = String(lang || '').trim().replace(/_/g, '-');
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

    const normalized = map[lower] || raw;

    if (SUPPORTED.includes(normalized)) return normalized;

    if (lower.startsWith('pt')) return 'pt-BR';
    if (lower.startsWith('en')) return 'en-US';
    if (lower.startsWith('es')) return 'es-ES';
    if (lower.startsWith('fr')) return 'fr-FR';
    if (lower.startsWith('ja')) return 'ja-JP';
    if (lower.startsWith('zh')) return 'zh-CN';
    if (lower.startsWith('de')) return 'de-DE';

    return DEFAULT;
  }

  function getStoredLang() {
    try {
      const s1 = normalizeLang(sessionStorage.getItem(STORAGE_KEY));
      if (SUPPORTED.includes(s1)) return s1;
    } catch (_) {}

    try {
      const s2 = normalizeLang(localStorage.getItem(STORAGE_KEY));
      if (SUPPORTED.includes(s2)) return s2;
    } catch (_) {}

    return null;
  }

  function setStoredLang(lang) {
    const safe = normalizeLang(lang);

    try { sessionStorage.setItem(STORAGE_KEY, safe); } catch (_) {}
    try { localStorage.setItem(STORAGE_KEY, safe); } catch (_) {}

    try { sessionStorage.setItem('jornada.lang', safe); } catch (_) {}
    try { sessionStorage.setItem('i18n.lang', safe); } catch (_) {}

    try { localStorage.setItem('jornada.lang', safe); } catch (_) {}
    try { localStorage.setItem('i18n.lang', safe); } catch (_) {}
  }

  function isLocked() {
    try {
      if (sessionStorage.getItem(LOCK_KEY) === '1') return true;
    } catch (_) {}

    try {
      if (localStorage.getItem(LOCK_KEY) === '1') return true;
    } catch (_) {}

    return false;
  }

  function setLocked(flag) {
    const value = flag ? '1' : '0';
    try { sessionStorage.setItem(LOCK_KEY, value); } catch (_) {}
    try { localStorage.setItem(LOCK_KEY, value); } catch (_) {}
  }

  function detectLang() {
    if (isLocked()) {
      const lockedStored = getStoredLang();
      if (lockedStored && SUPPORTED.includes(lockedStored)) return lockedStored;
    }

    const forced = normalizeLang(FORCE_LANG);
    if (forced && SUPPORTED.includes(forced)) return forced;

    const stored = getStoredLang();
    if (stored && SUPPORTED.includes(stored)) return stored;

    const nav = normalizeLang(navigator.language || navigator.userLanguage || DEFAULT);
    if (SUPPORTED.includes(nav)) return nav;

    return DEFAULT;
  }

  function getByPath(obj, path) {
    if (!obj || !path) return undefined;

    return String(path)
      .split('.')
      .reduce((acc, part) => {
        if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
          return acc[part];
        }
        return undefined;
      }, obj);
  }

  async function loadDict(lang) {
    lang = normalizeLang(lang);

    if (DICT_CACHE[lang]) {
      return await DICT_CACHE[lang];
    }

    const candidates = [
      `/assets/js/i18n/${lang}.json`,
      `/assets/i18n/${lang}.json`,
      `/i18n/${lang}.json`
    ];

    DICT_CACHE[lang] = (async () => {
      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          log('Carregado:', url);
          return json || {};
        } catch (e) {
          warn('Falha ao carregar', url, e);
        }
      }

      throw new Error('Nenhum dicionário encontrado para ' + lang);
    })();

    return await DICT_CACHE[lang];
  }

  async function init(lang) {
    state.lang = normalizeLang(lang || detectLang());

    if (!SUPPORTED.includes(state.lang)) {
      state.lang = DEFAULT;
    }

    try {
      state.dict = await loadDict(state.lang);
      state.ready = true;

      const readyKey = state.lang || DEFAULT;
      if (!window.__I18N_READY_LOGGED__[readyKey]) {
        window.__I18N_READY_LOGGED__[readyKey] = true;
        log('Pronto para:', readyKey);
      }

      setHtmlLangAttrs();
      emit('i18n:ready', { lang: state.lang });
    } catch (e) {
      err('Erro no init:', e);
      state.dict = {};
      state.ready = true;
      setHtmlLangAttrs();
      emit('i18n:ready', { lang: state.lang, degraded: true });
    }
  }

  function t(key, fallbackOrOpts) {
    if (!key) return '';

    let val = getByPath(state.dict, key);

    if (val == null && state.dict && typeof state.dict === 'object') {
      val = getByPath(state.dict.translations, key);
    }
    if (val == null && state.dict && typeof state.dict === 'object') {
      val = getByPath(state.dict.messages, key);
    }

    if (typeof val === 'string' || typeof val === 'number') {
      return String(val);
    }

    if (typeof fallbackOrOpts === 'string') {
      return fallbackOrOpts;
    }

    return key;
  }

  function setHtmlLangAttrs() {
    document.documentElement.setAttribute('lang', state.lang);
    document.documentElement.setAttribute('data-lang', state.lang);

    if (document.body) {
      document.body.setAttribute('data-lang', state.lang);
    }
  }

  function emit(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (_) {}
  }

  function applyTextContent(ctx) {
    ctx.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key, el.textContent || key);
    });
  }

  function applyPlaceholders(ctx) {
    ctx.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const val = t(key, el.getAttribute('placeholder') || key);
      el.setAttribute('placeholder', val);
    });
  }

  function applyTitles(ctx) {
    ctx.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (!key) return;
      const val = t(key, el.getAttribute('title') || key);
      el.setAttribute('title', val);
    });
  }

  function applyValues(ctx) {
    ctx.querySelectorAll('[data-i18n-value]').forEach((el) => {
      const key = el.getAttribute('data-i18n-value');
      if (!key) return;
      const val = t(key, el.value || key);
      el.value = val;
    });
  }

  function applyHtml(ctx) {
    ctx.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key, el.innerHTML || key);
    });
  }

  function apply(root) {
    const ctx = root || document;
    if (!ctx || !ctx.querySelectorAll) return;

    applyTextContent(ctx);
    applyPlaceholders(ctx);
    applyTitles(ctx);
    applyValues(ctx);
    applyHtml(ctx);

    ctx.querySelectorAll('[data-i18n-text]').forEach((el) => {
      const key = el.getAttribute('data-i18n-text');
      if (!key) return;

      const val = t(key, el.getAttribute('data-text') || key);
      el.setAttribute('data-text', val);

      if (
        !el.classList.contains('typing-active') &&
        !el.hasAttribute('data-typing')
      ) {
        el.textContent = val;
      }
    });

    setHtmlLangAttrs();
    emit('i18n:applied', { lang: state.lang, root: ctx });
  }

  async function setLang(lang, lock = false) {
    lang = normalizeLang((lang || '').trim());
    if (!lang || !SUPPORTED.includes(lang)) lang = DEFAULT;

    if (state._langPromise) return state._langPromise;

    state._langPromise = (async () => {
      if (isLocked()) {
        const introOpen = window.__LANG_MODAL_OPEN__ === true;

        if (!introOpen) {
          const lockedLang = getStoredLang() || state.lang || DEFAULT;

          if (lockedLang !== lang) {
            log('Idioma travado permanentemente:', lockedLang);
            state.lang = lockedLang;
            setHtmlLangAttrs();
            return lockedLang;
          }
        } else {
          log('Troca permitida durante seleção de idioma:', lang);
        }
      }

      if (state.ready && state.lang === lang) {
        setStoredLang(lang);

        if (lock) {
          setLocked(true);
          log('Idioma travado nesta jornada:', lang);
        }

        setHtmlLangAttrs();
        apply(document.body || document);
        emit('i18n:changed', { lang: state.lang, locked: isLocked() });
        return state.lang;
      }

      setStoredLang(lang);

      if (lock) {
        setLocked(true);
        log('Idioma travado nesta jornada:', lang);
      }

      state.ready = false;
      await init(lang);
      apply(document.body || document);
      setHtmlLangAttrs();

      emit('i18n:changed', {
        lang: state.lang,
        locked: isLocked()
      });

      return state.lang;
    })();

    try {
      return await state._langPromise;
    } finally {
      state._langPromise = null;
    }
  }

  async function forceLang(lang, persist = true) {
    return setLang(lang, !!persist);
  }

  async function waitForReady(timeoutMs = 10000) {
    if (state.ready) return true;

    return new Promise((resolve, reject) => {
      const start = Date.now();
      const id = setInterval(() => {
        if (state.ready) {
          clearInterval(id);
          resolve(true);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(id);
          reject(new Error('timeout'));
        }
      }, 50);
    });
  }

  function unlockLang() {
    setLocked(false);
    log('Idioma destravado.');
    emit('i18n:unlocked', { lang: state.lang });
  }

  function disableAllLangSelectors() {
    if (!isLocked()) return;

    document.querySelectorAll('select, button, input[type="radio"], input[type="button"]').forEach((el) => {
      const id = String(el.id || '').toLowerCase();
      const cls = String(el.className || '').toLowerCase();
      const name = String(el.name || '').toLowerCase();
      const txt = String(el.textContent || el.value || '').toLowerCase();

      const looksLikeLangSelector =
        id.includes('lang') || id.includes('idioma') ||
        cls.includes('lang') || cls.includes('idioma') ||
        name.includes('lang') || name.includes('idioma') ||
        txt.includes('portugu') || txt.includes('english') ||
        txt.includes('españ') || txt.includes('franç') ||
        txt.includes('中文') || txt.includes('日本語');

      if (!looksLikeLangSelector) return;
      if (el.hasAttribute('data-i18n-allow-locked')) return;

      if (el.tagName === 'SELECT' || el.type === 'button' || el.type === 'radio') {
        el.disabled = true;
      }

      el.style.pointerEvents = 'none';
      el.style.opacity = '0.6';
      el.setAttribute('title', 'Idioma travado na introdução');
    });
  }

  function observeDynamicDom() {
    const observer = new MutationObserver(() => {
      try {
        disableAllLangSelectors();
      } catch (_) {}
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  const api = {
    get lang() { return state.lang; },
    get currentLang() { return state.lang; },
    get ready() { return state.ready; },
    get supported() { return [...SUPPORTED]; },
    get isLocked() { return isLocked(); },

    init,
    t,
    apply,
    setLang,
    forceLang,
    waitForReady,
    normalizeLang,
    unlockLang
  };

  window.i18n = api;

  window.JORNADA_setLang = async function (lang, lock = false) {
    try {
      if (!window.i18n) return;
      await window.i18n.setLang(lang, lock);
      setHtmlLangAttrs();
    } catch (e) {
      warn('JORNADA_setLang falhou:', e);
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await init(FORCE_LANG || undefined);
      apply(document.body || document);
      setHtmlLangAttrs();

      disableAllLangSelectors();
      observeDynamicDom();

      log('Traduções aplicadas (' + state.lang + ')');
    } catch (e) {
      err('Erro no autoinit/apply:', e);
    }
  }, { once: true });

})(window);
