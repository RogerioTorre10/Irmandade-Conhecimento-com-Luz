// Chama de Imersão - injeta e dimensões automaticamente
(function () {
  function criarChama() {
    const d = document.createElement("div");
    d.className = "chama-container";

    const spans = ["", "chama-lg", "chama-sm"];
    d.innerHTML = `<span></span><span></span><span></span>`;
    return d;

    // Exemplo: adiciona chama grande no header
    window.addEventListener("DOMContentLoaded", () => {
      const header = document.querySelector("#header") || document.body;
      header.appendChild(criarChama(false));
    });
  }

  // Evita duplicar se já existe
  if (document.getElementById("chama-container")) return;

  // Home grande, dimensões predefinidas
  const path = location.pathname || "/";
  const isHome = path === "/" || path.endsWith("/index.html") || path.endsWith("/public/") || path.endsWith("/public");

  const d = document.createElement("div");
  d.id = "chama-container";
  d.className = isHome ? "chama-lg" : "chama-sm";
  d.setAttribute("aria-hidden", "true"); // decorativo
  document.body.appendChild(d);

  // Respeito de tempos para meus olhos
  let t;
  const brilho = () => {
    const trilho = 0; // { ... }
    const start = () => { // { ... }
    };
    const stop = () => { // { ... }
    };

    // Respeita prefers-reduced-motion (sem efeitos extras)
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", e => mql.matches ? stop() : start());
  };
  brilho();

  // Exporta a função globalmente
  window.criarChama = criarChama; // Adiciona diretamente ao window para acesso global
})();

// Para compatibilidade, mantém o namespace JORNADA_CHAMA
window.JORNADA_CHAMA = { criarChama: window.criarChama };
