// /assets/js/section-selfie.js
(function () {
  'use strict';

  const SECTION_ID       = 'section-selfie';
  const NEXT_SECTION_ID  = 'section-card'; // sempre leva para o card
  const HIDE_CLASS       = 'hidden';
  const DEFAULT_VIDEO_SRC = '/assets/videos/filme-selfie-card.mp4';

  if (window.JCSelfie?.__bound) { console.log('[JCSelfie] já carregado'); return; }
  window.JCSelfie = window.JCSelfie || {};
  window.JCSelfie.__bound = true;

  // ---------- utils ----------
  const q  = (s, r=document) => r.querySelector(s);
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  function show(el){ if(!el) return; el.classList.remove(HIDE_CLASS); el.style.removeProperty('display'); el.setAttribute('aria-hidden','false'); }

  async function waitForTransitionUnlock(timeoutMs=20000){
    if (!window.__TRANSITION_LOCK) return;
    await Promise.race([
      new Promise(res => document.addEventListener('transition:ended', res, { once:true })),
      new Promise(res => setTimeout(res, timeoutMs))
    ]);
  }

  function playTransition(root, btn, nextId=NEXT_SECTION_ID){
    if (window.__TRANSITION_LOCK) return;
    window.__TRANSITION_LOCK = true;
    const src = root?.dataset?.transitionSrc || DEFAULT_VIDEO_SRC;
    document.dispatchEvent(new CustomEvent('transition:started', { detail:{src,nextId} }));
    try { speechSynthesis?.cancel?.(); } catch {}
    if (typeof window.playTransitionVideo === 'function'){
      try { window.playTransitionVideo(src, nextId); return; }
      catch(e){ console.warn('[Selfie] playTransitionVideo falhou', e); }
    }
    window.__TRANSITION_LOCK = false;
    document.dispatchEvent(new CustomEvent('transition:ended', { detail:{fallback:true} }));
    window.JC?.show?.(nextId) ?? (location.hash = `#${nextId}`);
  }

  // ---------- câmera / zoom ----------
  let stream = null;
  const zoom = { all:1, x:1, y:1 };

  function applyZoom(video, canvas){
    const sx = zoom.all * zoom.x;
    const sy = zoom.all * zoom.y;
    if(video)  video.style.transform = `scaleX(-1) scale(${sx},${sy})`;
    if(canvas) canvas.style.transform = `scale(${sx},${sy})`;
  }

  async function startCamera(videoEl, errEl){
    try{
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:'user', width:{ideal:1280}, height:{ideal:720} }, audio:false
      });
      videoEl.srcObject = stream;
      await videoEl.play();
      return true;
    }catch(e){
      console.warn('[Selfie] getUserMedia erro:', e);
      if (errEl){ errEl.textContent = 'Não foi possível acessar a câmera. Verifique permissões.'; show(errEl); }
      return false;
    }
  }

  function captureToCanvas(video, canvas){
    const OUT_W = 768, OUT_H = 1152;
    const vw = video.videoWidth  || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = OUT_W; canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');

    const sx = (window.JCSelfieZoom?.all ?? 1) * (window.JCSelfieZoom?.x ?? 1);
    const sy = (window.JCSelfieZoom?.all ?? 1) * (window.JCSelfieZoom?.y ?? 1);

    ctx.save();
    const cx = vw / 2;
    const cy = vh * 0.60;
    ctx.translate(OUT_W/2, OUT_H*0.60);
    ctx.scale(sx, sy);
    const scaleBase = Math.max(OUT_W / vw, OUT_H / vh);
    ctx.scale(scaleBase, scaleBase);
    ctx.translate(-cx, -cy);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // ---------- init principal ----------
  async function initOnce(root){
    if (!root || root.dataset.selfieInitialized === 'true') return;
    root.dataset.selfieInitialized = 'true';
    await waitForTransitionUnlock();

    show(root);
    ['.selfie-header','.selfie-container','.selfie-actions','.selfie-zoom']
      .forEach(sel => show(q(sel, root)));

    const errBox     = q('#selfie-error', root);
    const videoEl    = q('#selfie-video', root);
    const canvasEl   = q('#selfie-canvas', root);
    const frameEl    = q('#selfie-frame', root);
    const previewEl  = q('#selfie-preview', root);

    const btnPrev    = q('#btn-selfie-previa', root);
    const btnRetry   = q('#btn-selfie-refazer', root);
    const btnConfirm = q('#btn-selfie-confirmar', root);

    const zoomAll    = q('#zoom-all', root);
    const zoomX      = q('#zoom-x', root);
    const zoomY      = q('#zoom-y', root);

    // start camera
    const ok = await startCamera(videoEl, errBox);
    if (!ok) return;
    zoom.all = Number(zoomAll?.value || 1);
    zoom.x   = Number(zoomX?.value || 1);
    zoom.y   = Number(zoomY?.value || 1);
    applyZoom(videoEl, canvasEl);
    window.JCSelfieZoom = { all: zoom.all, x: zoom.x, y: zoom.y };

    function onZoomChange(){
      zoom.all = Number(zoomAll?.value || 1);
      zoom.x   = Number(zoomX?.value || 1);
      zoom.y   = Number(zoomY?.value || 1);
      applyZoom(videoEl, canvasEl);
      window.JCSelfieZoom = { all: zoom.all, x: zoom.x, y: zoom.y };
    }
    zoomAll?.addEventListener('input', onZoomChange);
    zoomX?.addEventListener('input', onZoomChange);
    zoomY?.addEventListener('input', onZoomChange);

    // Botão PRÉVIA
    btnPrev?.addEventListener('click', ()=>{
      if (!videoEl?.srcObject){ window.toast?.('Ative a câmera primeiro.', 'warning'); return; }
      const dataUrl = captureToCanvas(videoEl, canvasEl);
      previewEl.src = dataUrl;
      previewEl.style.display = 'block';
      window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
      window.JC.data.selfiePreview = dataUrl;
      window.toast?.('Prévia gerada.', 'success');
      btnPrev.disabled = true;
      btnRetry.disabled = false;
      btnConfirm.disabled = false;
    });

    // Botão NÃO CONFIRMAR
    btnRetry?.addEventListener('click', ()=>{
      previewEl.style.display = 'none';
      btnPrev.disabled = false;
      btnRetry.disabled = true;
      btnConfirm.disabled = true;
      window.toast?.('Tire outra foto.', 'info');
    });

    // Botão CONFIRMAR
    btnConfirm?.addEventListener('click', ()=>{
      const dataUrl = window.JC?.data?.selfiePreview;
      if (!dataUrl){ window.toast?.('Gere uma prévia antes de confirmar.', 'warning'); return; }
      window.JC.data.selfie = dataUrl;
      window.toast?.('Selfie confirmada! Indo para o card...', 'success');
      playTransition(root, btnConfirm, NEXT_SECTION_ID);
    });

    // limpar câmera ao sair da seção
    document.addEventListener('section:shown', (e)=>{
      if (e?.detail?.sectionId !== SECTION_ID && stream){
        stream.getTracks().forEach(t=>t.stop());
        stream = null;
      }
    }, { passive:true });

    console.log('[JCSelfie] pronto e operante');
  }

  function onSectionShown(evt){
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  document.addEventListener('section:shown', onSectionShown, { passive:true });

  // fallback: se já estiver visível
  const now = document.getElementById(SECTION_ID);
  if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);

  document.addEventListener('transitionVideo:ended', ()=>{
    window.__TRANSITION_LOCK = false;
    document.dispatchEvent(new CustomEvent('transition:ended', { detail:{ from:'selfie' } }));
  });

})();
