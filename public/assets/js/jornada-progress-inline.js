/* /assets/js/jornada-progress-inline.js
 * JPROG-INLINE v4.0
 * Progresso inline blindado para Jornada
 */
(function (window, document) {
  'use strict';

  if (window.__JPROG_INLINE_V4__) {
    console.log('[JPROG-INLINE] já inicializado, ignorando.');
    return;
  }
  window.__JPROG_INLINE_V4__ = true;

  const MOD = '[JPROG-INLINE]';

  const SELECTORS = {
    blockFill: [
      '#progress-block-fill',
      '#jp-progress-top-fill',
      '.progress-block-fill'
    ],
    blockValue: [
      '#progress-block-value',
      '#jp-progress-top-value',
      '.progress-block-value'
    ],
    questionFill: [
      '#progress-question-fill',
      '#jp-progress-fill',
      '.progress-question-fill'
    ],
    questionValue: [
      '#progress-question-value',
      '#jp-progress-value',
      '.progress-question-value'
    ],
    totalFill: [
      '#progress-total-fill',
      '#jp-total-fill',
      '.progress-total-fill'
    ],
    totalValue: [
      '#progress-total-value',
      '#jp-total-value',
      '.progress-total-value'
    ]
  };

  function $(selectors, root = document) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function toPercent(current, total) {
    if (!total || total <= 0) return 0;
    return clamp((current / total) * 100, 0, 100);
  }

  function safeText(el, value) {
    if (el) el.textContent = value;
  }

  function safeWidth(el, percent) {
    if (el) el.style.width = `${percent}%`;
  }

  function getBlocks() {
    const blocks = window.JORNADA_BLOCKS;
    if (Array.isArray(blocks) && blocks.length) return blocks;

    const fallback = window.blockTranslations?.[document.documentElement.lang || 'pt-BR'];
    if (Array.isArray(fallback) && fallback.length) return fallback;

    return [];
  }

  function getQuestionCount(block) {
    if (!block) return 0;
    if (Array.isArray(block.questions) && block.questions.length) return block.questions.length;
    return 0;
  }

  function computeTotals(blocks) {
    const totalBlocks = blocks.length || 0;
    const perBlock = blocks.map(getQuestionCount);
    const totalQuestions = perBlock.reduce((acc, n) => acc + n, 0);

    return {
      totalBlocks,
      perBlock,
      totalQuestions
    };
  }

  function getState() {
    const State = window.__JP_STATE__ || window.PERGUNTAS_STATE || window.State || null;
    const JC = window.JC || {};

    let blocoIdx = 0;
    let qIdx = 0;

    if (State && Number.isInteger(State.blocoIdx)) blocoIdx = State.blocoIdx;
    else if (Number.isInteger(JC.currentBloco)) blocoIdx = JC.currentBloco;

    if (State && Number.isInteger(State.qIdx)) qIdx = State.qIdx;
    else if (Number.isInteger(JC.currentPergunta)) qIdx = JC.currentPergunta;

    return {
      blocoIdx: Math.max(0, blocoIdx),
      qIdx: Math.max(0, qIdx)
    };
  }

  function buildProgressModel() {
    const blocks = getBlocks();
    const { totalBlocks, perBlock, totalQuestions } = computeTotals(blocks);
    const { blocoIdx, qIdx } = getState();

    // Fallback ultra seguro
    if (!totalBlocks) {
      return {
        blockCurrent: 1,
        blockTotal: 1,
        blockPercent: 100,

        questionCurrent: 1,
        questionTotal: 1,
        questionPercent: 100,

        globalCurrent: 1,
        globalTotal: 1,
        globalPercent: 100
      };
    }

    const safeBlockIdx = clamp(blocoIdx, 0, totalBlocks - 1);
    const currentBlockQuestionTotal = Math.max(1, perBlock[safeBlockIdx] || 1);
    const safeQIdx = clamp(qIdx, 0, currentBlockQuestionTotal - 1);

    const blockCurrent = safeBlockIdx + 1;
    const blockTotal = totalBlocks;
    const blockPercent = toPercent(blockCurrent, blockTotal);

    const questionCurrent = safeQIdx + 1;
    const questionTotal = currentBlockQuestionTotal;
    const questionPercent = toPercent(questionCurrent, questionTotal);

    let globalCurrent = 0;
    for (let i = 0; i < safeBlockIdx; i++) {
      globalCurrent += Math.max(1, perBlock[i] || 1);
    }
    globalCurrent += questionCurrent;

    const globalTotal = Math.max(1, totalQuestions || totalBlocks);
    const globalPercent = toPercent(globalCurrent, globalTotal);

    return {
      blockCurrent,
      blockTotal,
      blockPercent,

      questionCurrent,
      questionTotal,
      questionPercent,

      globalCurrent,
      globalTotal,
      globalPercent
    };
  }

  function applyProgress(root = document) {
    const model = buildProgressModel();

    const blockFill = $(SELECTORS.blockFill, root);
    const blockValue = $(SELECTORS.blockValue, root);

    const questionFill = $(SELECTORS.questionFill, root);
    const questionValue = $(SELECTORS.questionValue, root);

    const totalFill = $(SELECTORS.totalFill, root);
    const totalValue = $(SELECTORS.totalValue, root);

    safeWidth(blockFill, model.blockPercent);
    safeText(blockValue, `${model.blockCurrent} de ${model.blockTotal}`);

    safeWidth(questionFill, model.questionPercent);
    safeText(questionValue, `${model.questionCurrent} / ${model.questionTotal}`);

    safeWidth(totalFill, model.globalPercent);
    safeText(totalValue, `${model.globalCurrent} / ${model.globalTotal}`);

    console.log(
      `${MOD} v4.0 aplicado`,
      {
        bloco: `${model.blockCurrent}/${model.blockTotal}`,
        pergunta: `${model.questionCurrent}/${model.questionTotal}`,
        total: `${model.globalCurrent}/${model.globalTotal}`
      }
    );
  }

  function applyGuideAura() {
    const guia =
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('JORNADA_GUIA_ATUAL') ||
      'lumen';

    document.documentElement.setAttribute('data-guia', guia);
  }

  function refresh(root = document) {
    try {
      applyGuideAura();
      applyProgress(root);
    } catch (err) {
      console.error(`${MOD} erro ao atualizar progresso:`, err);
    }
  }

  function installHooks() {
    const rerenderEvents = [
      'DOMContentLoaded',
      'sectionLoaded',
      'jornada:progress',
      'jornada:question-changed',
      'jornada:block-changed',
      'jornada:rendered',
      'qa:completed'
    ];

    rerenderEvents.forEach((evt) => {
      document.addEventListener(evt, () => refresh(document), { passive: true });
    });

    const originalShowCurrentQuestion = window.showCurrentQuestion;
    if (typeof originalShowCurrentQuestion === 'function' && !window.__JPROG_WRAP_SHOW__) {
      window.__JPROG_WRAP_SHOW__ = true;
      window.showCurrentQuestion = async function (...args) {
        const result = await originalShowCurrentQuestion.apply(this, args);
        refresh(document);
        return result;
      };
    }
  }

  function boot() {
    installHooks();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => refresh(document), { once: true });
    } else {
      refresh(document);
    }

    setTimeout(() => refresh(document), 120);
    setTimeout(() => refresh(document), 350);
    setTimeout(() => refresh(document), 800);
  }

  window.JORNADA_PROGRESS_INLINE = {
    refresh,
    applyProgress,
    buildProgressModel
  };

  boot();
})(window, document);
