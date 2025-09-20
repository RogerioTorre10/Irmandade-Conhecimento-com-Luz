<!-- /jornada-typing-bridge.js -->
<script>
;(function () {
  // --- TTS seguro (speak / readAloud) ---
  if (!window.speak) {
    window.speak = function (text = '') {
      try {
        if (!('speechSynthesis' in window)) return;
        const u = new SpeechSynthesisUtterance(String(text || ''));
        const cfg = (window.JORNADA && JORNADA.tts) || {};
        u.lang  = cfg.lang  || 'pt-BR';
        u.rate  = Number(cfg.rate  ?? 1.06);
        u.pitch = Number(cfg.pitch ?? 1.0);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {}
    };
  }
  if (!window.readAloud) window.readAloud = (t) => window.speak(t);

  // --- Adapter: runTyping -> JORNADA_TYPO.typeAll ---
  function runTypingAdapter(root) {
    try {
      const target = root || document.getElementById('jornada-conteudo') || '#jornada-conteudo';
      if (window.JORNADA_TYPO && typeof JORNADA_TYPO.typeAll === 'function') {
        JORNADA_TYPO.typeAll(target);
      }
    } catch {}
  }
  if (!window.runTyping) window.runTyping = runTypingAdapter;

  // --- Reaplicar quando o conteúdo do pergaminho mudar ---
  function autoHook() {
    const el = document.getElementById('jornada-conteudo');
    if (!el) return;
    let t;
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => runTypingAdapter(el), 80);
    });
    mo.observe(el, { childList: true, subtree: true });
    // primeira passada
    setTimeout(() => runTypingAdapter(el), 0);
  }

  // tenta rodar assim que possível
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoHook, { once: true });
  } else {
    autoHook();
  }

  console.log('[TypingBridge] pronto');
})();
</script>
