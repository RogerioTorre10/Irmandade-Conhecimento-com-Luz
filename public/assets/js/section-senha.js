// section-senha.js — v11 (rápido + botões + olho mágico)
// - Start imediato (probe 100ms até 1.2s) + chute imediato
// - Só roda quando a seção SENHA está ativa; aborta se outra seção assumir
// - Datilografia local (E→D) + Leitura por parágrafo (aguarda Promise; senão, estima)
// - Botões habilitados desde o início; olho mágico ativo

(function () {
  'use strict';

  if (window.JCSenha?.__bound_v11) {
    window.JCSenha.__kick?.();
    return;
  }

  // ===== Config =====
  const TYPE_MS = 55;            // ms por caractere (datilografia)
  const PAUSE_BETWEEN_P = 100;   // pausa curta entre parágrafos
  const PROBE_MS = 100;          // intervalo do probe
  const PROBE_MAX_MS = 1200;     // duração máx. do probe (1.2s)
  const EST_WPM = 160;           // fallback p/ TTS
  const EST_CPS = 13;

  // ===== Estado / Namespace =====
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound_v11 = true;
  window.JCSenha.state = {
    running: false,
    startedOnce: false,
    probeTimer: null,
    observer: null,
    abortId: 0
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const qs = (s, r=document) => r.querySelector(s);

  function sectionsVisiveis() {
    return Array.from(document.querySelectorAll('.section'))
      .filter(s => !s.classList.contains('hidden') && s.getAttribute('aria-hidden') !== 'true');
  }

  function currentSectionHint() {
    return (window.JC && window.JC.currentSection)
        || document.body?.dataset?.currentSection
        || document.documentElement?.dataset?.currentSection
        || null;
  }

  function isSenhaAtiva(root) {
    if (!root) return false;
    const hint = currentSectionHint();
    if (hint && hint !== 'section-senha' && hint !== 'senha') return false;

    const vis = sectionsVisiveis();
    if (vis.length >= 1) {
      const outraVisivel = vis.some(s => s.id !== 'section-senha');
      if (outraVisivel) return false;
    }

    const visivel = !root.classList.contains('hidden') && root.getAttribute('aria-hidden') !== 'true';
    return visivel;
  }

  // CSS para garantir E→D durante a digitação
  (function injectCSS() {
    if (document.getElementById('jc-senha-align-patch-v11')) return;
    const style = document.createElement('style');
    style.id = 'jc-senha-align-patch-v11';
    style.textContent = `
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
    p4:   '#senha-instr4',
    input:'#senha-input',
    toggle: '.btn-toggle-senha, [data-action="toggle-password"]',
    next: '#btn-senha-avancar',
    prev: '#btn-senha-prev'
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
    const ds = (el.dataset?.text || '').trim();
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
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  async function localType(el, text, speed = TYPE_MS, myAbort) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (myAbort.cancelled()) { restoreTyping(el); return resolve(); }
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

  async function speakOnce(text, myAbort) {
    if (!text || myAbort.cancelled()) return;
    try {
      if (window.EffectCoordinator?.speak) {
        const r = window.EffectCoordinator.speak(text);
        if (r && typeof r.then === 'function') {
          await Promise.race([ r, (async()=>{ while(!myAbort.cancelled()) await sleep(40); })() ]);
          return;
        }
      }
    } catch {}
    const ms = estSpeakMs(text);
    const t0 = Date.now();
    while (!myAbort.cancelled() && (Date.now() - t0) < ms) {
      await sleep(40);
    }
  }

  function makeAbortToken() {
    const myId = ++window.JCSenha.state.abortId;
    return { id: myId, cancelled: () => myId !== window.JCSenha.state.abortId };
  }

  async function typeOnce(el, myAbort) {
    if (!el || myAbort.cancelled()) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';
    prepareTyping(el);
    await localType(el, text, TYPE_MS, myAbort);
    if (!myAbort.cancelled()) restoreTyping(el);
    return myAbort.cancelled() ? '' : text;
  }

  function getSeq(root) {
    const { p1, p2, p3, p4 } = pick(root);
    return [p1, p2, p3, p4].filter(Boolean);
  }

  async function runSequence(root) {
    if (!root || window.JCSenha.state.running) return;
    if (!isSenhaAtiva(root)) return;

    window.JCSenha.state.running = true;
    const myAbort = makeAbortToken();

    const seq = getSeq(root);
    if (seq.length === 0) { window.JCSenha.state.running = false; return; }

    // Normaliza e limpa visual (start imediato)
    seq.forEach(p => {
      if (ensureDataText(p)) p.textContent = '';
      p.classList.remove('typing-done', 'typing-active');
      delete p.dataset.spoken;
      p.style.display = 'block';
      p.style.width   = '100%';
      p.style.setProperty('text-align', 'left', 'important');
      p.setAttribute('dir', 'ltr');
      p.style.marginLeft  = '0';
      p.style.marginRight = 'auto';
    });

    // Sequência estrita com abort
    for (const p of seq) {
      if (myAbort.cancelled() || !isSenhaAtiva(root)) break;
      const text = await typeOnce(p, myAbort);
      if (myAbort.cancelled() || !isSenhaAtiva(root)) break;
      if (text && !p.dataset.spoken) {
        await speakOnce(text, myAbort);
        if (myAbort.cancelled() || !isSenhaAtiva(root)) break;
        p.dataset.spoken = 'true';
      }
      const t0 = Date.now();
      while (!myAbort.cancelled() && isSenhaAtiva(root) && (Date.now() - t0) < PAUSE_BETWEEN_P) {
        await sleep(15);
      }
    }

    window.JCSenha.state.running = false;
    if (!myAbort.cancelled()) window.JCSenha.state.startedOnce = true;
  }

  function armObserver(root) {
    try {
      if (window.JCSenha.state.observer) window.JCSenha.state.observer.disconnect();
      const obs = new MutationObserver(() => {
        const active = isSenhaAtiva(root);
        if (!active) { window.JCSenha.state.abortId++; return; }
        if (!window.JCSenha.state.running) runSequence(root);
      });
      obs.observe(root, { childList: true, subtree: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  function bindControls(root) {
    const { input, toggle, next, prev } = pick(root);

    // Habilita botões imediatamente
    prev?.removeAttribute('disabled');
    next?.removeAttribute('disabled');

    // Olho mágico
    if (toggle && !toggle.__senhaBound) {
      toggle.addEventListener('click', () => {
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      toggle.__senhaBound = true;
    }

    // Navegação (mantive sua lógica padrão)
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

  function tryKick() {
    const root = qs(sel.root);
    if (!root) return false;

    // Assegura visibilidade estrutural
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    if (!isSenhaAtiva(root)) {
      window.JCSenha.state.abortId++;
      return false;
    }

    bindControls(root);
    armObserver(root);
    runSequence(root);
    return true;
  }

  function startProbeLoop() {
    const t0 = Date.now();
    clearInterval(window.JCSenha.state.probeTimer);
    window.JCSenha.state.probeTimer = setInterval(() => {
      const elapsed = Date.now() - t0;
      if (tryKick() || elapsed > PROBE_MAX_MS) {
        clearInterval(window.JCSenha.state.probeTimer);
      }
    }, PROBE_MS);
  }

  // Expor kick
  window.JCSenha.__kick = tryKick;

  // 1) Evento oficial
  document.addEventListener('section:shown', (evt) => {
    const id = evt?.detail?.sectionId;
    if (!id) return;
    if (id === 'section-senha') {
      window.JCSenha.state.abortId++; // cancela qualquer execução antiga
      tryKick() || startProbeLoop();
    } else {
      window.JCSenha.state.abortId++; // outra seção: aborta
    }
  });

  // 2) “Chute” imediato + rAF + probe curto (para iniciar bem rápido)
  tryKick();
  requestAnimationFrame(tryKick);
  if (!tryKick()) startProbeLoop();

})();
