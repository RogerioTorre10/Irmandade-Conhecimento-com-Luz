import i18n from './i18n.js'

const typingLog = (...args) => console.log('[JORNADA_TYPE]', ...args);

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

function readText(text) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) {
      typingLog('Leitura não suportada');
      return resolve();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.lang || 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

async function typeNode(node, fullText, { speed = 18, delay = 0, showCaret = true } = {}) {
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
  if (!abort) node.classList.add('typing-done');
  abortCurrent = null;

  if (!abort && fullText) {
    await readText(fullText);
  }
}

async function runTypingSequence(scope = document) {
  if (ACTIVE) {
    typingLog('Já em execução, ignorando');
    return;
  }
  lock();
  try {
    const nodes = Array.from(scope.querySelectorAll('[data-typing="true"][data-text]'));
    for (const node of nodes) {
      const raw = node.getAttribute('data-text');
      const speed = parseInt(node.getAttribute('data-speed')) || 22;
      const showCaret = node.getAttribute('data-cursor') !== 'false';
      const translated = i18n.t(raw, raw);
      await typeNode(node, translated, { speed, showCaret });
    }
  } catch (err) {
    console.error('[JORNADA_TYPE] Erro na sequência:', err);
  } finally {
    unlock();
  }
}

window.runTypingSequence = runTypingSequence;
typingLog('Sincronizador de digitação + leitura pronto');
