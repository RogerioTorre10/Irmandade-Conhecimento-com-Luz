// jornada-render.js
import { el, $, typewriter, postBinary, downloadBlob } from "./jornada-utils.js";
import { S, JORNADA_PERGUNTAS, JORNADA_CFG, buildPayload } from "./jornada-core.js";

function getRoot() {
  return document.getElementById("app") ||
         document.getElementById("jornada-root") ||
         document.getElementById("jornadaApp") ||
         document.querySelector("main") ||
         document.body;
}

export function render() {
  const root = getRoot();
  if (!root) return;

  // senha gate
  if (!S.state.auth) {
    root.replaceChildren(renderSenha());
    return;
  }

  if (S.state.step === "intro") {
    root.replaceChildren(renderIntro());
  } else if (S.state.step === "perguntas") {
    root.replaceChildren(renderPerguntasWizard());
  } else {
    root.replaceChildren(renderFinal());
  }
}

/* ====== SENHA (pergaminho-v) com olho mágico ====== */
export function renderSenha() {
  const section = el(`
    <section class="card pergaminho pergaminho-v" style="max-width: 760px; margin-inline:auto;">
      <h1 class="title">Acesso à Jornada</h1>
      <p id="msgSenha" class="mt-2 lumen-typing"></p>
      <div class="mt-4" style="display:flex;gap:.5rem;align-items:center;">
        <input type="password" id="inpSenha" class="q-input" placeholder="Senha (ex.: iniciar)" style="max-width:260px;">
        <button id="btnEye" class="btn" title="Mostrar/ocultar">👁️</button>
        <button id="btnEntrar" class="btn btn-primary">Entrar</button>
      </div>
      <div id="senhaErro" class="mt-3" style="color:#b91c1c;font-size:.9rem;"></div>
    </section>
  `);

  typewriter($("#msgSenha", section), "Digite a senha para iniciar.");

  const inp = $("#inpSenha", section);
  const eye = $("#btnEye", section);
  const btn = $("#btnEntrar", section);
  const err = $("#senhaErro", section);

  eye.addEventListener("click", () => {
    inp.type = (inp.type === "password" ? "text" : "password");
  });
  inp.addEventListener("keydown", (e)=>{ if (e.key === "Enter") btn.click(); });

  btn.addEventListener("click", () => {
    const val = (inp.value || "").trim();
    if (val.toLowerCase() === JORNADA_CFG.PASS.toLowerCase()) {
      S.state.auth = true;
      S.state.step = "intro";
      S.state.qIndex = 0;
      S.state.respostas = S.state.respostas || {};
      S.save(S.state);
      render();
    } else {
      err.textContent = "Senha inválida. Tente novamente.";
    }
  });

  return section;
}

/* ====== INTRO (pergaminho-v) ====== */
export function renderIntro() {
  const section = el(`
    <section class="card pergaminho pergaminho-v" style="max-width: 760px; margin-inline:auto;">
      <h1 class="title">Jornada Conhecimento com Luz – Essencial</h1>
      <p id="introMsg" class="mt-2 lumen-typing" role="status" aria-live="polite"></p>
      <div class="mt-6 flex gap-2">
        <button id="btnIniciar" class="btn btn-primary">Iniciar</button>
      </div>
    </section>
  `);

  typewriter($("#introMsg", section),
    "Olá, eu sou o Lumen. Estou com você. Quando quiser, clique em Iniciar e vamos atravessar esta jornada juntos.",
    { speed: 28, jitter: 16, initialDelay: 120 }
  );

  $("#btnIniciar", section).addEventListener("click", () => {
    S.state.step = "perguntas";
    S.state.qIndex = 0;
    S.state.respostas = S.state.respostas || {};
    S.save(S.state);
    render();
  });

  return section;
}

