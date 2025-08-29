// /public/jornada-render.js
(function (global) {
  'use strict';

  // ---------- SHIMS E HELPERS ----------
  // mount(target, htmlOrNode): injeta HTML ou Node no alvo
  if (typeof global.mount !== 'function') {
    global.mount = function(target, htmlOrNode) {
      var el = (typeof target === 'string') ? document.querySelector(target) : target;
      if (!el) throw new Error('mount: alvo não encontrado: ' + target);
      el.innerHTML = '';
      if (typeof htmlOrNode === 'string') el.innerHTML = htmlOrNode;
      else if (htmlOrNode) el.appendChild(htmlOrNode);
      return el;
    };
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function ensureContainer() {
    // tenta achar em ordem: #jornada-content, #content, main.container, main
    var el = $('#jornada-content') || $('#content') || $('main.container') || $('main');
    if (!el) {
      // cria um contêiner mínimo para render se nada existir
      el = document.createElement('main');
      el.id = 'jornada-content';
      el.className = 'container';
      document.body.appendChild(el);
    }
    return el;
  }

  // ---------- CONFIG ----------
  const CFG = Object.assign({
    CANVAS_ID: 'jornada_canvas',
    CONTENT_SEL: '#jornada-content, #content, main.container, main',
    PERG_V: '/assets/img/pergaminho-rasgado-vert.png',
    PERG_H: '/assets/img/pergaminho-rasgado-hori.png',
    START: 'intro'
  }, global.JORNADA_CFG || {});

  function getRoot() {
    return document.querySelector(CFG.CONTENT_SEL) || ensureContainer();
  }

  // ---------- PAPEL / PERGAMINHO ----------
  function setPergaminho(mode) {
    try { global.JORNADA_PAPEL?.set?.(mode); } catch (_) {}
    var root = getRoot();
    root.classList.remove('pergaminho-v','pergaminho-h');
    root.classList.add(mode === 'h' ? 'pergaminho-h' : 'pergaminho-v');
    var img = (mode === 'h') ? CFG.PERG_H : CFG.PERG_V;
    root.style.background = 'url("'+img+'") center/cover no-repeat';
    root.style.minHeight = '70vh';
    root.style.padding = '1rem';
  }

  // ---------- TELAS ----------
  function renderIntro() {
    setPergaminho('v');
    var html = `
      <section class="card pergaminho pergaminho-v">
        <h2 class="text-xl font-semibold mb-2">Bem-vindo à Jornada</h2>
        <p class="mb-3">Respire. Quando estiver pronto, clique em Iniciar.</p>
        <div id="flame" class="mb-3"></div>
        <button id="btn-iniciar" class="btn btn-primary">Iniciar</button>
      </section>
    `;
    var root = getRoot();
    mount(root, html);
    try { global.JORNADA_CHAMA?.makeChama?.('#flame'); } catch (_) {}
    var btn = $('#btn-iniciar', root);
    if (btn) btn.addEventListener('click', () => renderPerguntas());
  }

  function renderPerguntas() {
    setPergaminho('h');
    const PERGUNTAS = (global.DEFAULT_QUESTIONS && Array.isArray(global.DEFAULT_QUESTIONS))
      ? global.DEFAULT_QUESTIONS
      : [
          { name:'q1', label:'Quem é você neste momento da jornada?' },
          { name:'q2', label:'Qual foi o maior desafio hoje?' },
          { name:'q3', label:'Qual pequeno passo você pode dar hoje?' },
          { name:'q4', label:'O que você quer agradecer agora?' },
        ];

    var form = document.createElement('form');
    form.className = 'form-perguntas';

    PERGUNTAS.forEach((p, i)=>{
      var wrap = document.createElement('div');
      wrap.className = 'mb-3';
      var label = document.createElement('label');
      label.className = 'block mb-1 font-semibold';
      label.textContent = `${i+1}. ${p.label}`;
      var ta = document.createElement('textarea');
      ta.name = p.name; ta.rows = 3; ta.required = true; ta.className = 'w-full p-2 rounded-md';
      wrap.appendChild(label); wrap.appendChild(ta);
      form.appendChild(wrap);
    });

    var actions = document.createElement('div');
    actions.className = 'mt-4 flex gap-2';
    var bVoltar = document.createElement('button');
    bVoltar.type = 'button'; bVoltar.className = 'btn'; bVoltar.textContent = 'Voltar';
    bVoltar.addEventListener('click', ()=> renderIntro());
    var bFim = document.createElement('button');
    bFim.type = 'submit'; bFim.className = 'btn btn-primary'; bFim.textContent = 'Finalizar';
    actions.appendChild(bVoltar); actions.appendChild(bFim);
    form.appendChild(actions);

    var root = getRoot();
    mount(root, form);

    // progresso simples
    var inputs = Array.from(root.querySelectorAll('textarea'));
    function updateProg(){
      var total = inputs.length;
      var feitas = inputs.filter(i => i.value.trim().length>0).length;
      var pct = Math.round((feitas/total)*100);
      var bar = document.getElementById('progressBar');
      if (bar) bar.style.width = pct + '%';
    }
    inputs.forEach(i => i.addEventListener('input', updateProg));
    updateProg();

    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      var data = {};
      inputs.forEach(i => data[i.name] = i.value.trim());
      try { global.JORNADA_STATE?.save?.(data); } catch(_) {}
      renderFinal();
    });
  }

  function renderFinal() {
    setPergaminho('v');
    var html = `
      <section class="card pergaminho pergaminho-v">
        <h2 class="text-xl font-semibold mb-2">Conclusão da Jornada</h2>
        <p class="mb-3">Seu caminho foi registrado com coragem e verdade.</p>
        <button id="btn-voltar" class="btn btn-primary">Voltar ao início</button>
      </section>
    `;
    var root = getRoot();
    mount(root, html);
    var btn = $('#btn-voltar', root);
    if (btn) btn.addEventListener('click', ()=> renderIntro());
  }

  // ---------- EXPORTAÇÕES ----------
  global.JORNADA_RENDER = { renderIntro, renderPerguntas, renderFinal };
  // aliases para retrocompatibilidade
  global.renderIntro = renderIntro;
  global.renderPerguntas = renderPerguntas;
  global.renderFinal = renderFinal;

  // ---------- BOOT ----------
  document.addEventListener('DOMContentLoaded', function () {
    try { (CFG.START === 'intro' ? renderIntro : renderPerguntas)(); }
    catch(e){ console.error(e); }
  });

})(window);
