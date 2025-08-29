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
     
    // depois de preencher o innerHTML da intro:
document.getElementById("btn-iniciar")?.addEventListener("click", (ev) => {
  ev.preventDefault();
  renderPerguntas();
});

function renderPerguntas() {
  // garante pergaminho horizontal e conteúdo
  try { JORNADA_PAPER.set("h"); } catch(e){}

  // monta as perguntas mínimas (ou use as do DEFAULT_QUESTIONS do módulo)
  const PERGUNTAS = [
    { name: "q1", label: "Quem é você neste momento da jornada?" },
    { name: "q2", label: "Qual é sua maior força hoje?" },
    { name: "q3", label: "O que você precisa curar/superar?" },
    { name: "q4", label: "Qual foi um pequeno ato de amor seu hoje?" },
    { name: "q5", label: "O que você quer agradecer agora?" },
  ];

  // monta o formulário + botões Voltar/Finalizar
  JORNADA_QA.mount(
    /* containerId */ undefined,
    /* questions   */ PERGUNTAS,
    {
      onBack() {
        // se não quer voltar no meio, pode remover este botão lá no QA
        renderIntro();
      },
      onFinish() {
        // aqui já segue para a tela final
        renderFinal();
      }
    }
  );
}

  // --- progresso simples (badge e barra) ---
  const inputs = content.querySelectorAll('#form-perguntas input, #form-perguntas textarea');
  function updateProg() {
    const total = inputs.length || 1;
    const feitas = [...inputs].filter(i => i.value.trim().length > 0).length;
    const pct = Math.round((feitas / total) * 100);

    const progBadge = document.getElementById('jprog-pct');
    if (progBadge) progBadge.textContent = `${pct}% concluído`;

    const progFill = document.getElementById('jprog-fill');
    if (progFill) progFill.style.width = `${pct}%`;
  }
  inputs.forEach(i => i.addEventListener('input', updateProg));
  updateProg();

  // datilografia mais lenta no conteúdo (se estiver usando)
  try {
    requestAnimationFrame(() => {
      JORNADA_TYPO?.typeAll("#jornada-conteudo", { force:true, speed:36, maxTotalMs:7500 });
    });
  } catch {}
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


