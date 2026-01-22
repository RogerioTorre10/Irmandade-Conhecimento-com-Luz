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

  // Helper global para trocar idioma de forma consistente no projeto inteiro
   window.JORNADA_setLang = async function (lang) {
  try {
    if (!window.i18n) return;
    await window.i18n.setLang(lang);

    // reforça para TTS e outros módulos que leem <html lang="...">
    document.documentElement.setAttribute('lang', window.i18n.lang);
    document.documentElement.setAttribute('data-lang', window.i18n.lang);
  } catch (e) {
    console.warn('[i18n] JORNADA_setLang falhou:', e);
  }
};

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

  // =============================================
// AUTO-BIND do seletor de idioma (global)
// Faz a Jornada inteira seguir o idioma escolhido
// =============================================
(function () {
  function looksLikeLangSelect(sel) {
    if (!sel || sel.tagName !== 'SELECT') return false;

    // Aceita ids/classes comuns (se existir)
    const id = (sel.id || '').toLowerCase();
    const cls = (sel.className || '').toLowerCase();
    const name = (sel.name || '').toLowerCase();

    if (id.includes('lang') || id.includes('idioma') || cls.includes('lang') || cls.includes('idioma') || name.includes('lang') || name.includes('idioma')) {
      return true;
    }

    // Aceita por valores típicos de idioma
    const values = Array.from(sel.options || []).map(o => (o.value || '').toLowerCase());
    const hasPt = values.some(v => v.startsWith('pt'));
    const hasEn = values.some(v => v.startsWith('en'));
    if (hasPt || hasEn) return true;

    // Aceita por textos típicos do seu dropdown
    const texts = Array.from(sel.options || []).map(o => (o.textContent || '').toLowerCase());
    const hasPortuguese = texts.some(t => t.includes('portugu'));
    const hasEnglish = texts.some(t => t.includes('english'));
    if (hasPortuguese || hasEnglish) return true;

    return false;
  }

  // 1) Aplica o valor atual do i18n em selects já existentes
  function syncExistingSelectors() {
    const lang = (window.i18n && window.i18n.lang) || localStorage.getItem('i18n_lang') || 'pt-BR';
    document.querySelectorAll('select').forEach(sel => {
      if (!looksLikeLangSelect(sel)) return;
      if (sel.value !== lang) sel.value = lang;
    });
  }

  // 2) Captura troca de idioma em QUALQUER página/section
  document.addEventListener('change', async (ev) => {
    const target = ev.target;
    if (!looksLikeLangSelect(target)) return;

    const lang = target.value;
    if (window.i18n && typeof window.i18n.setLang === 'function') {
      await window.i18n.setLang(lang);

      // reforço útil para TTS e acessibilidade
      document.documentElement.setAttribute('lang', window.i18n.lang);
      document.documentElement.setAttribute('data-lang', window.i18n.lang);

      // garante que o DOM atual (seção inteira) reflita
      if (typeof window.i18n.apply === 'function') {
        window.i18n.apply(document.body);
      }
    }
  }, true);

  // 3) Se o header/seletor for inserido dinamicamente depois, sincroniza
  const obs = new MutationObserver(() => syncExistingSelectors());
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // primeira sincronização
  syncExistingSelectors();
})();


})(window);
