import i18n from '/public/assets/js/i18n.js';

const typingLog = (...args) => console.log('[TypingBridge]', ...args);

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
        typingLog('Recebido elemento DOM, convertido para seletor:', selector);
    } else {
        console.error('[TypingBridge] Argumento inválido:', selectorOrElement);
        if (callback) callback();
        return;
    }

    const el = document.querySelector(selector);
    if (!el) {
        console.warn('[TypingBridge] Elemento não encontrado:', selector);
        if (callback) callback();
        return;
    }

    try {
        await i18n.waitForReady(5000);
        typingLog('i18n pronto, idioma:', i18n.lang || 'pt-BR (fallback)');

        if (typeof window.Typewriter === 'function') {
            const tw = new window.Typewriter(el, {
                delay: 22,
                cursor: ''
            });
            const text = el.getAttribute('data-text') || i18n.t(el.getAttribute('data-i18n-key') || 'welcome', { ns: 'common' }) || el.textContent || '';
            tw.typeString(text)
              .start()
              .callFunction(() => {
                  typingLog('Animação de digitação concluída para:', selector);
                  if (callback) callback();
              });
        } else {
            console.warn('[TypingBridge] window.Typewriter não definido, aplicando fallback');
            el.textContent = el.getAttribute('data-text') || i18n.t(el.getAttribute('data-i18n-key') || 'welcome', { ns: 'common' }) || el.textContent || '';
            if (callback) callback();
        }

        if ('speechSynthesis' in window && el.textContent) {
            const utt = new SpeechSynthesisUtterance(el.textContent.trim());
            utt.lang = i18n.lang || 'pt-BR';
            utt.rate = 1.03;
            utt.pitch = 1.0;
            utt.volume = window.isMuted ? 0 : 1;
            utt.onend = () => typingLog('Leitura concluída para:', el.textContent);
            utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
            speechSynthesis.cancel();
            speechSynthesis.speak(utt);
            typingLog('Iniciando leitura com idioma:', utt.lang);
        } else {
            console.warn('[TypingBridge] SpeechSynthesis não suportado ou texto ausente');
            if (callback) callback();
        }
    } catch (e) {
        console.error('[TypingBridge] Erro:', e);
        el.textContent = el.getAttribute('data-text') || i18n.t(el.getAttribute('data-i18n-key') || 'welcome', { ns: 'common' }) || el.textContent || '';
        if (callback) callback();
    }
}

const TypingBridge = {
    play: playTypingAndSpeak,
};

window.TypingBridge = TypingBridge;
window.runTyping = playTypingAndSpeak;

typingLog('Pronto');

export default TypingBridge;
