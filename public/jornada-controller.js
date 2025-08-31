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

    // --- Overlay de vídeo para transições ---
  function ensureVideoOverlay() {
    if (document.getElementById("jr-video-ovl")) return;
    const wrap = document.createElement("div");
    wrap.id = "jr-video-ovl";
    wrap.style.cssText = `
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.85); z-index:9999; padding:0;
    `;
    wrap.innerHTML = `
      <video id="jr-video" playsinline webkit-playsinline controls style="max-width:92vw;max-height:86vh;outline:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.5)"></video>
    `;
    document.body.appendChild(wrap);
  }

  function playVideoOverlay(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(); // sem vídeo → segue
      ensureVideoOverlay();
      const ovl = document.getElementById("jr-video-ovl");
      const vid = document.getElementById("jr-video");
      vid.src = src;
      ovl.style.display = "flex";
      const done = () => {
        vid.pause(); vid.removeAttribute("src"); vid.load();
        ovl.style.display = "none";
        vid.removeEventListener("ended", done);
        vid.removeEventListener("error", done);
        resolve();
      };
      vid.addEventListener("ended", done);
      vid.addEventListener("error", done);
      // auto-play (mobile pode exigir interação prévia; temos o clique do botão)
      vid.play().catch(() => { /* se não tocar, o usuário pode dar play manual */ });
    });
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
    const blocks = Array.isArray(window.JORNADA_BLOCKS) ? window.JORNADA_BLOCKS : null;
    const total = blocks ? blocks.length : 1;
    el.innerHTML = `
      <section class="card pergaminho pergaminho-v">
        <h1 class="title">Irmandade Conhecimento com Luz</h1>
        <p class="muted">Bem-vindo(a) à <strong>Jornada Essencial</strong> em <strong>${total}</strong> blocos. Assista às transições e siga o fluxo com serenidade. </p>
        <div style="margin-top:16px">
          <button id="jr_go" class="btn">Começar</button>
          <button id="jr_home" class="btn" style="background:#6b7280">Página inicial</button>
        </div>
      </section>
    `;
    const go = document.getElementById("jr_go");
    const home = document.getElementById("jr_home");
    if (go) go.onclick = () => renderPerguntas(0);  // começa no bloco 0
    if (home) home.onclick = () => location.assign("/");
  }


  // --- Render: Perguntas + navegação final ---
   function renderPerguntas(blockIndex = 0) {
    const blocks = Array.isArray(window.JORNADA_BLOCKS) ? window.JORNADA_BLOCKS : null;

    // Se não houver blocos, cai no modo antigo (JORNADA_QA completo)
    if (!blocks) {
      return renderPerguntasFlat();
    }

    const b = blocks[blockIndex];
    const total = blocks.length;
    const state = S.load();
    state.blockIndex = blockIndex;
    S.save(state);

    const el = root();
    const fields = (b.questions || []).map(q => {
      const v = (state.answers && state.answers[q.id]) || "";
      if (q.type === "textarea") {
        return `
          <div style="margin:14px 0">
            <label>${q.label}</label>
            <textarea data-qid="${q.id}" rows="3" style="width:100%;margin-top:6px">${v}</textarea>
          </div>
        `;
      }
      return `
        <div style="margin:14px 0">
          <label>${q.label}</label>
          <input data-qid="${q.id}" type="text" value="${String(v)}" style="width:100%;margin-top:6px"/>
        </div>
      `;
    }).join("");

    el.innerHTML = `
      <section class="card pergaminho pergaminho-h">
        <div class="muted" style="margin-bottom:8px">Bloco ${blockIndex + 1} / ${total} — <strong>${b.title}</strong></div>
        ${fields}
        <div style="margin-top:16px">
          <button id="jr_save" class="btn">Salvar respostas</button>
          ${blockIndex > 0 ? `<button id="jr_prev" class="btn" style="background:#6b7280">Bloco anterior</button>` : ``}
          ${blockIndex < total - 1
            ? `<button id="jr_next" class="btn">Próximo bloco</button>`
            : `<button id="jr_final" class="btn">Finalizar e Gerar</button>`
          }
        </div>
      </section>
    `;

    const $ = (sel, scope = el) => Array.from(scope.querySelectorAll(sel));
    const collect = () => {
      const answers = Object.assign({}, state.answers || {});
      $('[data-qid]').forEach(n => { answers[n.getAttribute('data-qid')] = n.value || ""; });
      return answers;
    };

    const btnSave = document.getElementById("jr_save");
    if (btnSave) btnSave.onclick = () => {
      const answers = collect();
      S.save({ ...S.load(), answers, ts: Date.now(), blockIndex });
      alert("Respostas salvas (local).");
    };

    const btnPrev = document.getElementById("jr_prev");
    if (btnPrev) btnPrev.onclick = () => {
      const answers = collect();
      S.save({ ...S.load(), answers, ts: Date.now(), blockIndex: blockIndex - 1 });
      renderPerguntas(blockIndex - 1);
    };

    const btnNext = document.getElementById("jr_next");
    if (btnNext) btnNext.onclick = async () => {
      const answers = collect();
      S.save({ ...S.load(), answers, ts: Date.now(), blockIndex: blockIndex + 1 });
      // toca vídeo de transição deste bloco (se houver) e avança
      await playVideoOverlay(b.video_after || "");
      renderPerguntas(blockIndex + 1);
    };

    const btnFinal = document.getElementById("jr_final");
    if (btnFinal) btnFinal.onclick = async () => {
      const answers = collect();
      S.save({ ...S.load(), answers, ts: Date.now(), blockIndex });
      // vídeo final (opcional) antes de gerar PDF/HQ
      if (window.JORNADA_FINAL_VIDEO) {
        await playVideoOverlay(window.JORNADA_FINAL_VIDEO);
      }
      await gerarDevolutivas(answers);
    };
  }

  // modo antigo (sem blocos): usa window.JORNADA_QA completo
  function renderPerguntasFlat() {
    const qas = Array.isArray(window.JORNADA_QA) ? window.JORNADA_QA : [];
    const state = S.load();
    const el = root();
    const fields = qas.map(q => {
      const val = (state.answers && state.answers[q.id]) || "";
      return `
        <div style="margin:14px 0">
          <label>${q.label}</label>
          <textarea data-qid="${q.id}" rows="3" style="width:100%;margin-top:6px">${val}</textarea>
        </div>`;
    }).join("");

    el.innerHTML = `
      <section class="card pergaminho pergaminho-h">
        <h2 class="title">Perguntas — Essencial</h2>
        ${fields}
        <div style="margin-top:16px">
          <button id="jr_final" class="btn">Finalizar e Gerar</button>
        </div>
      </section>
    `;
    const btnFinal = document.getElementById("jr_final");
    if (btnFinal) btnFinal.onclick = async () => {
      const answers = {};
      el.querySelectorAll('[data-qid]').forEach(n => answers[n.getAttribute('data-qid')] = n.value || "");
      S.save({ answers, ts: Date.now() });
      if (window.JORNADA_FINAL_VIDEO) await playVideoOverlay(window.JORNADA_FINAL_VIDEO);
      await gerarDevolutivas(answers);
    };
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
