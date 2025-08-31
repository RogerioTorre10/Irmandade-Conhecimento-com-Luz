// /public/jornada-controller.js — Orquestrador da Jornada (v1.0)
// Liga: UI (intro/perguntas) + Estado + API (PDF/HQ) + mensagens
// Depende de: window.APP_CONFIG, window.JORNADA_CFG, (opcional) window.JORNADA_QA

(function () {
  const g = window;

  // --- Config & Endpoints ---
  const CFG = g.APP_CONFIG || {};
  const LEG = g.JORNADA_CFG || {};
  const STORAGE_KEY = LEG.STORAGE_KEY || "jornada_essencial_v1";
  const API_BASE = (CFG.API_BASE || "").replace(/\/+$/, ""); // .../api
  const PATH = (g.JORNADA_ENDPOINT_PATH || "/jornada").replace(/\/+$/, ""); // /jornada
  const EP_PDF = `${API_BASE}${PATH}/pdf`;
  const EP_HQ  = `${API_BASE}${PATH}/hq`;

  // --- Estado local (localStorage) ---
  const S = {
    load() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
      catch (_) { return {}; }
    },
    save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {})); },
    clear() { localStorage.removeItem(STORAGE_KEY); }
  };

  // --- Util: raiz de renderização ---
  function root() {
    return document.getElementById("app") || document.querySelector("main") || document.body;
  }

  // --- Util: download de Blob ---
  async function downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename || "arquivo.bin";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }

  // --- Util: fetch com PDF/HQ ---
  async function postJSONForBlob(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/pdf"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} – ${txt || "falha ao gerar arquivo"}`);
    }
    return await res.blob();
  }

  // --- Perguntas (fonte) ---
  // Preferência: window.JORNADA_QA (seus módulos reais). Fallback: perguntas demo.
  function getQuestions() {
    if (Array.isArray(g.JORNADA_QA) && g.JORNADA_QA.length) return g.JORNADA_QA;
    // Fallback simples (2 questões)
    return [
      { id: "q1", label: "O que move o seu coração hoje?", type: "textarea" },
      { id: "q2", label: "Qual é a missão que você sente no fundo da alma?", type: "textarea" },
    ];
  }

  // --- Render: Intro ---
  function renderIntro() {
    const el = root();
    el.innerHTML = `
      <section class="card pergaminho pergaminho-v">
        <h1 class="title">Irmandade Conhecimento com Luz</h1>
        <p class="muted">Bem-vindo(a) à <strong>Jornada Essencial</strong> — responda com sinceridade e ao final gere sua devolutiva (PDF) e a HQ com 33 quadros.</p>
        <div style="margin-top:16px">
          <button id="jr_go" class="btn">Avançar</button>
          <button id="jr_home" class="btn" style="background:#6b7280">Página inicial</button>
        </div>
      </section>
    `;
    const go = document.getElementById("jr_go");
    const home = document.getElementById("jr_home");
    if (go) go.onclick = renderPerguntas;
    if (home) home.onclick = () => location.assign("/");
  }

  // --- Render: Perguntas + navegação final ---
  function renderPerguntas() {
    const qas = getQuestions();
    const state = S.load();
    const el = root();

    const fields = qas.map(q => {
      const val = (state.answers && state.answers[q.id]) || "";
      if (q.type === "textarea") {
        return `
          <div style="margin:14px 0">
            <label>${q.label}</label>
            <textarea data-qid="${q.id}" rows="3" style="width:100%;margin-top:6px">${val}</textarea>
          </div>
        `;
      }
      return `
        <div style="margin:14px 0">
          <label>${q.label}</label>
          <input data-qid="${q.id}" type="text" value="${String(val)}" style="width:100%;margin-top:6px"/>
        </div>
      `;
    }).join("");

    el.innerHTML = `
      <section class="card pergaminho pergaminho-h">
        <h2 class="title">Perguntas — Bloco Essencial</h2>
        ${fields}
        <div style="margin-top:16px">
          <button id="jr_save" class="btn">Salvar respostas</button>
          <button id="jr_final" class="btn">Finalizar e Gerar</button>
          <button id="jr_back" class="btn" style="background:#6b7280">Voltar</button>
        </div>
        <p class="muted" style="margin-top:10px">Suas respostas ficam salvas localmente enquanto estiver nesta jornada.</p>
      </section>
    `;

    // handlers
    const $ = (sel) => Array.from(el.querySelectorAll(sel));
    function collect() {
      const answers = {};
      $('[data-qid]').forEach(n => { answers[n.getAttribute('data-qid')] = n.value || ""; });
      return answers;
    }

    const btnSave = document.getElementById("jr_save");
    const btnFinal = document.getElementById("jr_final");
    const btnBack = document.getElementById("jr_back");

    if (btnSave) btnSave.onclick = () => {
      const answers = collect();
      S.save({ answers, ts: Date.now() });
      alert("Respostas salvas (local).");
    };

    if (btnFinal) btnFinal.onclick = async () => {
      const answers = collect();
      S.save({ answers, ts: Date.now() });
      await gerarDevolutivas(answers);
    };

    if (btnBack) btnBack.onclick = renderIntro;
  }

  // --- Fluxo final: gerar PDF e HQ em paralelo, avisar e voltar ao início ---
  async function gerarDevolutivas(answers) {
    const payload = {
      pass: (CFG.PASS || LEG.PASS || "iniciar"),
      storage_key: STORAGE_KEY,
      answers,
      meta: {
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        ua: navigator.userAgent,
        stamp: new Date().toISOString()
      }
    };

    try {
      // roda em paralelo (cada um pode falhar independente)
      const tasks = [
        postJSONForBlob(EP_PDF, payload).then(b => downloadBlob(b, "Jornada-Com-Luz.pdf")),
        postJSONForBlob(EP_HQ,  payload).then(b => downloadBlob(b, "Jornada-Com-Luz-HQ.pdf")),
      ];

      alert("Gerando PDF e HQ... aguarde os downloads iniciarem.");
      await Promise.allSettled(tasks);

      // pós-gera: limpar e voltar ao início
      S.clear();
      alert("PDF e HQ finalizados. Voltando para a página inicial.");
      location.assign("/");
    } catch (err) {
      console.error("[Jornada] erro ao gerar devolutivas:", err);
      alert("Falha ao gerar PDF/HQ: " + (err && err.message ? err.message : err));
    }
  }

  // --- API pública do controlador ---
  g.JornadaCtrl = {
    start() { renderIntro(); },
    renderIntro,
    renderPerguntas,
    gerarDevolutivas,
    _endpoints: { EP_PDF, EP_HQ }
  };

  console.log("[JornadaCtrl] pronto.", g.JornadaCtrl._endpoints);
})();
