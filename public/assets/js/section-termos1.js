(function () {
  'use strict';

  const SECTION_ID = 'section-termos1';
  const PREV_SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos2';
  const HIDE_CLASS = 'hidden';

  if (window.JCTermos1?.__bound) {
    console.log('[JCTermos1] já carregado');
    return;
  }

  window.JCTermos1 = window.JCTermos1 || {};
  window.JCTermos1.__bound = true;
  window.JCTermos1.state = {
    ready: false,
    listenerOn: false
  };

  const q = (sel, root = document) => root.querySelector(sel);

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  async function waitForTransitionUnlock(timeoutMs = 10000) {
    if (!window.__TRANSITION_LOCK) return;

    let resolved = false;

    const p = new Promise((resolve) => {
      const onEnd = () => {
        if (!resolved) {
          resolved = true;
          document.removeEventListener('transition:ended', onEnd);
          resolve();
        }
      };
      document.addEventListener('transition:ended', onEnd, { once: true });
    });

    const t = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([p, t]);
  }

  function pick(root) {
    const scope = root.querySelector('#termos1') || root;

    return {
      root,
      scope,
      btnNext: scope.querySelector('[data-action="avancar"]') || q('#btn-termos1-avancar', root),
      btnPrev: scope.querySelector('[data-action="voltar"]') || q('#btn-termos1-voltar', root)
    };
  }

  async function initOnce(root) {
    if (!root) return;

    await waitForTransitionUnlock();
    ensureVisible(root);

    const { btnNext, btnPrev } = pick(root);

    if (btnPrev && btnPrev.dataset.termos1Bound !== '1') {
      btnPrev.dataset.termos1Bound = '1';
      btnPrev.addEventListener('click', () => {
        try { window.speechSynthesis?.cancel?.(); } catch {}
        window.JC?.show?.(PREV_SECTION_ID) ?? history.back();
      });
    }

    if (btnNext && btnNext.dataset.termos1Bound !== '1') {
      btnNext.dataset.termos1Bound = '1';
      btnNext.addEventListener('click', () => {
        try { window.speechSynthesis?.cancel?.(); } catch {}
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      });
    }

    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');

    btnNext?.classList?.add('btn-ready-pulse');
    setTimeout(() => btnNext?.classList?.remove('btn-ready-pulse'), 700);

    root.dataset.termos1Initialized = 'true';
    window.JCTermos1.state.ready = true;

    console.log('[JCTermos1] pronto — typing/TTS delegados ao controller global');
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    if (!window.JCTermos1.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCTermos1.state.listenerOn = true;
    }

    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) {
      initOnce(now);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
