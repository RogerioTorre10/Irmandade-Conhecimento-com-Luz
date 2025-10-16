;(() => {
  'use strict';

  // Namespace isolado da seção
  window.JCIntro = window.JCIntro || {};

  // Evita dupla inicialização do arquivo inteiro
  if (window.JCIntro.__bound) {
    console.log('[JCIntro] Já inicializado, ignorando...');
    return;
  }
  window.JCIntro.__bound = true;

  // Estado local da seção
  window.JCIntro.state = {
    INTRO_READY: false,
    LISTENER_ADDED: false,
  };

  // ============================
  // Utilitários básicos
  // ============================
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => { el.removeEventListener(ev, h); fn(e); };
    el.addEventListener(ev, h);
  };

  const waitForElement = (selector, { within = document, timeout = 10000, step = 50 } = {}) => {
    console.log('[JCIntro] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          const wrap = document.getElementById('jornada-content-wrapper');
          if (wrap) el = wrap.querySelector(selector);
        }
        if (el) {
          console.log('[JCIntro] Elemento encontrado:', selector);
          return resolve(el);
        }
        if (performance.now() - start >= timeout) {
          console.error('[JCIntro] Timeout aguardando:', selector);
          return reject(new Error(`timeout waiting ${selector}`));
        }
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

  // ============================
  // Datilografia + TTS (sincronizados)
  // ============================
  function typeParagraph(el, fullText, opts = {}) {
    const speed = Number(opts.speed || el.dataset.speed || 70); // ~humano (55–70ms)
    const withCursor = String(el.dataset.cursor || 'true') === 'true';
    const speakTogether = true;        // true = TTS acompanha a digitação; false = TTS só depois
    const startTTSAtRatio = 0.18;      // inicia TTS quando ~18% já foi digitado

    // Guarda global de TTS para não repetir leitura
    window.__JC_SpeakGuard = window.__JC_SpeakGuard || new Set();

    // Cursor "blink" simples (opcional)
    let cursorTimer = null;
    const toggleCursor = () => {
      if (!withCursor) return;
      el.classList.toggle('typing-cursor');
    };

    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';
      el.classList.add('typing-active', 'lumen-typing');
      el.style.display = 'block';
      el.style.visibility = 'hidden';
      el.style.opacity = '0';

      if (withCursor) cursorTimer = setInterval(toggleCursor, 450);

      let spoke = false;
      const maybeStartSpeak = () => {
        if (spoke || !speakTogether) return;
        const ratio = fullText.length ? i / fullText.length : 1;
        if (ratio >= startTTSAtRatio) {
          // Evita sobreposição com parágrafo anterior
          if (typeof window.EffectCoordinator?.stopAll === 'function') {
            window.EffectCoordinator.stopAll();
          }
          const guardKey = `intro:${el.id}`;
          if (!window.__JC_SpeakGuard.has(guardKey)) {
            window.__JC_SpeakGuard.add(guardKey);
            if (typeof window.EffectCoordinator?.speak === 'function') {
              window.EffectCoordinator.speak(fullText, { rate: 1.05, pitch: 1.0 });
            }
          }
          spoke = true;
        }
      };

      const tick = () => {
        if (i < fullText.length) {
          el.textContent += fullText.charAt(i++);
          if ((i & 1) === 0) maybeStartSpeak(); // checa a cada 2 chars
          setTimeout(tick, speed);
        } else {
          // Flush final para garantir texto completo
          el.textContent = fullText;

          // Se preferir TTS só após digitar tudo (speakTogether=false), fala aqui uma única vez
          if (!speakTogether) {
            if (typeof window.EffectCoordinator?.stopAll === 'function') {
              window.EffectCoordinator.stopAll();
            }
            const guardKey = `intro:${el.id}`;
            if (!window.__JC_SpeakGuard.has(guardKey)) {
              window.__JC_SpeakGuard.add(guardKey);
              if (typeof window.EffectCoordinator?.speak === 'function') {
                window.EffectCoordinator.speak(fullText, { rate: 1.05, pitch: 1.0 });
              }
            }
          }

          if (cursorTimer) clearInterval(cursorTimer);
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
          el.classList.remove('typing-cursor');
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.display = 'block';
          resolve();
        }
      };

      tick();
    });
  }

  const runTypingChain = async () => {
    console.log('[JCIntro] runTypingChain (sequencial + TTS único)');
    // Normaliza lock global
    window.G = window.G || {};
    const locked = (window.G.__typingLock === true) || (window.__typingLock === true);
    if (locked) {
      console.log('[JCIntro] Aguardando liberação de __typingLock...');
      await new Promise((resolve) => {
        const chk = () => {
          const free = !(window.G.__typingLock === true) && !(window.__typingLock === true);
          if (free) resolve(); else setTimeout(chk, 80);
        };
        chk();
      });
    }

    const root = document.getElementById('section-intro');
    const list = root ? root.querySelectorAll('[data-typing="true"]:not(.typing-done)') : [];
    if (!list || !list.length) {
      console.warn('[JCIntro] Nenhum elemento com data-typing="true"');
      const btn = root?.querySelector('#btn-avancar');
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
      return;
    }

    // Orquestração: um parágrafo por vez
    for (const el of list) {
      const text = getText(el);
      try {
        await typeParagraph(el, text, { speed: el.dataset.speed });
      } catch (err) {
        console.error('[JCIntro] Erro na datilografia:', el?.id, err);
        // Fallback: entrega o texto completo
        el.textContent = text;
        el.classList.add('typing-done');
        el.classList.remove('typing-active');
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'block';
      }
      // Pequena pausa entre parágrafos
      await new Promise((r) => setTimeout(r, 320));
    }

    // Tudo concluído → libera botão
    const avancarBtn = root?.querySelector('#btn-avancar');
    if (avancarBtn) {
      avancarBtn.disabled = false;
      avancarBtn.style.opacity = '1';
      avancarBtn.style.cursor = 'pointer';
    }
  };

  // ============================
  // Handler principal da seção
  // ============================
  const handler = async (evt) => {
    console.log('[JCIntro] Handler disparado:', evt?.detail);
    const { sectionId, node } = fromDetail(evt?.detail || {});
    if (sectionId !== 'section-intro') return;

    // Já inicializado?
    if (window.JCIntro.state.INTRO_READY || (node && node.dataset.introInitialized)) {
      console.log('[JCIntro] Já inicializado, ignorando...');
      return;
    }

    // Root da seção
    let root = node || document.getElementById('section-intro');
    if (!root) {
      console.log('[JCIntro] Tentando localizar #section-intro...');
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

    // Marca como inicializado e aplica classe de sandbox (CSS isolado)
    root.dataset.introInitialized = 'true';
    root.classList.add('section-intro', 'intro-sandbox');

    // Visibilidade essencial (aparência vem do CSS dedicado)
    root.style.display = 'block';
    root.style.opacity = '1';
    root.style.visibility = 'visible';

    // Busca elementos esperados
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

    // Estado inicial dos parágrafos (invisíveis até tipar)
    ;[p1_1, p1_2, p1_3, p2_1, p2_2].forEach((el) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.display = 'none';
      // Garanta atributo para seleção
      if (!el.hasAttribute('data-typing')) el.setAttribute('data-typing', 'true');
    });

    // Botão Avançar (inicialmente travado)
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

    // Navegação segura e desacoplada
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

    // Rodar datilografia
    window.JCIntro.state.INTRO_READY = false;
    try {
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

  // ============================
  // Destroy (idempotente)
  // ============================
  window.JCIntro.destroy = () => {
    console.log('[JCIntro] Destroy intro');
    document.removeEventListener('sectionLoaded', handler, { passive: true });
    document.removeEventListener('section:shown', handler, { passive: true });

    const root = document.getElementById('section-intro');
    if (root) {
      delete root.dataset.introInitialized;
      root.querySelectorAll('[data-typing="true"]').forEach((el) => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing', 'typing-cursor');
      });
    }

    window.JCIntro.state.INTRO_READY = false;
    window.JCIntro.state.LISTENER_ADDED = false;

    window.G = window.G || {};
    window.G.__typingLock = false;

    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  // ============================
  // Listeners estáveis (document-level)
  // ============================
  if (!window.JCIntro.state.LISTENER_ADDED) {
    console.log('[JCIntro] Registrando listeners (sectionLoaded/section:shown)');
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true }); // alias opcional
    window.JCIntro.state.LISTENER_ADDED = true;
  }

  // ============================
  // Bind inicial sem "tempo mágico"
  // ============================
  const bind = () => {
    console.log('[JCIntro] Bind inicial');
    queueMicrotask(() => {
      const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
      if (visibleIntro && !visibleIntro.dataset.introInitialized) {
        console.log('[JCIntro] Intro visível no carregamento → handler');
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
