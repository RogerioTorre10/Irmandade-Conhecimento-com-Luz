/* ============================================
   /public/jornada-render.js
   Render + Pergaminho (V/H) — IIFE, sem import/export
   Expõe: window.JORNADA_RENDER
   ============================================ */
;(function () {
  // Config leve (pode vir de window.JORNADA_CFG, se existir)
  const CFG = Object.assign(
    {
      CANVAS_ID: "jornada-canvas",
      CONTENT_ID: "jornada-conteudo",
      // ⚠️ Caminhos corrigidos conforme sua memória:
      PERG_V: "/assets/img/pergaminho-rasgado-vert.png",
      PERG_H: "/assets/img/pergaminho-rasgado-horiz.png",
      START: "home", // "home" | "intro"
    },
    window.JORNADA_CFG || {}
  );
   
// ---------- utilitários ----------
   function activateJornada() {
  document.body.classList.add("jornada-active");
  const jc = document.getElementById("jornada-canvas");
  if (jc) jc.style.display = "block"; // desfaz o inline "display:none"
  window.scrollTo(0, 0);
}
 function deactivateJornada() {
  document.body.classList.remove("jornada-active");
  const jc = document.getElementById("jornada-canvas");
  if (jc) jc.style.display = "none"; // re-oculta quando sair da jornada
}

  // ---------- utilidades ----------
  function elCanvas() { return document.getElementById(CFG.CANVAS_ID); }
  function elContent() { return document.getElementById(CFG.CONTENT_ID); }

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

  function setPergaminho(mode /* 'v' | 'h' */) {
    const { root } = ensureCanvas();
    root.classList.remove("pergaminho-v", "pergaminho-h");
    if (mode === "v") {
      root.classList.add("pergaminho-v");
      root.style.backgroundImage = `url("${CFG.PERG_V}")`;
    } else {
      root.classList.add("pergaminho-h");
      root.style.backgroundImage = `url("${CFG.PERG_H}")`;
    }
    // fallback para garantir preenchimento
    root.style.backgroundRepeat = "no-repeat";
    root.style.backgroundPosition = "center";
    root.style.backgroundSize = "cover";
    root.style.minHeight = "82vh";
  }

  // ---------- telas ----------
  function renderHome() {
    setPergaminho("v");
    const { content } = ensureCanvas();
    content.innerHTML = `
      <h1 class="text-2xl md:text-3xl font-bold mb-2">Irmandade Conhecimento com Luz</h1>
      <p class="mb-4 opacity-90">Bem-vindo(a)! Clique para iniciar a Jornada Essencial.</p>
      <div class="flex gap-2">
        <button id="btn-ir-intro" class="px-4 py-2 rounded btn-primary">Ir para Introdução</button>
      </div>
     `;
     requestAnimationFrame(() => {
     try {
    JORNADA_TYPO?.typeAll("#jornada-conteudo", {
      force: true,        // ignora "reduce motion"
      speed: 34,       // mais lento (antes era ~20-22)
      maxTotalMs: 7500 // até 6s por tela (mais suave)
    });
  } catch (e) { console.warn(e); }
});

     
    document.getElementById("btn-ir-intro")?.addEventListener("click", renderIntro);
  }

  function renderIntro() {
    setPergaminho("v");
    const { content } = ensureCanvas();
    content.innerHTML = `
      <h2 class="text-xl md:text-2xl font-semibold mb-3">Introdução</h2>
      <p class="mb-3">Orientações e Termo de Responsabilidade da Jornada.</p>
      <div class="flex gap-2">
        <button id="btn-iniciar" class="px-4 py-2 rounded btn-primary">Iniciar</button>
        <button id="btn-voltar-home" class="px-3 py-2 rounded btn-secondary">Voltar ao Início</button>
      </div>
     `;
     requestAnimationFrame(() => {
     try {
    JORNADA_TYPO?.typeAll("#jornada-conteudo", {
      force: true,        // ignora "reduce motion"
      speed: 34,       // mais lento (antes era ~20-22)
      maxTotalMs: 7500 // até 6s por tela (mais suave)
    });
  } catch (e) { console.warn(e); }
});
     
    document.getElementById("btn-iniciar")?.addEventListener("click", renderPerguntas);
    document.getElementById("btn-voltar-home")?.addEventListener("click", renderHome);
  }

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
        <button id="btn-voltar-intro" class="px-3 py-2 rounded btn-secondary">Voltar à Introdução</button>
        <button id="btn-finalizar" class="px-4 py-2 rounded btn-primary">Finalizar</button>
      </div>
      `;
      requestAnimationFrame(() => {
      try {
      JORNADA_TYPO?.typeAll("#jornada-conteudo", {
      force: true,        // ignora "reduce motion"
      speed: 28,       
      maxTotalMs: 5000 
    });
  } catch (e) { console.warn(e); }
});
     
    document.getElementById("btn-voltar-intro")?.addEventListener("click", renderIntro);
    document.getElementById("btn-finalizar")?.addEventListener("click", renderFinal);
  }

  function renderFinal() {
    setPergaminho("v");
    const { content } = ensureCanvas();
    content.innerHTML = `
      <h2 class="text-xl md:text-2xl font-semibold mb-3">Conclusão da Jornada</h2>
      <p class="mb-4">Respire. Seu caminho foi registrado com coragem e verdade.</p>
      <div class="flex gap-2">
        <button id="btn-voltar-home" class="px-3 py-2 rounded btn-secondary">Voltar ao Início</button>
      </div>
      `;
     requestAnimationFrame(() => {
     try {
     JORNADA_TYPO?.typeAll("#jornada-conteudo", {
      force: true,        // ignora "reduce motion"
      speed: 34,       // mais lento (antes era ~20-22)
      maxTotalMs: 7500 // até 6s por tela (mais suave)
    });
  } catch (e) { console.warn(e); }
});
     
    document.getElementById("btn-voltar-home")?.addEventListener("click", renderHome);
  }

  // ---------- API pública ----------
  function mount({ startAt } = {}) {
    ensureCanvas();
    activateJornada();   // <-- força o modo jornada
  if (startAt === "intro") renderIntro();
  else if (startAt === "perguntas") renderPerguntas();
  else renderHome();
}

  // expõe no window (necessário pro bootstrap)
  window.JORNADA_RENDER = {
    mount,
    setPergaminho,
    renderHome,
    renderIntro,
    renderPerguntas,
    renderFinal,
  };
})();
