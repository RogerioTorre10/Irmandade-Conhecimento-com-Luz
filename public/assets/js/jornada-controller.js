'use strict';

import i18n from '/public/assets/js/i18n.js';
import TypingBridge from './jornada-typing-bridge.js'; // Importar TypingBridge
import { renderQuestions, loadVideo } from './jornada-paper-qa.js';

// Função de log
const controllerLog = (...args) => console.log('[CONTROLLER]', ...args);

// Estado global
let isProcessingClick = false;
const sections = [
  'section-intro',
  'section-termos',
  'section-senha',
  'section-guia',
  'section-selfie',
  'section-perguntas',
  'section-final'
];
let currentSection = 'section-intro';
const answeredQuestions = new Set();
let queue = [];

// Estado da jornada
const JC = {
  currentBloco: 0,
  currentPergunta: 0,
  nextSection: null,
  goNext: () => goToNextSection(),
  initialized: false
};
window.JC = JC;

// Enfileira ações
function enqueueAction(action) {
  queue.push(action);
  controllerLog('Ação enfileirada:', action.type);
}

// Processa a fila de ações
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

// Debounce para cliques
function debounceClick(callback, wait = 500) {
  return (...args) => {
    if (isProcessingClick) {
      controllerLog('Clique ignorado (debounce ativo)');
      return;
    }
    isProcessingClick = true;
    const button = args[0]?.target;
    if (button) button.innerHTML = i18n.t('btn_carregando', 'Carregando...');
    setTimeout(() => {
      isProcessingClick = false;
      if (button) button.innerHTML = i18n.t('btn_avancar', 'Avançar');
    }, wait);
    callback(...args);
  };
}

