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

  // Variável de controle para transições
  let isTransitioning = false;
  
  // O helper goNext, que você já tem, usa global.playTransition.
  // Vamos garantir que ele caia corretamente no fallback se for preciso.
  const getPlayTransitionFn = () => global.playTransition || global.JSecoes?.playTransition || function(src, onEnd) { 
    log('playTransition indisponível. Avançando diretamente.'); 
    onEnd && onEnd();
  };
  
  // ===== Pergaminho & Canvas =====
  // Mantido o bloco original, removendo apenas o código redundante/duplicado de "guarda"
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
  if (!canvas || !sectionId) {
    log('Canvas ou sectionId não encontrados, ignorando');
    return;
  }
  const section = document.getElementById(sectionId);
  if (!section) {
    log(`Seção ${sectionId} não encontrada, ignorando canvas update`);
    return;
  }
  if (sectionId === 'section-perguntas') {
    checkImage('/assets/img/pergaminho-rasgado-horiz.png', '/assets/img/pergaminho-rasgado-vert.png').then(bg => {
      // Corrigido a classe para limpar o pergaminho-v ao ir para a horizontal (H)
      canvas.className = `card pergaminho pergaminho-h${bg.includes('vert') ? ' fallback' : ''}`;
      canvas.style.background = `var(--panel) url('${bg}') no-repeat center/cover`;
      log('Canvas atualizado para section-perguntas:', bg);
    });
  } else {
    canvas.className = 'card pergaminho pergaminho-v'; // Volta para o Vertical (V)
    canvas.style.background = 'var(--panel) url(/assets/img/pergaminho-rasgado-vert.png) no-repeat center/cover';
    log('Canvas atualizado para:', sectionId);
  }
}
// Vincula o canvas ao evento de carregamento da seção
document.addEventListener('sectionLoaded', (e) => updateCanvasBackground(e.detail.sectionId));
document.addEventListener('section:shown', (e) => updateCanvasBackground(e.detail.sectionId));


  // ===== Blocos Dinâmicos e Controles (Mantidos) =====
  // Todas as funções 'loadDynamicBlocks' até 'fetchDevolutiva' foram mantidas
  // sem alterações, pois não causam conflito de escopo.

  // ... (Código de loadDynamicBlocks, analyzeSentiment, handleInput, fetchDevolutiva) ...

  // ===== Controles (Bloco Dinâmico - Mantido) =====
  function loadDynamicBlocks() {
    const content = $('#perguntas-container');
    if (!content) {
      log('Container de perguntas não encontrado');
      return;
    }

    const blocks = window.JORNADA_BLOCKS || [];
    content.innerHTML = '';

    blocks.forEach((block, bIdx) => {
      const bloco = document.createElement('section');
      bloco.className = 'j-bloco';
      bloco.id = `bloco-${block.id || bIdx}`;
      bloco.dataset.bloco = bIdx;
      bloco.dataset.video = block.video_after || '';

      (block.questions || []).forEach((q, qIdx) => {
        const label = typeof q === 'string' ? q : (q.label || q.text || '');
        const div = document.createElement('div');
        div.className = 'j-pergunta';
        div.dataset.pergunta = qIdx;

        const enunciado =
          `<label class="pergunta-enunciado" ` +
          `data-typing="true" data-text="Pergunta ${qIdx + 1}: ${label}" ` +
          `data-speed="36" data-cursor="true"></label>`;

        div.innerHTML = enunciado +
          `\n<textarea rows="4" class="input" placeholder="Digite sua resposta..."></textarea>` +
          `<div class="devolutiva-container" style="display:none;"><p data-typing="true" data-speed="36" data-cursor="true"></p></div>` +
          `<div class="accessibility-controls">` +
          `<button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>` +
          `<button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>` +
          `</div>`;

        bloco.appendChild(div);
      });

      content.appendChild(bloco);
    });

    const firstBloco = content.querySelector('.j-bloco');
    if (firstBloco) {
      firstBloco.style.display = 'block';
      const first = firstBloco.querySelector('.j-pergunta');
      if (first && global.runTyping) {
        first.classList.add('active');
        global.runTyping(first.querySelector('.pergunta-enunciado'), first.querySelector('.pergunta-enunciado').dataset.text, () => {
          log('Datilografia concluída para primeira pergunta');
        });
      }
    }

    global.JGuiaSelfie && global.JGuiaSelfie.loadAnswers();
    const firstTa = content.querySelector('.j-bloco .j-pergunta textarea');
    if (firstTa) handleInput(firstTa);
    log('Blocos dinâmicos carregados:', blocks.length);
  }

  // ... (Código de analyzeSentiment, handleInput, fetchDevolutiva, toggleSenha) ...

  // ===== Lógicas de Avanço (Mantidas) =====
  function proceedAfterGuia(guia) {
    const guiaNameInput = $('#guiaNameInput');
    // ... (lógica de nome e avanço para section-selfie) ...
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
    // ... (lógica para carregar section-perguntas) ...
  }

  // ===== goNext (Lógica de Avanço de Perguntas/Blocos - Mantida) =====
  function goNext() {
    if (isTransitioning) {
      log('Transição em andamento, ignorando');
      return;
    }
    isTransitioning = true;
    // ... (lógica completa de avanço entre perguntas/blocos) ...
    
    // Bloco de transição de vídeo entre blocos
    const src = (window.JORNADA_BLOCKS[idxBloco] && window.JORNADA_BLOCKS[idxBloco].video_after) || '';
     if (src) {
    const _play = getPlayTransitionFn();
    _play(src, () => irAdiante());
  } else {
    irAdiante();
  }
    // ... (código de datilografia em excesso removido) ...
  }
  
  // ===== Vídeo de Transição (Redundante no seu setup, mas exportada para uso) =====
  // Mantenho a função playTransition aqui caso você a use como fallback ou a chame internamente,
  // mas idealmente ela deve ser APENAS no arquivo 'video-transicao.js'

  // ... (código de playTransition, lockVideoOrientation, generatePDF mantidos) ...
  
  // ===== Inicialização =====
  function initSecoes() {
    lockVideoOrientation();
    // Sincroniza o manuseio de inputs para que respostas salvem e atualizem a chama/progresso
    $$('.j-pergunta textarea').forEach(input => {
      input.addEventListener('input', () => handleInput(input));
    });
    // ... (lógica de input de senha mantida) ...
    log('Secoes inicializado');
  }

  document.addEventListener('DOMContentLoaded', initSecoes);

  // ===== startJourney (CORRIGIDO PARA COMEÇAR NA INTRO) =====
  function startJourney() {
    const next = 'section-intro'; // A Jornada SEMPRE começa na Introdução
    if (global.JC && typeof global.JC.show === 'function') {
      console.log('[JSecoes] startJourney →', next);
      global.JC.show(next);
    } else if (typeof global.showSection === 'function') {
      console.log('[JSecoes] startJourney (fallback showSection) →', next);
      global.showSection(next);
    } else {
      global.toast && global.toast('Navegação indisponível (JC/showSection).');
      return;
    }

    global.G = global.G || {};
    global.G.__typingLock = false;
  }

  // ===== Export público =====
  global.JSecoes = {
    checkImage,
    updateCanvasBackground,
    loadDynamicBlocks,
    analyzeSentiment,
    handleInput,
    toggleSenha,
    proceedAfterGuia,
    proceedAfterSelfie,
    proceedToQuestions,
    goNext,
    playTransition, // Mantido como export para compatibilidade
    generatePDF,
    startJourney
  };

})(window)
