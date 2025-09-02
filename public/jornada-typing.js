/* =========================
   JORNADA_TYPE – efeito de datilografia
   Uso: JORNADA_TYPE.run(root, { selector: '.q-label', speed: 20, delay: 0 })
   Marca os elementos com [data-type] ou usa o texto atual.
   ========================= */
(function (global) {
  'use strict';
  if (global.JORNADA_TYPE) return;

  // injeta o cursor (uma vez)
  (function ensureStyle(){
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret{display:inline-block;width:0.6ch;margin-left:2px;animation:blink 1s step-end infinite}
      @keyframes blink{50%{opacity:0}}
    `;
    document.head.appendChild(st);
  })();

  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

  async function typeNode(node, full, speed, delay){
    // prepara
    const caret = document.createElement('span');
    caret.className = 'typing-caret';
    caret.textContent = '|';
    node.textContent = '';
    node.appendChild(caret);
    if (delay) await sleep(delay);

    // digita
    for (let i = 0; i < full.length; i++) {
      caret.before(document.createTextNode(full[i]));
      await sleep(speed);
    }
    caret.remove();
  }

  async function run(root, opts = {}) {
    const scope = (typeof root === 'string') ? document.querySelector(root) : (root || document);
    const selector = opts.selector || '[data-type]';
    const speed = Number(opts.speed ?? 18);
    const delay = Number(opts.delay ?? 0);

    const nodes = Array.from(scope.querySelectorAll(selector));
    // se não houver [data-type], aplica ao próprio texto do elemento
    for (const n of nodes) {
      const text = n.getAttribute('data-type') ?? n.textContent ?? '';
      await typeNode(n, text, speed, delay);
    }
  }
   
 // chama manualmente quando renderizar uma pergunta 
function typeIt(el, text, speed=24){
  if(!el || !text) return;
  el.textContent = '';
  let i = 0;
  const tick = () => {
    if(i < text.length){
      el.textContent += text.charAt(i++);
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}

// adiciona no objeto global também
global.JORNADA_TYPE = { run, typeIt };

  global.JORNADA_TYPE = { run };
})(window);


