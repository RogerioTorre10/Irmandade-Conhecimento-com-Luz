(function (global) {
  'use strict';

  /* GUARD: evita carregamento duplicado */
  if (global.__JornadaControllerReady) {
    console.log('[CONTROLLER] Já carregado, ignorando');
    return;
  }
  global.__JornadaControllerReady = true;

  /* FLAGS DE BOOTSTRAP */
  if (global.__ControllerBooting === undefined) global.__ControllerBooting = false;
  if (global.__ControllerEventsBound === undefined) global.__ControllerEventsBound = false;

  /* DEPENDÊNCIAS SEGURAS */
  const i18n = global.i18n || {
    lang: 'pt-BR', ready: false,
    t: (k, f) => f || k,
    apply: () => {},
    waitForReady: async () => {},
    init: async () => {}
  };

  const TypingBridge = global.TypingBridge || {};
  const playTyping = (TypingBridge && typeof TypingBridge.play === 'function')
    ? TypingBridge.play
    : (typeof global.runTyping === 'function' ? global.runTyping : null);

  const Paper = global.JPaperQA || {};
  const fnLoadDynamicBlocks = Paper.loadDynamicBlocks || (async () => false);
  const fnRenderQuestions   = Paper.renderQuestions   || (async () => {});
  const fnLoadVideo         = Paper.loadVideo         || (() => {});
  const fnSetPergaminho     = Paper.setPergaminho     || (() => {});
  const fnEnsureCanvas      = Paper.ensureCanvas      || (() => {});
  const fnTypeSeq           = Paper.typeQuestionsSequentially || (() => {});
  const fnTypePh            = Paper.typePlaceholder   || (async () => {});

  const log = (...args) => console.log('[CONTROLLER]', ...args);

  /* ESTADO GLOBAL */
  const state = {
    sections: global.sections || [
      'section-intro', 'section-termos', 'section-senha',
      'section-guia', 'section-selfie', 'section-perguntas', 'section-final'
    ],
    currentSection: global.__currentSectionId || 'section-intro',
    answeredQuestions: global.answeredQuestions || new Set(),
    isProcessingClick: false,
    queue: []
  };
  global.sections = state.sections;
  global.currentSection = state.currentSection;

  const JC = global.JC || {
    currentBloco: 0,
    currentPergunta: 0,
    nextSection: null,
    goNext: () => goToNextSection(),
    initialized: false
  };
  global.JC = JC;

  /* HELPERS */
  function debounceClick(callback, wait = 500) {
    return (...args) => {
      if (state.isProcessingClick) {
        log('Clique ignorado (debounce)');
        return;
      }
      state.isProcessingClick = true;
      const ev = args[0];
      const btn = ev && ev.target ? ev.target.closest('button') : null;
      if (btn) btn.innerHTML = i18n.t('btn_carregando', 'Carregando...');

      setTimeout(() => {
        state.isProcessingClick = false;
        if (btn) btn.innerHTML = i18n.t('btn_avancar', 'Avançar');
      }, wait);

      callback(...args);
    };
  }

  function ensureTypingAttrs(container) {
    if (!container) return;
    const candidates = container.querySelectorAll('h1,h2,h3,h4,p,.text');
    candidates.forEach(el => {
      if (!el.hasAttribute('data-typing')) {
        el.setAttribute('data-typing', 'true');
        el.setAttribute('data-speed', '36');
        el.setAttribute('data-cursor', 'true');
      }
    });
  }

  function createIsolatedButton(parent, { id, text, dataset = {}, onClick }) {
    if (!parent) return null;
    let btn = parent.querySelector(`#${id}, [data-id="${id}"]`);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.className = 'btn btn-termos';
      btn.textContent = text;
      Object.entries(dataset).forEach(([k, v]) => btn.dataset[k] = v);
      parent.appendChild(btn);
    }
    const fresh = btn.cloneNode(true);
    btn.replaceWith(fresh);
    btn = fresh;

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (typeof onClick === 'function') onClick(e);
    });
    return btn;
  }

  function show(el) {
    if (el) {
      el.classList.remove('hidden', 'section-hidden');
      el.style.display = '';
    }
  }
  function hide(el) {
    if (el) {
      el.classList.add('section-hidden');
      el.style.display = 'none';
    }
  }

  /* NAVEGAÇÃO */
  function showSection(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) {
      console.error(`[CONTROLLER] Seção não encontrada: ${id}`);
      return;
    }

    // Esconde todas as seções
    document.querySelectorAll('.j-section, section').forEach(sec => {
      hide(sec);
      sec.classList.remove('active');
    });

    // Mostra a nova
    show(el);
    el.classList.add('active');
    state.currentSection = id;
    global.__currentSectionId = id; // Persiste globalmente
    log(`Seção exibida: #${id}`);

    // Inicia digitação
    if (typeof playTyping === 'function') {
      setTimeout(() => playTyping(el, () => {
        log('Digitação concluída em', id);
        // Habilita botões após digitação
        el.querySelectorAll('button').forEach(btn => btn.removeAttribute('disabled'));
      }), 100);
    }
  }

  function goToNextSection() {
    const idx = state.sections.indexOf(state.currentSection);
    if (idx === -1 || idx >= state.sections.length - 1) {
      log('Fim da jornada');
      return;
    }
    const nextId = JC.nextSection && state.sections.includes(JC.nextSection) ? JC.nextSection : state.sections[idx + 1];
    JC.nextSection = null;
    showSection(nextId);
    handleSectionSpecificLogic(nextId);
  }

  /* LÓGICA POR SEÇÃO */
  function handleSectionSpecificLogic(sectionId) {
    if (sectionId === 'section-termos') {
      const pg1 = document.getElementById('termos-pg1');
      const pg2 = document.getElementById('termos-pg2');

      if (!pg1) {
        console.warn('[CONTROLLER] termos-pg1 não encontrado');
        return;
      }

      ensureTypingAttrs(pg1);
      if (pg2) ensureTypingAttrs(pg2);

      show(pg1);
      if (pg2) hide(pg2);

      const nav1 = pg1.querySelector('.footer-actions') || pg1;
      const nav2 = pg2 ? (pg2.querySelector('.footer-actions') || pg2) : null;

      createIsolatedButton(nav1, {
        id: 'btn-termos-next',
        text: i18n.t('btn_proxima_pagina', 'Próxima página'),
        dataset: { action: 'termos-next' },
        onClick: () => {
          hide(pg1);
          if (pg2) show(pg2);
          if (typeof playTyping === 'function') {
            setTimeout(() => playTyping(pg2, () => log('typing pg2 ok')), 100);
          }
        }
      });

      if (pg2 && nav2) {
        createIsolatedButton(nav2, {
          id: 'btn-termos-prev',
          text: i18n.t('btn_voltar', 'Voltar'),
          dataset: { action: 'termos-prev' },
          onClick: () => {
            hide(pg2);
            show(pg1);
            if (typeof playTyping === 'function') {
              setTimeout(() => playTyping(pg1, () => log('typing pg1 ok')), 100);
            }
          }
        });

        createIsolatedButton(nav2, {
          id: 'btn-termos-accept',
          text: i18n.t('btn_aceito_continuar', 'Aceito e quero continuar'),
          dataset: { action: 'termos-accept' },
          onClick: debounceClick(() => goToNextSection(), 300)
        });
      }

      if (typeof playTyping === 'function') {
        setTimeout(() => playTyping(pg1, () => log('typing pg1 ok')), 100);
      }
    } else if (sectionId === 'section-guia' || sectionId === 'section-selfie') {
      try {
        const videoUrl = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro) ||
                         '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
        fnLoadVideo(videoUrl);
      } catch (e) {
        console.error('[CONTROLLER] Erro ao carregar vídeo:', e);
      }
    } else if (sectionId === 'section-perguntas') {
      (async () => {
        try {
          await i18n.waitForReady(10000);
          if (!i18n.ready) throw new Error('i18n não pronto');
          state.answeredQuestions.clear();
          JC.currentBloco = 0;
          JC.currentPergunta = 0;
          await fnLoadDynamicBlocks();
          await fnRenderQuestions();
          global.perguntasLoaded = true;
          log('Perguntas carregadas e renderizadas');
        } catch (err) {
          console.error('[CONTROLLER] Falha ao carregar perguntas:', err);
          if (global.toast) global.toast(i18n.t('erro_perguntas', 'Erro ao carregar perguntas'));
        }
      })();
    } else if (sectionId === 'section-final') {
      log('Jornada concluída!');
      try {
        const finalVideo = global.JORNADA_FINAL_VIDEO ||
                          (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.final);
        if (finalVideo) fnLoadVideo(finalVideo);
      } catch (e) {
        console.error('[CONTROLLER] Vídeo final erro:', e);
      }
    }
  }

  /* EVENTOS GLOBAIS */
  function bindGlobalEvents() {
    if (global.__ControllerEventsBound) return;
    global.__ControllerEventsBound = true;

    const debouncedNext = debounceClick(() => goToNextSection(), 500);
    document.querySelectorAll([
      '[data-action="avancar"]',
      '#iniciar',
      '[data-action="skip-selfie"]',
      '[data-action="select-guia"]',
      '#btnSkipSelfie',
      '#btnStartJourney',
      '#iniciarSenha',
      '.btn-section-next'
    ].join(',')).forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (e.target.closest('#section-termos')) return;
        log('Botão global avançar clicado');
        debouncedNext(e);
      });
    });

    document.addEventListener('questionAnswered', ev => {
      const qId = ev?.detail?.questionId || '(?)';
      state.answeredQuestions.add(qId);
      log(`Pergunta respondida: ${qId} (total ${state.answeredQuestions.size})`);
      goToNextSection();
    });

    document.addEventListener('videoSkipped', () => {
      log('Vídeo pulado');
      goToNextSection();
    });

    document.addEventListener('jc:ready', () => {
      state.queue.forEach(action => {
        if (action.type === 'next') goToNextSection();
      });
      state.queue = [];
    });
  }

  /* INICIALIZAÇÃO */
  function initController(route = 'intro') {
    if (JC.initialized) {
      log('Controlador já inicializado, ignorando');
      return;
    }
    JC.initialized = true;
    log('Inicializando controlador...');

    if (!global.__currentSectionId) {
      global.__currentSectionId = (route === 'intro') ? 'section-intro' : route;
    }
    state.currentSection = global.__currentSectionId;

    global.JORNADA_BLOCKS = global.JORNADA_BLOCKS || [];
    global.JORNADA_VIDEOS = global.JORNADA_VIDEOS || {};

    // Esconde todas as seções exceto a inicial
    document.querySelectorAll('.j-section, section').forEach(sec => {
      hide(sec);
      sec.classList.remove('active');
    });

    bindGlobalEvents();

    const tryShowInitial = (attempt = 0, max = 5) => {
      const el = document.getElementById(state.currentSection);
      if (el) {
        showSection(state.currentSection);
        handleSectionSpecificLogic(state.currentSection);
      } else if (attempt < max) {
        log(`Tentativa ${attempt + 1}: aguardando ${state.currentSection}`);
        setTimeout(() => tryShowInitial(attempt + 1, max), 400);
      } else {
        console.error('[CONTROLLER] Não foi possível encontrar a seção inicial');
      }
    };
    tryShowInitial();

    global.readText = global.readText || function (text, cb) {
      if (!('speechSynthesis' in window)) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = i18n.lang || 'pt-BR';
      utter.onend = () => { if (cb) cb(); };
      utter.onerror = e => console.error('[CONTROLLER] TTS error:', e);
      window.speechSynthesis.speak(utter);
    };

    log('Controlador inicializado com sucesso');
  }

  /* BOOTSTRAP */
  function bootstrapController() {
    if (JC.initialized || global.__ControllerBooting) {
      log('Bootstrap ignorado (já inicializado ou em andamento)');
      return;
    }
    global.__ControllerBooting = true;
    log('Bootstrap inicial do controller...');

    const i18nPromise = (i18n && typeof i18n.init === 'function')
      ? i18n.init().catch(() => {})
      : Promise.resolve();

    i18nPromise.finally(() => {
      initController(global.__currentSectionId || 'intro');
    });
  }

  if (!global.__ControllerEventsBound) {
    document.addEventListener('DOMContentLoaded', bootstrapController, { once: true });
    document.addEventListener('bootstrapComplete', bootstrapController, { once: true });
  }

  global.initController = initController;
  global.showSection = showSection;
  global.goToNextSection = goToNextSection;

})(window);
