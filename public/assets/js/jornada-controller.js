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
  if (window.__LANG_MODAL_OPEN__ || !window.__INTRO_LANG_CONFIRMED__) {
  console.log('[JC.applyTypingAndTTS] Aguardando confirmação do idioma.');
  return;
 }
  console.log('[JC.applyTypingAndTTS] Iniciando para:', sectionId);

  // ✅ garante estrutura
  window.__JC_TYPED_ONCE = window.__JC_TYPED_ONCE || {};

  // ✅ latch por seção
  if (window.__JC_TYPED_ONCE[sectionId]) {
    console.log('[JC.applyTypingAndTTS] Já aplicado, ignorando:', sectionId);
    return;
  }

  // só marca "em andamento" aqui (não como done)
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
      return; // ✅ não marca como done
    }

    // ✅ agora sim: marca como aplicado (porque tem o que processar)
    window.__JC_TYPED_ONCE[sectionId] = true;

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
    // ✅ libera retry futuro em caso de falha real
    window.__JC_TYPED_ONCE[sectionId] = false;
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

    // Aplica i18n na seção recém-carregada
if (section && window.i18n?.apply) {
  try {
    // Espera i18n estar pronto (importante para dict carregar)
    if (window.i18n.waitForReady) {
      await window.i18n.waitForReady(8000);
    }
    
    window.i18n.apply(section);
    console.log('[i18n] Tradução aplicada na seção carregada:', sectionId);
    
    // Reforça data-text para typing se houver
    section.querySelectorAll('[data-typing="true"]').forEach(el => {
      const text = el.textContent?.trim();
      if (text) el.dataset.text = text;
    });
  } catch (err) {
    console.warn('[i18n] Falha ao aplicar em', sectionId, err);
  }
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

    // ✅ RESET CONTROLADO da jornada (evita guia/cor/carda antigos)
(function resetJornadaIfNewRun(){
  // gera um id por “run”
  const runId = String(Date.now());
  const lastRun = sessionStorage.getItem('JORNADA_RUN_ID');

  // se não tem run ativo, inicia limpando
  if (!lastRun) {
    sessionStorage.setItem('JORNADA_RUN_ID', runId);

    // limpa só o que é da jornada
    const keys = [
      'JORNADA_GUIA',
      'JORNADA_SELFIECARD',
      'SELFIE_CARD',
      '__SELFIECARD_DONE__',
      'JORNADA_PROGRESS',
      'JORNADA_RESPOSTAS',
      'JORNADA_STATE_CACHE'
    ];

    keys.forEach(k => {
      try { sessionStorage.removeItem(k); } catch(e){}
      // localStorage: remove só o que pode “vazar” entre runs
      try { localStorage.removeItem(k); } catch(e){}
    });

    // reseta state em memória
    if (window.JORNADA_STATE) {
      delete window.JORNADA_STATE.guia;
      delete window.JORNADA_STATE.guiaSelecionado;
      delete window.JORNADA_STATE.selfieCard;
    }

    console.log('[RESET] Jornada resetada para novo run:', runId);
  }
})();
    
(function resetRun(){
  if (sessionStorage.getItem('JORNADA_RUN_RESET') === '1') return;
  sessionStorage.setItem('JORNADA_RUN_RESET', '1');

  // limpa apenas o que vaza entre testes
  ['JORNADA_GUIA','JORNADA_SELFIECARD','SELFIE_CARD','__SELFIECARD_DONE__']
    .forEach(k => { try { sessionStorage.removeItem(k); } catch(e){} });

  // NÃO limpe localStorage inteiro, só chaves da jornada
  ['JORNADA_GUIA','JORNADA_SELFIECARD','SELFIE_CARD','__SELFIECARD_DONE__']
    .forEach(k => { try { localStorage.removeItem(k); } catch(e){} });

  window.JORNADA_STATE = {};
  console.log('[RESET] run limpo');
})();
    
if (sessionStorage.getItem('JORNADA_NEW_RUN') !== '1') {
  sessionStorage.setItem('JORNADA_NEW_RUN', '1');

  // limpa só o que causa vazamento de guia/card
  ['JORNADA_GUIA', 'JORNADA_SELFIECARD', 'SELFIE_CARD', '__SELFIECARD_DONE__']
    .forEach(k => { try { sessionStorage.removeItem(k); } catch(e){} });

  window.JORNADA_STATE = {};
  console.log('[RESET] nova jornada limpa');
}
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
