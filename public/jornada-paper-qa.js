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
  } else if (mode === "h") {
    root.classList.add("pergaminho-h");
  }

  // NOVO: Define a URL da imagem diretamente no estilo do elemento
  const imageUrl = (mode === "v") ? CFG.PERGAMINHO_VERT : CFG.PERGAMINHO_HORIZ;
  root.style.backgroundImage = `url("${imageUrl}")`;
  root.style.backgroundRepeat = "no-repeat";
  root.style.backgroundPosition = "center";
  root.style.backgroundSize = "cover";
  root.style.minHeight = "82vh";
}

/* ===== BLOCOS OFICIAIS + VÍDEOS DE TRANSIÇÃO =====
   Cada bloco tem:
   - id, title
   - video_after (opcional): toca ao avançar para o PRÓXIMO bloco
   - questions: [{id, label, type}]
*/
window.JORNADA_BLOCKS = [
  {
    id: "reflexoes",
    title: "Reflexões da Alma e da Existência",
    video_after: "/filme-1-entrando-na-jornada.mp4",
    questions: [
      { id: "existencia_primeira_memoria", label: "Você se recorda da idade em que, pela primeira vez, percebeu que era alguém neste mundo?", type: "textarea" },
      { id: "sentido_vida", label: "Qual é o sentido da vida para você neste momento?", type: "textarea" },
      { id: "forca_interior", label: "De onde você tira forças quando tudo parece difícil?", type: "textarea" },
      { id: "legado", label: "Que marca você gostaria de deixar no mundo?", type: "textarea" }
    ]
  },
  {
    id: "raizes",
    title: "Raízes e Experiências de Vida",
    video_after: "/filme-2-dentro-da-jornada.mp4",
    questions: [
      { id: "infancia", label: "Que lembrança da infância mais marcou sua vida?", type: "textarea" },
      { id: "familia", label: "Qual o papel da família na sua jornada?", type: "textarea" },
      { id: "dor", label: "Qual foi a maior dor ou perda que moldou quem você é hoje?", type: "textarea" },
      { id: "superacao", label: "Qual a maior superação da sua vida?", type: "textarea" }
    ]
  },
  {
    id: "caminho",
    title: "Caminho Pessoal",
    video_after: "/filme-3-traumas-na-jornada.mp4",
    questions: [
      { id: "proposito", label: "Qual propósito guia as suas escolhas hoje?", type: "textarea" },
      { id: "talentos", label: "Quais são seus maiores talentos ou dons?", type: "textarea" },
      { id: "relacionamentos", label: "O que você mais valoriza em um relacionamento humano?", type: "textarea" },
      { id: "espiritualidade", label: "O que a espiritualidade significa para você?", type: "textarea" }
    ]
  },
  {
    id: "futuro",
    title: "Futuro e Inspiração",
    video_after: "/filme-4-aproximando-do-final.mp4",
    questions: [
      { id: "sonhos", label: "Quais são seus maiores sonhos?", type: "textarea" },
      { id: "medos", label: "Que medos você gostaria de vencer?", type: "textarea" },
      { id: "mudanca", label: "Se pudesse mudar algo no mundo, o que mudaria?", type: "textarea" },
      { id: "mensagem", label: "Se pudesse deixar uma mensagem eterna, qual seria?", type: "textarea" }
    ]
  },
  {
    id: "sintese",
    title: "Síntese e Entrega",
    video_after: "/filme-5-fim-da-jornada.mp4",
    questions: [
      { id: "essencia_hoje", label: "Quem é você hoje, em uma frase de verdade?", type: "textarea" },
      { id: "passo_fe", label: "Qual será seu próximo passo de fé e coragem?", type: "textarea" }
    ]
  }
];

// Vídeo final (opcional antes de gerar PDF/HQ)
window.JORNADA_FINAL_VIDEO = "/filme-5-fim-da-jornada.mp4";

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
/* ===== [03-PERGAMINHO] paper controller ===== */
function ensureCanvas () {
  let el = document.getElementById('jornada-canvas');
  if (!el) {
    el = document.createElement('section');
    el.id = 'jornada-canvas';
    el.className = 'card pergaminho';
    document.body.appendChild(el);
  }
  el.style.display = 'block';
  el.classList.add('pergaminho');
  return el;
}

function set (mode) {
  const el = ensureCanvas();
  el.classList.remove('pergaminho-v', 'pergaminho-h');
  el.classList.add(mode === 'h' ? 'pergaminho-h' : 'pergaminho-v');
}
 /* =============================================================================
   TÍTULO: JORNADA PAPER
   SUBTÍTULO: Controla fundo do pergaminho (vertical ou horizontal)
============================================================================= */
(function () {
  function set(modo = 'v') {
    const canvas = document.getElementById('jornada-canvas');
    if (!canvas) return;

    // Remove classes antigas
    canvas.classList.remove('pergaminho-v', 'pergaminho-h');

    // Aplica a classe correta
    if (modo === 'h') {
      canvas.classList.add('pergaminho-h');
    } else {
      canvas.classList.add('pergaminho-v');
    }
  }

  function ensureCanvas() {
    let canvas = document.getElementById('jornada-canvas');
    if (!canvas) {
      canvas = document.createElement('section');
      canvas.id = 'jornada-canvas';
      canvas.className = 'card pergaminho pergaminho-v'; // padrão vertical
      document.body.appendChild(canvas);
    }
    return canvas;
  }

  // Exporta no escopo global
  window.JORNADA_PAPER = { set, ensureCanvas };
})();
  

/* mantém isso! */
window.JORNADA_PAPER = { set, ensureCanvas };
window.JORNADA_QA = { buildForm, mount };
})();
