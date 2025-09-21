/* -------------------------------------------
 * JORNADA SHIMS v5 – garante funções globais
 * ------------------------------------------- */

(function () {
  // Helpers leves
  const q  = (sel, root=document) => root.querySelector(sel);
  const qa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Evita quebra se console não existir (navegadores antigos)
  window.console = window.console || { log(){}, warn(){}, error(){} };

  // Classe usada para esconder seções
  const HIDE_CLASS = 'section-hidden';

  // Garante a classe CSS básica (uma vez)
  if (!q('#jornada-shims-style')) {
    const st = document.createElement('style');
    st.id = 'jornada-shims-style';
    st.textContent = `
      .${HIDE_CLASS}{ display:none !important; }
      section[id^="section-"]{ width:100%; }
    `;
    document.head.appendChild(st);
  }

  // Implementa showSection global esperado pelo controller
  function showSection(id) {
    try {
      const all = qa('section[id^="section-"]');
      const target = q(`#${id}`);
      if (!target) {
        console.warn('[SHIMS] showSection: seção não encontrada:', id);
        return;
      }
      all.forEach(s => s.classList.add(HIDE_CLASS));
      target.classList.remove(HIDE_CLASS);

      // Marca atualmente ativa
      window.__currentSectionId = id;
      console.log('[SHIMS] Seção ativa:', id);
    } catch (e) {
      console.error('[SHIMS] Erro showSection:', e);
    }
  }
 
/* Delegação simples para navegar por data-next */
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action="next"]');
  if (!btn) return;
  ev.preventDefault();
  const next = btn.getAttribute('data-next');
  if (next && typeof window.showSection === 'function') {
    window.showSection(next);
  } else {
    console.warn('[NAV] Botão sem data-next ou showSection indisponível.');
  }
});

  // Exponha no escopo global, pois o controller chama "window.showSection"
  window.showSection = showSection;

  // Utilidades globais que vários módulos usam
  window.q  = window.q  || q;
  window.qa = window.qa || qa;

  // No-ops para módulos ausentes (evita travar o boot se não carregarem)
  window.toast       = window.toast       || function(){ /* noop */ };
  window.runTyping   = window.runTyping   || function(){ /* noop seguro */ };
  window.ensureHeaderFlame = window.ensureHeaderFlame || function(){ /* noop */ };

  // Opção: defina uma seção inicial padrão se nada estiver visível
  document.addEventListener('DOMContentLoaded', () => {
    const visible = qa('section[id^="section-"]').find(s => !s.classList.contains(HIDE_CLASS));
    if (!visible) {
      // fallback padrão
      if (q('#section-intro')) showSection('section-intro');
    }
  });
})();

/* ==== SHIMS EXTRA p/ Controller v5 ==== */

// Placeholders p/ módulos que o bootstrap "sente falta".
// (Se os módulos reais carregarem depois, eles sobrescrevem estes.)
window.CONFIG     = window.CONFIG     || {};
window.JUtils     = window.JUtils     || {};
window.JCore      = window.JCore      || {};
window.JAuth      = window.JAuth      || {};
window.JChama     = window.JChama     || {};
window.JPaperQA   = window.JPaperQA   || {};
window.JTyping    = window.JTyping    || {};
window.JController= window.JController|| {};
window.JRender    = window.JRender    || {};
window.JBootstrap = window.JBootstrap || {};
window.JMicro     = window.JMicro     || {};
window.I18N       = window.I18N       || {};
window.API        = window.API        || { base: (window.API_BASE || '' ) };

// Handler leve para textareas/inputs das perguntas
window.handleInput = window.handleInput || function handleInput(ev){
  try {
    const el = ev && ev.target ? ev.target : null;
    if (!el) return;
    // Ex.: espelho de contagem, validação básica e debounce (se quiser evoluir depois)
    const max = parseInt(el.getAttribute('maxlength') || '0', 10);
    if (max > 0 && el.value.length > max) el.value = el.value.slice(0, max);
    el.dataset.touched = '1';
  } catch(e){
    console.error('[SHIMS] handleInput erro:', e);
  }
};

// Ponte mínima de datilografia + TTS para a 1ª pergunta do bloco
window.JORNADA_TYPE = window.JORNADA_TYPE || {
  run(rootSelector = '#perguntas-container') {
    try {
      const root = typeof rootSelector === 'string' ? q(rootSelector) : rootSelector;
      if (!root) { console.warn('[JORNADA_TYPE] root não encontrado'); return; }

      // 1) se houver bloco visível, pega o primeiro texto alvo p/ datilografia
      const firstText = q('[data-type="texto"], .j-texto, p, .typing', root);
      if (firstText && window.TypingBridge && typeof window.TypingBridge.play === 'function') {
        window.TypingBridge.play(firstText);
      }

      // 2) garanta listeners nas primeiras áreas de resposta
      qa('textarea, input[type="text"], input[type="search"]', root)
        .forEach(el => {
          el.removeEventListener('input', window.handleInput);
          el.addEventListener('input', window.handleInput);
        });

      console.log('[JORNADA_TYPE] run concluído');
    } catch (e) {
      console.error('[JORNADA_TYPE] erro:', e);
    }
  }
};
