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

/* Delegação só se houver data-next; caso contrário, não faz nada */
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action="next"][data-next]');
  if (!btn) return;               // sem data-next -> ignora silencioso
  ev.preventDefault();
  ev.stopPropagation();           // evita dupla manobra se outro handler existir
  const next = btn.getAttribute('data-next');
  if (typeof window.showSection === 'function') {
    window.showSection(next);
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

// Placeholders p/ módulos ausentes
window.CONFIG      = window.CONFIG      || {};
window.JUtils      = window.JUtils      || {};
window.JCore       = window.JCore       || {};
window.JAuth       = window.JAuth       || {};
window.JChama      = window.JChama      || {};
window.JPaperQA    = window.JPaperQA    || {};
window.JTyping     = window.JTyping     || {};
window.JController = window.JController || {};
window.JRender     = window.JRender     || {};
window.JBootstrap  = window.JBootstrap  || {};
window.JMicro      = window.JMicro      || {};
window.I18N        = window.I18N        || {};
window.API         = window.API         || { base: (window.API_BASE || '') };

// Handler leve p/ textareas/inputs
window.handleInput = window.handleInput || function handleInput(ev){
  try {
    const el = ev && ev.target ? ev.target : null;
    if (!el) return;
    const max = parseInt(el.getAttribute('maxlength') || '0', 10);
    if (max > 0 && el.value.length > max) el.value = el.value.slice(0, max);
    el.dataset.touched = '1';
  } catch(e){
    console.error('[SHIMS] handleInput erro:', e);
  }
};

// Ponte mínima de datilografia + TTS
window.JORNADA_TYPE = window.JORNADA_TYPE || {
  run(rootSelector = '#perguntas-container') {
    try {
      const root = (typeof rootSelector === 'string')
        ? (window.q ? q(rootSelector) : document.querySelector(rootSelector))
        : rootSelector;

      if (!root) { console.warn('[JORNADA_TYPE] root não encontrado'); return; }

      // Datilografia + TTS se disponíveis
      const firstText = (window.q ? q('[data-type="texto"], .j-texto, p, .typing', root)
                                  : root.querySelector('[data-type="texto"], .j-texto, p, .typing'));
      if (firstText && window.TypingBridge && typeof window.TypingBridge.play === 'function') {
        window.TypingBridge.play(firstText);
      }

      // Listeners nos campos de resposta
      const inputs = (window.qa ? qa('textarea, input[type="text"], input[type="search"]', root)
                                : Array.from(root.querySelectorAll('textarea, input[type="text"], input[type="search"]')));
      inputs.forEach(el => {
        el.removeEventListener('input', window.handleInput);
        el.addEventListener('input', window.handleInput);
      });

      console.log('[JORNADA_TYPE] run concluído');
    } catch (e) {
      console.error('[JORNADA_TYPE] erro:', e);
    }
  }
};

