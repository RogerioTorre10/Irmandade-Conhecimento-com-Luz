(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';

  if (window.JCIntro?.__bound) return;
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false, listenerOn: false, lastLang: null};
  window.JCIntro.state.typingExecuted = false;

  function isLangLocked() {
    return sessionStorage.getItem('i18n_locked') === '1';
  }

  async function setLangAndLock(lang) {
  if (!lang) return;

  const normalized = String(lang).trim();

  try {
    if (window.i18n?.forceLang) {
      await window.i18n.forceLang(normalized, true);
    } else if (window.i18n?.setLang) {
      await window.i18n.setLang(normalized);
    }
  } catch (e) {
    console.warn('[IntroLang] erro:', e);
  }

  // 🔒 TRAVA FORTE
  sessionStorage.setItem('i18n_locked', '1');
  sessionStorage.setItem('jornada.lang', normalized);
  localStorage.setItem('i18n_lang', normalized);

  // 🔥 FORÇA GLOBAL
  window.i18n.lang = normalized;
  window.i18n.currentLang = normalized;

  document.documentElement.lang = normalized;

  console.log('[LANG FIXADO]', normalized);
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

        <div class="intro-lang-row">
          <select id="intro-lang-select" class="intro-lang-select" aria-label="Selecione o idioma">
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (ES)</option>
            <option value="fr-FR">Français (FR)</option>
            <option value="ja-JP">日本語 (日本)</option>
            <option value="zh-CN">中文（简体）</option>
            <option value="de-DE">Deutsch（DE）</option>
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
    localStorage.removeItem('i18n_locked');
    localStorage.removeItem('i18n_lang');

    const oldModal = document.getElementById('intro-lang-modal');
    if (oldModal) oldModal.remove();

    const modal = buildLangModal();
    document.body.appendChild(modal);

    window.__LANG_MODAL_OPEN__ = true;
    window.__INTRO_LANG_CONFIRMED__ = false;
    window.speechSynthesis?.cancel?.();

    const btn = modal.querySelector('#intro-lang-confirm');
    const sel = modal.querySelector('#intro-lang-select');

    if (!btn || !sel) {
      console.error('[LANG_MODAL] Botão ou select não encontrados.', {
        btn: !!btn,
        sel: !!sel
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

    sel.disabled = false;
    sel.style.pointerEvents = 'auto';
    sel.style.position = 'relative';
    sel.style.zIndex = '5';
    sel.style.cursor = 'pointer';

    sel.value =
      localStorage.getItem('i18n_lang') ||
      sessionStorage.getItem('jornada.lang') ||
      'pt-BR';

    function getChosenLang() {
      return (sel.value || 'pt-BR').trim();
    }

    sel.addEventListener('change', () => {
      console.log('[LANG_MODAL] idioma selecionado:', getChosenLang());
    });

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

          window.__INTRO_LANG_CONFIRMED__ = true;
          window.__LANG_MODAL_OPEN__ = false;
          window.JCIntro.state.lastLang = chosenLang;

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
          sel.disabled = false;
          confirmed = false;
          resolve(chosenLang);
        }
      };

      btn.onclick = confirmChoice;
      btn.addEventListener('click', confirmChoice, true);

      sel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          confirmChoice(e);
        }
      });

      setTimeout(() => {
        try { sel.focus(); } catch {}
      }, 80);
    });
  }

  function clearTypingState(el) {
    if (!el) return;

    el.classList.remove('typing-done', 'type-done', 'typing-active');
    el.textContent = '';
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    el.style.display = '';

    try {
      delete el.dataset.typingDone;
      delete el.dataset.typingSig;
      delete el.dataset.typingLastSig;
      delete el.dataset.typingLastAt;
    } catch {}
  }

  async function runTyping(root) {
    if (!window.__INTRO_LANG_CONFIRMED__) {
    console.warn('[INTRO] Bloqueado: idioma ainda não confirmado');
    return;
  }
    if (window.JCIntro.state.typingExecuted) return;
    window.JCIntro.state.typingExecuted = true;

    console.log('[Typing] Iniciando datilografia após confirmação do idioma...');

    const elements = Array.from(root.querySelectorAll('[data-typing="true"]'));

    for (const el of elements) {
     const txt = (
     el.getAttribute('data-text') ||
     (el.dataset.i18nKey ? window.i18n?.t?.(el.dataset.i18nKey) : '') ||
     el.textContent ||
     ''
   ).trim();

    if (!txt) continue;

    // limpa estado anterior
    el.textContent = '';
    el.classList.remove('typing-done', 'type-done');
    el.classList.add('typing-active');

   const speed = Number(el.dataset.speed) || 42;

   if (typeof window.typeAndSpeak === 'function') {
     await new Promise((r) => window.typeAndSpeak(el, txt, speed, { forceReplay: true }) || r());
   } else if (typeof window.runTyping === 'function') {
     await new Promise((r) => window.runTyping(el, txt, r, { speed, forceReplay: true }));
   } else {
    for (let i = 0; i < txt.length; i++) {
      el.textContent += txt.charAt(i);
      await new Promise(res => setTimeout(res, speed));
    }
  }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
  }

    console.log('[Typing] Datilografia concluída.');
  }

  async function init(root) {
    if (!root || window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;

    console.log('[Intro] Aguardando escolha de idioma...');
    await requireLanguageChoice();

    console.log('[Intro] Idioma confirmado → iniciando typing');
    await runTyping(root);

    console.log('[Intro] Inicialização completa.');
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
