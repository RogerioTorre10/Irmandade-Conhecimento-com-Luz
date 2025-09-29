// i18n.js
import i18next from 'https://cdn.jsdelivr.net/npm/i18next@25.5.2/dist/es/i18next.min.js';
import HttpBackend from 'https://cdnjs.cloudflare.com/ajax/libs/i18next-http-backend/3.0.2/i18nextHttpBackend.min.js';
import LanguageDetector from 'https://cdnjs.cloudflare.com/ajax/libs/i18next-browser-languagedetector/8.2.0/i18nextBrowserLanguageDetector.min.js';

const i18nLog = (...args) => console.log('[i18n]', ...args);

const i18n = {
    ready: false,
    translations: {},
    lang: 'pt-BR',

    async init() {
        try {
            i18nLog('Inicializando i18next com namespaces...');
            await i18next
                .use(HttpBackend)
                .use(LanguageDetector)
                .init({
                    lng: 'pt-BR',
                    fallbackLng: 'pt-BR',
                    ns: ['common', 'moduleA', 'moduleB'],
                    defaultNS: 'common',
                    backend: {
                        loadPath: '/public/assets/js/i18n/{{lng}}/{{ns}}.json',
                        fallbackLoadPath: '/i18n/{{lng}}/{{ns}}.json'
                    },
                    detection: {
                        order: ['navigator', 'htmlTag', 'path', 'subdomain'],
                        caches: ['localStorage', 'cookie']
                    },
                    debug: true,
                    interpolation: { escapeValue: false }
                });

            this.translations = {
                common: i18next.store.data[i18next.language]?.common || i18next.store.data['pt-BR']?.common || {},
                moduleA: i18next.store.data[i18next.language]?.moduleA || i18next.store.data['pt-BR']?.moduleA || {},
                moduleB: i18next.store.data[i18next.language]?.moduleB || i18next.store.data['pt-BR']?.moduleB || {}
            };
            this.lang = i18next.language || 'pt-BR';
            this.ready = true;
            i18nLog('i18next inicializado, idioma:', this.lang);
        } catch (error) {
            console.error('[i18n] Falha na inicialização:', error.message);
            this.translations = {
                common: {
                    welcome: 'Bem-vindo à jornada de luz!',
                    continue: 'Continue sua jornada...',
                    terms: 'Leia e aceite os termos',
                    error_loading: 'Erro ao carregar conteúdo'
                },
                moduleA: {
                    question1: 'Qual é o seu nível de consciência atual?',
                    option1: 'Iniciante',
                    option2: 'Intermediário',
                    option3: 'Avançado'
                },
                moduleB: {
                    question2: 'O que você busca nesta jornada?',
                    option4: 'Autoconhecimento',
                    option5: 'Transformação'
                }
            };
            this.lang = 'pt-BR';
            this.ready = true;
            i18nLog('Usando traduções de fallback');
        }
    },

    async waitForReady(timeout = 10000) {
        return new Promise((resolve) => {
            if (this.ready) return resolve(true);
            const start = Date.now();
            const check = () => {
                if (this.ready || Date.now() - start > timeout) {
                    resolve(this.ready);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    },

    async loadNamespaces(namespaces) {
        try {
            await i18next.loadNamespaces(namespaces);
            this.translations = {
                ...this.translations,
                ...Object.fromEntries(
                    namespaces.map(ns => [ns, i18next.store.data[i18next.language]?.[ns] || i18next.store.data['pt-BR']?.[ns] || {}])
                )
            };
            i18nLog('Namespaces carregados:', namespaces);
        } catch (error) {
            console.error('[i18n] Falha ao carregar namespaces:', namespaces, error);
            namespaces.forEach(ns => {
                if (!this.translations[ns]) {
                    this.translations[ns] = {};
                }
            });
            i18nLog('Usando fallback vazio para namespaces:', namespaces);
        }
    },

    t(key, options = {}) {
        return i18next.t(key, { ns: options.ns || 'common' }) || this.translations[options.ns || 'common'][key] || key;
    }
};

export default i18n;

i18n.init().catch(err => i18nLog('Erro ao inicializar i18n:', err.message));
