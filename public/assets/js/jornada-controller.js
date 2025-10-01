/* jornada-controller.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.__JornadaControllerReady) {
    console.log('[CONTROLLER] Já carregado, ignorando');
    return;
  }
  global.__JornadaControllerReady = true;

  // i18n seguro (usa o global se existir)
  const i18n = global.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (k, fallback) => fallback || k,
    apply: () => {},
    waitForReady: async () => {},
    init: async () => { /* noop */ }
  };

  // Typing
  const TypingBridge = global.TypingBridge || {};
  const playTyping =
    (TypingBridge && typeof TypingBridge.play === 'function')
      ? TypingBridge.play
      : (typeof global.runTyping === 'function' ? global.runTyping : null);

  // Paper / Perguntas
  const Paper = global.JPaperQA || {};
  const fnLoadDynamicBlocks        = Paper.loadDynamicBlocks        || (async () => false);
  const fnRenderQuestions          = Paper.renderQuestions          || (async () => {});
  const fnLoadVideo                = Paper.loadVideo                || (() => {});
  const fnSetPergaminho            = Paper.setPergaminho            || (() => {});
  const fnEnsureCanvas             = Paper.ensureCanvas             || (() => {});
  const fnTypeQuestionsSequentially= Paper.typeQuestionsSequentially|| (() => {});
  const fnTypePlaceholder          = Paper.typePlaceholder          || (async () => {});

  // Log
  const controllerLog = (...args) => console.log('[CONTROLLER]', ...args);

  // Estado
  let isProcessingClick = false;
  let queue = [];
  const sections = global.sections || [
    'section-intro',
    'section-termos',
    'section-senha',
    'section-guia',
    'section-selfie',
    'section-perguntas',
    'section-final'
  ];
  let currentSection = global.currentSection || 'section-intro';
  const answeredQuestions = global.answeredQuestions || new Set();

  // Exposição global (compat)
  global.i18n = i18n;
  global.controllerLog = controllerLog;
  global.isProcessingClick = isProcessingClick;
  global.sections = sections;
  global.currentSection = currentSection;

  // Estado da jornada
  const JC = global.JC || {
    currentBloco: 0,
    currentPergunta: 0,
    nextSection: null,
    goNext: () => goToNextSection(),
    initialized: false
  };
  global.JC = JC;

  // Enfileira ações
  function enqueueAction(action) {
    queue.push(action);
    controllerLog('Ação enfileirada:', action.type);
  }

  // Processa fila
  function processQueue() {
    const pending = queue.slice();
    queue = [];
    pending.forEach(action => {
      if (action.type === 'next') {
        goToNextSection();
      }
    });
    controllerLog('Fila processada, ações executadas:', pending.length);
  }

  // Debounce de clique
  function debounceClick(callback, wait = 500) {
    return (...args) => {
      if (isProcessingClick) {
        controllerLog('Clique ignorado (debounce ativo)');
        return;
      }
      isProcessingClick = true;
      const ev = args[0];
      const button = ev && ev.target ? ev.target : null;
      if (button) button.innerHTML = i18n.t('btn_carregando', 'Carregando...');
      setTimeout(() => {
        isProcessingClick = false;
        if (button) button.innerHTML = i18n.t('btn_avancar', 'Avançar');
      }, wait);
      callback(...args);
    };
  }

  // Mostra seção com animação de digitação (se disponível)
  function showSectionAndType(nextElement) {
    if (!nextElement) return;
    nextElement.classList.add('active');
    nextElement.classList.remove('section-hidden');
    controllerLog(`Seção exibida: #${nextElement.id}`);

    // Toca digitação para o container inteiro (mais robusto)
    if (typeof playTyping === 'function') {
      playTyping(nextElement, () => {
        controllerLog('Digitação concluída em', nextElement.id);
      });
    } else {
      controllerLog('TypingBridge/runTyping indisponível');
    }
  }

  // Navega para a próxima seção
  async function goToNextSection() {
    const currentIdx = sections.indexOf(currentSection);
    controllerLog('Índice atual:', currentIdx, 'Seção atual:', currentSection);

    if (currentIdx < sections.length - 1) {
      const previousSection = currentSection;
      currentSection = (JC.nextSection && sections.includes(JC.nextSection))
        ? JC.nextSection
        : sections[currentIdx + 1];

      controllerLog(`Navegando de ${previousSection} para ${currentSection}`);

      const prevElement = document.querySelector(`#${previousSection}`);
      if (prevElement) {
        prevElement.classList.remove('active');
        prevElement.classList.add('section-hidden');
        controllerLog(`Seção anterior ${previousSection} ocultada`);
      } else {
        console.error(`[CONTROLLER] Seção anterior ${previousSection} não encontrada`);
      }

      const nextElement = document.querySelector(`#${currentSection}`);
      if (!nextElement) {
        console.error(`[CONTROLLER] Seção ${currentSection} não encontrada`);
        return;
      }

      showSectionAndType(nextElement);

      // Ações por seção
      if (currentSection === 'section-termos') {
        const termosPg1 = document.getElementById('termos-pg1');
        const termosPg2 = document.getElementById('termos-pg2');
        if (termosPg1 && termosPg2) {
          termosPg1.classList.remove('section-hidden');
          termosPg2.classList.add('section-hidden');
          controllerLog('Exibindo termos-pg1');
          if (typeof playTyping === 'function') {
            playTyping('#termos-pg1', () => controllerLog('Digitação de termos-pg1 concluída'));
          }
        }
      }

      else if (currentSection === 'section-guia') {
        try {
          const video = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro)
            ? global.JORNADA_VIDEOS.intro
            : '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
          fnLoadVideo(video);
          controllerLog('Vídeo do guia carregado');
        } catch (error) {
          console.error('[CONTROLLER] Erro ao carregar vídeo do guia:', error);
          global.showSection && global.showSection('section-guia');
        }
      }

      else if (currentSection === 'section-selfie') {
        try {
          const video = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro)
            ? global.JORNADA_VIDEOS.intro
            : '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
          fnLoadVideo(video);
          controllerLog('Vídeo da selfie carregado');
        } catch (error) {
          console.error('[CONTROLLER] Erro ao carregar vídeo da selfie:', error);
          global.showSection && global.showSection('section-selfie');
        }
      }

      else if (currentSection === 'section-perguntas') {
        try {
          await i18n.waitForReady(10000);
          if (!i18n.ready) throw new Error('i18n não inicializado');

          answeredQuestions.clear();
          JC.currentBloco = 0;
          JC.currentPergunta = 0;

          await fnLoadDynamicBlocks();
          await fnRenderQuestions();

          global.perguntasLoaded = true;
          controllerLog('Perguntas carregadas e renderizadas');
        } catch (error) {
          console.error('[CONTROLLER] Erro ao renderizar perguntas:', error && error.message ? error.message : error);
          if (global.toast) global.toast(i18n.t('erro_perguntas', 'Erro ao carregar perguntas: ') + (error && error.message ? error.message : ''));
        }
      }

      else if (currentSection === 'section-final') {
        controllerLog('Jornada concluída! 🎉');
        try {
          const video = global.JORNADA_FINAL_VIDEO || (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.final);
          if (video) {
            fnLoadVideo(video);
            controllerLog('Vídeo final carregado');
          }
        } catch (error) {
          console.error('[CONTROLLER] Erro ao carregar vídeo final:', error);
        }
      }
    }
  }

  // Inicializa o controlador
  function initController(route = 'intro') {
    if (JC.initialized) {
      controllerLog('Controlador já inicializado, pulando');
      return;
    }
    JC.initialized = true;
    controllerLog('Inicializando controlador...');

    global.JORNADA_BLOCKS = global.JORNADA_BLOCKS || [];
    global.JORNADA_VIDEOS = global.JORNADA_VIDEOS || {};
    controllerLog('JORNADA_BLOCKS:', global.JORNADA_BLOCKS);
    controllerLog('JORNADA_VIDEOS:', global.JORNADA_VIDEOS);

    global.__currentSectionId = route === 'intro' ? 'section-intro' : route;
    currentSection = global.__currentSectionId;

    const tryInitializeSection = (maxAttempts = 5, interval = 500) => {
      let attempts = 0;
      const tryExecute = () => {
        const initialElement = document.querySelector(`#${currentSection}`);
        if (initialElement) {
          showSectionAndType(initialElement);
        } else if (attempts < maxAttempts) {
          attempts++;
          controllerLog(`Tentativa ${attempts}: seção ${currentSection} não encontrada, tentando novamente...`);
          setTimeout(tryExecute, interval);
        } else {
          console.error(`[CONTROLLER] Falha após ${maxAttempts} tentativas: seção ${currentSection} não encontrada`);
        }
      };
      tryExecute();
    };

    tryInitializeSection();

    // TTS utilitário (global)
    global.readText = global.readText || function (text, callback) {
      if ('speechSynthesis' in global) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = i18n.lang || 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => {
          controllerLog('Leitura concluída para:', text);
          if (callback) callback();
        };
        utterance.onerror = (error) => {
          console.error('[CONTROLLER] Erro na leitura:', error);
        };
        global.speechSynthesis.speak(utterance);
        controllerLog('Iniciando leitura de:', text);
      } else {
        console.error('[CONTROLLER] API Web Speech não suportada neste navegador');
      }
    };

    // Botões que avançam
    const debouncedGoNext = debounceClick((e) => goToNextSection());
    document
      .querySelectorAll(
        '.btn-avancar, [data-action="avancar"], #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney, #iniciarSenha, [data-action="termos-next"]'
      )
      .forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          controllerLog('Botão avançar clicado:', button.id || button.className);
          debouncedGoNext(e);
        });
      });

    // Termos voltar
    document.querySelectorAll('[data-action="termos-prev"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const termosPg1 = document.getElementById('termos-pg1');
        const termosPg2 = document.getElementById('termos-pg2');
        if (termosPg2 && !termosPg2.classList.contains('section-hidden')) {
          termosPg2.classList.add('section-hidden');
          termosPg1.classList.remove('section-hidden');
          controllerLog('Voltando de termos-pg2 para termos-pg1');
          if (typeof playTyping === 'function') {
            playTyping('#termos-pg1', () => controllerLog('Digitação de termos-pg1 concluída'));
          }
        }
      });
    });

    // Eventos de fluxo
    document.addEventListener('questionAnswered', (event) => {
      const questionId = event && event.detail ? event.detail.questionId : '(desconhecida)';
      answeredQuestions.add(questionId);
      controllerLog(`Pergunta respondida: ${questionId}, Total respondidas: ${answeredQuestions.size}`);
      goToNextSection();
    });

    document.addEventListener('videoSkipped', () => {
      controllerLog('Vídeo pulado, avançando...');
      goToNextSection();
    });

    // API global
    global.goToNextSection = () => {
      if (JC.initialized) {
        goToNextSection();
      }
