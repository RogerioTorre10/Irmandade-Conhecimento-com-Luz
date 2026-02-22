/* /assets/js/section-card.js — REBUILD LIMPO DO CARD (versão estável v2.0)
   - guia canon: sempre vem do JORNADA_GUIA (session/local) + fallback para state/JC
   - SELFIECARD: gera 1x por sessão (ou quando guia/nome mudar), sem travar UI
   - moldura: /assets/img/borda-medieval-espinhos.png (fundo transparente OK)
*/
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png',
    arion: '/assets/img/irmandade-quarteto-bg-arian.png' // arquivo existente (arian), id canônico = arion
  };

  const FRAME_SRC = '/assets/img/borda-medieval-espinhos1.png';
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.png';

  const qs  = (s, r = document) => r.querySelector(s);

  // -----------------------------
  // Normalização de guia
  // -----------------------------
  function canonGuia(v) {
    const raw = String(v || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw === 'guia' || raw === 'guide' || raw === 'selecionado') return '';
    if (raw.includes('lumen')) return 'lumen';
    if (raw.includes('zion')) return 'zion';
    if (raw.includes('arion') || raw.includes('arian')) return 'arion';
    return raw; // último recurso
  }

  function prettyGuia(id) {
    const g = canonGuia(id);
    return g === 'lumen' ? 'Lumen'
         : g === 'zion'  ? 'Zion'
         : g === 'arion' ? 'Arion'
         : (id ? String(id) : '');
  }

  function getNome() {
    try {
      const n =
        window.JORNADA_STATE?.nome ||
        localStorage.getItem('JORNADA_NOME') ||
        localStorage.getItem('jc.nome') ||
        window.JC?.data?.nome ||
        '';
      return (n || 'AMOR').toUpperCase().trim();
    } catch {
      return 'AMOR';
    }
  }

  function getGuiaCanon() {
    // prioridade: JORNADA_GUIA (session -> local), depois state, depois JC/jc.*
    let g = '';
    try {
      g = canonGuia(sessionStorage.getItem('JORNADA_GUIA')) ||
          canonGuia(localStorage.getItem('JORNADA_GUIA')) ||
          canonGuia(window.JORNADA_STATE?.guiaSelecionado) ||
          canonGuia(window.JORNADA_STATE?.guia) ||
          canonGuia(window.JC?.data?.guiaSelecionado) ||
          canonGuia(window.JC?.data?.guia) ||
          canonGuia(localStorage.getItem('jc.guia')) ||
          canonGuia(localStorage.getItem('jc.guiaSelecionado')) ||
          '';
    } catch {}
    // fallback seguro
    if (!g || !CARD_BG[g]) g = 'zion';
    return g;
  }

  function persistGuiaCanon(g) {
    const guiaCanon = canonGuia(g);
    if (!guiaCanon || !CARD_BG[guiaCanon]) return;
    try {
      window.JORNADA_STATE = window.JORNADA_STATE || {};
      window.JORNADA_STATE.guia = guiaCanon;
      window.JORNADA_STATE.guiaSelecionado = guiaCanon;

      sessionStorage.setItem('JORNADA_GUIA', guiaCanon);
      localStorage.setItem('JORNADA_GUIA', guiaCanon);
    } catch {}
  }

  // -----------------------------
  // Monta HTML interno 1x
  // -----------------------------
  function buildMarkup(section) {
    if (!section || section.__CARD_BUILT__) return;

    section.innerHTML = `
      <div class="j-panel-glow card-panel">
        <div class="conteudo-pergaminho">
          <h2
            data-typing="true"
            data-text="Eu na Irmandade"
            data-speed="40"
            data-cursor="true"
            class="titulo-selfie"
          >Eu na Irmandade</h2>

          <img id="guideBg" class="guide-bg" alt="Fundo do Guia" />

          <div class="flame-layer show placeholder-only" aria-hidden="true">
            <img
              id="selfieImage"
              class="flame-selfie"
              src="${PLACEHOLDER_SELFIE}"
              alt="Sua foto na Irmandade"
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

  // -----------------------------
  // Render UI do Card
  // -----------------------------
  function renderCard(section) {
    if (!section) return;

    const nome = getNome();
    const guia = getGuiaCanon();     // <- aqui é o ponto crítico (não usa jc.guia velho)
    persistGuiaCanon(guia);

    const guideBg = qs('#guideBg', section);
    if (guideBg) guideBg.src = CARD_BG[guia] || CARD_BG.zion;

    const selfieImg = qs('#selfieImage', section);
    if (selfieImg) {
      let src = '';
      try {
        src =
          window.JORNADA_STATE?.selfieDataUrl ||
          window.JC?.data?.selfieDataUrl ||
          localStorage.getItem('jc.selfieDataUrl') ||
          localStorage.getItem('JORNADA_SELFIE') ||
          '';
      } catch {}
      selfieImg.src = src || PLACEHOLDER_SELFIE;
    }

    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) nameSlot.textContent = nome;

    console.log('%c[CARD] Render ok!', 'color: gold', { nome, guia });

    // gera SELFIECARD em idle (não trava)
    selfieCardSafeMode(section, { nome, guia });
  }

  // -----------------------------
  // Loader de imagem "canvas-safe"
  // - evita taint: não seta crossOrigin para data:/ / / same-origin
  // -----------------------------
  function isSameOrigin(url) {
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin;
    } catch {
      return false;
    }
  }

  function loadImg(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);

      const im = new Image();

      const s = String(src);
      const shouldUseCORS =
        !(s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('/')) &&
        !isSameOrigin(s);

      if (shouldUseCORS) im.crossOrigin = 'anonymous';

      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = s;
    });
  }

  function makeWhiteTransparent(img, threshold = 245) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;

    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0);

    const im = x.getImageData(0, 0, c.width, c.height);
    const d = im.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (r >= threshold && g >= threshold && b >= threshold) d[i + 3] = 0;
    }

    x.putImageData(im, 0, 0);
    return c;
  }

  // -----------------------------
  // SELFIECARD — SAFE MODE
  // - 1x por sessão OU quando (nome+guia) mudar
  // -----------------------------
  function selfieCardSafeMode(section, ctxData) {
    const nome = ctxData?.nome || getNome();
    const guia = ctxData?.guia || getGuiaCanon();

    const signature = `${nome}__${guia}`;
    const last = sessionStorage.getItem('__SELFIECARD_SIG__') || '';
    if (last === signature && sessionStorage.getItem('JORNADA_SELFIECARD')) {
      // já tem a mesma selfiecard pra esse nome/guia nesta sessão
      return;
    }
    sessionStorage.setItem('__SELFIECARD_SIG__', signature);

    const run = async () => {
      try {
        const sec = section || document.getElementById('section-card') || document;

        const selfieSrc = sec.querySelector('#selfieImage')?.src || '';
        const bgSrc = sec.querySelector('#guideBg')?.src || (CARD_BG[guia] || CARD_BG.zion);

        const selfieImg = await loadImg(selfieSrc);
        const bgImg = await loadImg(bgSrc);
        let frameImg = await loadImg(FRAME_SRC);

        if (!selfieImg) {
          console.warn('[CARD][SELFIECARD] selfieImg não carregou.');
          return;
        }

        // Se a moldura vier com fundo branco, remove para alpha
        let frameCanvas = null;
        if (frameImg) {
          try {
            frameCanvas = makeWhiteTransparent(frameImg, 245);
          } catch {
            frameCanvas = null;
          }
        }

        const W = 512, H = 720;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const c = canvas.getContext('2d', { alpha: true });

        // fundo
        if (bgImg && bgImg.naturalWidth > 0) {
          const r = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
          const dw = bgImg.naturalWidth * r;
          const dh = bgImg.naturalHeight * r;
          c.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        } else {
          c.fillStyle = 'rgba(0,0,0,0.85)';
          c.fillRect(0, 0, W, H);
        }

        // selfie circular — DESCE para o peito (antes estava alto)
        const cx = W / 2;
        const cy = Math.round(H * 0.72);        // 72% (peito, não rosto)
        const radius = Math.round(W * 0.18);

        c.save();
        c.beginPath();
        c.arc(cx, cy, radius, 0, Math.PI * 2);
        c.closePath();
        c.clip();

        const sw = selfieImg.naturalWidth || 1;
        const sh = selfieImg.naturalHeight || 1;
        const scale = Math.max((radius * 2) / sw, (radius * 2) / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        c.drawImage(selfieImg, cx - dw / 2, cy - dh / 2, dw, dh);
        c.restore();

        // moldura por cima (full bleed)
        if (frameCanvas) c.drawImage(frameCanvas, 0, 0, W, H);
        else if (frameImg) c.drawImage(frameImg, 0, 0, W, H);

        // texto (nome + guia) no rodapé
        const nomeX = nome || 'PARTICIPANTE';
        const guiaNome = prettyGuia(guia);

        const nomeY = Math.round(H * 0.86);
        const guiaY = Math.round(H * 0.91);

        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,0.92)';
        c.font = 'bold 30px Cardo, serif';
        c.fillText(nomeX, cx, nomeY);

        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.font = '22px Cardo, serif';
        c.fillText(guiaNome ? `Guia: ${guiaNome}` : 'Guia: —', cx, guiaY);

        // export (PNG preserva transparência melhor quando tiver)
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/png');
        } catch (err) {
          console.error('[CARD][SELFIECARD] toDataURL falhou (CORS/tainted?)', err);
          return;
        }

        // salva em chaves padrão
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

    // roda fora do paint, sem travar
    setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
      else run();
    }, 60);
  }

  // -----------------------------
  // Navegação
  // -----------------------------
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

  // -----------------------------
  // Init (section:shown friendly)
  // -----------------------------
  function findSection(root) {
    if (root && root.id && SECTION_IDS.includes(root.id)) return root;
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function bind(section) {
    const btnNext = qs('#btnNext', section);
    if (btnNext && !btnNext.__BOUND__) {
      btnNext.__BOUND__ = true;
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goNext();
      });
    }
  }

  function init(root) {
    const section = findSection(root || null);
    if (!section) return;

    buildMarkup(section);
    renderCard(section);
    bind(section);
  }

  // boot
  document.addEventListener('DOMContentLoaded', () => init());
  document.addEventListener('section:shown', (ev) => {
    const sec = ev?.detail?.section || ev?.target;
    init(sec);
  });

})();
