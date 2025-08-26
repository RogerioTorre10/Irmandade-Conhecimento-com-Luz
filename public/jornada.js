/* ============================================================
   Jornada Essencial – Script Unificado (PASSO A PASSO)
   (Senha + Fallback API + Typewriter + PDF/HQ + 1 pergunta por tela)
   Versão: 1.3 (26-08-2025)
   Autor: Lumen (Irmandade Conhecimento com Luz)
   ============================================================ */

(function () {
  "use strict";

  // ================================
  // CONFIG CENTRAL (sem hardcode)
  // ================================
  const APP = (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};
  const API_BASE    = (APP.API_BASE || "").replace(/\/+$/, ""); // tenta com/sem /api
  const STORAGE_KEY = APP.STORAGE_KEY || "jornada_essencial_v1";
  const PASS        = (APP.PASS || "iniciar").toString();

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
    const speed = opts.speed ?? 32;
    const jitter = opts.jitter ?? 18;
    const delay = opts.initialDelay ?? 180;
    const onDone = opts.done;

    node.textContent = "";
    node.classList.add("lumen-typing");
    let i = 0;
    function tick() {
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
    if (!box) {
      box = el("div", { id: "status-msg", className: "mt-4 text-sm opacity-80", role: "status", "aria-live": "polite" });
      section.appendChild(box);
    }
    box.classList.remove("lumen-typing","typing-done");
    box.textContent = text;
  }
  function showMsgTyped(section, text) {
    let box = $("#status-msg", section);
    if (!box) {
      box = el("div", { id: "status-msg", className: "mt-4 text-sm opacity-80", role: "status", "aria-live": "polite" });
      section.appendChild(box);
    }
    typewriter(box, text, { speed: 26, jitter: 14, initialDelay: 60 });
  }

  // ================================
  // FETCH com fallback /api (tenta com e sem /api)
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
  // PERGUNTAS (fallback) – usa window.JORNADA_QUESTIONS se existir
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

  // SENHA (pergaminho-v)
  function renderSenha(state, root){
    let idx = 0; // evita "idx is not defined"
    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h1", { className: "title", text: "Acesso à Jornada" }));
    section.appendChild(el("p", { className: "mt-2", text: "Digite a senha para iniciar." }));

    const box = el("div", { className: "mt-4" });
    const inp = el("input", { type: "password", className: "q-input", placeholder: "Senha (ex.: iniciar)" });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
    const btn = el("button", { className: "btn btn-primary mt-3", text: "Entrar", onclick: () => {
      const val = (inp.value || "").trim();
      if (val.toLowerCase() === PASS.toLowerCase()) {
        const st = S.load(); st.auth = true; st.step = "intro"; st.qIndex = 0; S.save(st); render(st);
      } else { showMsg(section, "Senha inválida. Tente novamente."); }
    }});

    box.appendChild(inp); box.appendChild(btn); section.appendChild(box); root.appendChild(section);
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
    const btnApagar  = el("button", { className: "btn btn-secondary", text: "Apagar respostas", onclick: () => apagarTudo(true) });

    actions.appendChild(btnIniciar); actions.appendChild(btnApagar); section.appendChild(actions); root.appendChild(section);
  }

  function startPerguntas(){
    const st = S.load(); st.step = "perguntas"; st.qIndex = 0; if (!st.answers) st.answers = {}; S.save(st); render(st);
  }

  // PERGUNTAS – PASSO A PASSO (pergaminho-h)
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
    // Barra de progresso simples
    const progWrap = el("div", { className: "w-40 h-2 bg-white/60 rounded-full overflow-hidden" });
    const prog = el("div", { className: "h-2 bg-black", style: `width:${Math.round(((i+1)/qs.length)*100)}%` });
    progWrap.appendChild(prog); header.appendChild(progWrap); section.appendChild(header);

    // Enunciado + resposta
    const card = el("div", { className: "q-card mt-4" });
    card.appendChild(el("label", { className: "q-label", text: q.t }));

    const ta = el("textarea", { className: "q-input", rows: "4", placeholder: "Escreva aqui sua resposta..." });
    ta.value = state.answers[q.id] || "";
    ta.addEventListener("input", () => {
      const st = S.load(); if (!st.answers) st.answers = {}; st.answers[q.id] = ta.value; S.save(st);
    });

    card.appendChild(ta); section.appendChild(card);

    // Navegação
    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });
    const btnVoltar = el("button", { className: "btn", text: i === 0 ? "Voltar à introdução" : "Voltar", onclick: () => {
      const st = S.load();
      if (i === 0) { st.step = "intro"; }
      else { st.qIndex = i - 1; }
      S.save(st); render(st);
    }});

    const btnProx = el("button", { className: "btn btn-primary", text: i === qs.length - 1 ? "Concluir" : "Avançar", onclick: () => {
      const st = S.load(); if (!st.answers) st.answers = {}; st.answers[q.id] = ta.value;
      if (i === qs.length - 1) { st.step = "final"; }
      else { st.qIndex = i + 1; }
      S.save(st); render(st);
    }});

    const btnApagar = el("button", { className: "btn btn-secondary", text: "Apagar respostas", onclick: () => apagarTudo(false) });

    actions.appendChild(btnVoltar); actions.appendChild(btnProx); actions.appendChild(btnApagar);
    section.appendChild(actions);

    root.appendChild(section);

    // acessibilidade: focar textarea
    setTimeout(() => { try { ta.focus(); } catch(_){} }, 50);
  }

  // FINAL (pergaminho-v) – botão único PDF + HQ
  function renderFinal(state, root){
    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h2", { className: "title", text: "Conclusão da Jornada" }));
    section.appendChild(el("p", { className: "mt-2", text: "Respire novamente. Seu caminho foi registrado com coragem e verdade." }));

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

    const btnVoltarPerg = el("button", { className: "btn", text: "Voltar às perguntas", onclick: () => { const st = S.load(); st.step = "perguntas"; st.qIndex = Math.max(0, (st.qIndex||0)); S.save(st); render(st); } });
    const btnApagar     = el("button", { className: "btn btn-secondary", text: "Apagar respostas", onclick: () => apagarTudo(false) });

    actions.appendChild(btnBaixar); actions.appendChild(btnVoltarPerg); actions.appendChild(btnApagar);
    section.appendChild(actions);

    root.appendChild(section);
  }

  function buildPayload(state){
    const ts = new Date().toISOString();
    return { meta: { ts, env: APP.ENV || "prod", storage_key: STORAGE_KEY, version: "1.3" }, answers: state?.answers || {} };
  }

  // ================================
  // Apagar respostas (tudo)
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
