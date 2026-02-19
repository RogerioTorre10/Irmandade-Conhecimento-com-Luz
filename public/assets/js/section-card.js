/* /assets/js/section-card.js — REBUILD LIMPO DO CARD (versão estável) */
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

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---- Dados do usuário (nome + guia + selfie) ----
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    try {
      if (window.JC && window.JC.data) {
        if (window.JC.data.nome) nome = window.JC.data.nome;
        if (window.JC.data.guia) guia = window.JC.data.guia;
      }
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');
      if (lsNome) nome = lsNome;
      if (lsGuia) guia = lsGuia;
    } catch (e) {
      console.warn('[CARD] Erro ao ler dados:', e);
    }

    return {
      nome: (nome || 'AMOR').toUpperCase().trim(),
      guia: (guia || 'zion').toLowerCase().trim()
    };
  }

  // ---- Monta o HTML interno do card (uma vez só) ----
  function buildMarkup(section) {
    if (!section) return;
    if (section.__CARD_BUILT__) return; // não recria

    section.innerHTML = `
      <div class="j-panel-glow card-panel">
        <div class="conteudo-pergaminho">
          <h2
            data-typing="true"
            data-text="Eu na Irmandade"
            data-speed="40"
            data-cursor="true"
            class="titulo-selfie"
          >
            Eu na Irmandade
          </h2>

          <img id="guideBg" class="guide-bg" alt="Fundo do Guia" loading="lazy" />

          <div class="flame-layer show placeholder-only" aria-hidden="true">
            <img
              id="selfieImage"
              class="flame-selfie"
              src="${PLACEHOLDER_SELFIE}"
              alt="Sua foto na Irmandade"
              loading="lazy"
            />
            <div class="card-footer">
              <span class="card-name-badge">
                <span id="userNameSlot">Carregando...</span>
              </span>
            </div>
          </div>

          <div class="card-actions-below">
            <button id="btnNext" class="btn btn-stone">✅ Continuar</button>
          </div>
        </div>
      </div>
    `.trim();

    section.__CARD_BUILT__ = true;
  }

  // ---- Preenche fundo, selfie e nome ----
  function renderCard(section) {
    if (!section) return;

    const { nome, guia } = getUserData();

    const guideBg = qs('#guideBg', section);
    if (guideBg) {
      guideBg.src = CARD_BG[guia] || CARD_BG.zion;
    }

    const selfieImg = qs('#selfieImage', section);
    if (selfieImg) {
      let src = null;
      try {
        src = (window.JC && window.JC.data && window.JC.data.selfieDataUrl) ||
              localStorage.getItem('jc.selfieDataUrl');
      } catch {}
      selfieImg.src = src || PLACEHOLDER_SELFIE;
    }

    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) {
      nameSlot.textContent = nome;
    }

    console.log('%c[CARD] Render ok!', 'color: gold', { nome, guia });
  }
