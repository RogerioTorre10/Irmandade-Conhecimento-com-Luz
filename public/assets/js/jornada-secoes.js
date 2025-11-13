(function (global) {
  'use strict';

  if (global.__SecoesReady) {
    console.log('[Secoes] Já carregado, ignorando');
    return;
  }
  global.__SecoesReady = true;

  const log = (...args) => console.log('[Secoes]', ...args);
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  
  let isTransitioning = false;
  
  // Garante que a função de playTransition seja encontrada (do video-transicao.js)
  const getPlayTransitionFn = () => global.playTransition || global.JSecoes?.playTransition || function(src, onEnd) { 
    log('playTransition indisponível. Avançando diretamente.'); 
    onEnd && onEnd();
  };
  
  // Função para análise de sentimento (usada por handleInput)
  function analyzeSentiment(text) {
    const POS = {
      'feliz': 2, 'alegria': 2, 'amor': 3, 'sucesso': 2, 'esperança': 3, 'paz': 2, 'fé': 3, 'gratidão': 2,
      'vitória': 3, 'superação': 3, 'luz': 2, 'deus': 3, 'coragem': 2, 'força': 2, 'confiança': 2, 'propósito': 3
    };
    const NEG = {
      'triste': -2, 'dor': -3, 'raiva': -2, 'medo': -2, 'frustracao': -2, 'frustração': -2, 'decepcao': -2,
      'decepção': -2, 'perda': -3, 'culpa': -2, 'ansiedade': -2, 'solidao': -2, 'solidão': -2, 'desespero': -3,
      'cansaco': -2, 'cansaço': -2, 'fracasso': -2, 'trauma': -3, 'duvida': -2, 'dúvida': -2
    };
    let score = 0;
    (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).forEach(t => {
      if (POS[t] != null) score += POS[t];
      if (NEG[t] != null) score += NEG[t];
    });
    return score;
  }

  // Função para travar a orientação de vídeo
  function lockVideoOrientation() {
    const video = $('#videoTransicao');
    if (!video) return;
    video.addEventListener('webkitbeginfullscreen', (e) => { e.preventDefault(); video.exitFullscreen?.(); });
    video.addEventListener('fullscreenchange', () => { if (document.fullscreenElement === video) { document.exitFullscreen?.(); } });
    window.addEventListener('orientationchange', () => { video.style.transform = 'rotate(0deg)'; });
    if (window.matchMedia('(orientation: portrait)').matches) {
      video.style.width = '100vw';
      video.style.height = 'auto';
      video.style.maxHeight = '100vh';
    }
    log('Orientação de vídeo travada');
  }

  function checkImage(url, fallbackUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(fallbackUrl);
      img.src = url;
    });
  }

  function updateCanvasBackground(sectionId) {
    const canvas = $('#jornada-canvas');
    if (!canvas || !sectionId) { log('Canvas ou sectionId não encontrados, ignorando'); return; }
    
    if (sectionId === 'section-perguntas') {
      checkImage('/assets/img/pergaminho-rasgado-horiz.png', '/assets/img/pergaminho-rasgado-vert.png').then(bg => {
        canvas.className = `card pergaminho pergaminho-h${bg.includes('vert') ? ' fallback' : ''}`;
        canvas.style.background = `var(--panel) url('${bg}') no-repeat center/cover`;
        log('Canvas atualizado para section-perguntas (H):', bg);
      });
    } else {
      canvas.className = 'card pergaminho pergaminho-v'; 
      canvas.style.background = 'var(--panel) url(/assets/img/pergaminho-rasgado-vert.png) no-repeat center/cover';
      log('Canvas atualizado para (V):', sectionId);
    }
  }
  
  document.addEventListener('sectionLoaded', (e) => updateCanvasBackground(e.detail.sectionId));
  document.addEventListener('section:shown', (e) => updateCanvasBackground(e.detail.sectionId));

  // Funções de blocos e devolutivas
  function loadDynamicBlocks() {
    // ... (mantido)
  }

  async function fetchDevolutiva(pergunta, resposta, guia) {
    // ... (mantido)
  }

  async function handleInput(textarea) {
    const score = analyzeSentiment(textarea.value); 
    global.updateChama && global.updateChama(score);
    global.JGuiaSelfie && global.JGuiaSelfie.saveAnswers();
    global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
    const perguntaDiv = textarea.closest('.j-pergunta');
    const devolutivaDiv = perguntaDiv.querySelector('.devolutiva-container');
    const devolutivaP = devolutivaDiv.querySelector('p');
    if (textarea.value.trim() && devolutivaDiv) {
      devolutivaDiv.style.display = 'block';
      const pergunta = perguntaDiv.querySelector('.pergunta-enunciado')?.textContent || '';
      const resposta = textarea.value;
      const guia = localStorage.getItem('JORNADA_GUIA') || 'zion';
      const devolutiva = await fetchDevolutiva(pergunta, resposta, guia);
      global.runTyping && global.runTyping(devolutivaP, devolutiva, () => log('Datilografia concluída para devolutiva'));
    } else {
      devolutivaDiv.style.display = 'none';
    }
    log('Input processado:', { score, resposta: textarea.value });
  }

  function proceedAfterGuia(guia) {
    const guiaNameInput = $('#guiaNameInput');
    if (guiaNameInput && guiaNameInput.value.trim()) {
      localStorage.setItem('JORNADA_NOME', guiaNameInput.value.trim());
    } else {
      global.toast && global.toast('Por favor, insira seu nome antes de prosseguir.');
      return;
    }
    localStorage.setItem('JORNADA_GUIA', guia);
    global.ensureHeroFlame && global.ensureHeroFlame('section-selfie');
    global.JC.show('section-selfie');
    const card = $('#card-guide');
    const bgImg = $('#guideBg');
    const guideNameEl = $('#guideNameSlot');
    card.dataset.guide = guia.toUpperCase();
    guideNameEl.textContent = guia.toUpperCase();
    bgImg.src = `/assets/img/irmandade-quarteto-bg-${guia}.png`;
    log('Prosseguindo após guia:', guia);
  }

  function proceedAfterSelfie() {
    const intro = window.JORNADA_VIDEOS?.intro || '';
    if (!intro || window.__introPlayed) {
      proceedToQuestions();
      return;
    }
    window.__introPlayed = true;
    const _play = getPlayTransitionFn();
    _play(intro, () => proceedToQuestions());
  }

  function proceedToQuestions() {
    global.JC.show('section-perguntas');
    loadDynamicBlocks();
    const perguntas = $$('.j-pergunta');
    if (perguntas.length) {
      perguntas[0].classList.add('active');
      const lbl = perguntas[0].querySelector('.pergunta-enunciado')?.textContent || '';
      const ta = perguntas[0].querySelector('textarea');
      ta.placeholder = "Digite sua resposta...";
      const aria = $('#aria-pergunta');
      if (aria) aria.textContent = lbl;
      if (ta) handleInput(ta);
    }
    global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
    log('Prosseguindo para section-perguntas');
  }

  function goNext() {
    if (isTransitioning) { log('Transição em andamento, ignorando'); return; }
    isTransitioning = true;
    // ... (lógica completa de avanço entre perguntas/blocos) ...
  }
  
  function playTransition(src, onEnd) {
    // ... (mantido)
  }
  
  function generatePDF() {
    // ... (mantido)
  }

  function initSecoes() {
    lockVideoOrientation(); 
    $$('.j-pergunta textarea').forEach(input => {
      input.addEventListener('input', () => handleInput(input));
    });
    log('Secoes inicializado');
  }

  document.addEventListener('DOMContentLoaded', initSecoes);

  function startJourney() {
    const next = 'section-senha'; // Alterado para section-senha
    if (global.JC && typeof global.JC.show === 'function') {
      console.log('[JSecoes] startJourney →', next);
      global.JC.show(next);
    } else if (typeof global.showSection === 'function') {
      console.log('[JSecoes] startJourney (fallback showSection) →', next);
      global.showSection(next);
    } else {
      global.toast && global.toast('Navegação indisponível (JC/showSection).');
    }
    global.G = global.G || {};
    global.G.__typingLock = false;
  }

  global.JSecoes = {
    checkImage,
    updateCanvasBackground,
    loadDynamicBlocks,
    analyzeSentiment, 
    handleInput,
    proceedAfterGuia,
    proceedAfterSelfie,
    proceedToQuestions,
    goNext,
    playTransition,
    generatePDF,
    startJourney
  };

})(window);
