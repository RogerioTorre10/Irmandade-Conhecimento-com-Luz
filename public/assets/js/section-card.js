// ================================
// SELFIECARD — GERAR IMAGEM (OFFSCREEN) + SALVAR NO STORAGE (para section-final)
// Cole logo após: console.log('[CARD] Render ok!', ...)
// ================================
(async function gerarESalvarSelfieCard(){
  try {
    const sec = document.getElementById('section-card') || document;

    const selfieImg = sec.querySelector('#selfieImage'); // ✅ você já tem esse id
    const bgImg     = sec.querySelector('#guideBg');     // ✅ você já tem esse id

    if (!selfieImg || !selfieImg.src) {
      console.warn('[CARD][SELFIECARD] selfieImage não encontrado/sem src.');
      return;
    }

    function waitImg(img) {
      return new Promise((resolve) => {
        if (!img) return resolve(false);
        if (img.complete && img.naturalWidth > 0) return resolve(true);
        const done = () => resolve(true);
        const fail = () => resolve(false);
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', fail, { once: true });
        setTimeout(() => resolve(img.complete && img.naturalWidth > 0), 1200);
      });
    }

    await waitImg(selfieImg);
    if (bgImg) await waitImg(bgImg);

    const W = 768;
    const H = 1024;

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { alpha: true });

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

    // moldura leve
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // selfie em círculo
    const cx = W / 2;
    const cy = 360;
    const radius = 180;

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

    // halo
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(140,220,255,0.55)';
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(140,220,255,0.55)';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // nome + guia
    const nome = (window.JORNADA_STATE?.nome || localStorage.getItem('JORNADA_NOME') || '').trim();
    const guia = (window.JORNADA_STATE?.guiaSelecionado || window.JORNADA_STATE?.guia || localStorage.getItem('JORNADA_GUIA') || '').trim();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';

    ctx.font = 'bold 44px Cardo, serif';
    ctx.fillText(nome || 'PARTICIPANTE', cx, 660);

    ctx.font = '28px Cardo, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText((guia ? `Guia: ${guia}` : 'Guia: —'), cx, 710);

    const dataUrl = c.toDataURL('image/png');

    localStorage.setItem('JORNADA_SELFIECARD', dataUrl);
    sessionStorage.setItem('JORNADA_SELFIECARD', dataUrl);
    localStorage.setItem('SELFIE_CARD', dataUrl);
    sessionStorage.setItem('SELFIE_CARD', dataUrl);

    window.JORNADA_STATE = window.JORNADA_STATE || {};
    window.JORNADA_STATE.selfieCard = dataUrl;

    console.log('[CARD][SELFIECARD] ✅ gerada e salva:', dataUrl.slice(0, 40) + '...');
  } catch (e) {
    console.error('[CARD][SELFIECARD] erro ao gerar:', e);
  }
})();
