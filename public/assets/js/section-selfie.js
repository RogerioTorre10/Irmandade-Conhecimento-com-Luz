/* /assets/js/section-selfie.js — FASE 4.6 (FINAL + FILME DE TRANSIÇÃO)
   - Botão "Não quero Foto" → filme + card
   - Botão "Iniciar" → filme + card
   - Filme roda com VideoTransicao OU fallback manual
   - Nunca trava, nunca dá erro
   - Selfie salva ou skip com flag
   - Layout perfeito, mobile/desktop
   - TÁ LINDO, TÁ PRONTO, TÁ CAMPEÃO!
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase46_bound) return;
  NS.__phase46_bound = true;

  // ---- Config ----
  const MOD = 'section-selfie.js';
  const SECTION_ID = 'section-selfie';
  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/videos/filme-selfie-card.mp4';

  const PREVIEW_MIN_H = 240;
  const PREVIEW_MAX_H = 420;
  const PREVIEW_VH = 38;
  const PREVIEW_AR_W = 3;
  const PREVIEW_AR_H = 4;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Estado
  let stream = null;
  let videoEl = null;
  let canvasEl = null;
  let previewBox = null;

  // ---------- Nome ----------
  function getUpperName() {
    const jc = (global.JC && global.JC.data) ? global.JC.data : {};
    let name = jc.nome || jc.participantName;
    if (!name) {
      try {
        const ls = localStorage.getItem('jc.nome') || localStorage.getItem('jc.participantName');
        if (ls) name = ls;
      } catch {}
    }
    if (!name || typeof name !== 'string') name = 'AMOR';
    const upper = name.toUpperCase().trim();
    try {
      global.JC = global.JC || {};
      global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper;
      global.JC.data.participantName = upper;
      try { localStorage.setItem('jc.nome', upper); } catch {}
    } catch {}
    return upper;
  }

  // ---------- Utils ----------
  const waitForElement = (sel, opt = {}) => new Promise((res, rej) => {
    let t = 0;
    const i = setInterval(() => {
      const e = document.querySelector(sel);
      if (e) { clearInterval(i); res(e); }
      else if (++t > 100) { clearInterval(i); rej(new Error('Timeout waiting for ' + sel)); }
    }, opt.interval || 80);
  });

  const placeAfter = (ref, node) => {
    if (!ref || !ref.parentElement) return;
    if (ref.nextSibling) ref.parentElement.insertBefore(node, ref.nextSibling);
    else ref.parentElement.appendChild(node);
  };

  const toast = msg => { if (global.toast) return global.toast(msg); alert(msg); };

  // ---------- Typing ----------
  async function runTyping(el) {
    if (!el) return;
    const text = (el.dataset.text || el.textContent || '').trim();
    if (!text) return;
    el.textContent = '';
    el.style.opacity = '1';
    const speed = +el.dataset.speed || 35;
    const chars = [...text];
    let i = 0;
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (i < chars.length) el.textContent += chars[i++];
        else { clearInterval(interval); resolve(); }
      }, speed);
    });
  }

  function speak(text) {
    if (!text) return;
    if (global.speak) global.speak(text);
    else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; u.rate = 0.9; u.pitch = 1; window.speechSynthesis.speak(u);
    }
  }

  // ---------- HEADER (COM BOTÃO INDESTRUTÍVEL) ----------
  function ensureHeader(section) {
    let head = section.querySelector('.selfie-header');
    if (head) {
      const btn = head.querySelector('#btn-skip-selfie');
      if (btn) {
        btn.onclick = skipAndPlayTransition;
        return head;
      }
    }

    head = document.createElement('header');
    head.className = 'selfie-header';
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;position:relative;z-index:60;';

    head.innerHTML = `
      <h2 data-text="Tirar sua Foto" data-typing="true" data-speed="40">Tirar sua Foto</h2>
      <button id="btn-skip-selfie" class="btn">Não quero Foto</button>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #btn-skip-selfie {
        background: linear-gradient(145deg, #4a4a4a, #2d2d2d);
        border: 1px solid #666;
        color: #f9e7c2;
        font-family: 'Cardo', serif;
        font-weight: bold;
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 8px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        overflow: hidden;
        min-height: 36px;
      }
      #btn-skip-selfie::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0,50 L10,45 L20,55 L30,48 L40,52 L50,45 L60,55 L70,48 L80,52 L90,45 L100,50 L90,55 L80,48 L70,52 L60,45 L50,55 L40,48 L30,52 L20,45 L10,55 Z" fill="rgba(139,69,19,0.3)" stroke="rgba(160,82,45,0.5)" stroke-width="1"/></svg>') repeat;
        background-size: 18px;
        opacity: 0.6;
        pointer-events: none;
      }
      #btn-skip-selfie:hover { background: linear-gradient(145deg, #5a5a5a, #3d3d3d); }
      #btn-skip-selfie:active { transform: translateY(1px); box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
    `;
    document.head.appendChild(style);

    const btn = head.querySelector('#btn-skip-selfie');
    btn.onclick = skipAndPlayTransition;

    section.prepend(head);
    return head;
  }

  // ---------- Texto ----------
  async function ensureTexto(section) {
    const upper = getUpperName();
    let wrap = section.querySelector('#selfieOrientWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'selfieOrientWrap';
      wrap.style.cssText = 'margin:16px auto 12px;width:92%;max-width:820px;text-align:left;padding:0 12px;box-sizing:border-box;position:relative;z-index:60;';
      section.appendChild(wrap);
    }
    const existing = wrap.querySelector('#selfieTexto'); if (existing) existing.remove();

    const p = document.createElement('p');
    p.id = 'selfieTexto';
    p.style.cssText = 'color:#f9e7c2;font-family:Cardo,serif;font-size:15px;line-height:1.5;margin:0;opacity:0;transition:opacity .5s ease;text-align:left;white-space:normal;word-wrap:break-word;';
    const fullText = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro do enquadramento. Use boa luz e evite sombras.`;
    p.dataset.text = fullText; p.dataset.speed = '30';
    wrap.appendChild(p);
    setTimeout(() => { p.style.opacity = '1'; startTyping(p, fullText, 30); speak(fullText); }, 150);
    return p;
  }
  function startTyping(el, text, speed) { const chars = [...text]; let i=0; el.textContent=''; const it=setInterval(()=>{ if(i<chars.length) el.textContent+=chars[i++]; else clearInterval(it); }, speed); }

  // ---------- Controles ----------
  function ensureControls(section) {
    if (section.querySelector('#selfieControls')) return;
    const style = document.createElement('style');
    style.textContent = `
      #section-selfie{ padding-bottom: clamp(${PREVIEW_MIN_H+40}px, ${PREVIEW_VH+6}vh, ${PREVIEW_MAX_H+60}px); }
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;font-family:Cardo,serif;font-size:14px;position:relative;z-index:60}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px;border-radius:2px;background:#555;outline:none}
      #selfieControls input[type=range]::-webkit-slider-thumb{background:#f9e7c2;border-radius:50%;width:14px;height:14px}
      #selfieButtons{position:relative;z-index:60}
    `;
    document.head.appendChild(style);

    const c = document.createElement('div');
    c.id = 'selfieControls';
    c.innerHTML = `
      <div class="row"><label>Zoom Geral</label><input id="zoomAll" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomAllVal">1.00×</span></div>
      <div class="row"><label>Zoom Horizontal</label><input id="zoomX" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomXVal">1.00×</span></div>
      <div class="row"><label>Zoom Vertical</label><input id="zoomY" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomYVal">1.00×</span></div>`;
    section.appendChild(c);

    const zoomAll = c.querySelector('#zoomAll');
    const zoomX = c.querySelector('#zoomX');
    const zoomY = c.querySelector('#zoomY');
    const zoomAllVal = c.querySelector('#zoomAllVal');
    const zoomXVal = c.querySelector('#zoomXVal');
    const zoomYVal = c.querySelector('#zoomYVal');

    const update = () => {
      const a = +zoomAll.value, x = +zoomX.value, y = +zoomY.value;
      zoomAllVal.textContent = a.toFixed(2) + '×';
      zoomXVal.textContent = x.toFixed(2) + '×';
      zoomYVal.textContent = y.toFixed(2) + '×';
      applyPreviewTransform(a,x,y);
    };
    zoomAll.oninput = update; zoomX.oninput = update; zoomY.oninput = update; update();
  }

  function applyPreviewTransform(a=1,x=1,y=1){ if(!videoEl||!canvasEl) return; const sx=a*x, sy=a*y; videoEl.style.transform=`translate(-50%,-50%) scaleX(${sx}) scaleY(${sy})`; canvasEl.style.transform=`translate(-50%,-50%) scaleX(${sx}) scaleY(${sy})`; }

  // ---------- Botões ----------
  function ensureButtons(section) {
    let div = section.querySelector('#selfieButtons');
    if (!div) {
      const css = document.createElement('style');
      css.textContent = `
        #selfieButtons{display:flex;justify-content:center;align-items:center;gap:clamp(8px,2.4vw,16px);flex-wrap:nowrap;margin:10px auto;width:92%;max-width:820px}
        #selfieButtons .btn{flex:1 1 0;min-width:90px;max-width:240px;height:clamp(30px,6.2vw,36px);line-height:clamp(30px,6.2vw,36px);padding:0 clamp(6px,2vw,12px);font-size:clamp(11px,2.6vw,14px);border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s;text-align:center;white-space:nowrap}
        #selfieButtons .btn:disabled{opacity:.5;cursor:not-allowed}
        @media (max-width:380px){ #selfieButtons .btn{min-width:84px} }
      `;
      document.head.appendChild(css);
      div = document.createElement('div');
      div.id = 'selfieButtons';
      div.innerHTML = `
        <button id="btn-preview" class="btn btn-stone-espinhos">Prévia</button>
        <button id="btn-shot" class="btn btn-stone-espinhos" disabled>Foto</button>
        <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Iniciar</button>`;
      section.appendChild(div);
    }

    if (!NS._buttonsReady) {
      NS._buttonsReady = true;
      const btnPreview = div.querySelector('#btn-preview');
      const btnShot = div.querySelector('#btn-shot');
      const btnConfirm = div.querySelector('#btn-confirm');

      btnPreview.onclick = async () => {
        await startCamera();
        if (btnPreview.textContent !== 'Prévia/Repetir') btnPreview.textContent = 'Prévia/Repetir';
        btnShot.disabled = false; btnConfirm.disabled = false;
      };
      btnShot.onclick = () => capturePhoto();
      btnConfirm.onclick = () => confirmAndPlayTransition();
    }

    div.style.position = 'relative';
    div.style.zIndex = '60';
  }

  // ---------- Prévia fixa ----------
  function ensurePreview(section) {
    if (section.querySelector('#selfiePreviewWrap')) return;
    const style = document.createElement('style');
    style.textContent = `
      #selfiePreviewWrap{position:fixed;left:0;right:0;bottom:12px;width:100%;max-height:clamp(${PREVIEW_MIN_H}px, ${PREVIEW_VH}vh, ${PREVIEW_MAX_H}px);background:rgba(0,0,0,.55);backdrop-filter:blur(2px);border-top:1px solid rgba(255,255,255,.08);z-index:40}
      #selfiePreview{position:relative;margin:8px auto;width:92%;max-width:820px;height:calc(clamp(${PREVIEW_MIN_H}px, ${PREVIEW_VH}vh, ${PREVIEW_MAX_H}px) - 16px);overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#000;aspect-ratio:${PREVIEW_AR_W}/${PREVIEW_AR_H}}
      #selfieViewport{position:absolute;inset:0;overflow:hidden}
      #selfieVideo,#selfieCanvas{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:100%;min-height:100%;}
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'selfiePreviewWrap';
    wrap.innerHTML = `
      <div id="selfiePreview">
        <div id="selfieViewport">
          <video id="selfieVideo" autoplay playsinline muted></video>
          <canvas id="selfieCanvas" style="display:none"></canvas>
        </div>
      </div>`;
    section.appendChild(wrap);

    previewBox = wrap.querySelector('#selfiePreview');
    videoEl = wrap.querySelector('#selfieVideo');
    canvasEl = wrap.querySelector('#selfieCanvas');
  }

  // ---------- Câmera ----------
  async function startCamera() {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) { toast('Câmera não suportada neste dispositivo.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio:false, video:{ facingMode:'user', width:{ideal:1280}, height:{ideal:720} } });
      videoEl.style.display = 'block';
      canvasEl.style.display = 'none';
      videoEl.srcObject = stream;
      videoEl.addEventListener('click', capturePhoto, { once:false });
    } catch (e) { console.error('getUserMedia', e); toast('Não foi possível acessar a câmera. Verifique permissões.'); }
  }
  function stopCamera(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } if(videoEl) videoEl.srcObject=null; }

  // --- Desenho cover no canvas ---
  function drawCover(video, ctx, cw, ch){ const vw=video.videoWidth||1280, vh=video.videoHeight||720; const arV=vw/vh, arC=cw/ch; let sx,sy,sw,sh; if(arV>arC){ sh=vh; sw=Math.floor(vh*arC); sx=Math.floor((vw-sw)/2); sy=0; } else { sw=vw; sh=Math.floor(vw/arC); sx=0; sy=Math.floor((vh-sh)/2); } ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch); }

  function capturePhoto(){ if(!videoEl) return; const cw=Math.floor(previewBox.clientWidth), ch=Math.floor(previewBox.clientHeight); canvasEl.width=cw; canvasEl.height=ch; const ctx=canvasEl.getContext('2d'); drawCover(videoEl, ctx, cw, ch); const dataUrl=canvasEl.toDataURL('image/jpeg', 0.92); videoEl.style.display='none'; canvasEl.style.display='block'; NS._lastCapture=dataUrl; }

  // ---------- NAVEGAÇÃO COM FILME ----------
  function goNext(id) {
    if (global.JC?.show) global.JC.show(id);
    else if (global.showSection) global.showSection(id);
  }

  function playTransitionAndGo(nextId) {
    const videoSrc = VIDEO_SRC;

    if (global.VideoTransicao?.play) {
      try {
        global.VideoTransicao.play({
          src: videoSrc,
          onEnd: () => goNext(nextId)
        });
        return;
      } catch (e) {
        console.warn('VideoTransicao falhou, usando fallback', e);
      }
    }

    const video = document.createElement('video');
    video.src = videoSrc;
    video.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      object-fit: cover; z-index: 9999; background: #000;
    `;
    video.muted = true;
    video.playsInline = true;

    const onEnd = () => {
      video.remove();
      goNext(nextId);
    };

    video.addEventListener('ended', onEnd);
    video.addEventListener('error', () => {
      console.warn('Vídeo falhou, indo direto');
      video.remove();
      goNext(nextId);
    });

    document.body.appendChild(video);
    video.play().catch(() => {
      console.warn('Play bloqueado, indo direto');
      video.remove();
      goNext(nextId);
    });
  }

  // Pular selfie + filme
  function skipAndPlayTransition() {
    try {
      if (global.JC?.data) {
        delete global.JC.data.selfieDataUrl;
        global.JC.data.selfieSkipped = true;
      }
      localStorage.removeItem('jc.selfieDataUrl');
    } catch (e) {}
    stopCamera();
    playTransitionAndGo(NEXT_SECTION_ID);
  }

  // Confirmar foto + filme
  function confirmAndPlayTransition() {
    const dataUrl = NS._lastCapture;
    if (!dataUrl) {
      toast('Tire uma foto primeiro.');
      return;
    }
    try {
      global.JC = global.JC || {};
      global.JC.data = global.JC.data || {};
      global.JC.data.selfieDataUrl = dataUrl;
      try { localStorage.setItem('jc.selfieDataUrl', dataUrl); } catch {}
    } catch (e) {}
    playTransitionAndGo(NEXT_SECTION_ID);
  }

  // ---------- Ordem ----------
  function enforceOrder(section){ const order=['.selfie-header','#selfieOrientWrap','#selfieControls','#selfieButtons','#selfiePreviewWrap']; let attempts=0,max=10; const tryEnforce=()=>{ let prev=null,chg=false; order.forEach(sel=>{ const el=section.querySelector(sel); if(el && prev && el.previousElementSibling!==prev){ el.remove(); placeAfter(prev,el); chg=true; } prev=el||prev; }); attempts++; if(chg && attempts<max) setTimeout(tryEnforce,50); }; tryEnforce(); setTimeout(tryEnforce,300); }
  let orderObserver=null; function startOrderObserver(section){ if(orderObserver) orderObserver.disconnect(); orderObserver=new MutationObserver(()=>enforceOrder(section)); orderObserver.observe(section,{childList:true,subtree:true}); setTimeout(()=>{ if(orderObserver) orderObserver.disconnect(); },3000); }

  // ---------- INIT ----------
  async function play(section){ const header=ensureHeader(section); const title=header.querySelector('h2'); if(title.dataset.typing==='true'){ runTyping(title); speak(title.dataset.text); } ensureTexto(section); ensureControls(section); ensureButtons(section); ensurePreview(section); await sleep(100); startOrderObserver(section); enforceOrder(section); }
  async function init(){ try{ const section=await waitForElement('#'+SECTION_ID); await play(section);} catch(err){ console.error('Erro ao carregar '+MOD+':', err);} }

  document.addEventListener('sectionWillHide', e=>{ if(e?.detail?.sectionId===SECTION_ID) stopCamera(); });
  document.addEventListener('sectionLoaded', e=>{ if(e?.detail?.sectionId===SECTION_ID) init(); });
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

})(window);
