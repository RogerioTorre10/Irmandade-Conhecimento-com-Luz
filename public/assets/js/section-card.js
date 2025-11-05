/* /assets/js/section-card.js — VERSÃO FINAL 100% FUNCIONAL (SEM global) */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // === SINCRONIZAÇÃO MOBILE ===
  window.addEventListener('storage', (e) => {
    if (e.key === 'jc.guia' || e.key === 'jc.nome' || e.key === 'jc.selfieDataUrl') {
      console.log('%c[SYNC] Dados atualizados!', 'color: cyan', e);
      renderCard();
    }
  });

  // === LEITURA DE DADOS (SEM global → window) ===
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    // window.JC (correto no navegador)
    if (window.JC?.data) {
      if (window.JC.data.nome) nome = window.JC.data.nome;
      if (window.JC.data.guia) guia = window.JC.data.guia;
    }

    const lsNome = localStorage.getItem('jc.nome');
    const lsGuia = localStorage.getItem('jc.guia');
    if (lsNome) nome = lsNome;
    if (lsGuia) guia = lsGuia;

    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssGuia) guia = ssGuia;

    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    // Salva em window.JC
    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      localStorage.setItem('jc.nome', nome);
      localStorage.setItem('jc.guia', guia);
      sessionStorage.setItem('jornada.guia', guia);
    } catch {}

    return { nome, guia };
  }

 // === RENDERIZA O CARD ===
function renderCard() {
  const section = qs('#section-card') || qs('#section-eu-na-irmandade');
  if (!section) return;

  const { nome, guia } = getUserData();

  // 1. FUNDO DO GUIA (COM FALLBACK VISUAL IMEDIATO)
  const guideBg = qs('#guideBg', section);
  if (guideBg) {
    const bgUrl = CARD_BG[guia] || CARD_BG.zion;

    // GARANTE FUNDO VISÍVEL DESDE O INÍCIO
    if (!guideBg.src || guideBg.src.endsWith('zion.png')) {
      guideBg.src = CARD_BG.zion; // Zion como base
    }

    // TROCA PARA O GUIA ESCOLHIDO
    if (guideBg.src !== bgUrl) {
      guideBg.style.opacity = '0';
      guideBg.onload = () => {
        guideBg.style.opacity = '1';
        guideBg.onload = null;
      };
      guideBg.onerror = () => {
        console.warn('[CARD] Erro ao carregar fundo, voltando para Zion');
        guideBg.src = CARD_BG.zion;
        guideBg.style.opacity = '1';
      };
      guideBg.src = bgUrl;
    } else {
      guideBg.style.opacity = '1';
    }
  }

  // 2. SELFIE
  const selfieImg = qs('#selfieImage', section);
  if (selfieImg) {
    const url = window.JC?.data?.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl');
    const finalUrl = url || PLACEHOLDER_SELFIE;
    if (selfieImg.src !== finalUrl) {
      selfieImg.src = finalUrl;
    }
    const flameLayer = selfieImg.closest('.flame-layer');
    if (flameLayer) flameLayer.classList.add('show');
  }

  // 3. NOME DO USUÁRIO
  const nameSlot = qs('#userNameSlot', section);
  if (nameSlot) nameSlot.textContent = nome;

  console.log('%c[CARD] Renderizado com sucesso!', 'color: gold; font-weight: bold', { nome, guia });
}

  // === NAVEGAÇÃO ===
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}
    qsa('video').forEach(v => { try { v.pause(); v.src = ''; } catch {} });

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else {
      const v = document.createElement('video');
      v.src = VIDEO_SRC;
      v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
      v.muted = v.playsInline = true;
      v.onended = () => { v.remove(); window.JC?.show?.(NEXT_SECTION_ID, { force: true }); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); window.JC?.show?.(NEXT_SECTION_ID, { force: true }); });
    }
  }

  // === INIT ===
  async function initCard(root) {
    renderCard();

    const btnNext = qs('#btnNext', root);
    if (btnNext) btnNext.onclick = goNext;

    const typingEls = qsa('[data-typing="true"]', root);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res => window.runTyping(el, text, res, { speed: 40, cursor: true }));
      } else {
        el.textContent = text;
      }
      if (typeof window.speak === 'function') window.speak(text);
    }
  }

  // === EVENTOS ===
  document.addEventListener('section:shown', e => {
    const id = e.detail.sectionId;
    if (SECTION_IDS.includes(id)) {
      const root = e.detail.node || qs(`#${id}`) || document.body;
      initCard(root);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS.map(id => qs(`#${id}`)).find(el => el && el.offsetParent !== null);
    if (visible) initCard(visible);
  });

  // === FALLBACK VISUAL ===
  document.addEventListener('DOMContentLoaded', () => {
    const sec = qs('#section-card');
    if (!sec || sec.querySelector('.card-stage')) return;

    const stage = document.createElement('div');
    stage.className = 'card-stage';
    stage.style.cssText = 'position:relative;min-height:66vw;background:#000 center/cover no-repeat;';

    const { guia } = getUserData();
    stage.style.backgroundImage = `url('${CARD_BG[guia] || CARD_BG.zion}')`;

    const flame = document.createElement('div');
    flame.className = 'flame-layer show';
    flame.innerHTML = `<img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" alt="Selfie">`;
    flame.style.cssText = 'position:absolute;left:50%;bottom:160px;transform:translateX(-50%);width:38%;';

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.innerHTML = `<span class="card-name-badge"><span id="userNameSlot">USUÁRIO</span></span>`;
    footer.style.cssText = 'position:absolute;left:50%;bottom:72px;transform:translateX(-50%);';

    stage.appendChild(flame);
    stage.appendChild(footer);
    sec.appendChild(stage);

    renderCard();
  });

  console.log(`[${MOD}] carregado e pronto!`);
})();
