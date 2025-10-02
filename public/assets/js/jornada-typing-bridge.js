/* jornada-terms-controller-v2.js — drop‑in
 * Resolve travamento na página de Termos:
 *  - Habilita o botão "Aceito e quero continuar" somente quando os checkboxes estiverem ok (se existirem).
 *  - Navega para a próxima seção com showSection, respeitando data-next se definido no HTML.
 *  - Funciona mesmo com conteúdo carregado via i18n/dinâmico (escuta o evento jornada:section:shown e bootstrapComplete).
 *  - Não depende de JCore/JC — usa apenas showSection e o DOM.
 */
(function(){
  const HIDE_CLASS = 'hidden';

  function getVisibleSection(){
    return document.querySelector(`div[id^="section-"]:not(.${HIDE_CLASS})`);
  }

  function getNextFrom(elOrId){
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return null;
    // 1) data-next no container da seção
    if (el.dataset && el.dataset.next) return el.dataset.next;
    // 2) data-next no botão (pegaremos no click também)
    // 3) fallback por convenção comum
    const map = {
      'section-intro': 'section-termos',
      'section-termos': 'section-video',
      'section-video': 'section-guia',
      'section-guia': 'section-selfie'
    };
    return map[el.id] || null;
  }

  function selectTermsElements(sec){
    // Suporta múltiplas variações de markup
    const acceptBtn = sec.querySelector('[data-action="accept-terms"], [data-action="continue"], .btn-aceito, button[name="accept-terms"]');
    const rejectBtn = sec.querySelector('[data-action="reject-terms"], .btn-recusar, button[name="reject-terms"]');
    const checks = sec.querySelectorAll('input[type="checkbox"].terms-accept, [data-terms-check]');
    return { acceptBtn, rejectBtn, checks: Array.from(checks) };
  }

  function allChecked(checks){
    if (!checks || !checks.length) return true; // se não há checkboxes, não bloqueia
    return checks.every(c => !!c.checked);
  }

  function wireTerms(sec){
    if (!sec || sec.dataset.termsBound === '1') return;
    sec.dataset.termsBound = '1';

    const { acceptBtn, rejectBtn, checks } = selectTermsElements(sec);

    function updateState(){
      const ok = allChecked(checks);
      if (acceptBtn) acceptBtn.disabled = !ok;
    }

    checks.forEach(c => c.addEventListener('change', updateState));
    updateState();

    if (acceptBtn){
      acceptBtn.type = acceptBtn.type || 'button'; // evita submit de formulário acidental
      acceptBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (acceptBtn.disabled){
          window.toast && window.toast('Marque que leu e aceita os termos para continuar.');
          return;
        }
        window.G = window.G || {}; window.G.termsAccepted = true;
        // data-next no botão tem prioridade
        const btnNext = acceptBtn.dataset && acceptBtn.dataset.next ? acceptBtn.dataset.next : null;
        const next = btnNext || getNextFrom(sec) || 'section-video';
        // pequeno atraso para não brigar com outros handlers
        setTimeout(() => { try { window.showSection && window.showSection(next); } catch(e){} }, 10);
      });
    }

    if (rejectBtn){
      rejectBtn.type = rejectBtn.type || 'button';
      rejectBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const back = rejectBtn.dataset && rejectBtn.dataset.back ? rejectBtn.dataset.back : 'section-intro';
        try { window.showSection && window.showSection(back); } catch(e){}
      });
    }
  }

  function onSectionShown(id){
    if (id !== 'section-termos') return;
    const sec = document.getElementById(id);
    if (!sec) return;
    wireTerms(sec);
  }

  // Integrações com o ciclo de vida da página
  document.addEventListener('jornada:section:shown', (e) => onSectionShown(e.detail && e.detail.id));
  window.addEventListener('bootstrapComplete', () => {
    const sec = document.getElementById('section-termos');
    if (sec && !sec.classList.contains(HIDE_CLASS)) wireTerms(sec);
  });

  // Fallback manual (caso a seção já esteja visível antes dos eventos)
  document.addEventListener('DOMContentLoaded', () => {
    const visible = getVisibleSection();
    if (visible && visible.id === 'section-termos') wireTerms(visible);
  });
})();
