/* section-card.js — Fallback da Lumen (v2.1)
   - Pointers ajustados para os assets da Irmandade
   - Fallback 100% garantido (cria HTML se faltar)
   - Renderização segura (sem loop); liga botão Continuar
*/
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const d = document;
  const qid = (id) => d.getElementById(id);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const DEFAULT_NEXT_SECTION_ID = 'section-perguntas';
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png',
  };

  // === LEITURA DE DADOS ===
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';
    let selfieDataUrl = null;

    if (window.JC?.data) {
      nome = window.JC.data.nome || nome;
      guia = window.JC.data.guia || guia;
      selfieDataUrl = window.JC.data.selfieDataUrl || null;
    }

    const lsNome = localStorage.getItem('jc.nome');
    const lsGuia = localStorage.getItem('jc.guia');
    const lsSelfie = localStorage.getItem('jc.selfieDataUrl');
    if (lsNome) nome = lsNome;
    if (lsGuia) guia = lsGuia;
    if (lsSelfie) selfieDataUrl = lsSelfie;

    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssGuia) guia = ssGuia;

    nome = String(nome || 'AMOR').toUpperCase().trim();
    guia = String(guia || 'zion').toLowerCase().trim();

    return { nome, guia, selfieDataUrl };
  }

  // === CRIA O HTML DO CARD SE NÃO EXISTIR ===
  let _structureEnsured = false;
  function ensureCardStructure() {
    if (_structureEnsured) return;

    const sec = d.getElementById('section-card');
    if (!sec) return;

    const conteudo = sec.querySelector('#section-conteudo, .conteudo-pergaminho, .card-wrap') || sec;
    if (conteudo.querySelector('.card-stage')) {
      _structureEnsured = true;
      return;
    }

    console.warn(`[${MOD}] HTML do card ausente! Criando fallback...`);

    const cardHTML = `
      <div class="card-stage">
        <img id="guideBg" class="guide-bg" src="/assets/img/irmandade-quarteto-bg-zion.png" alt="Fundo do Guia" />
        <div class="flame-layer">
          <img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" alt="Sua foto" />
        </div>
        <div class="card-footer">
          <span class="card-name-badge">
            <span id="userNameSlot">USUÁRIO</span>
          </span>
        </div>
        <button id="btnNext" class="btn btn-stone" disabled>Continuar</button>
      </div>
    `;

    conteudo.insertAdjacentHTML('beforeend', cardHTML);
    _structureEnsured = true;
  }

  // === NAVEGAÇÃO ===
  function resolveGoNext() {
    return (nextId = DEFAULT_NEXT_SECTION_ID) => {
      try { speechSynthesis.cancel(); } catch {}
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo('/assets/videos/filme-0-ao-encontro-da-jornada.mp4', nextId);
      } else if (window.JC?.show) {
        window.JC.show(nextId, { force: true });
      } else {
        try { location.hash = `#${nextId}`; } catch {}
      }
    };
  }

  // === RENDERIZAÇÃO SEGURA (SEM LOOP) ===
  let _rendering = false;
  function renderCard() {
    if (_rendering) {
      console.warn('[CARD] Renderização já em andamento, ignorando...');
      return;
    }
    _rendering = true;

    try {
      const section = d.getElementById('section-card');
      if (!section) return;

      const { nome, guia, selfieDataUrl } = getUserData();

      // 1) Garante estrutura
      if (!section.querySelector('.card-stage')) {
        console.warn(`[${MOD}] Estrutura ausente → criando fallback...`);
        ensureCardStructure();
      }

      // 2) Busca elementos (agora garantidos)
      const guideBg     = qid('guideBg');
      const selfieImage = qid('selfieImage');
      const nameSlot    = qid('userNameSlot');
      const btnNext     = qid('btnNext');

      if (!guideBg || !selfieImage || !nameSlot) {
        console.error('[CARD] Elementos ainda ausentes após fallback!');
        return;
      }

      // 3) Aplica dados
      const bgUrl = CARD_BG[guia] || CARD_BG.zion;
      if (guideBg.src !== bgUrl) {
        guideBg.style.opacity = '0';
        guideBg.onload = () => (guideBg.style.opacity = '1');
        guideBg.onerror = () => {
          guideBg.src = CARD_BG.zion;
          guideBg.style.opacity = '1';
        };
        guideBg.src = bgUrl;
      }

      const finalUrl = selfieDataUrl || PLACEHOLDER_SELFIE;
      if (selfieImage.src !== finalUrl) {
        selfieImage.src = finalUrl;
      }
      const flameLayer = selfieImage.closest('.flame-layer');
      if (flameLayer) flameLayer.classList.add('show');

      nameSlot.textContent = nome || 'USUÁRIO';

      if (btnNext) {
        btnNext.disabled = false;
        btnNext.style.pointerEvents = 'auto';
      }

      console.log(`[${MOD}] Renderizado com sucesso!`, { guia, nome, hasSelfie: !!selfieDataUrl });
    } finally {
      _rendering = false;
    }
  }

  // === INICIALIZAÇÃO SEGURA ===
  function initCardSafe() {
    ensureCardStructure();
    renderCard();

    const btn = qid('btnNext');
    if (btn) {
      const goNext = resolveGoNext();
      on(btn, 'click', () => goNext(DEFAULT_NEXT_SECTION_ID));
    }

    try { d.dispatchEvent(new CustomEvent('section:card:rendered')); } catch {}
  }

  // === EVENTOS ===
  if (d.readyState === 'loading') {
    on(d, 'DOMContentLoaded', initCardSafe, { once: true });
  } else {
    initCardSafe();
  }

  // === DEBUG ===
  window.__forceInitCard = initCardSafe;
  window.__renderCard = renderCard;

  console.log(`[${MOD}] Fallback da Lumen ativado e pronto!`);
})();
