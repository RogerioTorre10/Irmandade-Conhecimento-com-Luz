// section-senha.js — v13 (ultrarrápido: start imediato + anti-invasão)
// - Dispara imediatamente (no load, microtask e rAF) e em section:shown
// - Sem probe/intervalos: zero espera pra começar
// - Anti-invasão: aborta se outra seção for mostrada
// - Datilografia local (E→D) + Leitura por parágrafo (aguarda Promise; senão, estima)
// - Botões habilitados e olho mágico ativo

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v13) {
    // rearmar se já carregado
    window.JCSenha.__kick?.(/*force*/true);
    return;
  }

  // ===== Config =====
  const TYPE_MS = 55;          // ms/char (datilografia)
  const PAUSE_BETWEEN_P = 90;  // pausa curtinha entre parágrafos
  const EST_WPM = 160;         // fallback p/ TTS
  const EST_CPS = 13;

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v13 = true;
  window.JCSenha.state = {
    running: false,
    observer: null,
    abortId: 0
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);

  // CSS para garantir E→D durante digitação (vence centralização do pai)
  (function injectCSS(){
    if (document.getElementById('jc-senha-align-patch-v13')) return;
    const s = document.createElement('style');
    s.id='jc-senha-align-patch-v13';
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
          await Promise.race([r, (async()=>{while(!myAbort.cancelled()) await sleep(20);})()]);
          return;
        }
      }
    }catch{}
    const ms = estSpeakMs(text);
    const t0 = Date.now();
    while(!myAbort.cancelled() && (Date.now()-t0)<ms) await sleep(20);
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

  function bindControls(root){
    const { input, toggle, next, prev } = pick(root);
    // Habilita botões já
    prev?.removeAttribute('disabled');
    next?.removeAttribute('disabled');

    // Olho mágico
    if (toggle && !toggle.__senhaBound) {
      toggle.addEventListener('click', () => {
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      toggle.__senhaBound = true;
    }

    // Navegação
    if (prev && !prev.__senhaBound) {
      prev.addEventListener('click', () => { try { window.JC?.show?.('section-termos'); } catch {} });
      prev.__senhaBound = true;
    }
    if (next && !next.__senhaBound) {
      next.addEventListener('click', () => {
        if (!input) return;
        const senha=(input.value||'').trim();
        if (senha.length >= 3) { try { window.JC?.show?.('section-filme'); } catch {} }
        else { window.toast?.('Digite uma Palavra-Chave válida.', 'warning'); try{ input.focus(); }catch{} }
      });
      next.__senhaBound = true;
    }
  }

  async function runSequence(root){
    if(!root || window.JCSenha.state.running) return;

    window.JCSenha.state.running = true;
    const myAbort = makeAbortToken();

    // Normaliza e limpa visual (start imediato)
    const seq = getSeq(root);
    if (seq.length === 0) { window.JCSenha.state.running=false; return; }

    seq.forEach(p=>{
      if(ensureDataText(p)) p.textContent='';
      p.classList.remove('typing-done','typing-active');
      delete p.dataset.spoken;
      p.style.display='block'; p.style.width='100%';
      p.style.setProperty('text-align','left','important');
      p.setAttribute('dir','ltr');
      p.style.marginLeft='0'; p.style.marginRight='auto';
    });

    // Sequência: digita -> fala -> pausa -> próximo (abortável)
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
      while(!myAbort.cancelled() && (Date.now()-t0)<PAUSE_BETWEEN_P) await sleep(10);
    }

    window.JCSenha.state.running = false;
  }

  function armObserver(root){
    try{
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs=new MutationObserver(()=>{
        // Se reinjetar e não estiver rodando, dispara já
        if (!window.JCSenha.state.running) runSequence(root);
      });
      obs.observe(root,{childList:true,subtree:true});
      window.JCSenha.state.observer = obs;
    }catch{}
  }

  function tryKick(force=false){
    const root = qs(sel.root);
    if(!root) return false;

    // Garante visível (sem brigar com controlador)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    bindControls(root);
    armObserver(root);
    runSequence(root);
    return true;
  }

  // API pública
  window.JCSenha.__kick = (force=false)=>tryKick(force);

  // Eventos oficiais: iniciar na hora; abortar quando outra seção aparece
  document.addEventListener('section:shown', (evt)=>{
    const id = evt?.detail?.sectionId;
    if(!id) return;
    if (id === 'section-senha') {
      // cancela qualquer execução antiga e dispara JÁ
      window.JCSenha.state.abortId++;
      tryKick(true);
    } else {
      // outra seção assumiu → aborta datilografia/leitura aqui
      window.JCSenha.state.abortId++;
    }
  });

  // Disparos imediatos (sem depender de nada)
  tryKick(true);
  Promise.resolve().then(()=>tryKick(true));
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(()=>tryKick(true));
  }

})();
