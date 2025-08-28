/* ============================================
   jornada-paper-qa.js — Pergaminho + Perguntas (TESTE 5)
   Expondo: window.JORNADA_PAPER, window.JORNADA_QA
   ============================================ */
;(function () {
  const CFG = Object.assign(
    {
      CANVAS_ID: "jornada-canvas",
      CONTENT_ID: "jornada-conteudo",
      PERGAMINHO_VERT: "/assets/img/pergaminho-rasgado-vert.png",
      PERGAMINHO_HORIZ: "/assets/img/pergaminho-rasgado-horiz.png",
    },
    window.JORNADA_CFG || {}
  );

  function elCanvas() { return document.getElementById(CFG.CANVAS_ID); }
  function elContent(){ return document.getElementById(CFG.CONTENT_ID); }

  function ensureCanvas() {
    let root = elCanvas();
    if (!root) {
      root = document.createElement("section");
      root.id = CFG.CANVAS_ID;
      root.className = "card pergaminho";
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

  function set(mode /* 'v' | 'h' */) {
    const { root } = ensureCanvas();
    root.classList.remove("pergaminho-v", "pergaminho-h");
    if (mode === "v") {
      root.classList.add("pergaminho-v");
      root.style.backgroundImage = `url("${CFG.PERGAMINHO_VERT}")`;
    } else {
      root.classList.add("pergaminho-h");
      root.style.backgroundImage = `url("${CFG.PERGAMINHO_HORIZ}")`;
    }
    root.style.backgroundRepeat = "no-repeat";
    root.style.backgroundPosition = "center";
    root.style.backgroundSize = "cover";
    root.style.minHeight = "82vh";
  }

  // >>> AQUI: 5 PERGUNTAS DE TESTE <<<
  const DEFAULT_QUESTIONS = [
    { name: "q1", label: "Quem é você neste momento da jornada?" },
    { name: "q2", label: "Qual é sua maior força hoje?" },
    { name: "q3", label: "O que você precisa curar ou superar?" },
    { name: "q4", label: "Qual foi um pequeno ato de coragem recente?" },
    { name: "q5", label: "O que você quer semear nos próximos 7 dias?" },
  ];

  function buildForm(questions = DEFAULT_QUESTIONS) {
    return `
      <form id="form-perguntas" class="grid gap-3">
        ${questions.map(q => `
          <label class="grid gap-1">
            <span class="font-medium">${q.label}</span>
            <input name="${q.name}" class="px-3 py-2 rounded border border-gray-300 bg-white/80" placeholder="Escreva aqui..." />
          </label>
        `).join("")}
      </form>
    `;
  }

  function mount(containerId = CFG.CONTENT_ID, questions = DEFAULT_QUESTIONS, { onBack, onFinish } = {}) {
    set("h");
    const { content } = ensureCanvas();
    content.innerHTML = `
      <h2 class="text-xl md:text-2xl font-semibold mb-3">Perguntas</h2>
      ${buildForm(questions)}
      <div class="mt-4 flex flex-wrap gap-2">
        <button id="qa-back" class="px-3 py-2 rounded bg-gray-700 text-white">Voltar</button>
        <button id="qa-finish" class="px-4 py-2 rounded bg-purple-700 text-white">Finalizar</button>
      </div>
    `;

    // evita submit/refresh
    document.getElementById("qa-back")?.addEventListener("click", (e) => {
      e.preventDefault();
      onBack && onBack();
    });
    document.getElementById("qa-finish")?.addEventListener("click", (e) => {
      e.preventDefault();
      onFinish && onFinish();
    });
  }

  window.JORNADA_PAPER = { set, ensureCanvas };
  window.JORNADA_QA = { buildForm, mount };
})();
