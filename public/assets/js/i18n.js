// /assets/js/i18n.js
const STORAGE_KEY = 'i18n_lang';

// use o padrão com região, pois seus arquivos são pt-BR.json, en-US.json, es-ES.json
const SUPPORTED = ['pt-BR', 'en-US', 'es-ES'];
const SHORT_TO_FULL = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
const DEFAULT = 'pt-BR';

const Store = {
  get() { try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; } },
  set(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch {} }
};

// normaliza qualquer entrada: "pt", "pt_BR", "pt-br", "PT-BR", "en-US", etc.
function canonicalize(input) {
  if (!input) return DEFAULT;
  const raw = String(input).trim().replace('_', '-');
  const lower = raw.toLowerCase();        // ex.: 'pt-br'
  const parts = lower.split('-');         // ['pt','br'] ou ['en']
  if (parts[0] && SHORT_TO_FULL[parts[0]]) return SHORT_TO_FULL[parts[0]]; // pt -> pt-BR
  // se já veio com região, tente remontar com caixa correta
  const lang = parts[0] || 'pt';
  const region = (parts[1] || '').toUpperCase();
  const guess = region ? `${lang}-${region}` : (SHORT_TO_FULL[lang] || DEFAULT);
  // garante que está na lista suportada; se não, cai no default
  return SUPPORTED.includes(guess) ? guess : DEFAULT;
}

const i18n = {
  lang: DEFAULT,
  dict: {},
  ready: false,

  async init(pref) {
    console.log('[i18n] Iniciando i18n...');
    // prioridade: armazenado → argumento → navegador → DEFAULT
    const fromStorage = Store.get();
    const fromArg = pref;
    const fromNav = (navigator.language || navigator.userLanguage || DEFAULT);
    const target = canonicalize(fromStorage || fromArg || fromNav);
    console.log('[i18n] Idioma alvo:', target);
    await this.setLang(target, false);
    this.autobind();
    this.apply();
  },

  async setLang(lang, applyAfter = true) {
    const canon = canonicalize(lang);
    const url = `/i18n/${canon}.json`;
    try {
      console.log(`[i18n] Carregando ${url}...`);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${url}`);

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
    } catch (e) {
      console.warn(`[i18n] Falha ao carregar ${url}:`, e);
      if (canon !== DEFAULT) {
        console.log(`[i18n] Tentando fallback para ${DEFAULT}...`);
        await this.setLang(DEFAULT, applyAfter);
      } else {
        console.error('[i18n] Falha no idioma padrão. Traduções não aplicadas.');
        this.ready = false;
      }
    }
  },

  t(key, fallback) {
    return (this.dict && Object.prototype.hasOwnProperty.call(this.dict, key))
      ? this.dict[key]
      : (fallback ?? key);
  },

  apply(root = document) {
    if (!this.ready) {
      console.warn('[i18n] Não aplicado: dicionário não carregado');
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
    // Botões/links com data-lang (aceita pt, en, es ou com região)
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-lang]');
      if (!btn) return;
      ev.preventDefault();
      const requested = btn.getAttribute('data-lang');
      const canon = canonicalize(requested);
      console.log(`[i18n] Troca solicitada para ${requested} → ${canon}`);
      this.setLang(canon);
    });

    // <select id="language-select"> com valores pt, en, es ou regionais
    document.addEventListener('change', (ev) => {
      if (ev.target && ev.target.id === 'language-select') {
        const requested = ev.target.value;
        const canon = canonicalize(requested);
        console.log(`[i18n] Selecionado via select: ${requested} → ${canon}`);
        this.setLang(canon);
      }
    });
  }
};

export default i18n;
