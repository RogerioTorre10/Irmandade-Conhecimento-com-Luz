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
  async function goToNextSection() {
    const idx = sections.indexOf(currentSection);
    log('Índice atual:', idx, 'Seção atual:', currentSection);
    if (idx >= sections.length - 1) return;
    log('🔍 goToNextSection chamado. currentSection:', currentSection);

    const prev = currentSection;
    currentSection = (JC.nextSection && sections.includes(JC.nextSection))
      ? JC.nextSection : sections[idx + 1];
    log(`Navegando de ${prev} para ${currentSection}`);

    const prevEl = document.querySelector('#' + prev);
    if (prevEl) { prevEl.classList.remove('active'); prevEl.classList.add('section-hidden'); }

    const nextEl = document.querySelector('#' + currentSection);
    if (!nextEl) { console.error('[CONTROLLER] Seção não encontrada:', currentSection); return; }
    showSectionAndType(nextEl);
    
    // guarda seção atual globalmente e marca se já saiu da intro
    global.__currentSectionId = currentSection;
    if (currentSection !== 'section-intro') global.__hasLeftIntro = true;


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

  // garante containers de ações
  const navWrap1 = pg1.querySelector('.termos-actions') || pg1;
  const navWrap2 = pg2 ? (pg2.querySelector('.termos-actions') || pg2) : null;

  // Helper local para criar botão isolado (sem interferir no listener global)
  function createIsolatedButton(parent, { id, text, dataset = {}, onClick }) {
  if (!parent) return null;
  let btn = parent.querySelector('#' + id + ', [data-id="' + id + '"]');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = id;
    btn.className = 'btn btn-termos'; // NÃO usar .btn-avancar aqui
    btn.textContent = text;
    btn.setAttribute('data-scope', 'termos'); // marca escopo
    Object.keys(dataset || {}).forEach(k => btn.dataset[k] = dataset[k]);
    parent.appendChild(btn);
  }

  // ✅ Vincula o evento de clique
  if (onClick) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClick(e);
    });
  }

  return btn;
}


  // “Próximo” dentro dos termos (pg1 -> pg2)
  createIsolatedButton(navWrap1, {
    id: 'btn-termos-next',
    text: i18n.t('btn_avancar', 'Avançar'),
    dataset: { action: 'termos-next' },
    onClick: () => {
      hide(pg1); show(pg2);
      if (typeof playTyping === 'function') {
        setTimeout(() => playTyping(pg2, () => log('Typing termos-pg2 ok')), 60);
      }
    }
  });

  // “Voltar” (pg2 -> pg1), se existir segunda página
  if (pg2) {
    createIsolatedButton(navWrap2, {
      id: 'btn-termos-prev',
      text: i18n.t('btn_voltar', 'Voltar'),
      dataset: { action: 'termos-prev' },
      onClick: () => {
        hide(pg2); show(pg1);
        if (typeof playTyping === 'function') {
          setTimeout(() => playTyping(pg1, () => log('Typing termos-pg1 ok')), 60);
        }
      }
    });

    // “Aceito / Continuar” (pg2 -> próxima seção real)
    createIsolatedButton(navWrap2, {
      id: 'btn-termos-accept',
      text: i18n.t('btn_aceito_continuar', 'Aceito e quero continuar'),
      dataset: { action: 'termos-accept' },
      onClick: () => {
        // segue o fluxo normal da jornada
        JC.nextSection = null; // garante sequência natural
        const debounced = debounceClick(() => { goToNextSection(); }, 300);
        debounced();
      }
    });
  }

  // dispara typing da pg1
  if (typeof playTyping === 'function') {
    setTimeout(() => playTyping(pg1, () => log('Typing termos-pg1 ok')), 60);
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


  global.initController = initController;

})(window);
