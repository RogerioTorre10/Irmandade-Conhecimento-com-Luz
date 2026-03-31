(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';
  const HIDE_CLASS = 'hidden';

  if (window.JCIntro?.__bound) return;
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false, listenerOn: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function isLangLocked() {
    return sessionStorage.getItem('i18n_locked') === '1';
  }

  async function setLangAndLock(lang) {
    if (!lang) return;

    try {
      if (window.i18n?.forceLang) {
        await window.i18n.forceLang(lang, true);
      } else if (window.i18n?.setLang) {
        await window.i18n.setLang(lang);
      }
    } catch (e) {
      console.warn('[IntroLang] Erro ao definir idioma:', e);
    }

    sessionStorage.setItem('i18n_locked', '1');
    sessionStorage.setItem('jornada.lang', lang);
    sessionStorage.setItem('i18n.lang', lang);
    localStorage.setItem('i18n_lang', lang);

    document.documentElement.lang = lang;

    console.log('[IntroLang] Idioma definido nesta jornada:', lang);
  }

  function buildLangModal() {
  const modal = document.createElement('div');
  modal.id = 'intro-lang-modal';

  modal.innerHTML = `
    <div class="intro-lang-backdrop"></div>
    <div class="intro-lang-card" role="dialog" aria-modal="true" aria-labelledby="intro-lang-title">
      <h3 id="intro-lang-title" class="intro-lang-title">Escolha seu idioma</h3>
      <p class="intro-lang-sub">
        Selecione o idioma para navegar. Após confirmar, não será possível alterar.
      </p>

      <div class="intro-lang-grid" id="intro-lang-grid">
        <button type="button" class="intro-lang-option is-selected" data-lang="pt-BR">Português (BR)</button>
        <button type="button" class="intro-lang-option" data-lang="en-US">English (US)</button>
        <button type="button" class="intro-lang-option" data-lang="es-ES">Español (ES)</button>
        <button type="button" class="intro-lang-option" data-lang="fr-FR">Français (FR)</button>
        <button type="button" class="intro-lang-option" data-lang="zh-CN">中文（简体）</button>
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

    #intro-lang-modal .intro-lang-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    #intro-lang-modal .intro-lang-option {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(212,175,55,0.35);
      color: #f5e7b0;
      font-size: 1rem;
      text-align: left;
      cursor: pointer !important;
      pointer-events: auto !important;
      transition: all .2s ease;
    }

    #intro-lang-modal .intro-lang-option.is-selected {
      border-color: rgba(212,175,55,0.95);
      box-shadow: 0 0 0 1px rgba(212,175,55,0.55), 0 0 18px rgba(212,175,55,0.18);
      background: rgba(40,30,10,0.55);
    }

    #intro-lang-modal .intro-lang-confirm-btn,
    #intro-lang-confirm {
      position: relative;
      z-index: 3;
      width: 100%;
      padding: 16px 20px;
      font-size: 1.15rem;
      font-weight: bold;
      border: none;
      border-radius: 12px;
      background: url('/assets/img/textura-de-pedra.jpg') center/cover;
      color: #111;
      box-shadow: 0 4px 15px rgba(0,0,0,0.6);
      transition: all 0.25s ease;
      cursor: pointer !important;
      pointer-events: auto !important;
    }
  `;
  modal.appendChild(style);

  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';

  return modal;
}

 async function requireLanguageChoice() {
  sessionStorage.removeItem('i18n_locked');
  sessionStorage.removeItem('jornada.lang');
  sessionStorage.removeItem('i18n.lang');

  const oldModal = document.getElementById('intro-lang-modal');
  if (oldModal) oldModal.remove();

  const modal = buildLangModal();
  document.body.appendChild(modal);

  window.__LANG_MODAL_OPEN__ = true;
  window.__INTRO_LANG_CONFIRMED__ = false;
  window.speechSynthesis?.cancel?.();

  const btn = modal.querySelector('#intro-lang-confirm');
  const options = Array.from(modal.querySelectorAll('.intro-lang-option'));

  if (!btn || !options.length) {
    console.error('[LANG_MODAL] Botão ou opções não encontrados.', {
      btn: !!btn,
      options: options.length
    });
    throw new Error('Modal de idioma inválida.');
  }

  const introRoot = document.getElementById(SECTION_ID);
  const introBtn =
    introRoot?.querySelector('#btn-intro') ||
    introRoot?.querySelector('[data-next]') ||
    introRoot?.querySelector('.btn-stone') ||
    introRoot?.querySelector('button');

  if (introBtn) {
    introBtn.disabled = true;
    introBtn.style.pointerEvents = 'none';
    introBtn.setAttribute('aria-disabled', 'true');
  }

  let chosenLang =
    localStorage.getItem('i18n_lang') ||
    sessionStorage.getItem('jornada.lang') ||
    'pt-BR';

  function paintSelection(lang) {
    chosenLang = lang;
    options.forEach((el) => {
      const active = el.dataset.lang === lang;
      el.classList.toggle('is-selected', active);
      el.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    console.log('[LANG_MODAL] idioma selecionado:', chosenLang);
  }

  paintSelection(chosenLang);

  options.forEach((el) => {
    const handler = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      paintSelection(el.dataset.lang || 'pt-BR');
    };
    el.addEventListener('click', handler, true);
    el.addEventListener('pointerdown', handler, true);
    el.addEventListener('touchstart', handler, true);
  });

  return new Promise((resolve) => {
    let confirmed = false;

    const confirmChoice = async (ev) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      ev?.stopImmediatePropagation?.();

      if (confirmed) return;
      confirmed = true;

      console.log('[LANG_MODAL] Confirmar clicado:', chosenLang);

      try {
        btn.disabled = true;

        await setLangAndLock(chosenLang);

        window.__INTRO_LANG_CONFIRMED__ = true;
        window.__LANG_MODAL_OPEN__ = false;

        if (introBtn) {
          introBtn.disabled = false;
          introBtn.style.pointerEvents = 'auto';
          introBtn.setAttribute('aria-disabled', 'false');
        }

        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);

        document.dispatchEvent(new CustomEvent('intro:language-confirmed', {
          detail: { lang: chosenLang }
        }));

        resolve(chosenLang);
      } catch (err) {
        console.error('[Global Lang Change] Erro:', err);
        btn.disabled = false;
        confirmed = false;
        resolve(chosenLang);
      }
    };

    btn.onclick = confirmChoice;
    btn.addEventListener('click', confirmChoice, true);
    btn.addEventListener('pointerdown', confirmChoice, true);
    btn.addEventListener('touchstart', confirmChoice, true);

    setTimeout(() => {
      try { btn.focus(); } catch {}
    }, 80);
  });
}

  async function runTyping(root) {
    if (!root) return;

    const btn =
      root.querySelector('#btn-intro') ||
      root.querySelector('[data-next]') ||
      root.querySelector('.btn-stone') ||
      root.querySelector('button');

    if (!btn) {
      console.warn('[JCIntro] Botão da intro não encontrado.');
      return;
    }

    btn.removeAttribute('disabled');
    btn.classList.remove('is-hidden');

    btn.onclick = () => {
      try { window.speechSynthesis?.cancel?.(); } catch {}

      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(
          '/assets/videos/filme-pergaminho-ao-vento.mp4',
          NEXT_SECTION_ID
        );
        return;
      }

      if (window.JC?.show) {
        window.JC.show(NEXT_SECTION_ID, { force: true });
      } else {
        location.hash = '#' + NEXT_SECTION_ID;
      }
    };
  }

  async function init(root) {
    if (window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;

    await requireLanguageChoice();
    await runTyping(root);

    console.log('[Intro] Inicialização completa após escolha de idioma.');
  }

  function bind() {
    const existing = document.getElementById(SECTION_ID);
    if (existing) init(existing);

    document.addEventListener('section:shown', (e) => {
      if (e?.detail?.sectionId === SECTION_ID) {
        init(e.detail.node || document.getElementById(SECTION_ID));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
