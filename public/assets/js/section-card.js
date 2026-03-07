/* /assets/js/section-card.js — STABLE CLEAN BUILD (com SELFIECARD + moldura dourada) */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas-raizes';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    arion: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };

  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.png';

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

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
        canonGuia(sessionStorage.getItem('jornada.guia')) || // compat legado (se existir)
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
      // compat legado
      sessionStorage.setItem('jornada.guia', guiaCanon);
    } catch {}
  }

  // -----------------------------
  // Tema (cor do guia) — aplica CSS vars
  // -----------------------------
  function applyThemeFromStorage() {
    const guia = getGuiaCanon();

    // fallback dourado
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

  // -----------------------------
  // Markup do Card (cria uma vez)
  // -----------------------------
  function buildMarkup(section) {
    if (!section) return;
    if (section.__CARD_BUILT__) return;

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

  // -----------------------------
  // Render do Card (bg + selfie + nome)
  // -----------------------------
  function renderCard(section) {
    if (!section) return;

    const nome = getNome();
    const guia = getGuiaCanon();
    persistGuiaCanon(guia);
    applyThemeFromStorage();

    const guideBg = qs('#guideBg', section);
    if (guideBg) guideBg.src = CARD_BG[guia] || CARD_BG.zion;

    const selfieImg = qs('#selfieImage', section);
    if (selfieImg) {
      let src = '';
      try {
        src =
          window.JORNADA_STATE?.selfieDataUrl ||
          window.JC?.data?.selfieDataUrl ||
          sessionStorage.getItem('JORNADA_SELFIE') ||
          localStorage.getItem('JORNADA_SELFIE') ||
          localStorage.getItem('jc.selfieDataUrl') ||
          '';
      } catch {}

      // evita reciclar a selfieCard como se fosse selfie
      try {
        const sc1 = sessionStorage.getItem('JORNADA_SELFIECARD') || '';
        const sc2 = sessionStorage.getItem('SELFIE_CARD') || '';
        if (src && (src === sc1 || src === sc2)) src = '';
      } catch {}

      selfieImg.src = src || PLACEHOLDER_SELFIE;
    }

    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) nameSlot.textContent = nome;

    console.log('%c[CARD] Render ok!', 'color: gold', { nome, guia });

    // gera SELFIECARD sem travar
    selfieCardSafeMode(section, { nome, guia });
  }

  // -----------------------------
  // Canvas helpers
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

  function drawGoldFrame(ctx, W, H, opts = {}) {
    const pad = Math.max(10, opts.pad ?? 28);
    const rad = Math.max(6, opts.radius ?? 28);
    const glow = opts.glow ?? true;

    function rrPath(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    ctx.save();

    if (glow) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255, 210, 120, 0.55)";
    }

    rrPath(2, 2, W - 4, H - 4, rad + 6);
    ctx.fillStyle = "rgba(255, 220, 160, 0.08)";
    ctx.fill();

    ctx.shadowBlur = 0;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0.00, "rgba(255, 242, 210, 0.95)");
    grad.addColorStop(0.25, "rgba(255, 205, 120, 0.95)");
    grad.addColorStop(0.50, "rgba(210, 150, 70, 0.95)");
    grad.addColorStop(0.75, "rgba(255, 205, 120, 0.95)");
    grad.addColorStop(1.00, "rgba(255, 242, 210, 0.95)");

    ctx.lineWidth = pad;
    ctx.strokeStyle = grad;
    rrPath(pad / 2, pad / 2, W - pad, H - pad, rad);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(60, 30, 10, 0.35)";
    rrPath(pad + 2, pad + 2, W - (pad + 4) * 2, H - (pad + 4) * 2, Math.max(8, rad - 10));
    ctx.stroke();

    if (glow) {
      const spark = (x, y, a = 0.85) => {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
        ctx.restore();
      };
      spark(pad * 0.55, pad * 0.55, 0.55);
      spark(W - pad * 0.55, pad * 0.55, 0.45);
      spark(pad * 0.55, H - pad * 0.55, 0.45);
      spark(W - pad * 0.55, H - pad * 0.55, 0.55);
    }

    ctx.restore();
  }

  // -----------------------------
  // Gera SELFIECARD (não trava)
  // -----------------------------
  function selfieCardSafeMode(section, ctxData) {
    const nome = String(ctxData?.nome || getNome() || 'PARTICIPANTE').trim();
    const guia = canonGuia(ctxData?.guia) || getGuiaCanon() || 'zion';

    const signature = `${nome}__${guia}`;
    const last = sessionStorage.getItem('__SELFIECARD_SIG__') || '';
    if (last === signature && sessionStorage.getItem('JORNADA_SELFIECARD')) return;
    sessionStorage.setItem('__SELFIECARD_SIG__', signature);

    const run = async () => {
      const sec = section || document.getElementById('section-card') || document;

      const selfieSrc =
        (window.JORNADA_STATE?.selfieDataUrl || '') ||
        (sessionStorage.getItem('JORNADA_SELFIE') || '') ||
        (localStorage.getItem('JORNADA_SELFIE') || '') ||
        (localStorage.getItem('jc.selfieDataUrl') || '') ||
        (sec.querySelector('#selfieImage')?.src || '');

      const bgSrc =
        (sec.querySelector('#guideBg')?.getAttribute('src') || '') ||
        (sec.querySelector('#guideBg')?.src || '') ||
        (CARD_BG?.[guia] || CARD_BG?.zion || '');

      const bgImg = await loadImg(bgSrc);
      let selfieImg = await loadImg(selfieSrc);

      if (!selfieImg) {
        console.warn('[CARD][SELFIECARD] selfieImg não carregou. Usando PLACEHOLDER_SELFIE.');
        selfieImg = await loadImg(PLACEHOLDER_SELFIE);
      }
      if (!selfieImg) {
        console.warn('[CARD][SELFIECARD] PLACEHOLDER_SELFIE também falhou.');
        return;
      }

      const W = 512, H = 720;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const c = canvas.getContext('2d', { alpha: true });

      // fundo sólido (evita checker)
      c.fillStyle = '#0b0f16';
      c.fillRect(0, 0, W, H);

      const P = 34;
      const ix = P, iy = P, iw = W - 2 * P, ih = H - 2 * P;

      // BG do guia (cover) dentro
      if (bgImg && (bgImg.naturalWidth || bgImg.width)) {
        const bw = bgImg.naturalWidth || bgImg.width;
        const bh = bgImg.naturalHeight || bgImg.height;
        const r = Math.max(iw / bw, ih / bh);
        const dw = bw * r;
        const dh = bh * r;
        c.drawImage(bgImg, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh);
      } else {
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fillRect(ix, iy, iw, ih);
      }

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

      // selfie 2x2 (quadrado arredondado no “peito”)
      const cx = ix + iw / 2;
      const cy = iy + ih * 0.72;
      const box = iw * 0.42;
      const rBox = box * 0.18;
      const x0 = Math.round(cx - box / 2);
      const y0 = Math.round(cy - box / 2);

      c.save();
      roundRectPath(c, x0, y0, box, box, rBox);
      c.clip();

      const sw = selfieImg.naturalWidth || selfieImg.width || 1;
      const sh = selfieImg.naturalHeight || selfieImg.height || 1;
      const scale = Math.max(box / sw, box / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      c.drawImage(selfieImg, cx - dw / 2, cy - dh / 2, dw, dh);
      c.restore();

      // moldura dourada
      drawGoldFrame(c, W, H, { pad: 28, radius: 28, glow: true });

      // textos
      const guiaNome = prettyGuia(guia);

      c.textAlign = 'center';
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.font = 'bold 30px Cardo, serif';
      c.fillText(nome.toUpperCase(), cx, iy + ih * 0.90);

      c.fillStyle = 'rgba(255,255,255,0.78)';
      c.font = '22px Cardo, serif';
      c.fillText(`Guia: ${guiaNome || '—'}`, cx, iy + ih * 0.95);

      // export
      const dataUrl = canvas.toDataURL('image/png');

      sessionStorage.setItem('JORNADA_SELFIECARD', dataUrl);
      sessionStorage.setItem('SELFIE_CARD', dataUrl);
      try {
        localStorage.setItem('JORNADA_SELFIECARD', dataUrl);
        localStorage.setItem('SELFIE_CARD', dataUrl);
      } catch {}

      window.JORNADA_STATE = window.JORNADA_STATE || {};
      window.JORNADA_STATE.selfieCard = dataUrl;

      console.log('[CARD][SELFIECARD] ✅ salva!', signature);
    };

    // promise global pra outras partes (PDF) poderem aguardar
    try {
      window.__SELFIECARD_PROMISE__ = new Promise((resolve) => {
        setTimeout(() => {
          const done = () => resolve(true);

          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              Promise.resolve().then(run).then(done).catch(done);
            }, { timeout: 1200 });
          } else {
            Promise.resolve().then(run).then(done).catch(done);
          }
        }, 60);
      });
    } catch {
      window.__SELFIECARD_PROMISE__ = Promise.resolve(true);
    }
  }

  // -----------------------------
  // Navegação
  // -----------------------------
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}

    const proceed = () => {
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        return;
      }
      if (window.JC && typeof window.JC.show === 'function') {
        window.JC.show(NEXT_SECTION_ID, { force: true });
      }
    };

    try {
      Promise.race([
        window.__SELFIECARD_PROMISE__ || Promise.resolve(),
        new Promise((r) => setTimeout(r, 900)),
      ]).then(proceed).catch(proceed);
    } catch {
      proceed();
    }
  }

  // -----------------------------
  // Bind + init
  // -----------------------------
  function findSection(root) {
    if (root && root.id && SECTION_IDS.includes(root.id)) return root;
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  async function runTypingInSection(section) {
    const typingEls = qsa('[data-typing="true"]', section);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      const speed = Number(el.dataset.speed || 40);
      const cursor = String(el.dataset.cursor || 'true') !== 'false';

      if (typeof window.runTyping === 'function') {
        await new Promise((res) => window.runTyping(el, text, res, { speed, cursor }));
      } else {
        el.textContent = text;
      }
    }
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

    // typing (não bloqueia navegação se algo der errado)
    runTypingInSection(section).catch(() => {});
  }

  // -----------------------------
  // Hook do controller
  // -----------------------------
  document.addEventListener('DOMContentLoaded', () => {
    applyThemeFromStorage();
  });

  document.addEventListener('section:shown', (e) => {
    const id = e.detail && e.detail.sectionId;
    if (!id || SECTION_IDS.indexOf(id) === -1) return;
    const node = e.detail.node || qs('#' + id);
    init(node);
  });

  console.log('[' + MOD + '] carregado');
})();
