<script>
(function () {
  'use strict';

  // ===== Config =====
  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const PREV_SECTION_ID = 'section-termos';
  const NEXT_SECTION_ID = 'section-guia';       // vai para GUIA após validar a Palavra-Chave
  const VIDEO_SRC = '/assets/video/filme-portal-senha.mp4';
  const HIDE_CLASS = 'hidden';
  const TRANSITION_TIMEOUT_MS = 2500;
  const TTS_DELAY_MS = 300;

  // Evita bind duplo/idempotência
  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] já carregado');
    return;
  }
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerOn: false,
    typingInProgress: false,
    initialized: false,
    observer: null
  };

  // ===== Utils =====
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function waitForElement(selector, { within = document, timeout = 8000, step = 100 } = {}) {
    const t0 = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        const el = (within || document).querySelector(selector) || document.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - t0 >= timeout) return reject(new Error(`timeout waiting ${selector}`));
        setTimeout(tick, step);
      };
      tick();
    });
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
    el.style.zIndex = 'auto';
  }

  async function localType(el, text, speed = 40) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  async function typeOnce(el, { speed = 40, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || el.textContent || '').trim();
    if (!text) return;

    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try {
          window.runTyping(el, text, () => res(), { speed, cursor: true });
        } catch (e) {
          console.warn('[JCSenha] runTyping falhou, usando fallback local', e);
          usedFallback = true; res();
        }
      });
    } else {
      usedFallback = true;
    }
    if (usedFallback) await localType(el, text, speed);

    el.classList.add('typing-done');
    el.classList.remove('typing-active');
    window.G.__typingLock = prevLock;

    if (speak && text && window.EffectCoordinator?.speak && !el.dataset.spoken) {
      try {
        speechSynthesis.cancel();
        window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.05, pitch: 1.0 });
        await sleep(TTS_DELAY_MS);
        el.dataset.spoken = 'true';
      } catch (e) {
        console.error('[JCSenha] TTS falhou:', e);
      }
    }
  }

  async function waitForTypingBridge(maxMs = 3000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    console.warn('[JCSenha] window.runTyping não encontrado após', maxMs, 'ms');
    return true;
  }

  async function waitForVideoEnd(videoId = 'videoTransicao') {
    const video = document.getElementById(videoId);
    if (!video) return sleep(TRANSITION_TIMEOUT_MS);
    return new Promise(resolve => {
      video.addEventListener('ended', resolve, { once: true });
      setTimeout(resolve, TRANSITION_TIMEOUT_MS);
    });
  }

  function playTransitionVideo(nextSectionId) {
    console.log('[JCSenha] Iniciando transição de vídeo:', VIDEO_SRC);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, nextSectionId);
    } else if (window.JC?.show) {
      window.JC.show(nextSectionId);
    } else {
      window.location.hash = `#${nextSectionId}`;
    }
  }

  function normalizeParagraph(el) {
    if (!el) return;
    const txt = (el.dataset?.text || el.textContent || '').trim();
    el.dataset.text = txt;
    el.textContent = '';
    el.classList.remove('typing-done', 'typing-active', 'lumen-typing');
  }

  function armObserver(root) {
    try {
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs = new MutationObserver(() => {
        if (!window.JCSenha.state.typingInProgress && !window.JCSenha.state.initialized) {
          const { instr1, instr2, instr3, instr4 } = pick(root);
          [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
          runTypingSequence(root);
        }
      });
      obs.observe(root, { childList: true, subtree: true, characterData: true });
      window.JCSenha.state.observer = obs;
      console.log('[JCSenha] Observer configurado');
    } catch (e) {
      console.error('[JCSenha] Erro no observer:', e);
    }
  }

  // ===== Core =====
  function pick(root) {
    return {
      root,
      instr1: q('#senha-instr1', root),
      instr2: q('#senha-instr2', root),
      instr3: q('#senha-instr3', root),
      instr4: q('#senha-instr4', root),
      input: q('#senha-input', root),
      toggle: q('.btn-toggle-senha', root),
      btnNext: q('#btn-senha-avancar', root),
      btnPrev: q('#btn-senha-prev', root)
    };
  }

  async function runTypingSequence(root) {
    window.JCSenha.state.typingInProgress = true;

    await waitForVideoEnd();
    await sleep(400);

    const { instr1, instr2, instr3, instr4, input, toggle, btnNext } = pick(root);

    [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
    await waitForTypingBridge();

    if (instr1 && !instr1.classList.contains('typing-done')) await typeOnce(instr1, { speed: 38, speak: true });
    if (instr2 && !instr2.classList.contains('typing-done')) await typeOnce(instr2, { speed: 38, speak: true });
    if (instr3 && !instr3.classList.contains('typing-done')) await typeOnce(instr3, { speed: 38, speak: false });
    if (instr4 && !instr4.classList.contains('typing-done')) await typeOnce(instr4, { speed: 38, speak: false });

    // Libera interação somente após a intro
    [input, toggle, btnNext].forEach(el => {
      if (el) {
        el.disabled = false;
        el.style.opacity = '1';
        el.style.cursor = (el.tagName === 'INPUT') ? 'text' : 'pointer';
      }
    });

    window.JCSenha.state.typingInProgress = false;
    window.JCSenha.state.initialized = true;
  }

  async function initOnce(root) {
    if (!root || root.dataset.senhaInitialized === 'true' || window.JCSenha.state.ready) return;

    ensureVisible(root);

    const els = pick(root);
    // Estado inicial bloqueado
    els.btnPrev?.setAttribute('disabled', 'true');
    els.btnNext?.setAttribute('disabled', 'true');
    els.input?.setAttribute('disabled', 'true');
    els.toggle?.setAttribute('disabled', 'true');

    // Olho mágico (mostrar/ocultar senha)
    if (els.toggle && els.input) {
      els.toggle.addEventListener('click', () => {
        els.input.type = (els.input.type === 'password') ? 'text' : 'password';
        console.log('[JCSenha] Novo tipo do input:', els.input.type);
      });
    }

    // Voltar
    els.btnPrev?.addEventListener('click', () => {
      try { window.JC?.show(PREV_SECTION_ID); } catch(e) { console.error('[JCSenha] Voltar falhou', e); }
    });

    // Av
