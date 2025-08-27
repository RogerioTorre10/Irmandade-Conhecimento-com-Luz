/* ============================================
   jornada-typing-font.js — typewriter global
   Expondo: window.JORNADA_TYPO
   ============================================ */
;(function () {
  const DEFAULTS = {
    speed: 22,             // ms por caractere
    cursor: true,          // mostra cursor ▌
    maxNodeChars: 600,     // acima disso preenche instantâneo (evita textos longos demais)
    maxTotalMs: 5000,      // duração máxima por tela (~5s)
    selectors: [
      "h1","h2","h3","h4",
      "p","li","blockquote","figcaption",
      "label",".lead",".subtitle",".cta"
    ],
  };

  const prefersReduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function typeOne(el, text, speed, withCursor) {
    return new Promise(resolve => {
      el.textContent = "";
      let i = 0;
      let cursor;
      if (withCursor) {
        cursor = document.createElement("span");
        cursor.className = "tty-cursor";
        cursor.textContent = "▌";
        el.appendChild(cursor);
      }
      const step = () => {
        if (i < text.length) {
          el.insertBefore(document.createTextNode(text[i++]), cursor || null);
          setTimeout(step, speed);
        } else {
          if (cursor) cursor.remove();
          resolve();
        }
      };
      step();
    });
  }

  // Aplica em sequência nos elementos do container
  async function typeAll(containerSelector = "#jornada-conteudo", opts = {}) {
    const cfg = Object.assign({}, DEFAULTS, opts);
    const root = typeof containerSelector === "string"
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!root) return;

    // Se o usuário prefere menos movimento, apenas “apareça”
    if (prefersReduced()) return;

    // Coleta elementos-alvo na ordem visual
    const nodes = Array.from(root.querySelectorAll(cfg.selectors.join(",")));

    // calcula orçamento total de animação
    const totalChars = nodes.reduce((n, el) => n + (el.textContent || "").trim().length, 0);
    const estMs = totalChars * cfg.speed;
    const factor = estMs > cfg.maxTotalMs ? (cfg.maxTotalMs / estMs) : 1;
    const speed = Math.max(8, Math.round(cfg.speed / factor)); // acelera se necessário

    for (const el of nodes) {
      const original = (el.getAttribute("data-tty-text") || el.textContent || "").trim();
      const text = original || (el.textContent || "").trim();
      el.setAttribute("data-tty-text", text); // cache

      if (text.length === 0) continue;

      // evita layout “pulado” para blocos muito longos
      if (text.length > cfg.maxNodeChars) {
        el.textContent = text; // preenche instantâneo
        continue;
      }
      await typeOne(el, text, speed, cfg.cursor);
    }
  }

  // Utilitário simples para um único alvo
  function typeText(target, text, speed = DEFAULTS.speed, withCursor = true) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    return typeOne(el, text ?? el.textContent ?? "", speed, withCursor);
  }

  window.JORNADA_TYPO = { typeAll, typeText, DEFAULTS };
})();
