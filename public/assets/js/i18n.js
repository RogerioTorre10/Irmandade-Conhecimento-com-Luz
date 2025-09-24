/* /assets/js/i18n/i18n.js  —  i18n simples com JSON por idioma
   Uso:
   - Marque textos com data-i18n="chave"
   - Placeholders com data-i18n-placeholder="chave"
   - Troca de idioma com <button data-lang="pt|en|es">PT</button>
*/
;(function () {
  const STORAGE_KEY = "i18n_lang";
  const DEFAULT = "pt";
  const SUPPORTED = ["pt", "en", "es"];

  const Store = {
    get() { return localStorage.getItem(STORAGE_KEY) || ""; },
    set(v) { localStorage.setItem(STORAGE_KEY, v); }
  };

  const I18N = {
    lang: DEFAULT,
    dict: {},
    ready: false,

    async init() {
      let lang = Store.get() || (navigator.language || "pt").slice(0,2).toLowerCase();
      if (!SUPPORTED.includes(lang)) lang = DEFAULT;
      await this.setLang(lang, false);
      this.autobind();
      this.apply(); // aplica na primeira carga
    },

    async setLang(lang, applyAfter = true) {
      try {
        const res = await fetch(`/i18n/${lang}.json`, { cache: "no-store" });
        this.dict = await res.json();
        this.lang = lang;
        Store.set(lang);
        document.documentElement.setAttribute("lang", lang);
        this.ready = true;
        if (applyAfter) this.apply();
      } catch (e) {
        console.warn("[i18n] Falha ao carregar", lang, e);
      }
    },

    t(key, fallback) {
      return (this.dict && this.dict[key] != null) ? this.dict[key] : (fallback ?? key);
    },

    apply(root = document) {
      if (!this.ready) return;

      // textos
      root.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = this.t(key, el.textContent.trim());
      });

      // placeholders
      root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", this.t(key, el.getAttribute("placeholder") || ""));
      });

      // título da aba
      const siteTitle = this.t("site.title", document.title);
      if (siteTitle) document.title = siteTitle;
    },

    autobind() {
      // troca de idioma por data-lang
      document.addEventListener("click", (ev) => {
        const btn = ev.target.closest("[data-lang]");
        if (!btn) return;
        ev.preventDefault();
        const lang = btn.getAttribute("data-lang");
        this.setLang(lang);
      });
    }
  };

  window.I18N = I18N;
  document.addEventListener("DOMContentLoaded", () => I18N.init());
})();
