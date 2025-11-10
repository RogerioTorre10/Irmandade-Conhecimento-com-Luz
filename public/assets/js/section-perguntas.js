/* /assets/js/section-perguntas.js
 * Jornada de Perguntas + Vídeos + Progresso + Export para API
 */

(function () {
  'use strict';

  if (window.__PERGUNTAS_BOUND__) {
    console.log('[PERGUNTAS] Já inicializado, ignorando.');
    return;
  }
  window.__PERGUNTAS_BOUND__ = true;

  const MOD = 'section-perguntas.js';
  const SECTION_ID = 'section-perguntas';
  const FINAL_SECTION_ID = 'section-final';
  const FINAL_VIDEO_FALLBACK = '/assets/videos/filme-5-fim-da-jornada.mp4';

  const log = (...a) => console.log('[PERGUNTAS]', ...a);
  const warn = (...a) => console.warn('[PERGUNTAS]', ...a);
  const err = (...a) => console.error('[PERGUNTAS]', ...a);
  const $ = (sel, root = document) => (root || document).querySelector(sel);

  const State = {
    mounted: false,
    loading: false,
    blocks: [],
    totalBlocks: 0,
    totalQuestions: 0,
    blocoIdx: 0,
    qIdx: 0,
    globalIdx: 0,
    startedAt: null,
    answers: {},
    meta: null
  };

  let completed = false;

  // --------------------------------------------------
  // BARRAS DE PROGRESSO
  // --------------------------------------------------

  function updateProgress() {
    const blocoAtual = State.blocoIdx + 1;
    const blocoTotal = State.totalBlocks || 1;
    const perguntaAtual = State.qIdx + 1;
    const perguntasBloco = State.blocks[State.blocoIdx]?.questions?.length || 1;
    const totalGeral = State.totalQuestions || 1;
    const globalAtual = State.globalIdx + 1;

    // BLOCO (dourada)
    const pctBloco = Math.min(100, (blocoAtual / blocoTotal) * 100);
    $('#progress-block-fill').style.width = pctBloco + '%';
    $('#progress-block-value').textContent = `${blocoAtual} de ${blocoTotal}`;

    // PERGUNTA (prateada)
    const pctPerg = Math.min(100, (perguntaAtual / perguntasBloco) * 100);
    $('#progress-question-fill').style.width = pctPerg + '%';
    $('#progress-question-value').textContent = `${perguntaAtual} / ${perguntasBloco}`;

    // TOTAL (ampulheta)
    $('#progress-total-value').textContent = `${globalAtual} / ${totalGeral}`;
  }

  // --------------------------------------------------
  // FUNÇÕES AUXILIARES
  // --------------------------------------------------

  function getCurrent() {
    const bloco = State.blocks[State.blocoIdx];
    const pergunta = bloco?.questions?.[State.qIdx] || null;
    return { bloco, pergunta };
  }

  async function typeQuestion(text) {
    if (completed) return;
    const box = $('#jp-question-typed');
    const raw = $('#jp-question-raw');
    if (!box) return;

    const pergunta = text || '[pergunta]';
    if (raw) raw.textContent = pergunta;

    box.textContent = '';
    let i = 0, speed = 25;
    await new Promise(resolve => {
      const it = setInterval(() => {
        if (i > pergunta.length) {
          clearInterval(it);
          return resolve();
        }
        box.textContent = pergunta.slice(0, i++);
      }, speed);
    });

    // Leitura automática
    if ('speechSynthesis' in window && pergunta.trim()) {
      const u = new SpeechSynthesisUtterance(pergunta);
      u.lang = 'pt-BR';
      u.rate = 0.9;
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(u), 300);
    }
  }

  async function showCurrentQuestion() {
    if (completed) return;
    const { bloco, pergunta } = getCurrent();
    if (!bloco || !pergunta) return;

    const textarea = $('#jp-answer-input');
    if (textarea) {
      textarea.value = '';
      textarea.focus();
    }

    await typeQuestion(pergunta.label || '[pergunta]');
    updateProgress();
  }

  function saveCurrentAnswer() {
    if (completed) return;
    const { bloco, pergunta } = getCurrent();
    const textarea = $('#jp-answer-input');
    if (!bloco || !pergunta || !textarea) return;

    const key = `${bloco.id || ('b' + State.blocoIdx)}:${pergunta.id || ('q' + State.qIdx)}`;
    const value = (textarea.value || '').trim();
    State.answers[key] = value;
  }

  function nextStep() {
    if (completed) return;

    const { bloco } = getCurrent();
    const blocoTotal = bloco.questions?.length || 1;
    const isLastInBloco = State.qIdx >= blocoTotal - 1;
    const isLastOfAll = State.globalIdx >= State.totalQuestions - 1;

    if (isLastOfAll) {
      finishAll();
      return;
    }

    State.globalIdx++;

    if (isLastInBloco) {
      State.blocoIdx++;
      State.qIdx = 0;
    } else {
      State.qIdx++;
    }

    showCurrentQuestion();
  }

  function finishAll() {
    completed = true;
    console.log('[PERGUNTAS] Jornada concluída.');
    if (window.JC) window.JC.show('section-final');
  }

  // --------------------------------------------------
  // BIND UI
  // --------------------------------------------------

  function bindUI(root) {
    const btnFalar = $('#jp-btn-falar', root);
    const btnApagar = $('#jp-btn-apagar', root);
    const btnConf = $('#jp-btn-confirmar', root);
    const input = $('#jp-answer-input', root);

    if (btnApagar && input) {
      btnApagar.onclick = () => (input.value = '');
    }

    if (btnConf) {
      btnConf.onclick = () => {
        saveCurrentAnswer();
        nextStep();
      };
    }
  }

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  async function init(root) {
    if (State.mounted) return;
    root = root || document.getElementById(SECTION_ID);

    if (window.JPaperQA?.loadDynamicBlocks) {
      await window.JPaperQA.loadDynamicBlocks();
      State.blocks = window.JORNADA_BLOCKS || [];
    }

    State.totalBlocks = State.blocks.length;
    State.totalQuestions = State.blocks.reduce(
      (sum, b) => sum + (b.questions?.length || 0),
      0
    );

    bindUI(root);
    await showCurrentQuestion();
    State.mounted = true;

    log(MOD, 'montado com sucesso.');
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === SECTION_ID) init(e.detail.node);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec) init(sec);
  });

  window.JPerguntas = { updateProgress };

})();
