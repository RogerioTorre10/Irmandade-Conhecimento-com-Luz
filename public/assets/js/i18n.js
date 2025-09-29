// /assets/js/i18n.js  (ES module)
import i18next from 'https://cdn.jsdelivr.net/npm/i18next@25.5.2/dist/esm/i18next.js';
import HttpBackend from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@3.0.2/esm/index.js';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@8.2.0/esm/index.js';

const i18nLog = (...a) => console.log('[i18n]', ...a);

const i18n = {
  ready: false,
  lang: 'pt-BR',

  async init() {
    try {
      i18nLog('Inicializando…', import.meta.url);

      await i18next
        .use(HttpBackend)
        .use(LanguageDetector)
        .init({
          lng: 'pt-BR',
          fallbackLng: 'pt-BR',
          supportedLngs: ['pt-BR', 'en', 'es'],
          load: 'currentOnly',

          // >>> seu layout atual: /assets/js/i18n/pt-BR/{ns}.json
          backend: {
            loadPath: '/assets/js/i18n/{{lng}}/{{ns}}.json',
            requestOptions: { cache: 'no-store' }
          },

          // detecta do navegador e da tag <html lang="...">
          detection: { order: ['navigator', 'htmlTag'], caches: [] },

          ns: ['common', 'moduleA', 'moduleB'],
          defaultNS: 'common',

          interpolation: { escapeValue: false },
          debug: true
        });

      this.lang = i18next.language || 'pt-BR';
      this.ready = true;
      i18nLog('Pronto com', this.lang);
    } catch (err) {
      console.error('[i18n] Falha na inicialização:', err);
      this.ready = true; // mantém app vivo com strings-chave
    }
  },

  async waitForReady(ms = 10000) {
    if (this.ready) return true;
    return new Promise(res => {
      const t0 = Date.now();
      (function check() {
        (i18next.isInitialized || Date.now() - t0 > ms) ? res(true) : setTimeout(check, 100);
      })();
    });
  },

  t(key, opt = {}) {
    return i18next.t(key, opt) || key;
  }
};

export default i18n;

// auto-init
i18n.init().catch(e => i18nLog('Erro init:', e?.message));
