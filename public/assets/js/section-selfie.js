// /assets/js/section-selfie.js
(function () {
  'use strict';

  const SECTION_ID       = 'section-selfie';
  const NEXT_SECTION_ID  = 'section-card'; // ajuste se desejar
  const HIDE_CLASS       = 'hidden';
  const DEFAULT_VIDEO_SRC = '/assets/videos/filme-selfie-card.mp4';

  if (window.JCSelfie?.__bound) { console.log('[JCSelfie] já carregado'); return; }
  window.JCSelfie = window.JCSelfie || {};
  window.JCSelfie.__bound = true;

  // ---------- utils ----------
  const q  = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

  function show(el){ if(!el) return; el.classList.remove(HIDE_CLASS); el.style.removeProperty('display'); el.style.removeProperty('opacity'); el.style.removeProperty('visibility'); el.setAttribute('aria-hidden','false'); }

  function getTransitionSrc(root, btn){
    const fromBtn = btn?.dataset?.transitionSrc;
    const fromSec = root?.dataset?.transitionSrc;
    return (fromBtn && fromBtn.trim()) || (fromSec && fromSec.trim()) || DEFAULT_VIDEO_SRC;
  }

  async function waitForTransitionUnlock(timeoutMs=20000){
    if (!window.__TRANSITION_LOCK) return;
    await Promise.race([
      new Promise(res => document.addEventListener('transition:ended', res, { once:true })),
      new Promise(res => setTimeout(res, timeoutMs))
    ]);
  }

  function playTransition(root, btn, nextId=NEXT_SECTION_ID){
    const src = getTransitionSrc(root, btn);
    if (window.__TRANSITION_LOCK) return;
    window.__TRANSITION_LOCK = true;
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

  // ---------- typing + TTS ----------
  async function localType(el, text, speed=34){
    el.textContent = '';
    let i=0; await new Promise(res => (function tick(){ if(i<text.length){ el.textContent += text.charAt(i++); setTimeout(tick, speed);} else res(); })());
  }
  async function typeOnce(el, text, {speed=34, speak=true}={}){
    if(!el) return;
    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if(!msg) return;

    el.classList.add('typing-active'); el.classList.remove('typing-done');

    let usedFallback=false;
    if (typeof window.runTyping === 'function'){
      await new Promise(res=>{ try{ window.runTyping(el, msg, res, {speed, cursor:true}); }catch{ usedFallback=true; res(); }});
    } else usedFallback=true;
    if (usedFallback) await localType(el, msg, speed);

    el.classList.remove('typing-active'); el.classList.add('typing-done');

    if (speak){
      try{
        await window.EffectCoordinator?.speak?.(msg, { lang:'pt-BR', rate:1.05, pitch:1.0 });
      }catch{}
    }
  }

  async function initSelfieText(root){
    const el = q('#selfieTexto', root);
    if(!el) return;
    show(el);
    const nome = (window.JC?.data?.nome || sessionStorage.getItem('jornada.nome') || 'AMIGO(A)').toString().toUpperCase();
    const fallback = `${nome}, posicione-se em frente à câmera. Centralize o rosto dentro da chama, use luz frontal e ajuste o zoom.`;
    const base = (el.dataset?.text && el.dataset.text.trim()) ? el.dataset.text.trim() : fallback;
    el.dataset.text = base; // garante dataset para próximas execuções
    const msg = base.replace(/\{\{\s*(NOME|nome|name)\s*\}\}/g, nome);
    await typeOnce(el, msg, { speed: Number(el.dataset.speed||34), speak:true });
  }

  // ---------- câmera / zoom ----------
  let stream = null;
  const zoom = { all:1, x:1, y:1 };

  function applyZoom(video, canvas){
    const sx = zoom.all * zoom.x;
    const sy = zoom.all * zoom.y;
    if(video)  video.style.transform = `scale(${sx},${sy})`;
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
      if (errEl){ errEl.textContent = 'Não foi possível acessar a câmera. Verifique as permissões.'; show(errEl); }
      return false;
    }
  }

 // substitua sua captureToCanvas por esta
function captureToCanvas(video, canvas){
  // saída no mesmo aspecto do card (2:3)
  const OUT_W = 768;
  const OUT_H = 1152;

  // mede vídeo
  const vw = video.videoWidth  || 1280;
  const vh = video.videoHeight || 720;

  // prepara canvas de saída
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');

  // aplicamos o mesmo "zoom" do stage (zoom.all * zoom.x/y)
  const sx = (window.JCSelfieZoom?.all ?? 1) * (window.JCSelfieZoom?.x ?? 1);
  const sy = (window.JCSelfieZoom?.all ?? 1) * (window.JCSelfieZoom?.y ?? 1);

  // área de desenho: centralizamos, com pivot ~60% vertical (combina com mask-position)
  ctx.save();
  const cx = vw / 2;
  const cy = vh * 0.60; // ligeiro bias pra baixo
  ctx.translate(OUT_W/2, OUT_H*0.60);
  ctx.scale(sx, sy);

  // escala base para cobrir a área 2:3 sem faixas
  const scaleBase = Math.max(OUT_W / vw, OUT_H / vh);
  ctx.scale(scaleBase, scaleBase);

  // leva o vídeo para o centro do canvas
  ctx.translate(-cx, -cy);
  ctx.drawImage(video, 0, 0, vw, vh);
  ctx.restore();

  // retorna em JPEG
  return canvas.toDataURL('image/jpeg', 0.92);
}


  // ---------- init ----------
  async function initOnce(root){
    if (!root || root.dataset.selfieInitialized === 'true') return;
    root.dataset.selfieInitialized = 'true';

    await waitForTransitionUnlock();

    // força visibilidade dos blocos principais
    show(root);
    ['.selfie-header','.moldura-orientacao','.selfie-grid','.selfie-controls','.selfie-actions','.selfie-preview-wrap']
      .forEach(sel => show(q(sel, root)));

    const title      = q('.titulo-pergaminho', root);
    const errBox     = q('#selfie-error', root);
    const videoEl    = q('#selfieVideo', root);
    const canvasEl   = q('#selfieCanvas', root);
    const previewImg = q('#selfiePreview', root);

    const btnSkip    = q('#btnSkipSelfie', root) || q('#btn-selfie-skip', root);
    const btnStart   = q('#startCamBtn', root)   || q('#btn-selfie-start', root);
    const btnPreview = q('#btn-selfie-preview', root);
    const btnConfirm = q('#btn-selfie-confirm', root);
    const btnNext    = q('#btn-selfie-next', root);

    const zoomAll    = q('#zoomAll', root);
    const zoomX      = q('#zoomX', root);
    const zoomY      = q('#zoomY', root);

    // título + texto
    if (title && !title.classList.contains('typing-done')) {
      await typeOnce(title, null, { speed: Number(title.dataset.speed||32), speak:true });
    }
    await initSelfieText(root);

    // nome maiúsculo (se existir campo)
    const nameInput = q('#nameInput', root);
    if (nameInput){
      const saved = (window.JC?.data?.nome || sessionStorage.getItem('jornada.nome') || '').toString().toUpperCase();
      if (saved) nameInput.value = saved;
      nameInput.addEventListener('input', ()=>{
        const start = nameInput.selectionStart, end = nameInput.selectionEnd;
        nameInput.value = nameInput.value.toUpperCase();
        nameInput.setSelectionRange(start,end);
        sessionStorage.setItem('jornada.nome', nameInput.value);
        window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
        window.JC.data.nome = nameInput.value;
      });
    }

    // iniciar câmera
    btnStart?.addEventListener('click', async ()=>{
      const ok = await startCamera(videoEl, errBox);
      if (!ok) return;
      btnPreview && (btnPreview.disabled = false);
      btnConfirm && (btnConfirm.disabled = false);
      // aplica zoom inicial
      zoom.all = Number(zoomAll?.value || 1);
      zoom.x   = Number(zoomX?.value || 1);
      zoom.y   = Number(zoomY?.value || 1);
      applyZoom(videoEl, canvasEl);
    });

    // ajustes de zoom
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

    // prévia
    btnPreview?.addEventListener('click', ()=>{
      if (!videoEl?.srcObject) { window.toast?.('Ative a câmera primeiro.', 'warning'); return; }
      const dataUrl = captureToCanvas(videoEl, canvasEl);
      previewImg.src = dataUrl;
      show(previewImg.closest('.selfie-preview-wrap'));
      window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
      window.JC.data.selfiePreview = dataUrl;
      window.toast?.('Prévia gerada.', 'success');
    });

    // confirmar
    btnConfirm?.addEventListener('click', ()=>{
      const dataUrl = window.JC?.data?.selfiePreview;
      if (!dataUrl) { window.toast?.('Gere uma prévia antes de confirmar.', 'warning'); return; }
      window.JC.data.selfie = dataUrl;
      if (btnNext){ btnNext.disabled = false; btnNext.classList.add('btn-ready-pulse'); setTimeout(()=>btnNext.classList.remove('btn-ready-pulse'), 900); }
      window.toast?.('Foto confirmada! Você pode iniciar a próxima etapa.', 'success');
    });

    // avançar / pular com vídeo de transição
    btnNext?.addEventListener('click', ()=> playTransition(root, btnNext, NEXT_SECTION_ID));
    btnSkip?.addEventListener('click', ()=> playTransition(root, btnSkip, NEXT_SECTION_ID));

    // limpar câmera ao sair da seção
    document.addEventListener('section:shown', (e)=>{
      if (e?.detail?.sectionId !== SECTION_ID && stream){
        stream.getTracks().forEach(t=>t.stop());
        stream = null;
      }
    }, { passive:true });

    console.log('[JCSelfie] pronto');
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

  // libera lock quando player terminar
  document.addEventListener('transitionVideo:ended', ()=>{
    window.__TRANSITION_LOCK = false;
    document.dispatchEvent(new CustomEvent('transition:ended', { detail:{ from:'selfie' } }));
  });

})();
