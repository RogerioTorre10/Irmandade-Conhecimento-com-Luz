import i18n from './i18n.js';

if (window.__TypingBridgeReady) {
  console.log('[TypingBridge] Já carregado, ignorando');
  throw new Error('TypingBridge já carregado');
}
window.__TypingBridgeReady = true;

const log = (...args) => console.log('[TypingBridge]', ...args);

const q = window.q || ((s, r = document) => r.querySelector(s));
const qa = window.qa || ((s, r = document) => Array.from(r.querySelectorAll(s)));

function playTypingAndSpeak(selectorOrElement) {
  let selector;
  if (typeof selectorOrElement === 'string') {
    selector = selectorOrElement;
  } else if (selectorOrElement instanceof HTMLElement) {
    // Tenta usar id ou classe, ou gera um seletor único
    selector = selectorOrElement.id
      ? `#${selectorOrElement.id}`
      : selectorOrElement.className.split(' ')[0]
      ? `.${selectorOrElement.className.split(' ')[0]}`
      : `[data-typing="true"]`; // Fallback genérico
    console.warn('[TypingBridge] Recebido elemento DOM, convertido para seletor:', selector);
  } else {
    console.error('[TypingBridge] Argumento inválido:', selectorOrElement);
    return;
  }

  try {
    const el = q(selector);
    if (!el) {
      console.warn('[TypingBridge] Elemento não encontrado:', selector);
      return;
    }

    // Efeito de digitação
    if (typeof window.TypeWriter === 'function') {
      const tw = new window.TypeWriter(el, { speed: 22, cursor: false });
      tw.start && tw.start();
    } else {
      console.warn('[TypingBridge] window.TypeWriter não definido, pulando digitação');
      // Fallback simples
      el.textContent = el.getAttribute('data-text') || el.textContent;
    }

    // Síntese de voz
    if ('speechSynthesis' in window && el && el.textContent) {
      const utt = new SpeechSynthesisUtterance(el.textContent.trim());
      utt.lang = i18n.lang || 'pt-BR';
      utt.rate = 1.03;
      utt.pitch = 1.0;
      utt.volume = window.isMuted ? 0 : 1;
      speechSynthesis.cancel();
      speechSynthesis.speak(utt);
    } else {
      console.warn('[TypingBridge] SpeechSynthesis não suportado ou texto ausente');
    }
  } catch (e) {
    console.error('[TypingBridge] Erro:', e);
  }
}

const TypingBridge = {
  play: playTypingAndSpeak,
};

window.TypingBridge = TypingBridge;
window.runTyping = playTypingAndSpeak;

log('Pronto');

export default TypingBridge;
