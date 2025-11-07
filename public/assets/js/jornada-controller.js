(function () {
  'use strict';
  window.JC = window.JC || {};
  const existingJC = { ...window.JC };

  const sectionOrder = [
    'section-intro',
    'section-termos1',
    'section-termos2',
    'section-senha',
    'section-guia',
    'section-selfie',
    'section-perguntas',
    'section-final'
  ];
    
  let targetId = 'section-card'; // seção inicial padrão

  let lastShownSection = null;
  let isTransitioning = false;

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  async function applyTypingAndTTS(sectionId, root) {
    console.log('[JC.applyTypingAndTTS] Iniciando para:', sectionId);
    try {
      let attempts = 0;
      const maxAttempts = 100; // Aumentado para garantir carregamento
      while (!window.TypingBridge && attempts < maxAttempts) {
        console.log('[JC.applyTypingAndTTS] Aguardando TypingBridge...');
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (!window.TypingBridge) {
        console.warn('[JC.applyTypingAndTTS] TypingBridge não disponível após tentativas:', sectionId);
        return;
      }
      const typingElements = root.querySelectorAll('[data-typing="true"]');
      console.log('[JC.applyTypingAndTTS] Elementos de datilografia encontrados:', typingElements.length);
      if (typingElements.length === 0) {
        console.warn('[JC.applyTypingAndTTS] Nenhum elemento com data-typing encontrado em:', sectionId);
        return;
      }
      for (const element of typingElements) {
        const text = getText(element);
        await window.runTyping(element, text, () => {}, { speed: 36, cursor: true });
      }
      console.log('[JC.applyTypingAndTTS] Efeitos de datilografia aplicados para:', sectionId);
    } catch (err) {
      console.error('[JC.applyTypingAndTTS] Erro ao aplicar efeitos:', sectionId, err);
    }
  }

  function attachButtonEvents(sectionId, root) {
    console.log('[JC.attachButtonEvents] Attaching buttons for:', sectionId);
    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Buttons found:', buttons.length, Array.from(buttons).map(btn => btn.id || btn.dataset.action));
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.classList.add('btn', 'btn-primary', 'btn-stone');
      btn.addEventListener('click', () => {
        console.log('[JC.attachButtonEvents] Button clicked:', action, btn.id);
        if (action === 'avancar' && !isTransitioning) {
          const currentIndex = sectionOrder.indexOf(sectionId);
          const nextSection = sectionOrder[currentIndex + 1];
          console.log('[JC.attachButtonEvents] Navigating to:', nextSection);
          if (nextSection && nextSection !== window.JC.currentSection) {
            JC.show(nextSection);
          } else {
            console.warn('[JC.attachButtonEvents] No next section, redirecting to /termos');
            window.location.href = '/termos';
          }
        }
      });
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
    console.log('[JC.handleSectionLogic] Processing logic for:', sectionId);
    if (
      sectionId === 'section-intro' ||
      sectionId === 'section-termos1' ||
      sectionId === 'section-termos2'
    ) {
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
      applyTypingAndTTS(sectionId, root);
    }
  }

  async function show(sectionId) {
    console.log('[JC.show] Starting display for:', sectionId, { caller: new Error().stack });
    if (sectionId === window.JC.currentSection || sectionId === lastShownSection || isTransitioning) {
      console.log('[JC.show] Seção já ativa, exibida recentemente ou em transição, ignorando:', sectionId);
      return;
    }

    isTransitioning = true;
    try {
      const cleanId = sectionId.replace(/^section-/, '');
      console.log('[JC.show] Starting carregarEtapa for:', cleanId);
      const section = await window.carregarEtapa(cleanId);
      console.log('[JC.show] carregarEtapa completed, element #', sectionId, ':', !!section);
      if (section) {
        console.log('[JC.show] Content of #jornada-content-wrapper:', document.getElementById('jornada-content-wrapper')?.innerHTML.slice(0, 120) + '...');
        lastShownSection = sectionId;
        window.JC.currentSection = sectionId;
        handleSectionLogic(sectionId, section);
        document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId, node: section } }));
        console.log('[JC.show] Event section:shown fired for:', sectionId);
        console.log('[JC.show] Displayed successfully:', sectionId);
      } else {
        console.error('[JC.show] Section element is null for:', sectionId);
        window.toast?.(`Seção ${sectionId} não encontrada`, 'error');
        // Tentar próxima seção
        const currentIndex = sectionOrder.indexOf(sectionId);
        const nextSection = sectionOrder[currentIndex + 1];
        if (nextSection) {
          console.warn('[JC.show] Avançando para próxima seção:', nextSection);
          show(nextSection);
        }
      }
    } catch (err) {
      console.error('[JC.show] Error showing section:', sectionId, err);
      window.toast?.(`Erro ao mostrar seção ${sectionId}`, 'error');
    } finally {
      isTransitioning = false;
    }
  }

  function goNext() {
    if (isTransitioning) {
      console.log('[JC.goNext] Transição em andamento, ignorando');
      return;
    }
    const currentIndex = sectionOrder.indexOf(window.JC.currentSection || 'section-intro');
    const nextSection = sectionOrder[currentIndex + 1];
    console.log('[JC.goNext] Navigating to:', nextSection);
    if (nextSection && nextSection !== window.JC.currentSection) {
      show(nextSection);
    } else {
      console.warn('[JC.goNext] No next section, redirecting to /termos');
      window.location.href = '/termos';
    }
  }

  function setOrder(order) {
    console.log('[JC.setOrder] Setting section order:', order);
    sectionOrder.length = 0;
    sectionOrder.push(...order);
  }

  async function init() {
    console.log('[JC.init] Controller initialized successfully');
    window.JC = {
      ...existingJC,
      init,
      show,
      goNext,
      setOrder,
      attachButtonEvents,
      handleSectionLogic
    };
    window.JC.currentSection = null;

    JC.init = async function init(options) {
  options = options || {};

  // 👇 NOVO: resolve qual seção inicial usar
  const targetId =
    options.targetId ||
    options.initialSectionId ||
    options.sectionId ||
    'section-card'; // ou 'section-intro', conforme você usa aí
    console.log('[JC.init] targetId resolvido para:', targetId);
    };
    
    // Aguardar TypingBridge
    let attempts = 0;
    const maxAttempts = 100;
    while (!window.TypingBridge && attempts < maxAttempts) {
      console.log('[JC.init] Aguardando TypingBridge...');
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.TypingBridge) {
      console.warn('[JC.init] TypingBridge não disponível após tentativas');
    }

    // Verificar autenticação
    const authScreen = document.getElementById('auth-screen');
    const toastElement = document.getElementById('toast');
    if (authScreen || (toastElement && toastElement.textContent.includes('autenticação necessária'))) {
      console.warn('[JC.init] Tela de autenticação detectada');
      // Simular autenticação
      localStorage.setItem('token', 'dummy-token');
      localStorage.setItem('JORNADA_NOME', 'Teste');
      localStorage.setItem('JORNADA_GUIA', 'guia');
      if (authScreen) authScreen.style.display = 'none';
      if (toastElement) toastElement.style.display = 'none';
      console.log('[JC.init] Autenticação simulada, iniciando section-intro...');
    }

    // Bloqueia perguntas se o card não foi confirmado
      if (targetId === 'section-perguntas') {
      window.JC = window.JC || {};
      const ok = JC.flags?.cardConfirmed === true;
      if (!ok) {
      console.warn('[Guard] Perguntas bloqueadas: recarregar CARD');
      if (window.JC?.show) window.JC.show('section-card');
      else if (window.showSection) window.showSection('section-card');
      return;
    }
  }
   
    // Iniciar jornada
    const introElement = document.getElementById('section-intro');
    if (!introElement) {
      console.warn('[JC.init] section-intro não encontrado, avançando para section-termos1');
      window.JC.currentSection = 'section-termos1';
      window.JC.show('section-termos1');
    } else {
      window.JC.currentSection = 'section-intro';
      window.JC.show('section-intro');
    }
  }

  document.addEventListener('section:shown', (e) => {
    const sectionId = e.detail.sectionId;
    const node = e.detail.node;
    if (sectionId === lastShownSection || isTransitioning) {
      console.log('[JC.section:shown] Seção já exibida ou em transição, ignorando:', sectionId);
      return;
    }
    if (node) {
      lastShownSection = sectionId;
      window.JC.currentSection = sectionId;
      attachButtonEvents(sectionId, node);
      handleSectionLogic(sectionId, node);
    }
  });  

    init();
  })();
