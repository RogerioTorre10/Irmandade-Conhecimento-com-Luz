// jornada-utils.js
import { apiBases } from "./jornada-core.js";

// coloque aqui suas funções utilitárias
  function saveLocal(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function loadLocal(key){ try{ return JSON.parse(localStorage.getItem(key)||"{}"); }catch(_){ return {}; } }
  function clearLocal(key){ localStorage.removeItem(key); }

export function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function typewriter(node, text, opts = {}) {
  const speed  = opts.speed ?? 28;
  const jitter = opts.jitter ?? 14;
  const delay  = opts.initialDelay ?? 100;
  const done   = opts.done;
  if (!node) return;
  node.classList.add("lumen-typing");
  node.textContent = "";
  let i = 0;
  function tick(){
    if (i < text.length){
      node.textContent += text[i++];
      const d = speed + (jitter ? Math.floor(Math.random()*jitter) : 0);
      setTimeout(tick, d);
    } else {
      node.classList.add("typing-done");
      if (typeof done === "function") done();
    }
  }
  setTimeout(tick, delay);
}

// fetch com fallback (com/sem /api)
export async function fetchWithApiFallback(path, init) {
  const bases = apiBases();
  let lastErr;
  for (const b of bases) {
    const url = b.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      lastErr = new Error(`HTTP_${res.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all_endpoints_failed");
}

export async function postBinary(path, payload) {
  const res = await fetchWithApiFallback(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/pdf, application/zip, application/octet-stream"
    },
    body: JSON.stringify(payload || {})
  });
  return await res.blob();
}

export function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Expor no namespace global
  window.JORNADA_UTILS = {
    saveLocal, loadLocal, clearLocal
  };
})();
