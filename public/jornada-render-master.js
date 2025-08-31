// /public/jornada-render-master.js — delega para JornadaCtrl (v1.1)
(function () {
  const g = window;

  // base CSS mínimo (mantém se quiser o pergaminho/demo; remova se já tem seu CSS)
  function ensureBaseCSS() {
    if (document.getElementById("jr-base-css")) return;
    const css = `
    .card{max-width:900px;margin:24px auto;padding:20px;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.12);background:#fff}
    .pergaminho{background:#f6efe0;}
    .pergaminho-v{background-image:url('/assets/img/pergaminho-vertical.png');background-size:cover;background-position:center;}
    .pergaminho-h{background-image:url('/assets/img/pergaminho-horizontal.png');background-size:cover;background-position:center;}
    .btn{display:inline-block;padding:.7rem 1.2rem;border-radius:10px;border:0;background:#1f2937;color:#fff;font-weight:600;cursor:pointer}
    .btn + .btn{margin-left:.5rem}
    .title{font-size:1.6rem;margin:0 0 .5rem 0}
    .muted{opacity:.75}
    `;
    const style = document.createElement("style");
    style.id = "jr-base-css";
    style.textContent = css;
    document.head.appendChild(style);
  }
  ensureBaseCSS();

  // Se existir JornadaCtrl, usa ele como fonte oficial
  function start() {
    if (g.JornadaCtrl && typeof g.JornadaCtrl.start === "function") {
      g.JornadaCtrl.start();
      return;
    }
    // Fallback ultra-simples:
    if (typeof g.renderIntro === "function") {
      g.renderIntro();
      return;
    }
    alert("Nenhum renderer disponível.");
  }

  // Expor handlers esperados pelo bootstrap
  g.onJornadaEssencial = start;
  g.renderIntro = function(){ g.JornadaCtrl ? g.JornadaCtrl.renderIntro() : alert("Ctrl indisponível."); };
  g.renderPerguntas = function(){ g.JornadaCtrl ? g.JornadaCtrl.renderPerguntas() : alert("Ctrl indisponível."); };

  console.log("Renderer master pronto.");
})();
