// section-senha.js — v14 (rápido + sincronizado + anti-invasão)
// - Dispara quando a seção realmente entra (section:shown) + fallback se já visível
// - Sem chute triplo em cascata (menos jitter). Cooldown curto para evitar reboots
// - Datilografia rápida e leitura com teto (timeout) para fluidez
// - Anti-invasão: aborta ao trocar de seção
// - Reentradas idempotentes (não repete fala/typing já concluídos)

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v14) {
    window.JCSenha.__kick?.(/*force*/true);
    return;
  }

  // ===== Config (afinadas p/ fluidez) =====
  const TYPE_MS = 38;          // ms/char (datilografia mais veloz)
  const PAUSE_BETWEEN_P = 40;  // pausa mínima entre parágrafos
  const EST_WPM = 180;         // estimativa de fala mais agressiva
  const EST_CPS = 15;          // idem
  const SPEAK_HARD_CAP_MS = 1600; // teto por parágrafo
  const REKICK_COOLDOWN_MS = 250; // evita múltiplos boots em sequência

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v14 = true;
  window.JCSenha.state = {
    running: false,
    abortId: 0,
    lastKickAt: 0,
    observer: null
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    if (el.classList?.contains('hidden')) return false;
    return true;
  }

  // CSS garante E→D durante digitação (vence centralização do pai)
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
    el.classList.remove('typing-done');
    el.classList.add('typing-active');
    // não zera textContent aqui: só se for realmente digitar de novo
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
      // se já está pronto, não re-digita
      if (el.classList.contains('typing-done') && el.textContent?.trim() === text.trim()) {
        return resolve();
      }
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
    const t=(text||'').trim(); if(!t) return 250;
    const words=t.split(/\s+/).length;
    const byWpm=(words/EST_WPM)*60000;
    const byCps=(t.length/EST_CPS)*1000;
    return Math.min(Math.max(byWpm, byCps, 450), SPEAK_HARD_CAP_MS);
  }

  async function speakOnce(text, myAbort){
    if(!text || myAbort.cancelled()) return;
    const cap = estSpeakMs(text);
    const start = Date.now();

    // 1) tentar TTS real com corrida contra timeout/cancelamento
    try{
      if(window.EffectCoordinator?.speak){
        const speakP = window.EffectCoordinator.speak(text);
        if (speakP && typeof speakP.then === 'function') {
          await Promise.race([
            speakP,
            (async()=>{ while(!myAbort.cancelled() && (Date.now()-start)<cap) await sleep(20); })()
          ]);
          return;
        }
      }
    }catch{}

    // 2) fallback por tempo estimado + cap
    while(!myAbort.cancelled() && (Date.now()-start)<cap) await sleep(20);
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

    // Se o usuário já focou/começou a digitar, priorize a ação dele (pula animações pesadas)
    const { input } = pick(root);
    const userBusy = !!(document.activeElement === input || (input && (input.value||'').length > 0));

    const seq = getSeq(root);
    if (seq.length === 0) { window.JCSenha.state.running=false; return; }

    // Normaliza visual apenas uma vez
    seq.forEach(p=>{
      if(ensureDataText(p) && !userBusy) p.textContent = p.classList.contains('typing-done') ? p.dataset.text : '';
      p.classList.remove('typing-active');
      p.style.display='block'; p.style.width='100%';
      p.style.setProperty('text-align','left','important');
      p.setAttribute('dir','ltr');
      p.style.marginLeft='0'; p.style.marginRight='auto';
    });

    // Sequência (abortável). Se userBusy, pula datilografia e fala breve.
    for (const p of seq){
      if (myAbort.cancelled()) break;
      const text = (p.dataset?.text||'').trim();

      if (!userBusy) {
        // digita rápido e fala com teto
        const spokenAlready = p.dataset.spoken === 'true';
        await typeOnce(p, myAbort);
        if (myAbort.cancelled()) break;
        if (text && !spokenAlready){
          await speakOnce(text, myAbort);
          if (myAbort.cancelled()) break;
          p.dataset.spoken='true';
        }
        const t0=Date.now();
        while(!myAbort.cancelled() && (Date.now()-t0)<PAUSE_BETWEEN_P) await sleep(10);
      } else {
        // usuário quer agilidade: mostra pronto, fala curtíssimo e segue
        if (text && p.textContent?.trim() !== text) {
          p.textContent = text;
          p.classList.add('typing-done');
        }
        const quickCap = Math.min(estSpeakMs(text), 500);
        const start = Date.now();
        while(!myAbort.cancelled() && (Date.now()-start)<quickCap) await sleep(20);
      }
    }

    window.JCSenha.state.running = false;
  }

  function armObserver(root){
    try{
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs=new MutationObserver(()=>{
        // rAF-throttle + não reentrar se já estiver rodando
        if (window.JCSenha.state.running) return;
        requestAnimationFrame(()=>{
          if (!window.JCSenha.state.running && isVisible(root)) {
            const t = now();
            if (t - window.JCSenha.state.lastKickAt > REKICK_COOLDOWN_MS) {
              tryKick(false);
            }
          }
        });
      });
      obs.observe(root,{childList:true,subtree:true});
      window.JCSenha.state.observer = obs;
    }catch{}
  }

  function tryKick(force=false){
    const root = qs(sel.root);
    if(!root) return false;

    // só chutar se visível ou se forçado por section:shown
    if (!force && !isVisible(root)) return false;

    const t = now();
    if (t - window.JCSenha.state.lastKickAt < REKICK_COOLDOWN_MS) return false;
    window.JCSenha.state.lastKickAt = t;

    // não mexe no display/visibility aqui: quem manda é o controlador
    bindControls(root);
    if (!window.JCSenha.state.observer) armObserver(root);
    runSequence(root);
    return true;
  }

  // API pública
  window.JCSenha.__kick = (force=false)=>tryKick(force);

  // Eventos oficiais: iniciar quando a seção é mostrada; abortar quando outra entra
  document.addEventListener('section:shown', (evt)=>{
    const id = evt?.detail?.sectionId;
    if(!id) return;
    if (id === 'section-senha') {
      window.JCSenha.state.abortId++;
      tryKick(true);
    } else {
      window.JCSenha.state.abortId++;
    }
  });

  // Fallbacks leves:
  // 1) Se já chegou com a seção visível (ex.: navegação direta), inicia uma vez
  window.addEventListener('DOMContentLoaded', ()=> {
    const root = qs(sel.root);
    if (root && isVisible(root)) tryKick(true);
  });

})();
