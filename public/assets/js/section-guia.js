// section-guia.js — v13 (glam + start imediato + alias escolha + seleção robusta)
(function () {
  'use strict';
  if (window.__guiaBound_v13) return;
  window.__guiaBound_v13 = true;

  // ===== Config =====
  const TYPING_SPEED = 30;              // respeita seu data-speed, mas mantém um padrão
  const SPEAK_RATE   = 1.06;
  const NEXT_SECTION_DEFAULT = 'section-selfie';

  // ===== Estado =====
  let ABORT = 0;                        // aborta quando outra seção entra
  let guiaAtual = null;

  // ===== Utils =====
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r=>setTimeout(r,ms));
  const aborted = (id) => id !== ABORT;

  function speak(text, myId){
    if (!text || aborted(myId)) return;
    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: SPEAK_RATE });
      if (p && typeof p.then === 'function') return p;
    } catch {}
    // Fallback: estimativa de duração só pra dar respiro (não bloqueia UI)
    const ms = Math.max(text.split(/\s+/).length / 160 * 60000, text.length/13*1000, 600);
    return sleep(ms);
  }

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

  async function runTyping(el, text, myId){
    if (!el || !text) return;
    el.classList.remove('typing-done','typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align','left','important');
    el.setAttribute('dir','ltr');

    const speed = Number(el.dataset.speed || TYPING_SPEED);
    if (typeof window.runTyping === 'function') {
      await new Promise(res=>{
        try { window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' }); }
        catch { el.textContent = text; res(); }
      });
    } else {
      await typeLocal(el, text, speed);
    }
    if (aborted(myId)) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await speak(text, myId);
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

  function highlightChoice(root, guia){
    const items = qsa('[data-guia]', root);
    items.forEach(el=>{
      if (el.dataset.guia === guia) el.classList.add('guia-selected');
      else el.classList.remove('guia-selected');
    });
  }

  function enable(btn){ if (btn){ btn.disabled = false; btn.style.opacity='1'; btn.style.cursor='pointer'; btn.classList.remove('disabled-temp'); } }
  function disable(btn){ if (btn){ btn.disabled = true;  btn.style.opacity='0.5'; btn.style.cursor='not-allowed'; btn.classList.add('disabled-temp'); } }

  function nextSectionId(root){
    const selBtn = qs('#btn-selecionar-guia', root);
    const skipBtn = qs('#btn-skip-guia', root);
    return selBtn?.dataset?.nextSection
        || skipBtn?.dataset?.nextSection
        || root?.dataset?.nextSection
        || NEXT_SECTION_DEFAULT;
  }

  function bindSelectionUI(root){
    const btnSelect = qs('#btn-selecionar-guia', root);
    const btnSkip   = qs('#btn-skip-guia', root);
    const nameInput = qs('#guiaNameInput', root);

    // inicial
    const saved = restoreChoice();
    if (saved.nome && nameInput) nameInput.value = saved.nome;
    if (saved.guia) { guiaAtual = saved.guia; highlightChoice(root, guiaAtual); enable(btnSelect); }
    else disable(btnSelect);

    // clique nas linhas <p data-guia>
    qsa('.guia-container [data-guia]', root).forEach(el=>{
      if (el.__bound) return;
      el.addEventListener('click', ()=>{
        guiaAtual = el.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSelect);
        try { document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: guiaAtual } })); } catch {}
      });
      el.__bound = true;
    });

    // botões “Escolher X”
    qsa('[data-action="select-guia"][data-guia]', root).forEach(btn=>{
      if (btn.__bound) return;
      btn.addEventListener('click', ()=>{
        guiaAtual = btn.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSelect);
        try { document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: guiaAtual } })); } catch {}
      });
      btn.__bound = true;
    });

    // Selecionar Guia
    if (btnSelect && !btnSelect.__bound){
      btnSelect.addEventListener('click', ()=>{
        const nome = nameInput?.value?.trim() || '';
        if (!guiaAtual){
          window.toast?.('Selecione um guia ou toque em “Pular e Continuar”.', 'warning');
          return;
        }
        persistChoice(guiaAtual, nome);
        const nextId = nextSectionId(root);
        try { window.JC?.show?.(nextId); } catch {}
      });
      btnSelect.__bound = true;
    }

    // Pular e Continuar
    if (btnSkip && !btnSkip.__bound){
      btnSkip.addEventListener('click', ()=>{
        const nome = nameInput?.value?.trim() || '';
        persistChoice(guiaAtual || '', nome);
        const nextId = nextSectionId(root);
        try { window.JC?.show?.(nextId); } catch {}
      });
      btnSkip.__bound = true;
    }
  }

  async function activate(root){
    if (!root) return;
    const myId = ++ABORT;

    // Garante exibição
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden','false');
    root.style.removeProperty('display');

    // Datilografia + fala do título
    let title = qs('h2[data-typing="true"]', root);
    if (!title) {
      title = document.createElement('h2');
      title.dataset.typing = 'true';
      title.dataset.text = 'Escolha seu Guia ✨';
      title.textContent = 'Escolha seu Guia ✨';
      qs('.conteudo-pergaminho', root)?.prepend(title) || root.prepend(title);
    }
    const text = (title.dataset.text || title.textContent || '').trim();
    await runTyping(title, text, myId);
    if (aborted(myId)) return;

    // Liga a UI (botões/seleção/navegação)
    bindSelectionUI(root);
  }

  // handler do evento — aceita section-guia e o alias section-escolha
  async function onShown(evt){
    const id = evt?.detail?.sectionId || evt?.detail?.id;
    if (id !== 'section-guia' && id !== 'section-escolha') { ABORT++; return; }

    // Usa o nó entregue pelo loader se vier, senão resolve pelo DOM
    let root = evt?.detail?.node || evt?.detail?.root || qs('#section-guia');
    if (!root) {
      // o loader às vezes injeta um #section-escolha vazio; aproveitamos como wrapper
      const wrapper = qs('#section-escolha') || qs('#jornada-content-wrapper') || document.body;
      root = qs('#section-guia', wrapper);
      if (!root) {
        root = document.createElement('div');
        root.id = 'section-guia';
        root.className = 'j-section';
        wrapper.appendChild(root);
        // injeta seu HTML mínimo caso esteja totalmente vazio
        if (!root.innerHTML.trim()) {
          root.innerHTML = `
            <div class="conteudo-pergaminho">
              <h2 data-typing="true" data-text="Escolha seu Guia ✨" data-speed="30" data-cursor="true">Escolha seu Guia ✨</h2>
              <div class="guia-container"></div>
            </div>`;
          // reaproveita elementos existentes se houver
          const src = qs('#jornada-content-wrapper .guia-container') || qs('.guia-container');
          if (src) root.querySelector('.guia-container')?.replaceWith(src.cloneNode(true));
        }
      }
    }

    await activate(root);
  }

  document.addEventListener('section:shown', onShown);
})();
