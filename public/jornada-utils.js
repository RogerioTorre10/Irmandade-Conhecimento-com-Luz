/* ============================================
   jornada-utils.js  (IIFE – sem import/export)
   Helpers gerais da Jornada
   Expondo: window.JORNADA_UTILS
   ============================================ */
;(function () {
  // ----------------- LocalStorage -----------------
  function saveLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function loadLocal(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch (_) { return {}; }
  }
  function clearLocal(key) {
    localStorage.removeItem(key);
  }

  // ----------------- DOM helpers ------------------
  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = (html || "").trim();
    return d.firstElementChild;
  }
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ----------------- Fetch helpers ----------------
  // Lê base de API de window.APP_CONFIG.API_BASE, com fallback
  function getApiBase() {
    const cfg = (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};
    return cfg.API_BASE || "https://conhecimento-com-luz-api.onrender.com";
  }

  async function apiGet(path, opts = {}) {
    const url = getApiBase() + path;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      ...opts,
    });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.headers.get("content-type")?.includes("application/json") ? res.json() : res.text();
  }

  async function apiPost(path, body = {}, opts = {}) {
    const url = getApiBase() + path;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, application/pdf" },
      body: JSON.stringify(body),
      ...opts,
    });
    if (!res.ok) throw new Error(`POST ${url} -> ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    if (ct.includes("application/pdf")) return res.blob();
    return res.text();
  }

  // --------------- Exporta no namespace ----------
  window.JORNADA_UTILS = {
    saveLocal, loadLocal, clearLocal,
    el, $, $$,
    apiGet, apiPost, getApiBase,
  };
})();
