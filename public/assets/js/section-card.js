/* /assets/js/section-card.js — VERSÃO FINAL 100% LIMPA E FUNCIONAL */
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

  // === SYNC MOBILE ===
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('jc.') || e.key === 'jornada.guia') {
      setTimeout(renderCard, 100);
    }
  });

  // === PEGA DADOS DO USUÁRIO ===
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    if (window.JC?.data?.nome) nome = window.JC.data.nome;
    if (window.JC?.data?.guia) guia = window.JC.data.guia;

    const lsNome = localStorage.getItem('jc.nome');
    const lsGuia = localStorage.getItem('jc.guia');
    if (lsNome) nome = lsNome;
    if (lsGuia) guia = lsGuia;

    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssGuia) guia = ssGuia;

    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    // Salva pra garantir
    window.JC = window.JC || { data: {} };
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      localStorage.setItem('jc.nome', nome);
      localStorage.setItem('jc.guia', guia);
    } catch (e) {}

    return { nome, guia };
  }

  // === RENDERIZA O CARD NOVO ===
  function renderCard() {
    const container = qs('.new-card-container');
    if (!container) return;

    const { nome, guia } = getUserData();

    // Fundo do guia
    const bgUrl = CARD_BG[guia] || CARD_BG.zion;
    if (container.style.backgroundImage !== `url("${bgUrl}")`) {
      container.style.backgroundImage = `url('${bgUrl}')`;
    }

    // Selfie
    const selfieImg = qs('#selfieImage', container);
    if (selfieImg) {
      const selfieData = window.JC?.data?.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl');
      selfieImg.src = selfieData || PLACEHOLDER_SELFIE;
    }

    // Nome
    const nameSlot = qs('#userNameSlot', container);
    if (nameSlot) nameSlot.textContent = nome;

    console.log('%c[CARD] Card renderizado com sucesso!', 'color: gold; font-weight: bold', { nome, guia });
  }

  // === NAVEGAÇÃO ===
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}
    qsa('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch {} });

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else {
      const v = document.createElement('video');
      v.src = VIDEO_SRC;
      v.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:99999;background:#000;';
      v.muted = true;
      v.playsInline = true;
      v.onended = () => { v.remove(); window.JC?.show?.(NEXT_SECTION_ID, { force: true }); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); window.JC?.show?.(NEXT_SECTION_ID, { force: true }); });
    }
  }

  // === CRIA O CARD DO ZERO (SÓ UMA VEZ) ===
  function createNewCard() {
    const sec = qs('#section-card') || qs('#section-eu-na-irmandade');
    if (!sec || qs('.new-card-container')) return;

    // Remove qualquer resquício antigo
    qsa('.card-stage, .flame-layer, .card-footer, .card-actions-below').forEach(el => el.remove());

    const { guia = 'zion' } = getUserData();

    const container = document.createElement('div');
    container.className = 'new-card-container';
    container.style.cssText = `
      position: relative;
      width: 100vw;
      height: 100vh;
      min-height: 100vh;
      background: url('${CARD_BG[guia]}') center/cover no-repeat;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 80px;
      box-sizing: border-box;
      overflow: hidden;
    `;

    container.innerHTML = `
      <!-- Selfie no peito -->
      <div class="flame-layer show" style="position:absolute;top:118px;left:50%;transform:translateX(-50%);width:clamp(130px,58%,250px);aspect-ratio:3/4;border:9px solid #d4af37;border-radius:26px;overflow:hidden;box-shadow:0 18px 45px rgba(0,0,0,0.7);z-index:10;">
        <img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>

      <!-- Nome colado embaixo -->
      <div class="card-footer" style="position:absolute;top:470px;left:50%;transform:translateX(-50%);width:clamp(130px,58%,250px);z-index:11;">
        <div style="background:rgba(0,0,0,0.75);color:#d4af37;font:900 1.48rem/48px 'Cardo',serif;text-align:center;text-transform:uppercase;letter-spacing:1.8px;border-radius:0 0 22px 22px;height:48px;text-shadow:0 3px 10px rgba(0,0,0,0.95);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
          <span id="userNameSlot">CARREGANDO...</span>
        </div>
        <div style="position:absolute;bottom:100%;left:0;right:0;height:9px;background:#d4af37;border-radius:22px 22px 0 0;"></div>
      </div>

      <!-- Botão FORA do card -->
      <div class="card-actions-below" style="margin-top:20px;z-index:999;">
        <button id="btnNext" style="min-width:290px;padding:18px 40px;font-size:1.6rem;font-weight:bold;background:linear-gradient(to bottom,#d4af37,#b8972e);color:#000;border:2px solid #8b5a2b;border-radius:50px;box-shadow:0 10px 30px rgba(0,0,0,0.6);cursor:pointer;">Continuar</button>
      </div>
    `;

    sec.appendChild(container);
    renderCard();

    // Evento do botão
    const btn = qs('#btnNext', container);
    if (btn) btn.onclick = goNext;
  }

  // === INIT ===
  document.addEventListener('section:shown', (e) => {
    if (SECTION_IDS.includes(e.detail.sectionId)) {
      createNewCard();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (SECTION_IDS.some(id => qs('#' + id))) {
      createNewCard();
    }
  });

  console.log(`%c[${MOD}] carregado e pronto!`, 'color: cyan; font-weight: bold');
})();
