// section-senha.js — v17 (start absoluto + microtasks + transição)
// dispara no instante do load, sem depender de visibilidade ou observers

(function () {
  'use strict';
  if (window.JCSenha?.__bound_v17) return;
  window.JCSenha = { __bound_v17: true, state: { running:false, abortId:0 } };

  const TYPE_MS=55, PAUSE=80, EST_WPM=160, EST_CPS=13;
  const TRANSITION_SRC='/assets/img/irmandade-no-jardim.mp4';
  const NEXT_SECTION_DEFAULT='section-escolha';
  const qs=(s,r=document)=>r.querySelector(s);
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

  function speakOnce(txt,abort){
    if(!txt||abort())return;
    if(window.EffectCoordinator?.speak){
      try{const p=window.EffectCoordinator.speak(txt);if(p&&p.then)return p;}catch{}
    }
    const ms=Math.max((txt.split(/\s+/).length/EST_WPM)*6e4,(txt.length/EST_CPS)*1e3,600);
    return sleep(ms);
  }

  async function type(el,txt,speed,abort){
    el.textContent='';el.classList.add('typing-active');
    for(let i=0;i<txt.length&&!abort();i++){
      el.textContent+=txt[i];
      await new Promise(r=>setTimeout(r,speed));
    }
    el.classList.remove('typing-active');el.classList.add('typing-done');
  }

  async function run(){
    if(window.JCSenha.state.running) return;
    window.JCSenha.state.running=true;
    const myId=++window.JCSenha.state.abortId;
    const abort=()=>myId!==window.JCSenha.state.abortId;
    const root=qs('#section-senha'); if(!root) return;
    const ps=['#senha-instr1','#senha-instr2','#senha-instr3','#senha-instr4'].map(s=>qs(s,root)).filter(Boolean);
    for(const p of ps){
      const txt=(p.dataset.text||p.textContent||'').trim(); p.dataset.text=txt; p.textContent='';
      await type(p,txt,TYPE_MS,abort);
      await speakOnce(txt,abort);
      if(abort())break;
      await sleep(PAUSE);
    }
    window.JCSenha.state.running=false;
  }

  function playTransitionThen(next){
    if(qs('#senha-transition-overlay'))return;
    const o=document.createElement('div');
    o.id='senha-transition-overlay';
    Object.assign(o.style,{position:'fixed',inset:0,background:'#000',zIndex:999999,display:'flex',alignItems:'center',justifyContent:'center'});
    const v=document.createElement('video');
    Object.assign(v,{src:TRANSITION_SRC,autoplay:true,muted:true,playsInline:true});
    v.style.cssText='width:100%;height:100%;object-fit:cover;';
    o.appendChild(v);document.body.appendChild(o);
    const end=()=>{o.remove();next&&next();};
    v.addEventListener('ended',end,{once:true});
    v.addEventListener('error',()=>setTimeout(end,1200),{once:true});
    setTimeout(end,8000);
    v.play?.().catch(()=>setTimeout(end,800));
  }

  function bind(){
    const root=qs('#section-senha'); if(!root)return;
    const input=qs('#senha-input',root),next=qs('#btn-senha-avancar',root),prev=qs('#btn-senha-prev',root),
          toggle=qs('.btn-toggle-senha,[data-action="toggle-password"]',root);
    next?.removeAttribute('disabled');prev?.removeAttribute('disabled');
    toggle?.addEventListener('click',()=>{if(input)input.type=input.type==='password'?'text':'password';});
    prev?.addEventListener('click',()=>{
      const target= root.dataset.backHref||window.JC?.homeUrl||'/';
      try{window.top.location.assign(target);}catch{window.location.href=target;}
    });
    next?.addEventListener('click',()=>{
      if(!input)return;const senha=(input.value||'').trim();
      if(senha.length<3){window.toast?.('Digite uma Palavra-Chave válida.','warning');return;}
      const nextId=next.dataset.nextSection||root.dataset.nextSection||NEXT_SECTION_DEFAULT;
      playTransitionThen(()=>{window.JC?.show?.(nextId);});
    });
  }

  // dispara imediatamente
  function kick(){bind();queueMicrotask(run);}
  document.addEventListener('section:shown',e=>{
    if(e?.detail?.sectionId==='section-senha'){window.JCSenha.state.abortId++;kick();}
    else window.JCSenha.state.abortId++;
  });
  document.addEventListener('DOMContentLoaded',kick);
  kick();
})();
