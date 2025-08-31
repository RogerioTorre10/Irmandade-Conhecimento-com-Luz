// /public/jornada-render-master.js  — renderer essencial mínimo (v1.0)
// Cria handlers globais: onJornadaEssencial, renderIntro, renderPerguntas.

(function () {
  const g = window;

  // Util: pega root de renderização (usa #app se existir; cai no <main> ou body)
  function getRoot() {
    return (
      document.getElementById("app") ||
      document.querySelector("main") ||
      document.body
    );
  }

  // Estilo mínimo para layout (opcional; remova se já tiver CSS próprio)
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

  // INTRO
  function renderIntro() {
    ensureBaseCSS();
    const root = getRoot();
    root.innerHTML = `
      <section class="card pergaminho pergaminho-v">
        <h1 class="title">Irmandade Conhecimento com Luz</h1>
        <p class="muted">Bem-vindo(a) à <strong>Jornada Essencial</strong>. 
        Ao avançar, você poderá responder às perguntas e gerar seu PDF/HQ ao final.</p>
        <div style="margin-top:16px">
          <button id="btnAvancarIntro" class="btn">Avançar</button>
          <button id="btnVoltarHome" class="btn" style="background:#6b7280">Página inicial</button>
        </div>
      </section>
    `;
    const go = document.getElementById("btnAvancarIntro");
    const home = document.getElementById("btnVoltarHome");
    if (go) go.onclick = renderPerguntas;
    if (home) home.onclick = () => location.assign("/");
  }

  // PERGUNTAS (placeholder mínimo — depois plugamos suas perguntas reais)
  function renderPerguntas() {
    ensureBaseCSS();
    const root = getRoot();
    root.innerHTML = `
      <section class="card pergaminho pergaminho-h">
        <h2 class="title">Perguntas — Bloco Essencial</h2>
        <div style="margin:14px 0">
          <label>1) O que move o seu coração hoje?</label>
          <textarea id="q1" rows="3" style="width:100%;margin-top:6px"></textarea>
        </div>
        <div style="margin:14px 0">
          <label>2) Qual é a missão que você sente no fundo da alma?</label>
          <textarea id="q2" rows="3" style="width:100%;margin-top:6px"></textarea>
        </div>
        <div style="margin-top:16px">
          <button id="btnConcluir" class="btn">Concluir (Demo)</button>
          <button id="btnVoltarIntro" class="btn" style="background:#6b7280">Voltar</button>
        </div>
      </section>
    `;
    const back = document.getElementById("btnVoltarIntro");
    const done = document.getElementById("btnConcluir");
    if (back) back.onclick = renderIntro;
    if (done) done.onclick = () => {
      const a = (document.getElementById("q1") || {}).value || "";
      const b = (document.getElementById("q2") || {}).value || "";
      alert("Respostas capturadas (demo):\n\n1) " + a + "\n2) " + b + "\n\nDepois ligamos isso no backend para gerar PDF/HQ.");
    };
  }

  // Expor handlers globais para o bootstrap encontrá-los
  g.renderIntro = renderIntro;
  g.renderPerguntas = renderPerguntas;
  g.onJornadaEssencial = renderIntro; // ponto único de entrada

  console.log("Renderer master pronto.");
})();
