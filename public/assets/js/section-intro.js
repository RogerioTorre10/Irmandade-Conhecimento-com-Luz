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
      <div class="intro-lang-card">
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
            <option value="zh-CN">中文（简体）</option>
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
        background: rgba(0,0,0,0.8);
      }

      #intro-lang-modal .intro-lang-card {
        width: min(92vw, 420px);
        padding: 30px 24px;
        border-radius: 18px;
        background: rgba(15,15,25,0.97);
        border: 1px solid rgba(212,175,55,0.7);
        color: #f5e7b0;
        text-align: center;
        box-shadow: 0 0 40px rgba(212,175,55,0.4);
      }

      #intro-lang-modal .intro-lang-title {
        margin: 0 0 12px;
        font-size: 1.55rem;
        color: #ffd700;
        font-family: "ManufacturingConsent-Regular", serif;
      }

      #intro-lang-modal .intro-lang-sub {
        margin: 0 0 24px;
        font-size: 0.97rem;
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
        font-size: 1.2rem;
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
        transform: translateY(-1px);
      }
    `;
    modal.appendChild(style);
    return modal;
  }

  async function requireLanguageChoice() {
    // Remove modal antigo se existir
    const old = document.getElementById('intro-lang-modal');
    if (old) old.remove();

    const modal = buildLangModal();
    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const select = modal.querySelector('#intro-lang-select');
      const btn = modal.querySelector('#intro-lang-confirm');

      // Garante que tudo esteja clicável
      select.disabled = false;
      btn.disabled = false;

      btn.addEventListener('click', async function handler() {
        const chosenLang = select.value;

        // Define o idioma
        try {
          if (window.i18n?.forceLang) await window.i18n.forceLang(chosenLang, true);
          else if (window.i18n?.setLang) await window.i18n.setLang(chosenLang);
        } catch (e) {
          console.warn('[IntroLang] Erro ao definir idioma:', e);
        }

        localStorage.setItem('i18n_lang', chosenLang);
        document.documentElement.lang = chosenLang.split('-')[0] || 'pt';

        console.log('[IntroLang] Idioma confirmado:', chosenLang);

        // Fecha o modal
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 350);

        resolve(chosenLang);
      }, { once: true });
    });
  }

  async function runTyping(root) {
    if (!root) return;

    console.log('[Typing] Iniciando datilografia...');

    const elements = root.querySelectorAll('[data-typing="true"]');
    const advanceBtn = root.querySelector('#btn-intro, [data-action="avancar"], .btn-stone, button');

    if (advanceBtn) {
      advanceBtn.disabled = true;
    }

    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      if (text) {
        el.textContent = '';
        if (typeof window.runTyping === 'function') {
          await new Promise(r => window.runTyping(el, text, r));
        } else {
          el.textContent = text;
        }
      }
    }

    if (advanceBtn) {
      advanceBtn.disabled = false;
    }
  }

  async function init(root) {
    if (window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;

    console.log('[Intro] Aguardando escolha de idioma...');

    await requireLanguageChoice();     // ← Primeiro o idioma

    console.log('[Intro] Idioma confirmado → iniciando typing');
    await runTyping(root);             // ← Depois a datilografia

    console.log('[Intro] Tudo pronto.');
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
