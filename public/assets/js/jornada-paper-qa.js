/* jornada-paper-qa.js — versão FINAL CORRIGIDA (usa window, não global) */
(function (win) {
  'use strict';

  if (win.jornadaPaperQALoaded) {
    console.log('[JORNADA_PAPER] Script já carregado, ignorando...');
    return;
  }
  win.jornadaPaperQALoaded = true;

  const log = (...args) => console.log('[JORNADA_PAPER]', ...args);
  const warn = (...args) => console.warn('[JORNADA_PAPER]', ...args);

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
    VIDEO_BASE: '/assets/img/'
  }, win.JORNADA_CFG || {});

  const VIDEO_BASE = CFG.VIDEO_BASE;

  window.JORNADA_VIDEOS = window.JORNADA_VIDEOS || {
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

  const blockTranslations = {
    'pt-BR': [
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
  win.JORNADA_BLOCKS = [];

  // ===== UTIL DOM =====
  function elCanvas() { return document.getElementById(CFG.CANVAS_ID); }
  function elContent() { return document.getElementById(CFG.CONTENT_ID); }

  function ensureCanvas() {
    if (win.__currentSectionId !== 'section-perguntas') return { root: null, content: null };
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

  // ===== DATILOGRAFIA =====
  async function paperTypeText(element, text, speed = 36) {
    return new Promise(resolve => {
      let i = 0;
      element.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'typing-caret';
      caret.textContent = '|';
      element.appendChild(caret);

      const interval = setInterval(() => {
        element.textContent = text.slice(0, i);
        caret.style.opacity = i < text.length ? '1' : '0';
        i++;
        if (i > text.length) {
          clearInterval(interval);
          caret.remove();
          element.classList.add('typing-done');
          resolve();
        }
      }, speed);
    });
  }

  // ===== SALVAR/RECUPERAR RESPOSTA =====
  function saveAnswer(blockIdx, qIdx, answer) {
    const key = `jornada_answer_${blockIdx}_${qIdx}`;
    localStorage.setItem(key, answer);
  }

  function loadAnswer(blockIdx, qIdx) {
    const key = `jornada_answer_${blockIdx}_${qIdx}`;
    return localStorage.getItem(key) || '';
  }

  function getGlobalProgress() {
    let total = 0, completed = 0;
    JORNADA_BLOCKS.forEach((block, bIdx) => {
      total += block.questions.length;
      block.questions.forEach((_, qIdx) => {
        if (loadAnswer(bIdx, qIdx)) completed++;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  // ===== IA FEEDBACK =====
  async function gerarFeedbackIA(resposta, pergunta) {
    const prompt = `Você é um guia espiritual sábio e compassivo. 
    Pergunta: "${pergunta}"
    Resposta: "${resposta}"
    
    Dê um feedback curto (1-2 frases), encorajador e poético.`;

    try {
      if (win.JC?.api?.grok) {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${win.JC.api.grok}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
          })
        });
        const data = await res.json();
        return data.choices[0]?.message?.content?.trim() || 'Continue com luz.';
      }

      if (win.JC?.api?.openai) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${win.JC.api.openai}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
          })
        });
        const data = await res.json();
        return data.choices[0]?.message?.content?.trim() || 'Sua alma já sabe.';
      }

      return 'A luz dentro de você é a resposta.';
    } catch (e) {
      warn('Erro IA:', e);
      return 'Confie no seu caminho.';
    }
  }

  // ===== VÍDEO =====
  function loadVideo(src) {
    if (!src || win.__currentSectionId !== 'section-perguntas') return;
    const video = document.querySelector('#videoTransicao');
    const overlay = document.querySelector('#videoOverlay');
    if (!video || !overlay) return;

    video.src = src;
    video.style.zIndex = 2001;
    overlay.style.zIndex = 2000;
    video.load();
    video.play().catch(() => {});
  }

  // ===== RENDER =====
  async function renderQuestions() {
    setPergaminho('h');
    const { content } = ensureCanvas();
    if (!content || !JORNADA_BLOCKS.length) {
      warn('Canvas ou blocos não prontos');
      return;
    }

    content.innerHTML = '';
    const JC = win.JC || { currentBloco: 0, currentPergunta: 0 };
    const block = JORNADA_BLOCKS[JC.currentBloco];
    const q = block.questions[JC.currentPergunta];
    const perguntaTexto = i18n.t(q.data_i18n, q.label);

    // HEADER
    const header = document.createElement('div');
    header.className = 'perguntas-header';
    header.innerHTML = `
      <div>
        <div class="jp-block-label">Bloco ${JC.currentBloco + 1} de ${JORNADA_BLOCKS.length}</div>
        <div style="font-size:11px;color:#ffd38a;margin-top:2px">
          Pergunta ${JC.currentPergunta + 1}/${block.questions.length}
        </div>
      </div>
      <div class="jp-global-counter">${getGlobalProgress()}% concluído</div>
    `;
    content.appendChild(header);

    // PERGAMINHO
    const pergaminho = document.createElement('div');
    pergaminho.className = 'pergaminho-container';
    content.appendChild(pergaminho);

    pergaminho.innerHTML = `
      <div class="jp-question-display">
        <div class="jp-question-typed" id="question-display"></div>
      </div>

      <div class="jp-answer-container">
        <div class="jp-answer-frame">
          <div class="jp-answer-bg"></div>
          <textarea class="jp-answer-input" id="answer-input" 
                    placeholder="Digite com verdade e calma..." maxlength="1000"></textarea>
        </div>
      </div>

      <div class="jp-ai-feedback" id="ai-feedback">
        <div class="jp-ai-text" id="ai-text"></div>
      </div>

      <div class="perguntas-controls">
        <button class="btn-perguntas" id="btn-speak">Falar</button>
        <button class="btn-perguntas" id="btn-read">Ler</button>
        <button class="btn-perguntas btn-confirm" id="btn-next">
          ${JC.currentPergunta < block.questions.length - 1 ? 'Próxima' : 'Concluir'}
        </button>
      </div>
    `;

    // RESPOSTA SALVA
    const saved = loadAnswer(JC.currentBloco, JC.currentPergunta);
    const input = document.getElementById('answer-input');
    if (saved) input.value = saved;

    // DATILOGRAFIA
    await paperTypeText(document.getElementById('question-display'), perguntaTexto, 38);

    // LEITURA POR VOZ
    document.getElementById('btn-read').onclick = () => {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(perguntaTexto);
        utter.lang = i18n.lang || 'pt-BR';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      }
    };

    // PRÓXIMA
    document.getElementById('btn-next').onclick = async () => {
      const resposta = input.value.trim();
      if (!resposta && JC.currentPergunta < block.questions.length - 1) {
        win.toast?.('Escreva sua resposta antes de avançar.');
        return;
      }

      saveAnswer(JC.currentBloco, JC.currentPergunta, resposta);

      // FEEDBACK IA
      if (resposta && (win.JC?.api?.grok || win.JC?.api?.openai)) {
        const feedbackEl = document.getElementById('ai-feedback');
        const textEl = document.getElementById('ai-text');
        feedbackEl.classList.remove('active');
        textEl.textContent = 'A luz reflete...';
        feedbackEl.classList.add('active');
        const feedback = await gerarFeedbackIA(resposta, perguntaTexto);
        textEl.textContent = feedback;
      }

      // AVANÇA
      if (JC.currentPergunta < block.questions.length - 1) {
        JC.currentPergunta++;
      } else if (JC.currentBloco < JORNADA_BLOCKS.length - 1) {
        JC.currentBloco++;
        JC.currentPergunta = 0;
        const nextVideo = JORNADA_BLOCKS[JC.currentBloco - 1]?.video_after;
        if (nextVideo) loadVideo(nextVideo);
      } else {
        document.dispatchEvent(new CustomEvent('qa:completed'));
        return;
      }

      win.JC = JC;
      renderQuestions();
    };

    log('Pergunta renderizada com sucesso');
  }

  // ===== INIT =====
  async function loadDynamicBlocks() {
    try {
      await i18n.waitForReady(10000);
      const lang = i18n.lang || 'pt-BR';
      const base = blockTranslations[lang] || blockTranslations['pt-BR'];
      JORNADA_BLOCKS = base.map(b => ({
        id: b.id,
        title: b.title,
        data_i18n: b.data_i18n,
        questions: b.questions,
        video_after: b.video_after,
        tipo: 'perguntas'
      }));
      win.JORNADA_BLOCKS = JORNADA_BLOCKS;
      log('Blocos carregados:', JORNADA_BLOCKS.length);
      return true;
    } catch (e) {
      warn('Erro ao carregar blocos:', e);
      return false;
    }
  }

  async function initPaperQA() {
    await loadDynamicBlocks();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPaperQA();
  });

  // FORÇA DEV
  if (location.hostname === 'localhost' || location.hostname.includes('render')) {
    setTimeout(async () => {
      if (!win.JORNADA_BLOCKS?.length && win.JPaperQA?.loadDynamicBlocks) {
        log('Auto-iniciando blocos em dev...');
        await win.JPaperQA.loadDynamicBlocks();
      }
    }, 500);
  }

  // API GLOBAL
  win.JPaperQA = {
    loadDynamicBlocks,
    renderQuestions,
    loadVideo,
    setPergaminho,
    ensureCanvas,
    init: initPaperQA
  };

  log('jornada-paper-qa.js carregado com sucesso (usando window)');
})(window);
