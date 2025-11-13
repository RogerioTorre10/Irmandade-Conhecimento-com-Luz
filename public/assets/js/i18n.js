/* i18n.js — cabeça + detecção forçada */
(function (window) {
  'use strict';

  if (window.__i18nReadyShim) return; // evita dupla carga
  window.__i18nReadyShim = true;

  const STORAGE_KEY = 'i18n_lang';
  const DEFAULT = 'pt-BR';
  const SUPPORTED = ['pt-BR', 'en-US', 'es-ES'];

  // Forçar idioma via:
  // - JORNADA_CFG.LANG
  // - data-lang no <html>
  // - __FORCE_LANG
  const FORCE_LANG =
    (window.JORNADA_CFG && window.JORNADA_CFG.LANG) ||
    (document.documentElement && document.documentElement.getAttribute('data-lang')) ||
    window.__FORCE_LANG ||
    null;

  const state = {
    lang: DEFAULT,
    ready: false,
    dict: {}
  };

  function detectLang() {
    if (FORCE_LANG && SUPPORTED.includes(FORCE_LANG)) return FORCE_LANG;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || navigator.userLanguage || DEFAULT).replace('_', '-');
    if (nav.startsWith('pt')) return 'pt-BR';
    if (nav.startsWith('en')) return 'en-US';
    if (nav.startsWith('es')) return 'es-ES';
    return DEFAULT;
  }

  async function loadDict(lang) {
    const candidates = [
      `/assets/js/i18n/${lang}.json`,
      `/assets/i18n/${lang}.json`,
      `/i18n/${lang}.json`
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log('[i18n] Carregado:', url);
        return await res.json();
      } catch (e) {
        console.warn('[i18n] Falha ao carregar', url, e);
      }
    }
    throw new Error('Nenhum dicionário encontrado para ' + lang);
  }

  async function init(lang) {
    state.lang = lang || detectLang();
    try {
      state.dict = await loadDict(state.lang);
      state.ready = true;
      console.log('[i18n] Pronto para:', state.lang);
    } catch (e) {
      console.error('[i18n] Erro no init:', e);
      state.dict = {};
      state.ready = true;
    }
  }

  function t(key, fallbackOrOpts) {
    if (!key) return '';
    const val = state.dict[key];
    if (typeof val === 'string') return val;
    if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
    return key;
  }

  function apply(root) {
    const ctx = root || document;
    ctx.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key, el.textContent || key);
    });
    ctx.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const val = t(key, el.getAttribute('placeholder') || key);
      el.setAttribute('placeholder', val);
    });
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    localStorage.setItem(STORAGE_KEY, lang);
    state.ready = false;
    await init(lang);
    apply(document.body);
  }

  async function forceLang(lang, persist = true) {
    if (persist) localStorage.setItem(STORAGE_KEY, lang);
    return setLang(lang);
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

  // Exposição no window
  const api = {
    get lang() { return state.lang; },
    get ready() { return state.ready; },
    init, t, apply, setLang, forceLang, waitForReady
  };

  window.i18n = api;

  // Autoinit com respeito ao FORCE_LANG
  document.addEventListener('DOMContentLoaded', () => {
    (async () => {
      try {
        await init(FORCE_LANG || undefined);
        apply(document.body);
        console.log('[i18n] Traduções aplicadas (' + state.lang + ')');
      } catch (e) {
        console.error('[i18n] Erro no autoinit/apply:', e);
      }
    })();
  }, { once: true });

})(window);
