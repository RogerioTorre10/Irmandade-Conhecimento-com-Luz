/* jornada-controller.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.__JornadaControllerReady) {
    console.log('[CONTROLLER] Já carregado, ignorando');
    return;
  }
  global.__JornadaControllerReady = true;

  // i18n seguro
  const i18n = global.i18n || {
    lang: 'pt-BR', ready: false,
    t: (k, f) => f || k, apply: () => {},
    waitForReady: async () => {}, init: async () => {}
  };

  // Typing
  const TypingBridge = global.TypingBridge || {};
  const playTyping =
    (TypingBridge && typeof TypingBridge.play === 'function')
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

  const log = (...a) => console.log('[CONTROLLER]', ...a);

  // Estado
  let isProcessingClick = false;
  let queue = [];
  const sections = global.sections || [
    'section-intro','section-termos','section-senha',
    'section-guia','section-selfie','section-perguntas','section-final'
  ];
  let currentSection = global.currentSection || 'section-intro';
  const answeredQuestions = global.answeredQuestions || new Set();

  global.sections = sections;
  global.currentSection = currentSection;

  const JC = global.JC || {
    currentBloco: 0, currentPergunta: 0,
    nextSection: null, goNext: () => goToNextSection(),
    initialized: false
  };
  global.JC = JC;

  // ===== helpers =====
  function debounceClick(callback, wait = 500) {
    return (...args) => {
      if (isProcessingClick) { log('Clique ignorado (debounce)'); return; }
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

  // Garante que elementos de um container tenham data-typing
  function ensureTypingAttrs(container) {
    if (!container) return;
    // Se já há [data-typing], ótimo; senão, promovemos h*, p, .text
    const candidates = container.querySelectorAll('h1,h2,h3,h4,p,.text');
    candidates.forEach(el => {
      if (!el.hasAttribute('data-typing')) {
        el.setAttribute('data-typing', 'true');
        el.setAttribute('data-speed', '36');
        el.setAttribute('data-cursor', 'true');
      }
    });
  }

  // Cria botão se não existir
  function ensureButton(container, { id, text, attrs = {}, onClick }) {
    if (!container) return null;
    let btn = container.querySelector('#' + id + ', button#' + id + ', [data-id="' + id + '"]');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.className = 'btn btn-avancar';
      btn.textContent = text;
      Object.keys(attrs).forEach(k => btn.setAttribute(k, attrs[k]));
      container.appendChild(btn);
    }
    if (onClick) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        onClick(e);
      });
    }
    return btn;
  }

  function show(el) { if (el) { el.classList.remove('section-hidden'); el.style.display = ''; } }
  function hide(el) { if (el) { el.classList.add('section-hidden'); el.style.display = 'none'; } }

  function showSectionAndType(nextEl) {
    if (!nextEl) return;
    nextEl.classList.add('active');
    nextEl.classList.remove('section-hidden');
    log(`Seção exibida: #${nextEl.id}`);
    if (typeof playTyping === 'function') {
      playTyping(nextEl, () => log('Digitação concluída em', nextEl.id));
    }
  }
  function show(el) {
    if (el) {
    el.classList.remove('hidden'); // ← esta linha resolve o problema
    el.classList.remove('section-hidden');
    el.style.display = '';
  }
}

  
  // ===== fluxo =====
  function enqueueAction(action) { queue.push(action); }
  function processQueue() {
    const pending = queue.slice(); queue = [];
    pending.forEach(a => { if (a.type === 'next') goToNextSection(); });
  }

  // Navegação principal
  async function goToNextSection() {
    const idx = sections.indexOf(currentSection);
    log('Índice atual:', idx, 'Seção atual:', currentSection);
    if (idx >= sections.length - 1) return;

    const prev = currentSection;
    currentSection = (JC.nextSection && sections.includes(JC.nextSection))
      ? JC.nextSection : sections[idx + 1];
    log(`Navegando de ${prev} para ${currentSection}`);

    const prevEl = document.querySelector('#' + prev);
    if (prevEl) { prevEl.classList.remove('active'); prevEl.classList.add('section-hidden'); }

    const nextEl = document.querySelector('#' + currentSection);
    if (!nextEl) { console.error('[CONTROLLER] Seção não encontrada:', currentSection); return; }
    showSectionAndType(nextEl);

    // ===== regras por seção =====
    if (currentSection === 'section-termos') {
      // páginas internas
      const pg1 = document.getElementById('termos-pg1');
      const pg2 = document.getElementById('termos-pg2');

      // se não existir, não travar
      if (!pg1 && !pg2) {
        console.warn('[CONTROLLER] termos-pg1/pg2 não encontrados; seguindo fluxo padrão');
        return;
      }

      // typing garantido
      ensureTypingAttrs(pg1);
      ensureTypingAttrs(pg2);

      // exibir pg1, ocultar pg2
      show(pg1); hide(pg2);

      // garante botões
      const navWrap1 = pg1.querySelector('.termos-actions') || pg1;
      const navWrap2 = pg2 ? (pg2.querySelector('.termos-actions') || pg2) : null;

      // “Próximo” dentro dos termos (pg1 -> pg2)
      ensureButton(navWrap1, {
        id: 'btn-termos-next',
        text: i18n.t('btn_avancar', 'Avançar'),
        attrs: { 'data-action': 'termos-next' },
        onClick: () => {
          hide(pg1); show(pg2);
          if (typeof playTyping === 'function') playTyping(pg2, () => log('Typing termos-pg2 ok'));
        }
      });

      // “Voltar” (pg2 -> pg1), se existir segunda página
      if (pg2) {
        ensureButton(navWrap2, {
          id: 'btn-termos-prev',
          text: i18n.t('btn_voltar', 'Voltar'),
          attrs: { 'data-action': 'termos-prev' },
          onClick: () => { hide(pg2); show(pg1); if (typeof playTyping === 'function') playTyping(pg1); }
        });

        // “Aceito / Continuar” (pg2 -> próxima seção real)
        ensureButton(navWrap2, {
          id: 'btn-termos-accept',
          text: i18n.t('btn_aceito_continuar', 'Aceito e quero continuar'),
          attrs: { 'data-action': 'termos-accept' },
          onClick: () => {
            // segue o fluxo normal da jornada
            const debounced = debounceClick(() => {
              // garante que vamos à próxima seção da lista
              JC.nextSection = null;
              goToNextSection();
            }, 300);
            debounced();
          }
        });
      }

      // dispara typing da pg1
      if (typeof playTyping === 'function') playTyping(pg1, () => log('Typing termos-pg1 ok'));
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
        log('Perguntas renderizadas');
      } catch (e) {
        console.error('[CONTROLLER] Perguntas:', e && e.message ? e.message : e);
        if (global.toast) global.toast(i18n.t('erro_perguntas','Erro ao carregar perguntas: ') + (e && e.message ? e.message : ''));
      }
    }

    else if (currentSection === 'section-final') {
      log('Jornada concluída! 🎉');
      try {
        const video = global.JORNADA_FINAL_VIDEO || (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.final);
        if (video) fnLoadVideo(video);
      } catch(e){ console.error('[CONTROLLER] Vídeo final:', e); }
    }
  }

  // ===== init =====
  function initController(route = 'intro') {
    if (JC.initialized) { log('Já inicializado'); return; }
    JC.initialized = true;
    log('Inicializando controlador...');

    global.JORNADA_BLOCKS = global.JORNADA_BLOCKS || [];
    global.JORNADA_VIDEOS = global.JORNADA_VIDEOS || {};
    global.__currentSectionId = route === 'intro' ? 'section-intro' : route;
    currentSection = global.__currentSectionId;

    // botões “avançar” globais (NÃO inclui termos-next; termos é tratado dentro da seção)
    const debouncedNext = debounceClick((e) => goToNextSection());
    document.querySelectorAll(
      '.btn-avancar,[data-action="avancar"],#iniciar,[data-action="skip-selfie"],[data-action="select-guia"],#btnSkipSelfie,#btnStartJourney,#iniciarSenha'
    ).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        log('Avançar clicado:', btn.id || btn.className);
        debouncedNext(e);
      });
    });

    // atalhos dos termos (caso já existam no DOM ao iniciar)
    document.querySelectorAll('[data-action="termos-prev"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pg1 = document.getElementById('termos-pg1');
        const pg2 = document.getElementById('termos-pg2');
        if (pg2) { hide(pg2); show(pg1); if (typeof playTyping === 'function') playTyping(pg1); }
      });
    });
    document.querySelectorAll('[data-action="termos-next"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pg1 = document.getElementById('termos-pg1');
        const pg2 = document.getElementById('termos-pg2');
        if (pg2) { hide(pg1); show(pg2); if (typeof playTyping === 'function') playTyping(pg2); }
        else { goToNextSection(); } // se não houver pg2, segue jornada
      });
    });

    // seção inicial
    const tryInit = (max = 5, ms = 500) => {
      let at = 0;
      const tick = () => {
        const el = document.querySelector('#' + currentSection);
        if (el) { showSectionAndType(el); }
        else if (at++ < max) { log(`Tentativa ${at}: aguardando ${currentSection}`); setTimeout(tick, ms); }
        else { console.error('[CONTROLLER] Seção inicial não encontrada:', currentSection); }
      };
      tick();
    };
    tryInit();

    // utilitário TTS
    global.readText = global.readText || function (text, cb) {
      if (!('speechSynthesis' in global)) { console.error('[CONTROLLER] Web Speech não suportado'); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = i18n.lang || 'pt-BR'; u.rate = 1; u.pitch = 1; u.volume = 1;
      u.onend = () => { log('Leitura ok'); if (cb) cb(); };
      u.onerror = (e) => console.error('[CONTROLLER] TTS erro:', e);
      global.speechSynthesis.speak(u);
    };

    // eventos de fluxo
    document.addEventListener('questionAnswered', (ev) => {
      const id = ev && ev.detail ? ev.detail.questionId : '(?)';
      answeredQuestions.add(id);
      log(`Pergunta respondida: ${id} Total: ${answeredQuestions.size}`);
      goToNextSection();
    });

    document.addEventListener('videoSkipped', () => {
      log('Vídeo pulado');
      goToNextSection();
    });

    // fila
    document.addEventListener('jc:ready', processQueue);
    log('Controlador inicializado com sucesso');
  }

  function initializeController() {
    if (!JC.initialized) {
      log('Bootstrap inicial do controller...');
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
