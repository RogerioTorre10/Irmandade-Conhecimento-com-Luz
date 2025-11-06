// /assets/js/section-guia.js — v3.1 (confirmação em 2 passos + aviso com typing/TTS)
(function () {
  'use strict';

  const SECTION_ID      = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS      = 'hidden';

  const TYPING_SPEED = 42;
  const TTS_LATCH_MS = 600;
  const DATA_URL     = '/assets/data/guias.json';

  // NOVO: ajustes de UX
  const ARM_TIMEOUT_MS = 10000;   // tempo para confirmar após 1º clique
  const HOVER_DELAY_MS = 150;    // atraso para mostrar preview no hover

  if (window.JCGuia?.__bound) { console.log('[JCGuia] já carregado'); return; }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Lock de transição (vídeo) =====
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
      (function tick() {
        if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(tick, speed); }
        else resolve();
      })();
    });
  }

  async function typeOnce(el, text, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if (!msg) return;

    el.classList.add('typing-active'); el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try { window.runTyping(el, msg, () => res(), { speed, cursor: true }); }
        catch { usedFallback = true; res(); }
      });
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
// helper robusto: toca o vídeo de transição (se possível) e depois navega
function playTransitionSafe(src, nextId) {
  // 1) Se existir função do seu projeto, usa
  if (typeof window.playTransitionVideo === 'function') {
    window.playTransitionVideo(src, nextId);
    return;
  }
  if (typeof window.playTransitionThenGo === 'function') {
    window.playTransitionThenGo(nextId, src); // aceita ordem (nextId, src) se seu helper for assim
    return;
  }

  // 2) Fallback universal: cria overlay <video>, toca e navega ao terminar
  try {
    window.__TRANSITION_LOCK = true; // evita duplo clique
    const v = document.createElement('video');
    v.src = src || '/assets/videos/filme-eu-na-irmandade.mp4';
    v.playsInline = true;
    v.muted = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.style.cssText = `
      position:fixed;inset:0;z-index:9999;background:#000;
      width:100%;height:100%;object-fit:cover
    `;
    v.addEventListener('ended', () => {
      v.remove();
      window.__TRANSITION_LOCK = false;
      (window.JC && JC.show) ? JC.show(nextId, { force:true }) : (location.hash = '#' + nextId);
      document.dispatchEvent(new CustomEvent('transition:ended'));
    }, { once:true });
    v.addEventListener('error', () => {
      // se der erro, remove e navega assim mesmo
      console.warn('[guia] erro no vídeo de transição, seguindo...');
      v.remove();
      window.__TRANSITION_LOCK = false;
      (window.JC && JC.show) ? JC.show(nextId, { force:true }) : (location.hash = '#' + nextId);
      document.dispatchEvent(new CustomEvent('transition:ended'));
    }, { once:true });

    document.body.appendChild(v);
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // autoplay bloqueado: navega mesmo assim
        v.remove();
        window.__TRANSITION_LOCK = false;
        (window.JC && JC.show) ? JC.show(nextId, { force:true }) : (location.hash = '#' + nextId);
        document.dispatchEvent(new CustomEvent('transition:ended'));
      });
    }
  } catch (e) {
    console.error('[guia] fallback transição falhou', e);
    window.__TRANSITION_LOCK = false;
    (window.JC && JC.show) ? JC.show(nextId, { force:true }) : (location.hash = '#' + nextId);
    document.dispatchEvent(new CustomEvent('transition:ended'));
  }
}

