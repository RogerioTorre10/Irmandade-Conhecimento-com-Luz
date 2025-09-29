const i18n = {
  lang: 'pt-BR',
  translations: {},
  ready: false,

  async init(langOverride) {
    this.lang = langOverride || navigator.language || 'pt-BR';
    try {
      const res = await fetch(`/assets/js/i18n/${this.lang}.json`);
      if (!res.ok) throw new Error(`Erro ao carregar ${this.lang}.json`);
      this.translations = await res.json();
      this.ready = true;
      console.log('[i18n] Traduções carregadas para:', this.lang);
    } catch (err) {
      console.warn('[i18n] Fallback para pt-BR');
      const fallback = await fetch(`/assets/js/i18n/pt-BR.json`);
      this.translations = await fallback.json();
      this.lang = 'pt-BR';
      this.ready = true;
    }
  },

  t(key, fallback = '') {
    return this.translations[key] || fallback || key;
  },

  apply(scope = document) {
    if (!this.ready) return;
    const nodes = scope.querySelectorAll('[data-i18n]');
    nodes.forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key, el.textContent);
    });

    const placeholders = scope.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key, el.placeholder);
    });
  },

  async setLang(newLang) {
    this.ready = false;
    await this.init(newLang);
    this.apply(document.body);
  },

  waitForReady(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (this.ready) return resolve(true);
        if (Date.now() - start > timeout) return reject(new Error('i18n timeout'));
        setTimeout(check, 100);
      };
      check();
    });
  }
};

export default i18n;
