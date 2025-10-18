// section-senha.js — 18/out (Lumen v5)
// - Independe de JC.init (auto-boot da seção)
// - Roda se a seção já estiver visível (sem perder "section:shown")
// - Digitação LTR alinhada à esquerda, sequencial e sincronizada com TTS
// - Muta TTS de terceiros durante a digitação (G.__typingLock)
// - Reage a reinjeções (MutationObserver) sem duplicar leituras
// - Olho mágico + navegação estáveis

(function () {
  'use strict';

  // Evita múltiplos binds do MESMO script
  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] v5 já ativo, ignorando novo bind.');
    // Mesmo assim, se a seção já estiver visível, dispara novamente a rotina
    const root = document.getElementById('section-senha');
    if (root && !root.classList.contains('hidden') && root.getAttribute('aria-hidden') !== 'true') {
      window.JCSenha?.__kick && window.JCSenha.__kick();
    }
    return;
  }

  // ====== Config ======
  const DEFAULT_TYPING_MS = 55;    // velocidade de datilografia (ms/caractere)
  const PAUSE_BETWEEN_P = 150;     // respiro entre parágrafos
  const EST_WPM = 160;             // estimativa TTS se não houver Promise
  const EST_CPS = 13;

  // ====== State / Namespace ======
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    typingInProgress: false,
    listenerAdded: false,
    observer: null
  };

  // ====== Utils ======
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const nowVisible = (el) => !!el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';

  const sel = {
    root:    '#section-senha',
    p1:      '#senha-instr1',
    p2:      '#senha-instr2',
    p3:      '#senha-instr3',
    p4:      '#senha-instr4',
    input:   '#senha-input',
    toggle:  '.btn-toggle-senha, [data-action="toggle-password"]',
    next:    '#btn-senha-avancar',
    prev:    '#btn-senha-prev'
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
    el.dataset.text = src; // fonte oficial
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
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir);
    else el.removeAttribute('dir');
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
          await r; // espera fim real
          return;
        }
      }
    } catch {}
    await sleep(estSpeakMs(text)); // fallback
  }

  async function localType(el, text, speed) {
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

  async function typeOnce(el, speed = DEFAULT_TYPING_MS) {
    if (!el) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';

    // Lock TTS de terceiros
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    prepareTyping(el);

    let fallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
        } catch (e) {
          console.warn('[JCSenha] runTyping falhou; usando fallback.', e);
          fallback = true;
          resolve();
        }
      });
    } else {
      fallback = true;
    }
    if (fallback) await localType(el, text, speed);

    restoreTyping(el);

    // Libera TTS para este parágrafo
    window.G.__typingLock = prevLock;

    return text;
  }

  async function waitTypingBridge(ms = 2500) {
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
        let reinjected = false;
        for (const m of muts) {
          if (m.type === 'childList' && (m.addedNodes?.length || m.removedNodes?.length)) {
            reinjected = true; break;
          }
        }
        if (reinjected) {
          console.log('[JCSenha] Reinjeção detectada; re-aplicando sequência.');
          window.JCSenha.__kick();
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

    // Travar botões durante a sequência
    prev?.setAttribute('disabled', 'true');
    next?.setAttribute('disabled', 'true');

    // Mute global ANTES de expor conteúdo
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    // Normaliza fonte e limpa conteúdo visual (evita leitura precoce)
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
    });

    await waitTypingBridge();

    // Sequência: digita -> fala -> pausa -> próximo
    for (const p of seq) {
      const text = await typeOnce(p, DEFAULT_TYPING_MS);
      if (text && !p.dataset.spoken) {
        await speakOnce(text);
        p.dataset.spoken = 'true';
      }
      await sleep(PAUSE_BETWEEN_P);
    }

    // Libera TTS geral ao final
    window.G.__typingLock = prevLock;

    // Libera botões + foco
    prev?.removeAttribute('disabled');
    next?.removeAttribute('disabled');
    try { input?.focus(); } catch {}

    window.JCSenha.state.typingInProgress = false;
  }

  function bindControls(root) {
    const { input, toggle, next, prev } = pick(root);

    // Evita listeners duplicados
    toggle && (toggle.__senhaBound || toggle).addEventListener?.('click', () => {
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
    if (toggle) toggle.__senhaBound = true;

    prev && (prev.__senhaBound || prev).addEventListener?.('click', () => {
      try { window.JC?.show?.('section-termos'); } catch {}
    });
    if (prev) prev.__senhaBound = true;

    next && (next.__senhaBound || next).addEventListener?.('click', () => {
      if (!input) return;
      const senha = (input.value || '').trim();
      if (senha.length >= 3) {
        try { window.JC?.show?.('section-filme'); } catch {}
      } else {
        window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
        try { input.focus(); } catch {}
      }
    });
    if (next) next.__senhaBound = true;
  }

  // ====== Orquestração ======
  async function initForRoot(root) {
    if (!root) return;
    // Garantir visível (sem brigar com showSection)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    bindControls(root);
    armObserver(root);
    await runSequence(root);
  }

  // Disparador principal (pode ser chamado várias vezes com segurança)
  window.JCSenha.__kick = function () {
    const root = document.querySelector(sel.root);
    if (!root) return;
    // Se reinjetou visível com texto pronto, re-normaliza e roda
    const { p1, p2, p3, p4 } = pick(root);
    [p1, p2, p3, p4].filter(Boolean).forEach(p => {
      if (ensureDataText(p) && !p.classList.contains('typing-done')) p.textContent = '';
    });
    initForRoot(root);
  };

  // 1) Escuta o evento oficial (quando existir)
  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', (evt) => {
      if (evt?.detail?.sectionId === 'section-senha') {
        console.log('[JCSenha] section:shown → init');
        window.JCSenha.__kick();
      }
    });
    window.JCSenha.state.listenerAdded = true;
  }

  // 2) Boot imediato se a seção já estiver no DOM e visível (JC.init indefinido, etc.)
  const tryImmediate = () => {
    const root = document.querySelector(sel.root);
    if (root && nowVisible(root)) {
      console.log('[JCSenha] Boot imediato (seção já visível).');
      window.JCSenha.__kick();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryImmediate);
  } else {
    tryImmediate();
  }

  // 3) Pequeno watchdog: se passarem 800ms e a seção estiver visível, garantir start
  setTimeout(() => {
    const root = document.querySelector(sel.root);
    if (root && nowVisible(root) && !root.querySelector('.typing-active') && !root.querySelector('.typing-done')) {
      console.log('[JCSenha] Watchdog acionado — iniciando sequência.');
      window.JCSenha.__kick();
    }
  }, 800);

})();
