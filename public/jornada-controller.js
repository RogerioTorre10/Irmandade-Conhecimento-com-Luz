// /public/jornada-controller.js — Orquestrador da Jornada (v1.2)
// Liga: UI (intro/perguntas) + Estado + API (PDF/HQ) + transições em vídeo
// Usa blocos se window.JORNADA_BLOCKS existir; senão, cai em window.JORNADA_QA.
// Depende de: window.APP_CONFIG, window.JORNADA_CFG, (opcional) window.JORNADA_BLOCKS/JORNADA_QA.

(function () {
  const g = window;

  // --------- CONFIG & ENDPOINTS ----------
  const CFG = g.APP_CONFIG || {};
  const LEG = g.JORNADA_CFG || {};
  const STORAGE_KEY = LEG.STORAGE_KEY || "jornada_essencial_v1";
  const API_BASE = String(CFG.API_BASE || "").replace(/\/+$/, "");       // .../api
  const PATH = String(g.JORNADA_ENDPOINT_PATH || "/jornada").replace(/\/+$/, "");
  const EP_PDF = `${API_BASE}${PATH}/pdf`;
  const EP_HQ  = `${API_BASE}${PATH}/hq`;
  const PASS   = CFG.PASS || LEG.PASS || "iniciar";

  // --------- ESTADO (localStorage) ----------
  const S = {
    load() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
      catch (_) { return {}; }
    },
    save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {})); },
    clear() { localStorage.removeItem(STORAGE_KEY); }
  };

  // --------- UTILS ----------
  function root() {
    return document.getElementById("app") || document.querySelector("main") || document.body;
  }

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
      throw new Error(`HTTP ${res.status} — ${txt || "falha ao gerar arquivo"}`);
    }
    return await res.blob();
  }

  // --------- OVERLAY DE VÍDEO (TRANSIÇÕES) ----------
  function ensureVideoOverlay() {
    if (document.getElementById("jr-video-ovl")) return;
    const wrap = document.createElement("div");
    wrap.id = "jr-video-ovl";
    wrap.style.cssText = `
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.88); z-index:9999; padding:0;
    `;
    wrap.innerHTML = `
      <video id="jr-video" playsinline webkit-playsinline controls
             style="max-width:92vw;max-height:86vh;outline:none;border-radius:12px;
                    box-shadow:0 10px 40px rgba(0,0,0,.5)"></video>
    `;
    document.body.appendChild(wrap);
  }

  function playVideoOverlay(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(); // sem vídeo
      ensureVideoOverlay();
      const ovl = document.getElementById("jr-video-ovl");
      const vid = document.getElementById("jr-video");
      vid.src = src;
      ovl.style.display = "flex";
      const done = () => {
        try { vid.pause(); } catch(_) {}
        vid.removeAttribute("src"); vid.load();
        ovl.style.display = "none";
        vid.removeEventListener("ended", done);
        vid.removeEventListener("error", done);
        resolve();
      };
      vid.addEventListener("ended", done);
      vid.addEventListener("error", done);
      vid.play().catch(() => { /* user interaction may be required in alguns devices */ });
    });
  }

  // --------- PERGUNTAS / BLOCOS ----------
  function hasBlocks() {
    return Array.isArray(g.JORNADA_BLOCKS) && g.JORNADA_BLOCKS.length > 0;
  }

  function getQAFlat() {
    return Array.isArray(g.JORNADA_QA) ? g.JORNADA_QA : [];
  }

  // --------- RENDER: INTRO ----------
  function renderIntro() {
    const el = root();
    const blocks = hasBlocks() ? g.JORNADA_BLOCKS : null;
    const total = blocks ? blocks.length : 1;

    el.innerHTML = `
      <section class="card pergaminho pergaminho-v">
        <h1 class="title">Irmandade Conhecimento com Luz</h1>
        <p class="muted">
          Bem-vindo(a) à <strong>Jornada Essencial</strong>${blocks ? ` em <strong>${total}</strong> blocos` : ""}.
          Responda com sinceridade. Ao final, você poderá baixar sua <strong>Devolutiva (PDF)</strong> e a <strong>HQ (33 quadros)</strong>.
        </p>
        <div style="margin-top:16px">
          <button id="jr_go" class="btn">Começar</button>
          <button id="jr_home" class="btn" style="background:#6b7280">Página inicial</button>
        </div>
      </section>
    `;
    const go = document.getElementById("jr_go");
    const home = document.getElementById("jr_home");
    if (go) go.onclick = () => {
      if (hasBlocks()) renderPerguntas(0);
      else renderPerguntasFlat();
    };
    if (home) home.onclick = () => location.assign("/");
  }

  // --------- RENDER: PERGUNTAS (POR BLOCO) ----------
  function renderPerguntas(blockIndex = 0) {
    if (!hasBlocks()) return renderPerguntasFlat();

    const blocks = g.JORNADA_BLOCKS;
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
        <div class="muted" style="margin-bottom:8px">
          Bloco ${blockIndex + 1} / ${total} — <strong>${b.title}</strong>
        </div>
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
      const answers = Object.assign({}, (S.load().answers || {}));
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
      await playVideoOverlay(b.video_after || "");
      renderPerguntas(blockIndex + 1);
    };

    const btnFinal = document.getElementById("jr_final");
    if (btnFinal) btnFinal.onclick = async () => {
      const answers = collect();
      S.save({ ...S.load(), answers, ts: Date.now(), blockIndex });
      if (g.JORNADA_FINAL_VIDEO) await playVideoOverlay(g.JORNADA_FINAL_VIDEO);
      await gerarDevolutivas(answers);
    };
  }

  // --------- RENDER: PERGUNTAS (PLANO ÚNICO / LEGADO) ----------
  function renderPerguntasFlat() {
    const qas = getQAFlat();
    const state = S.load();
    const el = root();

    const fields = qas.map(q => {
      const val = (state.answers && state.answers[q.id]) || "";
      const isText = (q.type || "textarea") === "textarea";
      return isText
        ? `<div style="margin:14px 0"><label>${q.label}</label><textarea data-qid="${q.id}" rows="3" style="width:100%;margin-top:6px">${val}</textarea></div>`
        : `<div style="margin:14px 0"><label>${q.label}</label><input data-qid="${q.id}" type="text" value="${String(val)}" style="width:100%;margin-top:6px"/></div>`;
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
      if (g.JORNADA_FINAL_VIDEO) await playVideoOverlay(g.JORNADA_FINAL_VIDEO);
      await gerarDevolutivas(answers);
    };
  }

  // --------- FINALIZAÇÃO: GERA PDF + HQ ----------
  async function gerarDevolutivas(answers) {
    const payload = {
      pass: PASS,
      storage_key: STORAGE_KEY,
      answers,
      meta: {
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        ua: navigator.userAgent,
        stamp: new Date().toISOString()
      }
    };

    try {
      alert("Gerando PDF e HQ... aguarde os downloads iniciarem.");
      const tasks = [
        postJSONForBlob(EP_PDF, payload).then(b => downloadBlob(b, "Jornada-Com-Luz.pdf")),
        postJSONForBlob(EP_HQ,  payload).then(b => downloadBlob(b, "Jornada-Com-Luz-HQ.pdf")),
      ];
      await Promise.allSettled(tasks);
      S.clear();
      alert("PDF e HQ finalizados. Voltando para a página inicial.");
      location.assign("/");
    } catch (err) {
      console.error("[Jornada] erro ao gerar devolutivas:", err);
      alert("Falha ao gerar PDF/HQ: " + (err && err.message ? err.message : err));
    }
  }

  // --------- API PÚBLICA ----------
  g.JornadaCtrl = {
    start: renderIntro,
    renderIntro,
    renderPerguntas,     // por bloco
    renderPerguntasFlat, // plano único
    gerarDevolutivas,
    _endpoints: { EP_PDF, EP_HQ, PATH, API_BASE }
  };

  console.log("[JornadaCtrl] pronto.", g.JornadaCtrl._endpoints);
})();
