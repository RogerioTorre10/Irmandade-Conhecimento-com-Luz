(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';

  if (window.JCIntro?.__bound) return;
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ==================== MODAL DE IDIOMA ====================
  function buildLangModal() {
    const modal = document.createElement('div');
    modal.id = 'intro-lang-modal';

    modal.innerHTML = `
      <div class="intro-lang-backdrop"></div>
      <div class="intro-lang-card" role="dialog" aria-modal="true" aria-labelledby="intro-lang-title">
        <h3 id="intro-lang-title" class="intro-lang-title">Escolha seu idioma</h3>
        <p class="intro-lang-sub">
          Selecione o idioma para esta jornada.
        </p>

        <div class="intro-lang-row">
          <select id="intro-lang-select" class="intro-lang-select" aria-label="Selecione o idioma">
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (ES)</option>
            <option value="fr-FR">Français (FR)</option>
            <option value="zh-CN">中文（简体）</option>
          </select>
        </div>

        <div class="intro-lang-actions">
          <button id="intro-lang-confirm" type="button" class="btn btn-primary btn-stone">
            Confirmar
          </button>
        </div>
      </div>
    `;

    // CSS inline forte + textura de pedra no botão
    const style = document.createElement('style');
    style.textContent = `
      #intro-lang-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.78);
      }

      #intro-lang-modal .intro-lang-card {
        width: min(92vw, 420px);
        padding: 28px 24px;
        border-radius: 18px;
        background: rgba(15,15,25,0.96);
        border: 1px solid rgba(212,175,55,0.7);
        color: #f5e7b0;
        text-align: center;
        box-shadow: 0 0 40px rgba(212,175,55,0.35);
      }

      #intro-lang-modal .intro-lang-title {
        margin: 0 0 12px 0;
        font-size: 1.5rem;
        font-family: "ManufacturingConsent-Regular", serif;
        color: #ffd700;
      }

      #intro-lang-modal .intro-lang-sub {
        margin: 0 0 20px 0;
        font-size: 0.96rem;
        opacity: 0.9;
      }

      #intro-lang-modal .intro-lang-select {
        width: 100%;
        padding: 14px 16px;
        border-radius: 10px;
        background: rgba(0,0,0,0.65);
        border: 1px solid rgba(212,175,55,0.6);
        color: #f5e7b0;
        font-size: 1.05rem;
        margin-bottom: 20px;
      }

      #intro-lang-modal .intro-lang-actions button {
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
      }

      #intro-lang-modal .intro-lang-actions button:hover {
        transform: translateY(-2px);
        filter: brightness(1.1);
      }
    `;
    modal.appendChild(style);
    return modal;
  }

  async function requireLanguageChoice() {
    // Remove qualquer modal antigo
    const oldModal = document.getElementById('intro-lang-modal');
    if (oldModal) oldModal.remove();

    const modal = buildLangModal();
    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const btn = modal.querySelector('#intro-lang-confirm');
      const sel = modal.querySelector('#intro-lang-select');

      btn.addEventListener('click', async () => {
        const chosenLang = sel.value;

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
        document.documentElement.lang = chosenLang.split('-')[0] || 'pt';

        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 400);

        console.log('[IntroLang] Idioma escolhido:', chosenLang);
        resolve();
      }, { once: true });
    });
  }

  async function init(root) {
    if (window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;

    console.log('[Intro] Iniciando com escolha de idioma...');
    await requireLanguageChoice();

    // Aqui você pode chamar o typing se necessário
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
