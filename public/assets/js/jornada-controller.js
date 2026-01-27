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
    'section-card',
    'section-perguntas',
    'section-final'
  ];

  let targetId = 'section-card';
  let lastShownSection = null;
  let isTransitioning = false;

function getText(el) {
  if (!el) return '';
  const tc = (el.textContent || '').trim();
  if (tc) return tc; // i18n aplica aqui (quando existir)
  return (el.dataset?.text || '').trim(); // fallback para seu HTML atual
}


  // ===== Sincroniza tema do guia com o BODY em qualquer página =====
(function syncGuiaTema(){
  try {
    const guia = (sessionStorage.getItem('jornada.guia') || '').toLowerCase();
    if (guia) {
      document.body.dataset.guia = guia; // body[data-guia="lumen|zion|arian"]
    }
  } catch (e) {
    console.warn('[GUIA THEME] Não consegui ler jornada.guia:', e);
  }
})();

 async function applyTypingAndTTS(sectionId, root) {
  console.log('[JC.applyTypingAndTTS] Iniciando para:', sectionId);

  try {
    // ------------------------------------------------------------
    // 1) Garante que o "bridge" que você usa de fato está pronto
    //    (no seu projeto: runTyping + EffectCoordinator/typeAndSpeak)
    // ------------------------------------------------------------
    let attempts = 0;
    const maxAttempts = 100;

    while (
      (!window.runTyping || (!window.typeAndSpeak && !window.EffectCoordinator?.speak)) &&
      attempts < maxAttempts
    ) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    const bridgeReady = !!window.runTyping && (!!window.typeAndSpeak || !!window.EffectCoordinator?.speak);
    if (!bridgeReady) {
      console.warn('[JC.applyTypingAndTTS] Bridge de typing/TTS não disponível após tentativas:', sectionId, {
        runTyping: !!window.runTyping,
        typeAndSpeak: !!window.typeAndSpeak,
        speak: !!window.EffectCoordinator?.speak
      });
      return;
    }

    // ------------------------------------------------------------
    // 2) Busca elementos de datilografia
    // ------------------------------------------------------------
    const typingElements = root?.querySelectorAll?.('[data-typing="true"]') || [];
    console.log('[JC.applyTypingAndTTS] Elementos de datilografia encontrados:', typingElements.length);

    if (!typingElements.length) {
      console.warn('[JC.applyTypingAndTTS] Nenhum elemento com data-typing encontrado em:', sectionId);
      return;
    }

    // ------------------------------------------------------------
    // 3) Garante que a seção está visível e o layout estabilizou
    // ------------------------------------------------------------
    const sectionNode = root?.closest?.('section') || root;
    if (sectionNode) {
      sectionNode.classList.remove('hidden', 'section-hidden');
      sectionNode.setAttribute('aria-hidden', 'false');
      sectionNode.style.display = 'block';
      sectionNode.style.visibility = 'visible';
      sectionNode.style.opacity = '1';
    }

    // espera 2 frames para evitar “flash e some”
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // ------------------------------------------------------------
    // 4) Executa typing (e TTS se existir), preservando i18n
    // ------------------------------------------------------------
    for (const el of typingElements) {
      const text = getText(el);
      if (!text) continue;

      // trava o texto (evita que outro script apague no meio)
      el.dataset.text = text;
      el.style.visibility = 'visible';
      el.style.opacity = '1';

      // se estiver vazio visualmente, deixa o typing controlar
      if (!el.textContent || !el.textContent.trim()) {
        el.textContent = '';
      }

      // Se existir typeAndSpeak, usa ela (fala + digita sincronizado)
      if (typeof window.typeAndSpeak === 'function') {
        await window.typeAndSpeak(el, text, 36);
      } else {
        // fallback: só digita
        await window.runTyping(el, text, () => {}, { speed: 36, cursor: true });
      }
    }

    console.log('[JC.applyTypingAndTTS] Efeitos de datilografia/TTS aplicados para:', sectionId);
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
      const existsInDom = !!document.getElementById(sectionId);
    if (existsInDom) {
    console.log('[JC.show] Seção já ativa... ignorando:', sectionId);
    return;
    }
    console.warn('[JC.show] Guard acionado, mas seção não existe no DOM; seguindo para carregar:', sectionId);
    // NÃO retorna aqui
    }

    isTransitioning = true;
    try {
      const cleanId = sectionId.replace(/^section-/, '');
      console.log('[JC.show] Starting carregarEtapa for:', cleanId);
      const section = await window.carregarEtapa(cleanId);
      // garante que a seção carregada tenha o ID que o controller espera
      if (section && section.id !== sectionId) {
      section.id = sectionId;
      }
      if (window.i18n) {
      try {
      if (typeof window.i18n.waitForReady === 'function') {
      await window.i18n.waitForReady(10000);
      }
      if (typeof window.i18n.apply === 'function' && section) {
      window.i18n.apply(section);
      }
      } catch (e) {
      console.warn('[i18n] Falha ao aplicar i18n na seção:', sectionId, e);
      }
    }
      console.log('[JC.show] carregarEtapa completed, element #', sectionId, ':', !!section);
      if (section) {
      if (window.i18n) {
      try {
      // garante que o dicionário já foi carregado
      if (typeof window.i18n.waitForReady === 'function') {
      await window.i18n.waitForReady(10000);
      }
      // traduz só o node da seção (mais rápido e correto)
      if (typeof window.i18n.apply === 'function') {
      window.i18n.apply(section);
      }
       // após i18n.apply(section)
      (section.querySelectorAll && section.querySelectorAll('[data-typing="true"]') || []).forEach(el => {
      const tc = (el.textContent || '').trim();
      if (tc) el.dataset.text = tc;
      });
 
      } catch (e) {
      console.warn('[i18n] Falha ao aplicar na seção:', sectionId, e);
      }
      }
        console.log('[JC.show] Content of #jornada-content-wrapper:', document.getElementById('jornada-content-wrapper')?.innerHTML.slice(0, 120) + '...');
        lastShownSection = sectionId;
        window.JC.currentSection = sectionId;
        handleSectionLogic(sectionId, section);

        // ✅ Adicionado para ativar section-perguntas.js corretamente
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId, node: section }
        }));

       if (section) {
  // ✅ Seção existe: dispara evento e finaliza normalmente
  document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId, node: section } }));
  console.log('[JC.show] Event section:shown fired for:', sectionId);
  console.log('[JC.show] Displayed successfully:', sectionId);

} else {
  // 🚨 Seção veio null: NÃO avance imediatamente para a próxima.
  // Primeiro, tenta carregar/injetar novamente (uma única vez por seção).
  console.error('[JC.show] Section element is null for:', sectionId);
  window.toast?.(`Seção ${sectionId} não encontrada`, 'error');

  // evita loop infinito
  window.__jc_retry = window.__jc_retry || {};
  const retryCount = window.__jc_retry[sectionId] || 0;

  if (retryCount < 1) {
    window.__jc_retry[sectionId] = retryCount + 1;

    console.warn('[JC.show] Tentando recarregar/injetar a seção novamente:', sectionId);

    try {
      // tenta novamente via loader (se existir)
      const cleanId = sectionId.replace(/^section-/, '');
      if (typeof window.carregarEtapa === 'function') {
        const retrySection = await window.carregarEtapa(cleanId);

        // garante id esperado
        if (retrySection && retrySection.id !== sectionId) {
          retrySection.id = sectionId;
        }

        if (retrySection) {
          // sucesso: dispara evento e encerra
          document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId, node: retrySection } }));
          console.log('[JC.show] Event section:shown fired (after retry) for:', sectionId);
          console.log('[JC.show] Displayed successfully (after retry):', sectionId);
          return;
        }
      }
    } catch (e) {
      console.warn('[JC.show] Retry falhou para:', sectionId, e);
    }
  }

  // Se ainda falhou após retry, aí sim tenta próxima seção
  const currentIndex = sectionOrder.indexOf(sectionId);
  const nextSection = sectionOrder[currentIndex + 1];

  if (nextSection) {
    console.warn('[JC.show] Falha persistente. Avançando para próxima seção:', nextSection);
    show(nextSection);
  } else {
    console.error('[JC.show] Nenhuma próxima seção disponível. Fluxo interrompido em:', sectionId);
  }
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

    // Autenticação simulada
    const authScreen = document.getElementById('auth-screen');
    const toastElement = document.getElementById('toast');
    if (authScreen || (toastElement && toastElement.textContent.includes('autenticação necessária'))) {
      console.warn('[JC.init] Tela de autenticação detectada');
      localStorage.setItem('token', 'dummy-token');
      localStorage.setItem('JORNADA_NOME', 'Teste');
      localStorage.setItem('JORNADA_GUIA', 'guia');
      if (authScreen) authScreen.style.display = 'none';
      if (toastElement) toastElement.style.display = 'none';
      console.log('[JC.init] Autenticação simulada, iniciando section-intro...');
    }

    // Bloqueio de perguntas se card não confirmado
    if (targetId === 'section-perguntas') {
      const ok = JC.flags?.cardConfirmed === true;
      if (!ok) {
      console.warn('[Guard] Perguntas bloqueadas: recarregar CARD');
      if (window.JC?.show) window.JC.show('section-card');
      else if (window.showSection) window.showSection('section-card');
      return;
    }
  }

   // Iniciar jornada (robusto)
    window.JC.currentSection = 'section-intro';

    window.JC.show('section-intro').catch((e) => {
    console.warn('[JC.init] Falha ao iniciar section-intro, caindo para section-termos1', e);
    window.JC.currentSection = 'section-termos1';
    window.JC.show('section-termos1');
  });


  }

  // Evento para lógica adicional após exibição de seção
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
