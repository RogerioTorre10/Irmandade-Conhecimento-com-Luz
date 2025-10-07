// jornada-intro.js (completo, patch idempotente e root-scoped)
(() => {
  // Evita múltiplos bindings se o script for avaliado mais de uma vez
  if (window.__introBound) return;
  window.__introBound = true;

  // ===== Helpers =====
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => { el.removeEventListener(ev, h); fn(e); };
    el.addEventListener(ev, h);
  };

 async function waitForEl(selector, { within = document, timeout = 8000, step = 100 } = {}) {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const el = within.querySelector(selector);
      console.log(`[waitForEl] Buscando ${selector}, tempo: ${performance.now() - start}ms`);
      if (el) return resolve(el);
      if (performance.now() - start >= timeout) {
        console.error(`[waitForEl] Timeout após ${timeout}ms para ${selector}`);
        return reject(new Error(`timeout waiting ${selector}`));
      }
      setTimeout(tick, step);
    };
    tick();
  });
}
  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // ===== Handler principal (assíncrono) =====
 const handler = async (e) => {
  console.log('[jornada-intro.js] Evento recebido:', e?.detail);
  const id = e?.detail?.sectionId || e?.detail?.id;
  if (id !== 'section-intro') return;

  console.log('[jornada-intro.js] Ativando intro');

  let root = e?.detail?.root || document.getElementById('section-intro');
  if (!root) {
    try {
      root = await waitForEl('#section-intro', { timeout: 8000, step: 100 });
    } catch {
      root = document.querySelector('section.section.bloco-intro, section[data-section="section-intro"]') || null;
    }
  }

  if (!root) {
    console.warn('[jornada-intro.js] Root da intro não encontrado (após espera)');
    window.toast?.('Intro ainda não montou no DOM. Verifique a ordem do evento.', 'warn');
    return;
  }

  const el1 = root.querySelector('#intro-p1');
  const el2 = root.querySelector('#intro-p2');
  const btn = root.querySelector('#btn-avancar');
  console.log('[jornada-intro.js] Elementos encontrados:', { el1, el2, btn });

  if (!(el1 && el2 && btn)) {
    console.warn('[jornada-intro.js] Elementos não encontrados', { el1, el2, btn });
    return;
  }

  btn.classList.add('hidden');
  btn.classList.add('hidd');
  const showBtn = () => {
    console.log('[jornada-intro.js] Mostrando botão');
    btn.classList.remove('hidden');
    btn.classList.remove('hidd');
  };

  const speed1 = Number(el1.dataset.speed || 36);
  const speed2 = Number(el2.dataset.speed || 36);
  const t1 = getText(el1);
  const t2 = getText(el2);
  const cursor1 = String(el1.dataset.cursor || 'true') === 'true';
  const cursor2 = String(el2.dataset.cursor || 'true') === 'true';

  console.log('[jornada-intro.js] Parâmetros de typing:', { t1, t2, speed1, speed2, cursor1, cursor2 });

  window.EffectCoordinator?.stopAll?.();

    // ===== Cadeia de datilografia + TTS =====
    const runTypingChain = async () => {
    if (typeof window.runTyping === 'function') {
      console.log('[jornada-intro.js] Usando runTyping');
      window.runTyping(el1, t1, () => {
        console.log('[jornada-intro.js] Typing concluído para intro-p1');
        window.runTyping(el2, t2, () => {
          console.log('[jornada-intro.js] Typing concluído para intro-p2');
          showBtn();
        }, { speed: speed2, cursor: cursor2 });
      }, { speed: speed1, cursor: cursor1 });
      window.EffectCoordinator?.speak?.(t1, { rate: 1.06 });
      setTimeout(() => window.EffectCoordinator?.speak?.(t2, { rate: 1.05 }), Math.max(1000, t1.length * speed1 * 0.75));
      return;
    }
   };
        // TTS fluido (texto inteiro)
        window.EffectCoordinator?.speak?.(t1, { rate: 1.06 });
        setTimeout(() => window.EffectCoordinator?.speak?.(t2, { rate: 1.05 }),
          Math.max(1000, t1.length * speed1 * 0.75));
        return;
      }

      // Fallback moderno: EffectCoordinator
      if (window.EffectCoordinator?.type) {
        await window.EffectCoordinator.type(el1, t1, { speed: speed1, cursor: cursor1 });
        window.EffectCoordinator?.speak?.(t1, { rate: 1.06 });

        await window.EffectCoordinator.type(el2, t2, { speed: speed2, cursor: cursor2 });
        window.EffectCoordinator?.speak?.(t2, { rate: 1.05 });

        showBtn();
        return;
      }

      // Último fallback (sem efeitos)
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
    };

    try {
    await runTypingChain();
  } catch (err) {
    console.warn('[jornada-intro.js] Typing chain falhou', err);
    el1.textContent = t1;
    el2.textContent = t2;
    showBtn();
  }

    // ===== Navegação =====
    const goNext = () => {
      if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) return;
      if (window.JC?.goNext) {
        window.JC.goNext('section-senha');
      } else {
        window.showSection?.('section-senha');
      }
    };

    // Evita múltiplos listeners no botão (rebind limpo)
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);
    once(freshBtn, 'click', goNext);
  };

  // ===== Binding dos eventos do loader =====
  const bind = () => {
    // Mantém compatibilidade com ambos formatos de evento
    document.addEventListener('sectionLoaded', handler);
    document.addEventListener('section:shown', handler);
    console.log('[jornada-intro.js] Handler ligado');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
