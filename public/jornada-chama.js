// Chama de Imersão - injeta e dimensões automaticamente
(function () {
  function criarChama() {
    const d = document.createElement("div");
    d.className = "chama-container";
    d.innerHTML = `<span></span>`; // Única chama
    return d;
  }

  function ajustarChama(sentimento, chamaEl) {
    if (!chamaEl) return;
    chamaEl.classList.remove("chama-sofrida", "chama-alegre");
    const baseScale = 1.04;
    if (sentimento === "sofrida") {
      chamaEl.style.setProperty('--scale', (baseScale - 0.1).toFixed(3));
      chamaEl.style.setProperty('--y', '2px');
    } else if (sentimento === "alegre") {
      chamaEl.style.setProperty('--scale', (baseScale + 0.1).toFixed(3));
      chamaEl.style.setProperty('--y', '-2px');
    }
  }

  function initChama() {
    const chamaHeader = document.querySelector('.site-header .chama');
    const chamaPerguntas = document.getElementById("chama-perguntas");
    const chamaFinal = document.getElementById("chama-final");

    // Garante que cada chama tenha um único <span>
    [chamaHeader, chamaPerguntas, chamaFinal].forEach(chamaEl => {
      if (chamaEl && !chamaEl.querySelector('span')) {
        chamaEl.innerHTML = criarChama().innerHTML;
        if (chamaEl === chamaHeader) chamaEl.className = "chama chama-lg";
        else if (chamaEl === chamaPerguntas) chamaEl.className = "chama chama-md-intermediario";
        else if (chamaEl === chamaFinal) chamaEl.className = "chama chama-lg";
      }
    });

    let t;
    const brilho = (chamaEl) => {
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
        chamaEl.style.setProperty('--scale', s.toFixed(3));
        chamaEl.style.setProperty('--y', y.toFixed(2) + 'px');
        chamaEl.style.setProperty('--rot', rot.toFixed(2) + 'deg');
        requestAnimationFrame(loop);
      })();
    };

    [chamaHeader, chamaPerguntas, chamaFinal].forEach(chamaEl => {
      if (chamaEl) brilho(chamaEl);
    });
  }

  document.addEventListener('DOMContentLoaded', initChama);

  window.JORNADA_CHAMA = {
    criarChama: criarChama,
    ajustar: ajustarChama,
  };
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
