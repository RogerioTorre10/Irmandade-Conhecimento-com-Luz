// section-guia.js — v14 (datilografia + leitura + botões operantes, sem mexer no seu HTML/estilos)
(function () {
  'use strict';
  if (window.__guiaBound_v14) return;
  window.__guiaBound_v14 = true;

  // ===== Config =====
  const TYPING_SPEED_DEFAULT = 30;       // respeita data-speed do <h2>, cai aqui se faltar
  const SPEAK_RATE = 1.06;               // leve boost na fala
  const NEXT_SECTION_DEFAULT = 'section-selfie'; // pode sobrescrever via data-next-section

  // ===== Estado =====
  let ABORT_TOKEN = 0;
  let guiaAtual = null;

  // ===== Utils =====
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r=>setTimeout(r, ms));
  const aborted = (my) => my !== ABORT_TOKEN;

  function getNextSectionId(root){
    const btnSel  = qs('#btn-selecionar-guia', root);
    const btnSkip = qs('#btn-skip-guia', root);
    return btnSel?.dataset?.nextSection
        || btnSkip?.dataset?.nextSection
        || root?.dataset?.nextSection
        || NEXT_SECTION_DEFAULT;
  }

  function persistChoice(guia, nome){
    try {
      sessionStorage.setItem('jornada.guia', guia || '');
      sessionStorage.setItem('jornada.nome', nome || '');
    } catch {}
  }
  function restoreChoice(){
    try {
      return {
        guia: sessionStorage.getItem('jornada.guia') || '',
        nome: sessionStorage.getItem('jornada.nome') || ''
      };
    } catch { return { guia:'', nome:'' }; }
  }

  function enable(el){ if(el){ el.disabled = false; el.style.pointerEvents = ''; el.style.opacity=''; }}
  function disable(el){ if(el){ el.disabled = true;  el.style.pointerEvents = 'none'; /* mantém textura */ }}

  function highlightChoice(root, guia){
    qsa('[data-guia]', root).forEach(el=>{
      if (el.dataset.guia === guia) el.classList.add('guia-selected');
      else el.classList.remove('guia-selected');
    });
  }

  // ---- Efeito datilografia + leitura ----
  function typeLocal(el, text, speed){
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

  async function runTypingAndSpeak(el, text, myId){
    if (!el || !text) return;

    // aplicar suas classes de cursor sem mexer no CSS existente
    el.classList.remove('typing-done','typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align','left','important');
    el.setAttribute('dir','ltr');

    const speed = Number(el.dataset.speed || TYPING_SPEED_DEFAULT);
    // usa seu runTyping se existir; senão, fallback local
    if (typeof window.runTyping === 'function') {
      await new Promise(res=>{
        try {
          window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' });
        } catch {
          el.textContent = text; res();
        }
      });
    } else {
      await typeLocal(el, text, speed);
    }
    if (aborted(myId)) return;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    // leitura (TTS) se disponível; senão, não bloqueia
    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: SPEAK_RATE });
      if (p && typeof p.then === 'function') { await p; }
    } catch {}
  }

  // ---- Bind da UI (sem remover classes/estilos existentes) ----
  function bindUI(root){
    const nameInput = qs('#guiaNameInput', root);
    const btnSel    = qs('#btn-selecionar-guia', root);
    const btnSkip   = qs('#btn-skip-guia', root);

    // restaurar escolha prévia
    const saved = restoreChoice();
    if (saved.nome && nameInput) nameInput.value = saved.nome;
    if (saved.guia) { guiaAtual = saved.guia; highlightChoice(root, guiaAtual); enable(btnSel); }
    else disable(btnSel);

    // clique nas linhas <p data-guia>
    qsa('.guia-container [data-guia]', root).forEach(p=>{
      if (p.__bound) return;
      p.addEventListener('click', ()=>{
        guiaAtual = p.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSel);
        try{ document.dispatchEvent(new CustomEvent('guiaSelected', { detail:{ guia: guiaAtual }})); }catch{}
      });
      p.__bound = true;
    });

    // botões “Escolher X”
    qsa('[data-action="select-guia"][data-guia]', root).forEach(btn=>{
      if (btn.__bound) return;
      btn.addEventListener('click', ()=>{
        guiaAtual = btn.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSel);
        try{ document.dispatchEvent(new CustomEvent('guiaSelected', { detail:{ guia: guiaAtual }})); }catch{}
      });
      btn.__bound = true;
    });

    // Selecionar Guia (só avança se houve escolha)
    if (btnSel && !btnSel.__bound){
      btnSel.addEventListener('click', ()=>{
        if (!guiaAtual) { window.toast?.('Selecione um guia ou toque em “Pular e Continuar”.','warning'); return; }
        const nome = nameInput?.value?.trim() || '';
        persistChoice(guiaAtual, nome);
        const nextId = getNextSectionId(root);
        try { window.JC?.show?.(nextId); } catch {}
      });
      btnSel.__bound = true;
    }
    
    document.querySelectorAll('[data-action="select-guia"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const guia = btn.dataset.guia;
    const nome = document.querySelector('#guiaNameInput')?.value?.trim() || '';

    // Salva escolha
    sessionStorage.setItem('jornada.guia', guia);
    sessionStorage.setItem('jornada.nome', nome);

    // Cria vídeo de transição
    const video = document.createElement('video');
    video.src = 'public/assets/img/conhecimento-com-luz-jardim.mp4';
    video.autoplay = true;
    video.controls = false;
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.zIndex = '9999';
    video.style.backgroundColor = '#000';

    document.body.innerHTML = '';
    document.body.appendChild(video);

    // Após o vídeo, vai para a página selfie
    video.addEventListener('ended', () => {
      window.location.href = '#section-selfie';
    });
  });
});

    // Pular e Continuar (sempre permite)
    if (btnSkip && !btnSkip.__bound){
      btnSkip.addEventListener('click', ()=>{
        const nome = nameInput?.value?.trim() || '';
        persistChoice(guiaAtual || '', nome);
        const nextId = getNextSectionId(root);
        try { window.JC?.show?.(nextId); } catch {}
      });
      btnSkip.__bound = true;
    }
  }

  async function activate(root){
    if (!root) return;
    const myId = ++ABORT_TOKEN;

    // garante exibição (sem tirar classes que dão textura)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');

    // datilografia + leitura do título
    let title = qs('h2[data-typing="true"]', root);
    if (!title) {
      // fallback mínimo sem quebrar visual
      title = document.createElement('h2');
      title.dataset.typing = 'true';
      title.dataset.text = 'Escolha seu Guia ✨';
      title.textContent = 'Escolha seu Guia ✨';
      (qs('.conteudo-pergaminho', root) || root).prepend(title);
    }
    const text = (title.dataset.text || title.textContent || '').trim();
    await runTypingAndSpeak(title, text, myId);
    if (aborted(myId)) return;

    // liga UI
    bindUI(root);

    // garante que os botões fiquem com pointer ativo (sem mexer nas classes visuais)
    enable(qs('#btn-selecionar-guia', root));
    enable(qs('#btn-skip-guia', root));
  }

  // Handler principal — aceita 'section-guia' e 'section-escolha' (alias)
  async function onSectionShown(evt){
    const id = evt?.detail?.sectionId || evt?.detail?.id;
    if (id !== 'section-guia' && id !== 'section-escolha') { ABORT_TOKEN++; return; }

    // pega o root correto:
    let root = evt?.detail?.node || evt?.detail?.root || qs('#section-guia');
    if (!root || root.id !== 'section-guia') {
      // caso o loader tenha criado #section-escolha "vazio", usamos como wrapper
      const wrapper = qs('#section-escolha') || qs('#jornada-content-wrapper') || document.body;
      root = qs('#section-guia', wrapper) || qs('#section-guia') || root;
      // se ainda não tiver, cria um container #section-guia para não ficar “vazio”
      if (!root || root.id !== 'section-guia') {
        const sec = document.createElement('div');
        sec.id = 'section-guia';
        sec.className = 'j-section';
        wrapper.appendChild(sec);
        // reaproveita seu bloco se existir no wrapper principal
        const existing = qs('#jornada-content-wrapper .conteudo-pergaminho') || qs('.conteudo-pergaminho');
        sec.innerHTML = existing ? existing.parentElement.outerHTML : `
          <div class="conteudo-pergaminho">
            <h2 data-typing="true" data-text="Escolha seu Guia ✨" data-speed="30" data-cursor="true">Escolha seu Guia ✨</h2>
          </div>`;
        root = sec;
      }
    }
    await activate(root);
  }

  // Anti-invasão: se outra seção assumir, aborta efeitos
  document.addEventListener('section:shown', (e)=>{
    const id = e?.detail?.sectionId || e?.detail?.id;
    if (id && id !== 'section-guia' && id !== 'section-escolha') ABORT_TOKEN++;
  });

  document.addEventListener('section:shown', onSectionShown);

  // Se a guia já estiver na tela quando este script carregar:
  if (qs('#section-guia') && !qs('#section-guia').classList.contains('hidden')) {
    activate(qs('#section-guia'));
  }
})();
