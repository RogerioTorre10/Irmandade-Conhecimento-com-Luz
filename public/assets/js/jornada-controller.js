(function () {
  'use strict';

  window.JC = window.JC || {};
  const existingJC = { ...window.JC };

  window.__JC_TYPED_ONCE = window.__JC_TYPED_ONCE || {};
  window.__JC_IS_TYPING = window.__JC_IS_TYPING || false;

  const sectionOrder = [
    'section-intro',
    'section-termos1',
    'section-termos2',
    'section-senha',
    'section-guia',
    'section-selfie',
    'section-card',
    'section-dados-pessoais',
    'section-perguntas-raizes',
    'section-perguntas-reflexoes',
    'section-perguntas-crescimento',
    'section-perguntas-integracao',
    'section-perguntas-sintese',
    'section-final'
  ];

  let lastShownSection = null;
  let isTransitioning = false;
  let isInitializing = false;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getText(el) {
    if (!el) return '';
    const currentText = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (currentText) return currentText;

    return String(
      el.dataset?.fullText ||
      el.dataset?.text ||
      el.getAttribute?.('data-text') ||
      el.getAttribute?.('data-i18n-original') ||
      ''
    ).replace(/\s+/g, ' ').trim();
  }

  function isIntroLike(sectionId) {
    return ['section-intro', 'section-termos1', 'section-termos2'].includes(sectionId);
  }

  function getTypingNodes(root) {
    if (!root) return [];
    return Array.from(
      root.querySelectorAll('[data-typing="true"], .intro-title, .typing-text, .parchment-text-rough')
    ).filter(Boolean);
  }

  function cacheOriginalTypingText(root) {
    if (!root) return;
    getTypingNodes(root).forEach((el) => {
      const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      const dataText = String(el.dataset?.text || '').replace(/\s+/g, ' ').trim();
      const full = txt || dataText;
      if (full) {
        el.dataset.fullText = full;
        el.dataset.text = full;
      }
    });
  }

  function resetTypingState(root) {
    if (!root) return;
    getTypingNodes(root).forEach((el) => {
      const full = el.dataset?.fullText || el.dataset?.text || el.getAttribute?.('data-text') || '';
      el.classList.remove('typing-active', 'typing-done', 'type-done');
      el.removeAttribute('data-cursor');
      el.setAttribute('data-typing', 'true');

      delete el.dataset.typingDone;
      delete el.dataset.typingLastSig;
      delete el.dataset.typingLastAt;
      delete el.dataset.typingSig;

      const caret = el.querySelector?.('.typing-caret');
      if (caret) caret.remove();

      if (full) el.textContent = String(full);
    });
  }

  async function prepareTyping(root) {
    if (!root) return;
    cacheOriginalTypingText(root);

    getTypingNodes(root).forEach((el) => {
      const full = el.dataset?.fullText || el.dataset?.text || el.getAttribute?.('data-text') || '';
      el.classList.remove('typing-active', 'typing-done', 'type-done');
      el.removeAttribute('data-cursor');
      el.setAttribute('data-typing', 'true');

      delete el.dataset.typingDone;
      delete el.dataset.typingSig;
      delete el.dataset.typingLastSig;
      delete el.dataset.typingLastAt;

      el.style.opacity = '0';
      el.style.visibility = 'hidden';

      if (full) el.textContent = full;
    });

    void root.offsetWidth;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function waitForI18nReady(timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.i18n?.waitForReady) {
        try {
          await window.i18n.waitForReady(timeoutMs);
          return true;
        } catch {}
      }
      if (window.i18n?.apply) return true;
      await sleep(80);
    }
    return false;
  }

  async function applyI18nToSection(sectionId, section) {
    if (!section || !window.i18n?.apply) return;
    try {
      await waitForI18nReady(8000);
      window.i18n.apply(section);

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      section.querySelectorAll('[data-typing="true"], .intro-title, .typing-text, .parchment-text-rough')
        .forEach((el) => {
          const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
          if (text) {
            el.dataset.text = text;
            el.dataset.fullText = text;
          }
        });

      console.log('[i18n] Tradução aplicada na seção:', sectionId);
    } catch (err) {
      console.warn('[i18n] Falha ao aplicar em', sectionId, err);
    }
  }

  // Sync guia tema
  (function syncGuiaTema() {
    try {
      const guia = (sessionStorage.getItem('jornada.guia') || '').toLowerCase();
      if (guia) document.body.dataset.guia = guia;
    } catch (e) {
      console.warn('[GUIA THEME] Não consegui ler jornada.guia:', e);
    }
  })();

  async function applyTypingAndTTS(sectionId, root, options = {}) {
    if (!root) return;

    if (window.__LANG_MODAL_OPEN__ || !window.__INTRO_LANG_CONFIRMED__) {
      console.log('[JC.applyTypingAndTTS] Aguardando confirmação do idioma.');
      return;
    }

    if (window.__JC_IS_TYPING && !options.forceReplay) {
      console.log('[JC.applyTypingAndTTS] Typing em andamento, ignorando:', sectionId);
      return;
    }

    console.log('[JC.applyTypingAndTTS] Iniciando para:', sectionId);
    window.__JC_IS_TYPING = true;

    try {
      let attempts = 0;
      while ((!window.runTyping && !window.typeAndSpeak && !window.EffectCoordinator?.speak) && attempts < 80) {
        await sleep(80);
        attempts++;
      }

      await prepareTyping(root);

      const typingElements = root.querySelectorAll('[data-typing="true"]');
      if (!typingElements.length) {
        console.warn('[JC.applyTypingAndTTS] Nenhum [data-typing] em:', sectionId);
        return;
      }

      const sectionNode = root.closest?.('section') || root;
      if (sectionNode) {
        sectionNode.classList.remove('hidden', 'section-hidden');
        sectionNode.setAttribute('aria-hidden', 'false');
        sectionNode.style.display = 'block';
        sectionNode.style.visibility = 'visible';
        sectionNode.style.opacity = '1';
      }

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // === FOR CORRIGIDO AQUI DENTRO ===
        for (const el of typingElements) {
        const text = getText(el);
        if (!text) continue;

        el.dataset.text = text;
        el.textContent = '';

        const elementSpeed = Number(el.dataset.speed || 36);
        const elementCursor = String(el.dataset.cursor || 'true') !== 'false';
        const voiceKind =
          el.dataset.voiceKind ||
          root?.dataset?.voiceKind ||
          (sectionId === 'section-intro' ? 'intro' :
           sectionId === 'section-dados-pessoais' ? 'dados' :
           sectionId?.startsWith('section-termos') ? 'terms' :
           sectionId?.startsWith('section-perguntas') ? 'question' :
           sectionId === 'section-final' ? 'final' :
           'default');

        if (typeof window.typeAndSpeak === 'function') {
          await window.typeAndSpeak(el, text, elementSpeed, {
            cursor: elementCursor,
            forceReplay: true,
            kind: voiceKind
          });
        } else if (typeof window.runTyping === 'function') {
          await window.runTyping(el, text, () => {}, {
            speed: elementSpeed,
            cursor: elementCursor,
            forceReplay: true
          });

          if (window.JORNADA_VOICE?.speakLive) {
            await window.JORNADA_VOICE.speakLive(text, {
              lang: document.documentElement.lang || window.i18n?.lang || 'pt-BR',
              guide: document.body.dataset.guia || 'lumen',
              kind: voiceKind
            });
          }
        }

        el.classList.remove('typing-active');
        el.classList.add('typing-done');
        el.removeAttribute('data-typing');

        await new Promise((resolve) =>
          setTimeout(resolve, el.classList.contains('intro-title') ? 180 : 120)
        );
      }

      window.__JC_TYPED_ONCE[sectionId] = true;
      console.log('[JC.applyTypingAndTTS] Concluído para:', sectionId);
    } catch (err) {
      console.error('[JC.applyTypingAndTTS] Erro:', sectionId, err);
      window.__JC_TYPED_ONCE[sectionId] = false;
    } finally {
      window.__JC_IS_TYPING = false;
    }
  }

  window.applyTypingAndTTS = applyTypingAndTTS;

  function attachButtonEvents(sectionId, root) {
    if (!root) return;

    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Botões encontrados:', buttons.length, sectionId);

    buttons.forEach((btn) => {
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.classList.add('btn', 'btn-primary', 'btn-stone');

      if (btn.dataset.jcBound === '1') return;
      btn.dataset.jcBound = '1';

      if (action === 'avancar') {
        btn.addEventListener('click', () => {
          if (isTransitioning) return;
          const currentIndex = sectionOrder.indexOf(sectionId);
          const next = sectionOrder[currentIndex + 1];
          if (next) {
            JC.show(next);
          } else {
            window.location.href = '/termos';
          }
        });
      }

      btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 8px 16px rgba(0,0,0,0.7)';
      });

      btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6)';
      });
    });
  }

  async function handleSectionLogic(sectionId, root) {
    if (!root) return;

    if (isIntroLike(sectionId)) {
      root.style.cssText = `
        background: transparent !important;
        padding: 30px !important;
        border-radius: 12px !important;
        max-width: 600px !important;
        text-align: center !important;
        box-shadow: none !important;
        border: none !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        position: relative !important;
        z-index: 2 !important;
      `;

      attachButtonEvents(sectionId, root);
      await applyTypingAndTTS(sectionId, root, { forceReplay: true });
      return;
    }

    attachButtonEvents(sectionId, root);
  }

  async function waitForNode(selector, timeout = 12000) {
    const existing = document.querySelector(selector);
    if (existing) return existing;

    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error(`Timeout esperando ${selector}`));
        }
      }, 80);
    });
  }

  async function show(sectionId) {
    if (isTransitioning) {
      console.log('[JC.show] Transição em andamento, ignorando:', sectionId);
      return;
    }

    if (sectionId === window.JC.currentSection) {
      console.log('[JC.show] Já é a seção atual:', sectionId);
      return;
    }

    isTransitioning = true;
    console.log('[JC.show] Iniciando:', sectionId);

    try {
      const cleanId = sectionId.replace(/^section-/, '');
      let section = await window.carregarEtapa(cleanId);

      if (section && section.id !== sectionId) {
        section.id = sectionId;
      }

      section = await waitForNode('#' + sectionId, 12000);

      if (!section) {
        throw new Error(`Seção ${sectionId} não encontrada`);
      }

      await applyI18nToSection(sectionId, section);
      await prepareTyping(section);

      window.JC.currentSection = sectionId;
      lastShownSection = sectionId;

      await handleSectionLogic(sectionId, section);
      attachButtonEvents(sectionId, section);

      document.dispatchEvent(new CustomEvent('section:shown', {
        detail: { sectionId, node: section }
      }));

      console.log('[JC.show] Exibida com sucesso:', sectionId);
    } catch (err) {
      console.error('[JC.show] Falha ao exibir:', sectionId, err);
      window.toast?.(`Erro ao carregar ${sectionId}`, 'error');

      const idx = sectionOrder.indexOf(sectionId);
      if (idx >= 0 && idx < sectionOrder.length - 1) {
        const next = sectionOrder[idx + 1];
        show(next);
      }
    } finally {
      isTransitioning = false;
    }
  }

  // Evento de confirmação de idioma
  document.addEventListener('intro:language-confirmed', async (e) => {
    const intro = document.getElementById('section-intro');
    if (!intro) return;

    const lang = e?.detail?.lang || window.i18n?.currentLang || 'pt-BR';
    console.log('[JC] intro:language-confirmed recebido para', lang);

    try {
      window.__JC_TYPED_ONCE = window.__JC_TYPED_ONCE || {};
      window.__JC_TYPED_ONCE['section-intro'] = false;
      window.__JC_IS_TYPING = false;

      if (window.i18n?.waitForReady) await window.i18n.waitForReady(8000);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      if (window.i18n?.apply) window.i18n.apply(intro);

      await prepareTyping(intro);
      await applyTypingAndTTS('section-intro', intro, { forceReplay: true });
    } catch (err) {
      console.warn('[JC] Falha ao reprocessar intro após idioma:', err);
    }
  });

  function goNext() {
    if (isTransitioning) return;
    const current = window.JC.currentSection || 'section-intro';
    const idx = sectionOrder.indexOf(current);
    const next = sectionOrder[idx + 1];
    if (next) show(next);
    else window.location.href = '/termos';
  }

  function setOrder(order) {
    sectionOrder.length = 0;
    sectionOrder.push(...order);
  }

  async function init() {
    if (isInitializing) return;
    isInitializing = true;

    console.log('[JC.init] Inicializando controller...');

    window.JC = {
      ...existingJC,
      init,
      show,
      goNext,
      setOrder,
      attachButtonEvents,
      handleSectionLogic
    };

    const authScreen = document.getElementById('auth-screen');
    if (authScreen) {
      localStorage.setItem('token', 'dummy-token');
      authScreen.style.display = 'none';
    }

    try {
      await show('section-intro');
    } catch (err) {
      console.warn('[JC.init] Falha na intro, tentando termos1');
      await show('section-termos1');
    }

    isInitializing = false;

    // Resets de sessão
    (function resetJornadaIfNewRun() {
      const runId = String(Date.now());
      const lastRun = sessionStorage.getItem('JORNADA_RUN_ID');
      if (!lastRun) {
        sessionStorage.setItem('JORNADA_RUN_ID', runId);
        const keys = ['JORNADA_GUIA', 'JORNADA_SELFIECARD', 'SELFIE_CARD', '__SELFIECARD_DONE__', 'JORNADA_PROGRESS', 'JORNADA_RESPOSTAS', 'JORNADA_STATE_CACHE'];
        keys.forEach(k => {
          try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch {}
        });
        console.log('[RESET] Jornada resetada para novo run:', runId);
      }
    })();
  }

  document.addEventListener('section:shown', async (e) => {
    const { sectionId, node } = e.detail || {};
    if (!node) return;

    window.JC.currentSection = sectionId;
    attachButtonEvents(sectionId, node);

    if (isIntroLike(sectionId) && sectionId !== lastShownSection) {
      await applyI18nToSection(sectionId, node);
      await prepareTyping(node);
      await applyTypingAndTTS(sectionId, node, { forceReplay: true });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
