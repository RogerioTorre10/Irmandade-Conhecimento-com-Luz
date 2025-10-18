// section-senha.js — 18/out (Lumen v4.1 • prelock fix)
// - PRELOCK de TTS no carregamento (evita "1ª tela só leitura")
// - Seção fica invisível até normalizar parágrafos; depois exibe e datilografa
// - Digitação LTR (esquerda→direita), sincronizada: digita → fala → próximo
// - Observa reinjeções e reaplica com segurança

(function () {
  'use strict';

  // ========= PRELOCK GLOBAL =========
  // Bloqueia qualquer TTS oportunista ANTES de eventos/HTML
  window.G = window.G || {};
  window.G.__typingLock = true;

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] v4.1 já ativo — reforçando, se visível.');
    const root0 = document.getElementById('section-senha');
    if (root0 && !root0.classList.contains('hidden') && root0.getAttribute('aria-hidden') !== 'true') {
      window.JCSenha?.__kick && window.JCSenha.__kick();
    }
    return;
  }

  // ====== Config ======
  const DEFAULT_TYPING_MS = 55;    // ms/char
  const MIN_PAUSE_BETWEEN_P = 120; // pausa entre parágrafos
  const EST_WPM = 155;             // fallback TTS
  const EST_CPS = 13;

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    typingInProgress: false,
    listenerAdded: false,
    observer: null
  };

  // -------- Utils ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const visible = (el) => !!el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true';

  function estimateSpeakMs(text) {
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
        const ret = window.EffectCoordinator.speak(text);
        if (ret && typeof ret.then === 'function') { await ret; return; }
      }
    } catch {}
    await sleep(estimateSpeakMs(text));
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
    // guardar estilos para restaurar
    if (!('prevAlign' in el.dataset)) el.dataset.prevAlign = el.style.textAlign || '';
    if (!('prevDir' in el.dataset))   el.dataset.prevDir   = el.getAttribute('dir') || '';
    // força LTR + alinhamento à esquerda
    el.style.textAlign = 'left';
    el.setAttribute('dir', 'ltr');
    // garante visual limpo p/ datilografia
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

  // Datilografia local (sem depender de runTyping — mais previsível)
  async function localType(el, text, speed = DEFAULT_TYPING_MS) {
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

  async function typeOnce(el, { speed = DEFAULT_TYPING_MS } = {}) {
    if (!el) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';

    // mantém lock de TTS ligado até terminar digitação
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    prepareTyping(el);
    await localType(el, text, speed);
    restoreTyping(el);

    // libera lock só agora para falar este parágrafo
    window.G.__typingLock = prevLock;

    return text;
  }

  function els(root) {
    return {
      instr1: root.querySelector('#senha-instr1'),
      instr2: root.querySelector('#senha-instr2'),
      instr3: root.querySelector('#senha-instr3'),
      instr4: root.querySelector('#senha-instr4'),
      input:  root.querySelector('#senha-input'),
      toggle: root.querySelector('.btn-toggle-senha, [data-action="toggle-password"]'),
      btnNext: root.querySelector('#btn-senha-avancar'),
      btnPrev: root.querySelector('#btn-senha-prev')
    };
  }

  async function runSequence(root) {
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev } = els(root);
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);

    // Travar botões e manter mute global até final da sequência completa
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    const prevGlobalLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    // Normaliza fonte e ZERA visual antes de qualquer leitor
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
    });

    // Agora a seção pode ficar visível (texto ainda vazio)
    root.style.visibility = 'visible';

    // Sequência estrita: digita → fala → pausa → próximo
    for (const p of seq) {
      const text = await typeOnce(p, { speed: DEFAULT_TYPING_MS });
      // abre global lock só para nossa fala deste parágrafo
      const wasLocked = !!window.G.__typingLock;
      window.G.__typingLock = false;
      if (text && !p.dataset.spoken) {
        await speakOnce(text);
        p.dataset.spoken = 'true';
      }
      // fecha lock novamente antes do próximo
      window.G.__typingLock = wasLocked || true;

      await sleep(MIN_PAUSE_BETWEEN_P);
    }

    // Libera lock global ao estado anterior
    window.G.__typingLock = prevGlobalLock;

    // Libera navegação e foca input
    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');
    try { input?.focus(); } catch {}

    window.JCSenha.state.typingInProgress = false;
  }

  function armObserver(root) {
    try {
      if (window.JCSenha.state.observer) {
        window.JCSenha.state.observer.disconnect();
      }
      const obs = new MutationObserver((mutations) => {
        if (window.JCSenha.state.typingInProgress) return;
        let need = false;
        for (const m of mutations) {
          if (m.type === 'childList' && (m.addedNodes?.length || m.removedNodes?.length)) { need = true; break; }
        }
        if (need) {
          console.log('[JCSenha] Reinjeção detectada — retomando sequência.');
          window.JCSenha.__kick();
        }
      });
      obs.observe(root, { childList: true, subtree: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  async function initFor(root) {
    if (!root) return;

    // Deixa invisível até normalizar (evita "1ª tela só leitura")
    root.style.visibility = 'hidden';

    // Garante visível/ativo estruturalmente (sem brigar com showSection)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility'); // vis será controlado explicitamente acima

    // Vincula controles
    const { input, toggle, btnNext, btnPrev } = els(root);
    toggle?.addEventListener('click', () => {
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    }, { once: false });

    btnPrev?.addEventListener('click', () => { try { window.JC?.show('section-termos'); } catch {} });
    btnNext?.addEventListener('click', () => {
      if (!input) return;
      const senha = (input.value || '').trim();
      if (senha.length >= 3) {
        try { window.JC?.show('section-filme'); } catch {}
      } else {
        window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
        try { input.focus(); } catch {}
      }
    });

    // Observa reinjeções
    armObserver(root);

    // Roda sequência
    await runSequence(root);
  }

  // Disparador principal
  window.JCSenha.__kick = function () {
    const root = document.getElementById('section-senha');
    if (!root) return;
    // Re-normaliza e mantém invisível até limpar tudo
    root.style.visibility = 'hidden';
    const { instr1, instr2, instr3, instr4 } = els(root);
    [instr1, instr2, instr3, instr4].filter(Boolean).forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
      delete p?.dataset?.spoken;
    });
    initFor(root);
  };

  // Evento oficial
  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', (evt) => {
      if (evt?.detail?.sectionId === 'section-senha') {
        console.log('[JCSenha] section:shown → init (v4.1)');
        window.JCSenha.__kick();
      }
    });
    window.JCSenha.state.listenerAdded = true;
  }

  // Boot imediato se já visível
  const tryImmediate = () => {
    const root = document.getElementById('section-senha');
    if (root && visible(root)) {
      console.log('[JCSenha] Boot imediato (v4.1)');
      window.JCSenha.__kick();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryImmediate);
  } else {
    tryImmediate();
  }

  // Watchdog extra
  setTimeout(() => {
    const root = document.getElementById('section-senha');
    if (root && visible(root) && !root.querySelector('.typing-active') && !root.querySelector('.typing-done')) {
      console.log('[JCSenha] Watchdog v4.1 — iniciando sequência.');
      window.JCSenha.__kick();
    }
  }, 900);

})();
