/* ============================================
   jornada-render.js  —  Render & Pergaminhos
   Irmandade Conhecimento com Luz
   --------------------------------------------
   Responsável por:
   • Alternar pergaminho vertical/horizontal
   • Renderizar Home, Intro, Perguntas, Final
   • Expor hooks para o CORE/BOOTSTRAP
   ============================================ */

;(function () {
  // ------- Configuração & Defaults -------
  const CFG = (window.JORNADA_CFG = Object.assign(
    {
      CANVAS_ID: "jornada-canvas",
      CONTENT_ID: "jornada-conteudo",
      PERGAMINHO_VERT: "/assets/img/perg-vert.png",
      PERGAMINHO_HORIZ: "/assets/img/perg-horiz.png",
      START_SCREEN: "home", // 'home' | 'intro'
    },
    window.JORNADA_CFG || {}
  ));

  // ------- Estado local de hooks (injetados pelo CORE/BOOTSTRAP) -------
  // onStart(): chamado quando clicar "Iniciar" na Intro
  // onFinalize(): chamado ao clicar "Finalizar" nas Perguntas
  // onDownload(): chamado ao clicar "Baixar PDF + HQ" na Final
  const HOOKS = {
    onStart: () => {},
    onFinalize: () => {},
    onDownload: async () => {},
  };

  // ------- Utilidades internas -------
  function elCanvas() {
    return document.getElementById(CFG.CANVAS_ID);
  }
  function elContent() {
    return document.getElementById(CFG.CONTENT_ID);
  }

  // Garante que exista <section id="jornada-canvas"><div id="jornada-conteudo"></div></section>
  function ensureCanvas() {
    let root = elCanvas();
    if (!root) {
      root = document.createElement("section");
      root.id = CFG.CANVAS_ID;
      root.className = "card pergaminho"; // classe base, variantes V/H entram por JS
      document.body.appendChild(root);
    }
    let content = elContent();
    if (!content) {
      content = document.createElement("div");
      content.id = CFG.CONTENT_ID;
      content.className = "conteudo-pergaminho";
      root.innerHTML = "";
      root.appendChild(content);
    }
    return { root, content };
  }

  // 1) setPergaminho: força altura e cover via JS também
function setPergaminho(mode /* 'v' | 'h' */) {
  const { root } = ensureCanvas();
  root.classList.remove("pergaminho-v", "pergaminho-h");
  if (mode === "v") root.classList.add("pergaminho-v");
  if (mode === "h") root.classList.add("pergaminho-h");

  // Fallback inline (se o CSS demorar a carregar)
  root.style.backgroundRepeat = "no-repeat";
  root.style.backgroundPosition = "center";
  root.style.backgroundSize = "cover";   // <— garante que não fique “metade”
  root.style.minHeight = "82vh";
}

// 2) renderHome (vertical)
function renderHome() {
  setPergaminho("v");
  const { content } = ensureCanvas();
  content.innerHTML = `
    <h1 class="text-2xl md:text-3xl font-bold mb-2">Irmandade Conhecimento com Luz</h1>
    <p class="mb-4 opacity-90">Bem-vindo! Clique para iniciar a Jornada Essencial.</p>
    <div class="flex gap-2">
      <button id="btn-ir-intro" class="px-4 py-2 rounded bg-blue-600 text-white">Ir para Introdução</button>
    </div>
  `;
  document.getElementById("btn-ir-intro")?.addEventListener("click", renderIntro);
}

// 3) renderIntro (vertical)
function renderIntro() {
  setPergaminho("v");
  const { content } = ensureCanvas();
  content.innerHTML = `
    <h2 class="text-xl md:text-2xl font-semibold mb-3">Introdução</h2>
    <p class="mb-3">Orientações e Termo de Responsabilidade da Jornada.</p>
    <div class="flex gap-2">
      <button id="btn-iniciar" class="px-4 py-2 rounded bg-green-600 text-white">Iniciar</button>
      <button id="btn-voltar-home" class="px-3 py-2 rounded bg-gray-700 text-white">Voltar ao Início</button>
    </div>
  `;
  // Evita travar se HOOKS onStart lançar erro
  document.getElementById("btn-iniciar")?.addEventListener("click", () => {
    try { HOOKS.onStart?.(); } catch (e) { console.warn(e); }
    renderPerguntas(); // abre perguntas mesmo que hook falhe
  });
  document.getElementById("btn-voltar-home")?.addEventListener("click", renderHome);
}

// 4) renderPerguntas (horizontal)
function renderPerguntas() {
  setPergaminho("h");
  const { content } = ensureCanvas();
  content.innerHTML = `
    <h2 class="text-xl md:text-2xl font-semibold mb-3">Perguntas</h2>
    <form id="form-perguntas" class="grid gap-3">
      <label class="grid gap-1">
        <span class="font-medium">1) Quem é você neste momento da jornada?</span>
        <input name="q1" class="px-3 py-2 rounded border border-gray-300 bg-white/80" placeholder="Escreva aqui..." />
      </label>
      <label class="grid gap-1">
        <span class="font-medium">2) Qual é sua maior força hoje?</span>
        <input name="q2" class="px-3 py-2 rounded border border-gray-300 bg-white/80" placeholder="Escreva aqui..." />
      </label>
    </form>
    <div class="mt-4 flex flex-wrap gap-2">
      <button id="btn-voltar-intro" class="px-3 py-2 rounded bg-gray-700 text-white">Voltar à Introdução</button>
      <button id="btn-finalizar" class="px-4 py-2 rounded bg-purple-700 text-white">Finalizar</button>
    </div>
  `;
  document.getElementById("btn-voltar-intro")?.addEventListener("click", renderIntro);
  document.getElementById("btn-finalizar")?.addEventListener("click", async () => {
    try { await HOOKS.onFinalize?.(); } catch (e) { console.warn(e); }
    renderFinal();
  });
}

// 5) renderFinal (vertical + status e volta)
function renderFinal() {
  setPergaminho("v");
  const { content } = ensureCanvas();
  content.innerHTML = `
    <h2 class="text-xl md:text-2xl font-semibold mb-3">Conclusão da Jornada</h2>
    <p class="mb-4">Respire. Seu caminho foi registrado com coragem e verdade.</p>
    <div class="flex gap-2">
      <button id="btn-baixar" class="px-4 py-2 rounded bg-indigo-700 text-white">Baixar PDF + HQ</button>
      <button id="btn-voltar-home" class="px-3 py-2 rounded bg-gray-700 text-white">Voltar ao Início</button>
    </div>
    <p id="status-download" class="mt-3 text-sm opacity-80"></p>
  `;
  document.getElementById("btn-baixar")?.addEventListener("click", async () => {
    const status = document.getElementById("status-download");
    try {
      status.textContent = "Gerando seus arquivos…";
      await HOOKS.onDownload?.();
      status.textContent = "PDF e HQ finalizados!";
      setTimeout(renderHome, 800); // volta pra Home
    } catch (e) {
      console.error(e);
      status.textContent = "Falha ao gerar. Tente novamente.";
    }
  });
  document.getElementById("btn-voltar-home")?.addEventListener("click", renderHome);
}


  // ------- Montagem & API pública -------
  function mount({ startAt } = {}) {
    ensureCanvas();
    const first = startAt || CFG.START_SCREEN;
    if (first === "intro") return renderIntro();
    return renderHome();
  }

  function setHooks(hooks) {
    if (!hooks || typeof hooks !== "object") return;
    if (typeof hooks.onStart === "function") HOOKS.onStart = hooks.onStart;
    if (typeof hooks.onFinalize === "function") HOOKS.onFinalize = hooks.onFinalize;
    if (typeof hooks.onDownload === "function") HOOKS.onDownload = hooks.onDownload;
  }

  // Exporta para o mundo
  window.JORNADA_RENDER = {
    mount,
    setHooks,
    setPergaminho,
    renderHome,
    renderIntro,
    renderPerguntas,
    renderFinal,
  };
})();
