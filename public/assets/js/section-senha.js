// section-senha.js — v18 (start imediato confiável + anti-invasão + transição)
// Foco: iniciar SEMPRE no section:shown, sem depender de visibilidade ou hunting demorado.

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v18) {
    // Rearma se já estiver carregado
    window.JCSenha.__startNow?.();
    return;
  }

  // ===== Config =====
  const TYPE_MS = 50;            // ms por caractere (sensação de resposta rápida)
  const PAUSE_BETWEEN_P = 80;    // respiro curto entre parágrafos
  const EST_WPM = 160;           // fallback TTS
  const EST_CPS = 13;            // fallback TTS
  const TRANSITION_SRC = '/assets/img/irmandade-no-jardim.mp4';
  const NEXT_SECTION_DEFAULT = 'section-escolha';

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v18 = true;
  window.JCSenha.state = {
    running: false,
    abortId: 0,
    rootObs: null,
    kickWatch: null
  };

  // ===== Utils =====
  const qs = (s, r = document) => r.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const SEL = {
    root: '#section-senha',
    ids: ['#senha-instr1', '#senha-instr2', '#senha-instr3', '#senha-instr4'],
    input: '#senha-input',
    toggle: '.btn-toggle-senha, [data-action="toggle-password"]',
    next: '#btn-senha-avancar',
    prev: '#btn-senha-prev'
  };

  // CSS para garantir E→D durante digitação (vence centralização do pai)
  (function injectCSS(){
    if (document.getElementById('jc-senha-align-patch-v18')) return;
    const s = document.createElement('style');
    s.id = 'jc-senha-align-patch-v18';
    s.textContent = `
      #section-senha .typing-active{
        text-align:left !important; direction:ltr !important;
        display:block !important; width:100% !important;
        margin-left:0 !important; margin-right:auto !important;
      }`;
    document.head.appendChild(s);
  })();

  function ensureDataText(el){
    if (!el) return false;
    const ds = (el.dataset?.text || '').trim();
    const tc = (el.textContent || '').trim();
    const src = ds || tc;
    if (!src) return false;
    el.dataset.text = src;
    return true;
  }

  function prepareTyping(el){
    if (!el) return;
    if (!('prevAlign' in el.dataset)) el.dataset.prevAlign = el.style.textAlign || '';
    if (!('prevDir'   in el.dataset)) el.dataset.prevDir   = el.getAttribute('dir') || '';
    el.style.setProperty('text-align','left','important');
    el.setAttribute('dir','ltr');
    el.style.display = 'block';
    el.style.width = '100%';
    el.style.marginLeft = '0';
    el.style.marginRight = 'auto';
    el.classList.remove('typing-done');
    el.classList.add('typing-active');
    el.textContent = '';
    delete el.dataset.spoken;
  }

  function restoreTyping(el){
    if (!el) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  async function localType(el, text, speed, abort){
    el.textContent = '';
    for (let i = 0; i < text.length; i++){
      if (abort()) { restoreTyping(el); return; }
      el.textContent += text[i];
      await new Promise(r => setTimeout(r, speed));
    }
  }

  function estSpeakMs(text){
    const t = (text || '').trim(); if (!t) return 300;
    const words = t.split(/\s+/).length;
    const byWpm = (words / EST_WPM) * 60000;
    const byCps = (t.length / EST_CPS) * 1000;
    return Math.max(byWpm, byCps, 600);
  }

  async function speakOnce(text, abort){
    if (!text || abort()) return;
    try{
      if (window.EffectCoordinator?.speak){
        const p = window.EffectCoordinator.speak(text);
        if (p && typeof p.then === 'function'){
          await Promise.race([p, (async()=>{ while(!abort()) await sleep(15); })()]);
          return;
        }
      }
    }catch{}
    const ms = estSpeakMs(text);
    const t0 = Date.now();
    while(!abort() && (Date.now() - t0) < ms) await sleep(15);
  }

  async function typeOnce(el, abort){
    if (!el || abort()) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';
    prepareTyping(el);
    await localType(el, text, TYPE_MS, abort);
    if (!abort()) restoreTyping(el);
    return abort() ? '' : text;
  }

  function getSeq(root){
    return SEL.ids.map(sel => qs(sel, root)).filter(Boolean);
  }

  // ---------- Transição (vídeo) ----------
  function playTransitionThen(next){
    if (qs('#senha-transition-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'senha-transition-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:#000; z-index:999999; display:flex; align-items:center; justify-content:center;';
    const video = document.createElement('video');
    video.src = TRANSITION_SRC; video.autoplay = true; video.muted = true; video.playsInline = true; video.controls = false;
    video.style.cssText = 'width:100%; height:100%; object-fit:cover;';
    overlay.appendChild(video);
    document.body.appendChild(overlay);
    let done = false;
    const cleanup = () => { if (done) return; done = true; try{ video.pause(); }catch{} overlay.remove(); next?.(); };
    video.addEventListener('ended', cleanup, { once:true });
    video.addEventListener('error', () => setTimeout(cleanup, 1000), { once:true });
    setTimeout(() => { if (!done) cleanup(); }, 8000);
    Promise.resolve().then(()=>video.play?.()).catch(()=>setTimeout(cleanup, 800));
  }

  // ---------- Controles ----------
  function bindControls(root){
    const input  = qs(SEL.input, root);
    const toggle = qs(SEL.toggle, root);
    const next   = qs(SEL.next, root);
    const prev   = qs(SEL.prev, root);

    prev?.removeAttribute('disabled');
    next?.removeAttribute('disabled');

    if (toggle && !toggle.__senhaBound){
      toggle.addEventListener('click', () => { if (!input) return; input.type = input.type === 'password' ? 'text' : 'password'; });
      toggle.__senhaBound = true;
    }

    if (prev && !prev.__senhaBound){
      prev.addEventListener('click', () => {
        const rootEl = qs(SEL.root);
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

    if (next && !next.__senhaBound){
      next.addEventListener('click', () => {
        if (!input) return;
        const senha = (input.value || '').trim();
        if (senha.length < 3){
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try { input.focus(); } catch {}
          return;
        }
        const rootEl = qs(SEL.root);
        const nextId = next.dataset?.nextSection || rootEl?.dataset?.nextSection || NEXT_SECTION_DEFAULT;
        playTransitionThen(() => { try { window.JC?.show?.(nextId); } catch {} });
      });
      next.__senhaBound = true;
    }
  }

  // ---------- Sequência (datilografia + leitura) ----------
  async function runSequence(root){
    if (!root || window.JCSenha.state.running) return;

    window.JCSenha.state.running = true;
    const myId = ++window.JCSenha.state.abortId;
    const abort = () => myId !== window.JCSenha.state.abortId;

    const seq = getSeq(root);
    if (seq.length === 0){ window.JCSenha.state.running = false; return; }

    // Normaliza antes de começar
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p.classList.remove('typing-done','typing-active');
      delete p.dataset.spoken;
      p.style.display='block'; p.style.width='100%';
      p.style.setProperty('text-align','left','important');
      p.setAttribute('dir','ltr');
      p.style.marginLeft='0'; p.style.marginRight='auto';
    });

    for (const p of seq){
      if (abort()) break;
      const text = await typeOnce(p, abort);
      if (abort()) break;
      if (text && !p.dataset.spoken){
        await speakOnce(text, abort);
        if (abort()) break;
        p.dataset.spoken = 'true';
      }
      const t0 = Date.now();
      while(!abort() && (Date.now()-t0) < PAUSE_BETWEEN_P) await sleep(8);
    }

    window.JCSenha.state.running = false;
  }

  // ---------- Starter super-confiável ----------
  function startNow(){
    const root = qs(SEL.root);
    if (!root) return;

    // Força estrutura mínima e não espera "visível"
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    bindControls(root);

    // Se já existem parágrafos, começa imediatamente
    if (getSeq(root).length){
      runSequence(root);
      return;
    }

    // Senão, observa SOMENTE o root pra disparar assim que os parágrafos entrarem
    try {
      if (window.JCSenha.state.rootObs) window.JCSenha.state.rootObs.disconnect();
      const obs = new MutationObserver((muts) => {
        for (const m of muts){
          if (m.type !== 'childList' || !(m.addedNodes && m.addedNodes.length)) continue;
          // Se qualquer um dos #senha-instr* aparecer (ou dentro do nó adicionado), dispara
          for (const n of m.addedNodes){
            if (!(n instanceof Element)) continue;
            if (
              n.matches?.(SEL.ids.join(',')) ||
              n.querySelector?.(SEL.ids.join(','))
            ){
              obs.disconnect();
              runSequence(root);
              return;
            }
          }
        }
      });
      obs.observe(root, { childList:true, subtree:true });
      window.JCSenha.state.rootObs = obs;
    } catch {}

    // Watchdog leve (só por segurança): tenta 6x em 2s, mas não segura início
    let tries = 0;
    clearInterval(window.JCSenha.state.kickWatch);
    window.JCSenha.state.kickWatch = setInterval(() => {
      if (++tries > 6) { clearInterval(window.JCSenha.state.kickWatch); return; }
      if (!window.JCSenha.state.running && getSeq(root).length){
        clearInterval(window.JCSenha.state.kickWatch);
        runSequence(root);
      }
    }, 300);
  }

  // ---------- Eventos ----------
  // Inicia IMEDIATO ao mostrar a seção senha
  document.addEventListener('section:shown', (evt) => {
    const id = evt?.detail?.sectionId;
    if (!id) return;
    if (id === 'section-senha'){
      // Zera execuções anteriores e dispara já
      window.JCSenha.state.abortId++;
      startNow();
    } else {
      // Outra seção assumiu → aborta na hora
      window.JCSenha.state.abortId++;
    }
  });

  // Chutes imediatos (no load)
  window.JCSenha.__startNow = startNow;
  // Se o script entrar depois do evento, ainda assim chuta agora:
  startNow();
  // E no próximo microtask, de novo (para pegar DOM recém-injetado):
  Promise.resolve().then(() => startNow());

})();
