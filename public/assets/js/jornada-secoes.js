(function (global) {
  'use strict';
  
  console.log('[Secoes] Carregando jornada-secoes.js');
  if (global.__SecoesReady) {
    console.log('[Secoes] Já carregado, ignorando');
    return;
  }
  global.__SecoesReady = true;

  const log = (...args) => console.log('[Secoes]', ...args);
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  
  let isTransitioning = false;
  
  // Garante que a função de playTransition seja encontrada
  const getPlayTransitionFn = () =>
    global.playTransitionVideo ||
    global.JSecoes?.playTransition ||
    function (src, onEnd) {
      if (!src || !src.endsWith('.mp4')) {
        log('playTransition (fallback): caminho inválido para vídeo:', src);
        onEnd?.();
        return;
      }
      log('playTransition indisponível. Avançando diretamente.');
      onEnd?.();
    };

  // Função para análise de sentimento
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

  // Travar orientação de vídeo
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

  // NOVA FUNÇÃO CENTRAL: mostrar seção + canvas + evento
  function showSection(sectionId) {
    if (!sectionId) return;

    const section = document.getElementById(sectionId);
    const canvas = $('#jornada-canvas');
    if (!section || !canvas) {
      log('Erro: seção ou canvas não encontrado:', sectionId);
      return;
    }

    // Esconde todas as seções
    $$('section').forEach(s => {
      s.classList.remove('show');
      s.style.display = 'none';
    });

    // Mostra a seção
    section.style.display = 'block';
    setTimeout(() => section.classList.add('show'), 50);

    // Atualiza canvas
    updateCanvasBackground(sectionId);

    // DISPARA O EVENTO section:shown
    const event = new CustomEvent('section:shown', {
      detail: { sectionId }
    });
    document.dispatchEvent(event);
    log(`Seção exibida e evento disparado: ${sectionId}`);
  }

  function updateCanvasBackground(sectionId) {
    const canvas = $('#jornada-canvas');
    if (!canvas || !sectionId) return;

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

  // Fallback seguro
  window.typingLog = window.typingLog || function () {};

  function registerCanvasListeners() {
    document.removeEventListener('sectionLoaded', updateCanvasBackground);
    document.removeEventListener('section:shown', updateCanvasBackground);
    document.addEventListener('sectionLoaded', (e) => {
      typingLog('sectionLoaded disparado:', e.detail.sectionId);
      updateCanvasBackground(e.detail.sectionId);
    });
    document.addEventListener('section:shown', (e) => {
      typingLog('section:shown disparado:', e.detail.sectionId);
      updateCanvasBackground(e.detail.sectionId);
    });
    typingLog('Canvas listeners registrados');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSecoes();
    registerCanvasListeners();
  });

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
    showSection('section-selfie'); // Usa showSection
    const card = $('#card-guide');
    const bgImg = $('#guideBg');
    const guideNameEl = $('#guideNameSlot');
    card.dataset.guide = guia.toUpperCase();
    guideNameEl.textContent = guia.toUpperCase();
    bgImg.src = `/assets/img/irmandade-quarteto-bg-${guia}.png`;
    log('Prosseguindo após guia:', guia);
  }

  function proceedAfterSelfie() {
    log('JORNADA_VIDEOS:', window.JORNADA_VIDEOS);
    const intro = window.JORNADA_VIDEOS?.intro || '';
    if (!intro || window.__introPlayed) {
      proceedToQuestions();
      return;
    }
    if (!intro.endsWith('.mp4')) {
      log('URL de vídeo inválido:', intro);
      window.__introPlayed = true;
      proceedToQuestions();
      return;
    }
    window.__introPlayed = true;
    const _play = getPlayTransitionFn();
    _play(intro, () => proceedToQuestions());
  }

  function proceedToQuestions() {
    showSection('section-perguntas'); // Usa showSection
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

  // NOVA FUNÇÃO: após perguntas → tela final
  function proceedToFinal() {
    log('Jornada concluída! Indo para tela final...');
    showSection('section-final'); // Dispara section:shown automaticamente
  }

  function goNext() {
    if (isTransitioning) { log('Transição em andamento, ignorando'); return; }
    isTransitioning = true;

    const active = $('.j-pergunta.active');
    if (!active) {
      log('Nenhuma pergunta ativa. Finalizando jornada.');
      proceedToFinal();
      isTransitioning = false;
      return;
    }

    const next = active.nextElementSibling;
    if (next && next.classList.contains('j-pergunta')) {
      active.classList.remove('active');
      next.classList.add('active');
      const ta = next.querySelector('textarea');
      if (ta) {
        ta.focus();
        handleInput(ta);
      }
      log('Avançando para próxima pergunta');
    } else {
      log('Última pergunta. Finalizando jornada.');
      proceedToFinal();
    }

    isTransitioning = false;
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
  
  function startJourney() {
    const next = 'section-senha';
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

  // Expor funções
  global.JSecoes = {
    checkImage,
    updateCanvasBackground,
    loadDynamicBlocks,
    analyzeSentiment, 
    handleInput,
    proceedAfterGuia,
    proceedAfterSelfie,
    proceedToQuestions,
    proceedToFinal,     // NOVA
    goNext,
    playTransition,
    generatePDF,
    startJourney,
    showSection         // NOVA: para uso externo
  };

})(window);
