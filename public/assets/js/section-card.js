/* /assets/js/section-card.js — v6.0 (Diamante Card + SelfieCard estável) */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const normalizeGuia = (raw) => {
    const g = String(raw || '').toLowerCase().trim();
    if (!g) return '';
    if (g === 'guia' || g === 'guide') return '';
    if (g.includes('arion') || g.includes('arian')) return 'arion';
    if (g.includes('lumen')) return 'lumen';
    if (g.includes('zion')) return 'zion';
    return g;
  };

  const CARD_BG = {
    arion: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };

  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.png';
  const FRAME_SRC = '/assets/img/borda-medieval-espinhos1.png';

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

 function getGuiaCanon() {
  const g =
    sessionStorage.getItem('JORNADA_GUIA') ||     // ✅ verdade da sessão
    localStorage.getItem('JORNADA_GUIA') ||       // backup
    window.JORNADA_STATE?.guiaSelecionado ||      // fallback
    window.JORNADA_STATE?.guia ||                 // fallback
    '';                                           // sem JC, sem jc.guia

  const canon = normalizeGuia(g) || 'zion';
  return canon;
}

  function setGuiaCanonEverywhere(guiaCanon) {
    const canon = normalizeGuia(guiaCanon) || 'zion';
    window.JORNADA_STATE = window.JORNADA_STATE || {};
    window.JORNADA_STATE.guia = canon;
    window.JORNADA_STATE.guiaSelecionado = canon;

    try {
      localStorage.setItem('JORNADA_GUIA', canon);
      sessionStorage.setItem('JORNADA_GUIA', canon);
    } catch {}
    return canon;
  }

  function getNomeCanon() {
    const nome =
      window.JC?.data?.nome ||
      localStorage.getItem('jc.nome') ||
      window.JORNADA_STATE?.nome ||
      localStorage.getItem('JORNADA_NOME') ||
      'AMOR';
    return String(nome || 'AMOR').toUpperCase().trim();
  }

  function getSelfieSrc() {
    const src =
      window.JC?.data?.selfieDataUrl ||
      localStorage.getItem('jc.selfieDataUrl') ||
      sessionStorage.getItem('jc.selfieDataUrl') ||
      '';
    return String(src || '').trim();
  }

  function buildMarkup(section) {
    if (!section || section.__CARD_BUILT__) return;

    section.innerHTML = `
      <div class="j-panel-glow card-panel">
        <div class="conteudo-pergaminho">
          <h2 data-typing="true" data-text="Eu na Irmandade" data-speed="40" data-cursor="true"
              class="titulo-selfie">Eu na Irmandade</h2>

          <img id="guideBg" class="guide-bg" alt="Fundo do Guia" loading="lazy" />

          <div class="flame-layer show placeholder-only" aria-hidden="true">
            <img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}"
                 alt="Sua foto na Irmandade" loading="lazy" />
            <div class="card-footer">
              <span class="card-name-badge"><span id="userNameSlot">Carregando...</span></span>
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

  function renderCard(section) {
    const nome = getNomeCanon();
    const guiaCanon = setGuiaCanonEverywhere(getGuiaCanon());

    const guideBg = qs('#guideBg', section);
    if (guideBg) guideBg.src = CARD_BG[guiaCanon] || CARD_BG.zion;

    const selfieImg = qs('#selfieImage', section);
    if (selfieImg) selfieImg.src = getSelfieSrc() || PLACEHOLDER_SELFIE;

    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) nameSlot.textContent = nome;

    console.log('%c[CARD] Render ok!', 'color: gold', { nome, guia: guiaCanon });
  }

  function loadImg(src) {
    return new Promise((resolve) => {
      const s = String(src || '').trim();
      if (!s) return resolve(null);
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = s;
    });
  }

  function scheduleSelfieCardBuild() {
    if (sessionStorage.getItem('__SELFIECARD_DONE__') === '1') return;
    sessionStorage.setItem('__SELFIECARD_DONE__', '1');

    const run = async () => {
      try {
        const sec = document.getElementById('section-card') || document;

        const selfieSrc = sec.querySelector('#selfieImage')?.src || '';
        const bgSrc     = sec.querySelector('#guideBg')?.src || '';

        const selfieImg = await loadImg(selfieSrc);
        const bgImg     = await loadImg(bgSrc);

        if (!selfieImg) {
          console.warn('[CARD][SELFIECARD] selfieImg não carregou.');
          return;
        }

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
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(0, 0, W, H);
        }

        // selfie circular (peito)
        const cx = W / 2;
        const cy = Math.round(H * 0.68);
        const radius = Math.round(W * 0.18);

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

        // textos
        const nomeX = getNomeCanon();
        const guiaCanon = getGuiaCanon();
        const guiaNome = guiaCanon === 'lumen' ? 'Lumen' : guiaCanon === 'zion' ? 'Zion' : 'Arion';

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = 'bold 30px Cardo, serif';
        ctx.fillText(nomeX || 'PARTICIPANTE', cx, Math.round(H * 0.86));

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '22px Cardo, serif';
        ctx.fillText(`Guia: ${guiaNome}`, cx, Math.round(H * 0.91));

        // moldura por cima (sem frameImg fora do escopo)
        const frame = await loadImg(FRAME_SRC);
        if (frame) ctx.drawImage(frame, 0, 0, W, H);

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        } catch (err) {
          console.error('[CARD][SELFIECARD] toDataURL falhou (CORS/tainted?)', err);
          return;
        }

        sessionStorage.setItem('JORNADA_SELFIECARD', dataUrl);
        sessionStorage.setItem('SELFIE_CARD', dataUrl);
        try {
          localStorage.setItem('JORNADA_SELFIECARD', dataUrl);
          localStorage.setItem('SELFIE_CARD', dataUrl);
        } catch {}

        window.JORNADA_STATE = window.JORNADA_STATE || {};
        window.JORNADA_STATE.selfieCard = dataUrl;

        console.log('[CARD][SELFIECARD] ✅ salva!', dataUrl.slice(0, 40) + '...');
      } catch (e) {
        console.error('[CARD][SELFIECARD] erro:', e);
      }
    };

    setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
      else run();
    }, 80);
  }

  function applyThemeFromGuia() {
    const guia = getGuiaCanon();
    let main = '#ffd700', g1 = 'rgba(255,230,180,0.85)', g2 = 'rgba(255,210,120,0.75)';
    if (guia === 'lumen') { main = '#00ff9d'; g1 = 'rgba(0,255,157,0.90)'; g2 = 'rgba(120,255,200,0.70)'; }
    if (guia === 'zion')  { main = '#00aaff'; g1 = 'rgba(0,170,255,0.90)'; g2 = 'rgba(255,214,91,0.70)'; }
    if (guia === 'arion') { main = '#ff00ff'; g1 = 'rgba(255,120,255,0.95)'; g2 = 'rgba(255,180,255,0.80)'; }

    document.documentElement.style.setProperty('--theme-main-color', main);
    document.documentElement.style.setProperty('--progress-main', main);
    document.documentElement.style.setProperty('--progress-glow-1', g1);
    document.documentElement.style.setProperty('--progress-glow-2', g2);
    document.documentElement.style.setProperty('--guide-color', main);
    document.body.setAttribute('data-guia', guia);
  }

  function goNext() {
    try { speechSynthesis.cancel(); } catch {}
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }
    if (window.JC && typeof window.JC.show === 'function') window.JC.show(NEXT_SECTION_ID, { force: true });
  }

  async function init(root) {
    const section = root || qs('#section-card') || qs('#section-eu-na-irmandade');
    if (!section) return;

    buildMarkup(section);
    renderCard(section);
    applyThemeFromGuia();
    scheduleSelfieCardBuild();

    const btnNext = qs('#btnNext', section);
    if (btnNext) btnNext.onclick = goNext;

    const typingEls = qsa('[data-typing="true"]', section);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res => window.runTyping(el, text, res, { speed: 40, cursor: true }));
      } else el.textContent = text;
    }
  }

  document.addEventListener('section:shown', (e) => {
    const id = e.detail && e.detail.sectionId;
    if (!id || SECTION_IDS.indexOf(id) === -1) return;
    const node = e.detail.node || qs('#' + id);
    init(node);
  });

  document.addEventListener('guia:changed', () => setTimeout(applyThemeFromGuia, 30));

  console.log('[' + MOD + '] carregado');
})();
