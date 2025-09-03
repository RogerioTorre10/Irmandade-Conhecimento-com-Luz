/* ==================================================
   RENDER CONTROLLER — Irmandade Conhecimento com Luz
   Estrutura modular, com títulos e subtítulos claros
   Colar em: /public/assets/js/render-controller.js
   Requisitos: ui.js, state.js, config.js, journey.js (ou jornada-controller.js)
   ================================================== */

// ✅ Proteção contra vazamento de script (init único)
(function () {
  if (window.__RENDER_CTRL_INIT__) return; // evita múltiplas inicializações
  window.__RENDER_CTRL_INIT__ = true;

  // -------------------- Núcleo / Utilidades --------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const CFG = window.JORNADA_CFG || {};
  const UI  = window.JORNADA_UI  || {};
  const ST  = window.JORNADA_STATE || {};

  // Canal para cancelar listeners em navegações
  let abortCtrl = new AbortController();
  const resetAbort = () => { abortCtrl.abort(); abortCtrl = new AbortController(); };

  // ===================== 1) EFEITO DATILOGRAFIA =====================
  // 1.1 Cabeçalho — "texto de cabeçalho"
  const TypingHeader = (() => {
    let timer = null;
    function type(el, text, speed = 28) {
      if (!el) return;
      clearInterval(timer);
      el.textContent = "";
      let i = 0;
      timer = setInterval(() => {
        el.textContent += text.charAt(i++);
        if (i >= text.length) clearInterval(timer);
      }, speed);
    }
    return { run: (sel, text, speed) => type($(sel), text, speed) };
  })();

  // 1.2 Rodapé — "texto de rodapé"
  const TypingFooter = (() => {
    let timer = null;
    function type(el, text, speed = 22) {
      if (!el) return;
      clearInterval(timer);
      el.textContent = "";
      let i = 0;
      timer = setInterval(() => {
        el.textContent += text.charAt(i++);
        if (i >= text.length) clearInterval(timer);
      }, speed);
    }
    return { run: (sel, text, speed) => type($(sel), text, speed) };
  })();

  // 1.3 Perguntas — "texto de perguntas"
  const TypingQuestion = (() => {
    function typeInto(el, text, speed = 26) {
      if (!el) return;
      el.innerHTML = ""; // importante: usa innerHTML só aqui
      const span = document.createElement('span');
      el.appendChild(span);
      let i = 0;
      const id = setInterval(() => {
        span.textContent += text.charAt(i++);
        if (i >= text.length) clearInterval(id);
      }, speed);
    }
    return { run: (sel, text, speed) => typeInto($(sel), text, speed) };
  })();

  // ===================== 2) EFEITO CHAMA =====================
  // 2.1 Big Chama — página principal do site
  const FlameBigHome = (() => {
    return {
      mount: (sel = '#bigFlameHome') => {
        const el = $(sel);
        if (!el) return;
        el.classList.add('chama','chama--big');
        // Se usar CSS puro de chama, garantir spans:
        if (!el.querySelector('span')) {
          el.innerHTML = '<span></span><span></span><span></span>';
        }
      }
    };
  })();

  // 2.2 Chama pequena — topo da página "Contrato"
  const FlameSmallContratoTop = (() => ({
    mount: (sel = '#flameContratoTop') => {
      const el = $(sel); if (!el) return;
      el.classList.add('chama','chama--sm');
      if (!el.querySelector('span')) el.innerHTML = '<span></span><span></span><span></span>';
    }
  }))();

  // 2.3 Chama pequena — parte inferior das Perguntas
  const FlameSmallPerguntasBottom = (() => ({
    mount: (sel = '#flamePerguntasBottom') => {
      const el = $(sel); if (!el) return;
      el.classList.add('chama','chama--sm');
      if (!el.querySelector('span')) el.innerHTML = '<span></span><span></span><span></span>';
    }
  }))();

  // ===================== 3) PERGAMINHO =====================
  // 3.1 Vertical — início, intro, final
  const PergaminhoV = {
    apply: (section) => section && section.classList.add('pergaminho','pergaminho-v')
  };
  // 3.2 Horizontal — perguntas e respostas
  const PergaminhoH = {
    apply: (section) => section && section.classList.add('pergaminho','pergaminho-h')
  };

  // ===================== 4) BARRA DE PROGRESSO =====================
  // Suporta dois modos: por-bloque (0..N) e por-pergunta (0..totalPerguntas)
  const Progress = (() => {
    let totalBlocks = 5;    // ajustar conforme config
    let totalPergs  = 32;   // ajustar conforme config

    function setBar(percent) {
      UI.setProgress ? UI.setProgress(percent) : ( $('#progressBar') && ($('#progressBar').style.width = `${percent}%`) );
      const label = $('#progressLabel');
      if (label) label.textContent = `${Math.round(percent)}%`;
    }

    return {
      setup: (cfg = {}) => { totalBlocks = cfg.totalBlocks ?? totalBlocks; totalPergs = cfg.totalPerguntas ?? totalPergs; },
      byBlock: (currentIndex /* 0-based */) => {
        const percent = Math.max(0, Math.min(100, ((currentIndex + 1) / totalBlocks) * 100));
        setBar(percent);
      },
      byPergunta: (current /* 1-based */) => {
        const percent = Math.max(0, Math.min(100, (current / totalPergs) * 100));
        setBar(percent);
      }
    };
  })();

  // ===================== 5) VÍDEOS ENTRE BLOCOS (5 blocos) =====================
  // Exibe mp4 ao transitar de um bloco ao próximo
  const BlockVideos = (() => {
    const vids = CFG.BLOCK_VIDEOS || [];
    function play(index) {
      const src = vids[index];
      const el = $('#blockVideo');
      if (!el || !src) return Promise.resolve();
      return new Promise((resolve) => {
        el.src = src; el.classList.remove('hidden');
        el.onended = () => { el.classList.add('hidden'); resolve(); };
        el.play().catch(() => resolve());
      });
    }
    return { play };
  })();

  // ===================== 6) DOWNLOAD (PDF e HQ) =====================
  const Downloader = (() => {
    async function get(url) {
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) throw new Error(`Falha ao baixar: ${r.status}`);
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = url.split('/').pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    return {
      pdf: () => get(CFG.API_PDF_URL),
      hq:  () => get(CFG.API_HQ_URL)
    };
  })();

  // ===================== 7) NAVEGAÇÃO (home → intro → perguntas → final) =====================
  const Nav = (() => {
    function show(id) { UI.showSection ? UI.showSection(id) : switchSection(id); }
    function switchSection(id) {
      $$('.card').forEach(sec => sec.classList.toggle('hidden', sec.id !== id));
    }
    function goHome () { show('home');  applyFrame('v'); }
    function goIntro () { show('intro'); applyFrame('v'); }
    function goPergs() { show('perguntas'); applyFrame('h'); }
    function goFinal () { show('final'); applyFrame('v'); }

    function applyFrame(type) {
      const sec = $('#app section.card:not(.hidden)');
      if (!sec) return;
      sec.classList.remove('pergaminho','pergaminho-v','pergaminho-h');
      (type === 'v' ? PergaminhoV : PergaminhoH).apply(sec);
    }

    return { goHome, goIntro, goPergs, goFinal };
  })();

  // ===================== 8) BOTÕES (limpeza de duplicados) =====================
  const Buttons = (() => {
    function bind() {
      resetAbort();
      const sig = { signal: abortCtrl.signal };

      on($('#btnExplorar1'), 'click', () => Nav.goIntro(), sig);
      on($('#btnExplorar2'), 'click', () => {
        // Removido/ocultado conforme solicitação para evitar página estática com 2 perguntas
        const b = $('#btnExplorar2'); if (b) b.classList.add('hidden');
        Nav.goIntro();
      }, sig);
      on($('#btnIniciar'), 'click', () => Nav.goPergs(), sig);

      on($('#btnBaixarPDF'), 'click', () => Downloader.pdf(), sig);
      on($('#btnBaixarHQ'),  'click', () => Downloader.hq(),  sig);
      on($('#btnVoltarHome'),'click', () => Nav.goHome(), sig);
    }
    return { bind };
  })();

  // ===================== 9) CONFIGURAÇÃO DE ENDPOINTS/API =====================
  // Ajuste aqui para evitar 404 e CORS (usa apenas domínios válidos)
  (function configureAPI(){
    const ORIGENS_OK = CFG.ALLOWED_ORIGINS || [
      'https://irmandade-conhecimento-com-luz.onrender.com',
      'https://irmandade-conhecimento-com-luz-1.onrender.com',
      'http://localhost:3000'
    ];
    // Exemplo: window.fetch será usado normalmente; apenas garanta CFG.API_* corretos
    // CFG.API_PDF_URL, CFG.API_HQ_URL devem apontar para o serviço válido
  })();

  // ===================== 10) INICIALIZAÇÃO =====================
  async function init() {
    // Tipografia dinâmica
    TypingHeader.run('#typingHeader', CFG.TYPING_HEADER || 'Irmandade Conhecimento com Luz');
    TypingFooter.run('#typingFooter', CFG.TYPING_FOOTER || 'Para além. E sempre!!');

    // Efeito chama
    FlameBigHome.mount('#bigFlameHome');
    FlameSmallContratoTop.mount('#flameContratoTop');
    FlameSmallPerguntasBottom.mount('#flamePerguntasBottom');

    // Progresso
    Progress.setup({ totalBlocks: CFG.TOTAL_BLOCKS || 5, totalPerguntas: CFG.TOTAL_PERGUNTAS || 32 });
    Progress.byBlock(0); // inicia em 1º bloco

    // Botões
    Buttons.bind();

    // Página inicial
    Nav.goHome();
  }

  // Expor um pequeno gateway para outros módulos (jornada-controller) atualizarem a barra
  window.RENDER_CTRL = {
    progressByBlock: (i) => Progress.byBlock(i),
    progressByPergunta: (n) => Progress.byPergunta(n),
    playBlockVideo: (i) => BlockVideos.play(i),
    go: { home: () => Nav.goHome(), intro: () => Nav.goIntro(), pergs: () => Nav.goPergs(), final: () => Nav.goFinal() },
  };

  // Start
  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
