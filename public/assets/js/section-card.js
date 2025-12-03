/* /assets/js/section-card.js — VERSÃO ESTÁVEL, NÃO ALTERA DOM */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };

  const PLACEHOLDER = '/assets/img/irmandade-card-placeholder.jpg';

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ====================================
       NÃO ALTERA STRUCTURE, SOMENTE LOGA
     ==================================== */
  function ensureCardStructure(section) {
    console.log('[CARD] Estrutura recebida — NÃO modificando DOM.');
    return; // ← NÃO FAZ NADA
  }

  /* ====================================
             DADOS DO USUÁRIO
     ==================================== */
  function getUserData() {
    let nome = window.JC?.data?.nome || localStorage.getItem('jc.nome') || 'AMOR';
    let guia = window.JC?.data?.guia || localStorage.getItem('jc.guia') || 'zion';

    return {
      nome: nome.trim().toUpperCase(),
      guia: guia.trim().toLowerCase()
    };
  }

  /* ====================================
              RENDERIZAÇÃO
     ==================================== */
  function render(root) {
    const { nome, guia } = getUserData();

    const bg = qs('#guideBg', root);
    if (bg) bg.src = BG[guia] || BG.zion;

    const selfie = qs('#selfieImage', root);
    if (selfie) {
      const src = window.JC?.data?.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl');
      selfie.src = src || PLACEHOLDER;
    }

    const nameSlot = qs('#userNameSlot', root);
    if (nameSlot) nameSlot.textContent = nome;

    console.log('%c[CARD] Renderizado com sucesso!', 'color: gold');
  }

  /* ====================================
                NAVEGAÇÃO
     ==================================== */
  function next() {
    try { speechSynthesis.cancel(); } catch {}

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    window.JC?.show?.(NEXT_SECTION_ID, { force: true });
  }

  /* ====================================
                    INIT
     ==================================== */
  async function init(root) {
    if (!root) return;

    ensureCardStructure(root); // ← SOMENTE LOGA

    render(root);

    const btn = qs('#btnNext', root);
    if (btn) btn.onclick = next;

    const typing = qsa('[data-typing="true"]', root);
    for (const el of typing) {
      const text = el.dataset.text || el.textContent;

      if (typeof window.runTyping === 'function') {
        await new Promise(res =>
          window.runTyping(el, text, res, { speed: 40, cursor: true })
        );
      } else {
        el.textContent = text;
      }
    }
  }

  /* ====================================
            EVENTO DO CONTROLLER
     ==================================== */
  document.addEventListener('section:shown', e => {
    if (SECTION_IDS.includes(e.detail.sectionId)) {
      init(e.detail.node);
    }
  });

  console.log(`[${MOD}] carregado.`);
})();
