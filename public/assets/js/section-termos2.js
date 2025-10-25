(function () {
  const SECTION_ID = 'section-termos2';
  const NEXT_SECTION_ID = 'section-senha';
  const VIDEO_SRC = '/assets/img/filme-senha.mp4';
  const state = { initialized: false };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function typeText(el, speed = 40) {
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
        await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.1 });
        await sleep(1000);
      } catch {}
    }
  }

  async function runTyping(root) {
    const pg2 = root.querySelector('#termos-pg2');
    const elements = pg2?.querySelectorAll('[data-typing="true"]') || [];
    const btn = root.querySelector('[data-action="avancar"]') || root.querySelector('.avancarBtn');
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
    const btn = root.querySelector('[data-action="avancar"]') || root.querySelector('.avancarBtn');
    btn?.addEventListener('click', () => {
      speechSynthesis.cancel();
      playVideo(NEXT_SECTION_ID);
    });
    await runTyping(root);
    state.initialized = true;
  }

  document.addEventListener('section:shown', evt => {
    if (evt.detail?.sectionId !== SECTION_ID) return;
    const root = evt.detail.node || document.getElementById('section-termos');
    if (root) init(root);
  });
})();
