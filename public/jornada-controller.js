/* ============================================================================
   RENDER CONTROLLER — Irmandade Conhecimento com Luz
   Local: /public/assets/js/render-controller.js
   Propósito: orquestrar efeitos visuais e de texto com módulos independentes.
   Namespace pública: window.RENDER
   ============================================================================ */

(function () {
  const RENDER = (window.RENDER = window.RENDER || {});

  /* ==========================================================================
     🔧 UTILIDADES COMUNS
     ========================================================================== */
  const U = {
    qs(sel, root = document) { return root.querySelector(sel); },
    qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },
    wait(ms) { return new Promise(r => setTimeout(r, ms)); },
    safe(fn, label = "op") {
      try { return fn(); } catch (e) { console.warn(`[RENDER] Falha em ${label}:`, e); }
    },
    setText(el, text) { if (el) el.textContent = text; },
    appendHTML(el, html) { if (el) el.insertAdjacentHTML('beforeend', html); },
    ensureClass(el, cls) { if (el && !el.classList.contains(cls)) el.classList.add(cls); }
  };

  /* ==========================================================================
     ⚙️ CONFIGURAÇÃO (SELETORES E ASSETS)
     ========================================================================== */
  const CFG = {
    // Tipografia medieval (já presentes no repositório)
    fonts: {
      medieval: {
        // Se estiver usando a fonte “ManufacturingConsent”:
        family: "ManufacturingConsent",
        urls: [
          "/assets/fonts/ManufacturingConsent-Regular.ttf"
        ],
        // Alternativamente, ative Cardo:
        // family: "Cardo",
        // urls: ["/assets/fonts/Cardo-Regular.ttf", "/assets/fonts/Cardo-Bold.ttf", "/assets/fonts/Cardo-Italic.ttf"],
        classWhenReady: "font-medieval-loaded"
      }
    },

    // Seletores padrão (ajuste conforme seu HTML)
    sel: {
      headerTyping: "[data-typing='cabecalho']",
      footerTyping: "[data-typing='rodape']",
      perguntasTyping: "[data-typing='perguntas']",

      bigFlameHomeContainer: "[data-chama='big-home']",
      smallFlameTopContrato: "[data-chama='small-contrato-top']",
      smallFlameBottomPerguntas: "[data-chama='small-perguntas-bottom']"
    }
  };

  /* ==========================================================================
     📚 CARREGADOR DE FONTES
     Subtítulo: Medieval — garantir que a fonte esteja pronta antes de aplicar
     ========================================================================== */
  RENDER.ensureMedievalFontLoaded = async function ensureMedievalFontLoaded() {
    const f = CFG.fonts.medieval;
    if (!f || !("fonts" in document)) return;

    try {
      // Carrega todas as variações declaradas
      const loads = f.urls.map(url => {
        const face = new FontFace(f.family, `url(${url})`);
        document.fonts.add(face);
        return face.load();
      });
      await Promise.all(loads);

      // Sinaliza no <html> ou <body> que a fonte está pronta
      U.ensureClass(document.documentElement, f.classWhenReady);
      console.log("[RENDER] Fonte medieval carregada.");
    } catch (e) {
      console.warn("[RENDER] Falha ao carregar fonte medieval:", e);
    }
  };

  /* ==========================================================================
     ✍️ EFEITO DATILOGRAFIA
     --------------------------------------------------------------------------
     Subtítulos:
     - texto de cabeçalho
     - texto de rodapé
     - texto de perguntas
     ========================================================================== */
  // Núcleo do efeito
  async function typeText(el, text, { speed = 28, cursor = false } = {}) {
    if (!el) return;
    el.textContent = "";
    if (cursor) el.classList.add("typing-cursor");
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await U.wait(speed);
    }
    if (cursor) el.classList.remove("typing-cursor");
  }

  // texto de cabeçalho
  RENDER.efeitoDatilografiaCabecalho = async function (opts = {}) {
    const el = U.qs(CFG.sel.headerTyping);
    const text = (opts.text || el?.getAttribute("data-text")) || "Irmandade Conhecimento com Luz";
    const speed = Number(opts.speed ?? el?.getAttribute("data-speed") ?? 28);
    const cursor = Boolean(opts.cursor ?? (el?.getAttribute("data-cursor") === "true"));
    await typeText(el, text, { speed, cursor });
  };

  // texto de rodapé
  RENDER.efeitoDatilografiaRodape = async function (opts = {}) {
    const el = U.qs(CFG.sel.footerTyping);
    const text = (opts.text || el?.getAttribute("data-text")) || "Para além. E sempre!!";
    const speed = Number(opts.speed ?? el?.getAttribute("data-speed") ?? 24);
    const cursor = Boolean(opts.cursor ?? (el?.getAttribute("data-cursor") === "true"));
    await typeText(el, text, { speed, cursor });
  };

  // texto de perguntas
  RENDER.efeitoDatilografiaPerguntas = async function (opts = {}) {
    const el = U.qs(CFG.sel.perguntasTyping);
    const text = (opts.text || el?.getAttribute("data-text")) || "Respire… sinta… e responda com verdade.";
    const speed = Number(opts.speed ?? el?.getAttribute("data-speed") ?? 22);
    const cursor = Boolean(opts.cursor ?? (el?.getAttribute("data-cursor") === "true"));
    await typeText(el, text, { speed, cursor });
  };

  /* ==========================================================================
     🔥 EFEITO CHAMA — BIG CHAMA (página principal do site)
     --------------------------------------------------------------------------
     Subtítulo:
     - big chama página principal
     ========================================================================== */
  function mountFlame(container, size = "big") {
    if (!container) return;
    // Usa versão CSS da chama (sem GIF), compatível com o que já criamos
    const flameHTML = `
      <div class="chama chama-${size}">
        <span></span><span></span><span></span>
      </div>
    `;
    U.appendHTML(container, flameHTML);
  }

  RENDER.efeitoChamaBigHome = function (opts = {}) {
    const target = U.qs(CFG.sel.bigFlameHomeContainer);
    mountFlame(target, "big");
  };

  /* ==========================================================================
     🔥 EFEITO CHAMA — VARIANTES PEQUENAS
     --------------------------------------------------------------------------
     Subtítulos:
     - chama pequena parte superior da página contrato
     - chama pequena parte inferior das perguntas
     ========================================================================== */
  RENDER.efeitoChamaSmallTopContrato = function (opts = {}) {
    const target = U.qs(CFG.sel.smallFlameTopContrato);
    mountFlame(target, "small");
  };

  RENDER.efeitoChamaSmallBottomPerguntas = function (opts = {}) {
    const target = U.qs(CFG.sel.smallFlameBottomPerguntas);
    mountFlame(target, "small");
  };

  /* ==========================================================================
     🎬 GATILHOS DE INICIALIZAÇÃO (OPCIONAL)
     - Ative apenas o que você precisa em cada página.
     - Nada impede de chamar manualmente em outro script.
     ========================================================================== */
  RENDER.initHome = async function () {
    await RENDER.ensureMedievalFontLoaded();
    await RENDER.efeitoDatilografiaCabecalho();
    RENDER.efeitoChamaBigHome();
    await RENDER.efeitoDatilografiaRodape();
  };

  RENDER.initContrato = async function () {
    await RENDER.ensureMedievalFontLoaded();
    await RENDER.efeitoDatilografiaCabecalho();
    RENDER.efeitoChamaSmallTopContrato();
    await RENDER.efeitoDatilografiaRodape();
  };

  RENDER.initPerguntas = async function () {
    await RENDER.ensureMedievalFontLoaded();
    await RENDER.efeitoDatilografiaPerguntas();
    RENDER.efeitoChamaSmallBottomPerguntas();
  };

  /* ==========================================================================
     🧩 ESTILOS MÍNIMOS (injetados apenas se necessário)
     - Mantém a chama funcional caso o CSS não tenha sido importado ainda.
     - Se você já possui chama.css, pode remover esta injeção.
     ========================================================================== */
  (function injectMinimalStylesIfMissing() {
    const MARK_ID = "render-controller-min-css";
    if (document.getElementById(MARK_ID)) return;

    const css = `
      .typing-cursor { border-right: 1px solid currentColor; animation: blink .9s steps(1) infinite; }
      @keyframes blink { 50% { border-color: transparent; } }

      .chama { position:relative; width:56px; height:80px; filter: drop-shadow(0 6px 14px rgba(255,140,0,.35)); }
      .chama.small { width:32px; height:45px; filter: drop-shadow(0 4px 10px rgba(255,140,0,.35)); }
      .chama span{
        position:absolute; inset:auto 0 0 0; margin:auto;
        width:56px; height:80px; border-radius:40px 40px 22px 22px;
        background: radial-gradient(50% 60% at 50% 30%, #fff7cc 0%, #ffd166 35%, #ff8c00 70%, transparent 100%);
        transform-origin: 50% 100%;
        animation: flame 1.6s ease-in-out infinite;
      }
      .chama.small span{ width:32px; height:45px; border-radius:24px 24px 12px 12px; }
      .chama span:nth-child(2){ filter:blur(4px); opacity:.9; animation-duration:1.9s; }
      .chama span:nth-child(3){ filter:blur(8px); opacity:.7; animation-duration:2.3s; }

      @keyframes flame {
        0%   { transform: translateY(0) scale(1);   opacity: 1; }
        50%  { transform: translateY(-3px) scale(1.04); opacity:.95; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }

      /* Quando a fonte medieval estiver pronta, aplique uma classe global */
      .font-medieval-loaded body, .font-medieval-loaded .use-medieval {
        font-family: "${CFG.fonts.medieval.family}", serif;
        font-variant-ligatures: discretionary-ligatures;
      }
    `.trim();

    const style = document.createElement("style");
    style.id = MARK_ID;
    style.textContent = css;
    document.head.appendChild(style);
  })();

  /* ==========================================================================
     🏁 AUTO-BOOT (opcional)
     - Desative se preferir chamar manualmente (initHome/initContrato/initPerguntas)
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    // Leia o alvo pelo atributo data-render-init="home|contrato|perguntas"
    const root = document.documentElement.getAttribute("data-render-init");
    if (root === "home")        U.safe(() => RENDER.initHome(), "initHome");
    if (root === "contrato")    U.safe(() => RENDER.initContrato(), "initContrato");
    if (root === "perguntas")   U.safe(() => RENDER.initPerguntas(), "initPerguntas");
  });

})();
