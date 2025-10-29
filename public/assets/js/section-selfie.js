/* /assets/js/section-selfie.js — FASE 3 (corrigido)
   - Typing + TTS com nome
   - Controles de ZOOM (all/x/y)
   - Botões (Skip, Prévia, Tirar outra, Confirmar) + área de prévia
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase3_bound) return;
  NS.__phase3_bound = true;

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
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper; global.JC.data.participantName = upper;
      try { localStorage.setItem('jc.nome', upper); } catch {}
    } catch {}
    return upper;
  }

  // ---------- Utils ----------
  function waitForElement(selector, { tries = 80, interval = 120 } = {}) {
    return new Promise((resolve, reject) => {
      let n = 0;
      const t = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(t); resolve(el); }
        else if (++n >= tries) { clearInterval(t); reject(new Error('Elemento não encontrado: ' + selector)); }
      }, interval);
    });
  }
  function isVisible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && !el.classList.contains('hidden') && el.offsetParent !== null;
  }
  function toast(msg){ if(global.toast) return global.toast(msg); console.log('[Toast]',msg); alert(msg); }

  // ---------- TTS ----------
  function waitVoices(timeout = 1500) {
    return new Promise(resolve => {
      const v0 = speechSynthesis.getVoices(); if (v0 && v0.length) return resolve(v0);
      const id = setInterval(() => {
        const v = speechSynthesis.getVoices(); if (v && v.length){ clearInterval(id); resolve(v); }
      }, 100);
      setTimeout(()=>{ clearInterval(id); resolve(speechSynthesis.getVoices()||[]); }, timeout);
    });
  }
  async function speakWithWebSpeech(text){
    if(!('speechSynthesis' in global)) throw new Error('speechSynthesis indisponível');
    try{ speechSynthesis.cancel(); }catch{}
    const u = new SpeechSynthesisUtterance(text);
    const voices = await waitVoices();
    u.voice = voices.find(v=>/pt[-_]?BR/i.test(v.lang)) || voices.find(v=>/pt([-_]?PT)?/i.test(v.lang)) || voices[0];
    u.rate=1; u.pitch=1; u.volume=1;
    return new Promise(res=>{ u.onend=res; speechSynthesis.speak(u); });
  }
  async function trySpeak(text,label=''){
    if(!text || global.isMuted===true) return;
    if(global.TTS?.speak){ try{ await global.TTS.speak(text); return; }catch{} }
    if(global.TypingBridge?.speak){ try{ await global.TypingBridge.speak(text); return; }catch{} }
    try{ await speakWithWebSpeech(text); }catch(e){ console.warn('[Selfie:TTS] falhou:',e); }
  }

  // ---------- Typing ----------
  function estimateTypingMs(text, speed){ return Math.max(400, text.length*speed)+300; }
  async function fallbackType(el, text, speed, cursor){
    return new Promise(resolve=>{
      const chars=[...text]; el.textContent=''; el.classList.add('typing-active');
      let i=0; const t=setInterval(()=>{
        el.textContent+=chars[i++]; if(i>=chars.length){ clearInterval(t);
          el.classList.remove('typing-active'); el.classList.add('typing-done'); resolve(); }
      }, Math.max(5, speed));
      if(cursor) el.style.setProperty('--caret','"|"');
    });
  }
  async function runTyping(el){
    if(!el) return;
    const text=(el.getAttribute('data-text')||el.textContent||'').trim();
    const speed=Number(el.getAttribute('data-speed')||30);
    const cursor=el.getAttribute('data-cursor')!=='false';
    const wantsTTS=el.getAttribute('data-tts')!=='false';
    if(global.TypingBridge?.runTyping){
      try{
        global.TypingBridge.runTyping(el,{speed,cursor});
        await new Promise(r=>setTimeout(r, estimateTypingMs(text,speed)));
      }catch(e){ await fallbackType(el,text,speed,cursor); }
    }else{
      await fallbackType(el,text,speed,cursor);
    }
    if(wantsTTS) await trySpeak(text,'[runTyping]');
  }

  // ---------- Orientação + Título ----------
  function ensureTitle(section){
    let head = section.querySelector('.selfie-header');
    let h2   = section.querySelector('.selfie-header h2');
    if(!head){
      head=document.createElement('header'); head.className='selfie-header';
      head.style.display='flex'; head.style.alignItems='center'; head.style.gap='10px';
      section.prepend(head);
    }
    if(!h2){
      h2=document.createElement('h2'); h2.textContent='Tirar sua Foto ✨';
      head.appendChild(h2);
      const skip=document.createElement('button');
      skip.id='btn-skip-selfie'; skip.className='btn btn-stone-espinhos'; skip.textContent='Não quero foto / Iniciar';
      skip.addEventListener('click', onSkip); head.appendChild(skip);
    }
    if(!h2.hasAttribute('data-typing')){
      h2.setAttribute('data-typing','true'); h2.setAttribute('data-cursor','true');
      h2.setAttribute('data-speed','40'); h2.setAttribute('data-tts','true');
      h2.setAttribute('data-text', h2.textContent.trim()||'Tirar sua Foto ✨');
    }
    return h2;
  }

  function ensureOrientation(section){
    const upperName=getUpperName();
    // preferir um contêiner interno do pergaminho se existir
    const container = section.querySelector('.conteudo-pergaminho') || section.querySelector('.parchment-inner-rough') || section;
    let wrap = section.querySelector('#selfieOrientWrap');
    if(!wrap){
      wrap=document.createElement('div'); wrap.id='selfieOrientWrap';
      wrap.style.display='flex'; wrap.style.justifyContent='center'; wrap.style.marginTop='8px';
      // inserir logo após o cabeçalho
      const header = section.querySelector('.selfie-header');
      if(header?.nextSibling) container.insertBefore(wrap, header.nextSibling); else container.appendChild(wrap);
    }
    let p = section.querySelector('#selfieTexto');
    if(!p){
      p=document.createElement('p'); p.id='selfieTexto';
      p.style.cssText='background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto 10px;width:90%;';
      wrap.appendChild(p);
    }
    const base = p.getAttribute('data-text') || p.textContent || `${upperName}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
    const msg  = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);
    p.setAttribute('data-typing','true'); p.setAttribute('data-cursor','true'); p.setAttribute('data-tts','true'); p.setAttribute('data-speed','28'); p.setAttribute('data-text', msg);
    return p;
  }

  // ---------- ZOOM ----------
  function loadZoom(){ try{ const r=localStorage.getItem('jc.selfie.zoom'); if(r) return JSON.parse(r);}catch{} return {all:1,x:1,y:1}; }
  function saveZoom(z){ try{ localStorage.setItem('jc.selfie.zoom', JSON.stringify(z)); }catch{} }
  function getTransformTarget(){ return document.getElementById('selfieVideo') || document.getElementById('selfieStage') || null; }
  function applyZoom(z){
    const t=getTransformTarget(); if(!t) return;
    const sx=Number(z.all)*Number(z.x), sy=Number(z.all)*Number(z.y);
    t.style.transformOrigin='center'; t.style.transform=`scale(${sx},${sy})`;
    global.JCSelfieZoom={all:Number(z.all),x:Number(z.x),y:Number(z.y)};
  }

  function ensureZoomControls(section){
    if(section.querySelector('#selfieControls')) return;
    const cssId='selfieControlsStyle';
    if(!document.getElementById(cssId)){
      const css=document.createElement('style'); css.id=cssId;
      css.textContent=`
        #selfieControls{margin:8px auto 10px;width:92%;max-width:680px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;color:#f9e7c2;font-family:Cardo,serif;font-size:14px}
        #selfieControls .row{display:grid;grid-template-columns:140px 1fr 64px;gap:8px;align-items:center;margin:6px 0}
        #selfieControls input[type="range"]{width:100%}
        #selfieControls .val{text-align:right;font-variant-numeric:tabular-nums}
      `;
      document.head.appendChild(css);
    }
    const bar=document.createElement('div'); bar.id='selfieControls';
    const z=loadZoom();
    bar.innerHTML=`
      <div class="row"><label for="zoomAll">Zoom Geral</label><input id="zoomAll" type="range" min="0.5" max="2.0" step="0.01" value="${z.all}"><span class="val" id="zoomAllVal">${z.all.toFixed(2)}×</span></div>
      <div class="row"><label for="zoomX">Zoom Horizontal</label><input id="zoomX" type="range" min="0.5" max="2.0" step="0.01" value="${z.x}"><span class="val" id="zoomXVal">${z.x.toFixed(2)}×</span></div>
      <div class="row"><label for="zoomY">Zoom Vertical</label><input id="zoomY" type="range" min="0.5" max="2.0" step="0.01" value="${z.y}"><span class="val" id="zoomYVal">${z.y.toFixed(2)}×</span></div>
    `;
    const anchor = section.querySelector('#selfieOrientWrap') || section.querySelector('.selfie-header') || section;
    anchor.parentElement.insertBefore(bar, anchor.nextSibling);

    const inpAll=bar.querySelector('#zoomAll'), inpX=bar.querySelector('#zoomX'), inpY=bar.querySelector('#zoomY');
    const valAll=bar.querySelector('#zoomAllVal'), valX=bar.querySelector('#zoomXVal'), valY=bar.querySelector('#zoomYVal');
    function update(){
      const z2={all:Number(inpAll.value),x:Number(inpX.value),y:Number(inpY.value)};
      valAll.textContent=`${z2.all.toFixed(2)}×`; valX.textContent=`${z2.x.toFixed(2)}×`; valY.textContent=`${z2.y.toFixed(2)}×`;
      applyZoom(z2); saveZoom(z2);
    }
    inpAll.addEventListener('input', update);
    inpX.addEventListener('input', update);
    inpY.addEventListener('input', update); // <- CORRIGIDO (tinha faltado o ".")
    applyZoom(z); global.JCSelfieZoom={all:z.all,x:z.x,y:z.y};
  }

  // ---------- Botões + Prévia ----------
  function ensureButtons(section){
    if(section.querySelector('#selfieButtons')) return;

    if(!document.getElementById('selfieButtonsStyle')){
      const css=document.createElement('style'); css.id='selfieButtonsStyle';
      css.textContent=`
        #selfieButtons{display:flex;gap:10px;justify-content:center;align-items:center;margin:10px auto;width:92%;max-width:680px;flex-wrap:wrap}
        #selfieButtons .btn{min-width:160px}
        #selfiePreview{display:none;margin:6px auto 0;width:92%;max-width:680px;background:rgba(0,0,0,.25);padding:10px;border-radius:12px;text-align:center}
        #selfiePreview img{max-width:100%;height:auto;display:inline-block;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.35)}
      `;
      document.head.appendChild(css);
    }

    const buttons=document.createElement('div');
    buttons.id='selfieButtons';
    buttons.innerHTML=`
      <button id="btn-selfie-preview" class="btn btn-stone-espinhos">Prévia</button>
      <button id="btn-selfie-retake"  class="btn btn-stone-espinhos" disabled>Tirar outra Selfie</button>
      <button id="btn-selfie-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>
    `;
    const after = section.querySelector('#selfieControls') || section.querySelector('#selfieOrientWrap') || section;
    after.parentElement.insertBefore(buttons, after.nextSibling);

    const preview=document.createElement('div'); preview.id='selfiePreview';
    preview.innerHTML=`<img id="selfiePreviewImg" alt="Prévia da selfie">`;
    buttons.parentElement.insertBefore(preview, buttons.nextSibling);

    buttons.querySelector('#btn-selfie-preview').addEventListener('click', ()=>doPreview());
    buttons.querySelector('#btn-selfie-retake').addEventListener('click', ()=>clearPreview());
    buttons.querySelector('#btn-selfie-confirm').addEventListener('click', ()=>doConfirm());
  }

  function getVideo(){ return document.getElementById('selfieVideo'); }

  function doPreview(){
    const video=getVideo();
    if(!video || !video.videoWidth){ toast('Câmera não disponível para prévia. Verifique permissões.'); return; }
    const canvas=document.createElement('canvas'); canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const dataUrl=canvas.toDataURL('image/png');
    const img=document.getElementById('selfiePreviewImg'); img.src=dataUrl;
    const box=document.getElementById('selfiePreview'); box.style.display='block';
    document.getElementById('btn-selfie-retake').disabled=false;
    document.getElementById('btn-selfie-confirm').disabled=false;
    try{ global.JC=global.JC||{}; global.JC.data=global.JC.data||{}; global.JC.data.__selfieTempDataUrl=dataUrl; }catch{}
  }
  function clearPreview(){
    const img=document.getElementById('selfiePreviewImg'); if(img) img.src='';
    const box=document.getElementById('selfiePreview'); if(box) box.style.display='none';
    const r=document.getElementById('btn-selfie-retake'), c=document.getElementById('btn-selfie-confirm');
    if(r) r.disabled=true; if(c) c.disabled=true;
    try{ if(global.JC?.data) delete global.JC.data.__selfieTempDataUrl; }catch{}
  }
  function doConfirm(){
    const temp=global.JC?.data?.__selfieTempDataUrl;
    if(!temp){ toast('Faça uma prévia antes de confirmar.'); return; }
    try{
      global.JC=global.JC||{}; global.JC.data=global.JC.data||{};
      global.JC.data.selfieDataUrl=temp; delete global.JC.data.__selfieTempDataUrl;
    }catch{}
    if(global.JC?.show) global.JC.show('section-card');
    else if(typeof global.showSection==='function') global.showSection('section-card');
  }
  function onSkip(){
    try{ global.JC=global.JC||{}; global.JC.data=global.JC.data||{}; global.JC.data.skipSelfie=true; }catch{}
    if(global.JC?.show) global.JC.show('section-card');
    else if(typeof global.showSection==='function') global.showSection('section-card');
  }

  // ---------- Pipeline ----------
  async function playPhase(section){
    if(!isVisible(section)){
      const mo=new MutationObserver(()=>{ if(isVisible(section)){ mo.disconnect(); playPhase(section);} });
      mo.observe(section,{attributes:true,attributeFilter:['class','style','aria-hidden']});
      return;
    }
    if(section.__selfie_phase3_done) return;

    const title = ensureTitle(section);
    const orient= ensureOrientation(section);
    section.scrollIntoView({behavior:'smooth', block:'start'});

    await runTyping(title);
    await runTyping(orient);

    ensureZoomControls(section);
    ensureButtons(section);

    section.__selfie_phase3_done=true;
    const ev=new CustomEvent('selfie:phase3:done',{detail:{sectionId:'section-selfie'}});
    section.dispatchEvent(ev); document.dispatchEvent(ev);
  }

  async function init(){
    try{ const s=await waitForElement('#section-selfie'); playPhase(s); }
    catch(e){ console.warn('[Selfie] #section-selfie não encontrado:', e.message); }
  }
  document.addEventListener('sectionLoaded', e => { if(e?.detail?.sectionId==='section-selfie') init(); });
  if(document.readyState==='complete' || document.readyState==='interactive') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
