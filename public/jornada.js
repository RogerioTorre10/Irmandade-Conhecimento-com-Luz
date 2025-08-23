/* =========================
   Jornada Essencial – fluxo básico com passos
   ========================= */

const STATE_KEY = "jornada_state_v1";

const loadState = () => {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); }
  catch { return {}; }
};
const saveState = (s) => localStorage.setItem(STATE_KEY, JSON.stringify(s));
const clearState = () => localStorage.removeItem(STATE_KEY);

// util
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let current = 1;
let totalSteps = 1;

document.addEventListener("DOMContentLoaded", () => {
  const st = loadState();

  // passos
  const steps = $$("#steps .step");
  totalSteps = Math.max(1, steps.length);
  if (!st.current || st.current < 1 || st.current > totalSteps) {
    current = 1;
  } else {
    current = st.current;
  }

  // fluxo inicial
  if (!st.started) showIntro();
  else showWizard();

  // listeners gerais
  $("#btn-iniciar")?.addEventListener("click", startJourney);
  $("#btn-prev")?.addEventListener("click", prevStep);
  $("#btn-next")?.addEventListener("click", nextStep);
  $("#btn-review")?.addEventListener("click", goReview);
  $("#btn-clear-all")?.addEventListener("click", clearAll);

  $("#btn-voltar-wizard")?.addEventListener("click", () => {
    showWizard();
    focusStep(current);
  });

  $("#btn-finalizar")?.addEventListener("click", () => {
    const st = loadState();
    st.finished = true;
    saveState(st);
    showFinal();
  });

  $("#btn-baixar-tudo")?.addEventListener("click", baixarTudo);

  // restaura valores dos inputs
  restoreInputsFromState();
  focusStep(current);
});

/* ======= Views ======= */
function showIntro() {
  $("#intro")?.removeAttribute("hidden");
  $("#wizard")?.setAttribute("hidden", "hidden");
  $("#review")?.setAttribute("hidden", "hidden");
  $("#final")?.setAttribute("hidden", "hidden");
}
function showWizard() {
  $("#wizard")?.removeAttribute("hidden");
  $("#intro")?.setAttribute("hidden", "hidden");
  $("#review")?.setAttribute("hidden", "hidden");
  $("#final")?.setAttribute("hidden", "hidden");
}
function showReview() {
  $("#review")?.removeAttribute("hidden");
  $("#wizard")?.setAttribute("hidden", "hidden");
  $("#intro")?.setAttribute("hidden", "hidden");
  $("#final")?.setAttribute("hidden", "hidden");
}
function showFinal() {
  $("#final")?.removeAttribute("hidden");
  $("#wizard")?.setAttribute("hidden", "hidden");
  $("#intro")?.setAttribute("hidden", "hidden");
  $("#review")?.setAttribute("hidden", "hidden");
}

/* ======= Fluxo ======= */
function startJourney() {
  const st = loadState();
  st.started = true;
  st.current = 1;
  saveState(st);
  current = 1;
  showWizard();
  focusStep(current);
}

function focusStep(n) {
  const steps = $$("#steps .step");
  steps.forEach((el) => el.setAttribute("hidden", "hidden"));
  const at = steps[n - 1];
  if (at) at.removeAttribute("hidden");

  const st = loadState();
  st.current = n;
  saveState(st);
}

function prevStep() {
  if (current > 1) current--;
  focusStep(current);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function nextStep() {
  if (current < totalSteps) {
    current++;
    focusStep(current);
  } else {
    // último passo → review
    goReview();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goReview() {
  // salva inputs antes de montar a revisão
  persistInputsToState();
  mountReview();
  showReview();
}

function mountReview() {
  const review = $("#review-list");
  review.innerHTML = "";

  const steps = $$("#steps .step");
  steps.forEach((el, idx) => {
    const label = el.querySelector("label")?.textContent?.trim() || `Pergunta ${idx + 1}`;
    const input = el.querySelector("input, textarea");
    let value = "";

    if (input) {
      if (input.tagName === "INPUT") value = input.value || "";
      else value = input.value || "";
    }
    const card = document.createElement("div");
    card.className = "border rounded-lg p-3 bg-white";
    card.innerHTML = `<div class="text-sm opacity-70 mb-1">${label}</div>
                      <div class="font-medium whitespace-pre-wrap">${sanitize(value)}</div>`;
    review.appendChild(card);
  });
}

/* ======= Estado de inputs ======= */
function persistInputsToState() {
  const st = loadState();
  st.answers = st.answers || {};
  const steps = $$("#steps .step");
  steps.forEach((el, idx) => {
    const input = el.querySelector("input, textarea");
    const key = `q${idx + 1}`;
    st.answers[key] = input ? input.value : "";
  });
  saveState(st);
}

function restoreInputsFromState() {
  const st = loadState();
  if (!st.answers) return;

  const steps = $$("#steps .step");
  steps.forEach((el, idx) => {
    const input = el.querySelector("input, textarea");
    const key = `q${idx + 1}`;
    if (input && st.answers[key] != null) {
      input.value = st.answers[key];
    }
  });

  // persiste ao digitar
  steps.forEach((el, idx) => {
    const input = el.querySelector("input, textarea");
    if (!input) return;
    input.addEventListener("input", () => {
      const st2 = loadState();
      st2.answers = st2.answers || {};
      st2.answers[`q${idx + 1}`] = input.value;
      saveState(st2);
    });
  });
}

function clearAll() {
  clearState();
  // limpa inputs
  $$("#wizard input[type='text'], #wizard textarea").forEach((el) => (el.value = ""));
  // volta para intro
  current = 1;
  showIntro();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ======= Baixar PDF + HQ (stub para seus endpoints) ======= */
async function baixarPDF() {
  // TODO: troque por sua chamada real (fetch/axios) para gerar e baixar o PDF
  // Exemplo fake com delay:
  await delay(800);
}
async function baixarHQ() {
  // TODO: troque por sua chamada real para gerar e baixar a HQ
  await delay(800);
}

async function baixarTudo() {
  const el = $("#status-download");
  try {
    el.textContent = "Gerando PDF...";
    await baixarPDF();

    el.textContent = "Gerando HQ...";
    await baixarHQ();

    el.textContent = "PDF e HQ finalizados! Redirecionando...";
    clearState();
    setTimeout(() => (window.location.href = "/"), 1200);
  } catch (e) {
    console.error(e);
    el.textContent = "Houve um erro ao gerar os arquivos. Tente novamente.";
  }
}

/* ======= Helpers ======= */
function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }
function sanitize(s = "") {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}
