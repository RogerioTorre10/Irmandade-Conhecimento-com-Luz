(function () {
  'use strict';

  const SECTION_ID      = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS      = 'hidden';
  const TYPING_SPEED    = 42;
  const TTS_LATCH_MS    = 600;
  const DATA_URL        = '/assets/data/guias.json'; // <<< JSON

  if (window.JCGuia?.__bound) { console.log('[JCGuia] já carregado'); return; }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Espera lock de transição (vídeo) =====
  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;
    await Promise.race([
      new Promise(res => document.addEventListener('transition:ended', () => res(), { once: true })),
      new Promise(res => setTimeout(res, timeoutMs))
    ]);
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  // ===== Datilografia + TTS =====
  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0; el.textContent = '';
      (function tick() { if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(tick, speed); } else resolve(); })();
    });
  }

  async function typeOnce(el, text, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if (!msg) return;

    el.classList.add('typing-active'); el.classList.remove('typing-done');
    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => { try { window.runTyping(el, msg, () => res(), { speed, cursor: true }); } catch { usedFallback = true; res(); } });
    } else usedFallback = true;
    if (usedFallback) await localType(el, msg, speed);
    el.classList.remove('typing-active'); el.classList.add('typing-done');

    if (speak && msg && !el.dataset.spoken) {
      try {
        speechSynthesis.cancel?.();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(msg, { lang: 'pt-BR', rate: 1.06, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch {}
    }
    await sleep(60);
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc)
        || (root?.dataset?.transitionSrc)
        || '/assets/videos/filme-eu-na-irmandade.mp4';
  }

  function pick(root) {
    return {
      root,
      title:      q('.titulo-pergaminho', root),
      nameInput:  q('#guiaNameInput', root),
      confirmBtn: q('#btn-confirmar-nome', root),
      moldura:    q('.moldura-grande', root),
      guiaTexto:  q('#guiaTexto', root),
      optionsBox: q('.guia-options', root),
      errorBox:   q('#guia-error', root)
    };
  }

  async function loadGuias() {
    const r = await fetch(DATA_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error(`GET ${DATA_URL} -> ${r.status}`);
    return r.json();
  }

  function renderButtons(optionsBox, guias) {
  optionsBox.innerHTML = '';
  guias.forEach(g => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-stone-espinhos no-anim';
    btn.dataset.action = 'select-guia';
    btn.dataset.guia = g.id;
    btn.setAttribute('aria-label', `Escolher o guia ${g.nome}`);
    btn.disabled = true;

    // ✅ Nome visível no botão
    btn.innerHTML = `<span class="label">${g.nome}</span>`;

    // plano de fundo opcional
    if (g.bgImage) {
      btn.style.backgroundImage = `url('${g.bgImage}')`;
      btn.style.backgroundSize = 'cover';
      btn.style.backgroundPosition = 'center';
    }

    optionsBox.appendChild(btn);
  });
}


  function findGuia(guias, id) {
    id = (id || '').toLowerCase();
    return guias.find(g => (g.id || '').toLowerCase() === id);
  }

  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    await waitForTransitionUnlock();
    ensureVisible(root);

    const els = pick(root);

    // ===== Nome sempre em MAIÚSCULAS =====
   if (els.nameInput) {
    els.nameInput.addEventListener('input', () => {
    const start = els.nameInput.selectionStart;
    const end = els.nameInput.selectionEnd;
    els.nameInput.value = els.nameInput.value.toUpperCase();
    // mantém o cursor na posição correta
    els.nameInput.setSelectionRange(start, end);
  });
}


    // título com datilografia
    if (els.title && !els.title.classList.contains('typing-done')) {
      await typeOnce(els.title, null, { speed: 34, speak: true });
    }

    // carrega JSON e cria botões
    let guias = [];
    try {
      guias = await loadGuias(); // [{id, nome, descricao, bgImage}, ...]
      renderButtons(els.optionsBox, guias);
      els.errorBox?.classList.add(HIDE_CLASS);
      els.errorBox?.setAttribute('aria-hidden', 'true');
    } catch (e) {
      console.error('[JCGuia] Erro ao carregar guias:', e);
      els.errorBox?.classList.remove(HIDE_CLASS);
      els.errorBox?.setAttribute('aria-hidden', 'false');
    }

    // estado inicial: botões desativados até confirmar nome
    const guideButtons = qa('button[data-action="select-guia"]', els.optionsBox);
    guideButtons.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; b.style.cursor = 'not-allowed'; });

    // confirmar nome → habilita texto e opções
    els.confirmBtn?.addEventListener('click', async () => {
      const name = (els.nameInput?.value || '').trim();
      if (name.length < 2) {
        window.toast?.('Por favor, insira um nome válido.', 'warning');
        els.nameInput?.focus();
        return;
      }

      // texto do container (datilografia + TTS), com nome
      if (els.guiaTexto) {
        const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
        const msg  = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, name);
        els.guiaTexto.textContent = '';
        await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });

        // ✨ ativa brilho dourado da moldura (opcional)
        els.moldura?.classList.add('glow');
        els.guiaTexto?.classList.add('glow');
      }

      // habilita opções
      guideButtons.forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; });
    }, { once: true });

    // hover/foco → mostrar descrição do guia (datilografia + TTS)
    guideButtons.forEach(btn => {
      const preview = async () => {
        const g = findGuia(guias, btn.dataset.guia);
        if (!g || !els.guiaTexto) return;
        // não espeta se ainda estiver tocando TTS de outra frase
        els.guiaTexto.dataset.spoken = '';
        await typeOnce(els.guiaTexto, g.descricao, { speed: 34, speak: true });
      };
      btn.addEventListener('mouseenter', preview);
      btn.addEventListener('focus', preview);
    });

    // clique → salva, apaga brilho e toca transição
    guideButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const g = findGuia(guias, btn.dataset.guia) || { id: btn.dataset.guia, nome: btn.textContent.trim() };

        // apaga brilho
        els.moldura?.classList.add('fade-out');
        els.guiaTexto?.classList.add('fade-out');

        // persiste
        try {
          window.JC = window.JC || {};
          window.JC.data = window.JC.data || {};
          window.JC.data.guia = g.id || g.nome;
        } catch {}

        // transição
        const src = getTransitionSrc(root, btn);
        if (typeof window.playTransitionVideo === 'function') {
          window.playTransitionVideo(src, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
        }
      });
    });

    console.log('[JCGuia] pronto (dinâmico via guias.json)');
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    document.addEventListener('section:shown', onSectionShown, { passive: true });
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();

})();
