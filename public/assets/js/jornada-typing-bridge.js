import i18n from './i18n.js'

if (window.__TypingBridgeReady) {
  console.log('[TypingBridge] Já carregado, ignorando');
  throw new Error('TypingBridge já carregado');
}
window.__TypingBridgeReady = true;

const typingLog = (...args) => console.log('[TypingBridge]', ...args);

const q = window.q || ((s, r = document) => r.querySelector(s));
const qa = window.qa || ((s, r = document) => Array.from(r.querySelectorAll(s)));

async function typeText(element, text, speed = 40, showCursor = false) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';
    if (showCursor) element.classList.add('typing-cursor');

    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (showCursor) element.classList.remove('typing-cursor');
        resolve();
      }
    }, speed);
  });
}

async function playTypingAndSpeak(selector = '.text') {
  console.log('[TypingBridge] Procurando elementos com seletor:', selector);
  const elements = document.querySelectorAll(selector);
  console.log('[TypingBridge] Elementos encontrados:', elements.length, elements);
  if (!elements.length) {
    console.warn('[TypingBridge] Seletor não encontrou elementos:', selector);
    return;
  }
  // ... resto do código
}
  for (const el of elements) {
    const text = el.textContent || el.dataset.i18n || '';
    await typeEffect(el, text, 36); // Ajustar velocidade conforme necessário
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  }
  console.log('[TypingBridge] Animação e leitura concluídas');
}

async function typeEffect(element, text, delay = 36) {
  element.textContent = '';
  element.classList.add('typing-cursor');
  for (let char of text) {
    element.textContent += char;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  element.classList.remove('typing-cursor');
}

async function playTypingAndSpeak(selectorOrElement, callback) {
  let container;

  if (typeof selectorOrElement === 'string') {
    try {
      container = document.querySelector(selectorOrElement);
      if (!container) {
        console.warn('[TypingBridge] Seletor não encontrou elementos:', selectorOrElement);
        if (callback) callback();
        return;
      }
    } catch (e) {
      console.error('[TypingBridge] Seletor inválido:', selectorOrElement, e);
      if (callback) callback();
      return;
    }
  } else if (selectorOrElement instanceof HTMLElement) {
    container = selectorOrElement;
  } else {
    console.error('[TypingBridge] Argumento inválido:', selectorOrElement);
    if (callback) callback();
    return;
  }

  if (!container) {
    console.warn('[TypingBridge] Container não encontrado:', selectorOrElement);
    if (callback) callback();
    return;
  }

  // Incluir o próprio container se tiver data-typing
  const elementos = container.hasAttribute('data-typing')
    ? [container]
    : container.querySelectorAll('[data-typing]');

  if (!elementos.length) {
    console.warn('[TypingBridge] Nenhum elemento com data-typing encontrado em:', container);
    if (callback) callback();
    return;
  }

  try {
    await i18n.waitForReady(5000);
    typingLog('i18n pronto, idioma:', i18n.lang || 'pt-BR (fallback)');

    for (const el of elementos) {
      const texto = el.getAttribute('data-text') || 
                    i18n.t(el.getAttribute('data-i18n-key') || el.getAttribute('data-i18n') || 'welcome', { ns: 'common' }) || 
                    el.textContent || '';
      const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
      const mostrarCursor = el.getAttribute('data-cursor') === 'true';

      if (!texto) {
        console.warn('[TypingBridge] Texto não encontrado para elemento:', el);
        continue;
      }

      await typeText(el, texto, velocidade, mostrarCursor);

      if ('speechSynthesis' in window && texto) {
        const utt = new SpeechSynthesisUtterance(texto.trim());
        utt.lang = i18n.lang || 'pt-BR';
        utt.rate = 1.03;
        utt.pitch = 1.0;
        utt.volume = window.isMuted ? 0 : 1;
        utt.onend = () => typingLog('Leitura concluída para:', texto);
        utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
        speechSynthesis.cancel();
        speechSynthesis.speak(utt);
        typingLog('Iniciando leitura com idioma:', utt.lang);
      } else {
        console.warn('[TypingBridge] SpeechSynthesis não suportado ou texto ausente');
      }
    }

    if (callback) callback();
  } catch (e) {
    console.error('[TypingBridge] Erro:', e);
    if (callback) callback();
  }
}

// ... (resto do código, incluindo a função playTypingAndSpeak)

const TypingBridge = {
  play: playTypingAndSpeak,
};

window.TypingBridge = TypingBridge;
window.runTyping = playTypingAndSpeak;

typingLog('Pronto');

// Executar após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => playTypingAndSpeak('.text'), 1000); // Atraso de 1 segundo
});

export default TypingBridge;
