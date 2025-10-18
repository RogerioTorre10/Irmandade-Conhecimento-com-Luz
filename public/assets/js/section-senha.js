// section-senha.js — MÍNIMO + TTS (start imediato) — 18/out
// - Datilografia local (sempre), esquerda→direita (força !important)
// - Início imediato ao receber section:shown (sem esperas longas)
// - TTS após cada parágrafo (aguarda Promise;// section-senha.js — Foco em Datilografia + TTS (v8)
// - Início imediato (sem esperas longas)
// - Força LTR e alinhamento à esquerda mesmo com pai centralizado
// - Sequência estrita: digita -> fala -> próximo (com lock de TTS)
// - Usa apenas datilografia local (sem runTyping), para garantir visual

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v8) {
    const root0 = document.getElementById('section-senha');
    if (root0 && !root0.classList.contains('hidden') && root0.getAttribute('aria-hidden') !== 'true') {
      window.JCSenha?.__kick && window.JCSenha.__kick();
    }
    return;
  }

  // ===== Config =====
  const TYPING_MS = 60;        // ms por caractere
  const PAUSE_BETWEEN_P = 120; // pausa entre parágrafos
  const EST_WPM = 160;         // fallback de duração do TTS
  const EST_CPS = 13;

  // ===== Namespace/Estado =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v8 = true;
  window.JCSenha.state = { typing: false, observer: null };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const isVisible = (el) => !!el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';

  // Injeta um CSS de reforço de alinhamento (uma vez)
  (function injectOnce() {
    if (document.getElementById('jc-senha-align-patch')) return;
    const style = document.createElement('style');
    style.id = 'jc-senha-align-patch';
    style.textContent = `
      /* Garante LTR e alinhamento à esquerda enquanto digita */
      #section-senha .typing-active {
        text-align: left !important;
        direction: ltr !important;
        display: block !important;
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: auto !important;
      }
    `;
    document.head.appendChild(style);
  })();

  const sel = {
    root: '#section-senha',
    p1:   '#senha-instr1',
    p2:   '#senha-instr2',
    p3:   '#senha-instr3',
    p4:   '#senha-instr4'
  };

  function pick(root) {
    return {
      root,
      p1: root.querySelector(sel.p1),
      p2: root.querySelector(sel.p2),
      p3: root.querySelector(sel.p3),
      p4: root.querySelector(sel.p4),
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

    // Blindagem inline + classe para vencer centralizações do pai
    el.style.setProperty('text-align', 'left', 'important');
    el.setAttribute('dir', 'ltr');
    el.style.display = 'block';
    el.style.width = '100%';
    el.style.marginLeft = '0';
    el.style.marginRight = 'auto';

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

    // Restaura o estado visual original
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir);
    else el.removeAttribute('dir');
  }

  // Datilografia local segura
  async function localType(el, text, speed = TYPING_MS) {
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
        if (r && typeof r.then === 'function') { await r; return; }
      }
    } catch {}
    await sleep(estSpeakMs(text));
  }

  async function typeOnce(el) {
    if (!el) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';
    // Lock TTS durante a digitação deste parágrafo
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    prepareTyping(el);
    await localType(el, text, TYPING_MS);
    restoreTyping(el);

    // Libera lock (para nossa fala) e devolve estado anterior depois
    window.G.__typingLock = prevLock;
    return text;
  }

  async function runSequence(root) {
    if (!root || window.JCSenha.state.typing) return;
    window.JCSenha.state.typing = true;

    const { p1, p2, p3, p4 } = pick(root);
    const seq = [p1, p2, p3, p4].filter(Boolean);

    // Lock global de TTS para prevenir leitura precoce
    window.G = window.G || {};
    const prevGlobalLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    // Normaliza e limpa visual (início imediato)
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
      // já força block + width 100% para não "crescer do centro"
      p.style.display = 'block';
      p.style.width = '100%';
    });

    // Sequência: digita -> fala -> pausa -> próximo
    for (const p of seq) {
      const text = await typeOnce(p);

      // abre lock só para NOSSA fala; fecha antes do próximo
      const wasLocked = !!window.G.__typingLock;
      window.G.__typingLock = false;
      if (text && !p.dataset.spoken) {
        await speakOnce(text);
        p.dataset.spoken = 'true';
      }
      window.G.__typingLock = wasLocked || true;

      await sleep(PAUSE_BETWEEN_P);
    }

    // Restaura lock global
    window.G.__typingLock = prevGlobalLock;

    window.JCSenha.state.typing = false;
  }

  function armObserver(root) {
    try {
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs = new MutationObserver((muts) => {
        if (window.JCSenha.state.typing) return;
        for (const m of muts) {
          if (m.type === 'childList' && (m.addedNodes?.length || m.removedNodes?.length)) {
            console.log('[JCSenha:v8] Reinjeção detectada — retomando.');
            window.JCSenha.__kick();
            break;
          }
        }
      });
      obs.observe(root, { childList: true, subtree: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  async function initFor(root) {
    if (!root) return;

    // Garante visível e pronto
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    armObserver(root);
    await runSequence(root);
  }

  // Exposto para relançar
  window.JCSenha.__kick = function () {
    const root = document.querySelector(sel.root);
    if (!root) return;
    const { p1, p2, p3, p4 } = pick(root);
    [p1, p2, p3, p4].filter(Boolean).forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;

      // Reforço de alinhamento/box contra centralização do pai
      p.style.display = 'block';
      p.style.width = '100%';
      p.style.setProperty('text-align', 'left', 'important');
      p.setAttribute('dir', 'ltr');
      p.style.marginLeft = '0';
      p.style.marginRight = 'auto';
    });
    initFor(root);
  };

  // Evento oficial
  document.addEventListener('section:shown', (evt) => {
    if (evt?.detail?.sectionId === 'section-senha') {
      console.log('[JCSenha:v8] section:shown → start');
      window.JCSenha.__kick();
    }
  });

  // Boot imediato se já visível
  const rootInit = document.querySelector(sel.root);
  if (rootInit && isVisible(rootInit)) {
    console.log('[JCSenha:v8] Boot imediato.');
    window.JCSenha.__kick();
  }

  // Watchdog curto, caso algum evento se perca
  setTimeout(() => {
    const root = document.querySelector(sel.root);
    if (root && isVisible(root) && !root.querySelector('.typing-active') && !root.querySelector('.typing-done')) {
      console.log('[JCSenha:v8] Watchdog 250ms → start.');
      window.JCSenha.__kick();
    }
  }, 250);

})();
 se não houver, estima)
