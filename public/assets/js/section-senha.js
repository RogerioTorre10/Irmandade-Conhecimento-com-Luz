// section-senha.js — v15 (datilografia+leitura, botões OK, transição de vídeo)
// - Reativa datilografia (local) + leitura (c/ teto) p/ p1..p4
// - Prev/Next: volta p/ termos e avança p/ vídeo de transição => selfie
// - Chute apenas quando a seção realmente aparece (section:shown) + fallback
// - Anti-invasão: aborta sequência se trocar de seção

(function () {
  'use strict';

  // Evita dupla carga
  if (window.JCSenha?.__bound_v15) {
    window.JCSenha.__kick?.(true);
    return;
  }

  // ===== Config finos =====
  const TYPE_MS = 34;             // velocidade de datilografia (ms/char)
  const PAUSE_BETWEEN_P = 60;     // pausa mínima entre parágrafos
  const SPEAK_HARD_CAP_MS = 1700; // teto de fala por parágrafo
  const REKICK_COOLDOWN_MS = 220; // evita boots em sequência

  // ===== Estado/namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v15 = true;
  window.JCSenha.state = {
    running: false,
    abortId: 0,
    lastKickAt: 0
  };

  // ===== Helpers =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const now = () => (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();

  const SEL = {
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


  function isVisible(el) {
    if (!el) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
    if (el.classList?.contains('hidden')) return false;
    return true;
  }

  // Deixa o texto alinhado à esquerda durante a digitação
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

  // ===== Datilografia + Leitura =====
  function ensureDataText(el){
    if(!el) return false;
    const base = (el.dataset.text || el.textContent || '').trim();
    if (!base) return false;
    el.dataset.text = base;
    return true;
  }

  function setTypingMode(el, on){
    if (!el) return;
    if (on){
      el.classList.remove('typing-done');
      el.classList.add('typing-active');
      el.style.setProperty('text-align', 'left', 'important');
      el.setAttribute('dir','ltr');
      el.style.display='block';
      el.style.width='100%';
      el.style.marginLeft='0';
      el.style.marginRight='auto';
    } else {
      el.classList.remove('typing-active');
      el.classList.add('typing-done');
    }
  }

  function makeAbortToken(){
    const id = ++window.JCSenha.state.abortId;
    return { id, cancelled: ()=> id !== window.JCSenha.state.abortId };
  }

  async function typeText(el, text, speed, myAbort){
    return new Promise(resolve=>{
      if (!el) return resolve();
      // Se já estava pronto com mesmo texto, não re-digita
      if (el.classList.contains('typing-done') && el.textContent.trim() === text.trim()) {
        return resolve();
      }
      let i=0;
      el.textContent = '';
      const tick = ()=>{
        if (myAbort.cancelled()) return resolve();
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          return resolve();
        }
      };
      tick();
    });
  }

  function estSpeakMs(t){
    const s=(t||'').trim(); if(!s) return 280;
    const words = s.split(/\s+/).length;
    // aproximação por wpm 180 e cps 15; toma o maior, mas cap no teto
    const byWpm = (words/180)*60000;
    const byCps = (s.length/15)*1000;
    return Math.min(Math.max(byWpm, byCps, 500), SPEAK_HARD_CAP_MS);
  }

  async function speakText(text, myAbort){
    if (!text || myAbort.cancelled()) return;
    const cap = estSpeakMs(text);
    const t0 = Date.now();
    try{
      if (window.EffectCoordinator?.speak) {
        const p = window.EffectCoordinator.speak(text);
        if (p && typeof p.then === 'function') {
          await Promise.race([
            p,
            (async()=>{ while(!myAbort.cancelled() && (Date.now()-t0)<cap) await sleep(20); })()
          ]);
          return;
        }
      }
    }catch(e){}
    // fallback temporizado
    while(!myAbort.cancelled() && (Date.now()-t0)<cap) await sleep(20);
  }

  function getSequence(root){
    const {p1,p2,p3,p4} = pick(root);
    return [p1,p2,p3,p4].filter(Boolean);
  }

  async function runTypingAndSpeech(root){
    if (!root) return;
    if (window.JCSenha.state.running) return;

    window.JCSenha.state.running = true;
    const myAbort = makeAbortToken();

    const seq = getSequence(root);
    if (!seq.length) { window.JCSenha.state.running=false; return; }

    // Normaliza & prepara
    for (const p of seq){
      ensureDataText(p);
      // se não está pronto, limpa p/ digitar
      if (!p.classList.contains('typing-done')) p.textContent = '';
      setTypingMode(p, false);
    }

    // Sequência: p a p
    for (const p of seq){
      if (myAbort.cancelled()) break;
      const text = (p.dataset.text || '').trim();
      if (!text) continue;

      setTypingMode(p, true);
      await typeText(p, text, TYPE_MS, myAbort);
      if (myAbort.cancelled()) break;
      setTypingMode(p, false);

      // Fala apenas 1x por parágrafo
      if (p.dataset.spoken !== 'true'){
        await speakText(text, myAbort);
        p.dataset.spoken = 'true';
      }

      const t0 = now();
      while(!myAbort.cancelled() && (now()-t0)<PAUSE_BETWEEN_P) await sleep(10);
    }

    window.JCSenha.state.running = false;
  }

  // ===== Botões & Transição =====
  function bindControls(root){
    const { input, toggle, next, prev } = pick(root);

    // Mostrar/ocultar senha
    if (toggle && !toggle.__senhaBound) {
      toggle.addEventListener('click', () => {
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      toggle.__senhaBound = true;
    }

    // Voltar para Termos
    if (prev && !prev.__senhaBound) {
      prev.addEventListener('click', () => {
        try { window.JC?.show?.('section-termos'); } catch(e){}
      });
      prev.__senhaBound = true;
    }

    // Avançar: valida senha -> toca filme de transição -> vai para Selfie
    if (next && !next.__senhaBound) {
      next.addEventListener('click', async () => {
        if (!input) return;
        const senha = (input.value || '').trim();
        if (senha.length < 3) {
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try{ input.focus(); }catch{}
          return;
        }

        // Preferência: tocar transição
        const playTransitionThen = async (toSection)=>{
          // 1) notificar quem escuta eventos
          try {
            document.dispatchEvent(new CustomEvent('video:request', {
              detail: { id: 'transicao-senha', from: 'section-senha', to: toSection }
            }));
          } catch(e){}

          // 2) usar adaptadores conhecidos, se existirem
          try {
            if (window.VideoTransicao?.play) {
              await window.VideoTransicao.play('transicao-senha'); // id simbólico
            } else if (window.EffectCoordinator?.playTransition) {
              await window.EffectCoordinator.playTransition('transicao-senha');
            } else if (window.JC?.show) {
              // Se houver seção própria de filme, mostra antes
              if (document.getElementById('section-filme')) {
                window.JC.show('section-filme');
                await sleep(1200); // corta seca se player não estiver pronto
              }
            }
          } catch(e){ /* não trava a navegação */ }

          // 3) segue para o destino
          try { window.JC?.show?.(toSection); } catch(e){}
        };

        // Vai!
        await playTransitionThen('section-selfie');
      });
      next.__senhaBound = true;
    }
  }

  // ===== Kick/control =====
  function tryKick(force=false){
    const root = qs(SEL.root);
    if (!root) return false;
    if (!force && !isVisible(root)) return false;

    const t = now();
    if (t - window.JCSenha.state.lastKickAt < REKICK_COOLDOWN_MS) return false;
    window.JCSenha.state.lastKickAt = t;

    bindControls(root);
    runTypingAndSpeech(root);
    return true;
  }

  // Expor para reuso
  window.JCSenha.__kick = (force=false)=>tryKick(force);

  // Início quando a seção aparece; aborta ao trocar de seção
  document.addEventListener('section:shown', (evt)=>{
    const id = evt?.detail?.sectionId;
    if (!id) return;
    if (id === 'section-senha') {
      window.JCSenha.state.abortId++;
      tryKick(true);
    } else {
      // aborta qualquer sequência em curso
      window.JCSenha.state.abortId++;
    }
  });

  // Fallback: se já estiver visível ao carregar
  window.addEventListener('DOMContentLoaded', ()=>{
    const root = qs(SEL.root);
    if (root && isVisible(root)) tryKick(true);
  });

})();
