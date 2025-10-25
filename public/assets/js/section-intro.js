(function () {
  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';
  const VIDEO_SRC = '/assets/img/filme-pergaminho-ao-vento.mp4';

  const state = { initialized: false };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function typeText(el, speed = 36) {
    const text = el.dataset.text?.trim() || el.textContent?.trim() || '';
    if (!text) return;
    el.textContent = '';
    el.classList.add('typing-active');
    for (let i = 0; i < text.length; i++) {
      el.textContent += text.charAt(i);
      await sleep(speed);
    }
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    if (window.EffectCoordinator?.speak) {
      try {
        window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.1 });
        await sleep(2000);
      } catch {}
    }
  }

  async function runTyping(root) {
    const elements = root.querySelectorAll('[data-typing="true"]');
    const btn = root.querySelector('[data-action="avancar"]') || document.getElementById('btn-avancar');
    btn?.setAttribute('disabled', 'true');
    btn?.style.setProperty('opacity', '0');
    for (const el of elements) await typeText(el);
    btn?.removeAttribute('disabled');
    btn?.style.setProperty('opacity', '1');
  }

  function playVideo(nextId) {
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, nextId);
    } else {
      window.JC?.show?.(nextId);
    }
  }

  async function init(root) {
    if (state.initialized) return;
    const btn = root.querySelector('[data-action="avancar"]') || document.getElementById('btn-avancar');
    btn?.addEventListener('click', () => {
      speechSynthesis.cancel();
      playVideo(NEXT_SECTION_ID);
    });
    await runTyping(root);
    state.initialized = true;
  }

  document.addEventListener('section:shown', evt => {
    if (evt.detail?.sectionId !== SECTION_ID) return;
    const root = evt.detail.node || document.getElementById(SECTION_ID);
    if (root) init(root);
  });
})();
