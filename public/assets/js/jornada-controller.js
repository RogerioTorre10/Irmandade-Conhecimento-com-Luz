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
    'section-perguntas',
    'section-final'
  ];

  let targetId = 'section-card';
  let lastShownSection = null;
  let isTransitioning = false;
  let isInitializing = false; // nova flag para evitar chamadas duplicadas no init

  function getText(el) {
    if (!el) return '';
    const tc = (el.textContent || '').trim();
    if (tc) return tc;
    return (el.dataset?.text || '').trim();
  }

  // Sincroniza tema do guia
  (function syncGuiaTema() {
    try {
      const guia = (sessionStorage.getItem('jornada.guia') || '').toLowerCase();
      if (guia) {
        document.body.dataset.guia = guia;
      }
    } catch (e) {
      console.warn('[GUIA THEME] Não consegui ler jornada.guia:', e);
    }
  })();

  async function applyTypingAndTTS(sectionId, root) {
    console.log('[JC.applyTypingAndTTS] Iniciando para:', sectionId);
    if (window.__JC_TYPED_ONCE[sectionId]) {
      console.log('[JC.applyTypingAndTTS] Já aplicado, ignorando:', sectionId);
      return;
    }
    window.__JC_TYPED_ONCE[sectionId] = true;
    window.__JC_IS_TYPING = true;

    try {
      // Espera bridge de typing/TTS
      let attempts = 0;
      while (
        (!window.runTyping || (!window.typeAndSpeak && !window.EffectCoordinator?.speak)) &&
        attempts < 80
      ) {
        await new Promise(r => setTimeout(r, 80));
        attempts++;
      }

      const typingElements = root?.querySelectorAll?.('[data-typing="true"]') || [];
      if (!typingElements.length) {
        console.warn('[JC.applyTypingAndTTS] Nenhum [data-typing] em:', sectionId);
        return;
      }

      // Garante visibilidade
      const sectionNode = root?.closest?.('section') || root;
      if (sectionNode) {
        sectionNode.classList.remove('hidden', 'section-hidden');
        sectionNode.setAttribute('aria-hidden', 'false');
        sectionNode.style.display = 'block';
        sectionNode.style.visibility = 'visible';
        sectionNode.style.opacity = '1';
      }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      for (const el of typingElements) {
        const text = getText(el);
        if (!text) continue;
        el.dataset.text = text;
        el.textContent = '';
        if (typeof window.typeAndSpeak === 'function') {
          await window.typeAndSpeak(el, text, 36);
        } else if (typeof window.runTyping === 'function') {
          await window.runTyping(el, text, () => {}, { speed: 36, cursor: true });
        }
      }
      console.log('[JC.applyTypingAndTTS] Concluído para:', sectionId);
    } catch (err) {
      console.error('[JC.applyTypingAndTTS] Erro:', sectionId, err);
      window.__JC_TYPED_ONCE[sectionId] = false; // permite retry futuro
    } finally {
      window.__JC_IS_TYPING = false;
    }
  }

  function attachButtonEvents(sectionId, root) {
    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Botões encontrados:', buttons.length, sectionId);

    buttons.forEach(btn => {
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.classList.add('btn', 'btn-primary', 'btn-stone');

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

      // Efeitos hover simples
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

  function handleSectionLogic(sectionId, root) {
    if (['section-intro', 'section-termos1', 'section-termos2'].includes(sectionId)) {
      if (root) {
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
      }
      attachButtonEvents(sectionId, root);
      applyTypingAndTTS(sectionId, root);
    }
  }

  // Função auxiliar de espera (reutilize a que já existe no seu projeto, se preferir)
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
      console.log('[JC.show] Carregando etapa:', cleanId);

      let section = await window.carregarEtapa(cleanId);

      // Força ID correto
      if (section && section.id !== sectionId) {
        section.id = sectionId;
      }

      // Espera o elemento aparecer no DOM (essencial!)
      try {
        section = await waitForNode('#' + sectionId, 12000);
        console.log('[JC.show] Seção detectada no DOM após carregar:', sectionId);
      } catch (waitErr) {
        console.warn('[JC.show] waitForNode falhou:', sectionId, waitErr);
        // Tenta retry único
        console.log('[JC.show] Tentando carregar novamente...');
        section = await window.carregarEtapa(cleanId);
        if (section) section.id = sectionId;
        section = await waitForNode('#' + sectionId, 8000); // timeout menor no retry
      }

      if (!section) {
        throw new Error(`Seção ${sectionId} não encontrada no DOM após carregamento`);
      }

      // Aplica i18n
      if (window.i18n?.apply) {
        await window.i18n.waitForReady?.(8000).catch(() => {});
        window.i18n.apply(section);
        // Sincroniza data-text para typing
        section.querySelectorAll('[data-typing="true"]').forEach(el => {
          const tc = el.textContent?.trim();
          if (tc) el.dataset.text = tc;
        });
      }

      window.JC.currentSection = sectionId;
      lastShownSection = sectionId;

      handleSectionLogic(sectionId, section);
      attachButtonEvents(sectionId, section);

      document.dispatchEvent(new CustomEvent('section:shown', {
        detail: { sectionId, node: section }
      }));

      console.log('[JC.show] Exibida com sucesso:', sectionId);
    } catch (err) {
      console.error('[JC.show] Falha ao exibir:', sectionId, err);
      window.toast?.(`Erro ao carregar ${sectionId}`, 'error');

      // Avança para próxima só se não for a última tentativa
      const idx = sectionOrder.indexOf(sectionId);
      if (idx >= 0 && idx < sectionOrder.length - 1) {
        const next = sectionOrder[idx + 1];
        console.warn('[JC.show] Avançando para próxima após falha:', next);
        show(next);
      }
    } finally {
      isTransitioning = false;
    }
  }

  function goNext() {
    if (isTransitioning) return;
    const current = window.JC.currentSection || 'section-intro';
    const idx = sectionOrder.indexOf(current);
    const next = sectionOrder[idx + 1];
    if (next) {
      show(next);
    } else {
      window.location.href = '/termos';
    }
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

    // Simulação de auth (se necessário)
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) {
      localStorage.setItem('token', 'dummy-token');
      authScreen.style.display = 'none';
    }

    // Inicia pela intro de forma segura
    try {
      await show('section-intro');
    } catch (err) {
      console.warn('[JC.init] Falha na intro, tentando termos1');
      await show('section-termos1');
    }

    isInitializing = false;
  }

  // Listener de section:shown (apenas para reforço)
  document.addEventListener('section:shown', (e) => {
    const { sectionId, node } = e.detail || {};
    if (!node || sectionId === lastShownSection) return;

    lastShownSection = sectionId;
    window.JC.currentSection = sectionId;
    attachButtonEvents(sectionId, node);
    handleSectionLogic(sectionId, node);
  });

  // Inicia quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
