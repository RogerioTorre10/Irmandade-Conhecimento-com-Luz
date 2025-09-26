// /public/assets/js/jornada-type.js
import i18n from './i18n.js'; // Ajuste o caminho conforme necessário

// Evita redefinição
if (window.JORNADA_TYPE) {
  console.log('[JORNADA_TYPE] Já carregado, ignorando');
  throw new Error('JORNADA_TYPE já carregado');
}

// Injeta estilo do cursor
(function ensureStyle() {
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

const log = (...args) => console.log('[JORNADA_TYPE]', ...args);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const plain = (text) => (text ?? '').toString();

let ACTIVE = false;
let abortCurrent = null;

function lock() {
  ACTIVE = true;
  window.__typingLock = true;
}

function unlock() {
  ACTIVE = false;
  window.__typingLock = false;
}

async function typeNode(node, fullText, { speed = 18, delay = 0, showCaret = true, finalHTML = null } = {}) {
  if (!node) return;
  if (abortCurrent) abortCurrent();
  let abort = false;
  abortCurrent = () => (abort = true);

  const caret = document.createElement('span');
  caret.className = 'typing-caret';
  caret.textContent = '|';

  node.classList.remove('typing-done');
  node.innerHTML = '';
  if (delay) await sleep(delay);
  if (showCaret) node.appendChild(caret);

  for (let i = 0; i < fullText.length; i++) {
    if (abort) break;
    caret.before(document.createTextNode(fullText[i]));
    await sleep(speed);
  }

  if (!abort && showCaret) caret.remove();
  if (!abort && finalHTML) {
    node.innerHTML = finalHTML;
  }
  if (!abort) node.classList.add('typing-done');

  abortCurrent = null;
}

async function run(root, opts = {}) {
  if (ACTIVE) {
    log('Animação em andamento, ignorando');
    return;
  }
  lock();
  try {
    const scope = typeof root === 'string' ? document.querySelector(root) : (root || document);
    if (!scope) {
      log('Escopo não encontrado');
      return;
    }

    const selector = opts.selector || '[data-typing]';
    const nodes = Array.from(scope.querySelectorAll(selector));
    for (const n of nodes) {
      if (n.classList.contains('typing-done')) continue;

      const dataHTML = n.getAttribute('data-text');
      const dataSpeed = n.getAttribute('data-speed');
      const dataCursor = n.getAttribute('data-cursor');
      const speed = Number(dataSpeed ?? opts.speed ?? 18);
      const delay = Number(opts.delay ?? 0);
      const showCaret = String(dataCursor ?? 'true') !== 'false';

      const text = dataHTML
        ? (() => {
            const tmp = document.createElement('div');
            tmp.innerHTML = i18n.t(dataHTML, plain(n.textContent));
            return tmp.textContent || tmp.innerText || '';
          })()
        : i18n.t(n.getAttribute('data-i18n') || plain(n.textContent), plain(n.textContent));

      await typeNode(n, text, { speed, delay, showCaret, finalHTML: dataHTML ? i18n.t(dataHTML) : null });
    }
  } finally {
    unlock();
  }
}

function typeIt(el, text, speed = 24) {
  if (!el || !text) return;
  el.classList.remove('typing-done');
  el.textContent = '';
  let i = 0;
  const tick = () => {
    if (i < text.length) {
      el.textContent += text.charAt(i++);
      setTimeout(tick, speed);
    } else {
      el.classList.add('typing-done');
    }
  };
  setTimeout(tick, 0);
}

function cancelAll() {
  if (abortCurrent) abortCurrent();
  unlock();
}

const JORNADA_TYPE = {
  run,
  typeIt,
  cancelAll,
  get locked() {
    return ACTIVE;
  }
};

window.JORNADA_TYPE = JORNADA_TYPE;
window.runTyping = run; // Para compatibilidade com jornada-paper-qa.js

log('Pronto');

export default JORNADA_TYPE;