/* ====== PERGUNTAS PASSO-A-PASSO (pergaminho-h) ====== */
export function renderPerguntasWizard() {
  const qs = JORNADA_PERGUNTAS;
  const i = Math.max(0, Math.min(S.state.qIndex || 0, qs.length - 1));
  const q = qs[i];

  const section = el(`
    <section class="card pergaminho pergaminho-h" style="max-width: 900px; margin-inline:auto;">
      <div class="flex items-center justify-between">
        <h2 class="title">Pergunta ${i+1} de ${qs.length}</h2>
        <div class="w-40 h-2 bg-white/60 rounded-full overflow-hidden">
          <div id="prog" class="h-2 bg-black" style="width:${Math.round(((i+1)/qs.length)*100)}%"></div>
        </div>
      </div>

      <p id="enunciado" class="mt-4 lumen-typing"></p>

      <div class="q-card mt-3">
        <textarea id="resposta" class="q-input" rows="4" placeholder="Escreva aqui sua resposta..."></textarea>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs opacity-70">Dica: você pode limpar apenas esta resposta.</span>
          <button id="btnClearOne" class="btn">Apagar esta resposta</button>
        </div>
      </div>

      <div class="mt-6 flex gap-2">
        <button id="btnProx" class="btn btn-primary">${i === qs.length - 1 ? "Concluir" : "Avançar"}</button>
      </div>
    </section>
  `);

  // datilografar enunciado
  typewriter($("#enunciado", section), q.titulo, { speed: 26, jitter: 12, initialDelay: 40 });

  // preencher / salvar
  const ta = $("#resposta", section);
  ta.value = (S.state.respostas && S.state.respostas[q.id]) || "";
  ta.addEventListener("input", () => {
    S.state.respostas = S.state.respostas || {};
    S.state.respostas[q.id] = ta.value;
    S.save(S.state);
  });

  // apagar só esta
  $("#btnClearOne", section).addEventListener("click", () => {
    S.state.respostas = S.state.respostas || {};
    S.state.respostas[q.id] = "";
    S.save(S.state);
    ta.value = "";
    ta.focus();
  });

  // avançar / concluir
  $("#btnProx", section).addEventListener("click", () => {
    S.state.respostas = S.state.respostas || {};
    S.state.respostas[q.id] = ta.value;
    if (i === qs.length - 1) {
      S.state.step = "final";
    } else {
      S.state.qIndex = i + 1;
    }
    S.save(S.state);
    render();
  });

  // acessibilidade
  setTimeout(() => { try { ta.focus(); } catch(_){} }, 50);

  return section;
}

/* ====== FINAL (pergaminho-v) — só Baixar PDF + HQ ====== */
export function renderFinal() {
  const section = el(`
    <section class="card pergaminho pergaminho-v" style="max-width: 760px; margin-inline:auto;">
      <h2 class="title">Conclusão da Jornada</h2>
      <p id="finalMsg" class="mt-2 lumen-typing"></p>

      <details class="mt-4">
        <summary>Ver resumo das respostas</summary>
        <pre id="resumo" class="mt-2 text-xs"></pre>
      </details>

      <div class="mt-6 flex gap-2">
        <button id="btnBaixar" class="btn btn-primary">Baixar PDF + HQ</button>
      </div>
      <div id="status-msg" class="mt-4 text-sm opacity-80" role="status" aria-live="polite"></div>
    </section>
  `);

  typewriter($("#finalMsg", section), "Respire novamente. Seu caminho foi registrado com coragem e verdade.");
  $("#resumo", section).textContent = JSON.stringify(S.state.respostas || {}, null, 2);

  $("#btnBaixar", section).addEventListener("click", async () => {
    try {
      const payload = buildPayload(S.state);
      setStatus("Gerando arquivos… aguarde.");
      const pdf = await postBinary("jornada/pdf", payload);
      downloadBlob(pdf, "jornada.pdf");
      setStatus("PDF ok. Gerando HQ…");
      const hq = await postBinary("jornada/hq", payload);
      downloadBlob(hq, "jornada-hq.zip");
      setStatus("PDF e HQ finalizados! Redirecionando…");
      setTimeout(() => { window.location.href = "/index.html"; }, 1200);
    } catch (e) {
      setStatus("Falha ao gerar algum arquivo. Tente novamente.");
      console.error(e);
    }
  });

  function setStatus(t) {
    const box = $("#status-msg", section);
    box.classList.remove("lumen-typing","typing-done");
    typewriter(box, t, { speed: 22, jitter: 10, initialDelay: 40 });
  }

  return section;
}
