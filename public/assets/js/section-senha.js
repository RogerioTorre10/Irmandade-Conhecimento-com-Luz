(function () {
  'use strict';

  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const NEXT_PAGE = '/jornada-conhecimento-com-luz1.html';
  const HOME_PAGE = '/';
  const HIDE = 'hidden';
  const INITIAL_TYPING_DELAY_MS = 9000; // Aumentado para 9s para sincronizar com vídeo
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const FALLBACK_PAGE = '/selfie.html';

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    typingInProgress: false,
    videoDone: false,
    initialized: false,
    observer: null
  };

  // ---------- Utils ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);
  const textOf = (el) => {
    if (!el) return '';
    const ds = el.dataset?.text;
    const tc = el.textContent || '';
    return (ds && ds.trim().length ? ds : tc).trim();
  };

  function normalizeParagraph(el) {
    if (!el) return false;
    const current = el.textContent?.trim() || '';
    const ds = el.dataset?.text?.trim() || '';
    const source = ds || current;

    if (!source) return false;

    el.dataset.text = source;

    if (!el.classList.contains('typing-done')) {
      el.textContent = '';
      el.classList.remove('typing-active', 'typing-done');
      delete el.dataset.spoken;
    }
    return true;
  }

  async function localType(el, text, speed = 36) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
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

  async function typeOnce(el, { speed = 36, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || '').trim();
    if (!text) return;

    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(
            el,
            text,
            () => resolve(),
            { speed, cursor: true }
          );
        } catch (e) {
          console.warn('[JCSenha] runTyping falhou, usando fallback local', e);
          usedFallback = true;
          resolve();
        }
      });
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      await localType(el, text, speed);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    window.G.__typingLock = prevLock;

    if (speak && text && window.EffectCoordinator?.speak && !el.dataset.spoken) {
      try {
        window.EffectCoordinator.speak(text);
        el.dataset.spoken = 'true';
      } catch {}
    }

    await sleep(80);
  }

  async function waitForTypingBridge(maxMs = 3000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    return true;
  }

  function pickElements(root) {
    return {
      instr1: root.querySelector('#senha-instr1'),
      instr2: root.querySelector('#senha-instr2'),
      instr3: root.querySelector('#senha-instr3'),
      instr4: root.querySelector('#senha-instr4'),
      input:  root.querySelector('#senha-input'),
      toggle: root.querySelector('.btn-toggle-senha'),
      btnNext: root.querySelector('#btn-senha-avancar'),
      btnPrev: root.querySelector('#btn-senha-prev')
    };
  }

  function forceRedirect() {
    console.log('Forçando redirecionamento para:', NEXT_PAGE);
    setTimeout(() => {
      try {
        window.location.replace(NEXT_PAGE);
      } catch (e) {
        console.warn('window.location.replace falhou para:', NEXT_PAGE, 'tentando assign:', FALLBACK_PAGE);
        try {
          window.location.assign(FALLBACK_PAGE);
        } catch (e) {
          console.warn('window.location.assign falhou, tentando href:', HOME_PAGE);
          window.location.href = HOME_PAGE;
        }
      }
    }, 100);
  }

  function playTransitionThen(nextStep) {
    if (document.getElementById('senha-transition-overlay') || window.JCSenha.state.transitioning) {
      console.warn('Transição já em andamento ou flag transitioning ativa, ignorando.');
      return;
    }
    window.JCSenha.state.transitioning = true;
    console.log('Iniciando transição de vídeo:', TRANSITION_SRC);
    document.body.style.background = 'white';
    const overlay = document.createElement('div');
    overlay.id = 'senha-transition-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: white; z-index: 999999;
      display: flex; align-items: center; justify-content: center;`;
    const loader = document.createElement('div');
    loader.textContent = 'Carregando...';
    loader.style.cssText = `
      color: #333; font-family: 'BerkshireSwash', cursive; font-size: 24px;
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
    const video = document.createElement('video');
    video.src = TRANSITION_SRC;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    
    document.body.innerHTML = '';
    document.removeEventListener('section:shown', window.JCSenha.__sectionShownHandler);
    document.body.appendChild(overlay);
    overlay.appendChild(video);
    overlay.appendChild(loader);
    console.log('Vídeo e loader adicionados ao DOM.');

    let done = false;
    const cleanup = () => {
      if (done) return; done = true;
      try { video.pause(); } catch {}
      overlay.remove();
      document.body.style.background = '';
      console.log('Transição concluída, executando próximo passo.');
      if (typeof nextStep === 'function') nextStep();
      window.JCSenha.state.transitioning = false;
      window.JCSenha.state.videoDone = true;
    };

    video.addEventListener('ended', () => {
      console.log('Vídeo terminou, limpando e redirecionando para:', NEXT_PAGE);
      cleanup();
      forceRedirect();
    }, { once: true });
    video.addEventListener('error', () => {
      console.error('Erro ao reproduzir vídeo:', TRANSITION_SRC);
