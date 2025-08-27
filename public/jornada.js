/* ============================================================
   Jornada Essencial – Script Unificado
   (Senha + Olho Mágico + Fallback API + Typewriter + PDF/HQ)
   Modo PASSO-A-PASSO (1 pergunta por tela, sem botão Voltar)
   Versão: 1.4 (26-08-2025)
   Autor: Lumen (Irmandade Conhecimento com Luz)
   ============================================================ */

(function () {
  "use strict";

  // ================================
  // CONFIG CENTRAL (sem hardcode)
  // ================================
  const APP = (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};
  const DEFAULT_BACKEND = "https://lumen-backend-api.onrender.com/api"; // fallback seguro
  const API_BASE_RAW = (APP.API_BASE || DEFAULT_BACKEND);
  const API_BASE = API_BASE_RAW.replace(/\/+$/, ""); // normaliza
  const STORAGE_KEY = APP.STORAGE_KEY || "jornada_essencial_v1";
  const PASS       = (APP.PASS || "iniciar").toString();

  // ================================
  // STATE (localStorage)
  // ================================
  const S = {};
  S.load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch(_) { return {}; } };
  S.save = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {})); } catch(_) {} };
  S.clear = () => { try { localStorage.removeItem(STORAGE_KEY); } catch(_) {} };

  // ================================
  // HELPERS DOM
  // ================================
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "className") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.substring(2), v);
      else if (k === "style") node.setAttribute("style", v);
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => c && node.appendChild(c));
    return node;
  };
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  function getRoot(){ return $("#jornada-root") || $("#jornadaApp") || document.querySelector("main") || document.body; }

  // ================================
  // TYPEWRITER (Lumen datilografando)
  // ================================
  function typewriter(node, text, opts = {}) {
    const speed  = opts.speed ?? 28;     // ms base
    const jitter = opts.jitter ?? 14;    // variação
    const delay  = opts.initialDelay ?? 100;
    const onDone = opts.done;

    node.textContent = "";
    node.classList.add("lumen-typing");
    let i = 0;
    function tick(){
      if (i < text.length) {
        node.textContent += text[i++];
        const d = speed + (jitter ? Math.floor(Math.random() * jitter) : 0);
        setTimeout(tick, d);
      } else {
        node.classList.add("typing-done");
        if (typeof onDone === "function") onDone();
      }
    }
    setTimeout(tick, delay);
  }

  function showMsg(section, text) {
    let box = $("#status-msg", section);
    if (!box) { box = el("div", { id: "status-msg", className: "mt-4 text-sm opacity-80", role: "status", "aria-live": "polite" }); section.appendChild(box); }
    box.classList.remove("lumen-typing","typing-done");
    box.textContent = text;
  }
  function showMsgTyped(section, text) {
    let box = $("#status-msg", section);
    if (!box) { box = el("div", { id: "status-msg", className: "mt-4 text-sm opacity-80", role: "status", "aria-live": "polite" }); section.appendChild(box); }
    typewriter(box, text, { speed: 24, jitter: 12, initialDelay: 40 });
  }

  // ================================
  // FETCH com fallback /api
  // ================================
  async function fetchWithApiFallback(path, init) {
    const candidates = [];
    if (API_BASE) {
      candidates.push(API_BASE);
      if (/\/api$/.test(API_BASE)) candidates.push(API_BASE.replace(/\/api$/, ""));
      else candidates.push(API_BASE + "/api");
    } else {
      candidates.push("");
      candidates.push("/api");
    }
    let lastErr;
    for (const base of candidates) {
      const url = base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
      try {
        const res = await fetch(url, init);
        if (res.ok) return res;
        lastErr = new Error(`HTTP_${res.status}`);
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("all_endpoints_failed");
  }
  async function baixarArquivoFlex(path, fetchInit, filename) {
    const res = await fetchWithApiFallback(path, fetchInit);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }
  function clearStateAndGoHome(){ S.clear(); setTimeout(() => { window.location.href = "/index.html"; }, 1200); }

  // ================================
  // PERGUNTAS (fallback)
  // ================================
  const FALLBACK_QUESTIONS = [
    { id: "q1", t: "Quem é você hoje e o que deseja transformar?", kind: "text" },
    { id: "q2", t: "Qual lembrança te acende fé quando tudo parece difícil?", kind: "text" },
    { id: "q3", t: "Em uma palavra, qual é sua missão?", kind: "text" },
    { id: "q4", t: "Quais hábitos deseja fortalecer nos próximos 30 dias?", kind: "text" },
    { id: "q5", t: "De 0 a 10, qual seu nível de esperança? Por quê?", kind: "text" }
  ];
  function getQuestions(){
    if (Array.isArray(window.JORNADA_QUESTIONS) && window.JORNADA_QUESTIONS.length) {
      return window.JORNADA_QUESTIONS.map((q, i) => {
        if (typeof q === "string") return { id: `q${i+1}`, t: q, kind: "text" };
        return { id: q.id || `q${i+1}`, t: q.t || q.text || q.pergunta || `Pergunta ${i+1}`, kind: q.kind || "text" };
      });
    }
    return FALLBACK_QUESTIONS;
  }

  // ================================
  // RENDER – Fluxo (senha → intro → perguntas passo-a-passo → final)
  // ================================
  function render(state){
    const root = getRoot(); if (!root) return; clear(root);
    if (!state?.auth) return renderSenha(state, root);
    const step = state?.step || "intro";
    if (step === "intro") return renderIntro(state, root);
    if (step === "perguntas") return renderPerguntasWizard(state, root);
    if (step === "final") return renderFinal(state, root);
  }

  // SENHA (pergaminho-v) com OLHO MÁGICO
  function renderSenha(state, root){
    let idx = 0;
    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h1", { className: "title", text: "Acesso à Jornada" }));

    const msg = el("p", { className: "mt-2" });
    typewriter(msg, "Digite a senha para iniciar.");
    section.appendChild(msg);

    const box = el("div", { className: "mt-4 flex items-center gap-2" });
    const inp = el("input", { type: "password", className: "q-input", placeholder: "Senha (ex.: iniciar)", style: "max-width:260px;" });
    const eye = el("button", { className: "btn", type: "button", title: "Mostrar/ocultar senha", text: "👁️" , onclick: () => {
      inp.type = (inp.type === "password" ? "text" : "password");
    }});
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });

    const btn = el("button", { className: "btn btn-primary", text: "Entrar", onclick: () => {
      const val = (inp.value || "").trim();
      if (val.toLowerCase() === PASS.toLowerCase()) {
        const st = S.load(); st.auth = true; st.step = "intro"; st.qIndex = 0; S.save(st); render(st);
      } else { showMsg(section, "Senha inválida. Tente novamente."); }
    }});

    box.appendChild(inp); box.appendChild(eye); box.appendChild(btn);
    section.appendChild(box);
    root.appendChild(section);
  }

  // INTRO (pergaminho-v) – com Lumen “datilografando”
  function renderIntro(state, root){
    let idx = 0;
    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h1", { className: "title", text: "Jornada Conhecimento com Luz – Essencial" }));

    const p = el("p", { className: "mt-2 lumen-typing", role: "status", "aria-live": "polite" });
    section.appendChild(p);
    typewriter(p, "Olá, eu sou o Lumen. Estou com você. Quando quiser, clique em Iniciar e vamos atravessar esta jornada juntos.", { speed: 28, jitter: 16, initialDelay: 120 });

    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });
    const btnIniciar = el("button", { className: "btn btn-primary", text: "Iniciar", onclick: () => startPerguntas() });
    actions.appendChild(btnIniciar);
    section.appendChild(actions);

    root.appendChild(section);
  }

  function startPerguntas(){
    const st = S.load(); st.step = "perguntas"; st.qIndex = 0; if (!st.answers) st.answers = {}; S.save(st); render(st);
  }

  // PERGUNTAS – PASSO A PASSO (pergaminho-h) – SEM botão Voltar
  function renderPerguntasWizard(state, root){
    const qs = getQuestions();
    if (!state.answers) state.answers = {};
    if (typeof state.qIndex !== "number") state.qIndex = 0;

    const i = Math.max(0, Math.min(state.qIndex, qs.length - 1));
    const q = qs[i];

    const section = el("section", { className: "card pergaminho pergaminho-h" });

    // Header com progresso
    const header = el("div", { className: "flex items-center justify-between" });
    header.appendChild(el("h2", { className: "title", text: `Pergunta ${i+1} de ${qs.length}` }));
    const progWrap = el("div", { className: "w-40 h-2 bg-white/60 rounded-full overflow-hidden" });
    const prog = el("div", { className: "h-2 bg-black", style: `width:${Math.round(((i+1)/qs.length)*100)}%` });
    progWrap.appendChild(prog); header.appendChild(progWrap); section.appendChild(header);

    // Enunciado com efeito datilografando
    const enun = el("p", { className: "mt-4 lumen-typing" });
    section.appendChild(enun);
    typewriter(enun, q.t, { speed: 26, jitter: 12, initialDelay: 40 });

    // Resposta
    const card = el("div", { className: "q-card mt-3" });
    const ta = el("textarea", { className: "q-input", rows: "4", placeholder: "Escreva aqui sua resposta..." });
    ta.value = state.answers[q.id] || "";
    ta.addEventListener("input", () => {
      const st = S.load(); if (!st.answers) st.answers = {}; st.answers[q.id] = ta.value; S.save(st);
    });

    // Apagar somente ESTA resposta
    const line = el("div", { className: "flex items-center justify-between mt-2" });
    const hint = el("span", { className: "text-xs opacity-70", text: "Dica: Shift+E apaga tudo (atalho)." });
    const btnClearOne = el("button", { className: "btn", text: "Apagar esta resposta", onclick: () => {
      const st = S.load(); if (!st.answers) st.answers = {}; st.answers[q.id] = ""; S.save(st); ta.value = "";
    }});
    line.appendChild(hint); line.appendChild(btnClearOne);

    card.appendChild(ta); card.appendChild(line);
    section.appendChild(card);

    // Apenas avançar / concluir
    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });
    const btnProx = el("button", { className: "btn btn-primary", text: i === qs.length - 1 ? "Concluir" : "Avançar", onclick: () => {
      const st = S.load(); if (!st.answers) st.answers = {}; st.answers[q.id] = ta.value;
      if (i === qs.length - 1) { st.step = "final"; }
      else { st.qIndex = i + 1; }
      S.save(st); render(st);
    }});

    actions.appendChild(btnProx);
    section.appendChild(actions);

    root.appendChild(section);

    setTimeout(() => { try { ta.focus(); } catch(_){} }, 50);
  }

  // FINAL (pergaminho-v) – SOMENTE botão PDF+HQ (sem "Voltar" e sem "Apagar")
  function renderFinal(state, root){
    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h2", { className: "title", text: "Conclusão da Jornada" }));

    const p = el("p", { className: "mt-2 lumen-typing" });
    section.appendChild(p);
    typewriter(p, "Respire novamente. Seu caminho foi registrado com coragem e verdade.");

    const answers = (state && state.answers) ? state.answers : {};
    const resumo = el("details", { className: "mt-4" }, [
      el("summary", { text: "Ver resumo das respostas" }),
      el("pre", { className: "mt-2 text-xs", text: JSON.stringify(answers, null, 2) })
    ]);
    section.appendChild(resumo);

    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });

    const btnBaixar = el("button", { className: "btn btn-primary", text: "Baixar PDF + HQ", onclick: async () => {
      try {
        const payload = buildPayload(state);
        showMsgTyped(section, "Gerando arquivos… aguarde.");

        await baixarArquivoFlex("jornada/pdf", { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/pdf" }, body: JSON.stringify(payload) }, "jornada.pdf");

        showMsgTyped(section, "PDF ok. Gerando HQ…");

        await baixarArquivoFlex("jornada/hq", { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/zip, application/octet-stream" }, body: JSON.stringify(payload) }, "jornada-hq.zip");

        showMsgTyped(section, "PDF e HQ finalizados! Redirecionando…");
        clearStateAndGoHome();
      } catch (e) { showMsg(section, "Falha ao gerar algum arquivo. Tente novamente."); }
    }});

    actions.appendChild(btnBaixar);
    section.appendChild(actions);

    root.appendChild(section);
  }

  function buildPayload(state){
    const ts = new Date().toISOString();
    return { meta: { ts, env: APP.ENV || "prod", storage_key: STORAGE_KEY, version: "1.4" }, answers: state?.answers || {} };
  }

  // ================================
  // Apagar respostas (TUDO) – atalho
  // ================================
  function apagarTudo(askConfirm = true){
    if (!askConfirm || confirm("Tem certeza que deseja apagar todas as respostas?")){
      S.clear(); const st = { auth: false, step: "intro", qIndex: 0, answers: {} }; S.save(st); render(st);
    }
  }

  // ================================
  // BOOT
  // ================================
  function onJornadaEssencial(){
    const st = S.load();
    if (st.auth !== true) { st.auth = false; st.step = "intro"; st.qIndex = 0; }
    S.save(st); render(st);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const isJornadaURL = /jornada/i.test(location.pathname);
    const hasRoot = !!(document.getElementById("jornada-root") || document.getElementById("jornadaApp"));
    if (isJornadaURL || hasRoot) onJornadaEssencial();
  });

  // Atalho: Shift+E apaga tudo
  document.addEventListener("keydown", (e) => {
    if ((e.key === "E" || e.key === "e") && e.shiftKey) { e.preventDefault(); apagarTudo(true); }
  });

})();
