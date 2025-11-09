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

  const blockTranslations = { /* ... mesmo conteúdo que você já tem ... */ };

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
    const base = blockTranslations[lang] || blockTranslations['pt-BR'];
    JORNADA_BLOCKS = base.map(b => ({
      id: b.id, title: b.title, data_i18n: b.data_i18n,
      questions: b.questions, video_after: b.video_after, tipo: 'perguntas'
    }));
    win.JORNADA_BLOCKS = JORNADA_BLOCKS;
    log('Blocos carregados:', JORNADA_BLOCKS.length);
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
