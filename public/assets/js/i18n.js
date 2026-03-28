/* i18n.js — cabeça + detecção forçada + trava na intro + suporte fr-FR / zh-CN */
(function (window) {
  'use strict';
  if (window.__i18nReadyShim) return; // evita dupla carga
  window.__i18nReadyShim = true;

  const STORAGE_KEY = 'i18n_lang';
  const LOCK_KEY = 'i18n_locked';
  const DEFAULT = 'pt-BR';
  const SUPPORTED = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'zh-CN'];

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
    dict: {},
    _langPromise: null
  };

  // Cache GLOBAL (compartilhado mesmo se o script for carregado 2x por engano)
  window.__I18N_DICT_CACHE__ = window.__I18N_DICT_CACHE__ || {};

  // Cache em memória para evitar recarregar o mesmo JSON várias vezes
  const DICT_CACHE = window.__I18N_DICT_CACHE__;

  function normalizeLang(lang) {
    const raw = String(lang || '').trim().replace('_', '-');
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

      zh: 'zh-CN',
      'zh-cn': 'zh-CN',
      'zh-hans': 'zh-CN',
      'zh-sg': 'zh-CN',
      'cmn-hans-cn': 'zh-CN'
    };

    return map[lower] || raw;
  }

  function detectLang() {
    // Se já está travado, ignora tudo e usa o armazenado
    const locked = sessionStorage.getItem(LOCK_KEY) === '1';
    if (locked) {
    const stored = normalizeLang(sessionStorage.getItem(STORAGE_KEY));
    if (stored && SUPPORTED.includes(stored)) return stored;
    }

    const forced = normalizeLang(FORCE_LANG);
    if (forced && SUPPORTED.includes(forced)) return forced;

    const stored = normalizeLang(sessionStorage.getItem(STORAGE_KEY));
    if (stored && SUPPORTED.includes(stored)) return stored;

    const nav = normalizeLang(navigator.language || navigator.userLanguage || DEFAULT);
    if (SUPPORTED.includes(nav)) return nav;

    if (String(nav).startsWith('pt')) return 'pt-BR';
    if (String(nav).startsWith('en')) return 'en-US';
    if (String(nav).startsWith('es')) return 'es-ES';
    if (String(nav).startsWith('fr')) return 'fr-FR';
    if (String(nav).startsWith('zh')) return 'zh-CN';

    return DEFAULT;
  }

  async function loadDict(lang) {
    lang = normalizeLang(lang);

    // Cache global pode guardar Promise (in-flight) ou objeto final
    if (DICT_CACHE[lang]) {
      return await DICT_CACHE[lang];
    }

    const candidates = [
      `/assets/js/i18n/${lang}.json`,
      `/assets/i18n/${lang}.json`,
      `/i18n/${lang}.json`
    ];

    // guarda a promise já no começo (anti-concorrência)
    DICT_CACHE[lang] = (async () => {
      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          console.log('[i18n] Carregado:', url);
          return json;
        } catch (e) {
          console.warn('[i18n] Falha ao carregar', url, e);
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

      // Latch para log "Pronto para" (1x por idioma)
      window.__I18N_READY_LOGGED__ = window.__I18N_READY_LOGGED__ || {};
      const readyKey = state.lang || lang || DEFAULT;

      if (!window.__I18N_READY_LOGGED__[readyKey]) {
        window.__I18N_READY_LOGGED__[readyKey] = true;
        console.log('[i18n] Pronto para:', readyKey);
      }
    } catch (e) {
      console.error('[i18n] Erro no init:', e);
      state.dict = {};
      state.ready = true; // continua rodando mesmo sem dict
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
    ctx.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key, el.textContent || key);
    });

    ctx.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const val = t(key, el.getAttribute('placeholder') || key);
      el.setAttribute('placeholder', val);
    });
  }

  async function setLang(lang, lock = false) {
    lang = normalizeLang((lang || '').trim());
    if (!lang) lang = DEFAULT;
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;

    // se já existe uma troca de idioma em andamento, reaproveita a mesma Promise
    if (state._langPromise) return state._langPromise;

    state._langPromise = (async () => {
      // se já está pronto e já é esse idioma, sai
      if (state.ready && state.lang === lang) return;

      localStorage.setItem(STORAGE_KEY, lang);
      sessionStorage.setItem('jornada.lang', lang);
      sessionStorage.setItem('i18n.lang', lang);

      if (lock) {
        localStorage.setItem(LOCK_KEY, '1');
        console.log('[i18n] Idioma travado permanentemente:', lang);
      }

      state.ready = false;
      await init(lang);
      apply(document.body);

      // reforça atributos no html
      document.documentElement.setAttribute('lang', state.lang);
      document.documentElement.setAttribute('data-lang', state.lang);
    })();

    try {
      return await state._langPromise;
    } finally {
      state._langPromise = null;
    }
  }

  async function forceLang(lang, persist = true) {
    return setLang(lang, persist);
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

  // Desabilita qualquer seletor de idioma que exista no DOM
  function disableAllLangSelectors() {
    const isLocked = localStorage.getItem(LOCK_KEY) === '1';
    if (!isLocked) return;

    document.querySelectorAll('select').forEach((sel) => {
      const id = (sel.id || '').toLowerCase();
      const cls = (sel.className || '').toLowerCase();
      const name = (sel.name || '').toLowerCase();

      if (
        id.includes('lang') || id.includes('idioma') ||
        cls.includes('lang') || cls.includes('idioma') ||
        name.includes('lang') || name.includes('idioma')
      ) {
        sel.disabled = true;
        sel.style.pointerEvents = 'none';
        sel.style.opacity = '0.6';
        sel.title = 'Idioma travado na introdução';
      }
    });
  }

  const api = {
    get lang() { return state.lang; },
    get currentLang() { return state.lang; },
    get ready() { return state.ready; },
    get supported() { return [...SUPPORTED]; },
    init,
    t,
    apply,
    setLang,
    forceLang,
    waitForReady,
    normalizeLang
  };

  window.i18n = api;

  // Helper global para trocar idioma
  window.JORNADA_setLang = async function (lang, lock = false) {
    try {
      if (!window.i18n) return;
      await window.i18n.setLang(lang, lock);
      document.documentElement.setAttribute('lang', window.i18n.lang);
      document.documentElement.setAttribute('data-lang', window.i18n.lang);
    } catch (e) {
      console.warn('[i18n] JORNADA_setLang falhou:', e);
    }
  };

  // Autoinit
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await init(FORCE_LANG || undefined);
      apply(document.body);

      document.documentElement.setAttribute('lang', state.lang);
      document.documentElement.setAttribute('data-lang', state.lang);

      // Desabilita seletores se já travado
      disableAllLangSelectors();

      // Observa inserções dinâmicas
      const observer = new MutationObserver(() => {
        disableAllLangSelectors();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });

      console.log('[i18n] Traduções aplicadas (' + state.lang + ')');
    } catch (e) {
      console.error('[i18n] Erro no autoinit/apply:', e);
    }
  }, { once: true });

})(window);
