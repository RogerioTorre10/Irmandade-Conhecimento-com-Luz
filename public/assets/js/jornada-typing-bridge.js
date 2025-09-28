import i18n from './i18n.js';

const log = (...args) => console.log('[TypingBridge]', ...args);

if (window.__TypingBridgeReady) {
  console.log('[TypingBridge] Já carregado, ignorando');
  throw new Error('TypingBridge já carregado');
}
window.__TypingBridgeReady = true;

const q = window.q || ((s, r = document) => r.querySelector(s));
const qa = window.qa || ((s, r = document) => Array.from(r.querySelectorAll(s)));

function playTypingAndSpeak(selectorOrElement, callback) {
    let selector;
    if (typeof selectorOrElement === 'string') {
        selector = selectorOrElement;
    } else if (selectorOrElement instanceof HTMLElement) {
        selector = selectorOrElement.id
            ? `#${selectorOrElement.id}`
            : selectorOrElement.className.split(' ')[0]
            ? `.${selectorOrElement.className.split(' ')[0]}`
            : `[data-typing="true"]`;
        console.warn('[TypingBridge] Recebido elemento DOM, convertido para seletor:', selector);
    } else {
        console.error('[TypingBridge] Argumento inválido:', selectorOrElement);
        return;
    }

    const el = q(selector);
    if (!el) {
        console.warn('[TypingBridge] Elemento não encontrado:', selector);
        return;
    }

    try {
        if (typeof window.Typewriter === 'function') {
            const tw = new window.Typewriter(el, {
                delay: 22,
                cursor: ''
            });
            tw.typeString(el.getAttribute('data-text') || el.textContent || '')
              .start()
              .callFunction(() => {
                  console.log('[TypingBridge] Animação de digitação concluída para:', selector);
                  if (callback) callback();
              });
        } else {
            console.warn('[TypingBridge] window.Typewriter não definido, aplicando fallback');
            el.textContent = el.getAttribute('data-text') || el.textContent || '';
        }

        if ('speechSynthesis' in window && el.textContent) {
            const utt = new SpeechSynthesisUtterance(el.textContent.trim());
            utt.lang = i18n.lang || 'pt-BR';
            utt.rate = 1.03;
            utt.pitch = 1.0;
            utt.volume = window.isMuted ? 0 : 1;
            utt.onend = () => console.log('[TypingBridge] Leitura concluída para:', el.textContent);
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
