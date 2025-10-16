;(() => {
  'use strict';

  // Namespace isolado da seção
  window.JCIntro = window.JCIntro || {};
  if (window.JCIntro.__bound) {
    console.log('[JCIntro] Já inicializado, ignorando...');
    return;
  }
  window.JCIntro.__bound = true;

  window.JCIntro.state = {
    INTRO_READY: false,
    LISTENER_ADDED: false,
  };

  // Utilitários
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => { el.removeEventListener(ev, h); fn(e); };
    el.addEventListener(ev, h);
  };

  const waitForElement = (selector, { within = document, timeout = 10000, step = 50 } = {}) => {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          const wrap = document.getElementById('jornada-content-wrapper');
          if (wrap) el = wrap.querySelector(selector);
        }
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) return reject(new Error(`timeout waiting ${selector}`));
        setTimeout(tick, step);
      };
      tick();
    });
  };

  const getText = (el) => (el?.dataset?.text ?? el?.textContent ?? '').trim();

  const fromDetail = (detail = {}) => {
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    const node = detail.node || detail.root || null;
    return { sectionId, node };
  };

  // Handler principal
  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail || {});
    if (sectionId !== 'section-intro') return;

    if (window.JCIntro.state.INTRO_READY || (node && node.dataset.introInitialized)) {
      console.log('[JCIntro] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForElement('#section-intro', {
          within: document.getElementById('jornada-content-wrapper') || document,
          timeout: 15000,
        });
      } catch (e) {
        console.warn('[JCIntro] #section-intro não encontrado, criando fallback');
        const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
        root = document.createElement('section');
        root.id = 'section-intro';
        wrapper.appendChild(root);
      }
    }

    root.dataset.introInitialized = 'true';
    root.classList.add('section-intro', 'intro-sandbox');
    root.style.display = 'block';
    root.style.opacity = '1';
    root.style.visibility = 'visible';

    // Busca elementos
    let p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn;
    try {
      p1_1 = await waitForElement('#intro-p1-1', { within: root });
      p1_2 = await waitForElement('#intro-p1-2', { within: root });
      p1_3 = await waitForElement('#intro-p1-3', { within: root });
      p2_1 = await waitForElement('#intro-p2-1', { within: root });
      p2_2 = await waitForElement('#intro-p2-2', { within: root });
      avancarBtn = await waitForElement('#btn-avancar', { within: root });
    } catch (e) {
      console.warn('[JCIntro] Elementos não encontrados, criando placeholders');
      const mk = (id) => { const el = document.createElement('div'); el.id = id; el.dataset.typing = 'true'; el.textContent = `Placeholder para ${id}`; root.appendChild(el); return el; };
      p1_1 = p1_1 || mk('intro-p1-1');
      p1_2 = p1_2 || mk('intro-p1-2');
      p1_3 = p1_3 || mk('intro-p1-3');
      p2_1 = p2_1 || mk('intro-p2-1');
      p2_2 = p2_2 || mk('intro-p2-2');
      if (!avancarBtn) {
        avancarBtn = document.createElement('button');
        avancarBtn.id = 'btn-avancar';
        avancarBtn.textContent = 'Iniciar';
        root.appendChild(avancarBtn);
      }
    }

    // Estado inicial dos textos
    [p1_1, p1_2, p1_3, p2_1, p2_2].forEach((el) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.display = 'none';
    });

    // Botão
    if (avancarBtn) {
      avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
      avancarBtn.disabled = true;
      avancarBtn.style.opacity = '0.5';
      avancarBtn.style.cursor = 'not-allowed';
      avancarBtn.style.display = 'inline-block';
      avancarBtn.style.margin = '8px auto';
      avancarBtn.style.visibility = 'visible';
      if (!avancarBtn.textContent) avancarBtn.textContent = 'Iniciar';
    }

    // Clique avançar: usa JC.show se existir; senão, evento neutro; por fim, fallback de URL
    once(avancarBtn, 'click', () => {
      console.log('[JCIntro] Avançar clicado → section-termos');
      if (window.JC && typeof window.JC.show === 'function') {
        window.JC.show('section-termos');
      } else {
        document.dispatchEvent(new CustomEvent('section:navigate', { detail: { to: 'section-termos', from: 'section-intro' } }));
        setTimeout(() => {
          const termos = document.getElementById('section-termos');
          if (!termos) {
            window.location.href = '/termos';
            console.warn('[JCIntro] Fallback: /termos');
          }
        }, 300);
      }
    });

    // Datilografia segura
    const runTypingChain = async () => {
      window.G = window.G || {};
      const locked = (window.G.__typingLock === true) || (window.__typingLock === true);
      if (locked) {
        await new Promise((resolve) => {
          const chk = () => {
            const free = !(window.G.__typingLock === true) && !(window.__typingLock === true);
            if (free) resolve(); else setTimeout(chk, 80);
          };
          chk();
        });
      }

      const list = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      if (!list.length) {
        if (avancarBtn) { avancarBtn.disabled = false; avancarBtn.style.opacity = '1'; avancarBtn.style.cursor = 'pointer'; }
        return;
      }

      if (typeof window.runTyping !== 'function') {
        window.runTyping = (el, text, done, opts) => {
          let i = 0; const speed = Number(opts?.speed || 50);
          const go = () => { if (i < text.length) { el.textContent += text[i++]; setTimeout(go, speed); } else { el.textContent = text; done(); } };
          go();
        };
      }

      for (const el of list) {
        const text = getText(el);
        el.textContent = '';
        el.classList.add('typing-active', 'lumen-typing');
        el.style.display = 'block';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';

        await new Promise((resolve) => window.runTyping(el, text, resolve, {
          speed: Number(el.dataset.speed || 50),
          cursor: String(el.dataset.cursor || 'true') === 'true',
        }));

        el.classList.add('typing-done');
        el.classList.remove('typing-active');
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'block';

        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
          await new Promise((r) => setTimeout(r, text.length * 25));
        }

        await new Promise((r) => setTimeout(r, 250));
      }

      if (avancarBtn) { avancarBtn.disabled = false; avancarBtn.style.opacity = '1'; avancarBtn.style.cursor = 'pointer'; }
    };

    try {
      window.JCIntro.state.INTRO_READY = false;
      await runTypingChain();
      window.JCIntro.state.INTRO_READY = true;
      console.log('[JCIntro] Intro pronta');
    } catch (err) {
      console.error('[JCIntro] Erro datilografia:', err);
      root.querySelectorAll('[data-typing="true"]').forEach((el) => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'block';
      });
      if (avancarBtn) { avancarBtn.disabled = false; avancarBtn.style.opacity = '1'; avancarBtn.style.cursor = 'pointer'; }
    }
  }; // ← fecha handler

  // Destroy
  window.JCIntro.destroy = () => {
    console.log('[JCIntro] Destroy');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    const root = document.getElementById('section-intro');
    if (root) {
      delete root.dataset.introInitialized;
      root.querySelectorAll('[data-typing="true"]').forEach((el) => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCIntro.state.INTRO_READY = false;
    window.JCIntro.state.LISTENER_ADDED = false;
    window.G = window.G || {};
    window.G.__typingLock = false;
    if (typeof window.EffectCoordinator?.stopAll === 'function') window.EffectCoordinator.stopAll();
  };

  // Listeners estáveis
  if (!window.JCIntro.state.LISTENER_ADDED) {
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    window.JCIntro.state.LISTENER_ADDED = true;
  }

  // Bind inicial
  const bind = () => {
    queueMicrotask(() => {
      const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
      if (visibleIntro && !visibleIntro.dataset.introInitialized) {
        handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})(); // ← fecha IIFE corretamente
