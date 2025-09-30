```javascript
// jornada-paper-qa.js
// Versão corrigida - Sem erro de export, liso e funcional (Outubro 2025)
// Descrição: Módulo para QA dinâmico com blocos de perguntas, vídeos e efeitos visuais na Jornada Conhecimento com Luz

'use strict';

import i18n from './i18n.js';

// Função de log
const log = (...args) => console.log('[JORNADA_PAPER]', ...args);

// Evita redeclaração do módulo
if (window.JornadaPaperQA) {
  console.warn('[JORNADA_PAPER] Módulo já carregado, pulando redefinição');
} else {
  window.JornadaPaperQA = true;

  // Configurações
  const CFG = Object.assign({
    CANVAS_ID: 'jornada-canvas',
    CONTENT_ID: 'jornada-conteudo',
    PERGAMINHO_VERT: '/assets/img/pergaminho-rasgado-vert.png',
    PERGAMINHO_HORIZ: '/assets/img/pergaminho-rasgado-horiz.png',
    VIDEO_BASE: '/assets/img/'
  }, window.JORNADA_CFG || {});

  const VIDEO_BASE = CFG.VIDEO_BASE;
  window.JORNADA_VIDEOS = {
    intro: VIDEO_BASE + 'filme-0-ao-encontro-da-jornada.mp4',
    afterBlocks: {
      0: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      1: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      2: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      3: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    final: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
  };
  window.JORNADA_FINAL_VIDEO = window.JORNADA_VIDEOS.final;

  // Blocos de perguntas com traduções
  const blockTranslations = {
    'pt-BR': [
      {
        id: 'raizes',
        title: 'Bloco 1 — Raízes',
        data_i18n: 'bloco_raizes_title',
        questions: [
          { id: 'quem_voce_hoje', label: 'Quem você é hoje?', data_i18n: 'pergunta_quem_voce_hoje' },
          { id: 'o_que_te_trouxe', label: 'O que te trouxe para essa jornada?', data_i18n: 'pergunta_o_que_te_trouxe' },
          { id: 'sonho_espiritual', label: 'Qual é o seu maior sonho espiritual?', data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Bloco 2 — Reflexões',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'desafios_atuais', label: 'Quais são seus maiores desafios atuais?', data_i18n: 'pergunta_desafios_atuais' },
          { id: 'medo_duvida', label: 'Como você lida com medo ou dúvida?', data_i18n: 'pergunta_medo_duvida' },
          { id: 'significado_luz', label: 'O que "luz" significa para você?', data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Bloco 3 — Crescimento',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'mudar_vida', label: 'O que você quer mudar na sua vida?', data_i18n: 'pergunta_mudar_vida' },
          { id: 'quem_inspira', label: 'Quem te inspira e por quê?', data_i18n: 'pergunta_quem_inspira' },
          { id: 'pratica_gratidao', label: 'Como você pratica gratidão diariamente?', data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Bloco 4 — Integração',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'licao_jornada', label: 'Qual lição você tira dessa jornada?', data_i18n: 'pergunta_licao_jornada' },
          { id: 'aplicar_futuro', label: 'Como você aplicará isso no futuro?', data_i18n: 'pergunta_aplicar_futuro' },
          { id: 'mensagem_futuro', label: 'Uma mensagem para o seu eu futuro.', data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Bloco 5 — Síntese e Entrega',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'essencia_hoje', label: 'Quem você é hoje, em uma frase verdadeira?', data_i18n: 'pergunta_essencia_hoje' },
          { id: 'passo_fe', label: 'Qual será seu próximo passo de fé e coragem?', data_i18n: 'pergunta_passo_fe' }
        ],
        video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
      }
    ],
    'es-ES': [
      {
        id: 'raizes',
        title: 'Bloque 1 — Raíces',
        data_i18n: 'bloco_raizes_title',
        questions: [
          { id: 'quem_voce_hoje', label: '¿Quién eres hoy?', data_i18n: 'pergunta_quem_voce_hoje' },
          { id: 'o_que_te_trouxe', label: '¿Qué te trajo a este viaje?', data_i18n: 'pergunta_o_que_te_trouxe' },
          { id: 'sonho_espiritual', label: '¿Cuál es tu mayor sueño espiritual?', data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Bloque 2 — Reflexiones',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'desafios_atuais', label: '¿Cuáles son tus mayores desafíos actuales?', data_i18n: 'pergunta_desafios_atuais' },
          { id: 'medo_duvida', label: '¿Cómo lidias con el miedo o la duda?', data_i18n: 'pergunta_medo_duvida' },
          { id: 'significado_luz', label: '¿Qué significa la "luz" para ti?', data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Bloque 3 — Crecimiento',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'mudar_vida', label: '¿Qué quieres cambiar en tu vida?', data_i18n: 'pergunta_mudar_vida' },
          { id: 'quem_inspira', label: '¿Quién te inspira y por qué?', data_i18n: 'pergunta_quem_inspira' },
          { id: 'pratica_gratidao', label: '¿Cómo practicas la gratitud a diario?', data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Bloque 4 — Integración',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'licao_jornada', label: '¿Qué lección te llevas de este viaje?', data_i18n: 'pergunta_licao_jornada' },
          { id: 'aplicar_futuro', label: '¿Cómo aplicarás esto en el futuro?', data_i18n: 'pergunta_aplicar_futuro' },
          { id: 'mensagem_futuro', label: 'Un mensaje para tu yo futuro.', data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Bloque 5 — Síntesis y Entrega',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'essencia_hoje', label: '¿Quién eres hoy, en una frase verdadera?', data_i18n: 'pergunta_essencia_hoje' },
          { id: 'passo_fe', label: '¿Cuál será tu próximo paso de fe y coraje?', data_i18n: 'pergunta_passo_fe' }
        ],
        video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
      }
    ]
  };

  // Inicializa JORNADA_BLOCKS
  let JORNADA_BLOCKS = [];

  // Função para obter o elemento canvas
  function elCanvas() {
    return document.getElementById(CFG.CANVAS_ID);
  }

  // Função para obter o elemento de conteúdo
  function elContent() {
    return document.getElementById(CFG.CONTENT_ID);
  }

  // Garante que o canvas e o conteúdo existam no DOM
  function ensureCanvas() {
    let root = elCanvas();
    if (!root) {
      root = document.createElement('section');
      root.id = CFG.CANVAS_ID;
      root.className = 'card pergaminho';
      document.body.appendChild(root);
    }
    let content = elContent();
    if (!content) {
      content = document.createElement('div');
      content.id = CFG.CONTENT_ID;
      content.className = 'conteudo-pergaminho';
      root.appendChild(content);
    }
    log('Canvas garantido:', { root, content });
    return { root, content };
  }

  // Aplica o estilo de pergaminho ao canvas
  function setPergaminho(mode = 'h') {
    const { root } = ensureCanvas();
    root.classList.remove('pergaminho-v', 'pergaminho-h');
    const isV = mode === 'v';
    root.classList.add(isV ? 'pergaminho-v' : 'pergaminho-h');
    const imageUrl = isV ? CFG.PERGAMINHO_VERT : CFG.PERGAMINHO_HORIZ;
    root.style.backgroundImage = `url("${imageUrl}")`;
    root.style.backgroundRepeat = 'no-repeat';
    root.style.backgroundPosition = 'center';
    root.style.backgroundSize = 'cover';
    root.style.minHeight = '82vh';
    log('Pergaminho aplicado:', { mode, imageUrl });
  }

  // Constrói o formulário HTML para as perguntas
  function buildForm(questions = []) {
    return `
      <form id="form-perguntas" class="grid gap-3">
        ${questions.map(q => `
          <label class="grid gap-1">
            <span class="font-medium pergunta-enunciado text" data-i18n="${q.data_i18n}" data-typing="true" data-speed="36" data-cursor="true">${q.label}</span>
            <textarea name="${q.id}" class="px-3 py-2 rounded border border-gray-300 bg-white/80" data-i18n-placeholder="resposta_placeholder" placeholder="Digite sua resposta..."></textarea>
          </label>
        `).join('')}
      </form>
    `;
  }

  // Carrega blocos dinâmicos com traduções
  async function loadDynamicBlocks() {
    try {
      await i18n.waitForReady(10000);
      if (!i18n.ready) throw new Error('i18n não inicializado');

      const lang = i18n.lang || 'pt-BR';
      window.JORNADA_BLOCKS = blockTranslations[lang] || blockTranslations['pt-BR'];

      log('JORNADA_BLOCKS preenchido:', window.JORNADA_BLOCKS);
      await renderQuestions();
      return true;
    } catch (error) {
      console.error('[JORNADA_PAPER] Erro ao preencher JORNADA_BLOCKS:', error.message);
      window.JORNADA_BLOCKS = [];
      if (window.toast) {
        window.toast('Erro ao carregar blocos de perguntas');
      }
      return false;
    }
  }

  // Renderiza as perguntas na UI
  async function renderQuestions() {
    setPergaminho('h');
    const { content } = ensureCanvas();
    if (!content) {
      console.error('[JORNADA_PAPER] Container de perguntas não encontrado');
      if (window.toast) window.toast('Erro ao carregar perguntas.');
      return;
    }

    if (!window.JORNADA_BLOCKS || !Array.isArray(window.JORNADA_BLOCKS)) {
      console.error('[JORNADA_PAPER] JORNADA_BLOCKS não está definido ou não é um array');
      if (window.toast) window.toast('Erro ao carregar blocos de perguntas.');
      return;
    }

    content.innerHTML = '';
    content.classList.remove('section-hidden');

    window.JORNADA_BLOCKS.forEach((block, bIdx) => {
      const bloco = document.createElement('div');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = bIdx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = bIdx === window.JC?.currentBloco ? 'block' : 'none';

      if (block.title) {
        const title = document.createElement('h3');
        title.className = 'pergunta-enunciado text';
        title.dataset.i18n = block.data_i18n;
        title.dataset.typing = 'true';
        title.dataset.speed = '36';
        title.dataset.cursor = 'true';
        title.textContent = block.title;
        bloco.appendChild(title);
      }

      block.questions.forEach((q, qIdx) => {
        const div = document.createElement('div');
        div.className = 'j-pergunta';
        div.dataset.perguntaId = `${block.id}-${qIdx}`;
        div.style.display = bIdx === window.JC?.currentBloco && qIdx === window.JC?.currentPergunta ? 'block' : 'none';
        div.innerHTML = `
          <label class="pergunta-enunciado text" data-i18n="${q.data_i18n}" data-typing="true" data-speed="36" data-cursor="true">${q.label}</label>
          <textarea rows="4" class="input" data-i18n-placeholder="resposta_placeholder" placeholder="Digite sua resposta..."></textarea>
          <div class="accessibility-controls">
            <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
            <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
            <button class="btn btn-avancar" data-action="avancar" data-question-id="${block.id}-${qIdx}" data-i18n="btn-avancar">Avançar</button>
          </div>
        `;
        bloco.appendChild(div);
      });

      content.appendChild(bloco);
    });

    if (i18n.ready) {
      i18n.apply(content);
    } else {
      console.warn('[JORNADA_PAPER] i18n não pronto, pulando i18n.apply');
    }

    const currentBloco = content.querySelector(`[data-bloco="${window.JC?.currentBloco || 0}"]`);
    if (currentBloco) {
      currentBloco.style.display = 'block';
      const currentPergunta = currentBloco.querySelector(`[data-perguntaId="${window.JC?.currentBloco || 0}-${window.JC?.currentPergunta || 0}"]`);
      if (currentPergunta) {
        currentPergunta.style.display = 'block';
        currentPergunta.classList.add('active');
        setTimeout(() => {
          log('Iniciando typeQuestionsSequentially para bloco', window.JC?.currentBloco || 0);
          typeQuestionsSequentially(currentBloco);
        }, 100);
      }
    }

    log('Perguntas renderizadas, total de blocos:', window.JORNADA_BLOCKS.length);
  }

  // Carrega e reproduz um vídeo de transição
  function loadVideo(videoSrc) {
    const video = document.querySelector('#videoTransicao');
    const videoOverlay = document.querySelector('#videoOverlay');
    if (!video || !videoOverlay) {
      console.error('[JORNADA_PAPER] #videoTransicao ou #videoOverlay não encontrado');
      return;
    }
    video.src = videoSrc;
    video.style.zIndex = 2001;
    videoOverlay.style.zIndex = 2000;
    video.load();
    video.play().catch(err => console.error('[JORNADA_PAPER] Erro ao reproduzir vídeo:', err));
    log('Vídeo carregado:', videoSrc);
  }

  // Digita o placeholder de um input com efeito de digitação
  let __abortTypingPlaceholder = null;
  async function typePlaceholder(inp, text, speed = 22) {
    if (!inp) return;
    if (__abortTypingPlaceholder) __abortTypingPlaceholder();
    let abort = false;
    __abortTypingPlaceholder = () => (abort = true);
    inp.placeholder = '';
    const aria = document.getElementById('aria-pergunta');
    if (aria) aria.textContent = text;
    for (let i = 0; i <= text.length; i++) {
      if (abort) break;
      inp.placeholder = text.slice(0, i) + (i < text.length ? '▌' : '');
      await new Promise(r => setTimeout(r, speed));
    }
    if (!abort) {
      inp.placeholder = text;
    }
    if (aria) {
      aria.textContent = '';
    }
    log('Placeholder digitado:', text);
  }

  // Digita elementos com efeito de digitação sequencial
  async function typeQuestionsSequentially(bloco) {
    const elements = bloco.querySelectorAll('[data-typing="true"]');
    for (const el of elements) {
      const key = el.dataset.i18n;
      const text = i18n.t(key, el.textContent || key);
      await typeEffect(el, text, parseInt(el.dataset.speed) || 36);
    }
    const textareas = bloco.querySelectorAll('.j-pergunta textarea');
    for (const textarea of textareas) {
      const key = textarea.dataset.i18nPlaceholder;
      const text = i18n.t(key, textarea.placeholder || key);
      await typePlaceholder(textarea, text, 22);
    }
  }

  // Aplica efeito de digitação a um elemento
  async function typeEffect(element, text, delay = 36) {
    element.textContent = '';
    if (element.dataset.cursor === 'true') {
      element.classList.add('typing-cursor');
    }
    for (let char of text) {
      element.textContent += char;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (element.dataset.cursor === 'true') {
      element.classList.remove('typing-cursor');
    }
  }

  // Inicializa eventos de acessibilidade e interação
  function initPaperQAEvents() {
    document.querySelectorAll('[data-action="read-question"]').forEach(button => {
      button.addEventListener('click', () => {
        const pergunta = button.closest('.j-pergunta').querySelector('[data-i18n]');
        const key = pergunta.dataset.i18n;
        const text = i18n.t(key, pergunta.textContent);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = i18n.lang || 'pt-BR';
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('[JORNADA_PAPER] SpeechSynthesis não suportado');
        }
      });
    });

    document.querySelectorAll('[data-action="start-mic"]').forEach(button => {
      button.addEventListener('click', () => {
        log('Microfone acionado (funcionalidade não implementada)');
        if (window.toast) window.toast('Microfone não implementado ainda.');
      });
    });

    document.querySelectorAll('[data-action="avancar"]').forEach(button => {
      button.addEventListener('click', () => {
        const questionId = button.dataset.questionId;
        const [blockId, qIdx] = questionId.split('-');
        const currentBloco = window.JORNADA_BLOCKS[window.JC?.currentBloco || 0];
        const nextQIdx = parseInt(qIdx) + 1;

        if (nextQIdx < currentBloco.questions.length) {
          window.JC.currentPergunta = nextQIdx;
          renderQuestions();
        } else if (window.JC.currentBloco < window.JORNADA_BLOCKS.length - 1) {
          window.JC.currentBloco = (window.JC?.currentBloco || 0) + 1;
          window.JC.currentPergunta = 0;
          if (currentBloco.video_after) {
            loadVideo(currentBloco.video_after);
          }
          renderQuestions();
        } else {
          if (window.JORNADA_FINAL_VIDEO) {
            loadVideo(window.JORNADA_FINAL_VIDEO);
          }
          if (window.toast) window.toast('Jornada concluída!');
        }
        log('Avançar clicado:', { blockId, qIdx, nextBloco: window.JC?.currentBloco, nextPergunta: window.JC?.currentPergunta });
      });
    });

    const skipVideoButton = document.querySelector('#skipVideo');
    if (skipVideoButton) {
      skipVideoButton.addEventListener('click', () => {
        log('Vídeo pulado');
        document.dispatchEvent(new CustomEvent('videoSkipped'));
      });
    }
  }

  // Inicializa o módulo Paper QA
  async function initPaperQA() {
    try {
      await loadDynamicBlocks();
      initPaperQAEvents();
      log('Inicializado com sucesso');
    } catch (error) {
      console.error('[JORNADA_PAPER] Erro na inicialização:', error.message);
      window.JORNADA_BLOCKS = [];
      if (window.toast) window.toast('Erro ao inicializar a jornada.');
    }
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', initPaperQA);
  document.addEventListener('change', (e) => {
    if (e.target.id === 'language-select') {
      i18n.setLang(e.target.value).then(() => {
        loadDynamicBlocks();
        renderQuestions();
        log('Idioma alterado, blocos recarregados');
      });
    }
  });

  log('Script jornada-paper-qa.js carregado com sucesso');

  // Exportações
  export {
    loadDynamicBlocks,
    renderQuestions,
    loadVideo,
    setPergaminho,
    ensureCanvas,
    typeQuestionsSequentially,
    typePlaceholder
  };
}
