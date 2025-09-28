// i18n.js
import i18next from 'https://cdn.jsdelivr.net/npm/i18next@25.5.2/dist/es/i18next.min.js';
import HttpBackend from 'https://cdnjs.cloudflare.com/ajax/libs/i18next-http-backend/3.0.2/i18nextHttpBackend.min.js';
import LanguageDetector from 'https://cdnjs.cloudflare.com/ajax/libs/i18next-browser-languagedetector/8.2.0/i18nextBrowserLanguageDetector.min.js';

// Evita conflito com outros scripts
const i18nLog = (...args) => console.log('[i18n]', ...args);

const i18n = {
    ready: false,
    translations: {},
    lang: 'pt-BR', // Padrão

    async init() {
        try {
            i18nLog('Inicializando i18next...');
            await i18next
                .use(HttpBackend)
                .use(LanguageDetector)
                .init({
                    lng: 'pt-BR', // Idioma padrão
                    fallbackLng: 'pt-BR', // Fallback se detecção falhar
                    backend: {
                        loadPath: '/public/assets/js/i18n/{{lng}}.json', // Novo caminho
                        fallbackLoadPath: '/i18n/{{lng}}.json' // Antigo, como fallback
                    },
                    detection: {
                        order: ['navigator', 'htmlTag', 'path', 'subdomain'],
                        caches: ['localStorage', 'cookie']
                    },
                    debug: true, // Logs detalhados pra debug
                    interpolation: {
                        escapeValue: false // Evita escaping (já que usamos HTML seguro)
                    }
                });

            this.translations = i18next.store.data[i18next.language] || i18next.store.data['pt-BR'] || {};
            this.lang = i18next.language || 'pt-BR';
            this.ready = true;
            i18nLog('i18next inicializado com sucesso, idioma:', this.lang);
        } catch (error) {
            console.error('[i18n] Falha na inicialização:', error.message);
            // Fallback hardcoded
            this.translations = {
                welcome: 'Bem-vindo à jornada de luz!',
                continue: 'Continue sua jornada...',
                terms: 'Leia e aceite os termos',
                error_loading: 'Erro ao carregar conteúdo',
                question1: 'Qual é o seu nível de consciência atual?',
                option1: 'Iniciante',
                option2: 'Intermediário',
                option3: 'Avançado',
                question2: 'O que você busca nesta jornada?',
                option4: 'Autoconhecimento',
                option5: 'Transformação'
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

    t(key) {
        return i18next.t(key) || this.translations[key] || key;
    }
};

export default i18n;

// Inicializa automaticamente
i18n.init().catch(err => i18nLog('Erro ao inicializar i18n:', err.message));
