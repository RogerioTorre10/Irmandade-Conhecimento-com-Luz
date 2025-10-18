// section-senha.js — 18/out (patch Lumen v4)
// - Mute TTS e normalização ANTES de qualquer leitura
// - Digitação LTR e alinhada à esquerda (evita crescer a partir do centro)
// - Velocidade ajustável (DEFAULT_TYPING_MS)
// - Espera TTS de cada parágrafo terminar antes do próximo
// - Observa reinjeções e re-aplica datilografia sem duplicar leituras

(function () {
  'use strict';

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }

  // ========= Config =========
  const DEFAULT_TYPING_MS = 55;      // ms por caractere (ajuste fino aqui)
  const MIN_PAUSE_BETWEEN_P = 120;   // respiro entre parágrafos
  const EST_WPM = 155;               // fallback de TTS ~155 palavras/min
  const EST_CHARS_PER_SEC = 13;      // fallback alternativo (~13 cps)

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    typingInProgress: false,
    observer: null
  };

  // -------- Utils ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function estimateSpeakMs(text) {
    const t = (text || '').trim();
    if (!t) return 300;
    const words = t.split(/\s+/).length;
    const byWpm = (words / EST_WPM) * 60_000;          // ms
    const byCps = (t.length / EST_CHARS_PER_SEC) * 1e3;
    // pega o MAIOR para não cortar leitura curta
    return Math.max(byWpm, byCps, 700);
  }

  async function speakOnce(text) {
    if (!text) return;
    try {
      if (window.EffectCoordinator?.speak) {
        const ret = window.EffectCoordinator.speak(text);
        if (ret && typeof ret.then === 'function') {
          // seu speak retorna Promise → aguardamos o término real
          await ret;
          return;
        }
      }
    } catch {}
    // fallback: estimar duração
    await sleep(estimateSpeakMs(text));
  }

  // texto base SEMPRE vem de data-text; se não existir, extrai de textContent
  function ensureDataText(el) {
    if (!el) return false;
    const ds = el.dataset?.text?.trim();
    const tc = (el.textContent || '').trim();
    const source = ds || tc;
    if (!source) return false;
    el.dataset.text = source;  // mantém como fonte
    return true;
  }

  function prepareForTyping(el) {
    if (!el) return false;
    // guarda estado visual para restaurar depois
    if (!('prevAlign' in el.dataset)) el.dataset.prevAlign = el.style.textAlign || '';
    if (!('prevDir' in el.dataset))   el.dataset.prevDir   = el.getAttribute('dir') || '';

    // força LTR + alinhado à esquerda para crescer “da esquerda → direita”
    el.style.textAlign = 'left';
    el.setAttribute('dir', 'ltr');

    // limpa conteúdo visível para digitar
    el.textContent = '';
    el.classList.remove('typing-done');
    el.classList.add('typing-active');
    delete el.dataset.spoken;
    return true;
  }

  function restoreAfterTyping(el) {
    if (!el) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    // restaura estilo visual original
    el.style.textAlign = el.dataset.prevAlign || '';
    if (el.dataset.prevDir) el.setAttribute('dir', el.dataset.prevDir); else el.removeAttribute('dir');
  }

  // Fallback local (se TypingBridge ausente)
  async function localType(el, text, speed = DEFAULT_TYPING_MS) {
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

  async function typeOnce(el, { speed = DEFAULT_TYPING_MS } = {}) {
    if (!el) return '';
    const text = (el.dataset?.text || '').trim();
    if (!text) return '';

    // trava TTS global
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    prepareForTyping(el);

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

    restoreAfterTyping(el);
    // libera lock de TTS (agora podemos falar este parágrafo)
    window.G.__typingLock = prevLock;

    return text;
  }

  async function waitForTypingBridge(maxMs = 2500) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    return true;
  }

  function els(root) {
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

  async function runSequence(root) {
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev } = els(root);
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);

    // Desliga botões durante a sequência
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    // MUTE GERAL DE TTS ANTES DE QUALQUER COISA
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    // Normaliza fonte dos textos ANTES de qualquer leitor varrer
    seq.forEach((p) => {
      if (ensureDataText(p)) {
        // se houver texto visível, limpa já para evitar leitura precoce
        if ((p.textContent || '').trim()) p.textContent = '';
      }
    });

    // Pronto, agora tornamos visível sem risco de leitura fora de hora
    await waitForTypingBridge();

    // Sequência: digita → fala → pausa → próximo
    for (const p of seq) {
      if (!p) continue;

      // se já estava pronto (ex: reabertura), respeita spoken
      if (!p.classList.contains('typing-done')) {
        const text = await typeOnce(p, { speed: DEFAULT_TYPING_MS });
        if (text && !p.dataset.spoken) {
          await speakOnce(text);
          p.dataset.spoken = 'true';
        }
      } else {
        // já digitado; se nunca falou, fala e marca
        const text = (p.dataset?.text || p.textContent || '').trim();
        if (text && !p.dataset.spoken) {
          await speakOnce(text);
          p.dataset.spoken = 'true';
        }
      }
      await sleep(MIN_PAUSE_BETWEEN_P);
    }

    // Libera TTS global ao final da sequência completa
    window.G.__typingLock = prevLock;

    // Habilita navegação e foca input
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
        let need = false;
        for (const m of mutations) {
          if (m.type === 'childList' || m.addedNodes?.length) { need = true; break; }
        }
        if (need && !window.JCSenha.state.typingInProgress) {
          const { instr1, instr2, instr3, instr4 } = els(root);
          [instr1, instr2, instr3, instr4].filter(Boolean).forEach((p) => {
            if (ensureDataText(p)) {
              if ((p.textContent || '').trim() && !p.classList.contains('typing-done')) {
                p.textContent = '';
              }
            }
          });
          runSequence(root);
        }
      });
      obs.observe(root, { childList: true, subtree: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  const onShown = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root) return;

    // Blindagem visual leve
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    const { input, toggle, btnNext, btnPrev, instr1, instr2, instr3, instr4 } = els(root);

    // Botões travados inicialmente
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    // Olho mágico
    toggle?.addEventListener('click', () => {
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Navegação
    btnPrev?.addEventListener('click', () => {
      try { window.JC?.show('section-termos'); } catch {}
    });

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

    // Antes de qualquer coisa, garantir que NENHUM texto esteja visível
    [instr1, instr2, instr3, instr4].filter(Boolean).forEach((p) => {
      if (ensureDataText(p)) p.textContent = '';
    });

    armObserver(root);

    if (root.dataset.senhaInitialized === 'true') {
      runSequence(root);
      return;
    }

    root.dataset.senhaInitialized = 'true';
    runSequence(root);

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada (v4).');
  };

  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', onShown);
    window.JCSenha.state.listenerAdded = true;
  }
})();
