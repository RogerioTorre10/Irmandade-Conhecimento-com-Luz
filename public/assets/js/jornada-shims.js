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
