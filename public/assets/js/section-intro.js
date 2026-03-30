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

  // trava só nesta jornada
  sessionStorage.setItem('i18n_locked', '1');
  sessionStorage.setItem('jornada.lang', lang);
  sessionStorage.setItem('i18n.lang', lang);

  document.documentElement.lang = lang.split('-')[0] || 'pt';

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

    // CSS inline para garantir que apareça
    const style = document.createElement('style');
    style.textContent = `
      #intro-lang-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.75);
      }

      #intro-lang-modal .intro-lang-card {
        width: min(92vw, 420px);
        padding: 24px 20px;
        border-radius: 18px;
        background: rgba(15,15,25,0.98);
        border: 1px solid rgba(212,175,55,0.6);
        color: #f5e7b0;
        text-align: center;
        box-shadow: 0 0 30px rgba(212,175,55,0.3);
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

      #intro-lang-modal .intro-lang-select {
        width: 100%;
        padding: 12px 16px;
        border-radius: 10px;
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(212,175,55,0.5);
        color: #f5e7b0;
        font-size: 1.05rem;
        margin-bottom: 16px;
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
    `;
    modal.appendChild(style);

    // Garante que o modal seja visível
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';

    return modal;
  }
  
 async function requireLanguageChoice() {
  // limpa trava e idioma da jornada anterior
  sessionStorage.removeItem('i18n_locked');
  sessionStorage.removeItem('jornada.lang');
  sessionStorage.removeItem('i18n.lang');

  const oldModal = document.getElementById('intro-lang-modal');
  if (oldModal) oldModal.remove();

  const modal = buildLangModal();
  document.body.appendChild(modal);

  const btn = modal.querySelector('#intro-lang-confirm');
  const sel = modal.querySelector('#intro-lang-select');

  // sempre começa destravado e com idioma padrão de teste
  if (sel) {
    sel.disabled = false;
    sel.value = 'pt-BR';
  }

  return new Promise((resolve) => {
  btn.addEventListener('click', async () => {
  const chosenLang = sel?.value || 'pt-BR';

  try {
    // 🔥 aplica idioma
    await setLangAndLock(chosenLang);

    // 🔥 fecha modal
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 300);

    // 🔥 AQUI ENTRA O BLOCO DO PRINT 3
    window.__INTRO_LANG_CONFIRMED__ = true;
    window.__LANG_MODAL_OPEN__ = false;

    document.dispatchEvent(new CustomEvent('intro:language-confirmed', {
      detail: { lang: chosenLang }
    }));

    resolve(chosenLang);

  } catch (err) {
    console.error('[IntroLang] erro ao confirmar idioma:', err);
  }

}, { once: true });
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

  sessionStorage.removeItem('i18n_locked');
  sessionStorage.removeItem('jornada.lang');
  sessionStorage.removeItem('i18n.lang');

  await requireLanguageChoice();
  await runTyping(root);

  console.log('[Intro] Inicialização completa após escolha de idioma.');
}
  
  // Bind
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
