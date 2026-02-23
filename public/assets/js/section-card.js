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
  arion: '/assets/img/irmandade-quarteto-bg-arian.png', // mantém o arquivo que você já tem
  lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
  zion:  '/assets/img/irmandade-quarteto-bg-zion.png',
};

  const FRAME_SRC = '/assets/img/borda-medieval-espinhos1.png';
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.png';

  const qs  = (s, r = document) => r.querySelector(s);

  // -----------------------------
  // Normalização de guia
  // -----------------------------
function canonGuia(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return '';
  if (s.includes('lumen')) return 'lumen';
  if (s.includes('zion')) return 'zion';
  if (s.includes('arion') || s.includes('arian')) return 'arion';
  return s;
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
  // prioridade correta: STATE/SELFIE atual -> storage -> JC/jc.*
  let g = '';
  try {
    g =
      canonGuia(window.JORNADA_STATE?.guiaSelecionado) ||
      canonGuia(window.JORNADA_STATE?.guia) ||
      canonGuia(window.JC?.data?.guiaSelecionado) ||
      canonGuia(window.JC?.data?.guia) ||
      canonGuia(sessionStorage.getItem('JORNADA_GUIA')) ||
      canonGuia(localStorage.getItem('JORNADA_GUIA')) ||
      canonGuia(localStorage.getItem('jc.guiaSelecionado')) ||
      canonGuia(localStorage.getItem('jc.guia')) ||
      '';
  } catch {}

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
  // canon único (arion) + robustez
  const canonGuiaLocal = (v) => {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return '';
    if (s.includes('lumen')) return 'lumen';
    if (s.includes('zion')) return 'zion';
    if (s.includes('arion') || s.includes('arian')) return 'arion';
    if (s === 'guia') return '';
    return s;
  };

  const nome = (ctxData?.nome || getNome() || 'PARTICIPANTE').trim();

  // prioridade: ctxData.guia -> storages/state -> fallback
  const guia =
    canonGuiaLocal(ctxData?.guia) ||
    canonGuiaLocal(typeof getGuiaCanon === 'function' ? getGuiaCanon() : '') ||
    canonGuiaLocal(window.JORNADA_STATE?.guiaSelecionado) ||
    canonGuiaLocal(window.JORNADA_STATE?.guia) ||
    canonGuiaLocal(sessionStorage.getItem('JORNADA_GUIA')) ||
    canonGuiaLocal(localStorage.getItem('JORNADA_GUIA')) ||
    'zion';

  // grava o guia canon aqui também (pra não voltar “fantasma” depois)
  try {
    sessionStorage.setItem('JORNADA_GUIA', guia);
    localStorage.setItem('JORNADA_GUIA', guia);
    window.JORNADA_STATE = window.JORNADA_STATE || {};
    window.JORNADA_STATE.guia = guia;
    window.JORNADA_STATE.guiaSelecionado = guia;
  } catch (_) {}

  const signature = `${String(nome).trim()}__${guia}`;
  const last = sessionStorage.getItem('__SELFIECARD_SIG__') || '';
  if (last === signature && sessionStorage.getItem('JORNADA_SELFIECARD')) return;
  sessionStorage.setItem('__SELFIECARD_SIG__', signature);

// =========================
// Moldura REAL externa (trim alpha)
// =========================
function trimAlphaStrict(srcCanvas) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 5) { // alpha > 5
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // fallback: se não achou nada, devolve original
  if (!found) return srcCanvas;

  const tw = Math.max(1, maxX - minX + 1);
  const th = Math.max(1, maxY - minY + 1);

  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;

  out.getContext('2d').drawImage(
    srcCanvas,
    minX, minY, tw, th,
    0, 0, tw, th
  );

  return out;
}

