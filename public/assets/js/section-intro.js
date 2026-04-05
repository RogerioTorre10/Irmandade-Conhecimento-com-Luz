(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';
  const INTRO_VIDEO =
    window.JORNADA_VIDEOS?.introParaTermos1 ||
    window.APP_CONFIG?.VIDEOS?.introParaTermos1 ||
    '/assets/videos/filme-pergaminho-ao-vento.mp4';

  if (window.JCIntro?.__bound) return;

  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = {
    initialized: false,
    listenerOn: false,
    modalOpen: false,
    langConfirmed: false,
    lastLang: null
  };

  function isLangLocked() {
    return sessionStorage.getItem('i18n_locked') === '1';
  }

  function getRoot() {
    return document.getElementById(SECTION_ID);
  }

  function getIntroNextButton(root) {
    return (
      root?.querySelector('#btn-intro') ||
      root?.querySelector('[data-action="avancar"]') ||
      root?.querySelector('[data-next]') ||
      root?.querySelector('.btn-stone') ||
      root?.querySelector('button')
    );
  }

  async function setLangAndLock(lang) {
    if (!lang) return;

    const normalized = String(lang).trim();

    try {
      if (window.i18n?.forceLang) {
        await window.i18n.forceLang(normalized, true);
      } else if (window.i18n?.setLang) {
        await window.i18n.setLang(normalized, true);
      }
    } catch (e) {
      console.warn('[IntroLang] Erro ao definir idioma:', e);
    }

    sessionStorage.setItem('i18n_locked', '1');
    sessionStorage.setItem('jornada.lang', normalized);
    sessionStorage.setItem('i18n.lang', normalized);

    localStorage.setItem('i18n_locked', '1');
    localStorage.setItem('i18n_lang', normalized);
    localStorage.setItem('jornada.lang', normalized);
    localStorage.setItem('i18n.lang', normalized);

    document.documentElement.lang = normalized;
    document.documentElement.setAttribute('data-lang', normalized);
    if (document.body) document.body.setAttribute('data-lang', normalized);

    window.__INTRO_LANG_CONFIRMED__ = true;
    window.__LANG_MODAL_OPEN__ = false;
    window.JCIntro.state.langConfirmed = true;
    window.JCIntro.state.lastLang = normalized;

    console.log('[IntroLang] Idioma definido nesta jornada:', normalized);
  }

  function destroyExistingModal() {
    const old = document.getElementById('intro-lang-modal');
    if (old) old.remove();
    window.JCIntro.state.modalOpen = false;
    window.__LANG_MODAL_OPEN__ = false;
  }

  function buildLangModal() {
    destroyExistingModal();

    const modal = document.createElement('div');
    modal.id = 'intro-lang-modal';

    modal.innerHTML = `
      <div class="intro-lang-backdrop"></div>
      <div class="intro-lang-card" role="dialog" aria-modal="true" aria-labelledby="intro-lang-title">
        <h3 id="intro-lang-title" class="intro-lang-title">Escolha seu idioma</h3>
        <p class="intro-lang-sub">
          Selecione o idioma para navegar. Após confirmar, não será possível alterar.
        </p>

        <div class="intro-lang-row">
          <select id="intro-lang-select" class="intro-lang-select" aria-label="Selecione o idioma">
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (ES)</option>
            <option value="fr-FR">Français (FR)</option>
            <option value="ja-JP">日本語 (日本)</option>
            <option value="zh-CN">中文（简体）</option>
            <option value="de-DE">Deutsch (DE)</option>
          </select>
        </div>

        <div class="intro-lang-actions">
          <button id="intro-lang-confirm" type="button" class="intro-lang-confirm-btn">
            Confirmar
          </button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #intro-lang-modal {
        position: fixed;
        inset: 0;
        z-index: 999999 !important;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.75);
        pointer-events: auto !important;
        touch-action: auto !important;
      }

      #intro-lang-modal .intro-lang-backdrop {
        position: absolute;
        inset: 0;
        pointer-events: none !important;
      }

      #intro-lang-modal .intro-lang-card {
        position: relative;
        z-index: 2;
        width: min(92vw, 420px);
        padding: 24px 20px;
        border-radius: 18px;
        background: rgba(15,15,25,0.98);
        border: 1px solid rgba(212,175,55,0.6);
        color: #f5e7b0;
        text-align: center;
        box-shadow: 0 0 30px rgba(212,175,55,0.3);
        pointer-events: auto !important;
        touch-action: manipulation !important;
      }

      #intro-lang-modal .intro-lang-title {
        margin: 0 0 12px 0;
        font-size: 1.45rem;
        font-family: 'BerkshireSwash', cursive;
      }

      #intro-lang-modal .intro-lang-sub {
        margin: 0 0 20px 0;
        font-size: 0.95rem;
        opacity: 0.9;
      }

      #intro-lang-modal .intro-lang-row {
        position: relative;
        z-index: 4;
        pointer-events: auto !important;
        margin-bottom: 16px;
      }

      #intro-lang-modal .intro-lang-select,
      #intro-lang-select {
        position: relative;
        z-index: 5;
        width: 100%;
        padding: 12px 16px;
        border-radius: 10px;
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(212,175,55,0.5);
        color: #f5e7b0;
        font-size: 1.05rem;
        pointer-events: auto !important;
        cursor: pointer !important;
        touch-action: manipulation !important;
        appearance: auto !important;
        -webkit-appearance: menulist !important;
        -moz-appearance: menulist !important;
      }

      #intro-lang-modal .intro-lang-confirm-btn,
      #intro-lang-confirm {
        position: relative;
        z-index: 6;
        width: 100%;
        padding: 16px 20px;
        font-size: 1.15rem;
        font-weight: bold;
        border: none;
        border-radius: 12px;
        background: url('/assets/img/textura-de-pedra.jpg') center/cover;
        color: #FFFFFF;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        transition: all 0.25s ease;
        cursor: pointer !important;
        pointer-events: auto !important;
        touch-action: manipulation !important;
        opacity: 1 !important;
      }

      #intro-lang-modal .intro-lang-confirm-btn:disabled,
      #intro-lang-confirm:disabled {
        opacity: 0.65 !important;
        cursor: not-allowed !important;
      }
    `;
    modal.appendChild(style);
    return modal;
  }

  async function requireLanguageChoice(root) {
    if (isLangLocked()) {
      const locked =
        sessionStorage.getItem('jornada.lang') ||
        sessionStorage.getItem('i18n.lang') ||
        localStorage.getItem('i18n_lang') ||
        'pt-BR';

      window.__INTRO_LANG_CONFIRMED__ = true;
      window.__LANG_MODAL_OPEN__ = false;
      window.JCIntro.state.langConfirmed = true;
      window.JCIntro.state.lastLang = locked;
      return locked;
    }

    const modal = buildLangModal();
    document.body.appendChild(modal);

    window.__LANG_MODAL_OPEN__ = true;
    window.__INTRO_LANG_CONFIRMED__ = false;
    window.JCIntro.state.modalOpen = true;

    try { window.speechSynthesis?.cancel?.(); } catch {}

    const btn = modal.querySelector('#intro-lang-confirm');
    const sel = modal.querySelector('#intro-lang-select');

    if (!btn || !sel) {
      console.error('[LANG_MODAL] Botão ou select não encontrados.', {
        btn: !!btn,
        sel: !!sel
      });
      throw new Error('Modal de idioma inválida.');
    }

    const introBtn = getIntroNextButton(root);
    if (introBtn) {
      introBtn.disabled = true;
      introBtn.style.pointerEvents = 'none';
      introBtn.setAttribute('aria-disabled', 'true');
    }

    btn.disabled = false;
    sel.disabled = false;

    btn.style.pointerEvents = 'auto';
    sel.style.pointerEvents = 'auto';

    sel.value =
      localStorage.getItem('i18n_lang') ||
      sessionStorage.getItem('jornada.lang') ||
      'pt-BR';

    function getChosenLang() {
      return (sel.value || 'pt-BR').trim();
    }

    return new Promise((resolve) => {
      let confirmed = false;

      const confirmChoice = async (ev) => {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        ev?.stopImmediatePropagation?.();

        if (confirmed) return;
        confirmed = true;

        const chosenLang = getChosenLang();
        console.log('[LANG_MODAL] Confirmar clicado:', chosenLang);

        try {
          btn.disabled = true;
          sel.disabled = true;

          await setLangAndLock(chosenLang);

          if (root && window.i18n?.apply) {
  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    window.i18n.apply(root);

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    root.querySelectorAll('[data-typing="true"], .intro-title, .typing-text, .parchment-text-rough')
      .forEach((el) => {
        // limpa qualquer cache antigo do idioma anterior
        delete el.dataset.typingDone;
        delete el.dataset.typingSig;
        delete el.dataset.typingLastSig;
        delete el.dataset.typingLastAt;
        delete el.dataset.fullText;
        delete el.dataset.text;

        el.classList.remove('typing-active', 'typing-done', 'type-done');
        el.removeAttribute('data-cursor');

        const translatedText = String(el.textContent || '').replace(/\s+/g, ' ').trim();

        if (translatedText) {
          el.dataset.text = translatedText;
          el.dataset.fullText = translatedText;
        }
      });

    console.log('[IntroLang] Textos da intro recarregados após troca de idioma.');
  } catch (e) {
    console.warn('[IntroLang] Falha ao reaplicar i18n na intro:', e);
  }
}

          if (introBtn) {
            introBtn.disabled = false;
            introBtn.style.pointerEvents = 'auto';
            introBtn.setAttribute('aria-disabled', 'false');
          }

          window.JCIntro.state.modalOpen = false;
          modal.style.opacity = '0';
          setTimeout(() => modal.remove(), 220);

          window.__JC_TYPED_ONCE = window.__JC_TYPED_ONCE || {};
          window.__JC_TYPED_ONCE['section-intro'] = false;

       document.dispatchEvent(new CustomEvent('intro:language-confirmed', {
      detail: { lang: chosenLang }
    }));

          resolve(chosenLang);
        } catch (err) {
          console.error('[Global Lang Change] Erro:', err);
          btn.disabled = false;
          sel.disabled = false;
          confirmed = false;
          resolve(chosenLang);
        }
      };

      btn.onclick = confirmChoice;
      btn.addEventListener('click', confirmChoice, true);
      btn.addEventListener('pointerup', confirmChoice, true);
      btn.addEventListener('touchend', confirmChoice, { passive: false, capture: true });

      sel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmChoice(e);
      });

      setTimeout(() => {
        try {
          sel.disabled = false;
          btn.disabled = false;
          sel.focus();
        } catch {}
      }, 80);
    });
  }

  function playIntroTransitionToTermos1() {
    const go = () => window.JC?.show?.(NEXT_SECTION_ID);

    if (typeof window.playBlockTransition === 'function') {
      return window.playBlockTransition(INTRO_VIDEO, go);
    }

    if (typeof window.playCleanTransition === 'function') {
      return window.playCleanTransition(INTRO_VIDEO, go);
    }

    if (typeof window.playVideoWithCallback === 'function') {
      return window.playVideoWithCallback(INTRO_VIDEO, go);
    }

    return go();
  }

  function bindIntroAdvance(root) {
    const btn = getIntroNextButton(root);
    if (!btn || btn.dataset.introAdvanceBound === '1') return;

    btn.dataset.introAdvanceBound = '1';

    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!window.__INTRO_LANG_CONFIRMED__) {
        console.warn('[Intro] Avanço bloqueado: idioma ainda não confirmado.');
        return;
      }

      try { window.speechSynthesis?.cancel?.(); } catch {}
      playIntroTransitionToTermos1();
    });
  }

  async function init(root) {
    if (!root) return;

    bindIntroAdvance(root);

    if (window.JCIntro.state.initialized && window.JCIntro.state.langConfirmed) {
      return;
    }

    window.JCIntro.state.initialized = true;

    console.log('[Intro] Aguardando escolha de idioma...');
    await requireLanguageChoice(root);

    bindIntroAdvance(root);

    console.log('[Intro] Idioma confirmado. Typing será conduzido pelo controller global.');
  }

  function bind() {
    const existing = getRoot();
    if (existing) init(existing);

    if (!window.JCIntro.state.listenerOn) {
      document.addEventListener('section:shown', (e) => {
        if (e?.detail?.sectionId === SECTION_ID) {
          init(e.detail.node || getRoot());
        }
      });
      window.JCIntro.state.listenerOn = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
