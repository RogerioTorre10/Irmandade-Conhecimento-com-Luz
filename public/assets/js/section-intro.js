(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';

  if (window.JCIntro?.__bound) return;
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false };

  function buildLangModal() {
    const modal = document.createElement('div');
    modal.id = 'intro-lang-modal';

    modal.innerHTML = `
      <div class="intro-lang-backdrop"></div>
      <div class="intro-lang-card" role="dialog" aria-modal="true">
        <h3 class="intro-lang-title">Escolha seu idioma</h3>
        <p class="intro-lang-sub">
          Selecione o idioma para navegar. Após confirmar, não será possível alterar.
        </p>

        <div class="intro-lang-row">
          <select id="intro-lang-select" class="intro-lang-select">
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
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.78);
      }

      #intro-lang-modal .intro-lang-card {
        width: min(92vw, 420px);
        padding: 28px 24px;
        border-radius: 18px;
        background: rgba(15,15,25,0.98);
        border: 1px solid rgba(212,175,55,0.7);
        color: #f5e7b0;
        text-align: center;
        box-shadow: 0 0 40px rgba(212,175,55,0.35);
      }

      #intro-lang-modal .intro-lang-title {
        margin: 0 0 12px 0;
        font-size: 1.5rem;
        color: #ffd700;
        font-family: 'BerkshireSwash', cursive;
      }

      #intro-lang-modal .intro-lang-sub {
        margin: 0 0 20px 0;
        font-size: 0.95rem;
        opacity: 0.9;
      }

      #intro-lang-modal .intro-lang-select {
        width: 100%;
        padding: 14px 16px;
        margin-bottom: 20px;
        border-radius: 10px;
        background: rgba(0,0,0,0.65);
        border: 1px solid rgba(212,175,55,0.6);
        color: #f5e7b0;
        font-size: 1.05rem;
      }

      #intro-lang-modal .intro-lang-confirm-btn {
        width: 100%;
        padding: 16px 20px;
        font-size: 1.15rem;
        font-weight: bold;
        border: none;
        border-radius: 12px;
        background: url('/assets/img/textura-de-pedra.jpg') center/cover;
        color: #111;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        cursor: pointer;
      }

      #intro-lang-modal .intro-lang-confirm-btn:hover {
        filter: brightness(1.12);
        transform: translateY(-2px);
      }
    `;
    modal.appendChild(style);
    return modal;
  }

  async function requireLanguageChoice() {
    const oldModal = document.getElementById('intro-lang-modal');
    if (oldModal) oldModal.remove();

    const modal = buildLangModal();
    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const select = modal.querySelector('#intro-lang-select');
      const btn = modal.querySelector('#intro-lang-confirm');

      // Garante que o select e botão estejam habilitados
      select.disabled = false;
      btn.disabled = false;

      btn.addEventListener('click', async () => {
        const chosenLang = select.value;

        try {
          if (window.i18n?.forceLang) {
            await window.i18n.forceLang(chosenLang, true);
          } else if (window.i18n?.setLang) {
            await window.i18n.setLang(chosenLang);
          }
        } catch (e) {
          console.warn('[IntroLang] Erro ao definir idioma:', e);
        }

        localStorage.setItem('i18n_lang', chosenLang);
        sessionStorage.setItem('i18n_locked', '1');
        document.documentElement.lang = chosenLang.split('-')[0] || 'pt';

        console.log('[IntroLang] Idioma confirmado:', chosenLang);

        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 400);

        resolve(chosenLang);
      }, { once: true });
    });
  }

  async function runTyping(root) {
    if (!root) return;

    const btn = root.querySelector('#btn-intro') ||
                root.querySelector('[data-next]') ||
                root.querySelector('.btn-stone') ||
                root.querySelector('button');

    if (btn) {
      btn.disabled = true;
      btn.classList.add('is-hidden');
    }

    // Aqui você pode chamar sua função de typing original
    if (typeof window.runTyping === 'function') {
      const elements = root.querySelectorAll('[data-typing="true"]');
      for (const el of elements) {
        await new Promise(r => window.runTyping(el, el.getAttribute('data-text') || el.textContent, r));
      }
    }

    if (btn) {
      btn.disabled = false;
      btn.classList.remove('is-hidden');
    }
  }

  async function init(root) {
    if (window.JCIntro.state.initialized) return;
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
