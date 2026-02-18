/* /assets/js/section-card.js — REBUILD LIMPO DO CARD (versão estável + FIX GUIA) */
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

  function normStr(v) {
    return String(v || '').trim();
  }

  function normalizeGuide(raw) {
    const g = normStr(raw).toLowerCase();

    // aliases defensivos
    if (g === 'arion') return 'arian';
    if (g === 'aryan') return 'arian';

    if (g === 'arian' || g === 'lumen' || g === 'zion') return g;
    return ''; // desconhecido
  }

  // ---- Dados do usuário (nome + guia + selfie) ----
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    try {
      // 1) sessionStorage (mais fiel ao "agora" do fluxo)
      const ssNome = sessionStorage.getItem('jornada.nome') || sessionStorage.getItem('jc.nome');
      const ssGuia = sessionStorage.getItem('jornada.guia') || sessionStorage.getItem('jc.guia');

      // 2) window.JC.data (quando o controller mantém estado em memória)
      const jcNome = (window.JC && window.JC.data && window.JC.data.nome) ? window.JC.data.nome : '';
      const jcGuia = (window.JC && window.JC.data && window.JC.data.guia) ? window.JC.data.guia : '';

      // 3) localStorage (fallback)
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');

      const resolvedNome = ssNome || jcNome || lsNome || nome;
      const resolvedGuia = ssGuia || jcGuia || lsGuia || guia;

      nome = normStr(resolvedNome) || 'AMOR';

      const normGuia = normalizeGuide(resolvedGuia);
      guia = normGuia || 'zion';
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
        src =
          (window.JC && window.JC.data && window.JC.data.selfieDataUrl) ||
          sessionStorage.getItem('jc.selfieDataUrl') ||
          localStorage.getItem('jc.selfieDataUrl');
      } catch {}
      selfieImg.src = src || PLACEHOLDER_SELFIE;
    }

    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) {
      nameSlot.textContent = nome;
    }

    console.log('%c[CARD] Render ok!', 'color: gold', {
      nome,
      guia,
      ssGuia: (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('jornada.guia') : null,
      jcGuia: (window.JC && window.JC.data) ? window.JC.data.guia : null,
      lsGuia: (typeof localStorage !== 'undefined') ? localStorage.getItem('jc.guia') : null
    });
  }

  // ================================
// SELFIECARD — GERAR IMAGEM (OFFSCREEN) + SALVAR NO STORAGE
// Cole logo após: console.log('[CARD] Render ok!', ...)
// ================================
(async function gerarESalvarSelfieCard(){
  try {
    const sec = document.getElementById('section-card') || document;

    const selfieImg = sec.querySelector('#selfieImage');
    const bgImg     = sec.querySelector('#guideBg');

    if (!selfieImg || !selfieImg.src) {
      console.warn('[CARD][SELFIECARD] selfieImage não encontrado/sem src.');
      return;
    }

    // helper: garante que imagem carregou (mesmo se já veio do cache)
    function waitImg(img) {
      return new Promise((resolve) => {
        if (!img) return resolve(false);
        if (img.complete && img.naturalWidth > 0) return resolve(true);
        const done = () => resolve(true);
        const fail = () => resolve(false);
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', fail, { once: true });
        // fallback
        setTimeout(() => resolve(img.complete && img.naturalWidth > 0), 1200);
      });
    }

    // garante carregamento da selfie e do bg (se existir)
    await waitImg(selfieImg);
    if (bgImg) await waitImg(bgImg);

    // tamanho padrão do card (ajuste se quiser)
    const W = 768;
    const H = 1024;

    // canvas offscreen
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { alpha: true });

    // 1) fundo (se existir)
    if (bgImg && bgImg.naturalWidth > 0) {
      // cobre o canvas mantendo proporção
      const r = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * r;
      const dh = bgImg.naturalHeight * r;
      ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      // fallback: fundo escuro leve
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
    }

    // 2) moldura simples (pra já ficar “card”)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // 3) recorte da selfie em círculo (estilo “flame-selfie”)
    const cx = W / 2;
    const cy = 360;
    const radius = 180;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // desenha selfie “cover” dentro do círculo
    const sw = selfieImg.naturalWidth || 1;
    const sh = selfieImg.naturalHeight || 1;
    const scale = Math.max((radius * 2) / sw, (radius * 2) / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(selfieImg, cx - dw / 2, cy - dh / 2, dw, dh);

    ctx.restore();

    // 4) brilho/halo em volta do círculo
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(140,220,255,0.55)';
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(140,220,255,0.55)';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 5) nome e guia (puxa do estado se existir)
    const nome = (window.JORNADA_STATE?.nome || localStorage.getItem('JORNADA_NOME') || '').trim();
    const guia = (window.JORNADA_STATE?.guiaSelecionado || window.JORNADA_STATE?.guia || localStorage.getItem('JORNADA_GUIA') || '').trim();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';

    ctx.font = 'bold 44px Cardo, serif';
    ctx.fillText(nome || 'PARTICIPANTE', cx, 660);

    ctx.font = '28px Cardo, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText((guia ? `Guia: ${guia}` : 'Guia: —'), cx, 710);

    // 6) exporta e salva
    const dataUrl = c.toDataURL('image/png');

    localStorage.setItem('JORNADA_SELFIECARD', dataUrl);
    sessionStorage.setItem('JORNADA_SELFIECARD', dataUrl);
    localStorage.setItem('SELFIE_CARD', dataUrl);
    sessionStorage.setItem('SELFIE_CARD', dataUrl);

    window.JORNADA_STATE = window.JORNADA_STATE || {};
    window.JORNADA_STATE.selfieCard = dataUrl;

    console.log('[CARD][SELFIECARD] ✅ gerada e salva:', dataUrl.slice(0,40) + '...');
  } catch (e) {
    console.error('[CARD][SELFIECARD] erro ao gerar:', e);
  }
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

    function normalizeGuideForTheme(raw) {
      const g = String(raw || '').toLowerCase().trim();
      if (g === 'arion') return 'arian';
      if (g === 'aryan') return 'arian';
      return g;
    }

    function applyThemeFromSession() {
      const guiaRaw = sessionStorage.getItem('jornada.guia');
      const guia = normalizeGuideForTheme(guiaRaw);

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
