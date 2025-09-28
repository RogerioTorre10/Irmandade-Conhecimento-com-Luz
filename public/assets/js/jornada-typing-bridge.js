import i18n from './i18n.js';

const log = (...args) => console.log('[TypingBridge]', ...args);

if (window.__TypingBridgeReady) {
    console.log('[TypingBridge] Já carregado, ignorando');
    throw new Error('TypingBridge já carregado');
}
window.__TypingBridgeReady = true;

const log = (...args) => console.log('[TypingBridge]', ...args);

const q = window.q || ((s, r = document) => r.querySelector(s));
const qa = window.qa || ((s, r = document) => Array.from(r.querySelectorAll(s)));

async function playTypingAndSpeak(selectorOrElement, callback) {
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
        if (callback) callback();
        return;
    }

    const el = q(selector);
    if (!el) {
        console.warn('[TypingBridge] Elemento não encontrado:', selector);
        if (callback) callback();
        return;
    }

    try {
        // Aguarda i18n estar pronto (com timeout pra não travar)
        await i18n.waitForReady(5000);
        log('i18n pronto, idioma:', i18n.lang || 'pt-BR (fallback)');

        // Animação de digitação
        if (typeof window.Typewriter === 'function') {
            const tw = new window.Typewriter(el, {
                delay: 22, // Velocidade de digitação (ms por caractere)
                cursor: '' // Desativa cursor
            });
            tw.typeString(el.getAttribute('data-text') || el.textContent || '')
              .start()
              .callFunction(() => {
                  log('Animação de digitação concluída para:', selector);
                  if (callback) callback();
              });
        } else {
            console.warn('[TypingBridge] window.Typewriter não definido, aplicando fallback');
            el.textContent = el.getAttribute('data-text') || el.textContent || '';
            if (callback) callback();
        }

        // Leitura de texto (SpeechSynthesis)
        if ('speechSynthesis' in window && el.textContent) {
            const utt = new SpeechSynthesisUtterance(el.textContent.trim());
            utt.lang = i18n.lang || 'pt-BR'; // Fallback pra pt-BR se i18n falhar
            utt.rate = 1.03;
            utt.pitch = 1.0;
            utt.volume = window.isMuted ? 0 : 1;
            utt.onend = () => log('Leitura concluída para:', el.textContent);
            utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
            speechSynthesis.cancel(); // Limpa fila de leitura
            speechSynthesis.speak(utt);
            log('Iniciando leitura com idioma:', utt.lang);
        } else {
            console.warn('[TypingBridge] SpeechSynthesis não suportado ou texto ausente');
            if (callback) callback();
        }
    } catch (e) {
        console.error('[TypingBridge] Erro:', e);
        // Fallback: exibe texto sem animação e prossegue
        el.textContent = el.getAttribute('data-text') || el.textContent || '';
        if (callback) callback();
    }
}

const TypingBridge = {
    play: playTypingAndSpeak,
};

window.TypingBridge = TypingBridge;
window.runTyping = playTypingAndSpeak;

log('Pronto');

export default TypingBridge;
