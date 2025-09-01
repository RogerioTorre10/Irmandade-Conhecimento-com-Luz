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
  // --------- TYPING (usa módulo se houver; senão, fallback) ----------
  const ENABLE_TYPIST = true;        // <-- liga/desliga rápido
  const DEFAULT_SPEED = 22;          // caracteres/step
  const CARET_HTML = '<span class="jr-caret">|</span>';

  // hook para módulo externo (seu jornada-typing.js)
  function externalType(el, text, speed) {
    // exemplos de APIs comuns — use o que existir:
    if (window.JornadaTyping?.type) return window.JornadaTyping.type(el, text, speed);
    if (window.JR_TYPE?.type)      return window.JR_TYPE.type(el, text, speed);
    return null; // sem módulo → deixa o fallback assumir
  }

  function typeText(el, text, speed = DEFAULT_SPEED) {
    if (!ENABLE_TYPIST || !el) { el && (el.innerHTML = text); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.innerHTML = text; return;
    }
    // tenta módulo externo
    const used = externalType(el, text, speed);
    if (used) return;

    // fallback minimalista
    el.innerHTML = ""; 
    const caret = document.createElement("span");
    caret.className = "jr-caret";
    caret.textContent = "|";
    el.appendChild(caret);

    let i = 0;
    function tick() {
      const next = text.slice(0, i++);
      el.childNodes[0] && el.childNodes[0].nodeType === 3
        ? (el.childNodes[0].textContent = next)
        : el.insertBefore(document.createTextNode(next), caret);
      if (i <= text.length) requestAnimationFrame(tick);
      else caret.remove();
    }
    // inicia com nó de texto vazio antes do caret
    el.insertBefore(document.createTextNode(""), caret);
    requestAnimationFrame(tick);
  }

  // estilinho do cursor (opcional)
  (function ensureTypingCSS(){
    if (document.getElementById("jr-typing-css")) return;
    const s = document.createElement("style"); s.id = "jr-typing-css";
    s.textContent = `
      .jr-caret{display:inline-block;margin-left:2px;animation:jrblink 1s steps(2,end) infinite}
      @keyframes jrblink{0%{opacity:1}50%{opacity:0}100%{opacity:1}}
    `;
    document.head.appendChild(s);
  })(); 

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

  // --------- RENDER: INTRO (com datilografia) ----------
function renderIntro() {
  const el = root();
  const blocks = hasBlocks() ? window.JORNADA_BLOCKS : null;
  const total  = blocks ? blocks.length : 1;

  el.innerHTML = `
    <section class="card pergaminho pergaminho-v">
      <h1 class="title">Irmandade Conhecimento com Luz</h1>
      <p id="jr_intro_text" class="muted"></p>
      <div style="margin-top:16px">
        <button id="jr_go" class="btn">Começar</button>
        <button id="jr_home" class="btn" style="background:#6b7280">Página inicial</button>
      </div>
    </section>
  `;

  // texto que será datilografado
  const introTxt =
    `Bem-vindo(a) à Jornada Essencial${blocks ? ` em ${total} blocos` : ""}. ` +
    `Siga com serenidade. Ao final, você poderá baixar sua Devolutiva (PDF) ` +
    `e a HQ com 33 quadros.`;

  // dispara a datilografia (usa módulo externo se existir; senão, fallback interno)
  const p = document.getElementById("jr_intro_text");
  typeText(p, introTxt);

  // ações
  const go   = document.getElementById("jr_go");
  const home = document.getElementById("jr_home");
  if (go)   go.onclick   = () => { blocks ? renderPerguntas(0) : renderPerguntasFlat(); };
  if (home) home.onclick = () => location.assign("/");
}

    // --------- RENDER: PERGUNTAS (POR BLOCO) ---------
