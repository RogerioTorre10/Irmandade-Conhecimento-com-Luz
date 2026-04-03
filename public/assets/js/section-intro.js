(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';

  if (window.JCIntro?.__bound) return;
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false };

  let typingExecuted = false;

  // ==================== MODAL DE IDIOMA ====================
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
        font-family: 'BerkshireSwash', cursive;
        color: #ffd700;
      }

      #intro-lang-modal .intro-lang-sub {
        margin: 0 0 20px 0;
        font-size: 0.95rem;
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
        transition: all 0.25s ease;
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
    // Limpa locks antigos
    sessionStorage.removeItem('i18n_locked');
    sessionStorage.removeItem('jornada.lang');

    const oldModal = document.getElementById('intro-lang-modal');
    if (oldModal) oldModal.remove();

    const modal = buildLangModal();
    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const select = modal.querySelector('#intro-lang-select');
      const btn = modal.querySelector('#intro-lang-confirm');

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

        // Fecha modal
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 400);

        resolve(chosenLang);
      }, { once: true });
    });
  }

  async function runTyping(root) {
    if (!root || typingExecuted) return;
    typingExecuted = true;

    console.log('[Typing] Iniciando datilografia após confirmação do idioma...');

    const elements = Array.from(root.querySelectorAll('[data-typing="true"]'));

    for (const el of elements) {
      const text = (el.getAttribute('data-text') || el.textContent || '').trim();
      if (!text) continue;

      // Limpa estado anterior
      el.textContent = '';
      el.classList.remove('typing-done', 'type-done');
      el.classList.add('typing-active');

      const speed = Number(el.dataset.speed) || 42;

      if (typeof window.typeAndSpeak === 'function') {
        await new Promise(r => window.typeAndSpeak(el, text, speed, { forceReplay: true }));
      } else if (typeof window.runTyping === 'function') {
        await new Promise(r => window.runTyping(el, text, r, { speed, forceReplay: true }));
      } else {
        // Fallback simples
        for (let i = 0; i < text.length; i++) {
          el.textContent += text.charAt(i);
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
