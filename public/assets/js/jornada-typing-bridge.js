/* -------------------------------------------
 * JORNADA TYPING BRIDGE v5 – versão segura
 * ------------------------------------------- */

(function(){
  // Protege repetição de carga
  if (window.__TypingBridgeReady) return;
  window.__TypingBridgeReady = true;

  const q  = window.q  || ((s,r=document)=>r.querySelector(s));
  const qa = window.qa || ((s,r=document)=>Array.from(r.querySelectorAll(s)));

  // Hook simples que orquestra datilografia + TTS se existirem
  function playTypingAndSpeak(selector) {
    try {
      const el = q(selector);
      if (!el) {
        console.warn('[TypingBridge] elemento não encontrado:', selector);
        return;
      }

      // Se existir motor de datilografia da casa
      if (typeof window.TypeWriter === 'function') {
        const tw = new window.TypeWriter(el, { speed: 22, cursor: false });
        tw.start && tw.start();
      }

      // Se existir TTS próprio
      if ('speechSynthesis' in window && el && el.textContent) {
        const utt = new SpeechSynthesisUtterance(el.textContent.trim());
        utt.rate = 1.03;  // levemente mais natural
        utt.pitch = 1.0;
        utt.volume = (window.isMuted ? 0 : 1);
        speechSynthesis.cancel(); // evita acumular
        speechSynthesis.speak(utt);
      }
    } catch (e) {
      console.error('[TypingBridge] erro:', e);
    }
  }

  // Exporte API mínima usada pelos outros módulos
  window.TypingBridge = {
    play: playTypingAndSpeak
  };

  console.log('[TypingBridge] pronto');
})();
