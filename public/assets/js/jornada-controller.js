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
  if (currentIdx < sections.length - 1) {
    // Verificar se todas as perguntas foram respondidas em section-perguntas
    if (currentSection === 'section-perguntas') {
      const totalQuestions = window.JORNADA_BLOCKS?.reduce((sum, block) => sum + (block.questions?.length || 0), 0) || 0;
      if (answeredQuestions.size < totalQuestions) {
        log('Aguardando todas as perguntas serem respondidas:', {
          respondidas: answeredQuestions.size,
          total: totalQuestions
        });
        return;
      }
    }

    const previousSection = currentSection;
    currentSection = sections[currentIdx + 1];
    log(`Indo de ${previousSection} para ${currentSection}`);

    // Ocultar seção anterior
    const prevElement = document.querySelector(`#${previousSection}`);
    if (prevElement) prevElement.classList.remove('active');

    // Mostrar nova seção
    const nextElement = document.querySelector(`#${currentSection}`);
    if (nextElement) {
      nextElement.classList.add('active');
    } else {
      console.error(`[CONTROLLER] Seção ${currentSection} não encontrada`);
      return;
    }

    // Lógica específica por seção (mantendo compatibilidade com termos-pg1/pg2)
    if (currentSection === 'section-termos') {
      const termosPg1 = document.getElementById('termos-pg1');
      const termosPg2 = document.getElementById('termos-pg2');
      if (termosPg1 && !termosPg1.classList.contains('hidden')) {
        termosPg1.classList.add('hidden');
        termosPg2.classList.remove('hidden');
        log('Avançando de termos-pg1 para termos-pg2');
        return;
      }
    } else if (currentSection === 'section-perguntas') {
      answeredQuestions.clear(); // Resetar respostas ao entrar na seção
      renderQuestions(); // Renderizar todas as perguntas
      window.perguntasLoaded = true; // Flag para compatibilidade
      log('Perguntas carregadas e renderizadas');
    } else if (currentSection === 'section-guia') {
      loadVideo('/path/to/guia-video.mp4'); // Ajuste o caminho
    } else if (currentSection === 'section-final') {
      log('Jornada concluída! 🎉');
      // Opcional: reproduzir vídeo final se disponível
      if (window.JORNADA_FINAL_VIDEO && window.playTransition) {
        window.playTransition(window.JORNADA_FINAL_VIDEO, () => {
          log('Vídeo final concluído');
        });
      }
    }

    // Transições globais (typing, etc., se disponíveis)
    if (window.runTyping) {
      const typingElement = document.querySelector(`#${currentSection} .typing-target`); // Ajuste o seletor
      if (typingElement) {
        window.runTyping(typingElement);
      }
    }

    if (window.playTransition) {
      const transitionVideo = window.JORNADA_VIDEOS?.[currentSection]; // Vídeo de transição por seção
      if (transitionVideo) {
        window.playTransition(transitionVideo, () => {
          log(`Transição concluída para ${currentSection}`);
        });
      }
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

