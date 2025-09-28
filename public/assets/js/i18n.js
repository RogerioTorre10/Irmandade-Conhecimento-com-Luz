// assets/js/i18n.js

const STORAGE_KEY = 'i18n_lang';
const SUPPORTED = ['pt-BR', 'en-US', 'es-ES'];
const SHORT_TO_FULL = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
const DEFAULT = 'pt-BR';

const Store = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },
  set(v) {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  },
};

function canonicalize(input) {
  if (!input) return DEFAULT;
  const raw = String(input).trim().replace('_', '-').toLowerCase();
  const parts = raw.split('-');
  if (parts[0] && SHORT_TO_FULL[parts[0]]) return SHORT_TO_FULL[parts[0]];
  const lang = parts[0] || 'pt';
  const region = (parts[1] || '').toUpperCase();
  const guess = region ? `${lang}-${region}` : (SHORT_TO_FULL[lang] || DEFAULT);
  return SUPPORTED.includes(guess) ? guess : DEFAULT;
}

const i18n = {
  lang: DEFAULT,
  dict: {},
  ready: false,
  readyPromise: null,

  init(pref) {
    console.log('[i18n] Iniciando i18n...');
    this.readyPromise = new Promise((resolve, reject) => {
      const fromStorage = Store.get();
      const fromArg = pref;
      const fromNav = navigator.language || navigator.userLanguage || DEFAULT;
      const target = canonicalize(fromStorage || fromArg || fromNav);
      console.log('[i18n] Idioma alvo:', target);

      this.setLang(target, false)
        .then(() => {
          this.autobind();
          this.apply();
          resolve(true);
        })
        .catch(err => {
          console.error('[i18n] Falha na inicialização:', err);
          reject(err);
        });
    });
    return this.readyPromise;
  },

  async waitForReady(timeoutMs = 10000) {
    if (this.ready) return true;
    return Promise.race([
      this.readyPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout esperando i18n')), timeoutMs)
      ),
    ]);
  },

  async setLang(lang, applyAfter = true, retries = 3, delayMs = 500) {
    const canon = canonicalize(lang);
    const url = `/i18n/${canon}.json`;
    console.log('[i18n] URL completa:', window.location.origin + url);

    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[i18n] Tentativa ${attempt}/${retries} carregando ${url}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ao carregar ${url}`);
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`MIME inesperado (${ct}) em ${url}: ${text.slice(0, 120)}...`);
        }

        this.dict = await res.json();
        this.lang = canon;
        this.ready = true;
        Store.set(canon);
        document.documentElement.setAttribute('lang', canon);
        if (applyAfter) this.apply();
        console.log(`[i18n] ${canon} carregado com sucesso`);
        return true;
      } catch (e) {
        lastError = e;
        console.warn(`[i18n] Falha ao carregar ${url} (tentativa ${attempt}/${retries}):`, e);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        if (canon !== DEFAULT) {
          console.log(`[i18n] Tentando fallback para ${DEFAULT}...`);
          return await this.setLang(DEFAULT, applyAfter, retries, delayMs);
        } else {
          console.error('[i18n] Falha no idioma padrão. Traduções não aplicadas.');
          this.ready = false;
          window.toast && window.toast(`Erro ao carregar traduções para ${canon}`);
          throw e;
        }
      }
    }
    throw lastError;
  },

  t(key, fallback) {
    return this.dict && Object.prototype.hasOwnProperty.call(this.dict, key)
      ? this.dict[key]
      : fallback ?? key;
  },

  apply(root = document) {
    if (!this.ready) {
      console.warn('[i18n] Não aplicado: dicionário não carregado');
      window.toast && window.toast('Traduções não disponíveis');
      return;
    }
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key, (el.textContent || '').trim());
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder') || ''));
    });
    const siteTitle = this.t('site.title', document.title);
    if (siteTitle) document.title = siteTitle;
  },

  autobind() {
    document.removeEventListener('click', this._handleClick);
    document.removeEventListener('change', this._handleChange);

    this._handleClick = (ev) => {
      const btn = ev.target.closest('[data-lang]');
      if (!btn) return;
      ev.preventDefault();
      const requested = btn.getAttribute('data-lang');
      const canon = canonicalize(requested);
      console.log(`[i18n] Troca solicitada para ${requested} → ${canon}`);
      this.setLang(canon);
    };

    this._handleChange = (ev) => {
      if (ev.target && ev.target.id === 'language-select') {
        const requested = ev.target.value;
        const canon = canonicalize(requested);
        console.log(`[i18n] Selecionado via select: ${requested} → ${canon}`);
        this.setLang(canon);
      }
    };

    document.addEventListener('click', this._handleClick);
    document.addEventListener('change', this._handleChange);

    let timeout;
    const debounceSetLang = (lang) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.setLang(lang), 300);
    };
    document.addEventListener('change', (ev) => {
      if (ev.target.id === 'language-select') {
        debounceSetLang(ev.target.value);
      }
    });
  },
};

export default i18n;
