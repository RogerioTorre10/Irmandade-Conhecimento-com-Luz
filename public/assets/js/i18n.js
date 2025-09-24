/* /assets/js/i18n.js — i18n simples com JSON por idioma
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
    get() {
      return localStorage.getItem(STORAGE_KEY) || "";
    },
    set(v) {
      localStorage.setItem(STORAGE_KEY, v);
    }
  };

  const i18n = {
    lang: DEFAULT,
    dict: {},
    ready: false,

    async init() {
      // Detecta o idioma do navegador ou usa o armazenado
      let lang = Store.get() || (navigator.language || navigator.userLanguage || "pt").slice(0, 2).toLowerCase();
      if (!SUPPORTED.includes(lang)) lang = DEFAULT;
      await this.setLang(lang, false);
      this.autobind();
      this.apply(); // Aplica na primeira carga
    },

    async setLang(lang, applyAfter = true) {
      try {
        // Ajuste o caminho conforme a estrutura do servidor
        const res = await fetch(`/i18n/${lang}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Falha ao carregar /i18n/${lang}.json`);
        this.dict = await res.json();
        this.lang = lang;
        Store.set(lang);
        document.documentElement.setAttribute("lang", lang);
        this.ready = true;
        if (applyAfter) this.apply();
        console.log(`[i18n] Idioma ${lang} carregado com sucesso`);
      } catch (e) {
        console.warn(`[i18n] Falha ao carregar idioma ${lang}:`, e);
        // Fallback para o idioma padrão se falhar
        if (lang !== DEFAULT) {
          await this.setLang(DEFAULT, applyAfter);
        }
      }
    },

    t(key, fallback) {
      return (this.dict && this.dict[key] != null) ? this.dict[key] : (fallback ?? key);
    },

    apply(root = document) {
      if (!this.ready) return;

      // Textos
      root.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = this.t(key, el.textContent?.trim() || "");
      });

      // Placeholders
      root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", this.t(key, el.getAttribute("placeholder") || ""));
      });

      // Título da aba
      const siteTitle = this.t("site.title", document.title);
      if (siteTitle) document.title = siteTitle;
    },

    autobind() {
      // Troca de idioma por data-lang
      document.addEventListener("click", (ev) => {
        const btn = ev.target.closest("[data-lang]");
        if (!btn) return;
        ev.preventDefault();
        const lang = btn.getAttribute("data-lang");
        if (SUPPORTED.includes(lang)) {
          this.setLang(lang);
        }
      });
    }
  };

  window.i18n = i18n;
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[i18n] Inicializando...");
    i18n.init().catch(err => console.error("[i18n] Erro na inicialização:", err));
  });
})();