if (frameCanvas) {
  const trimmed = trimAlphaStrict(frameCanvas);
  c.drawImage(trimmed, 0, 0, W, H);
} else if (frameImg) {
  const tmp = document.createElement('canvas');
  tmp.width = frameImg.naturalWidth || frameImg.width;
  tmp.height = frameImg.naturalHeight || frameImg.height;
  tmp.getContext('2d').drawImage(frameImg, 0, 0);
  const trimmed = trimAlphaStrict(tmp);
  c.drawImage(trimmed, 0, 0, W, H);
}

  const run = async () => {
  try {
    const sec = section || document.getElementById('section-card') || document;

    const selfieSrc = sec.querySelector('#selfieImage')?.src || '';
    const bgSrc =
      sec.querySelector('#guideBg')?.src ||
      (CARD_BG?.[guia] || CARD_BG?.zion || '');

   const selfieImg = await loadImg(selfieSrc);
const bgImg     = await loadImg(bgSrc);
let   frameImg  = await loadImg(FRAME_SRC);

if (!selfieImg) {
  console.warn('[CARD][SELFIECARD] selfieImg não carregou.');
  return;
}

// cria a versão transparente da moldura (remove fundo branco)
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

    // =========================
    // 1) BG FULL-BLEED (sem fundo preto, sem vinheta)
    // =========================
    if (bgImg && bgImg.naturalWidth > 0) {
      const r = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * r;
      const dh = bgImg.naturalHeight * r;
      c.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      // fallback neutro (se não vier bg)
      c.fillStyle = '#111';
      c.fillRect(0, 0, W, H);
    }

    // =========================
    // 2) SAFE AREA (só pra posicionar elementos)
    // =========================
    const SAFE = 34;          // ajuste fino: 28~44
    const ix = SAFE, iy = SAFE;
    const iW = W - SAFE * 2;
    const iH = H - SAFE * 2;

    // helper: rounded-rect
    function roundRectPath(ctx, x, y, w, h, r) {
      const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    // =========================
    // 3) Placeholder 2x2 (quadrado arredondado) no PEITO
    // =========================
    const cx = ix + iW / 2;

    // peito (mais baixo que rosto)
    const cy = iy + Math.round(iH * 0.63);   // ajuste fino: 0.61~0.66

    const box = Math.round(iW * 0.34);       // 2x2
    const rBox = Math.round(box * 0.20);     // arredondamento
    const x0 = Math.round(cx - box / 2);
    const y0 = Math.round(cy - box / 2);

    c.save();
    roundRectPath(c, x0, y0, box, box, rBox);
    c.clip();

    const sw = selfieImg.naturalWidth || 1;
    const sh = selfieImg.naturalHeight || 1;
    const scale = Math.max(box / sw, box / sh);
    const dw2 = sw * scale;
    const dh2 = sh * scale;
    c.drawImage(selfieImg, cx - dw2 / 2, cy - dh2 / 2, dw2, dh2);
    c.restore();

    // =========================
    // 4) Texto (ainda dentro do SAFE)
    // =========================
    const nomeX = (nome || 'PARTICIPANTE').trim();
    const guiaNome = (typeof prettyGuia === 'function') ? prettyGuia(guia) : guia;

    const nomeY = iy + Math.round(iH * 0.90);
    const guiaY = iy + Math.round(iH * 0.95);

    c.textAlign = 'center';
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.font = 'bold 30px Cardo, serif';
    c.fillText(nomeX, cx, nomeY);

    c.fillStyle = 'rgba(255,255,255,0.78)';
    c.font = '22px Cardo, serif';
    c.fillText(guiaNome ? `Guia: ${guiaNome}` : 'Guia: —', cx, guiaY);

    // =========================
    // 5) Moldura OUTER (BLEED maior que o canvas)
    //    -> “encosta fora” e elimina aparência “pra dentro”
    // =========================
    const BLEED = 18; // ajuste fino: 10~26 (maior = moldura mais “pra fora”)
    if (frameCanvas) c.drawImage(frameCanvas, -BLEED, -BLEED, W + BLEED * 2, H + BLEED * 2);
    else if (frameImg) c.drawImage(frameImg, -BLEED, -BLEED, W + BLEED * 2, H + BLEED * 2);

    // =========================
    // 6) Export + persist
    // =========================
    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch (err) {
      console.error('[CARD][SELFIECARD] toDataURL falhou (CORS/tainted?)', err);
      return;
    }

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
