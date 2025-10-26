<script>
(function () {
  'use strict';

  const MOD = 'section-guia.js';
  const SECTION_ID = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const VIDEO_SRC = '/assets/video/filme-eu-na-irmandade.mp4';
  const HIDE_CLASS = 'hidden';

  // Timings
  const TYPING_SPEED = 36;
  const INITIAL_DELAY_MS = 200;   // antes de começar a datilografia
  const TTS_LATCH_MS   = 600;     // “janela” pra TTS marcar como falado

  // ===== Evita rebind =====
  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] já carregado');
    return;
  }
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerOn: false
  };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q = (sel, root = document) => root.querySelector(sel);

  async function waitForElement(selector, { within = document, timeout = 6000, step = 100 } = {}) {
    const t0 = performance.now();
    return new Promise((resolve, reject) => {
      const loop = () => {
        const el = within.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - t0 >= timeout) return reject(new Error(`Timeout: ${selector}`));
        setTimeout(loop, step);
      };
      loop();
    });
  }

  const ensureVisible = (el) => {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
    el.style.zIndex = 'auto';
  };

  function normalizeParagraph(el) {
    if (!el) return false;
    const current = (el.textContent || '').trim();
    const ds = (el.dataset?.text || '').trim();
    const source = ds || current;
    if (!source) return false;
    el.dataset.text = source;           // garante fonte no data-text
    if (!el.classList.contains('typing-done')) {
      el.textContent = '';
      el.classList.remove('typing-active', 'typing-done');
      delete el.dataset.spoken;
    }
    return true;
  }

  async function localType(el, text, speed = TYPING_SPEED) {
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

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || el.textContent || '').trim();
    if (!text) return;

    // trava de digitação compatível com seu ecossistema
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
        } catch (e) {
          console.warn('[JCSenha] runTyping falhou, fallback local', e);
          usedFallback = true;
          resolve();
        }
      });
    } else {
      usedFallback = true;
    }

    if (usedFallback) await localType(el, text, speed);

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    window.G.__typingLock = prevLock;

    if (speak && text && !el.dataset.spoken) {
      try {
        if (window.EffectCoordinator?.speak) {
          speechSynthesis.cancel();
          window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.08, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch (e) {
        console.error('[JCSenha] Erro no TTS:', e);
      }
    }
    await sleep(80);
  }

  const playTransitionVideo = (nextId) => {
    console.log('[JCSenha] transição vídeo →', VIDEO_SRC);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, nextId);
    } else if (window.JC?.show) {
      window.JC.show(nextId);
    } else {
      location.hash = `#${nextId}`;
    }
  };

  // ===== Core =====
  function pick(root) {
    return {
      root,
      instr1: q('#senha-instr1', root),
      instr2: q('#senha-instr2', root),
      instr3: q('#senha-instr3', root),
      instr4: q('#senha-instr4', root),
      input:  q('#senha-input', root),
      toggle: q('.btn-toggle-senha', root),
      btnPrev: q('#btn-senha-prev', root),
      btnNext: q('#btn-senha-avancar', root),
      errorMsg: q('#senha-error', root) // opcional
    };
  }

  function setDisabled(el, v) {
    if (!el) return;
    if (v) el.setAttribute('disabled', 'true'); else el.removeAttribute('disabled');
    if (el.classList) el.classList.toggle('is-disabled', !!v);
  }

  function saveSenha(value) {
    try {
      if (window.JC?.data) {
        window.JC.data.senha = value;
      } else {
        window.JCData = window.JCData || {};
        window.JCData.senha = value;
      }
    } catch {}
  }

  async function initOnce(root) {
    if (!root || root.dataset.senhaInitialized === 'true') return;
    root.dataset.senhaInitialized = 'true';
    ensureVisible(root);

    // Aguarda elementos mínimos
    let instr1, instr2, instr3, instr4, input, toggle, btnPrev, btnNext;
    try {
      instr1 = await waitForElement('#senha-instr1', { within: root });
      instr2 = await waitForElement('#senha-instr2', { within: root });
      instr3 = await waitForElement('#senha-instr3', { within: root });
      instr4 = await waitForElement('#senha-instr4', { within: root });
      input  = await waitForElement('#senha-input', { within: root });
      toggle = await waitForElement('.btn-toggle-senha', { within: root });
      btnNext= await waitForElement('#btn-senha-avancar', { within: root });
      btnPrev= await waitForElement('#btn-senha-prev', { within: root });
    } catch (e) {
      console.error('[JCSenha] Elementos não encontrados:', e);
      window.toast?.('Erro: elementos da seção Senha não carregados.', 'error');
      return;
    }

    const els = { instr1, instr2, instr3, instr4, input, toggle, btnPrev, btnNext };

    // Desabilita controles durante a narrativa
    setDisabled(btnPrev, true);
    setDisabled(btnNext, true);
    setDisabled(input,  true);
    setDisabled(toggle, true);

    // Normaliza blocos de texto e ordena por posição visual
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);
    seq.forEach(normalizeParagraph);

    await sleep(INITIAL_DELAY_MS);

    // Datilografia sequencial com TTS
    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true });
      }
    }

    // Habilita interação
    setDisabled(input, false);
    setDisabled(toggle, false);
    setDisabled(btnPrev, false);
    setDisabled(btnNext, false);
    input.focus();

    // Olho mágico
    toggle.addEventListener('click', () => {
      const was = input.type;
      input.type = input.type === 'password' ? 'text' : 'password';
      console.log('[JCSenha] Olho mágico:', was, '→', input.type);
    });

    // Voltar
    btnPrev.addEventListener('click', () => {
      if (window.JC?.show) window.JC.show(PREV_SECTION_ID);
      else history.back();
    });

    // Avançar (valida e segue)
    btnNext.addEventListener('click', () => {
      const value = (input.value || '').trim();
      if (!value) {
        window.toast?.('Por favor, digite sua senha para continuar.', 'warning');
        input.focus();
        return;
      }
      // (Opcional) regras mínimas – descomente se quiser
      // if (value.length < 4) { window.toast?.('Use pelo menos 4 caracteres.', 'warning'); return; }

      saveSenha(value);
      // segurança visual
      input.type = 'password';
      setDisabled(btnNext, true);
      setDisabled(input, true);
      setDisabled(toggle, true);

      playTransitionVideo(NEXT_SECTION_ID);
    });

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] pronto');
  }

  // ===== Eventos =====
  const onSectionShown = (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    const root = node || document.getElementById(SECTION_ID);
    initOnce(root);
  };

  const bind = () => {
    if (!window.JCSenha.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true }); // persistente
      window.JCSenha.state.listenerOn = true;
    }
    // Se já visível, inicializa imediatamente
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) {
      initOnce(now);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

})();
</script>
