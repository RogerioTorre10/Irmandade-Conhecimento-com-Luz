// section-guia.js — v20 (obrigatório escolher guia; nome + guia validados)
(function () {
  'use strict';
  if (window.__guiaBound_v20) { console.warn('section-guia.js já carregado (v20).'); return; }
  window.__guiaBound_v20 = true;
  console.log('[Guia] v20 inicializado');

  // ===== Config =====
  const TYPING_SPEED_DEFAULT = 30;
  const SPEAK_RATE = 1.06;
  const NEXT_PAGE = 'selfie.html';
  const TRANSITION_VIDEO = '/assets/img/conhecimento-com-luz-jardim.mp4';
  const GUIAS_JSON = '/assets/data/guias.json';

  // ===== Estado =====
  let ABORT_TOKEN = 0;
  let guiaAtual = null;

  // ===== Utils =====
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const aborted = (my) => my !== ABORT_TOKEN;

  function persistChoice(guia, nome){
    try{
      sessionStorage.setItem('jornada.guia', guia || '');
      sessionStorage.setItem('jornada.nome', (nome || '').toUpperCase());
      console.log('[Guia] Persistido:', { guia, nome: (nome||'').toUpperCase() });
    }catch(e){ console.error('[Guia] Persistência falhou:', e); }
  }
  function restoreChoice(){
    try{
      return {
        guia: sessionStorage.getItem('jornada.guia') || '',
        nome: sessionStorage.getItem('jornada.nome') || ''
      };
    }catch(e){ return { guia:'', nome:'' }; }
  }
  function enable(el){ if(el){ el.disabled=false; el.style.pointerEvents=''; el.style.opacity=''; } }
  function disable(el){ if(el){ el.disabled=true; el.style.pointerEvents='none'; el.style.opacity='0.5'; } }

  function highlightChoice(root, guia){
    qsa('[data-guia]', root).forEach(el => el.classList.toggle('guia-selected', el.dataset.guia === guia));
  }

  function getNextSectionId(root){
    const hinted = root?.dataset?.nextSection || '';
    if (hinted) return hinted;
    if (window.JC?.goNext) return window.JC.goNext();
    if (TRANSITION_VIDEO) { playTransitionVideo(); return null; }
    window.location.href = NEXT_PAGE; return null;
  }

  async function loadGuias(){
    try{
      const res = await fetch(GUIAS_JSON);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    }catch(e){
      console.error('[Guia] Falha ao carregar JSON:', e);
      const fallback = [
        { id:'zion',  nome:'Zion',  descricao:'O Guia da Consciência Pura (Grok)', bgImage:'/assets/img/irmandade-quarteto-bg-zion.png' },
        { id:'lumen', nome:'Lumen', descricao:'O Guia da Iluminação (GPT-5)',     bgImage:'/assets/img/irmandade-quarteto-bg-lumen.png' },
        { id:'arian', nome:'Arian', descricao:'O Guia da Transformação (Gemini)',  bgImage:'/assets/img/irmandade-quarteto-bg-arian.png' }
      ];
      qs('#guia-error')?.style && (qs('#guia-error').style.display='block');
      return fallback;
    }
  }

  function typeLocal(el, text, speed){
    return new Promise(res=>{
      el.textContent=''; let i=0;
      (function tick(){
        if(i<text.length){ el.textContent += text.charAt(i++); setTimeout(tick, speed); }
        else res();
      })();
    });
  }

  async function runTypingAndSpeak(el, text, myId){
    if(!el || !text) return;
    el.classList.remove('typing-done','typing-active','lumen-typing');
    el.classList.add('typing-active','lumen-typing');
    const speed = Number(el.dataset.speed || TYPING_SPEED_DEFAULT);

    if (typeof window.runTyping === 'function'){
      await new Promise(done=>{
        try { window.runTyping(el, text, done, { speed, cursor: el.dataset.cursor !== 'false' }); }
        catch(e){ console.error('[Typing] erro:', e); el.textContent = text; done(); }
      });
    } else {
      await typeLocal(el, text, speed);
    }
    if (aborted(myId)) return;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    try { await window.EffectCoordinator?.speak?.(text, { rate: SPEAK_RATE }); } catch{}
  }

  function playTransitionVideo(){
    const v = document.createElement('video');
    v.src = TRANSITION_VIDEO; v.autoplay = true; v.muted = true; v.controls = false;
    Object.assign(v.style, {position:'fixed', inset:'0', width:'100%', height:'100%', zIndex:'9999', background:'#000'});
    document.body.innerHTML = ''; document.body.appendChild(v);
    v.addEventListener('ended', ()=> window.location.href = NEXT_PAGE);
    v.addEventListener('error', ()=> window.location.href = NEXT_PAGE);
  }

  function renderButtons(guias, root){
    const opts = qs('.guia-options', root);
    if (!opts) return;
    opts.innerHTML = '';
    guias.forEach(g=>{
      const b = document.createElement('button');
      b.className = 'btn btn-stone-espinhos';
      b.dataset.action = 'select-guia';
      b.dataset.guia = g.id;
      b.textContent = g.nome;
      opts.appendChild(b);
    });
  }

  async function bindUI(root){
    const nameInput = qs('#guiaNameInput', root);
    const btnSel    = qs('#btn-selecionar-guia', root);

    const guias = await loadGuias();
    window.__GUIAS_CACHE = guias;
    renderButtons(guias, root);

    // Texto datilografado dentro da moldura
    const textoGuias = guias.map(g => `${g.nome} — ${g.descricao}`).join('\n');
    const caixa = qs('#guiaTexto', root);
    if (caixa) {
      caixa.dataset.text = textoGuias;
      await runTypingAndSpeak(caixa, textoGuias, ABORT_TOKEN);
    }

    // Restaurar estado salvo
    const saved = restoreChoice();
    if (saved.nome && nameInput) nameInput.value = saved.nome;
    if (saved.guia) { guiaAtual = saved.guia; highlightChoice(root, guiaAtual); }

    // Habilita somente com nome + guia
    const refreshButton = ()=>{
      const ok = !!(guiaAtual && (nameInput?.value?.trim()?.length));
      ok ? enable(btnSel) : disable(btnSel);
    };
    refreshButton();

    // Clique nos botões
    qsa('[data-action="select-guia"][data-guia]', root).forEach(btn=>{
      if (btn.__bound) return;
      btn.addEventListener('click', ()=>{
        guiaAtual = btn.dataset.guia;
        highlightChoice(root, guiaAtual);
        refreshButton();
        document.dispatchEvent(new CustomEvent('guiaSelected', { detail:{ guia: guiaAtual }}));
      });
      btn.__bound = true;
    });

    // Nome: enter confirma
    if (nameInput && !nameInput.__bound){
      nameInput.addEventListener('input', refreshButton);
      nameInput.addEventListener('keydown', (ev)=>{ if (ev.key==='Enter' && !btnSel.disabled) btnSel.click(); });
      nameInput.__bound = true;
    }

    // Selecionar Guia
    if (btnSel && !btnSel.__bound){
      btnSel.addEventListener('click', ()=>{
        const nome = (qs('#guiaNameInput', root)?.value || '').trim().toUpperCase();
        if (!nome)     { window.toast?.('Digite seu NOME para continuar.','warning'); return; }
        if (!guiaAtual){ window.toast?.('Selecione um GUIA para continuar.','warning'); return; }
        persistChoice(guiaAtual, nome);
        const next = getNextSectionId(root);
        if (next) { try { window.JC?.show?.(next); } catch {} }
      });
      btnSel.__bound = true;
    }
  }

  async function activate(root){
    if(!root){ console.error('#section-guia não encontrado'); return; }
    const my = ++ABORT_TOKEN;

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');

    // 1) Datilografa "Insira seu nome" no pergaminho
    const tituloNome = qs('h3.titulo-pergaminho[data-typing="true"]', root);
    if (tituloNome){
      const t = (tituloNome.dataset.text || tituloNome.textContent || 'Insira seu nome').trim();
      await runTypingAndSpeak(tituloNome, t, my);
      if (aborted(my)) return;
    }

    // 2) Liga UI + datilografa os guias dentro da moldura
    await bindUI(root);
  }

  document.addEventListener('section:shown', (e)=>{
    const id = e?.detail?.sectionId || e?.detail?.id;
    if (id === 'section-guia' || id === 'section-escolha') {
      const root = e?.detail?.node || e?.detail?.root || qs('#section-guia');
      activate(root);
    } else {
      ABORT_TOKEN++;
    }
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    const root = qs('#section-guia');
    if (root && !root.classList.contains('hidden')) activate(root);
  });
})();
