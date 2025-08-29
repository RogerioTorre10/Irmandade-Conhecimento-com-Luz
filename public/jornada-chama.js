// Chama da Irmandade – injeta e dimensiona automaticamente
(function(){
  function criaChama(sm=false){
    const d = document.createElement("div");
    d.className = sm ? "chama chama-sm" : "chama";
    d.innerHTML = "<span></span><span></span><span></span>";
    return d;
  }

  // Exemplo: adiciona chama grande no header
  window.addEventListener("DOMContentLoaded", ()=>{
    const header = document.querySelector("header") || document.body;
    header.appendChild(criaChama(false));
  });

  // exporta global
  window.JORNADA_CHAMA = { criaChama };
})();

  // Evita duplicar se já existe
  if (document.getElementById("chama-container")) return;

  // Home grande; demais pequenas
  const path = (location.pathname || "/").toLowerCase();
  const isHome =
    path === "/" ||
    path.endsWith("/index.html") ||
    path === "" ||
    path.endsWith("/public/"); // proteção extra em ambientes estáticos

  const cont = document.createElement("div");
  cont.id = "chama-container";
  cont.className = isHome ? "chama--lg" : "chama--sm";
  cont.setAttribute("aria-hidden", "true"); // decorativo

  const img = document.createElement("img");
  img.id = "chama";
  img.src = SRC;
  img.alt = "";

  cont.appendChild(img);
  document.body.appendChild(cont);

  // “Respira” de tempos em tempos para ficar mais viva
  let t;
  const brilho = () => {
    img.style.filter = "drop-shadow(0 0 16px #ffe28a) drop-shadow(0 0 34px #ffb347)";
    setTimeout(() => {
      img.style.filter = "";
    }, 1600);
  };
  const start = () => { t = setInterval(brilho, 15000); };
  const stop  = () => { clearInterval(t); };

  // respeita prefers-reduced-motion (sem efeitos extras)
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!mql.matches) start();
  mql.addEventListener?.("change", e => { e.matches ? stop() : start(); });

  console.log("🔥 Chama da Irmandade ativada:", isHome ? "grande (home)" : "pequena (páginas internas)");
})();
