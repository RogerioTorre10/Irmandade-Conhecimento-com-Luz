/* jornada-controller.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.__JornadaControllerReady) {
    console.log('[CONTROLLER] Já carregado, ignorando');
    return;
  }
  global.__JornadaControllerReady = true;
  // ===== FIX: flags globais anti-corrida =====
if (global.__ControllerBooting === undefined) global.__ControllerBooting = false;
if (global.__ControllerEventsBound === undefined) global.__ControllerEventsBound = false;


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
    // NÃO usar .btn-avancar aqui para não ativar o listener global
    btn.className = 'btn btn-termos'; // estilize igual no CSS, se quiser
    btn.textContent = text;
    Object.keys(attrs).forEach(k => btn.setAttribute(k, attrs[k]));
    container.appendChild(btn);
  }
  if (onClick) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // blindagem: não deixa o clique “subir” para listeners globais
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
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
// SUBSTITUA toda a função por esta
async function goToNextSection() {
  // ===== GATE DE TERMOS (não deixa sair da seção sem pg1→pg2→aceite) =====
  const inTermosNow =
    currentSection === 'section-termos' ||
    (document.getElementById('section-termos')?.classList.contains('active'));

  if (inTermosNow && !global.__termsAccepted) {
    const pg1 = document.getElementById('termos-pg1');
    const pg2 = document.getElementById('termos-pg2');

    // inicializa passo interno
    if (!global.__termsStep) global.__termsStep = 1;

    // garante atributos de digitação e estado inicial coerente
    ensureTypingAttrs(pg1);
    ensureTypingAttrs(pg2);

    // força pg1 visível na 1ª chegada
    if (global.__termsStep === 1) {
      show(pg1); hide(pg2);
    }

    if (global.__termsStep === 1) {
      // 1º NEXT dentro de termos: pg1 -> pg2
      hide(pg1); show(pg2);
      if (typeof playTyping === 'function') setTimeout(() => playTyping(pg2), 60);
      global.__termsStep = 2;
      console.log('[CONTROLLER] Termos gate: pg1 → pg2 (bloqueando avanço de seção)');
      return; // BLOQUEIA avanço de seção
    }

    if (global.__termsStep === 2) {
      // 2º NEXT: só libera se tiver aceite marcado (se existir checkbox)
      const chk = document.querySelector('#termos-aceite, input[name="termos-aceite"]');
      if (chk && !chk.checked) {
        global.toast && global.toast(i18n.t('aceite_necessario','Você precisa aceitar os termos para continuar.'));
        console.log('[CONTROLLER] Termos gate: aceite necessário');
        return; // BLOQUEIA enquanto não aceitar
      }
      global.__termsAccepted = true; // liberado
      console.log('[CONTROLLER] Termos gate: aceito = true, pode avançar');
      // segue para fluxo normal abaixo
    }
  }
  // ===== FIM GATE DE TERMOS =====

  const currentIdx = sections.indexOf(currentSection);
  log('Índice atual:', currentIdx, 'Seção atual:', currentSection);

  if (currentIdx < sections.length - 1) {
    const previousSection = currentSection;
    currentSection = JC.nextSection && sections.includes(JC.nextSection)
      ? JC.nextSection
      : sections[currentIdx + 1];

    // marca estado global para anti-rollback
    global.__currentSectionId = currentSection;
    if (currentSection !== 'section-intro') global.__hasLeftIntro = true;

    log(`Navegando de ${previousSection} para ${currentSection}`);

    const prevElement = document.querySelector(`#${previousSection}`);
    if (prevElement) {
      prevElement.classList.remove('active');
      prevElement.classList.add('section-hidden');
      log(`Seção anterior ${previousSection} ocultada`);
    } else {
      console.error(`[CONTROLLER] Seção anterior ${previousSection} não encontrada`);
    }

    const nextElement = document.querySelector(`#${currentSection}`);
    if (nextElement) {
      nextElement.classList.add('active');
      nextElement.classList.remove('section-hidden');
      log(`Seção ${currentSection} exibida`);

      if (TypingBridge.play) {
        const typingElements = nextElement.querySelectorAll('[data-typing="true"]:not(.section-hidden)');
        if (typingElements.length) {
          TypingBridge.play(nextElement, () => {
            log('Digitação concluída em', currentSection);
            const first = typingElements[0];
            const text = first?.getAttribute('data-text') || first?.textContent || '';
            window.readText && window.readText(text);
          });
        } else {
          log('Nenhum elemento de digitação encontrado em', currentSection);
        }
      }
    } else {
      console.error(`[CONTROLLER] Seção ${currentSection} não encontrada`);
      return;
    }

    // ===== regras por seção =====
if (currentSection === 'section-termos') {
  const pg1 = document.getElementById('termos-pg1');
  const pg2 = document.getElementById('termos-pg2');

  // reseta gate e tranca a seção
  window.__termsStep = 1;
  window.__termsAccepted = false;
  lockTermosSection();

  ensureTypingAttrs(pg1);
  ensureTypingAttrs(pg2);
  show(pg1); hide(pg2);

  if (typeof playTyping === 'function') {
    setTimeout(() => playTyping(pg1, () => log('Typing termos-pg1 ok')), 60);
  }

  // NÃO AVANÇA DE SEÇÃO AQUI — fica trancado até aceitar
}


    else if (currentSection === 'section-guia') {
      try {
        const video = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro)
          ? global.JORNADA_VIDEOS.intro : '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
        fnLoadVideo(video);
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo do guia:', error);
        window.showSection && window.showSection('section-guia');
      }
    }

    else if (currentSection === 'section-selfie') {
      try {
        const video = (global.JORNADA_VIDEOS && global.JORNADA_VIDEOS.intro)
          ? global.JORNADA_VIDEOS.intro : '/assets/img/filme-0-ao-encontro-da-jornada.mp4';
        fnLoadVideo(video);
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo da selfie:', error);
        window.showSection && window.showSection('section-selfie');
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

        window.perguntasLoaded = true;
        log('Perguntas renderizadas');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao renderizar perguntas:', error.message);
        if (window.toast) window.toast(i18n.t('erro_perguntas', 'Erro ao carregar perguntas: ') + error.message);
      }
    }

    else if (currentSection === 'section-final') {
      log('Jornada concluída! 🎉');
      if (window.JORNADA_FINAL_VIDEO && fnLoadVideo) {
        fnLoadVideo(window.JORNADA_FINAL_VIDEO);
        log('Vídeo final carregado');
      }
    }
  }
}


  // ===== init =====
  function initController(route = 'intro') {
  if (JC.initialized) { log('Controlador já inicializado, pulando'); return; }
  JC.initialized = true;
  log('Inicializando controlador...');
  log('🔍 initController iniciado com route:', route);
 

  global.JORNADA_BLOCKS = global.JORNADA_BLOCKS || [];
  global.JORNADA_VIDEOS = global.JORNADA_VIDEOS || {};

  // 🚫 NÃO sobrescrever a seção atual se já foi definida
  if (!global.__currentSectionId) {
    global.__currentSectionId = (route === 'intro' ? 'section-intro' : route);
  }
  currentSection = global.__currentSectionId;

  // (restante da função continua igual…)


    // botões “avançar” globais (NÃO inclui termos-next; termos é tratado dentro da seção)
    const debouncedNext = debounceClick((e) => goToNextSection());
   document.querySelectorAll(
  '[data-action="avancar"], #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney, #iniciarSenha, .btn-section-next'
).forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    // evita interferir dentro de section-termos
    const inTermos = !!e.target.closest('#section-termos');
    if (inTermos) return; // Termos tem seu próprio fluxo
    log('Avançar (global) clicado:', button.id || button.className);
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
    
    JC.nextSection = 'section-termos';
       goToNextSection();

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

 // ===== FIX: inicialização à prova de corrida =====
function initializeController() {
  // evita reentrância (DOMContentLoaded + bootstrapComplete)
  if (JC.initialized || global.__ControllerBooting) {
    log('Bootstrap ignorado (já inicializado ou bootando)');
    return;
  }
  global.__ControllerBooting = true;
  log('Bootstrap inicial do controller...');

  const maybeInit = (i18n && typeof i18n.init === 'function')
    ? i18n.init().catch(() => {})
    : Promise.resolve();

  Promise.resolve(maybeInit).finally(() => {
    // só define rota inicial se ainda não foi definida
    if (!global.__currentSectionId) {
      initController('intro');
    } else {
      initController(global.__currentSectionId);
    }
    // Mantém travado para impedir boots subsequentes
    // (se preferir liberar depois, troque por: global.__ControllerBooting = false;)
  });
}

  if (!global.__ControllerEventsBound) {
  global.__ControllerEventsBound = true;
  document.addEventListener('DOMContentLoaded', initializeController, { once: true });
  document.addEventListener('bootstrapComplete', initializeController, { once: true });
}
    // ===== PATCH: bloquear regressão indevida para 'section-intro' =====
(function hardenShowSection(global){
  const originalShow = global.showSection;
  // deixa claro onde estamos
  global.__currentSectionId = global.__currentSectionId || 'section-intro';

  global.showSection = function(id){
    try {
      // se já saímos da intro, ignora qualquer tentativa de voltar implicitamente
      const cur = global.__currentSectionId;
      if (id === 'section-intro' && cur !== 'section-intro') {
        console.warn('[CONTROLLER] showSection("section-intro") bloqueado (já avançou).');
        return;
      }
      global.__currentSectionId = id;
      if (typeof originalShow === 'function') {
        return originalShow.apply(this, arguments);
      }
      // fallback simples se não houver função original
      document.querySelectorAll('[id^="section-"]').forEach(s => {
        s.classList.add('section-hidden'); s.classList.remove('active');
      });
      const nextEl = document.getElementById(id);
      if (nextEl) { nextEl.classList.remove('section-hidden'); nextEl.classList.add('active'); }
    } catch (e) {
      console.error('[CONTROLLER] showSection wrapper error:', e);
    }
  };
})(window);
// ===== PATCH: interceptar '.btn-avancar' dentro de #section-termos =====
(function shieldTermosButtons(global){
  const log = (...a) => console.log('[CONTROLLER:TERMOS_BTN]', ...a);

  // Captura no CAPTURE phase para parar listeners globais
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.btn-avancar');
    if (!btn) return;

    const inTermos = !!btn.closest('#section-termos');
    if (!inTermos) return;

    // Isola do mundo
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const pg1 = document.getElementById('termos-pg1');
    const pg2 = document.getElementById('termos-pg2');

    // Se não houver estrutura de páginas, segue fluxo normal
    if (!pg1 && !pg2) {
      log('Sem pg1/pg2 — seguindo fluxo normal');
      if (typeof global.goToNextSection === 'function') global.goToNextSection();
      return;
    }

    // typing helper
    const playTyping = (global.TypingBridge && typeof global.TypingBridge.play === 'function')
      ? global.TypingBridge.play
      : (typeof global.runTyping === 'function' ? global.runTyping : null);

    // Estado atual: se pg2 já está visível, tratamos como "aceitar/continuar"
    const pg2Visivel = pg2 && !pg2.classList.contains('section-hidden') && pg2.style.display !== 'none';

    if (!pg2Visivel) {
      // pg1 -> pg2
      if (pg1) { pg1.classList.add('section-hidden'); pg1.style.display = 'none'; }
      if (pg2) { pg2.classList.remove('section-hidden'); pg2.style.display = ''; }
      if (typeof playTyping === 'function') setTimeout(() => playTyping(pg2 || pg1), 60);
      log('Termos: pg1 → pg2');
    } else {
      // pg2 -> próxima seção
      if (global.JC) global.JC.nextSection = null; // sequência natural
      if (typeof global.goToNextSection === 'function') {
        const debounced = (function(){
          let t; return function(){ clearTimeout(t); t = setTimeout(() => global.goToNextSection(), 120); };
        })();
        debounced();
      }
      log('Termos: aceitar e continuar');
    }
  }, true); // capture = true
})(window);
    
// ===== Anti-regressão para 'section-intro' =====
(function (global) {
  const originalShow = global.showSection;
  global.showSection = function(id) {
    try {
      const cur = global.__currentSectionId || 'section-intro';
      // bloqueia qualquer volta automática pra intro depois que saímos dela
      if (id === 'section-intro' && (global.__hasLeftIntro || cur !== 'section-intro')) {
        console.warn('[CONTROLLER] showSection("section-intro") bloqueado (já avançou).');
        return;
      }
      global.__currentSectionId = id;
      if (typeof originalShow === 'function') {
        return originalShow.apply(this, arguments);
      }
      // fallback simples
      document.querySelectorAll('[id^="section-"]').forEach(s => {
        s.classList.add('section-hidden'); s.classList.remove('active');
      });
      const nextEl = document.getElementById(id);
      if (nextEl) { nextEl.classList.remove('section-hidden'); nextEl.classList.add('active'); }
    } catch (e) {
      console.error('[CONTROLLER] showSection wrapper error:', e);
    }
  };
})(window);

    // ===== Intercepta .btn-avancar dentro de #section-termos =====
(function (global) {
  const log = (...a) => console.log('[CONTROLLER:TERMOS_BTN]', ...a);
  const play = (global.TypingBridge && typeof global.TypingBridge.play === 'function')
    ? global.TypingBridge.play
    : (typeof global.runTyping === 'function' ? global.runTyping : null);

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-avancar');
    if (!btn) return;
    const inTermos = !!btn.closest('#section-termos');
    if (!inTermos) return;

    // isola dos listeners globais
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const pg1 = document.getElementById('termos-pg1');
    const pg2 = document.getElementById('termos-pg2');

    if (!pg1 && !pg2) {
      log('Sem pg1/pg2 — seguindo fluxo normal');
      if (typeof global.goToNextSection === 'function') global.goToNextSection();
      return;
    }

    const pg2Visible = pg2 && !pg2.classList.contains('section-hidden') && pg2.style.display !== 'none';

    if (!pg2Visible) {
      // pg1 -> pg2
      if (pg1) { pg1.classList.add('section-hidden'); pg1.style.display = 'none'; }
      if (pg2) { pg2.classList.remove('section-hidden'); pg2.style.display = ''; }
      if (typeof play === 'function') setTimeout(() => play(pg2 || pg1), 60);
      log('Termos: pg1 → pg2');
    } else {
      // pg2 -> próxima seção
      if (global.JC) global.JC.nextSection = null;
      setTimeout(() => { if (typeof global.goToNextSection === 'function') global.goToNextSection(); }, 120);
      log('Termos: aceitar e continuar');
    }
  }, true); // capture
})(window);

  // ===== LOCK DA SEÇÃO TERMOS =====
let __termsObserver = null;

function lockTermosSection() {
  const termos = document.getElementById('section-termos');
  if (!termos) return;

  window.__termsLocked = true;

  // força visibilidade da seção termos
  document.querySelectorAll('[id^="section-"]').forEach(sec => {
    if (sec === termos) {
      sec.classList.add('active');
      sec.classList.remove('section-hidden');
    } else {
      sec.classList.add('section-hidden');
      sec.classList.remove('active');
    }
  });

  // Observa qualquer tentativa de mudar classes e desfaz
  if (__termsObserver) { try { __termsObserver.disconnect(); } catch(_){} }
  __termsObserver = new MutationObserver(() => {
    if (!window.__termsLocked) return;
    const termosNow = document.getElementById('section-termos');
    if (!termosNow) return;
    termosNow.classList.add('active');
    termosNow.classList.remove('section-hidden');
    document.querySelectorAll('[id^="section-"]:not(#section-termos)').forEach(sec => {
      sec.classList.add('section-hidden');
      sec.classList.remove('active');
    });
  });

  __termsObserver.observe(document.body, {
    attributes: true, subtree: true, attributeFilter: ['class']
  });
}

function unlockTermosSection() {
  window.__termsLocked = false;
  if (__termsObserver) { try { __termsObserver.disconnect(); } catch(_){}; __termsObserver = null; }
}
// ===== BLOQUEIO DE showSection ENQUANTO TERMOS ESTIVEREM TRANCADOS =====
(function (global) {
  const originalShow = global.showSection;
  global.showSection = function(id) {
    if (window.__termsLocked && id !== 'section-termos') {
      console.warn('[CONTROLLER] showSection("' + id + '") bloqueado (Termos trancado).');
      return;
    }
    if (typeof originalShow === 'function') return originalShow.apply(this, arguments);

    // fallback simples
    document.querySelectorAll('[id^="section-"]').forEach(sec => {
      sec.classList.add('section-hidden'); sec.classList.remove('active');
    });
    const nextEl = document.getElementById(id);
    if (nextEl) { nextEl.classList.remove('section-hidden'); nextEl.classList.add('active'); }
  };
})(window);
// ===== BOTÕES DENTRO DE TERMOS: pg1→pg2→aceitar =====
(function (global) {
  const play = (global.TypingBridge && typeof global.TypingBridge.play === 'function')
    ? global.TypingBridge.play
    : (typeof global.runTyping === 'function' ? global.runTyping : null);

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-avancar');
    if (!btn) return;
    const inTermos = !!btn.closest('#section-termos');
    if (!inTermos) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const pg1 = document.getElementById('termos-pg1');
    const pg2 = document.getElementById('termos-pg2');

    // inicializa step
    if (!window.__termsStep) window.__termsStep = 1;

    if (window.__termsStep === 1) {
      // pg1 -> pg2
      if (pg1) { pg1.classList.add('section-hidden'); pg1.style.display = 'none'; }
      if (pg2) { pg2.classList.remove('section-hidden'); pg2.style.display = ''; }
      if (typeof play === 'function') setTimeout(() => play(pg2 || pg1), 60);
      window.__termsStep = 2;
      return;
    }

    if (window.__termsStep === 2) {
      // precisa aceitar (se houver checkbox)
      const chk = document.querySelector('#termos-aceite, input[name="termos-aceite"]');
      if (chk && !chk.checked) {
        window.toast && window.toast(i18n.t('aceite_necessario','Você precisa aceitar os termos para continuar.'));
        return;
      }
      window.__termsAccepted = true;
      unlockTermosSection();            // libera a seção
      window.__termsStep = 0;           // reset
      if (typeof global.goToNextSection === 'function') {
        setTimeout(() => global.goToNextSection(), 80);
      }
    }
  }, true); // capture
})(window);


  global.initController = initController;

})(window);
