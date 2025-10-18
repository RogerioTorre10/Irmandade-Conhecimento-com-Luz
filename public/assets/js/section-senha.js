// section-senha.js — MODO MINÍMO (só datilografia) — 18/out
// - Sem TTS/leitura
// - Sem olho mágico
// - Tipagem local (sempre), LTR e alinhada à esquerda
// - Reage a reinjeções simples
(function () {
  'use strict';

  if (window.JCSenha?.__bound_min) {
    // Se já estiver ativo, só tenta rodar de novo se a seção estiver visível
    const root0 = document.getElementById('section-senha');
    if (root0 && !root0.classList.contains('hidden') && root0.getAttribute('aria-hidden') !== 'true') {
      window.JCSenha?.__kick && window.JCSenha.__kick();
    }
    return;
  }

  // ===== Config =====
  const TYPING_MS = 60;      // velocidade ms/char (ajuste aqui)
  const PAUSE_BETWEEN_P = 120;

  // ===== Namespace/Estado =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_min = true;
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

  // Pega a fonte do texto e a coloca em data-text
  function ensureDataText(el) {
    if (!el) return false;
    const ds = el.dataset?.text?.trim();
    const tc = (el.textContent || '').trim();
    const src = ds || tc;
    if (!src) return false;
    el.dataset.text = src;
    return true;
  }

  // Prepara p/ digitar: forçar LTR + align left e limpar visual
  function prepareTyping(el) {
    if (!el) return false;
    if (!('prevAlign' in el.dataset)) el.dataset.prevAlign = el.style.textAlign || '';
    if (!('prevDir' in el.dataset))   el.dataset.prevDir   = el.getAttribute('dir') || '';
    el.style.textAlign = 'left';
    el.setAttribute('dir', 'ltr');
    el.textContent = '';
    el.classList.remove('typing-done');
    el.classList.add('typing-active');
    return true;
  }

  function restoreTyping(el) {
    if (!el) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  // Datilografia local simples
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

  async function typeOnce(el) {
    if (!el) return;
    const text = (el.dataset?.text || '').trim();
    if (!text) return;
    prepareTyping(el);
    await localType(el, text, TYPING_MS);
    restoreTyping(el);
    await sleep(20);
  }

  async function runSequence(root) {
    if (!root || window.JCSenha.state.typing) return;
    window.JCSenha.state.typing = true;

    const { p1, p2, p3, p4 } = pick(root);
    const seq = [p1, p2, p3, p4].filter(Boolean);

    // Normaliza fonte e limpa visual ANTES
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
    });

    // Sequência simples: p1 -> p2 -> p3 -> p4
    for (const p of seq) {
      await typeOnce(p);
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
            console.log('[JCSenha:min] Reinjeção detectada — reexecutando datilografia.');
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
    // Garantir visível (sem interferir no controlador)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    armObserver(root);
    await runSequence(root);
  }

  // Exposto para reexecutar quando necessário
  window.JCSenha.__kick = function () {
    const root = document.querySelector(sel.root);
    if (!root) return;
    const { p1, p2, p3, p4 } = pick(root);
    [p1, p2, p3, p4].filter(Boolean).forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p?.classList.remove('typing-done', 'typing-active');
    });
    initFor(root);
  };

  // 1) Reage ao evento oficial, se existir
  document.addEventListener('section:shown', (evt) => {
    if (evt?.detail?.sectionId === 'section-senha') {
      console.log('[JCSenha:min] section:shown → datilografia');
      window.JCSenha.__kick();
    }
  });

  // 2) Boot imediato se já estiver visível
  const tryImmediate = () => {
    const root = document.querySelector(sel.root);
    if (root && isVisible(root)) {
      console.log('[JCSenha:min] Boot imediato.');
      window.JCSenha.__kick();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryImmediate);
  } else {
    tryImmediate();
  }

  // 3) Watchdog leve
  setTimeout(() => {
    const root = document.querySelector(sel.root);
    if (root && isVisible(root) && !root.querySelector('.typing-active') && !root.querySelector('.typing-done')) {
      console.log('[JCSenha:min] Watchdog → iniciando datilografia.');
      window.JCSenha.__kick();
    }
  }, 900);

})();
