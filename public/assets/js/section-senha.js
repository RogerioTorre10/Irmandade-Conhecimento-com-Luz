// section-senha.js — v15 (start imediato + transição ao avançar + anti-invasão)
// - Inicia efeitos imediatamente ao mostrar a seção (sem probes demorados)
// - Datilografia local (E→D) + Leitura por parágrafo (aguarda Promise; fallback por estimativa)
// - Botões habilitados + Olho mágico
// - Anti-invasão: aborta datilografia/tts se outra seção assumir
// - Ao clicar "Avançar": toca o vídeo de transição (/assets/img/irmandade-no-jardim.mp4) e só depois navega
//   • ID da próxima seção pode ser configurado: data-next-section no botão OU no #section-senha
//   • Padrão: 'section-escolha' (troque se o seu ID for outro)

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v15) {
    window.JCSenha.__kick?.();
    return;
  }

  // ===== Config =====
  const TYPE_MS = 55;          // ms por caractere
  const PAUSE_BETWEEN_P = 90;  // pausa entre parágrafos
  const EST_WPM = 160;         // fallback TTS
  const EST_CPS = 13;
  const TRANSITION_SRC = '/assets/img/irmandade-no-jardim.mp4';
  const NEXT_SECTION_DEFAULT = 'section-escolha'; // ajuste aqui se o ID for diferente

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v15 = true;
  window.JCSenha.state = {
    running: false,
    abortId: 0,
    observer: null
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);
  const isVisible = (el) => !!el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';

  // CSS: garante E→D durante digitação contra centralização do pai
  (function injectCSS(){
    if (document.getElementById('jc-senha-align-patch-v15')) return;
    const s = document.createElement('style');
    s.id='jc-senha-align-patch-v15';
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

  // ---------- TRANSIÇÃO (vídeo) AO AVANÇAR ----------
  function playTransitionThen(nextStep){
    // Se já existir um overlay de transição, apenas aguarde
    if (document.getElementById('senha-transition-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'senha-transition-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:#000; z-index:999999;
      display:flex; align-items:center; justify-content:center;
    `;
    const video = document.createElement('video');
    video.src = TRANSITION_SRC;
    video.autoplay = true;
    video.muted = true;            // garante autoplay
    video.playsInline = true;
    video.controls = false;
    // cobre a tela inteira
    video.style.cssText = 'width:100%; height:100%; object-fit:cover;';

    overlay.appendChild(video);
    document.body.appendChild(overlay);

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      try { video.pause(); } catch {}
      overlay.remove();
      if (typeof nextStep === 'function') nextStep();
    };

    video.addEventListener('ended', cleanup, { once:true });
    video.addEventListener('error', () => setTimeout(cleanup, 1500), { once:true });
    // Fallback caso o navegador barre autoplay (mesmo com muted)
    setTimeout(() => { if (!done) cleanup(); }, 8000);

    // tenta tocar (alguns browsers exigem gesture; muted ajuda)
    Promise.resolve().then(() => video.play?.()).catch(() => {
      // se falhar, tenta cleanup rápido
      setTimeout(cleanup, 1200);
    });
  }

  // ---------- OBS / CONTROLES ----------
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

  function bindControls(root){
    const { input, toggle, next, prev } = pick(root);

    // Habilita botões imediatamente
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

    // Voltar → site Jornada Conhecimento (mantém do v14)
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

    // Avançar → toca transição e só depois navega
    if (next && !next.__senhaBound) {
      next.addEventListener('click', () => {
        if (!input) return;
        const senha = (input.value || '').trim();
        if (senha.length < 3) {
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try { input.focus(); } catch {}
          return;
        }
        const rootEl = qs(sel.root);
        const nextId =
          next.dataset?.nextSection ||
          rootEl?.dataset?.nextSection ||
          NEXT_SECTION_DEFAULT;

        // toca a transição e navega
        playTransitionThen(() => {
          try { window.JC?.show?.(nextId); } catch {}
        });
      });
      next.__senhaBound = true;
    }
  }

  // ---------- SEQUÊNCIA (datilografia + leitura) ----------
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

  function tryKick(){
    const root = qs(sel.root);
    if(!root || !isVisible(root)) return false;

    // Garante visível estruturalmente
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
  window.JCSenha.__kick = tryKick;

  // Eventos: inicia na hora; aborta quando outra seção aparece
  document.addEventListener('section:shown', (evt)=>{
    const id = evt?.detail?.sectionId;
    if(!id) return;
    if (id === 'section-senha') {
      // aborta execuções antigas e dispara já
      window.JCSenha.state.abortId++;
      tryKick();
    } else {
      // outra seção assumiu → aborta datilografia/leitura aqui
      window.JCSenha.state.abortId++;
    }
  });

  // Disparos imediatos
  if (!tryKick()) {
    // se ainda não deu (ex.: DOM chegando), tenta no próximo frame
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => tryKick());
    } else {
      setTimeout(() => tryKick(), 0);
    }
  }

})();
