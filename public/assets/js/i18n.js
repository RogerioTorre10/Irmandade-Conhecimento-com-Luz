/* /assets/js/i18n.js */
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
      console.log("[i18n] Iniciando i18n...");
      let lang = Store.get() || (navigator.language || navigator.userLanguage || "pt").slice(0, 2).toLowerCase();
      console.log("[i18n] Idioma detectado:", lang);
      if (!SUPPORTED.includes(lang)) {
        console.log(`[i18n] Idioma ${lang} não suportado, usando padrão: ${DEFAULT}`);
        lang = DEFAULT;
      }
      await this.setLang(lang, false);
      this.autobind();
      this.apply();
    },

    async setLang(lang, applyAfter = true) {
      try {
        console.log(`[i18n] Carregando /i18n/${lang}.json...`);
        const res = await fetch(`/i18n/${lang}.json`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Falha ao carregar /i18n/${lang}.json`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Resposta não é JSON (Content-Type: ${contentType}): ${text.slice(0, 100)}...`);
        }
        this.dict = await res.json();
        this.lang = lang;
        Store.set(lang);
        document.documentElement.setAttribute("lang", lang);
        this.ready = true;
        if (applyAfter) this.apply();
        console.log(`[i18n] Idioma ${lang} carregado com sucesso`);
      } catch (e) {
        console.warn(`[i18n] Falha ao carregar idioma ${lang}:`, e);
        if (lang !== DEFAULT) {
          console.log(`[i18n] Tentando fallback para ${DEFAULT}...`);
          await this.setLang(DEFAULT, applyAfter);
        } else {
          console.error(`[i18n] Falha no idioma padrão ${DEFAULT}. Traduções não aplicadas.`);
          this.ready = false;
        }
      }
    },

    t(key, fallback) {
      return (this.dict && this.dict[key] != null) ? this.dict[key] : (fallback ?? key);
    },
    // i18n.js
    async function loadLanguage(lang) {
      try {
      const response = await fetch(`/${lang}.json`);
      const data = await response.json();
      console.log(`[i18n] Idioma ${lang} carregado com sucesso`);
      return data;
    } catch (error) {
      console.error(`[i18n] Erro ao carregar idioma ${lang}:`, error);
      throw error;
    }
  }

    apply(root = document) {
      if (!this.ready) {
        console.warn("[i18n] Não aplicado: dicionário não carregado");
        return;
      }
      root.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = this.t(key, el.textContent?.trim() || "");
      });
      root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", this.t(key, el.getAttribute("placeholder") || ""));
      });
      const siteTitle = this.t("site.title", document.title);
      if (siteTitle) document.title = siteTitle;
    },

    autobind() {
      document.addEventListener("click", (ev) => {
        const btn = ev.target.closest("[data-lang]");
        if (!btn) return;
        ev.preventDefault();
        const lang = btn.getAttribute("data-lang");
        if (SUPPORTED.includes(lang)) {
          console.log(`[i18n] Solicitada troca para idioma ${lang}`);
          this.setLang(lang);
        }
      });
      document.addEventListener('change', (ev) => {
        if (ev.target.id === 'language-select') {
          const lang = ev.target.value;
          if (SUPPORTED.includes(lang)) {
            console.log(`[i18n] Selecionado idioma ${lang} via select`);
            this.setLang(lang);
          }
        }
      });
    }
  };

  window.i18n = i18n;
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[i18n] Carregando i18n.js...");
    i18n.init().catch(err => console.error("[i18n] Erro na inicialização:", err));
  });
})();