function renderPerguntas(blockIndex = 0) {
  // se não houver blocos definidos, usa o fluxo flat
  if (!hasBlocks()) return renderPerguntasFlat();

  const blocks = window.JORNADA_BLOCKS;
  const b = blocks[blockIndex];
  const total = blocks.length;

  // estado
  const state = S.load();
  state.blockIndex = blockIndex;
  S.save(state);

  const el = root();

  // campos do bloco
  const fields = (b.questions || []).map(q => {
    const v = (state.answers && state.answers[q.id]) || "";
    if ((q.type || "textarea") === "textarea") {
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

  // UI do bloco (título com alvo para datilografia)
  el.innerHTML = `
    <section class="card pergaminho pergaminho-h">
      <div class="muted" style="margin-bottom:8px">
        Bloco ${blockIndex + 1} / ${total} — <strong id="jr_block_title"></strong>
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

  // datilografar o título
  typeText(document.getElementById("jr_block_title"), b.title);

  // helpers locais
  const $ = (sel, scope = el) => Array.from(scope.querySelectorAll(sel));
  const collect = () => {
    const answers = Object.assign({}, (S.load().answers || {}));
    $('[data-qid]').forEach(n => { answers[n.getAttribute('data-qid')] = n.value || ""; });
    return answers;
  };

  // ações
  const btnSave  = document.getElementById("jr_save");
  const btnPrev  = document.getElementById("jr_prev");
  const btnNext  = document.getElementById("jr_next");
  const btnFinal = document.getElementById("jr_final");

  if (btnSave) btnSave.onclick = () => {
    const answers = collect();
    S.save({ ...S.load(), answers, ts: Date.now(), blockIndex });
    alert("Respostas salvas (local).");
  };

  if (btnPrev) btnPrev.onclick = () => {
    const answers = collect();
    S.save({ ...S.load(), answers, ts: Date.now(), blockIndex: blockIndex - 1 });
    renderPerguntas(blockIndex - 1);
  };

  if (btnNext) btnNext.onclick = async () => {
    const answers = collect();
    S.save({ ...S.load(), answers, ts: Date.now(), blockIndex: blockIndex + 1 });
    // toca vídeo de transição deste bloco (se houver)
    await playVideoOverlay(b.video_after || "");
    renderPerguntas(blockIndex + 1);
  };

  if (btnFinal) btnFinal.onclick = async () => {
    const answers = collect();
    S.save({ ...S.load(), answers, ts: Date.now(), blockIndex });
    // vídeo final opcional antes de gerar PDF/HQ
    if (window.JORNADA_FINAL_VIDEO) {
      await playVideoOverlay(window.JORNADA_FINAL_VIDEO);
    }
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
  const answers = collect();
  S.save({ ...S.load(), answers, ts: Date.now(), blockIndex });
  await renderAcolhimentoFinal(answers);
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
      // --------- RENDER: ACOLHIMENTO FINAL (desktop vs mobile) ----------
async function renderAcolhimentoFinal(answers, opts = {}) {
  const el = root();

  // Detecta telas pequenas (ajuste o breakpoint se quiser)
  const isMobile =
    window.innerWidth <= 480 ||
    window.matchMedia?.("(max-width: 480px)")?.matches;

  // Mensagens
  const longMsg =
    "Parabéns por concluir sua Jornada! 🌟\n" +
    "Cada resposta é uma chama viva no caminho da Luz.\n" +
    "Respire fundo, receba este acolhimento...\n" +
    "e prepare-se para a entrega final com fé e coragem. ⚔🔥";

  const shortMsg =
    "Parabéns pela Jornada! 🌟\n" +
    "Receba este acolhimento e vamos à entrega final. ⚔🔥";

  const msg = (opts.message || (isMobile ? shortMsg : longMsg));

  // Velocidade estimada p/ datilografia (ms por caractere)
  const msPerChar = Number(opts.msPerChar) || (isMobile ? 35 : 50);
  const estDuration = Math.max(800, msg.length * msPerChar);

  el.innerHTML = `
    <section class="card pergaminho pergaminho-v">
      <h2 class="title">Mensagem de Acolhimento</h2>
      <p id="jr_acolhimento" class="muted" style="min-height:60px;white-space:pre-line"></p>
    </section>
  `;

  // Datilografa a mensagem (usa módulo externo se houver; senão fallback do controller)
  typeText(document.getElementById("jr_acolhimento"), msg);

  // Espera terminar (estimativa simples, confiável o bastante para UX)
  await new Promise(res => setTimeout(res, estDuration));

  // Toca vídeo final (se definido)
  if (window.JORNADA_FINAL_VIDEO) {
    await playVideoOverlay(window.JORNADA_FINAL_VIDEO);
  }

  // Gera PDF/HQ
  await gerarDevolutivas(answers);
}

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
