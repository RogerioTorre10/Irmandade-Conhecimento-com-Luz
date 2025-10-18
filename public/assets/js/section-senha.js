// section-senha.js — v14 (start instantâneo + back fix + olho mágico + leitura)
// - rAF loop até 2s caça elementos e inicia imediatamente (sem delays perceptíveis)
// - Anti-invasão: aborta se outra seção assumir (section:shown != section-senha)
// - Datilografia local (E→D) + Leitura por parágrafo (aguarda Promise; senão, estima)
// - Botões habilitados e olho mágico ativo
// - Botão Voltar redireciona para o site (data-back-href > root data > JC.homeUrl > referrer > "/")

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v14) {
    window.JCSenha.__kick?.(true);
    return;
  }

  // ===== Config =====
  const TYPE_MS = 55;          // ms/char (ajuste fino)
  const PAUSE_BETWEEN_P = 90;  // pausa curta entre parágrafos
  const EST_WPM = 160;         // fallback TTS
  const EST_CPS = 13;
  const EAGER_RAF_MS = 2000;   // janela máx. para "caçar" parágrafos via rAF (start imediato)

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v14 = true;
  window.JCSenha.state = {
    running: false,
    abortId: 0,
    observer: null
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);

  // CSS: garante E→D durante a digitação mesmo com containers centralizados
  (function injectCSS(){
    if (document.getElementById('jc-senha-align-patch-v14')) return;
    const s = document.createElement('style');
    s.id='jc-senha-align-patch-v14';
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
          await Promise.race([r, (async()=>{while(!myAbort.cancelled()) await sleep(15);})()]);
          return;
        }
      }
    }catch{}
    const ms = estSpeakMs(text);
    const t0 = Date.now();
    while(!myAbort.cancelled() && (Date.now()-t0)<ms) await sleep(15);
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

    // Voltar → site Jornada Conhecimento (com cascata de destinos)
    if (prev && !prev.__senhaBound) {
      prev.addEventListener('click', () => {
        const rootEl = qs('#section-senha');
        const candidates = [
          prev.dataset?.backHref,
          prev.getAttribute?.('data-href'),
          rootEl?.dataset?.backHref,
          window.JC?.homeUrl,
          (document.referrer && new URL(document.referrer).origin === window.location.origin ? document.referrer : null),
          '/'
        ].filter(Boolean);
        const target = candidates[0];
        try {
          window.top.location.assign(target);
        } catch {
          window.location.href = target;
        }
      });
      prev.__senhaBound = true;
    }

    // Avançar (mantive sua lógica)
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

    const seq = getSeq(root);
    if (seq.length === 0) { window.JCSenha.state.running=false; return; }

    // Normaliza e limpa visual (start já)
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

  function armObserver(root){
    try{
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs=new MutationObserver(()=>{
        if (!window.JCSenha.state.running) runSequence(root);
      });
      obs.observe(root,{childList:true,subtree:true});
      window.JCSenha.state.observer = obs;
    }catch{}
  }

  // Kick sem esperar nada: rAF loop caça parágrafos até 2s
  function eagerKick(){
    const root = qs(sel.root);
    if (!root) return;

    // garantir visibilidade estrutural
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    bindControls(root);
    armObserver(root);

    const t0 = performance.now();
    const hunt = () => {
      if (getSeq(root).length > 0) {
        runSequence(root);
        return;
      }
      if ((performance.now() - t0) < EAGER_RAF_MS) {
        requestAnimationFrame(hunt);
      } else {
        // como fallback extremo, tenta assim mesmo
        runSequence(root);
      }
    };
    requestAnimationFrame(hunt);
  }

  // API pública
  window.JCSenha.__kick = ()=>eagerKick();

  // Eventos oficiais
  document.addEventListener('section:shown', (evt)=>{
    const id = evt?.detail?.sectionId;
    if(!id) return;
    // se outra seção aparecer, aborta; se senha aparecer, inicia JÁ
    if (id === 'section-senha') {
      window.JCSenha.state.abortId++;
      eagerKick();
    } else {
      window.JCSenha.state.abortId++;
    }
  });

  // Disparos imediatos: no load, microtask e rAF
  eagerKick();
  Promise.resolve().then(()=>eagerKick());
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(()=>eagerKick());
  }

})();