// Navega para a próxima seção
async function goToNextSection() {
  const currentIdx = sections.indexOf(currentSection);
  controllerLog('Índice atual:', currentIdx, 'Seção atual:', currentSection);

  if (currentIdx < sections.length - 1) {
    const previousSection = currentSection;
    currentSection = JC.nextSection && sections.includes(JC.nextSection)
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
    if (nextElement) {
      nextElement.classList.add('active');
      nextElement.classList.remove('section-hidden');
      controllerLog(`Seção ${currentSection} exibida`);

      if (TypingBridge.play) {
        const typingElements = nextElement.querySelectorAll('.text[data-typing="true"]:not(.section-hidden)');
        if (typingElements.length) {
          typingElements.forEach((element, index) => {
            let selector = element.id ? `#${element.id}` : `.text[data-typing="true"]:nth-of-type(${index + 1})`;
            try {
              document.querySelector(selector);
              TypingBridge.play(selector, () => {
                controllerLog(`Animação ${index + 1}/${typingElements.length} concluída em ${currentSection}`);
                const text = element.getAttribute('data-text') || element.textContent || '';
                window.readText && window.readText(text);
              });
            } catch (e) {
              console.error('[CONTROLLER] Seletor inválido:', selector, e);
            }
          });
        } else {
          controllerLog('Nenhum elemento de digitação encontrado em', currentSection);
        }
      }
    } else {
      console.error(`[CONTROLLER] Seção ${currentSection} não encontrada`);
      return;
    }

    if (currentSection === 'section-termos') {
      const termosPg1 = document.getElementById('termos-pg1');
      const termosPg2 = document.getElementById('termos-pg2');
      if (termosPg1 && termosPg2) {
        termosPg1.classList.remove('section-hidden');
        termosPg2.classList.add('section-hidden');
        controllerLog('Exibindo termos-pg1');
        if (TypingBridge.play) {
          TypingBridge.play('#termos-pg1', () => controllerLog('Digitação de termos-pg1 concluída'));
        }
      }
    } else if (currentSection === 'section-guia') {
      try {
        loadVideo('/public/assets/img/conhecimento-com-luz-jardim.mp4');
        controllerLog('Vídeo do guia carregado');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo do guia:', error);
        window.showSection && window.showSection('section-guia');
      }
    } else if (currentSection === 'section-selfie') {
      try {
        loadVideo('/public/assets/img/filme-0-ao-encontro-da-jornada.mp4');
        controllerLog('Vídeo da selfie carregado');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo da selfie:', error);
        window.showSection && window.showSection('section-selfie');
      }
    } else if (currentSection === 'section-perguntas') {
      try {
        await i18n.waitForReady(10000);
        if (!i18n.ready) throw new Error('i18n não inicializado');
        answeredQuestions.clear();
        JC.currentBloco = 0;
        JC.currentPergunta = 0;
        await renderQuestions();
        window.perguntasLoaded = true;
        controllerLog('Perguntas carregadas e renderizadas');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao renderizar perguntas:', error.message);
        if (window.toast) window.toast(i18n.t('erro_perguntas', 'Erro ao carregar perguntas: ') + error.message);
      }
    } else if (currentSection === 'section-final') {
      controllerLog('Jornada concluída! 🎉');
      if (window.JORNADA_FINAL_VIDEO && loadVideo) {
        loadVideo(window.JORNADA_FINAL_VIDEO);
        controllerLog('Vídeo final carregado');
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

  window.JORNADA_BLOCKS = window.JORNADA_BLOCKS || [];
  window.JORNADA_VIDEOS = window.JORNADA_VIDEOS || {};
  controllerLog('JORNADA_BLOCKS:', window.JORNADA_BLOCKS);
  controllerLog('JORNADA_VIDEOS:', window.JORNADA_VIDEOS);

  window.__currentSectionId = route === 'intro' ? 'section-intro' : route;
  currentSection = window.__currentSectionId;

  const tryInitializeSection = (maxAttempts = 5, interval = 500) => {
    let attempts = 0;
    const tryExecute = () => {
      const initialElement = document.querySelector(`#${currentSection}`);
      if (initialElement) {
        initialElement.classList.add('active');
        initialElement.classList.remove('section-hidden');
        controllerLog(`Seção inicial exibida: ${currentSection}`);
        if (TypingBridge.play) {
          const typingElements = initialElement.querySelectorAll('.text[data-typing="true"]:not(.section-hidden)');
          if (typingElements.length) {
            TypingBridge.play('.text', () => {
              controllerLog('Animação inicial concluída para:', currentSection);
            });
          }
        }
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

  window.readText = window.readText || function (text, callback) {
    if ('speechSynthesis' in window) {
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
      window.speechSynthesis.speak(utterance);
      controllerLog('Iniciando leitura de:', text);
    } else {
      console.error('[CONTROLLER] API Web Speech não suportada neste navegador');
    }
  };

  const debouncedGoNext = debounceClick(() => goToNextSection());
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

  document.querySelectorAll('[data-action="termos-prev"]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const termosPg1 = document.getElementById('termos-pg1');
      const termosPg2 = document.getElementById('termos-pg2');
      if (termosPg2 && !termosPg2.classList.contains('section-hidden')) {
        termosPg2.classList.add('section-hidden');
        termosPg1.classList.remove('section-hidden');
        controllerLog('Voltando de termos-pg2 para termos-pg1');
        if (TypingBridge.play) {
          TypingBridge.play('#termos-pg1', () => controllerLog('Digitação de termos-pg1 concluída'));
        }
      }
    });
  });

  document.addEventListener('questionAnswered', (event) => {
    const questionId = event.detail.questionId;
    answeredQuestions.add(questionId);
    controllerLog(`Pergunta respondida: ${questionId}, Total respondidas: ${answeredQuestions.size}`);
    goToNextSection();
  });

  document.addEventListener('videoSkipped', () => {
    controllerLog('Vídeo pulado, avançando...');
    goToNextSection();
  });

  window.goToNextSection = () => {
    if (JC.initialized) {
      goToNextSection();
    } else {
      enqueueAction({ type: 'next' });
    }
  };

  document.addEventListener('jc:ready', processQueue);
  controllerLog('Controlador inicializado com sucesso');
}

// Inicialização
function initializeController() {
  if (!JC.initialized) {
    controllerLog('Inicializando controlador');
    i18n.init().then(() => {
      initController('intro');
    }).catch(err => {
      console.error('[CONTROLLER] Erro ao aguardar i18n:', err.message);
      initController('intro');
    });
  }
}

document.addEventListener('DOMContentLoaded', initializeController, { once: true });
document.addEventListener('bootstrapComplete', initializeController, { once: true });

export { initController };
