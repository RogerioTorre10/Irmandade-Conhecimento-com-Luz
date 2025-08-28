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
   // Para redirecionar à página inicial do site.
// Se sua home estiver num subcaminho (ex.: /irmandade/), troque HOME_PATH.
const HOME_PATH = "/";
function goHome() { window.location.assign(HOME_PATH); }

   
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
      speed: 20,       // mais lento (antes era ~20-22)
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
      speed: 20,       // mais lento (antes era ~20-22)
      maxTotalMs: 7500 // até 6s por tela (mais suave)
    });
  } catch (e) { console.warn(e); }
});
     
    document.getElementById("btn-iniciar")?.addEventListener("click", renderPerguntas);
  }

 function renderPerguntas(blockIndex = 0) {
  setPergaminho("h");
  const { content } = ensureCanvas();

  const bloc = QUESTIONS.BLOCS[blockIndex];
  if (!bloc) return renderFinal();

  const totalBlocks = QUESTIONS.totalBlocks();
  const totalQ = QUESTIONS.totalQuestions();

  content.innerHTML = `
    <h2 class="text-xl md:text-2xl font-semibold mb-1">${bloc.title}</h2>

    <div class="j-progress">
      <div class="j-progress__bar"><div class="j-progress__fill" id="jprog-fill"></div></div>
      <div class="j-progress__meta">
        <span><b id="jprog-pct">0%</b> — <span id="jprog-count">0/${totalQ}</span> respondidas</span>
        <span>Bloco ${blockIndex+1}/${totalBlocks}</span>
      </div>
    </div>

    <form id="form-perguntas" class="grid gap-3"></form>

    <div class="mt-4 flex flex-wrap gap-2">
    <button id="btn-next" class="px-4 py-2 rounded btn-primary">Avançar ▶</button>
    </div>
  `;

  // monta as questões do bloco
  const form = content.querySelector("#form-perguntas");
  bloc.items.forEach((texto, qi) => {
    const key = QUESTIONS.keyFor(blockIndex, qi);
    const value = QUESTIONS.getAnswer(key);
    const row = document.createElement("label");
    row.className = "grid gap-1";
    row.innerHTML = `
      <span class="font-medium">${qi+1}) ${texto}</span>
      <textarea rows="2" data-key="${key}" class="px-3 py-2 rounded border border-gray-300 bg-white/85"
        placeholder="Escreva aqui...">${value}</textarea>
    `;
    form.appendChild(row);
  });

    // progresso local
  const localFill  = content.querySelector("#jprog-fill");
  const localPctEl = content.querySelector("#jprog-pct");
  const localCntEl = content.querySelector("#jprog-count");

  function updateLocalProgress(){
    const done  = QUESTIONS.countAnswered();
    const total = QUESTIONS.totalQuestions();
    const pct   = total ? Math.round((done/total)*100) : 0;
    if (localFill)  localFill.style.width = pct + "%";
    if (localPctEl) localPctEl.textContent = pct + "%";
    if (localCntEl) localCntEl.textContent = `${done}/${total}`;
  }

  // salvar + atualizar
  content.querySelector("#form-perguntas").addEventListener("input", (e)=>{
    const ta = e.target.closest("textarea"); if (!ta) return;
    QUESTIONS.setAnswer(ta.dataset.key, ta.value);
    updateLocalProgress();
    updateGlobalProgress?.();
  });

  updateLocalProgress();
  updateGlobalProgress?.();

  // ====== NAVEGAÇÃO APENAS PRA FRENTE + VÍDEO ======
  function playTransitionVideoForBlock(nextIndex, callback) {
    const overlay = document.getElementById("video-overlay");
    const video   = document.getElementById("transition-video");
    if (!overlay || !video) return callback?.();

    // nomeie seus vídeos como /assets/img/transicao-2.mp4, -3.mp4, ...
    const src = `/assets/img/transicao-${nextIndex}.mp4`;
    video.src = src;
    overlay.classList.remove("hidden");

    video.onended = () => {
      overlay.classList.add("hidden");
      callback?.();
    };
    video.play().catch(() => {
      overlay.classList.add("hidden");
      callback?.();
    });
  }

  // Botão PRÓXIMO (sem voltar)
  content.querySelector("#btn-next")?.addEventListener("click", (ev)=>{
    ev.preventDefault();
    const lastIndex = QUESTIONS.totalBlocks() - 1;
    if (blockIndex < lastIndex) {
      const nextIdx = blockIndex + 1;
      playTransitionVideoForBlock(nextIdx, ()=> renderPerguntas(nextIdx));
    } else {
      // chegou ao fim dos blocos
      renderAcolhimento();
    }
  });

  // datilografia
  requestAnimationFrame(()=>{ try{
    JORNADA_TYPO?.typeAll("#jornada-conteudo",{ force:true, speed:28, maxTotalMs:5000 });
  }catch(e){} });
} // <-- FECHA a função renderPerguntas (sem ')' sobrando)

         
 function renderFinal() {
  setPergaminho("v");
  const { content } = ensureCanvas();
  content.innerHTML = `
    <h2 class="text-xl md:text-2xl font-semibold mb-3">Conclusão da Jornada</h2>
    <p class="mb-4">Respire. Seu caminho foi registrado com coragem e verdade.</p>

    <div class="flex gap-2 mb-3">
      <button id="btn-download" class="px-4 py-2 rounded btn-primary">
        Baixar PDF + HQ
      </button>

      <!-- backup direto para a home, caso o usuário queira pular o download -->
      <a id="link-home"
   class="btn btn-secondary px-3 py-2 rounded"
   href="/jornadas.html"           <!-- fallback se JS falhar -->
   data-nav="home">← Voltar ao início</a>
    </div>
    <small class="opacity-80">Após concluir o download você será levado(a) para a página inicial.</small>
  `;

  // efeito de datilografia (mais suave na final)
  requestAnimationFrame(() => {
    try {
      JORNADA_TYPO?.typeAll("#jornada-conteudo", { force: true, speed: 20, maxTotalMs: 7500 });
    } catch (e) {}
  });

  // handler do botão de download
  const btn = document.getElementById("btn-download");
  btn?.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Preparando arquivos...";

    // tenta usar sua função real, se existir. Senão, faz um "aguarde" curto.
    const baixar = (window.JORNADA_CORE && window.JORNADA_CORE.baixarArquivos)
      ? window.JORNADA_CORE.baixarArquivos
      : () => new Promise(r => setTimeout(r, 1200));

    try {
      await baixar();                 // << aqui acontece seu download real
      // dica UX: confirma visualmente
      btn.textContent = "Downloads prontos!";
    } catch (e) {
      console.warn("Falha ao gerar arquivos:", e);
      // segue para home mesmo assim
    } finally {
      // leva direto para a home
      goHome();
    }
  });
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

function playTransitionVideoForBlock(nextIndex, callback) {
  const overlay = document.getElementById("video-overlay");
  const video = document.getElementById("transition-video");
  if (!overlay || !video) return callback?.();

  // monta o caminho do vídeo baseado no próximo bloco
  const src = `/assets/img/transicao-${nextIndex}.mp4`;  
  video.src = src;
  overlay.classList.remove("hidden");

  video.onended = () => {
    overlay.classList.add("hidden");
    callback?.();
  };

  video.play().catch(() => {
    // fallback se autoplay não rolar
    overlay.classList.add("hidden");
    callback?.();
  });
}