// - Sem olho mágico (por enquanto)

(function () {
  'use strict';

  if (window.JCSenha?.__bound_min_tts) {
    const root0 = document.getElementById('section-senha');
    if (root0 && !root0.classList.contains('hidden') && root0.getAttribute('aria-hidden') !== 'true') {
      window.JCSenha?.__kick && window.JCSenha.__kick();
    }
    return;
  }

  // ===== Config =====
  const TYPING_MS = 60;       // ms/caractere (ajuste fino)
  const PAUSE_BETWEEN_P = 120;
  const EST_WPM = 160;        // fallback para estimar duração do TTS
  const EST_CPS = 13;

  // ===== Estado/Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_min_tts = true;
  window.JCSenha.state = {
    typing: false,
    observer: null
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const isVisible = (el) => !!el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';

  const sel = {
    root: '#section-senha',
    p1:   '#senha-instr1',
    p2:   '#senha-instr2',
    p3:   '#senha-instr3',
    p4:   '#senha-instr4'
  };

  function pick(root) {
    return {
      root,
      p1: root.querySelector(sel.p1),
      p2: root.querySelector(sel.p2),
      p3: root.querySelector(sel.p3),
      p4: root.querySelector(sel.p4),
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

  // força LTR + align-left (com !important) e limpa visual
  function prepareTyping(el) {
    if (!el) return false;
    if (!('prevAlign' in el.dataset)) el.dataset.prevAlign = el.style.textAlign || '';
    if (!('prevDir' in el.dataset))   el.dataset.prevDir   = el.getAttribute('dir') || '';
    el.style.setProperty('text-align', 'left', 'important');
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
    // restaura estado visual original
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  async function localType(el, text, speed = TYPING_MS) {
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

  async function typeOnce(el) {
    if (!el) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';
    prepareTyping(el);
    await localType(el, text, TYPING_MS);
    restoreTyping(el);
    return text;
  }

  async function runSequence(root) {
    if (!root || window.JCSenha.state.typing) return;
    window.JCSenha.state.typing = true;

    const { p1, p2, p3, p4 } = pick(root);
    const seq = [p1, p2, p3, p4].filter(Boolean);

    // Normaliza fonte e limpa visual ANTES (início imediato)
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
    });

    // Sequência: digita → fala → pausa → próximo
    for (const p of seq) {
      const text = await typeOnce(p);
      if (text && !p.dataset.spoken) {
        await speakOnce(text);
        p.dataset.spoken = 'true';
      }
      await sleep(PAUSE_BETWEEN_P);
    }

    window.JCSenha.state.typing = false;
  }

  function armObserver(root) {
    try {
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs = new MutationObserver((muts) => {
        if (window.JCSenha.state.typing) return;
        for (const m of muts) {
          if (m.type === 'childList' && (m.addedNodes?.length || m.removedNodes?.length)) {
            console.log('[JCSenha:min+tts] Reinjeção detectada — reexecutando.');
            window.JCSenha.__kick();
            break;
          }
        }
      });
      obs.observe(root, { childList: true, subtree: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  async function initFor(root) {
    if (!root) return;

    // Garante visível e pronto (sem atrasos)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    armObserver(root);
    await runSequence(root);
  }

  // reexecuta sob demanda
  window.JCSenha.__kick = function () {
    const root = document.querySelector(sel.root);
    if (!root) return;
    const { p1, p2, p3, p4 } = pick(root);
    [p1, p2, p3, p4].filter(Boolean).forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
    });
    initFor(root);
  };

  // Dispara IMEDIATAMENTE quando a seção aparecer
  document.addEventListener('section:shown', (evt) => {
    if (evt?.detail?.sectionId === 'section-senha') {
      console.log('[JCSenha:min+tts] section:shown → start imediato');
      window.JCSenha.__kick();
    }
  });

  // Se já estiver visível, roda agora
  const rootInit = document.querySelector(sel.root);
  if (rootInit && isVisible(rootInit)) {
    console.log('[JCSenha:min+tts] Boot imediato.');
    window.JCSenha.__kick();
  }

  // Watchdog super curto (só 200ms) — caso algum evento se perca
  setTimeout(() => {
    const root = document.querySelector(sel.root);
    if (root && isVisible(root) && !root.querySelector('.typing-active') && !root.querySelector('.typing-done')) {
      console.log('[JCSenha:min+tts] Watchdog 200ms → start.');
      window.JCSenha.__kick();
    }
  }, 200);

})();
