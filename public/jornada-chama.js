// Chama de Imersão - injeta e dimensões automaticamente
(function () {
  function criarChama() {
    const d = document.createElement("div");
    d.className = "chama-container";
    d.innerHTML = `<span></span><span></span><span></span>`;
    return d;
  }

  if (document.getElementById("chama-container")) return;

  const path = location.pathname || "/";
  const isHome = path === "/" || path.endsWith("/index.html") || path.endsWith("/public/") || path.endsWith("/public");
  const d = document.createElement("div");
  d.id = "chama-container";
  d.className = isHome ? "chama-lg" : "chama-sm";
  d.setAttribute("aria-hidden", "true");
  document.body.appendChild(d);

  let t;
  const brilho = () => {
    let t = 0;
    const base = 1.04;
    const ampS = 0.075;
    const ampY = 1.3;
    const ampR = 1.0;
    (function loop() {
      t += 0.032 + Math.random() * 0.008;
      const s = base + Math.sin(t) * ampS + (Math.random() * 0.015 - 0.007);
      const y = Math.sin(t * 1.18) * ampY;
      const rot = Math.sin(t * 0.85) * ampR;
      d.style.setProperty('--scale', s.toFixed(3));
      d.style.setProperty('--y', y.toFixed(2) + 'px');
      d.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      requestAnimationFrame(loop);
    })();
  };
  brilho();

  function ajustarChama(sentimento) {
    const chama = document.getElementById("chama-container");
    if (!chama) return;
    chama.classList.remove("chama-sofrida", "chama-alegre");
    const baseScale = 1.04;
    if (sentimento === "sofrida") {
      chama.style.setProperty('--scale', (baseScale - 0.1).toFixed(3));
      chama.style.setProperty('--y', '2px');
    } else if (sentimento === "alegre") {
      chama.style.setProperty('--scale', (baseScale + 0.1).toFixed(3));
      chama.style.setProperty('--y', '-2px');
    }
  }

  window.JORNADA_CHAMA = {
    criarChama: criarChama,
    ajustar: ajustarChama,
  };
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
