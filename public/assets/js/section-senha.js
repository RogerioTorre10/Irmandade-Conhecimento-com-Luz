// section-senha.js — v16 (start instantâneo de verdade + eager hunt + transição)
// - Dispara já (força visibilidade e não espera "estar visível")
// - rAF a cada frame (até 800ms) + MutationObserver global para iniciar assim que #senha-instr* surgir
// - Anti-invasão: aborta efeitos se outra seção assumir
// - Datilografia local (E→D) + Leitura por parágrafo (Promise/estimativa)
// - Botões habilitados + Olho mágico; "Avançar" toca vídeo e depois navega

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v16) {
    window.JCSenha.__kick?.();
    return;
  }

  // ===== Config =====
  const TYPE_MS = 55;
  const PAUSE_BETWEEN_P = 90;
  const EST_WPM = 160;
  const EST_CPS = 13;
  const EAGER_RAF_MAX = 800; // ms

  const TRANSITION_SRC = '/assets/img/irmandade-no-jardim.mp4';
  const NEXT_SECTION_DEFAULT = 'section-escolha';

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v16 = true;
  window.JCSenha.state = {
    running: false,
    abortId: 0,
    sectionObs: null,
    docObs: null
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);

  // CSS: garante E→D durante digitação
  (function injectCSS(){
    if (document.getElementById('jc-senha-align-patch-v16')) return;
    const s = document.createElement('style');
    s.id='jc-senha-align-patch-v16';
    s.textContent = `
      #section-senha .typing-active{
        text-align:left !important; direction:ltr !important;
        display:block !important; width:100% !important;
        margin-left:0 !important; margin-right:auto !important;
      }`;
    document.head.appendChild(s);
  })();

  const sel = {
    root:  '#section-senha',
    p1:    '#senha-instr1',
    p2:    '#senha-instr2',
    p3:    '#senha-instr3',
    p4:    '#senha-instr4',
    input: '#senha-input',
    toggle: '.btn-toggle-senha, [data-action="toggle-password"]',
    next:  '#btn-senha-avancar',
    prev:  '#btn-senha-prev'
  };

  function pick(root){
    return {
      root,
      p1: root.querySelector(sel.p1),
      p2: root.querySelector(sel.p2),
      p3: root.querySelector(sel.p3),
      p4: root.querySelector(sel.p4),
      input: root.querySelector(sel.input),
      toggle: root.querySelector(sel.toggle),
      next: root.querySelector(sel.next),
      prev: root.querySelector(sel.prev),
    };
  }

  function ensureDataText(el){
    if(!el) return false;
    const ds=(el.dataset?.text||'').trim();
    const tc=(el.textContent||'').trim();
    const src=ds||tc;
    if(!src) return false;
    el.dataset.text=src;
    return true;
  }

  function prepareTyping(el){
    if(!el) return false;
    if(!('prevAlign' in el.dataset)) el.dataset.prevAlign=el.style.textAlign||'';
    if(!('prevDir' in el.dataset))   el.dataset.prevDir  =el.getAttribute('dir')||'';
    el.style.setProperty('text-align','left','important');
    el.setAttribute('dir','ltr');
    el.style.display='block';
    el.style.width='100%';
    el.style.marginLeft='0';
    el.style.marginRight='auto';
    el.textContent='';
    el.classList.remove('typing-done');
    el.classList.add('typing-active');
    delete el.dataset.spoken;
    return true;
  }

  function restoreTyping(el){
    if(!el) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    el.style.textAlign = el.dataset.prevAlign || '';
    if(el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  async function localType(el, text, speed, myAbort){
    return new Promise(resolve=>{
      let i=0; el.textContent='';
      const tick=()=>{ 
        if(myAbort.cancelled()) { restoreTyping(el); return resolve(); }
        if(i < text.length){ el.textContent += text.charAt(i++); setTimeout(tick, speed); }
        else resolve();
      };
      tick();
    });
  }

  function estSpeakMs(text){
    const t=(text||'').trim(); if(!t) return 300;
    const words=t.split(/\s+/).length;
    const byWpm=(words/EST_WPM)*60000;
    const byCps=(t.length/EST_CPS)*1000;
    return Math.max(byWpm, byCps, 700);
  }

  async function speakOnce(text, myAbort){
    if(!text || myAbort.cancelled()) return;
    try{
      if(window.EffectCoordinator?.speak){
        const r=window.EffectCoordinator.speak(text);
        if(r && typeof r.then==='function'){
          await Promise.race([r, (async()=>{while(!myAbort.cancelled()) await sleep(12);})()]);
          return;
        }
      }
    }catch{}
    const ms = estSpeakMs(text);
    const t0 = Date.now();
    while(!myAbort.cancelled() && (Date.now()-t0)<ms) await sleep(12);
  }

  function makeAbortToken(){
    const myId = ++window.JCSenha.state.abortId;
    return { id: myId, cancelled: ()=> myId !== window.JCSenha.state.abortId };
  }

  async function typeOnce(el, myAbort){
    if(!el || myAbort.cancelled()) return '';
    const text=(el.dataset?.text||'').trim(); if(!text) return '';
    prepareTyping(el);
    await localType(el, text, TYPE_MS, myAbort);
    if(!myAbort.cancelled()) restoreTyping(el);
    return myAbort.cancelled()? '' : text;
  }

  function getSeq(root){
    const {p1,p2,p3,p4} = pick(root);
    return [p1,p2,p3,p4].filter(Boolean);
  }

  // ---------- TRANSIÇÃO (vídeo) ----------
  function playTransitionThen(nextStep){
    if (document.getElementById('senha-transition-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'senha-transition-overlay';
    overlay.style.cssText = `position:fixed; inset:0; background:#000; z-index:999999; display:flex; align-items:center; justify-content:center;`;
    const video = document.createElement('video');
    video.src = TRANSITION_SRC;
    video.autoplay = true; video.muted = true; video.playsInline = true; video.controls = false;
    video.style.cssText = 'width:100%; height:100%; object-fit:cover;';
    overlay.appendChild(video);
    document.body.appendChild(overlay);
    let done=false;
    const cleanup=()=>{ if(done) return; done=true; try{ video.pause(); }catch{} overlay.remove(); nextStep?.(); };
    video.addEventListener('ended', cleanup, { once:true });
    video.addEventListener('error', () => setTimeout(cleanup, 1200), { once:true });
    setTimeout(()=>{ if(!done) cleanup(); }, 8000);
    Promise.resolve().then(()=>video.play?.()).catch(()=>setTimeout(cleanup, 800));
  }

  // ---------- OBSERVERS & CONTROLES ----------
  function armSectionObserver(root){
    try{
      if (window.JCSenha.state.sectionObs) window.JCSenha.state.sectionObs.disconnect();
      const obs=new MutationObserver(()=>{
        if (!window.JCSenha.state.running) runSequence(root);
      });
      obs.observe(root,{childList:true,subtree:true});
      window.JCSenha.state.sectionObs = obs;
    }catch{}
  }

  function armDocObserver(){
    try{
      if (window.JCSenha.state.docObs) window.JCSenha.state.docObs.disconnect();
      const obs=new MutationObserver((muts)=>{
        // assim que QUALQUER parágrafo da senha pingar no DOM, dispara
        for (const m of muts){
          if (!(m.addedNodes && m.addedNodes.length)) continue;
          for (const n of m.addedNodes){
            if (!(n instanceof Element)) continue;
            if (n.matches?.('#senha-instr1, #senha-instr2, #senha-instr3, #senha-instr4') ||
                n.querySelector?.('#senha-instr1, #senha-instr2, #senha-instr3, #senha-instr4')) {
              window.JCSenha.__kick();
              return;
            }
          }
        }
      });
      obs.observe(document.documentElement, { childList:true, subtree:true });
      window.JCSenha.state.docObs = obs;
    }catch{}
  }

  function bindControls(root){
    const { input, toggle, next, prev } = pick(root);
    // Habilita botões
    prev?.removeAttribute('disabled'); next?.removeAttribute('disabled');

    // Olho mágico
    if (toggle && !toggle.__senhaBound) {
      toggle.addEventListener('click', () => {
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      toggle.__senhaBound = true;
    }

    // Voltar (mesma lógica do v14/v15)
    if (prev && !prev.__senhaBound) {
      prev.addEventListener('click', () => {
        const rootEl = qs(sel.root);
        const candidates = [
          prev.dataset?.backHref,
          prev.getAttribute?.('data-href'),
          rootEl?.dataset?.backHref,
          window.JC?.homeUrl,
          (document.referrer && new URL(document.referrer).origin === window.location.origin ? document.referrer : null),
          '/'
        ].filter(Boolean);
        const target = candidates[0];
        try { window.top.location.assign(target); } catch { window.location.href = target; }
      });
      prev.__senhaBound = true;
    }

    // Avançar → transição + navega
    if (next && !next.__senhaBound) {
      next.addEventListener('click', () => {
        if (!input) return;
        const senha=(input.value||'').trim();
        if (senha.length < 3) {
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try{ input.focus(); }catch{}
          return;
        }
        const rootEl = qs(sel.root);
        const nextId =
          next.dataset?.nextSection ||
          rootEl?.dataset?.nextSection ||
          NEXT_SECTION_DEFAULT;
        playTransitionThen(() => { try { window.JC?.show?.(nextId); } catch {} });
      });
      next.__senhaBound = true;
    }
  }

  // ---------- SEQUÊNCIA ----------
  async function runSequence(root){
    if(!root || window.JCSenha.state.running) return;

    window.JCSenha.state.running = true;
    const myAbort = makeAbortToken();

    const seq = getSeq(root);
    if (seq.length === 0) { window.JCSenha.state.running=false; return; }

    // Normaliza e limpa visual
    seq.forEach(p=>{
      if(ensureDataText(p)) p.textContent='';
      p.classList.remove('typing-done','typing-active');
      delete p.dataset.spoken;
      p.style.display='block'; p.style.width='100%';
      p.style.setProperty('text-align','left','important');
      p.setAttribute('dir','ltr');
      p.style.marginLeft='0'; p.style.marginRight='auto';
    });

    for (const p of seq){
      if (myAbort.cancelled()) break;
      const text = await typeOnce(p, myAbort);
      if (myAbort.cancelled()) break;
      if (text && !p.dataset.spoken){
        await speakOnce(text, myAbort);
        if (myAbort.cancelled()) break;
        p.dataset.spoken='true';
      }
      const t0=Date.now();
      while(!myAbort.cancelled() && (Date.now()-t0)<PAUSE_BETWEEN_P) await sleep(8);
    }

    window.JCSenha.state.running = false;
  }

  // ---------- KICK (start imediato, sem depender de visibilidade) ----------
  function tryKick(){
    const root = qs(sel.root);
    if(!root) return false;

    // FORÇA visibilidade estrutural: sem esperar controlador
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    bindControls(root);
    armSectionObserver(root);

    // Eager hunt por até 800ms: dispara assim que qualquer parágrafo existir
    const t0 = performance.now();
    const hunt = () => {
      const seq = getSeq(root);
      if (seq.length > 0) { runSequence(root); return; }
      if ((performance.now() - t0) < EAGER_RAF_MAX) {
        requestAnimationFrame(hunt);
      }
    };
    requestAnimationFrame(hunt);

    // Observador global: se os parágrafos chegarem depois do frame, ele inicia
    armDocObserver();
    return true;
  }

  // API pública
  window.JCSenha.__kick = tryKick;

  // Eventos oficiais: inicia na hora; aborta quando outra seção aparece
  document.addEventListener('section:shown', (evt)=>{
    const id = evt?.detail?.sectionId;
    if(!id) return;
    if (id === 'section-senha') {
      window.JCSenha.state.abortId++; // reseta rodadas antigas
      tryKick();
    } else {
      // outra seção assumiu → aborta datilografia/leitura aqui
      window.JCSenha.state.abortId++;
    }
  });

  // Disparos imediatos (no carregamento do script)
  tryKick();
  Promise.resolve().then(()=>tryKick());
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(()=>tryKick());
  }

})();
