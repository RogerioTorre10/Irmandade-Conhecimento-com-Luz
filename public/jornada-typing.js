/* =========================
   JORNADA_TYPE – efeito de datilografia (v2.2)
   Uso: JORNADA_TYPE.run(root?, { selector, speed, delay })
        JORNADA_TYPE.typeIt(el, text, speed?)
        JORNADA_TYPE.cancelAll()
   Compat: [data-typing], [data-text], [data-speed], [data-cursor]
   ========================= */
(function (global) {
  'use strict';
  if (global.JORNADA_TYPE) return; // evita redefinição

  // injeta o cursor (uma vez)
  (function ensureStyle(){
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret{display:inline-block;width:0.6ch;margin-left:2px;animation:blink 1s step-end infinite}
      .typing-done[data-typing]::after{content:''}
      @keyframes blink{50%{opacity:0}}
    `;
    document.head.appendChild(st);
  })();

  const sleep = (ms) => new Promise(r=>setTimeout(r, ms));

  // Controle simples de concorrência
  let ACTIVE = false;
  function lock(){ ACTIVE = true; global.__typingLock = true; }
  function unlock(){ ACTIVE = false; global.__typingLock = false; }

  function plain(text){
    // fallback seguro para texto
    return (text ?? '').toString();
  }

  // Digita texto plain; se recebeu HTML no data-text, digita versão "sem tags"
  // e, ao final, troca por innerHTML completo (mantendo tags <b>, <i>, etc.)
  async function typeNode(node, fullText, { speed=18, delay=0, showCaret=true, finalHTML=null } = {}){
    if (!node) return;
    // prepara
    const caret = document.createElement('span');
    caret.className = 'typing-caret';
    caret.textContent = '|';

    node.classList.remove('typing-done');
    node.innerHTML = ''; // começamos do zero
    if (delay) await sleep(delay);
    if (showCaret) node.appendChild(caret);

    for (let i = 0; i < fullText.length; i++) {
      caret.before(document.createTextNode(fullText[i]));
      await sleep(speed);
    }

    if (showCaret) caret.remove();

    // Se foi fornecido um HTML final (com tags), aplica agora
    if (finalHTML) {
      node.innerHTML = finalHTML;
    }

    node.classList.add('typing-done');
  }

  // Runner principal
  async function run(root, opts = {}) {
    if (ACTIVE) { /* evita corridas */ return; }
    lock();
    try {
      const scope = (typeof root === 'string') ? document.querySelector(root) : (root || document);
      if (!scope) { unlock(); return; }

      // Por padrão trabalhamos com [data-typing]; se quiser selector custom, permite também
      const selector = opts.selector || '[data-typing]';
      const nodes = Array.from(scope.querySelectorAll(selector));
      for (const n of nodes) {
        // se já digitado, não repete
        if (n.classList.contains('typing-done')) continue;

        // prioridade para data-attributes usados no seu HTML
        const dataHTML   = n.getAttribute('data-text');           // pode vir com <b>...</b>
        const dataSpeed  = n.getAttribute('data-speed');
        const dataCursor = n.getAttribute('data-cursor');         // "true"/"false"
        const speed = Number(dataSpeed ?? opts.speed ?? 18);
        const delay = Number(opts.delay ?? 0);
        const showCaret = String(dataCursor ?? 'true') !== 'false';

        // Se vier HTML no data-text, digitamos seu texto "plain" e depois aplicamos o HTML completo
        if (dataHTML) {
          const tmp = document.createElement('div');
          tmp.innerHTML = dataHTML;
          const plainText = tmp.textContent || tmp.innerText || '';
          await typeNode(n, plainText, { speed, delay, showCaret, finalHTML: dataHTML });
        } else {
          // Sem data-text → usa o texto atual do elemento
          const text = plain(n.textContent);
          await typeNode(n, text, { speed, delay, showCaret, finalHTML: null });
        }
      }
    } finally {
      unlock();
    }
  }

  // Datilografia simples, imediata (sem caret, sem atraso)
  function typeIt(el, text, speed=24){
    if(!el || !text) return;
    el.classList.remove('typing-done');
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if(i < text.length){
        el.textContent += text.charAt(i++);
        setTimeout(tick, speed);
      } else {
        el.classList.add('typing-done');
      }
    };
    setTimeout(tick, 0);
  }

  function cancelAll(){
    // versão simples: só solta o lock
    unlock();
  }

  global.JORNADA_TYPE = { run, typeIt, cancelAll, get locked(){ return ACTIVE; } };
})(window);