// ================================
// SELFIECARD — gerar e salvar (chamado direto do render)
// ================================
(function () {
  // evita repetir
  if (sessionStorage.getItem('__SELFIECARD_DONE__') === '1') {
    console.log('[CARD][SELFIECARD] já gerada nesta sessão.');
    return;
  }
  sessionStorage.setItem('__SELFIECARD_DONE__', '1');

  const run = async () => {
    try {
      const sec = document.getElementById('section-card') || document;

      const selfieImg = sec.querySelector('#selfieImage');
      const bgImg     = sec.querySelector('#guideBg');

      if (!selfieImg || !selfieImg.src) {
        console.warn('[CARD][SELFIECARD] selfieImage não encontrado/sem src.');
        return;
      }

      const waitImg = (img) => new Promise((resolve) => {
        if (!img) return resolve(false);
        if (img.complete && img.naturalWidth > 0) return resolve(true);
        img.addEventListener('load', () => resolve(true), { once: true });
        img.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(img.complete && img.naturalWidth > 0), 1200);
      });

      await waitImg(selfieImg);
      if (bgImg) await waitImg(bgImg);

      const W = 512, H = 720;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d', { alpha: true });

      // fundo
      if (bgImg && bgImg.naturalWidth > 0) {
        const r = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
        const dw = bgImg.naturalWidth * r;
        const dh = bgImg.naturalHeight * r;
        ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
      }

      // selfie circular
      const cx = W / 2, cy = 240, radius = 120;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const sw = selfieImg.naturalWidth || 1;
      const sh = selfieImg.naturalHeight || 1;
      const scale = Math.max((radius * 2) / sw, (radius * 2) / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(selfieImg, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();

      // texto
      const nomeX = (window.JORNADA_STATE?.nome || localStorage.getItem('JORNADA_NOME') || 'PARTICIPANTE').trim();
      const guiaX = (window.JORNADA_STATE?.guiaSelecionado || window.JORNADA_STATE?.guia || localStorage.getItem('JORNADA_GUIA') || '').trim();

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = 'bold 30px Cardo, serif';
      ctx.fillText(nomeX || 'PARTICIPANTE', cx, 500);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '22px Cardo, serif';
      ctx.fillText(guiaX ? `Guia: ${guiaX}` : 'Guia: —', cx, 540);

      // export
      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      } catch (err) {
        console.error('[CARD][SELFIECARD] toDataURL falhou (CORS/tainted?)', err);
        return;
      }

      // salva
      sessionStorage.setItem('JORNADA_SELFIECARD', dataUrl);
      sessionStorage.setItem('SELFIE_CARD', dataUrl);
      try {
        localStorage.setItem('JORNADA_SELFIECARD', dataUrl);
        localStorage.setItem('SELFIE_CARD', dataUrl);
      } catch (_) {}

      window.JORNADA_STATE = window.JORNADA_STATE || {};
      window.JORNADA_STATE.selfieCard = dataUrl;

      console.log('[CARD][SELFIECARD] ✅ salva!', dataUrl.slice(0, 40) + '...');
    } catch (e) {
      console.error('[CARD][SELFIECARD] erro:', e);
    }
  };

  // roda fora do paint
  setTimeout(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
    else run();
  }, 80);
})();


  // ---- Navegação para perguntas ----
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(NEXT_SECTION_ID, { force: true });
    }
  }

  // ---- Inicialização da seção ----
  async function init(root) {
    const section = root || qs('#section-card') || qs('#section-eu-na-irmandade');
    if (!section) return;

    buildMarkup(section);
    renderCard(section);

    const btnNext = qs('#btnNext', section);
    if (btnNext) {
      btnNext.onclick = goNext;
    }

    const typingEls = qsa('[data-typing="true"]', section);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res =>
          window.runTyping(el, text, res, { speed: 40, cursor: true })
        );
      } else {
        el.textContent = text;
      }
    }
  }

 /* =========================================================
   TEMA DO GUIA — reaplica em qualquer seção quando necessário
   ========================================================= */
(function () {
  'use strict';

  function applyThemeFromSession() {
    const guiaRaw = sessionStorage.getItem('jornada.guia');
    const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

    // fallback dourado
    let main = '#ffd700', g1 = 'rgba(255,230,180,0.85)', g2 = 'rgba(255,210,120,0.75)';

    if (guia === 'lumen') { main = '#00ff9d'; g1 = 'rgba(0,255,157,0.90)'; g2 = 'rgba(120,255,200,0.70)'; }
    if (guia === 'zion')  { main = '#00aaff'; g1 = 'rgba(0,170,255,0.90)'; g2 = 'rgba(255,214,91,0.70)'; }
    if (guia === 'arian') { main = '#ff00ff'; g1 = 'rgba(255,120,255,0.95)'; g2 = 'rgba(255,180,255,0.80)'; }

    document.documentElement.style.setProperty('--theme-main-color', main);
    document.documentElement.style.setProperty('--progress-main', main);
    document.documentElement.style.setProperty('--progress-glow-1', g1);
    document.documentElement.style.setProperty('--progress-glow-2', g2);
    document.documentElement.style.setProperty('--guide-color', main);

    if (guia) document.body.setAttribute('data-guia', guia);
  }

  // roda no carregamento e também quando o app troca seção
  document.addEventListener('DOMContentLoaded', applyThemeFromSession);
  document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
  document.addEventListener('guia:changed', applyThemeFromSession);
})();
  
  // ---- Listener do controller ----
  document.addEventListener('section:shown', (e) => {
    const id = e.detail && e.detail.sectionId;
    if (!id || SECTION_IDS.indexOf(id) === -1) return;

    const node = e.detail.node || qs('#' + id);
    init(node);
  });


  console.log('[' + MOD + '] carregado');
})();
