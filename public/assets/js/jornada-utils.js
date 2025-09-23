/* ============================================
   jornada-utils.js  (IIFE – sem import/export)
   Helpers gerais da Jornada
   Expondo: window.JORNADA_UTILS + aliases
   ============================================ */
;(function () {
  // ----------------- LocalStorage -----------------
  function saveLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function loadLocal(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch (_) { return {}; }
  }
  function clearLocal(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  // ----------------- DOM helpers ------------------
  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = (html || "").trim();
    return d.firstElementChild;
  }
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ----------------- Utils gerais -----------------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const safeJSON = (v, fallback = null) => { try { return JSON.parse(v); } catch { return fallback; } };
  function withV(path, v) { if (!v) return path; const sep = path.includes("?") ? "&" : "?"; return `${path}${sep}v=${encodeURIComponent(v)}`; }

  // Toast simples (compatível com window.toast)
  function toast(msg, type = "info", timeout = 2400) {
    try {
      let el = document.createElement("div");
      el.className = `toast toast-${type}`;
      el.textContent = String(msg || "");
      Object.assign(el.style, {
        position: "fixed", left: "50%", bottom: "24px",
        transform: "translateX(-50%)",
        background: type === "error" ? "#7a1d1d" : "#1d2b7a",
        color: "#fff", padding: "10px 14px", borderRadius: "10px",
        zIndex: 99999, boxShadow: "0 6px 18px rgba(0,0,0,.35)",
        fontFamily: "Cardo, serif", fontSize: "15px", letterSpacing: ".2px"
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), timeout);
    } catch {}
  }
  // expõe também como global legado
  window.toast = window.toast || toast;

  // ----------------- Fetch helpers ----------------
  function normalizeBase(u) { return String(u || "").replace(/\/+$/, ""); }

  // Lê base de API de window.APP_CONFIG.API_BASE, com fallback
  function getApiBase() {
    const cfg = (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};
    // APP_CONFIG.API_BASE já vem normalizado (ex.: https://.../api)
    let base = cfg.API_BASE || "https://conhecimento-com-luz-api.onrender.com/api";
    return normalizeBase(base);
  }

  function buildUrl(base, path) {
    const b = normalizeBase(base);
    const p = String(path || "");
    return p.startsWith("/") ? b + p : `${b}/${p}`;
  }

  async function apiGet(path, opts = {}) {
    const url = buildUrl(getApiBase(), path);
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      ...opts,
    });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }

  async function apiPost(path, body = {}, opts = {}) {
    const url = buildUrl(getApiBase(), path);
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
  const API = { saveLocal, loadLocal, clearLocal, el, $, $$, sleep, safeJSON, withV, toast, apiGet, apiPost, getApiBase };

  window.JORNADA_UTILS = API;
  // Alias para compatibilidade com módulos antigos
  window.JUtils = window.JUtils || API;
})();