// ====== troque a função confirmGuide pela versão abaixo ======
function confirmGuide(root, guiaId, guiaName) {
  try {
    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.guia = guiaId;
    sessionStorage.setItem('jornada.guia', guiaId);
    localStorage.setItem('jc.guia', guiaId);
  } catch {}

  const src = getTransitionSrc(root); // pega do data-transition-src do <section>, se houver
  playTransitionSafe(src, NEXT_SECTION_ID);
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
      errorBox:   q('#guia-error', root) // usaremos como "notice"
    };
  }

  async function loadGuias() {
    const r = await fetch(DATA_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error(`GET ${DATA_URL} -> ${r.status}`);
    return r.json(); // [{id, nome, descricao, bgImage}]
  }

  function renderButtons(optionsBox, guias) {
    optionsBox.innerHTML = '';
    guias.forEach(g => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-stone-espinhos no-anim guia-option'; // <- classe para UX
      btn.dataset.action = 'select-guia';
      btn.dataset.guia = g.id;
      btn.dataset.nome = g.nome;
      btn.setAttribute('aria-label', `Escolher o guia ${g.nome}`);
      btn.disabled = true;

      btn.innerHTML = `<span class="label">${g.nome}</span>`;

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

  // ====== Aviso (usando #guia-error como container) ======
  function getNoticeRefs(root) {
    const box = q('#guia-error', root);
    if (!box) return { box: null, span: null };

    // se não existir um span interno para datilografia, criamos
    let span = box.querySelector('#guia-notice-text');
    if (!span) {
      span = document.createElement('span');
      span.id = 'guia-notice-text';
      box.innerHTML = '';
      box.appendChild(span);
    }
    return { box, span };
  }

  async function showNotice(root, text, { speak = true } = {}) {
    const { box, span } = getNoticeRefs(root);
    if (!box || !span) return;
    box.classList.remove(HIDE_CLASS);
    box.setAttribute('aria-hidden', 'false');
    span.dataset.text = text;
    span.textContent = '';
    await typeOnce(span, null, { speed: 30, speak });
  }

  function hideNotice(root) {
    const { box, span } = getNoticeRefs(root);
    if (!box) return;
    if (span) span.textContent = '';
    box.classList.add(HIDE_CLASS);
    box.setAttribute('aria-hidden', 'true');
  }

  // ====== Confirmação em dois passos ======
  let armedId = null;
  let armTimer = null;
  const hoverTimers = new Map();

  function cancelArm(root) {
    if (armTimer) clearTimeout(armTimer);
    armTimer = null;
    armedId = null;
    qa('.guia-option.armed').forEach(el => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });
    hideNotice(root);
  }

  function confirmGuide(root, guiaId, guiaName) {
    try {
      window.JC = window.JC || {};
      window.JC.data = window.JC.data || {};
      window.JC.data.guia = guiaId;
      sessionStorage.setItem('jornada.guia', guiaId);
      localStorage.setItem('jc.guia', guiaId);
    } catch {}

    // === Ajuste da cor da aura conforme o guia ===
  try {
   const guiaAtual = (window.JC?.data?.guia || '').toLowerCase();
  if (guiaAtual) {
    document.body.dataset.guia = guiaAtual;
    console.log(`[AURA] Guia ativo: ${guiaAtual} · variações de cor aplicadas`);
  }
 } catch (err) {
   console.warn('[AURA] Falha ao definir cor do guia:', err);
 }


    const src = getTransitionSrc(root);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, NEXT_SECTION_ID);
    } else {
      window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
    }
  }

  function armGuide(root, btn, label) {
    const id = (btn.dataset.guia || '').toLowerCase();

    // se já está armado este mesmo id → confirmar
    if (armedId === id) {
      confirmGuide(root, id, label);
      cancelArm(root);
      return;
    }

    armedId = id;
    qa('.guia-option', root).forEach(el => { el.classList.remove('armed'); el.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('armed');
    btn.setAttribute('aria-pressed', 'true');

    showNotice(root, `Você escolheu ${label}. Clique novamente para confirmar.`, { speak: true });

    if (armTimer) clearTimeout(armTimer);
    armTimer = setTimeout(() => {
      cancelArm(root);
      showNotice(root, 'Tempo esgotado. Selecione o guia e clique novamente para confirmar.', { speak: true });
    }, ARM_TIMEOUT_MS);
  }

  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    await waitForTransitionUnlock();
    ensureVisible(root);

    const els = pick(root);

    // ===== Nome sempre MAIÚSCULO (campo) =====
    if (els.nameInput) {
      els.nameInput.addEventListener('input', () => {
        const start = els.nameInput.selectionStart;
        const end = els.nameInput.selectionEnd;
        els.nameInput.value = els.nameInput.value.toUpperCase();
        els.nameInput.setSelectionRange(start, end);
      });
    }

    // Título com datilografia + TTS
    if (els.title && !els.title.classList.contains('typing-done')) {
      await typeOnce(els.title, null, { speed: 34, speak: true });
    }

    // Carrega guias e cria botões
    let guias = [];
    try {
      guias = await loadGuias();
      renderButtons(els.optionsBox, guias);
      hideNotice(root);
    } catch (e) {
      console.error('[JCGuia] Erro ao carregar guias:', e);
      showNotice(root, 'Não foi possível carregar os guias. Tente novamente mais tarde.', { speak: false });
    }

    const guideButtons = qa('button[data-action="select-guia"]', els.optionsBox);
    guideButtons.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; b.style.cursor = 'not-allowed'; });

    // Confirmar nome → habilita texto e opções
    els.confirmBtn?.addEventListener('click', async () => {
      let name = (els.nameInput?.value || '').trim();
      if (name.length < 2) {
        window.toast?.('Por favor, insira um nome válido.', 'warning');
        els.nameInput?.focus();
        return;
      }

      const upperName = name.toUpperCase();
      els.nameInput.value = upperName;
      try {
        window.JC = window.JC || {};
        window.JC.data = window.JC.data || {};
        window.JC.data.nome = upperName;
      } catch {}

      if (els.guiaTexto) {
        const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
        const msg  = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);
        els.guiaTexto.textContent = '';
        await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });
        els.moldura?.classList.add('glow');
        els.guiaTexto?.classList.add('glow');
      }

      guideButtons.forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; });
      hideNotice(root);
    }, { once: true });

    // Hover/Focus → prévia com atraso (sem selecionar)
    const hoverTimers = new Map();
    guideButtons.forEach(btn => {
      const preview = async () => {
        if (btn.disabled) return;
        const g = findGuia(guias, btn.dataset.guia);
        if (!g || !els.guiaTexto) return;
        els.guiaTexto.dataset.spoken = '';
        await typeOnce(els.guiaTexto, g.descricao, { speed: 34, speak: true });
      };
      btn.addEventListener('mouseenter', () => {
        if (btn.disabled) return;
        const t = setTimeout(preview, HOVER_DELAY_MS);
        hoverTimers.set(btn, t);
      });
      btn.addEventListener('mouseleave', () => {
        const t = hoverTimers.get(btn);
        if (t) clearTimeout(t);
        hoverTimers.delete(btn);
      });
      btn.addEventListener('focus', () => {
        // em teclado, mostramos preview sem atraso
        if (!btn.disabled) preview();
      });
    });

    // Clique → arma; segundo clique no mesmo → confirma
    guideButtons.forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (btn.disabled) return;
        const label = (btn.dataset.nome || btn.getAttribute('aria-label') || btn.textContent || 'guia').toUpperCase();
        armGuide(root, btn, label);
      });

      // Duplo clique confirma direto
      btn.addEventListener('dblclick', (ev) => {
        ev.preventDefault();
        if (btn.disabled) return;
        const id = (btn.dataset.guia || '').toLowerCase();
        const label = (btn.dataset.nome || btn.getAttribute('aria-label') || id || 'guia').toUpperCase();
        confirmGuide(root, id, label);
        cancelArm(root);
      });

      // Teclado: Enter/Espaço armam/confirmam
      btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          if (btn.disabled) return;
          const label = (btn.dataset.nome || btn.getAttribute('aria-label') || btn.textContent || 'guia').toUpperCase();
          armGuide(root, btn, label);
        }
      });

      // ARIA
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-pressed', 'false');
    });

    // Cancela armação ao clicar fora
    document.addEventListener('click', (e) => {
      const inside = e.target.closest?.('.guia-option');
      if (!inside && armedId) cancelArm(root);
    });

    console.log('[JCGuia] pronto (JSON + maiúsculas + TTS + transição + 2-pass confirm)');
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
