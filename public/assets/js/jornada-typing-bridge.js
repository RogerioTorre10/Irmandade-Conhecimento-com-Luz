/* jornada-typing-bridge.js — v2 (drop‑in)
 * Corrige:
 * 1) "[TypingBridge] Nenhum container/elemento encontrado" (aguarda a seção estar visível e procura por vários seletores) 
 * 2) Erros de TTS "interrupted" (ignora interrupções esperadas e evita fala em duplicidade)
 * 3) Integra com showSection (dispara leitura e datilografia somente quando há conteúdo)
 *
 * Como usar:
 * - Substitua o conteúdo de /assets/js/jornada-typing-bridge.js por este arquivo.
 * - Garanta que os parágrafos a serem lidos/datilografados tenham um destes seletores:
 *     [data-typing]  |  .typing-text  |  .text
 * - Opcional: ajuste selectors/voz em window.TypingBridgeConfig antes do load do script.
 */
(function () {
  const HIDE_CLASS = 'hidden';
  const cfg = window.TypingBridgeConfig || {};
  const SELECTORS = cfg.selectors || ['[data-typing]', '.typing-text', '.text'];
  const LANG = cfg.lang || 'pt-BR';
  const RATE = typeof cfg.rate === 'number' ? cfg.rate : 1.0; // 0.8 ~ 1.2
  const PITCH = typeof cfg.pitch === 'number' ? cfg.pitch : 1.0; // 0.8 ~ 1.2

  const state = {
    currentSectionId: null,
    playing: false,
  };

  function visibleSections() {
    return Array.from(
      document.querySelectorAll(`div[id^="section-"]:not(.${HIDE_CLASS})`)
    );
  }

  function findTargets(root) {
    for (const sel of SELECTORS) {
      const els = root.querySelectorAll(sel);
      if (els && els.length) return { els: Array.from(els), sel };
    }
    return { els: [], sel: null };
  }

  function collectText(els) {
    return els
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean)
      .join('\n\n');
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      console.warn('[TypingBridge] speechSynthesis não suportado neste navegador.');
      return;
    }
    if (!text) return;

    try { window.speechSynthesis.cancel(); } catch (e) {}

    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG;
    u.rate = RATE;
    u.pitch = PITCH;

    u.onend = () => {
      state.playing = false;
      // console.log('[TypingBridge] Fala concluída');
    };
    u.onerror = (ev) => {
      // 'interrupted' é normal quando trocamos de seção/atualizamos conteúdo
      if (ev && ev.error === 'interrupted') return;
      console.warn('[TypingBridge] TTS error:', ev && ev.error ? ev.error : ev);
      state.playing = false;
    };

    state.playing = true;
    window.speechSynthesis.speak(u);
  }

  function runTypingIfAvailable(els) {
    if (typeof window.runTyping === 'function') {
      try {
        window.runTyping(els);
      } catch (e) {
        console.warn('[TypingBridge] runTyping falhou:', e);
      }
    }
  }

  function maybeRun(root) {
    if (!root) return;
    const { els, sel } = findTargets(root);
    if (!els.length) {
      // Debug brando; evita spam no console
      console.debug('[TypingBridge] Nenhum alvo encontrado em', root.id || root, '(', SELECTORS.join(', '), ')');
      return;
    }

    console.log('[TypingBridge] Alvos:', els.length, 'selector:', sel);

    // Dispara datilografia se existir implementação anterior
    runTypingIfAvailable(els);

    // Concatena texto e fala
    const text = collectText(els);
    speak(text);
  }

  function onSectionShown(id) {
    const el = document.getElementById(id);
    if (!el) return;
    state.currentSectionId = id;
    // Pequeno atraso para permitir carregamento dinâmico/i18n
    setTimeout(() => maybeRun(el), 80);
  }

  // Monkey‑patch de showSection para emitir um evento padronizado
  const originalShow = window.showSection;
  window.showSection = function (id) {
    const r = typeof originalShow === 'function' ? originalShow(id) : undefined;
    try {
      document.dispatchEvent(
        new CustomEvent('jornada:section:shown', { detail: { id } })
      );
    } catch (e) {}
    return r;
  };

  // Reage quando uma seção fica visível
  document.addEventListener('jornada:section:shown', (e) => onSectionShown(e.detail.id));

  // Tenta executar no bootstrap para a seção inicialmente visível
  window.addEventListener('bootstrapComplete', () => {
    const visible = visibleSections();
    if (visible[0]) maybeRun(visible[0]);
  });

  // API pública opcional
  window.TypingBridge = {
    play(root = null) {
      if (root) return maybeRun(root);
      const visible = visibleSections();
      if (visible[0]) maybeRun(visible[0]);
    },
    speak,
    config: { SELECTORS, LANG, RATE, PITCH },
  };
})();
