/* jornada-controller.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.__JornadaControllerReady) {
    console.log('[CONTROLLER] Já carregado, ignorando');
    return;
  }
  global.__JornadaControllerReady = true;

  const i18n = global.i18n || {
    lang: 'pt-BR', ready: false,
    t: (k, f) => f || k, apply: () => {},
    waitForReady: async () => {}, init: async () => {}
  };

  const TypingBridge = global.TypingBridge || {};
  const playTyping =
    (TypingBridge && typeof TypingBridge.play === 'function')
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

  const controllerLog = (...a) => console.log('[CONTROLLER]', ...a);

  let isProcessingClick = false;
  let queue = [];
  const sections = global.sections || [
    'section-intro','section-termos','section-senha',
    'section-guia','section-selfie','section-perguntas','section-final'
  ];
  let currentSection = global.currentSection || 'section-intro';
  const answeredQuestions = global.answeredQuestions || new Set();

  global.controllerLog = controllerLog;
  global.sections = sections;
  global.currentSection = currentSection;

  const JC = global.JC || {
    currentBloco: 0, currentPergunta: 0,
    nextSection: null, goNext: () => goToNextSection(),
    initialized: false
  };
  global.JC = JC;

  function enqueueAction(action) {
    queue.push(action);
    controllerLog('Ação enfileirada:', action.type);
  }

  function processQueue() {
    const pending = queue.slice();
    queue = [];
    pending.forEach(a => { if (a.type === 'next') goToNextSection(); });
    controllerLog('Fila processada, ações executadas:', pending.length);
  }

  function debounceClick(callback, wait = 500) {
    return (...args) => {
      if (isProcessingClick) { controllerLog('Clique ignorado (debounce)'); return; }
      isProcessingClick = true;
      const ev = args[0];
      const btn = ev && ev.target ? ev.target : null;
      if (btn) btn.innerHTML = i18n.t('btn_carregando', 'Carregando...');
      setTimeout(() => {
        isProcessingClick = false;
        if (btn) btn.innerHTML = i18n.t('btn_avancar', 'Avançar');
      }, wait);
      callback(...args);
    };
  }

  function showSectionAndType(nextEl) {
    if (!nextEl) return;
    nextEl.classList.add('active');
    nextEl.classList.remove('section-hidden');
    controllerLog(`Seção exibida: #${nextEl.id}`);
    if (typeof playTyping === 'function') {
      playTyping(nextEl, () => controllerLog('Digitação concluída em', nextEl.id));
    }
  }

  async function goToNextSection() {
    const idx = sections.indexOf(currentSection);
    controllerLog('Índice atual:', idx, 'Seção atual:', currentSection);

    if (idx >= sections.length - 1) return;

    const prev = currentSection;
    currentSection = (JC.nextSection && sections.includes(JC.nextSection))
      ? JC.nextSection : sections[idx + 1];
    controllerLog(`Navegando de ${prev} para ${currentSection}`);

    const prevEl = document.querySelector('#' + prev);
    if (prevEl) { prevEl.classList.remove('active'); prevEl.classList.add('section-hidden'); }

    const nextEl = document.querySelector('#' + currentSection);
    if (!nextEl) { console.error('[CONTROLLER] Seção não encontrada:', currentSection); return; }
    showSectionAndType(nextEl);

    if (currentSection === 'section-termos') {
      const p1 = document.getElementById('termos-pg1');
      const p2 = document.getElementById('termos-pg2');
      if (p1 && p2) {
        p1.classList.remove('section-hidden');
        p2.classList.add('section-hidden');
        if (typeof playTyping === 'function') playTyping('#termos-pg1', () => controllerLog('Typing termos-pg1 ok'));
      }
    }
    else if (currentSection === 'section-guia') {
      try {
        const video = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro)
          ? global.JORNADA_VIDEOS.intro : '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
        fnLoadVideo(video);
      } catch(e){ console.error('[CONTROLLER] Vídeo guia:', e); }
    }
    else if (currentSection === 'section-selfie') {
      try {
        const video = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro)
          ? global.JORNADA_VIDEOS.intro : '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
        fnLoadVideo(video);
      } catch(e){ console.error('[CONTROLLER] Vídeo selfie:', e); }
    }
    else if (currentSection === 'section-perguntas') {
      try {
        await i18n.waitForReady(10000);
        if (!i18n.ready) throw new Error('i18n não inicializado');

        answeredQuestions.clear();
        JC.currentBloco = 0; JC.currentPergunta = 0;

        await fnLoadDynamicBlocks();
        await fnRenderQuestions();

        global.perguntasLoaded = true;
        controllerLog('Perguntas renderizadas');
      } catch (e) {
        console.error('[CONTROLLER] Perguntas:', e && e.message ? e.message : e);
        if (global.toast) global.toast(i18n.t('erro_perguntas','Erro ao carregar perguntas: ') + (e && e.message ? e.message : ''));
      }
    }
    else if (currentSection === 'section-final') {
      controllerLog('Jornada concluída! 🎉');
      try {
        const video = global.JORNADA_FINAL_VIDEO || (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.final);
        if (video) fnLoadVideo(video);
      } catch(e){ console.error('[CONTROLLER] Vídeo final:', e); }
    }
  }

  function initController(route = 'intro') {
    if (JC.initialized) { controllerLog('Já inicializado'); return; }
    JC.initialized = true;
    controllerLog('Inicializando controlador...');

    global.JORNADA_BLOCKS = global.JORNADA_BLOCKS || [];
    global.JORNADA_VIDEOS = global.JORNADA_VIDEOS || {};
    global.__currentSectionId = route === 'intro' ? 'section-intro' : route;
    currentSection = global.__currentSectionId;

    const tryInit = (max = 5, ms = 500) => {
      let at = 0;
      const tick = () => {
        const el = document.querySelector('#' + currentSection);
        if (el) { showSectionAndType(el); }
        else if (at++ < max) { controllerLog(`Tentativa ${at}: aguardando ${currentSection}`); setTimeout(tick, ms); }
        else { console.error('[CONTROLLER] Seção inicial não encontrada:', currentSection); }
      };
      tick();
    };
    tryInit();

    global.readText = global.readText || function (text, cb) {
      if (!('speechSynthesis' in global)) { console.error('[CONTROLLER] Web Speech não suportado'); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = i18n.lang || 'pt-BR'; u.rate = 1; u.pitch = 1; u.volume = 1;
      u.onend = () => { controllerLog('Leitura ok'); if (cb) cb(); };
      u.onerror = (e) => console.error('[CONTROLLER] TTS erro:', e);
      global.speechSynthesis.speak(u);
    };

    const debouncedNext = debounceClick((e) => goToNextSection());
    document.querySelectorAll(
      '.btn-avancar,[data-action="avancar"],#iniciar,[data-action="skip-selfie"],[data-action="select-guia"],#btnSkipSelfie,#btnStartJourney,#iniciarSenha,[data-action="termos-next"]'
    ).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        controllerLog('Avançar clicado:', btn.id || btn.className);
        debouncedNext(e);
      });
    });

    document.querySelectorAll('[data-action="termos-prev"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const p1 = document.getElementById('termos-pg1');
        const p2 = document.getElementById('termos-pg2');
        if (p2 && !p2.classList.contains('section-hidden')) {
          p2.classList.add('section-hidden');
          p1.classList.remove('section-hidden');
          if (typeof playTyping === 'function') playTyping('#termos-pg1', () => controllerLog('Typing termos-pg1 ok'));
        }
      });
    });

    document.addEventListener('questionAnswered', (ev) => {
      const id = ev && ev.detail ? ev.detail.questionId : '(?)';
      answeredQuestions.add(id);
      controllerLog(`Pergunta respondida: ${id} Total: ${answeredQuestions.size}`);
      goToNextSection();
    });

    document.addEventListener('videoSkipped', () => {
      controllerLog('Vídeo pulado');
      goToNextSection();
    });

    global.goToNextSection = () => {
      if (JC.initialized) goToNextSection();
      else enqueueAction({ type: 'next' });
    };

    document.addEventListener('jc:ready', processQueue);
    controllerLog('Controlador inicializado com sucesso');
  }

  function initializeController() {
    if (!JC.initialized) {
      controllerLog('Bootstrap inicial do controller...');
      const maybeInit = (i18n && typeof i18n.init === 'function')
        ? i18n.init().catch(() => {})
        : Promise.resolve();
      Promise.resolve(maybeInit).finally(() => {
        initController('intro');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initializeController, { once: true });
  document.addEventListener('bootstrapComplete', initializeController, { once: true });

  global.initController = initController;

})(window);
