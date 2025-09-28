import { renderQuestions, loadVideo } from './jornada-paper-qa.js';
import i18n from './i18n.js';

const log = (...args) => console.log('[CONTROLLER]', ...args);

log('Dependências iniciais:', {
    runTyping: !!window.runTyping,
    renderQuestions: !!renderQuestions, // Note que é importado, não window
    loadVideo: !!loadVideo // Note que é importado, não window
});

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
let currentBloco = 0;
let currentPergunta = 0;



const JC = {
  currentBloco,
  currentPergunta,
  nextSection: null,
  goNext: () => goToNextSection()
};

window.JC = JC;

function enqueueAction(action) {
  queue.push(action);
  log('Ação enfileirada:', action.type);
}

function processQueue() {
  const pending = queue.slice();
  queue = [];
  pending.forEach(action => {
    if (action.type === 'next') {
      goToNextSection();
    }
  });
  log('Fila processada, ações executadas:', pending.length);
}

function debounceClick(callback, wait = 500) {
    return (...args) => {
        if (isProcessingClick) {
            log('Clique ignorado (debounce ativo)');
            return;
        }
        isProcessingClick = true;
        setTimeout(() => {
            isProcessingClick = false;
        }, wait);
        callback(...args);
    };
}


async function goToNextSection() {
  const currentIdx = sections.indexOf(currentSection);
  log('Índice atual:', currentIdx, 'Seção atual:', currentSection);
  if (currentIdx < sections.length - 1) {
    const previousSection = currentSection;
    currentSection = JC.nextSection || sections[currentIdx + 1];
    log(`Tentando navegar de ${previousSection} para ${currentSection}`);

    const prevElement = document.querySelector(`#${previousSection}`);
    if (prevElement) {
      prevElement.classList.remove('active');
      prevElement.classList.add('hidden');
      log(`Seção anterior ${previousSection} ocultada`);
    } else {
      console.error(`[CONTROLLER] Seção anterior ${previousSection} não encontrada`);
    }

    const nextElement = document.querySelector(`#${currentSection}`);
    if (nextElement) {
      nextElement.classList.add('active');
      nextElement.classList.remove('hidden');
      log(`Seção ${currentSection} exibida`);
    } else {
      console.error(`[CONTROLLER] Seção ${currentSection} não encontrada`);
      return;
    }

    if (currentSection === 'section-termos') {
      const termosPg1 = document.getElementById('termos-pg1');
      const termosPg2 = document.getElementById('termos-pg2');
      if (termosPg1 && !termosPg1.classList.contains('hidden')) {
        termosPg1.classList.remove('hidden');
        termosPg2.classList.add('hidden');
        log('Exibindo termos-pg1');
        window.runTyping && window.runTyping('#termos-pg1');
        return;
      }
    } else if (currentSection === 'section-guia') {
      try {
        window.playVideo('/assets/img/conhecimento-com-luz-jardim.mp4');
        log('Vídeo do guia carregado');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo do guia:', error);
        window.showSection('section-guia');
      }
    } else if (currentSection === 'section-selfie') {
      try {
        window.playVideo('/assets/img/filme-0-ao-encontro-da-jornada.mp4');
        log('Vídeo da selfie carregado');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo da selfie:', error);
        window.showSection('section-selfie');
      }
    } else if (currentSection === 'section-perguntas') {
      try {
        await i18n.waitForReady(10000);
        if (!i18n.ready) throw new Error('i18n não inicializado');
        answeredQuestions.clear();
        JC.currentBloco = 0;
        JC.currentPergunta = 0;
        renderQuestions();
        window.perguntasLoaded = true;
        log('Perguntas carregadas e renderizadas');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao renderizar perguntas:', error);
        window.toast && window.toast('Erro ao carregar perguntas');
      }
    } else if (currentSection === 'section-final') {
      log('Jornada concluída! 🎉');
      if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
        window.playVideo(window.JORNADA_FINAL_VIDEO);
        log('Vídeo final carregado');
      }
    }

    if (window.runTyping) {
      const typingElements = document.querySelectorAll(`#${currentSection} [data-typing="true"]:not(.hidden)`);
      if (typingElements.length > 0) {
        let completed = 0;
        typingElements.forEach((element, index) => {
          if (!element || !element.className) {
            console.warn('[CONTROLLER] Elemento sem classe ou inválido:', element);
            return;
          }
          const selector = element.id ? `#${element.id}` : `.${element.className.split(' ')[0] || 'text'}`;
          window.runTyping(selector, () => {
            completed++;
            log(`Animação ${index + 1}/${typingElements.length} concluída em ${currentSection}`);
            const text = element.getAttribute('data-text') || element.textContent;
            window.speak && window.speak(text);
            if (completed === typingElements.length) {
              log('Todas as animações de digitação concluídas em', currentSection);
            }
          });
        });
      } else {
        log('Nenhum elemento de digitação encontrado em', currentSection);
      }
    } else {
      log('window.runTyping não definido');
    }
  } else {
    log('Nenhuma seção seguinte disponível. Jornada finalizada.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  log('Inicializando controlador...');
  window.JC = JC;
  console.log('[CONTROLLER] Controlador inicializado com sucesso');
});

