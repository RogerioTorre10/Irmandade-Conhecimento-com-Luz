// /public/assets/js/jornada-typing-bridge.js
import i18n from './i18n.js'; // Ajuste o caminho conforme necessário

// Protege repetição de carga
if (window.__TypingBridgeReady) {
  console.log('[TypingBridge] Já carregado, ignorando');
  throw new Error('TypingBridge já carregado');
}
window.__TypingBridgeReady = true;

const log = (...args) => console.log('[TypingBridge]', ...args);

// Utilitários de seleção
const q = window.q || ((s, r = document) => r.querySelector(s));
const qa = window.qa || ((s, r = document) => Array.from(r.querySelectorAll(s)));

// Função para digitação e fala
function playTypingAndSpeak(selector) {
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
    }

    // Síntese de voz
    if ('speechSynthesis' in window && el && el.textContent) {
      const utt = new SpeechSynthesisUtterance(el.textContent.trim());
      utt.lang = i18n.lang || 'pt-BR';
      utt.rate = 1.03;
      utt.pitch = 1.0;
      utt.volume = window.isMuted ? 0 : 1;
      speechSynthesis.cancel(); // Evita acumular
      speechSynthesis.speak(utt);
    } else {
      console.warn('[TypingBridge] SpeechSynthesis não suportado ou texto ausente');
    }
  } catch (e) {
    console.error('[TypingBridge] Erro:', e);
  }
}

// Exportar API
const TypingBridge = {
  play: playTypingAndSpeak
};

window.TypingBridge = TypingBridge; // Para compatibilidade
window.runTyping = playTypingAndSpeak; // Para jornada-paper-qa.js e jornada-controller.js

log('Pronto');

export default TypingBridge;
