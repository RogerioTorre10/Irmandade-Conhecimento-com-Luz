/* i18n.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.__i18nReadyShim) return; // evita dupla carga
  global.__i18nReadyShim = true;

  const STORAGE_KEY = 'i18n_lang';
  const DEFAULT = 'pt-BR';
  const SUPPORTED = ['pt-BR', 'en-US', 'es-ES'];

  const state = {
    lang: DEFAULT,
    ready: false,
    dict: {}
  };

  function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav =
      (navigator.language || navigator.userLanguage || DEFAULT)
        .replace('_', '-');
    // normaliza pt->pt-BR, en->en-US, es->es-ES
    if (nav.startsWith('pt')) return 'pt-BR';
    if (nav.startsWith('en')) return 'en-US';
    if (nav.startsWith('es')) return 'es-ES';
    return DEFAULT;
  }

  async function loadDict(lang) {
  // tenta onde você já versionou primeiro
  const candidates = [
    `/i18n/${lang}.json`,
    `/assets/js/i18n/${lang}.json`
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
  // se nenhum caminho funcionou:
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
      state.ready = true; // segue “vazio” para não travar
    }
  }

  function t(key, fallbackOrOpts) {
    // aceita (key, fallbackString) ou (key, {…})
    if (!key) return '';
    const val = state.dict[key];
    if (typeof val === 'string') return val;
    if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
    return key;
  }

  function apply(root) {
    const ctx = root || document;
    // texto
    ctx.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key, el.textContent || key);
    });
    // placeholder
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

  // Exposição global
  const api = {
    get lang() { return state.lang; },
    get ready() { return state.ready; },
    init, t, apply, setLang, waitForReady
  };
  global.i18n = api;

  // Autoinit leve
  document.addEventListener('DOMContentLoaded', () => {
    if (!state.ready) {
      init().then(() => {
        apply(document.body);
        console.log('[i18n] Traduções aplicadas');
      });
    }
  }, { once: true });

})(window);
