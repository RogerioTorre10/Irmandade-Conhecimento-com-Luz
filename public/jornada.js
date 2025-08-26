/* ================================
   jornada.js — VERSÃO: 1.0 (25-08-2025)
   Base Zion + ajustes Lumen
   ================================ */

window.JORNADA_CFG = {
  STORAGE_KEY: "jornada_essencial_v1",
  API_BASE: "https://conhecimento-com-luz-api.onrender.com"
};

// ---------------- State ----------------
const S = {
  state: {
    step: "intro",            // "intro" | "perguntas" | "final"
    respostas: {}             // índice -> texto
  },
  load() {
    try { return JSON.parse(localStorage.getItem(JORNADA_CFG.STORAGE_KEY) || "{}"); }
    catch { return {}; }
  },
  save(data) {
    localStorage.setItem(JORNADA_CFG.STORAGE_KEY, JSON.stringify(data || {}));
  }
};

// (Opcional) perguntas globais de fallback — substitua pelas reais se vierem de outro arquivo
window.JORNADA_PERGUNTAS = window.JORNADA_PERGUNTAS || [
  { titulo: "Pergunta 1: Reflita sobre isso..." },
  { titulo: "Pergunta 2: E agora?" }
];

// ---------------- Utils ----------------
function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

// ---- Helpers de network (PDF/ZIP) ----
async function postBinary(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/pdf, application/zip, application/octet-stream"
    },
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ${res.status} ${res.statusText} :: ${text}`);
  }
  return await res.blob();
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------- Controller ----------------
function render() {
  const root = document.getElementById("app");
  if (!root) return;

  if (S.state.step === "intro") {
    root.replaceChildren(renderIntro());
  } else if (S.state.step === "perguntas") {
    root.replaceChildren(renderPerguntas());
  } else {
    root.replaceChildren(renderFinal());
  }
}

// ================= RENDER: INTRO (pergaminho vertical) =================
function renderIntro() {
  const section = el(`
    <section class="card pergaminho pergaminho-v">
      <h1 class="titulo">Jornada Essencial</h1>
      <p class="mb-4">Boas-vindas e instruções</p>
      <div class="acoes mt-6 flex gap-2">
        <button id="btnIniciar" class="btn primario">Iniciar</button>
        <button id="btnVoltar" class="btn secundario">← Voltar</button>
      </div>
    </section>
  `);

  // Intro -> Perguntas
  section.querySelector("#btnIniciar").addEventListener("click", () => {
    S.state.step = "perguntas";
    S.save(S.state);
    render();
  });

  // Voltar para a página de jornadas (caso exista)
  section.querySelector("#btnVoltar").addEventListener("click", () => {
    window.location.href = "/jornadas.html";
  });

  return section;
}

// ============ RENDER: PERGUNTAS (pergaminho horizontal) ==============
function renderPerguntas() {
  const perguntas = window.JORNADA_PERGUNTAS || [];
  const section = el(`
    <section class="card pergaminho pergaminho-h">
      <h2 class="mb-4">Responda com calma</h2>
      <div id="listaPerguntas" class="flex flex-col gap-4"></div>
      <div class="acoes mt-6 flex gap-2">
        <button id="btnFinalizar" class="btn primario">Finalizar</button>
        <button id="btnVoltarIntro" class="btn secundario">← Instruções</button>
      </div>
    </section>
  `);

  const cont = section.querySelector("#listaPerguntas");

  // Render seguro SEM 'idx' global — usamos o índice local do forEach
  perguntas.forEach((q, index) => {
    const item = el(`
      <div class="pergunta">
        <label class="block font-semibold mb-1">${q.titulo || "Pergunta"}</label>
        <textarea class="caixa w-full" rows="3" data-index="${index}"></textarea>
      </div>
    `);
    cont.appendChild(item);
  });

  // Carrega e persiste respostas em tempo real
  section.querySelectorAll("textarea").forEach(ta => {
    const index = ta.dataset.index;
    ta.value = (S.state.respostas && S.state.respostas[index]) || "";
    ta.addEventListener("input", () => {
      if (!S.state.respostas) S.state.respostas = {};
      S.state.respostas[index] = ta.value;
      S.save(S.state);
    });
  });

  // Perguntas -> Final
  section.querySelector("#btnFinalizar").addEventListener("click", () => {
    S.state.step = "final";
    S.save(S.state);
    render();
  });

  // Voltar para Intro
  section.querySelector("#btnVoltarIntro").addEventListener("click", () => {
    S.state.step = "intro";
    S.save(S.state);
    render();
  });

  return section;
}

// ================= RENDER: FINAL (pergaminho vertical) ================
function renderFinal() {
  const section = el(`
    <section class="card pergaminho pergaminho-v">
      <h2 class="mb-2">Parabéns! Você finalizou a jornada.</h2>
      <p class="mb-4">Revise ou gere seus arquivos.</p>
      <div class="acoes mt-6 flex gap-2">
        <button id="btnGerarPDF" class="btn primario">Baixar PDF</button>
        <button id="btnRevisar" class="btn secundario">← Revisar</button>
      </div>
    </section>
  `);

  // Gerar PDF (usa corpo JSON com { respostas, kind })
  section.querySelector("#btnGerarPDF").addEventListener("click", async () => {
    try {
      const base = (JORNADA_CFG.API_BASE || "").replace(/\/+$/, "");
      if (!base) {
        alert("Backend não configurado. Defina JORNADA_CFG.API_BASE para gerar o PDF.");
        return;
      }
      const url = `${base}/generate`;
      const payload = { respostas: S.state.respostas || {}, kind: "pdf" };
      const blob = await postBinary(url, payload);
      downloadBlob(blob, "jornada-essencial.pdf");

      // Após baixar, voltar para a principal (ajuste se quiser manter na final)
      window.location.href = "/index.html";
    } catch (e) {
      console.error("Falha ao gerar PDF:", e);
      alert("Não foi possível gerar o PDF agora. Tente novamente.");
    }
  });

  // Revisar (volta para perguntas)
  section.querySelector("#btnRevisar").addEventListener("click", () => {
    S.state.step = "perguntas";
    S.save(S.state);
    render();
  });

  return section;
}

// ---------------- Bootstrap ----------------
document.addEventListener("DOMContentLoaded", () => {
  try {
    Object.assign(S.state, S.load());
    if (!S.state.respostas) S.state.respostas = {};
    render();
  } catch (e) {
    console.error("Erro ao iniciar a página:", e);
  }
});
