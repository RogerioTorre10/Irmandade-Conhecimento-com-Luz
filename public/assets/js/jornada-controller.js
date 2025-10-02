/* jornada-controller.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------
   *  GUARD: evita carregamento duplicado
   * -------------------------------------------------------------- */
  if (global.__JornadaControllerReady) {
    console.log('[CONTROLLER] Já carregado, ignorando');
    return;
  }
  global.__JornadaControllerReady = true;

  /* --------------------------------------------------------------
   *  FLAGS DE BOOTSTRAP (evita corrida entre DOMContentLoaded e bootstrapComplete)
   * -------------------------------------------------------------- */
  if (global.__ControllerBooting === undefined) global.__ControllerBooting = false;
  if (global.__ControllerEventsBound === undefined) global.__ControllerEventsBound = false;

  /* --------------------------------------------------------------
   *  DEPENDÊNCIAS SEGURAS
   * -------------------------------------------------------------- */
  const i18n = global.i18n || {
    lang: 'pt-BR', ready: false,
    t: (k, f) => f || k,
    apply: () => {},
    waitForReady: async () => {},
    init: async () => {}
  };

  // TypingBridge – aceita tanto TypingBridge.play quanto runTyping
  const TypingBridge = global.TypingBridge || {};
  const playTyping = (TypingBridge && typeof TypingBridge.play === 'function')
    ? TypingBridge.play
    : (typeof global.runTyping === 'function' ? global.runTyping : null);

  // Paper / Perguntas
  const Paper = global.JPaperQA || {};
  const fnLoadDynamicBlocks = Paper.loadDynamicBlocks || (async () => false);
  const fnRenderQuestions   = Paper.renderQuestions   || (async () => {});
  const fnLoadVideo         = Paper.loadVideo         || (() => {});
  const fnSetPergaminho     = Paper.setPergaminho     || (() => {});
  const fnEnsureCanvas      = Paper.ensureCanvas      || (() => {});
  const fnTypeSeq           = Paper.typeQuestionsSequentially || (() => {});
  const fnTypePh            = Paper.typePlaceholder   || (async () => {});

  const log = (...args) => console.log('[CONTROLLER]', ...args);

  /* --------------------------------------------------------------
   *  ESTADO GLOBAL DA JORNADA
   * -------------------------------------------------------------- */
  const state = {
    sections: global.sections || [
      'section-intro', 'section-termos', 'section-senha',
      'section-guia', 'section-selfie', 'section-perguntas', 'section-final'
    ],
    currentSection: global.currentSection || 'section-intro',
    answeredQuestions: global.answeredQuestions || new Set(),
    isProcessingClick: false,
    queue: []                                   // ações enfileiradas (ex.: next)
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

  /* --------------------------------------------------------------
   *  HELPERS
   * -------------------------------------------------------------- */
  // debounce genérico (usado apenas nos botões globais)
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

  // garante atributos de digitação em todos os elementos de texto
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

  // cria (ou reutiliza) botão isolado – NÃO usa classes que acionam o listener global
  function createIsolatedButton(parent, { id, text, dataset = {}, onClick }) {
    if (!parent) return null;
    let btn = parent.querySelector(`#${id}, [data-id="${id}"]`);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.className = 'btn btn-termos';               // classe própria, não .btn-avancar
      btn.textContent = text;
      Object.entries(dataset).forEach(([k, v]) => btn.dataset[k] = v);
      parent.appendChild(btn);
    }
    // remove handlers antigos (clone‑replace trick)
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

  // visibilidade simples
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

  /* --------------------------------------------------------------
   *  NAVEGAÇÃO PRINCIPAL
   * -------------------------------------------------------------- */
  function showSection(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) {
      console.error(`[CONTROLLER] Seção não encontrada: ${id}`);
      return;
    }

    // esconde todas
    document.querySelectorAll('.j-section, section').forEach(sec => {
      hide(sec);
      sec.classList.remove('active');
    });

    // mostra a nova
    show(el);
    el.classList.add('active');
    state.currentSection = id;
    log(`Seção exibida: #${id}`);

    // inicia digitação (se houver ponte)
    if (typeof playTyping === 'function') {
      // pequeno delay garante que o DOM já está visível
      setTimeout(() => playTyping(el, () => log('Digitação concluída em', id)), 80);
    }
  }

  function goToNextSection() {
    const idx = state.sections.indexOf(state.currentSection);
    if (idx === -1 || idx >= state.sections.length - 1) {
      log('Fim da jornada');
      return;
    }
    const nextId = state.sections[idx + 1];
    JC.nextSection = null;               // limpa eventual override
    showSection(nextId);
    handleSectionSpecificLogic(nextId);
  }

  /* --------------------------------------------------------------
   *  LÓGICA ESPECÍFICA POR SEÇÃO
   * -------------------------------------------------------------- */
  function handleSectionSpecificLogic(sectionId) {
    /* ---------- TERMOS ---------- */
    if (sectionId === 'section-termos') {
      const pg1 = document.getElementById('termos-pg1');
      const pg2 = document.getElementById('termos-pg2');

      if (!pg1) {
        console.warn('[CONTROLLER] termos-pg1 não encontrado – pulando lógica interna');
        return;
      }

      // garante atributos de typing
      ensureTypingAttrs(pg1);
      if (pg2) ensureTypingAttrs(pg2);

      // estado inicial: pg1 visível, pg2 oculto
      show(pg1);
      if (pg2) hide(pg2);

      // containers para botões
      const nav1 = pg1.querySelector('.termos-actions') || pg1;
      const nav2 = pg2 ? (pg2.querySelector('.termos-actions') || pg2) : null;

      // Botão “Próxima página” (pg1 → pg2)
      createIsolatedButton(nav1, {
        id: 'btn-termos-next',
        text: i18n.t('btn_proxima_pagina', 'Próxima página'),
        dataset: { action: 'termos-next' },
        onClick: () => {
          hide(pg1);
          if (pg2) show(pg2);
          if (typeof playTyping === 'function') {
            setTimeout(() => playTyping(pg2, () => log('typing pg2 ok')), 80);
          }
        }
      });

      // Botões da pg2 (se existir)
      if (pg2 && nav2) {
        // Voltar
        createIsolatedButton(nav2, {
          id: 'btn-termos-prev',
          text: i18n.t('btn_voltar', 'Voltar'),
          dataset: { action: 'termos-prev' },
          onClick: () => {
            hide(pg2);
            show(pg1);
            if (typeof playTyping === 'function') {
              setTimeout(() => playTyping(pg1, () => log('typing pg1 ok')), 80);
            }
          }
        });

        // Aceitar e avançar para próxima seção da jornada
        createIsolatedButton(nav2, {
          id: 'btn-termos-accept',
          text: i18n.t('btn_aceito_continuar', 'Aceito e quero continuar'),
          dataset: { action: 'termos-accept' },
          onClick: debounceClick(() => goToNextSection(), 300)
        });
      }

      // inicia digitação da pg1
      if (typeof playTyping === 'function') {
        setTimeout(() => playTyping(pg1, () => log('typing pg1 ok')), 80);
      }
    }

    /* ---------- GUIA (vídeo) ---------- */
    else if (sectionId === 'section-guia' || sectionId === 'section-selfie') {
      try {
        const videoUrl = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro) ||
                         '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
        fnLoadVideo(videoUrl);
      } catch (e) {
        console.error('[CONTROLLER] Erro ao carregar vídeo:', e);
      }
    }

    /* ---------- PERGUNTAS ---------- */
    else if (sectionId === 'section-perguntas') {
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
    }

    /* ---------- FINAL ---------- */
    else if (sectionId === 'section-final') {
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

  /* --------------------------------------------------------------
   *  EVENTOS GLOBAIS
   * -------------------------------------------------------------- */
  function bindGlobalEvents() {
    if (global.__ControllerEventsBound) return;
    global.__ControllerEventsBound = true;

    // ---------- AVANÇAR (botões fora dos termos) ----------
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
        // Ignora cliques que acontecem dentro da seção termos (já tratado internamente)
        if (e.target.closest('#section-termos')) return;
        log('Botão global avançar clicado');
        debouncedNext(e);
      });
    });

    // ---------- ATALHOS DE TERMOS (caso já existam no DOM) ----------
    document.querySelectorAll('[data-action="termos-prev"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const pg1 = document.getElementById('termos-pg1');
        const pg2 = document.getElementById('termos-pg2');
        if (pg2) {
          hide(pg2); show(pg1);
          if (typeof playTyping === 'function') playTyping(pg1);
        }
      });
    });
    document.querySelectorAll('[data-action="termos-next"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const pg1 = document.getElementById('termos-pg1');
        const pg2 = document.getElementById('termos-pg2');
        if (pg2) {
          hide(pg1); show(pg2);
          if (typeof playTyping === 'function') playTyping(pg2);
        } else {
          goToNextSection(); // fallback se não houver pg2
        }
      });
    });

    // ---------- RESPOSTAS DE PERGUNTAS ----------
    document.addEventListener('questionAnswered', ev => {
      const qId = ev?.detail?.questionId || '(?)';
      state.answeredQuestions.add(qId);
      log(`Pergunta respondida: ${qId} (total ${state.answeredQuestions.size})`);
      goToNextSection();
    });

    // ---------- PULO DE VÍDEO ----------
    document.addEventListener('videoSkipped', () => {
      log('Vídeo pulado');
      goToNextSection();
    });

    // ---------- FILA DE AÇÕES ----------
    document.addEventListener('jc:ready', () => {
      state.queue.forEach(action => {
        if (action.type === 'next') goToNextSection();
      });
      state.queue = [];
    });
  }

  /* --------------------------------------------------------------
   *  INICIALIZAÇÃO
   * -------------------------------------------------------------- */
  function initController(route = 'intro') {
    if (JC.initialized) {
      log('Controlador já inicializado, ignorando');
      return;
    }
    JC.initialized = true;
    log('Inicializando controlador...');

    // Define seção inicial (não sobrescreve se já houver)
    if (!global.__currentSectionId) {
      global.__currentSectionId = (route === 'intro') ? 'section-intro' : route;
    }
    state.currentSection = global.__currentSectionId;

    // Garante objetos globais auxiliares
    global.JORNADA_BLOCKS = global.JORNADA_BLOCKS || [];
    global.JORNADA_VIDEOS = global.JORNADA_VIDEOS || {};

    // Bind de eventos globais
    bindGlobalEvents();

    // Mostra a primeira seção (com retry caso o DOM ainda não esteja pronto)
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

    // Utilitário TTS (se precisar)
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

  /* --------------------------------------------------------------
   *  BOOTSTRAP À PROVA DE CORRIDA
   * -------------------------------------------------------------- */
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
      // Se ainda não houver uma rota definida, usa intro
      const startRoute = global.__currentSectionId || 'intro';
      initController(startRoute);
      // Não limpamos __ControllerBooting – assim garantimos que só rode uma vez
    });
  }

  // Registra listeners que disparam o bootstrap
  if (!global.__ControllerEventsBound) {
    document.addEventListener('DOMContentLoaded', bootstrapController, { once: true });
    document.addEventListener('bootstrapComplete', bootstrapController, { once: true });
  }

  /* --------------------------------------------------------------
   *  EXPORTA FUNÇÕES (se precisar chamar de outro script)
   * -------------------------------------------------------------- */
  global.initController = initController;
  global.showSection = showSection;
  global.goToNextSection = goToNextSection;

})(window);
