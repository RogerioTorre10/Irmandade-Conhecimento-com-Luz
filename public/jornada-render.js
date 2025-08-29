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

  // Garante que exista um contêiner para renderização (#jornada-content, #content, main.container, main)
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

  // tenta carregar a 1ª imagem válida
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

  // Candidatos de caminho para as imagens (ajuste se preferir)
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
    '/docs/assets/perg-hori.png'
  ];

  function setPergaminho(mode) {
    // tenta usar módulo externo se existir
    try { global.JORNADA_PAPEL?.set?.(mode); } catch (_) {}

    const root = getRoot();
    root.classList.remove('pergaminho-v', 'pergaminho-h');
    root.classList.add(mode === 'h' ? 'pergaminho-h' : 'pergaminho-v');

    const list = (mode === 'h') ? CAND_H : CAND_V;
    firstAvailable(list).then(url => {
      root.style.background = `url("${url}") center/cover no-repeat`;
    }).catch(() => {
      // fallback visual (sem imagem)
      root.style.background = 'radial-gradient(80% 60% at 50% 40%, #d9b073 0%, #c08b4d 45%, #a36934 80%)';
    });

    root.style.minHeight = '70vh';
    root.style.padding = '1rem';
    root.style.borderRadius = '14px';
    root.style.border = '1px solid rgba(255,255,255,.08)';
  }

  /* =====================
     TELAS DA JORNADA
     ===================== */

  function renderIntro() {
    setPergaminho('v');

    const html = `
      <section class="card pergaminho pergaminho-v">
        <h2 class="text-xl font-semibold mb-2">Bem-vindo à Jornada</h2>
        <p class="mb-3">Respire. Quando estiver pronto, clique em Iniciar.</p>
        <div id="flame" class="mb-3"></div>
        <button id="btn-iniciar" class="btn btn-primary">Começar</button>
      </section>
    `;

    const root = getRoot();
    mount(root, html);

    // chama animada (se módulo existir)
    try { global.JORNADA_CHAMA?.makeChama?.('#flame'); } catch (_) {}

    const btn = $('#btn-iniciar', root);
    if (btn) btn.addEventListener('click', () => renderPerguntas());
  }

  function renderPerguntas() {
    setPergaminho('h');

    const PERGUNTAS = (global.DEFAULT_QUESTIONS && Array.isArray(global.DEFAULT_QUESTIONS))
      ? global.DEFAULT_QUESTIONS
      : [
          { name: 'q1', label: 'Quem é você neste momento da jornada?' },
          { name: 'q2', label: 'Qual foi o maior desafio hoje?' },
          { name: 'q3', label: 'Qual pequeno passo você pode dar hoje?' },
          { name: 'q4', label: 'O que você quer agradecer agora?' },
        ];

    const form = document.createElement('form');
    form.className = 'form-perguntas';

    PERGUNTAS.forEach((p, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'mb-3';

      const label = document.createElement('label');
      label.className = 'block mb-1 font-semibold';
      label.textContent = `${i + 1}. ${p.label}`;

      const ta = document.createElement('textarea');
      ta.name = p.name;
      ta.rows = 3;
      ta.required = true;
      ta.className = 'w-full p-2 rounded-md';

      wrap.appendChild(label);
      wrap.appendChild(ta);
      form.appendChild(wrap);
    });

    const actions = document.createElement('div');
    actions.className = 'mt-4 flex gap-2';

    const bVoltar = document.createElement('button');
    bVoltar.type = 'button';
    bVoltar.className = 'btn';
    bVoltar.textContent = 'Voltar';
    bVoltar.addEventListener('click', () => renderIntro());

    const bFim = document.createElement('button');
    bFim.type = 'submit';
    bFim.className = 'btn btn-primary';
    bFim.textContent = 'Finalizar';

    actions.appendChild(bVoltar);
    actions.appendChild(bFim);
    form.appendChild(actions);

    const root = getRoot();
    mount(root, form);

    // progresso simples (se existir #progressBar na página)
    const inputs = Array.from(root.querySelectorAll('textarea'));
    function updateProg() {
      const total = inputs.length || 1;
      const feitas = inputs.filter(i => i.value.trim().length > 0).length;
      const pct = Math.round((feitas / total) * 100);
      const bar = document.getElementById('progressBar');
      if (bar) bar.style.width = pct + '%';
    }
    inputs.forEach(i => i.addEventListener('input', updateProg));
    updateProg();

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = {};
      inputs.forEach(i => data[i.name] = i.value.trim());
      try { global.JORNADA_STATE?.save?.(data); } catch (_) {}
      renderFinal();
    });
  }

  function renderFinal() {
    setPergaminho('v');

    const html = `
      <section class="card pergaminho pergaminho-v">
        <h2 class="text-xl font-semibold mb-2">Conclusão da Jornada</h2>
        <p class="mb-3">Seu caminho foi registrado com coragem e verdade.</p>
        <button id="btn-voltar" class="btn btn-primary">Voltar ao início</button>
      </section>
    `;

    const root = getRoot();
    mount(root, html);

    const btn = $('#btn-voltar', root);
    if (btn) btn.addEventListener('click', () => renderIntro());
  }

  /* ==========================
     EXPORTAÇÕES & BOOT
     ========================== */
  global.JORNADA_RENDER = { renderIntro, renderPerguntas, renderFinal };
  // Aliases para chamadas antigas
  global.renderIntro = renderIntro;
  global.renderPerguntas = renderPerguntas;
  global.renderFinal = renderFinal;

  document.addEventListener('DOMContentLoaded', function () {
    try { (CFG.START === 'intro' ? renderIntro : renderPerguntas)(); }
    catch (e) { console.error(e); }
  });

})(window);
