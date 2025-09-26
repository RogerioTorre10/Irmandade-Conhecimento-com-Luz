// /assets/js/jornada-controller.js
import { renderQuestions, loadVideo } from './jornada-paper-qa.js'; // Ajuste o caminho conforme necessário

const log = (...args) => console.log('[CONTROLLER]', ...args);

let currentSection = 'section-inicio';
const sections = [
  'section-inicio',
  'section-termos',
  'section-senha',  // Mantido para compatibilidade com o código original
  'section-guia',
  'section-selfie',
  'section-perguntas',
  'section-final'
];
let answeredQuestions = new Set(); // Rastrear perguntas respondidas
let isProcessingClick = false; // Debounce para cliques
let queue = []; // Fila de ações pendentes (next, etc.)

// Fila de ações para quando o controller não estiver pronto
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

// Função debounced para cliques
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

function goToNextSection() {
  const currentIdx = sections.indexOf(currentSection);
  log('Índice atual:', currentIdx, 'Seção atual:', currentSection);
  if (currentIdx < sections.length - 1) {
    const previousSection = currentSection;
    currentSection = sections[currentIdx + 1];
    log(`Tentando navegar de ${previousSection} para ${currentSection}`);

    // Ocultar seção anterior
    const prevElement = document.querySelector(`#${previousSection}`);
    if (prevElement) {
      prevElement.classList.remove('active');
      prevElement.classList.add('hidden');
      log(`Seção anterior ${previousSection} ocultada`);
    } else {
      console.error(`[CONTROLLER] Seção anterior ${previousSection} não encontrada`);
    }

    // Mostrar nova seção
    const nextElement = document.querySelector(`#${currentSection}`);
    if (nextElement) {
      nextElement.classList.add('active');
      nextElement.classList.remove('hidden');
      log(`Seção ${currentSection} exibida`);
    } else {
      console.error(`[CONTROLLER] Seção ${currentSection} não encontrada`);
      return;
    }

    // Lógica específica por seção
    if (currentSection === 'section-termos') {
      const termosPg1 = document.getElementById('termos-pg1');
      const termosPg2 = document.getElementById('termos-pg2');
      if (termosPg1 && !termosPg1.classList.contains('hidden')) {
        termosPg1.classList.remove('hidden');
        termosPg2.classList.add('hidden');
        log('Exibindo termos-pg1');
        return;
      }
    } else if (currentSection === 'section-perguntas') {
      try {
        answeredQuestions.clear();
        renderQuestions();
        window.perguntasLoaded = true;
        log('Perguntas carregadas e renderizadas');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao renderizar perguntas:', error);
      }
    } else if (currentSection === 'section-guia') {
      try {
        loadVideo('/path/to/guia-video.mp4');
        log('Vídeo do guia carregado');
      } catch (error) {
        console.error('[CONTROLLER] Erro ao carregar vídeo do guia:', error);
      }
    } else if (currentSection === 'section-final') {
      log('Jornada concluída! 🎉');
      if (window.JORNADA_FINAL_VIDEO && window.playTransition) {
        window.playTransition(window.JORNADA_FINAL_VIDEO, () => {
          log('Vídeo final concluído');
        });
      }
    }

    // Executar animação de digitação
    if (window.runTyping) {
      const typingElements = document.querySelectorAll(`#${currentSection} [data-typing="true"]`);
      if (typingElements.length > 0) {
        typingElements.forEach((element, index) => {
          window.runTyping(element, () => {
            log(`Animação ${index + 1}/${typingElements.length} concluída em ${currentSection}`);
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

function initController(route = 'inicio') {
  log('Inicializando controlador...');

  // Verificar dependências
  const dependencies = {
    JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
    JORNADA_VIDEOS: !!window.JORNADA_VIDEOS,
    showSection: !!window.showSection,
    runTyping: !!window.runTyping,
    playTransition: !!window.playTransition
  };
  log('Dependências:', dependencies);

  if (!window.JORNADA_BLOCKS || !window.JORNADA_VIDEOS) {
    console.error('JORNADA_BLOCKS ou JORNADA_VIDEOS não definido, pulando para section-final');
    currentSection = 'section-final';
    const finalElement = document.querySelector('#section-final');
    if (finalElement) finalElement.classList.add('active');
    return;
  }

  // Configurar globals para compatibilidade com código legado
  window.JC = {
    currentBloco: 0,
    currentPergunta: 0,
    nextSection: null,
    initialized: true,
    init: () => log('JC init chamado (já inicializado)'),
    goNext: goToNextSection
  };
  window.__currentSectionId = route === 'inicio' ? 'section-inicio' : route;
  window.perguntasLoaded = false;

  // Mostrar seção inicial
  const initialElement = document.querySelector(`#${currentSection}`);
  if (initialElement) {
    initialElement.classList.add('active');
    log(`Seção inicial exibida: ${currentSection}`);
  } else {
    console.error(`[CONTROLLER] Seção inicial ${currentSection} não encontrada`);
  }

  // Inicializar botões de navegação (debounced)
  const debouncedGoNext = debounceClick(() => goToNextSection());
  document.querySelectorAll('.btn-avancar, [data-action="avancar"], #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney, #iniciarSenha, [data-action="termos-next"]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      log('Botão avançar clicado:', button.id || button.className);
      debouncedGoNext();
    });
  });

  // Botão termos-prev (específico)
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

  // Escutar respostas de perguntas
  document.addEventListener('questionAnswered', (event) => {
    const questionId = event.detail.questionId;
    answeredQuestions.add(questionId);
    log(`Pergunta respondida: ${questionId}, Total respondidas: ${answeredQuestions.size}`);
    // Tentar avançar após cada resposta
    goToNextSection();
  });

  // Escutar pulo de vídeo
  document.addEventListener('videoSkipped', () => {
    log('Vídeo pulado, avançando...');
    goToNextSection();
  });

  // Expor funções globais para compatibilidade
  window.goToNextSection = () => {
    if (window.JC?.initialized) {
      goToNextSection();
    } else {
      enqueueAction({ type: 'next' });
    }
  };

  // Processar fila quando pronto
  document.addEventListener('jc:ready', processQueue);

  log('Controlador inicializado com sucesso');
}

// Aguardar inicialização do bootstrap
document.addEventListener('bootstrapComplete', () => {
  log('Bootstrap concluído, iniciando controlador');
  initController('inicio');
});

// Fallback para inicialização direta (compatibilidade)
document.addEventListener('DOMContentLoaded', () => {
  if (!window.JC?.initialized) {
    log('Fallback: Inicializando controlador via DOMContentLoaded');
    initController('inicio');
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const avancarButton = document.querySelector('#section-inicio .btn-avancar, #section-inicio #iniciar, #section-inicio [data-action="avancar"]');
  if (avancarButton) {
    console.log('[DEBUG] Botão Avançar encontrado:', avancarButton);
    avancarButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[DEBUG] Clique no botão Avançar detectado');
      window.goToNextSection();
    });
  } else {
    console.error('[DEBUG] Botão Avançar não encontrado em #section-inicio');
  }
});

