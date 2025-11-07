/* section-perguntas.js — v2
   Controla os 5 blocos (10 perguntas cada) em uma única seção,
   usando JORNADA_BLOCKS do jornada-paper-qa.js
   Estrutura HTML: section-perguntas.html + styles-perguntas.css
*/
(function () {
  'use strict';

  const MOD = 'section-perguntas.js';
  const SECTION_ID = 'section-perguntas';
  const FINAL_SECTION_ID = 'section-final';

  const log  = (...a) => console.log('[PERGUNTAS]', ...a);
  const warn = (...a) => console.warn('[PERGUNTAS]', ...a);
  const err  = (...a) => console.error('[PERGUNTAS]', ...a);
  const $    = (sel, root = document) => root.querySelector(sel);

  const State = {
    mounted: false,
    loading: false,
    answers: {},
    meta: null,
    blocks: [],
    totalBlocks: 0,
    totalQuestions: 0,
    blocoIdx: 0,
    qIdx: 0,
    globalIdx: 0,
    startedAt: null
  };

  // --- Guard: só entra se o CARD foi confirmado
  window.JC = window.JC || {};
  if (!window.JC.flags || !window.JC.flags.cardConfirmed) {
    console.warn('[Guard] Entrou em Perguntas sem confirmar CARD -> redirecionando');
    if (window.JC.show) window.JC.show('section-card');
    else if (window.showSection) window.showSection('section-card');
    return;
  }

  // --------- Helpers de blocos/perguntas ---------

  async function ensureBlocks() {
    if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
      State.blocks = window.JORNADA_BLOCKS;
      return;
    }
    if (window.JPaperQA?.loadDynamicBlocks) {
      await window.JPaperQA.loadDynamicBlocks();
      State.blocks = window.JORNADA_BLOCKS || [];
    }
  }

  function computeTotals() {
    State.totalBlocks = State.blocks.length;
    State.totalQuestions = State.blocks.reduce((sum, b) => sum + (b.questions?.length || 0), 0);
    if (!State.totalQuestions) State.totalQuestions = 50; // fallback simbólico
  }

  function getCurrent() {
    const bloco = State.blocks[State.blocoIdx];
    if (!bloco) return { bloco: null, pergunta: null };
    const pergunta = bloco.questions[State.qIdx];
    return { bloco, pergunta };
  }

  // --------- Renderização ---------

  function updateCounters() {
    const { bloco } = getCurrent();

    // globais
    setText('#jp-block-num', State.blocoIdx + 1);
    setText('#jp-block-num-2', State.blocoIdx + 1);
    setText('#jp-block-max', State.totalBlocks || 5);

    setText('#jp-global-current', State.globalIdx + 1);
    setText('#jp-global-current-2', State.globalIdx + 1);
    setText('#jp-global-total', State.totalQuestions);
    setText('#jp-global-total-2', State.totalQuestions);

    const blocoTotal = bloco?.questions?.length || 10;
    setText('#jp-block-current', State.qIdx + 1);
    setText('#jp-block-total', blocoTotal);

    // barras
    const pctBloco = Math.max(0, Math.min(100, ((State.qIdx + 1) / blocoTotal) * 100));
    const pctGlobal = Math.max(0, Math.min(100, ((State.globalIdx + 1) / State.totalQuestions) * 100));

    width('#jp-block-progress-fill', pctBloco + '%');
    width('#jp-global-progress-fill', pctGlobal + '%');
  }

  function setText(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.textContent = String(val);
  }

  function width(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.style.width = val;
  }

  async function typeQuestion(text) {
    const box = $('#jp-question-typed');
    const raw = $('#jp-question-raw');

    if (!box) return;
    if (raw) raw.textContent = text || '';

    // se tiver engine global de datilografia, usa
    if (window.runTyping) {
      box.textContent = text;
      box.classList.add('lumen-typing');
      await window.runTyping(box);
      return;
    }

    // fallback: datilografia simples local
    box.textContent = '';
    let i = 0;
    const speed = 24;
    await new Promise(resolve => {
      const interval = setInterval(() => {
        box.textContent = text.slice(0, i);
        i++;
        if (i > text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  async function showCurrentQuestion() {
    const { bloco, pergunta } = getCurrent();
    const textarea = $('#jp-answer-input');
    const aiResp = $('#jp-ai-response');

    if (!bloco || !pergunta) {
      finishAll();
      return;
    }

    if (aiResp) {
      aiResp.hidden = true;
      aiResp.textContent = '';
    }
    if (textarea) {
      textarea.value = '';
      textarea.focus();
    }

    const texto = pergunta.label || '[pergunta]';
    await typeQuestion(texto);
    updateCounters();
  }

  // --------- Navegação / ações ---------

  function saveCurrentAnswer() {
    const { bloco, pergunta } = getCurrent();
    const textarea = $('#jp-answer-input');
    if (!bloco || !pergunta || !textarea) return;

    const key = `${bloco.id}:${pergunta.id}`;
    const value = (textarea.value || '').trim();
    State.answers[key] = value;
  }

  function nextStep() {
    const { bloco } = getCurrent();
    if (!bloco) {
      finishAll();
      return;
    }

    const blocoTotal = bloco.questions?.length || 10;
    const isLastInBloco = State.qIdx >= blocoTotal - 1;
    const isLastOfAll = State.globalIdx >= State.totalQuestions - 1;

    if (isLastOfAll) {
      finishAll();
      return;
    }

    if (isLastInBloco) {
      // fim de bloco -> vídeo se existir + próximo bloco
      const video = bloco.video_after;
      State.blocoIdx++;
      State.qIdx = 0;

      if (video && window.JPaperQA?.loadVideo) {
        window.JPaperQA.loadVideo(video);
      }
    } else {
      State.qIdx++;
    }

    State.globalIdx++;
    showCurrentQuestion();
  }

  function finishAll() {
    const finishedAt = new Date().toISOString();
    const guia = window.JC?.state?.guia || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;

    State.meta = {
      startedAt: State.startedAt,
      finishedAt,
      guia,
      selfieUsed: !!selfie,
      version: window.APP_CONFIG?.version || 'v1'
    };

    window.__QA_ANSWERS__ = State.answers;
    window.__QA_META__ = State.meta;

    log('Jornada de perguntas concluída.', {
      total: State.totalQuestions,
      answersKeys: Object.keys(State.answers).length
    });

    window.toast?.('Jornada de perguntas concluída!');

    if (window.JC?.show && document.getElementById(FINAL_SECTION_ID)) {
      window.JC.show(FINAL_SECTION_ID);
    } else if (window.showSection && document.getElementById(FINAL_SECTION_ID)) {
      window.showSection(FINAL_SECTION_ID);
    } else {
      document.dispatchEvent(new CustomEvent('qa:completed', {
        detail: { answers: State.answers, meta: State.meta }
      }));
    }
  }

  // --------- Eventos de UI ---------

  function bindUI(root) {
    const btnFalar = $('#jp-btn-falar', root);
    const btnApagar = $('#jp-btn-apagar', root);
    const btnConf = $('#jp-btn-confirmar', root);
    const input = $('#jp-answer-input', root);

    if (btnFalar) {
      btnFalar.addEventListener('click', () => {
        // Usa handler global existente no jornada-paper-qa (start-mic)
        document.dispatchEvent(new CustomEvent('qa:start-mic'));
        window.toast?.('Função de falar será ativada em breve.');
      });
    }

    if (btnApagar && input) {
      btnApagar.addEventListener('click', () => {
        input.value = '';
        input.focus();
      });
    }

    if (btnConf) {
      btnConf.addEventListener('click', () => {
        saveCurrentAnswer();
        nextStep();
      });
    }
  }

  // --------- Inicialização ---------

  async function init(root) {
    if (State.mounted || State.loading) return;
    State.loading = true;

    await ensureBlocks();
    computeTotals();

    if (!State.blocks.length) {
      err('Nenhum bloco de perguntas carregado (JORNADA_BLOCKS vazio).');
      State.loading = false;
      return;
    }

    State.startedAt = new Date().toISOString();
    State.blocoIdx = 0;
    State.qIdx = 0;
    State.globalIdx = 0;

    bindUI(root);
    await showCurrentQuestion();

    State.mounted = true;
    State.loading = false;
    log(MOD, 'montado com sucesso.');
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    if (node) init(node);
  });

  // fallback caso a seção já esteja ativa ao carregar o script
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && (sec.classList.contains('active') || window.__currentSectionId === SECTION_ID)) {
      init(sec);
    }
  });

  window.JPerguntas = {
    start(root) { init(root || document.getElementById(SECTION_ID)); },
    reset() {
      State.mounted = false;
      State.loading = false;
      State.answers = {};
      State.meta = null;
      State.blocoIdx = 0;
      State.qIdx = 0;
      State.globalIdx = 0;
      log('Reset concluído.');
    }
  };

  log(MOD, 'carregado.');
})();
