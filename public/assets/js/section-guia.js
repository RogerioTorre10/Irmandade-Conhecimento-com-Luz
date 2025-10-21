// section-guia.js — v19
(function () {
  'use strict';
  if (window.__guiaBound_v19) { console.warn('section-guia.js já carregado (v19).'); return; }
  window.__guiaBound_v19 = true;
  console.log('section-guia.js v19 inicializado.');

  // ===== Config =====
  const TYPING_SPEED_DEFAULT = 30;
  const SPEAK_RATE = 1.06;
  const NEXT_PAGE = 'selfie.html';
  const TRANSITION_VIDEO = '/assets/img/conhecimento-com-luz-jardim.mp4';
  const GUIAS_JSON = '/assets/data/guias.json';

  // Fallback
  const FALLBACK_GUIAS = [
    { id: 'zion',  nome: 'Zion',  descricao: 'O Guia da Consciência Pura (Grok)',   bgImage: '/assets/img/irmandade-quarteto-bg-zion.png'  },
    { id: 'lumen', nome: 'Lumen', descricao: 'O Guia da Iluminação (GPT-5)',        bgImage: '/assets/img/irmandade-quarteto-bg-lumen.png' },
    { id: 'arian', nome: 'Arian', descricao: 'O Guia da Transformação (Gemini)',    bgImage: '/assets/img/irmandade-quarteto-bg-arian.png'}
  ];

  // ===== Estado =====
  let ABORT_TOKEN = 0;
  let guiaAtual = null;

  // ===== Utils =====
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const aborted = (my) => my !== ABORT_TOKEN;

  function persistChoice(guia, nome) {
    try {
      sessionStorage.setItem('jornada.guia', guia || '');
      sessionStorage.setItem('jornada.nome', nome || '');
      console.log('[Guia] Persistido:', { guia, nome });
    } catch(e){ console.error('[Guia] Persistência falhou:', e); }
  }
  function restoreChoice() {
    try {
      return {
        guia: sessionStorage.getItem('jornada.guia') || '',
        nome: sessionStorage.getItem('jornada.nome') || ''
      };
    } catch(e){ return { guia:'', nome:'' }; }
  }

  function enable(el){ if(el){ el.disabled=false; el.style.pointerEvents=''; el.style.opacity=''; } }
  function disable(el){ if(el){ el.disabled=true;  el.style.pointerEvents='none'; el.style.opacity='0.5'; } }

  function highlightChoice(root, guiaAtual, window.__GUIAS_CACHE) {
    qsa('[data-guia]', root).forEach(el => {
      el.classList.toggle('guia-selected', el.dataset.guia === guia);
    });
  }

  // Próxima seção (fallbacks)
  function getNextSectionId(root){
    // 1) se houver atributo data-next-section no container
    const attr = root?.dataset?.nextSection || '';
    if (attr) return attr;

    // 2) se existir função do controlador, usa
    if (window.JC?.goNext) return window.JC.goNext();

    // 3) fallback: transição de vídeo ou redireciona
    if (TRANSITION_VIDEO) { playTransitionVideo(); return null; }
    window.location.href = NEXT_PAGE;
    return null;
  }

  // Loader de guias
  async function loadGuias(){
    try{
      const res = await fetch(GUIAS_JSON);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    }catch(e){
      console.error('[Guia] Falha ao carregar JSON:', e);
      return FALLBACK_GUIAS;
    }
  }

  function renderGuias(guias, root){
    const desc = qs('.guia-descricao-medieval', root);
    const opts = qs('.guia-options', root);
    if (!desc || !opts) return;

    desc.innerHTML = '';
    opts.innerHTML = '';

    guias.forEach(g => {
      const p = document.createElement('p');
      p.dataset.guia = g.id;
      p.textContent   = `${g.nome}: ${g.descricao}`;
      desc.appendChild(p);

      const b = document.createElement('button');
      b.className = 'btn btn-primary btn-stone';
      b.dataset.action = 'select-guia';
      b.dataset.guia = g.id;
      b.textContent = `Escolher ${g.nome}`;
      opts.appendChild(b);
    });
  }

  // Datilografia local (fallback)
  function typeLocal(el, text, speed){
    return new Promise(res=>{
      el.textContent=''; let i=0;
      (function tick(){ if(i<text.length){ el.textContent += text.charAt(i++); setTimeout(tick, speed); } else { res(); } })();
    });
  }

  async function runTypingAndSpeak(el, text, myId){
    if(!el || !text) return;
    el.classList.remove('typing-done','typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align','left','important');

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

  // ===== Bind UI =====
  async function bindUI(root){
    const nameInput = qs('#guiaNameInput', root);
    const btnSel    = qs('#btn-selecionar-guia', root);
    const btnSkip   = qs('#btn-skip-guia', root);

    const guias = await loadGuias();
    window.__GUIAS_CACHE = guias;  // cache global simples
    renderGuias(guias, root);

    // Restaurar estado
    const saved = restoreChoice();
    if (saved.nome && nameInput) nameInput.value = saved.nome;
    if (saved.guia) { guiaAtual = saved.guia; highlightChoice(root, guiaAtual); }

    // Habilita/Desabilita Selecionar
    const refreshButton = () => {
      const ok = !!(guiaAtual && (nameInput?.value?.trim()?.length));
      ok ? enable(btnSel) : disable(btnSel);
    };
    refreshButton();

    // Clique nas descrições
    qsa('.guia-descricao-medieval [data-guia]', root).forEach(p=>{
      if (p.__bound) return;
      p.addEventListener('click', ()=>{
        guiaAtual = p.dataset.guia;
        highlightChoice(root, guiaAtual);
        refreshButton();
        document.dispatchEvent(new CustomEvent('guiaSelected', { detail:{ guia: guiaAtual }}));
      });
      p.__bound = true;
    });

    // Clique nos botões “Escolher X”
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

    // Digitação do nome
    nameInput?.addEventListener('input', refreshButton);

    // Selecionar Guia
    if (btnSel && !btnSel.__bound){
      btnSel.addEventListener('click', ()=>{
        if (!guiaAtual) { window.toast?.('Selecione um guia ou toque em “Pular e Continuar”.','warning'); return; }
        const nome = (nameInput?.value || '').trim().toUpperCase();
        persistChoice(guiaAtual, nome);
        const next = getNextSectionId(root);
        if (next) { try { window.JC?.show?.(next); } catch {} }
      });
      btnSel.__bound = true;
    }

    // Pular e Continuar — agora com escopo correto
    if (btnSkip && !btnSkip.__bound){
      btnSkip.addEventListener('click', ()=>{
        const nome = (nameInput?.value || '').trim().toUpperCase();
        persistChoice(guiaAtual || '', nome);
        const next = getNextSectionId(root);
        if (next) { try { window.JC?.show?.(next); } catch {} }
      });
      btnSkip.__bound = true;
    }
  }

  async function activate(root){
    if(!root){ console.error('#section-guia não encontrado'); return; }
    const my = ++ABORT_TOKEN;

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');

    let title = qs('h2[data-typing="true"]', root);
    if (!title){
      title = document.createElement('h2');
      title.dataset.typing = 'true';
      title.dataset.text = 'Escolha seu Guia ✨';
      (qs('.conteudo-pergaminho', root) || root).prepend(title);
    }
    const text = (title.dataset.text || title.textContent || '').trim();
    await runTypingAndSpeak(title, text, my);
    if (aborted(my)) return;

    await bindUI(root);
  }

  // ===== Listeners =====
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
// [ADICIONE] perto das Utils:
function applyGuiaTheme(root, guiaId, guias) {
  const g = (guias || []).find(x => x.id === guiaId);
  const header = root.querySelector('.guia-header-moldura');
  if (!g || !header) return;

  // leve e elegante: moldura + leve vinheta
  header.style.backgroundImage = `
    linear-gradient(to bottom, rgba(0,0,0,.12), rgba(0,0,0,.18)),
    url('${g.bgImage}')
  `;
  header.style.backgroundSize = 'cover';
  header.style.backgroundPosition = 'center';
}

// [SUBSTITUA] a highlightChoice existente por esta versão que também aplica o tema:
function highlightChoice(root, guia, guias) {
  qsa('[data-guia]', root).forEach(el => {
    el.classList.toggle('guia-selected', el.dataset.guia === guia);
  });
  applyGuiaTheme(root, guia, window.__GUIAS_CACHE || []);
}

