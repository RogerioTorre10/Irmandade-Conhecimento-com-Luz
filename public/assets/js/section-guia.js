// section-guia.js — v12 (start imediato + fetch paralelo + anti-invasão + fallbacks)
// - Datilografia + leitura do título começam NA HORA, sem esperar o /assets/data/guias.json
// - Carrega os guias em paralelo; habilita "Selecionar" quando um guia for escolhido (evento guiaSelected)
// - "Pular" sempre avança (sem exigir seleção)
// - Anti-invasão: se outra seção entrar, aborta efeitos imediatamente
// - Fallbacks: se faltarem elementos/JSON, cria componentes mínimos e não trava

(function () {
  'use strict';

  if (window.__guiaBound_v12) return;
  window.__guiaBound_v12 = true;

  // ===== Config =====
  const TYPING_SPEED = 40;         // ms/char (ajuste se quiser mais rápido)
  const SPEAK_RATE   = 1.06;       // leve boost na fala
  const NEXT_SECTION_DEFAULT = 'section-selfie'; // pode sobrescrever via data-next-section no root ou no botão
  const DATA_URL = '/assets/data/guias.json';

  // ===== Estado =====
  let ABORT_TOKEN = 0;             // muda quando trocamos de seção
  let guiaSelecionado = false;     // vira true ao receber 'guiaSelected'
  let guiadataPromise = null;      // fetch em paralelo
  let GUIA_READY = false;          // evita repetir setup caro

  // ===== Utils =====
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r=>setTimeout(r,ms));

  function abortNow(){ ABORT_TOKEN++; }
  function isAborted(myId){ return myId !== ABORT_TOKEN; }

  function getText(el){ return (el?.dataset?.text ?? el?.textContent ?? '').trim(); }

  // Datilografia local (independente do runTyping)
  function typeLocal(el, text, speed) {
    return new Promise(resolve=>{
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else resolve();
      };
      tick();
    });
  }

  async function runTypingAndSpeak(el, text, speed, myId){
    if (!el || !text) return;
    // prepara estilo para E→D mesmo se container centralizar
    el.classList.remove('typing-done','typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align','left','important');
    el.setAttribute('dir','ltr');

    // usa runTyping se existir; senão, typeLocal
    if (typeof window.runTyping === 'function') {
      await new Promise((resolve)=>{
        window.runTyping(el, text, resolve, { speed, cursor: true });
      }).catch(()=>{ el.textContent = text; });
    } else {
      await typeLocal(el, text, speed);
    }

    if (isAborted(myId)) return;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try { window.EffectCoordinator?.speak?.(text, { rate: SPEAK_RATE }); } catch {}
  }

  function enableSelectButton(btn){
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('disabled-temp');
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }

  function disableSelectButton(btn){
    if (!btn) return;
    btn.disabled = true;
    btn.classList.add('disabled-temp');
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }

  // Fetch paralelo dos guias (com log e tolerância a erro)
  function ensureGuiasFetch(){
    if (guiadataPromise) return guiadataPromise;
    guiadataPromise = (async ()=>{
      try{
        console.log('[section-guia] Fetching', DATA_URL);
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log('[section-guia] Guias carregados:', Array.isArray(data)? data.length : 'n/a');
        return Array.isArray(data) ? data : [];
      }catch(e){
        console.warn('[section-guia] Falha ao carregar guias:', e);
        return []; // fallback: vazio (não trava)
      }
    })();
    return guiadataPromise;
  }

  async function renderGuiaSelector(root, btnSelecionar){
    const myId = ABORT_TOKEN;
    const container = qs('#guia-selector', root) || (()=>{
      const c = document.createElement('div');
      c.id = 'guia-selector';
      root.appendChild(c);
      return c;
    })();

    // estado inicial: botão Selecionar só habilita após seleção
    guiaSelecionado = false;
    disableSelectButton(btnSelecionar);

    // carrega dados em paralelo (sem bloquear UI)
    const guias = await ensureGuiasFetch();
    if (isAborted(myId)) return;

    if (guias.length && typeof window.JornadaGuiaSelfie?.renderSelector === 'function') {
      window.JornadaGuiaSelfie.renderSelector(container, guias);
      // 1x: habilita Selecionar quando o app emitir o evento
      document.addEventListener('guiaSelected', () => {
        guiaSelecionado = true;
        enableSelectButton(btnSelecionar);
      }, { once:true });
    } else {
      // Sem dados ou renderer → permite avançar, mas informa
      console.warn('[section-guia] Sem dados/renderer — avanço liberado');
      guiaSelecionado = true;
      enableSelectButton(btnSelecionar);
      (qs('#guia-error', root) || (()=>{ const m=document.createElement('div'); m.id='guia-error'; m.className='text-warn'; root.appendChild(m); return m; })()).textContent =
        'Não foi possível carregar a lista de guias. Você pode continuar.';
    }
  }

  function getNextSectionId(root, btnSelecionar, btnSkip){
    return btnSelecionar?.dataset?.nextSection
        || btnSkip?.dataset?.nextSection
        || root?.dataset?.nextSection
        || NEXT_SECTION_DEFAULT;
  }

  function bindButtons(root, titleEl){
    const btnSelecionar = qs('#btn-selecionar-guia', root) || (()=>{
      const b = document.createElement('button');
      b.id = 'btn-selecionar-guia';
      b.className = 'btn btn-primary';
      b.textContent = 'Selecionar Guia';
      root.appendChild(b);
      return b;
    })();
    const btnSkip = qs('#btn-skip-guia', root) || (()=>{
      const b = document.createElement('button');
      b.id = 'btn-skip-guia';
      b.className = 'btn btn-secondary';
      b.textContent = 'Pular e Continuar';
      root.appendChild(b);
      return b;
    })();

    // Mostrar botões logo após o título aparecer (sem esperar JSON)
    btnSelecionar.classList.remove('hidden'); btnSelecionar.style.display = 'inline-block';
    btnSkip.classList.remove('hidden');       btnSkip.style.display       = 'inline-block';

    // Selecionar: só avança se houve seleção (ou se liberamos por fallback)
    if (!btnSelecionar.__bound) {
      btnSelecionar.addEventListener('click', (e)=>{
        if (!guiaSelecionado) {
          console.warn('[section-guia] Avanço sem seleção');
          window.toast?.('Selecione um guia ou toque em “Pular e Continuar”.', 'warn');
          return;
        }
        const nextId = getNextSectionId(root, btnSelecionar, btnSkip);
        try {
          if (window.JC?.goNext) window.JC.goNext(nextId);
          else if (window.JC?.show) window.JC.show(nextId);
          else window.showSection?.(nextId);
        } catch(err){ console.error('[section-guia] Erro ao avançar:', err); }
      });
      btnSelecionar.__bound = true;
    }

    // Pular: sempre avança
    if (!btnSkip.__bound) {
      btnSkip.addEventListener('click', ()=>{
        const nextId = getNextSectionId(root, btnSelecionar, btnSkip);
        try {
          if (window.JC?.goNext) window.JC.goNext(nextId);
          else if (window.JC?.show) window.JC.show(nextId);
          else window.showSection?.(nextId);
        } catch(err){ console.error('[section-guia] Erro ao avançar:', err); }
      });
      btnSkip.__bound = true;
    }

    return { btnSelecionar, btnSkip };
  }

  async function activateGuia(root){
    if (!root) return;
    const myId = ++ABORT_TOKEN; // nova rodada; aborta qualquer anterior

    // Garante exibição sem depender do controlador
    try{
      if (typeof window.JC?.show === 'function') window.JC.show('section-guia');
      root.classList.remove('hidden');
      root.style.display = 'block';
      root.setAttribute('aria-hidden','false');
    }catch(e){
      root.classList.remove('hidden');
      root.style.display = 'block';
      root.setAttribute('aria-hidden','false');
    }

    // Encontra (ou cria fallback) do título e dos botões (start imediato)
    let title = qs('h2[data-typing="true"]', root);
    if (!title) {
      title = document.createElement('h2');
      title.dataset.typing = 'true';
      title.textContent = 'Escolha seu Guia para a Jornada';
      root.prepend(title);
    }
    const { btnSelecionar, btnSkip } = bindButtons(root, title);

    // Inicia datilografia + fala já (texto do dataset ou textContent)
    const text = getText(title);
    await runTypingAndSpeak(title, text, Number(title.dataset.speed||TYPING_SPEED), myId);
    if (isAborted(myId)) return;

    // Em paralelo (ou após título), monta a listagem/estado de seleção
    if (!GUIA_READY) {
      GUIA_READY = true;
      await renderGuiaSelector(root, btnSelecionar);
    }
  }

  async function handler(evt){
    const detail = evt?.detail || {};
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    if (sectionId !== 'section-guia') return;

    console.log('[section-guia] section:shown → guia');
    const node = detail.node || detail.root || null;

    // Root robusto: evento → #section-guia → wrapper
    let root = node || document.getElementById('section-guia') || document.getElementById('jornada-content-wrapper');
    if (!root || (root.id !== 'section-guia' && root.querySelector)) {
      // procura a seção real no wrapper
      root = root.querySelector?.('#section-guia') || document.getElementById('section-guia') || root;
    }

    // Se ainda não existir (injetando atrasado), espera rapidamente ou cria fallback mínimo
    if (!root || !root.querySelector) {
      try {
        root = await waitForElementFast('#section-guia, #jornada-content-wrapper', 1500);
      } catch {
        console.warn('[section-guia] Root não encontrado; criando fallback mínimo');
        root = document.getElementById('jornada-content-wrapper') || document.body;
        const sec = document.createElement('section');
        sec.id = 'section-guia';
        root.appendChild(sec);
        root = sec;
      }
    }

    await activateGuia(root);
  }

  // Espera mais enxuta que a do arquivo antigo (sem timeouts longos)
  function waitForElementFast(selector, timeout=1500, within=document){
    return new Promise((resolve, reject)=>{
      const el = within.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(()=>{
        const f = within.querySelector(selector);
        if (f){ obs.disconnect(); resolve(f); }
      });
      obs.observe(within, { childList:true, subtree:true });
      setTimeout(()=>{ obs.disconnect(); reject(new Error('timeout')); }, timeout);
    });
  }

  // Evento principal (entrar no guia)
  document.addEventListener('section:shown', handler);

  // Anti-invasão: se outra seção assumir, aborta efeitos imediatamente
  document.addEventListener('section:shown', (e)=>{
    const id = e?.detail?.sectionId || e?.detail?.id;
    if (id && id !== 'section-guia') abortNow();
  });

  // Pré-carrega dados dos guias em paralelo (para quando o usuário chegar aqui)
  ensureGuiasFetch();

})();
