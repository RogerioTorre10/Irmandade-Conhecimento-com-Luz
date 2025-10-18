// section-senha.js — 18/out (Lumen v6)
// - Fallback com timeout para runTyping (força datilografia local se travar/bugar)
// - Lock de TTS por toda a sequência; abre só no momento da fala do parágrafo
// - Sequência estrita: digita -> fala -> pausa -> próximo
// - Digitação LTR e alinhada à esquerda; restaura estilos ao final
// - Reage a reinjeções (MutationObserver) e reexecuta com segurança
(function () {
  'use strict';

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] v6 já ativo. Reforçando início, se visível.');
    const root0 = document.getElementById('section-senha');
    if (root0 && !root0.classList.contains('hidden') && root0.getAttribute('aria-hidden') !== 'true') {
      window.JCSenha?.__kick && window.JCSenha.__kick();
    }
    return;
  }

  // ===== Config =====
  const TYPING_MS = 60;          // velocidade (ms/char)
  const PAUSE_BETWEEN_P = 150;   // respiro entre parágrafos
  const BRIDGE_TIMEOUT = 1200;   // tempo máx. para confiar no runTyping antes do fallback
  const EST_WPM = 160;           // estimativa para fallback de TTS
  const EST_CPS = 13;

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    typingInProgress: false,
    listenerAdded: false,
    observer: null,
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const visible = (el) => !!el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';

  const sel = {
    root:   '#section-senha',
    p1:     '#senha-instr1',
    p2:     '#senha-instr2',
    p3:     '#senha-instr3',
    p4:     '#senha-instr4',
    input:  '#senha-input',
    toggle: '.btn-toggle-senha, [data-action="toggle-password"]',
    next:   '#btn-senha-avancar',
    prev:   '#btn-senha-prev'
  };

  function pick(root) {
    return {
      root,
      p1: root.querySelector(sel.p1),
      p2: root.querySelector(sel.p2),
      p3: root.querySelector(sel.p3),
      p4: root.querySelector(sel.p4),
      input: root.querySelector(sel.input),
      toggle: root.querySelector(sel.toggle),
      next: root.querySelector(sel.next),
      prev: root.querySelector(sel.prev),
    };
  }

  function ensureDataText(el) {
    if (!el) return false;
    const ds = el.dataset?.text?.trim();
    const tc = (el.textContent || '').trim();
    const src = ds || tc;
    if (!src) return false;
    el.dataset.text = src;
    return true;
  }

  function prepareTyping(el) {
    if (!el) return false;
    if (!('prevAlign' in el.dataset)) el.dataset.prevAlign = el.style.textAlign || '';
    if (!('prevDir' in el.dataset))   el.dataset.prevDir   = el.getAttribute('dir') || '';
    el.style.textAlign = 'left';
    el.setAttribute('dir', 'ltr');
    el.textContent = '';
    el.classList.remove('typing-done');
    el.classList.add('typing-active');
    delete el.dataset.spoken;
    return true;
  }

  function restoreTyping(el) {
    if (!el) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  function estSpeakMs(text) {
    const t = (text || '').trim();
    if (!t) return 300;
    const words = t.split(/\s+/).length;
    const byWpm = (words / EST_WPM) * 60000;
    const byCps = (t.length / EST_CPS) * 1000;
    return Math.max(byWpm, byCps, 700);
  }

  async function speakOnce(text) {
    if (!text) return;
    try {
      if (window.EffectCoordinator?.speak) {
        const r = window.EffectCoordinator.speak(text);
        if (r && typeof r.then === 'function') {
          await r; return;
        }
      }
    } catch {}
    await sleep(estSpeakMs(text));
  }

  async function localType(el, text, speed) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else resolve();
      };
      tick();
    });
  }

  // runTyping com watchdog: se não “andar” em BRIDGE_TIMEOUT, cai no localType
  async function typeOnce(el, speed = TYPING_MS) {
    if (!el) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';

    // mantém lock de TTS ligado; vamos abrir só na hora de falar
    window.G = window.G || {};
    if (!window.G.__typingLock) window.G.__typingLock = true;

    prepareTyping(el);

    let usedFallback = false;
    let finished = false;

    if (typeof window.runTyping === 'function') {
      await Promise.race([
        new Promise((resolve) => {
          try {
            window.runTyping(
              el,
              text,
              () => { finished = true; resolve(); },
              { speed, cursor: true }
            );
          } catch (e) {
            console.warn('[JCSenha] runTyping erro, fallback local.', e);
            usedFallback = true;
            resolve();
          }
        }),
        (async () => {
          await sleep(BRIDGE_TIMEOUT);
          if (!finished) {
            usedFallback = true;
          }
        })()
      ]);
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      await localType(el, text, speed);
    }

    restoreTyping(el);
    return text;
  }

  async function waitBridge(ms = 2000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    return true;
  }

  function armObserver(root) {
    try {
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs = new MutationObserver((muts) => {
        if (window.JCSenha.state.typingInProgress) return;
        for (const m of muts) {
          if (m.type === 'childList' && (m.addedNodes?.length || m.removedNodes?.length)) {
            console.log('[JCSenha] Reinjeção detectada — retomando sequência.');
            window.JCSenha.__kick();
            break;
          }
        }
      });
      obs.observe(root, { childList: true, subtree: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  async function runSequence(root) {
    if (!root) return;
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { p1, p2, p3, p4, input, next, prev } = pick(root);
    const seq = [p1, p2, p3, p4].filter(Boolean);

    // Travar botões e mutar TTS geral
    prev?.setAttribute('disabled', 'true');
    next?.setAttribute('disabled', 'true');
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    // Normaliza e limpa conteúdo VISUAL antes de qualquer leitor
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
    });

    await waitBridge();

    // Sequência estrita
    for (const p of seq) {
      const text = await typeOnce(p, TYPING_MS);

      // abrir o lock SÓ para nossa fala deste parágrafo
      const wasLocked = window.G.__typingLock;
      window.G.__typingLock = false;
      if (text && !p.dataset.spoken) {
        await speakOnce(text);
        p.dataset.spoken = 'true';
      }
      // fecha lock novamente antes do próximo parágrafo
      window.G.__typingLock = true;

      await sleep(PAUSE_BETWEEN_P);
    }

    // Final: libera lock global ao estado anterior
    window.G.__typingLock = prevLock;

    prev?.removeAttribute('disabled');
    next?.removeAttribute('disabled');
    try { input?.focus(); } catch {}

    window.JCSenha.state.typingInProgress = false;
  }

  function bindControls(root) {
    const { input, toggle, next, prev } = pick(root);

    if (toggle && !toggle.__senhaBound) {
      toggle.addEventListener('click', () => {
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      toggle.__senhaBound = true;
    }

    if (prev && !prev.__senhaBound) {
      prev.addEventListener('click', () => { try { window.JC?.show?.('section-termos'); } catch {} });
      prev.__senhaBound = true;
    }

    if (next && !next.__senhaBound) {
      next.addEventListener('click', () => {
        if (!input) return;
        const senha = (input.value || '').trim();
        if (senha.length >= 3) {
          try { window.JC?.show?.('section-filme'); } catch {}
        } else {
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try { input.focus(); } catch {}
        }
      });
      next.__senhaBound = true;
    }
  }

  async function initFor(root) {
    if (!root) return;
    // garante visível
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    bindControls(root);
    armObserver(root);
    await runSequence(root);
  }

  window.JCSenha.__kick = function () {
    const root = document.querySelector(sel.root);
    if (!root) return;
    const { p1, p2, p3, p4 } = pick(root);
    [p1, p2, p3, p4].filter(Boolean).forEach(p => {
      if (ensureDataText(p) && !p.classList.contains('typing-done')) {
        p.textContent = '';
      }
    });
    initFor(root);
  };

  // Evento oficial
  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', (evt) => {
      if (evt?.detail?.sectionId === 'section-senha') {
        console.log('[JCSenha] section:shown → init (v6)');
        window.JCSenha.__kick();
      }
    });
    window.JCSenha.state.listenerAdded = true;
  }

  // Boot imediato se já visível
  const tryImmediate = () => {
    const root = document.querySelector(sel.root);
    if (root && visible(root)) {
      console.log('[JCSenha] Boot imediato (v6).');
      window.JCSenha.__kick();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryImmediate);
  } else {
    tryImmediate();
  }

  // Watchdog
  setTimeout(() => {
    const root = document.querySelector(sel.root);
    if (root && visible(root) && !root.querySelector('.typing-active') && !root.querySelector('.typing-done')) {
      console.log('[JCSenha] Watchdog v6 — iniciando sequência.');
      window.JCSenha.__kick();
    }
  }, 900);

})();