function initController(route = 'intro') {
  log('Inicializando controlador...');

  window.JORNADA_BLOCKS = window.JORNADA_BLOCKS || [];
  window.JORNADA_VIDEOS = window.JORNADA_VIDEOS || {};
  log('JORNADA_BLOCKS:', window.JORNADA_BLOCKS);
  log('JORNADA_VIDEOS:', window.JORNADA_VIDEOS);

  const dependencies = {
    JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
    JORNADA_VIDEOS: !!window.JORNADA_VIDEOS,
    showSection: !!window.showSection,
    runTyping: !!window.runTyping,
    playTransition: !!window.playTransition,
  };
  log('Dependências:', dependencies);

  window.JC = {
    currentBloco: 0,
    currentPergunta: 0,
    nextSection: null,
    initialized: true,
    init: () => log('JC init chamado (já inicializado)'),
    goNext: goToNextSection,
  };
  window.__currentSectionId = route === 'intro' ? 'section-intro' : route;
  window.perguntasLoaded = false;

  const initialElement = document.querySelector(`#${currentSection}`);
  if (initialElement) {
    initialElement.classList.add('active');
    log(`Seção inicial exibida: ${currentSection}`);
  } else {
    console.error(`[CONTROLLER] Seção inicial ${currentSection} não encontrada`);
  }

  window.readText = window.readText || function (text, callback) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.lang || 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => {
        log('Leitura concluída para:', text);
        if (callback) callback();
      };
      utterance.onerror = (error) => {
        console.error('[CONTROLLER] Erro na leitura:', error);
      };
      window.speechSynthesis.speak(utterance);
      log('Iniciando leitura de:', text);
    } else {
      console.error('[CONTROLLER] API Web Speech não suportada neste navegador');
    }
  };

 if (window.runTyping) {
    const typingElements = document.querySelectorAll(`#${currentSection} [data-typing="true"]:not(.hidden)`);
    if (typingElements.length > 0) {
        let completed = 0;
        typingElements.forEach((element, index) => {
            if (!element || !element.className) {
                console.warn('[CONTROLLER] Elemento sem classe ou inválido:', element);
                return;
            }
            const selector = element.id ? `#${element.id}` : `.${element.className.split(' ')[0] || 'text'}`;
            window.runTyping(selector, () => {
                completed++;
                log(`Animação ${index + 1}/${typingElements.length} concluída em ${currentSection}`);
                const text = element.getAttribute('data-text') || element.textContent;
                window.readText && window.readText(text); // Usa readText em vez de speak
                if (completed === typingElements.length) {
                    log('Todas as animações de digitação concluídas em', currentSection);
                }
            });
        });
    } else {
        log('Nenhum elemento de digitação encontrado em', currentSection);
    }
} else {
    log('window.runTyping não definido, usando fallback');
    window.runTyping = function (selector, callback) {
        const element = document.querySelector(selector);
        if (!element) {
            console.error('[CONTROLLER] Elemento não encontrado:', selector);
            return;
        }
        const text = element.getAttribute('data-text') || element.textContent || '';
        const speed = parseInt(element.getAttribute('data-speed')) || 50;
        let i = 0;
        element.textContent = '';
        element.classList.add('lumen-typing');

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                element.classList.add('typing-done');
                element.classList.remove('lumen-typing');
                log('Animação de digitação concluída para:', text);
                window.readText && window.readText(text);
                if (callback) callback();
            }
        }
        type();
    };
    // Re-executa a lógica de digitação com o fallback
    const typingElements = document.querySelectorAll(`#${currentSection} [data-typing="true"]:not(.hidden)`);
    typingElements.forEach((element, index) => {
        const selector = element.id ? `#${element.id}` : `.${element.className.split(' ')[0] || 'text'}`;
        window.runTyping(selector, () => {
            log(`Animação ${index + 1}/${typingElements.length} concluída em ${currentSection}`);
        });
    });
}

  const debouncedGoNext = debounceClick(() => goToNextSection());
  document
    .querySelectorAll(
      '.btn-avancar, [data-action="avancar"], #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney, #iniciarSenha, [data-action="termos-next"]'
    )
    .forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        log('Botão avançar clicado:', button.id || button.className);
        debouncedGoNext();
      });
    });

  document.querySelectorAll('[data-action="termos-prev"]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const termosPg1 = document.getElementById('termos-pg1');
      const termosPg2 = document.getElementById('termos-pg2');
      if (termosPg2 && !termosPg2.classList.contains('hidden')) {
        termosPg2.classList.add('hidden');
        termosPg1.classList.remove('hidden');
        log('Voltando de termos-pg2 para termos-pg1');
      }
    });
  });

  document.addEventListener('questionAnswered', (event) => {
    const questionId = event.detail.questionId;
    answeredQuestions.add(questionId);
    log(`Pergunta respondida: ${questionId}, Total respondidas: ${answeredQuestions.size}`);
    goToNextSection();
  });

  document.addEventListener('videoSkipped', () => {
    log('Vídeo pulado, avançando...');
    goToNextSection();
  });

  window.goToNextSection = () => {
    if (window.JC?.initialized) {
      goToNextSection();
    } else {
      enqueueAction({ type: 'next' });
    }
  };

  document.addEventListener('jc:ready', processQueue);

  log('Controlador inicializado com sucesso');
}

document.addEventListener('bootstrapComplete', () => {
  log('Bootstrap concluído, aguardando i18n...');
  i18n.init().then(() => {
    log('i18n pronto, iniciando controlador');
    initController('intro');
  }).catch(err => {
    console.error('[CONTROLLER] Erro ao aguardar i18n:', err);
    initController('intro');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  if (!window.JC?.initialized) {
    log('Fallback: Inicializando controlador via DOMContentLoaded');
    i18n.init().then(() => {
      initController('intro');
    }).catch(err => {
      console.error('[CONTROLLER] Erro ao aguardar i18n:', err);
      initController('intro');
    });
  }
});
