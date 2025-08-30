// /public/jornada-render.js
(function (global) {
  'use strict';

  /* =========================
     SHIMS & HELPERS BÁSICOS
     ========================= */

  // mount(target, htmlOrNode): injeta HTML string OU Node no alvo
  if (typeof global.mount !== 'function') {
    global.mount = function (target, htmlOrNode) {
      var el = (typeof target === 'string') ? document.querySelector(target) : target;
      if (!el) throw new Error('mount: alvo não encontrado: ' + target);
      el.innerHTML = '';
      if (typeof htmlOrNode === 'string') el.innerHTML = htmlOrNode;
      else if (htmlOrNode) el.appendChild(htmlOrNode);
      return el;
    };
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  // Garante contêiner (#jornada-content, #content, main.container, main)
  function ensureContainer() {
    var el = $('#jornada-content') || $('#content') || $('main.container') || $('main');
    if (!el) {
      el = document.createElement('main');
      el.id = 'jornada-content';
      el.className = 'container';
      document.body.appendChild(el);
    }
    return el;
  }

  /* ===============
     CONFIG GLOBAL
     =============== */
  const CFG = Object.assign({
    CONTENT_SEL: '#jornada-content, #content, main.container, main',
    START: 'intro'
  }, global.JORNADA_CFG || {});
  function getRoot() {
    return document.querySelector(CFG.CONTENT_SEL) || ensureContainer();
  }

  /* ==============================
     PERGAMINHO (V/H) COM FALLBACK
     ============================== */
  function firstAvailable(urls) {
    return new Promise((resolve, reject) => {
      let i = 0;
      function tryNext() {
        if (i >= urls.length) return reject(new Error('no image'));
        const u = urls[i++];
        const img = new Image();
        img.onload = () => resolve(u);
        img.onerror = tryNext;
        img.src = u + (u.includes('?') ? '&' : '?') + 'v=' + Date.now();
      }
      tryNext();
    });
  }
  const CAND_V = [
    '/assets/img/pergaminho-rasgado-vert.png',
    '/assets/img/pergaminho-rasgado-vert.jpg',
    '/assets/pergaminho.png',
    '/docs/assets/perg-vert.png'
  ];
  const CAND_H = [
    '/assets/img/pergaminho-rasgado-hori.png',
    '/assets/img/pergaminho-rasgado-hori.jpg',
    '/assets/img/perg-hori.png',
    '/docs/assets/perg-hori.png',
    '/assets/img/perg-hori.jpg',
    '/assets/img/perg_hori.png'
  ];

  function setPergaminho(mode) {
    try { global.JORNADA_PAPEL?.set?.(mode); } catch (_) {}
    const root = getRoot();
    root.classList.remove('pergaminho-v', 'pergaminho-h');
    root.classList.add(mode === 'h' ? 'pergaminho-h' : 'pergaminho-v');

    const list = (mode === 'h') ? CAND_H : CAND_V;
    firstAvailable(list).then(url => {
      root.style.background = `url("${url}") center/cover no-repeat`;
    }).catch(() => {
      root.style.background = 'radial-gradient(80% 60% at 50% 40%, #d9b073 0%, #c08b4d 45%, #a36934 80%)';
    });

    root.style.minHeight = '70vh';
    root.style.padding = '1rem';
    root.style.borderRadius = '14px';
    root.style.border = '1px solid rgba(255,255,255,.08)';
  }

  /* =====================
     ESTILO INLINE (wizard)
     ===================== */
  (function injectFormStyle(){
    if (document.getElementById('wizard-inline-style')) return;
    const css = `
      .wizard-wrap{max-width:900px;margin:0 auto;padding:16px 12px}
      .wizard-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
      .wizard-step{font-weight:600}
      .progress{height:8px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden}
      .progress > .fill{height:100%;width:0;background:#3e69ff;transition:width .25s ease}
      .q-label{display:block;margin:8px 0 6px;font-weight:600}
      .q-area{width:100%;min-height:120px;resize:vertical;border-radius:8px;border:1px solid rgba(255,255,255,.12);
              padding:10px;background:rgba(13,20,32,.65);color:#e6eefc}
      .wizard-actions{margin-top:12px;display:flex;gap:10px;flex-wrap:wrap}
      .btn{padding:.55rem 1rem;border-radius:.6rem;border:1px solid rgba(255,255,255,.12);background:#1f2d4a;color:#fff;cursor:pointer}
      .btn.secondary{background:transparent}
    `;
    const style = document.createElement('style');
    style.id = 'wizard-inline-style';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  /* =====================
     PERGUNTAS (WIZARD)
     ===================== */
  const DEFAULTS = [
    { name:'q1', label:'Quem é você neste momento da jornada?' },
    { name:'q2', label:'Qual foi o maior desafio hoje?' },
    { name:'q3', label:'Qual pequeno passo você pode dar hoje?' },
    { name:'q4', label:'O que você quer agradecer agora?' },
  ];
  function getPerguntas(){
    return (global.DEFAULT_QUESTIONS && Array.isArray(global.DEFAULT_QUESTIONS))
      ? global.DEFAULT_QUESTIONS
      : DEFAULTS;
  }

  const Wizard = {
    idx: 0,
    respostas: {},
    total: 0
  };

  function saveState() {
    try { global.JORNADA_STATE?.save?.(Wizard.respostas); } catch(_) {}
    try { localStorage.setItem('JORNADA_WIZ', JSON.stringify(Wizard)); } catch(_){}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('JORNADA_WIZ');
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data.idx === 'number') {
          Wizard.idx = data.idx;
          Wizard.respostas = data.respostas || {};
        }
      }
    } catch(_){}
  }

  function renderPerguntas() {
    setPergaminho('h');
    loadState();

    const PERG = getPerguntas();
    Wizard.total = PERG.length;
    if (Wizard.idx < 0) Wizard.idx = 0;
    if (Wizard.idx >= Wizard.total) Wizard.idx = Wizard.total - 1;

    const q = PERG[Wizard.idx];

    const root = getRoot();
    const wrap = document.createElement('div');
    wrap.className = 'wizard-wrap';

    // header + progresso
    const header = document.createElement('div');
    header.className = 'wizard-header';
    header.innerHTML = `
      <div class="wizard-step">Pergunta ${Wizard.idx + 1} de ${Wizard.total}</div>
      <div class="progress" style="flex:1"><div id="jprog" class="fill"></div></div>
    `;
    wrap.appendChild(header);

    // pergunta
    const lbl = document.createElement('label');
    lbl.className = 'q-label';
    lbl.textContent = q.label;
    const ta = document.createElement('textarea');
    ta.className = 'q-area';
    ta.name = q.name;
    ta.value = Wizard.respostas[q.name] || '';
    wrap.appendChild(lbl);
    wrap.appendChild(ta);

    // ações
    const actions = document.createElement('div');
    actions.className = 'wizard-actions';

    const bVoltar = document.createElement('button');
    bVoltar.className = 'btn secondary';
    bVoltar.type = 'button';
    bVoltar.textContent = 'Voltar';
    bVoltar.disabled = (Wizard.idx === 0);
    bVoltar.addEventListener('click', () => {
      Wizard.respostas[q.name] = ta.value.trim();
      Wizard.idx = Math.max(0, Wizard.idx - 1);
      saveState();
      renderPerguntas();
    });

    const bProx = document.createElement('button');
    bProx.className = 'btn';
    bProx.type = 'button';
    bProx.textContent = (Wizard.idx === Wizard.total - 1) ? 'Finalizar' : 'Próximo';
    bProx.addEventListener('click', () => {
      Wizard.respostas[q.name] = ta.value.trim();
      if (Wizard.idx === Wizard.total - 1) {
        saveState();
        renderFinal(); // FINALIZA SEM TRAVAR EM VALIDAÇÃO
      } else {
        Wizard.idx++;
        saveState();
        renderPerguntas();
      }
    });

    const bFinal = document.createElement('button');
    bFinal.className = 'btn secondary';
    bFinal.type = 'button';
    bFinal.textContent = 'Concluir agora';
    bFinal.title = 'Ir direto à conclusão (mesmo com respostas em branco)';
    bFinal.addEventListener('click', () => {
      Wizard.respostas[q.name] = ta.value.trim();
      saveState();
      renderFinal();
    });

    actions.appendChild(bVoltar);
    actions.appendChild(bProx);
    actions.appendChild(bFinal);
    wrap.appendChild(actions);

    // monta
    mount(root, wrap);

    // progresso
    const pct = Math.round(((Wizard.idx + 1) / Wizard.total) * 100);
    const fill = $('#jprog', wrap);
    if (fill) fill.style.width = pct + '%';
  }

  /* =====================
     TELAS: INTRO / FINAL
     ===================== */
  function renderIntro() {
    setPergaminho('v');
    const html = `
      <section class="card pergaminho pergaminho-v">
        <h2 class="text-xl font-semibold mb-2">Bem-vindo à Jornada</h2>
        <p class="mb-3">Respire. Quando estiver pronto, clique em Iniciar.</p>
        <div id="flame" class="mb-3"></div>
        <button id="btn-iniciar" class="btn">Começar</button>
      </section>
    `;
    const root = getRoot();
    mount(root, html);
    try { global.JORNADA_CHAMA?.makeChama?.('#flame'); } catch (_) {}
    const btn = $('#btn-iniciar', root);
    if (btn) btn.addEventListener('click', () => {
      Wizard.idx = 0;
      Wizard.respostas = {};
      saveState();
      renderPerguntas();
    });
  }
  // depois de mount(root, form);
try {
  if (window.JORNADA_MICRO?.attach) {
    Array.from(root.querySelectorAll('textarea'))
      .forEach(el => window.JORNADA_MICRO.attach(el));
  }
} catch (_) {}

  function renderFinal() {
    setPergaminho('v');
    const html = `
      <section class="card pergaminho pergaminho-v">
        <h2 class="text-xl font-semibold mb-2">Conclusão da Jornada</h2>
        <p class="mb-3">Seu caminho foi registrado com coragem e verdade.</p>
        <div class="wizard-actions">
          <button id="btn-voltar" class="btn">Voltar ao início</button>
        </div>
      </section>
    `;
    const root = getRoot();
    mount(root, html);
    const btn = $('#btn-voltar', root);
    if (btn) btn.addEventListener('click', () => {
      // limpa índice mas mantém respostas salvas (se quiser limpar tudo, zere Wizard.respostas aqui)
      Wizard.idx = 0;
      saveState();
      renderIntro();
    });
  }

  /* ==========================
     EXPORTAÇÕES & BOOT
     ========================== */
  global.JORNADA_RENDER = { renderIntro, renderPerguntas, renderFinal };
  global.renderIntro = renderIntro;           // aliases legacy
  global.renderPerguntas = renderPerguntas;
  global.renderFinal = renderFinal;

  document.addEventListener('DOMContentLoaded', function () {
    try { (CFG.START === 'intro' ? renderIntro : renderPerguntas)(); }
    catch (e) { console.error(e); }
  });

})(window);
