/* jornada-paper-qa.js — versão FINAL (usa window/win, sem global) */
(function (win) {
  'use strict';

  if (win.jornadaPaperQALoaded) {
    console.log('[JORNADA_PAPER] Script já carregado, ignorando...');
    return;
  }
  win.jornadaPaperQALoaded = true;

  const log  = (...args) => console.log('[JORNADA_PAPER]', ...args);
  const warn = (...args) => console.warn('[JORNADA_PAPER]', ...args);

  // Fallback leve de i18n
  const i18n = win.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (k, fallback) => fallback || k,
    apply: () => {},
    waitForReady: async () => {}
  };

  const CFG = Object.assign({
    CANVAS_ID: 'jornada-canvas',
    CONTENT_ID: 'jornada-conteudo',
    PERGAMINHO_HORIZ: '/assets/img/pergaminho-rasgado-horiz.png',
    PERGAMINHO_VERT: '/assets/img/pergaminho-rasgado-horiz.png',
    VIDEO_BASE: '/assets/img/'
  }, win.JORNADA_CFG || {});

  const VIDEO_BASE = CFG.VIDEO_BASE;

  // Vídeos globais da Jornada
  win.JORNADA_VIDEOS = win.JORNADA_VIDEOS || {
    intro: VIDEO_BASE + 'filme-0-ao-encontro-da-jornada.mp4',
    afterBlocks: {
      0: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      1: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      2: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      3: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    final: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
  };
  win.JORNADA_FINAL_VIDEO = win.JORNADA_VIDEOS.final;

  // Blocos multilíngues
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
    'en-US': [
      {
        id: 'raizes',
        title: 'Block 1 — Roots',
        data_i18n: 'bloco_raizes_title',
        questions: [
          { id: 'quem_voce_hoje', label: 'Who are you today?', data_i18n: 'pergunta_quem_voce_hoje' },
          { id: 'o_que_te_trouxe', label: 'What brought you to this journey?', data_i18n: 'pergunta_o_que_te_trouxe' },
          { id: 'sonho_espiritual', label: 'What is your greatest spiritual dream?', data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Block 2 — Reflections',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'desafios_atuais', label: 'What are your biggest current challenges?', data_i18n: 'pergunta_desafios_atuais' },
          { id: 'medo_duvida', label: 'How do you deal with fear or doubt?', data_i18n: 'pergunta_medo_duvida' },
          { id: 'significado_luz', label: 'What does "light" mean to you?', data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Block 3 — Growth',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'mudar_vida', label: 'What do you want to change in your life?', data_i18n: 'pergunta_mudar_vida' },
          { id: 'quem_inspira', label: 'Who inspires you and why?', data_i18n: 'pergunta_quem_inspira' },
          { id: 'pratica_gratidao', label: 'How do you practice gratitude daily?', data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Block 4 — Integration',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'licao_jornada', label: 'What lesson do you take from this journey?', data_i18n: 'pergunta_licao_jornada' },
          { id: 'aplicar_futuro', label: 'How will you apply this in the future?', data_i18n: 'pergunta_aplicar_futuro' },
          { id: 'mensagem_futuro', label: 'A message for your future self.', data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Block 5 — Synthesis and Delivery',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'essencia_hoje', label: 'Who are you today, in one true sentence?', data_i18n: 'pergunta_essencia_hoje' },
          { id: 'passo_fe', label: 'What will be your next step of faith and courage?', data_i18n: 'pergunta_passo_fe' }
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

  let JORNADA_BLOCKS = [];
  win.JORNADA_BLOCKS = JORNADA_BLOCKS;

  function elCanvas()  { return document.getElementById(CFG.CANVAS_ID); }
  function elContent() { return document.getElementById(CFG.CONTENT_ID); }

  function ensureCanvas() {
    if (win.__currentSectionId !== 'section-perguntas') {
      return { root: null, content: null };
    }

    let root = elCanvas();
    if (!root) {
      root = document.createElement('section');
      root.id = CFG.CANVAS_ID;
      root.className = 'card pergaminho';
      document.getElementById('section-perguntas')?.querySelector('.content')?.appendChild(root);
    }

    let content = elContent();
    if (!content && root) {
      content = document.createElement('div');
      content.id = CFG.CONTENT_ID;
      content.className = 'conteudo-pergaminho';
      root.appendChild(content);
    }

    return { root, content };
  }

  function setPergaminho(mode = 'h') {
    const { root } = ensureCanvas();
    if (!root) return;
    root.classList.remove('pergaminho-v', 'pergaminho-h');
    root.classList.add(mode === 'v' ? 'pergaminho-v' : 'pergaminho-h');
    root.style.backgroundImage = `url("${mode === 'v' ? CFG.PERGAMINHO_VERT : CFG.PERGAMINHO_HORIZ}")`;
    root.style.backgroundRepeat = 'no-repeat';
    root.style.backgroundPosition = 'center';
    root.style.backgroundSize = 'cover';
    root.style.minHeight = '82vh';
  }

  // VÍDEO: DESATIVADO AQUI
  function loadVideo(videoSrc) {
    console.log('[JORNADA_PAPER] Vídeo solicitado (ignorado):', videoSrc);
  }

  async function renderQuestions() {
    setPergaminho('h');
    const { content } = ensureCanvas();
    if (!content || !JORNADA_BLOCKS.length) return;

    content.innerHTML = '';

    const JC = win.JC || { currentBloco: 0, currentPergunta: 0 };
    const block = JORNADA_BLOCKS[JC.currentBloco] || JORNADA_BLOCKS[0];
    const q = block.questions[JC.currentPergunta] || block.questions[0];
    const perguntaTexto = i18n.t(q.data_i18n, q.label);

    const header = document.createElement('div');
    header.className = 'perguntas-header';
    header.innerHTML = `...`; // mesmo que antes
    content.appendChild(header);

    const pergaminho = document.createElement('div');
    pergaminho.className = 'pergaminho-container';
    pergaminho.innerHTML = `
      <div class="jp-question-display">
        <div class="jp-question-typed" id="question-display"></div>
      </div>
      <div class="jp-answer-container">
        <div class="jp-answer-frame">
          <div class="jp-answer-bg"></div>
          <textarea class="jp-answer-input" id="answer-input" placeholder="Digite com verdade e calma..." maxlength="1000"></textarea>
        </div>
      </div>
      <div class="perguntas-controls">
        <button class="btn-perguntas btn-confirm" id="btn-next">
          ${JC.currentPergunta < block.questions.length - 1 ? 'Próxima' : 'Concluir'}
        </button>
      </div>
    `;
    content.appendChild(pergaminho);

    const input = document.getElementById('answer-input');
    const saved = localStorage.getItem(`jornada_answer_${JC.currentBloco}_${JC.currentPergunta}`);
    if (saved) input.value = saved;

// === ATUALIZA TODAS AS BARRAS ===
function updateProgress(block = 1, question = 1) {
  const totalBlocks = 5;
  const questionsPerBlock = 10;
  const totalQuestions = 50;
  const currentTotal = ((block - 1) * questionsPerBlock) + question;

  // Bloco
  const blockPercent = (block / totalBlocks) * 100;
  document.getElementById('progress-block-fill').style.width = `${blockPercent}%`;
  document.getElementById('progress-block-value').textContent = `${block} de ${totalBlocks}`;

  // Pergunta do bloco
  const questionPercent = (question / questionsPerBlock) * 100;
  document.getElementById('progress-question-fill').style.width = `${questionPercent}%`;
  document.getElementById('progress-question-value').textContent = `${question} / ${questionsPerBlock}`;

  // Total com ampulheta
  document.getElementById('progress-total-value').textContent = `${currentTotal} / ${totalQuestions}`;
}

// CHAME SEMPRE QUE MUDAR DE PERGUNTA:
updateProgress(currentBlock, currentQuestion);
    
    // DATILOGRAFIA
    let i = 0;
    const display = document.getElementById('question-display');
    display.textContent = '';
    const speed = 38;
    await new Promise(res => {
      const int = setInterval(() => {
        display.textContent = perguntaTexto.slice(0, i);
        i++;
        if (i > perguntaTexto.length) {
          clearInterval(int);
          display.classList.add('typing-done');
          res();
        }
      }, speed);
    });

    document.getElementById('btn-next').onclick = async () => {
      const resposta = input.value.trim();
      if (!resposta && JC.currentPergunta < block.questions.length - 1) {
        win.toast?.('Escreva sua resposta antes de avançar.');
        return;
      }

      localStorage.setItem(`jornada_answer_${JC.currentBloco}_${JC.currentPergunta}`, resposta);

      if (JC.currentPergunta < block.questions.length - 1) {
        JC.currentPergunta++;
      } else if (JC.currentBloco < JORNADA_BLOCKS.length - 1) {
        JC.currentBloco++;
        JC.currentPergunta = 0;
        const nextVideo = JORNADA_BLOCKS[JC.currentBloco - 1]?.video_after;
        if (nextVideo && window.playBlockTransition) {
          await new Promise(resolve => window.playBlockTransition(nextVideo, resolve));
        }
      } else {
        document.dispatchEvent(new CustomEvent('qa:completed'));
        return;
      }

      win.JC = JC;
      renderQuestions();
    };

    log('Pergunta renderizada com sucesso');
  }
  
   async function loadDynamicBlocks() {
    await i18n.waitForReady(10000); 
    const lang = i18n.lang || 'pt-BR'; 
    const base = blockTranslations[lang] || 
    blockTranslations['pt-BR']; 
    JORNADA_BLOCKS = base.map(b => ({ 
    id: b.id, title: b.title, data_i18n: b.data_i18n, 
    questions: b.questions, video_after: 
    b.video_after, tipo: 'perguntas' })); 
    win.JORNADA_BLOCKS = JORNADA_BLOCKS; 
    log('Blocos carregados:', 
    JORNADA_BLOCKS.length); 
    return true;
  }

  async function initPaperQA() {
    await loadDynamicBlocks();
  }

  document.addEventListener('DOMContentLoaded', initPaperQA);

  win.JPaperQA = {
    loadDynamicBlocks,
    renderQuestions,
    loadVideo,
    setPergaminho,
    ensureCanvas,
    init: initPaperQA
  };

  log('jornada-paper-qa.js carregado com sucesso');
})(window);
