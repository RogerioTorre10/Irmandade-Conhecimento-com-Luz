/* ============================================================
   Jornada Essencial – Script Unificado
   Versão: 1.0 (26-08-2025)
   Autor: Lumen (Irmandade Conhecimento com Luz)
   ============================================================ */

(function () {
  "use strict";

  // ================================
  // CONFIG CENTRAL (sem hardcode)
  // ================================
  const APP = (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};
  const API_BASE    = APP.API_BASE    || "https://lumen-backend-api.onrender.com/api"; // ajuste se necessário
  const STORAGE_KEY = APP.STORAGE_KEY || "jornada_essencial_v1";

  // ================================
  // STATE (localStorage)
  // ================================
  const S = {};
  S.load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  };
  S.save = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
    } catch (_) {}
  };
  S.clear = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  };

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

  // Onde montar a jornada
  function getRoot() {
    return $("#jornada-root") || $("#jornadaApp") || $("main") || document.body;
  }

  // Mensagem de status (Final)
  function showMsg(section, text) {
    let box = $("#status-msg", section);
    if (!box) {
      box = el("div", { id: "status-msg", className: "mt-4 text-sm opacity-80" });
      section.appendChild(box);
    }
    box.textContent = text;
  }

  async function baixarArquivo(url, fetchInit, filename) {
    const res = await fetch(url, fetchInit);
    if (!res.ok) throw new Error(`download_fail_${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function clearStateAndGoHome() {
    S.clear();
    setTimeout(() => { window.location.href = "/index.html"; }, 1200);
  }

  // ================================
  // PERGUNTAS (fallback)
  // Usa window.JORNADA_QUESTIONS se presente
  // ================================
  const FALLBACK_QUESTIONS = [
    { id: "q1", t: "Quem é você hoje e o que deseja transformar?", kind: "text" },
    { id: "q2", t: "Qual lembrança te acende fé quando tudo parece difícil?", kind: "text" },
    { id: "q3", t: "Em uma palavra, qual é sua missão?", kind: "text" },
    { id: "q4", t: "Quais hábitos deseja fortalecer nos próximos 30 dias?", kind: "text" },
    { id: "q5", t: "De 0 a 10, qual seu nível de esperança? Por quê?", kind: "text" }
  ];
  function getQuestions() {
    if (Array.isArray(window.JORNADA_QUESTIONS) && window.JORNADA_QUESTIONS.length) {
      // Normaliza para o formato {id, t, kind}
      return window.JORNADA_QUESTIONS.map((q, i) => {
        if (typeof q === "string") return { id: `q${i+1}`, t: q, kind: "text" };
        return {
          id: q.id || `q${i+1}`,
          t: q.t || q.text || q.pergunta || `Pergunta ${i+1}`,
          kind: q.kind || "text"
        };
      });
    }
    return FALLBACK_QUESTIONS;
  }

  // ================================
  // RENDER – Fluxo
  // ================================
  function render(state) {
    const root = getRoot();
    if (!root) return;
    clear(root);

    const step = state?.step || "intro";
    if (step === "intro") return renderIntro(state, root);
    if (step === "perguntas") return renderPerguntas(state, root);
    if (step === "final") return renderFinal(state, root);
  }

  // INTRO (pergaminho vertical)
  function renderIntro(state, root) {
    // fixa o bug "idx is not defined"
    let idx = 0;

    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h1", { className: "title", text: "Jornada Conhecimento com Luz – Essencial" }));
    section.appendChild(el("p", { className: "mt-2", text: "Bem-vindo! Respire fundo. Esta é a sua travessia interior guiada pela Luz." }));

    // Ações
    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });

    const btnIniciar = el("button", {
      className: "btn btn-primary",
      text: "Iniciar",
      onclick: () => startPerguntas()
    });

    const btnApagar = el("button", {
      className: "btn btn-secondary",
      text: "Apagar respostas",
      onclick: () => apagarTudo(true)
    });

    actions.appendChild(btnIniciar);
    actions.appendChild(btnApagar);
    section.appendChild(actions);

    root.appendChild(section);
  }

  function startPerguntas() {
    const st = S.load();
    st.step = "perguntas";
    if (!st.answers) st.answers = {};
    S.save(st);
    render(st);
  }

  // PERGUNTAS (pergaminho horizontal)
  function renderPerguntas(state, root) {
    const qs = getQuestions();
    if (!state.answers) state.answers = {};

    const section = el("section", { className: "card pergaminho pergaminho-h" });
    section.appendChild(el("h2", { className: "title", text: "Reflexões – Responda com calma" }));

    const list = el("div", { className: "mt-4 grid gap-4" });

    qs.forEach((q, i) => {
      const card = el("div", { className: "q-card" });
      card.appendChild(el("label", { className: "q-label", text: `${i + 1}. ${q.t}` }));

      const ta = el("textarea", {
        className: "q-input",
        rows: "3",
        placeholder: "Escreva aqui sua resposta..."
      });
      ta.value = state.answers[q.id] || "";
      ta.addEventListener("input", () => {
        const st = S.load();
        if (!st.answers) st.answers = {};
        st.answers[q.id] = ta.value;
        S.save(st);
      });

      card.appendChild(ta);
      list.appendChild(card);
    });

    section.appendChild(list);

    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });
    const btnVoltarIntro = el("button", {
      className: "btn",
      text: "Voltar à introdução",
      onclick: () => {
        const st = S.load();
        st.step = "intro";
        S.save(st);
        render(st);
      }
    });
    const btnFinalizar = el("button", {
      className: "btn btn-primary",
      text: "Finalizar e continuar",
      onclick: () => {
        const st = S.load();
        st.step = "final";
        S.save(st);
        render(st);
      }
    });
    const btnApagar = el("button", {
      className: "btn btn-secondary",
      text: "Apagar respostas",
      onclick: () => apagarTudo(false)
    });

    actions.appendChild(btnVoltarIntro);
    actions.appendChild(btnFinalizar);
    actions.appendChild(btnApagar);
    section.appendChild(actions);

    root.appendChild(section);
  }

  // FINAL (pergaminho vertical) – botão único PDF + HQ
  function renderFinal(state, root) {
    const section = el("section", { className: "card pergaminho pergaminho-v" });
    section.appendChild(el("h2", { className: "title", text: "Conclusão da Jornada" }));
    section.appendChild(el("p", { className: "mt-2", text: "Respire novamente. Seu caminho foi registrado com coragem e verdade." }));

    // Resumo simples (opcional)
    const answers = (state && state.answers) ? state.answers : {};
    const resumo = el("details", { className: "mt-4" }, [
      el("summary", { text: "Ver resumo das respostas" }),
      el("pre", { className: "mt-2 text-xs", text: JSON.stringify(answers, null, 2) })
    ]);
    section.appendChild(resumo);

    const actions = el("div", { className: "mt-6 flex gap-3 flex-wrap" });

    const btnBaixar = el("button", {
      className: "btn btn-primary",
      text: "Baixar PDF + HQ",
      onclick: async () => {
        try {
          const payload = buildPayload(state);

          showMsg(section, "Gerando arquivos… aguarde.");
          await baixarArquivo(
            `${API_BASE}/jornada/pdf`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/pdf" },
              body: JSON.stringify(payload)
            },
            "jornada.pdf"
          );

          showMsg(section, "PDF ok. Gerando HQ…");
          await baixarArquivo(
            `${API_BASE}/jornada/hq`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/zip, application/octet-stream" },
              body: JSON.stringify(payload)
            },
            "jornada-hq.zip"
          );

          showMsg(section, "PDF e HQ finalizados! Redirecionando…");
          clearStateAndGoHome();
        } catch (e) {
          showMsg(section, "Falha ao gerar algum arquivo. Tente novamente.");
        }
      }
    });

    const btnVoltarPerg = el("button", {
      className: "btn",
      text: "Voltar às perguntas",
      onclick: () => {
        const st = S.load();
        st.step = "perguntas";
        S.save(st);
        render(st);
      }
    });

    const btnApagar = el("button", {
      className: "btn btn-secondary",
      text: "Apagar respostas",
      onclick: () => apagarTudo(false)
    });

    actions.appendChild(btnBaixar);
    actions.appendChild(btnVoltarPerg);
    actions.appendChild(btnApagar);
    section.appendChild(actions);

    root.appendChild(section);
  }

  function buildPayload(state) {
    const ts = new Date().toISOString();
    return {
      meta: {
        ts,
        env: APP.ENV || "prod",
        storage_key: STORAGE_KEY,
        version: "1.0"
      },
      answers: state?.answers || {},
      // Campos extras caso backend precise:
      // user: {...}, device: {...}
    };
  }

  // ================================
  // Apagar respostas (tudo)
  // ================================
  function apagarTudo(askConfirm = true) {
    if (!askConfirm || confirm("Tem certeza que deseja apagar todas as respostas?")) {
      S.clear();
      const st = { step: "intro", answers: {} };
      S.save(st);
      render(st);
    }
  }

  // ================================
  // BOOT
  // Só inicia nas páginas de jornada:
  // - se URL contém "jornada"
  // - ou se existir um container #jornada-root / #jornadaApp
  // ================================
  function onJornadaEssencial() {
    const st = S.load();
    st.step = st.step || "intro"; // força começar na intro
    S.save(st);
    render(st);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const isJornadaURL = /jornada/i.test(location.pathname);
    const hasRoot = !!(document.getElementById("jornada-root") || document.getElementById("jornadaApp"));
    if (isJornadaURL || hasRoot) {
      onJornadaEssencial();
    }
  });

  // Atalho opcional: Shift+E apaga tudo
  document.addEventListener("keydown", (e) => {
    if ((e.key === "E" || e.key === "e") && e.shiftKey) {
      e.preventDefault();
      apagarTudo(true);
    }
  });

})();
