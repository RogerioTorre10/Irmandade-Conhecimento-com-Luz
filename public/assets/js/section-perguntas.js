(function () {
  'use strict';

  // Evita que o script seja ligado duas vezes (bundle duplicado, etc.)
  if (window.__PERGUNTAS_BOUND__) {
    console.log('[PERGUNTAS] Script já carregado, ignorando duplicata.');
    return;
  }
  window.__PERGUNTAS_BOUND__ = true;

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

  // flag para impedir finishAll múltiplo
  let completed = false;

  // ---------- DATA (JORNADA_BLOCKS) ----------
  async function ensureBlocks() {
    // Se já existe JORNADA_BLOCKS preenchido, usa
    if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
      State.blocks = window.JORNADA_BLOCKS;
      return;
    }

    // Se existir JPaperQA.loadDynamicBlocks, deixa ele popular os blocos
    if (window.JPaperQA?.loadDynamicBlocks) {
      try {
        const res = await window.JPaperQA.loadDynamicBlocks();
        // Compatível tanto se ele setar window.JORNADA_BLOCKS
        // quanto se retornar algo
        if (Array.isArray(res?.blocks)) {
          State.blocks = res.blocks;
        } else {
          State.blocks = window.JORNADA_BLOCKS || [];
        }
      } catch (e) {
        err('Erro em JPaperQA.loadDynamicBlocks:', e);
        State.blocks = window.JORNADA_BLOCKS || [];
      }
      return;
    }
  }

  function computeTotals() {
    State.totalBlocks = State.blocks.length || 5;
    State.totalQuestions =
      State.blocks.reduce(
        (sum, b) => sum + (b.questions?.length || 0),
        0
      ) || 50;
  }

  function getCurrent() {
    const bloco = State.blocks[State.blocoIdx];
    const pergunta = bloco?.questions?.[State.qIdx] || null;
    return { bloco, pergunta };
  }

  // ---------- UI HELPERS ----------
  function setText(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.textContent = String(val);
  }

  function setWidth(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.style.width = val;
  }

  function updateCounters() {
    const { bloco } = getCurrent();
    const blocoTotal = bloco?.questions?.length || 10;

    setText('#jp-block-num', State.blocoIdx + 1);
    setText('#jp-block-num-2', State.blocoIdx + 1);
    setText('#jp-block-max', State.totalBlocks);

    setText('#jp-global-current', State.globalIdx + 1);
    setText('#jp-global-current-2', State.globalIdx + 1);
    setText('#jp-global-total', State.totalQuestions);
    setText('#jp-global-total-2', State.totalQuestions);

    setText('#jp-block-current', State.qIdx + 1);
    setText('#jp-block-total', blocoTotal);

    const pctBloco = Math.max(0, Math.min(100, ((State.qIdx + 1) / blocoTotal) * 100));
    const pctGlobal = Math.max(0, Math.min(100, ((State.globalIdx + 1) / State.totalQuestions) * 100));

    setWidth('#jp-block-progress-fill', pctBloco + '%');
    setWidth('#jp-global-progress-fill', pctGlobal + '%');
  }

  async function typeQuestion(text) {
    if (completed) return; // segurança extra

    const box = $('#jp-question-typed');
    const raw = $('#jp-question-raw');
    if (!box) return;

    if (raw) raw.textContent = text || '';

    if (window.runTyping) {
      box.textContent = text;
      try {
        await window.runTyping(box);
      } catch (e) {
        warn('runTyping falhou, fallback simples.', e);
      }
      return;
    }

    // fallback datilografia simples
    box.textContent = '';
    let i = 0;
    const speed = 24;
    await new Promise(resolve => {
      const it = setInterval(() => {
        if (completed) { // se finalizou no meio, aborta
          clearInterval(it);
          return resolve();
        }
        box.textContent = text.slice(0, i);
        i++;
        if (i > text.length) {
          clearInterval(it);
          resolve();
        }
      }, speed);
    });
  }

  async function showCurrentQuestion() {
    if (completed) return;

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

    if (window.JORNADA_CHAMA?.ensureHeroFlame) {
      window.JORNADA_CHAMA.ensureHeroFlame(SECTION_ID);
    }
  }

  // ---------- RESPOSTA + CHAMA ----------
  function saveCurrentAnswer() {
    if (completed) return;

    const { bloco, pergunta } = getCurrent();
    const textarea = $('#jp-answer-input');
    if (!bloco || !pergunta || !textarea) return;

    const key = `${bloco.id || ('b' + State.blocoIdx)}:${pergunta.id || ('q' + State.qIdx)}`;
    const value = (textarea.value || '').trim();
    State.answers[key] = value;

    if (window.JORNADA_CHAMA && value) {
      window.JORNADA_CHAMA.updateChamaFromText(value, 'chama-perguntas');
    }
  }

  function nextStep() {
    if (completed) {
      log('nextStep chamado após conclusão; ignorando.');
      return;
    }

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
      const video = bloco.video_after;
      State.blocoIdx++;
      State.qIdx = 0;
      if (video && window.JPaperQA?.loadVideo) {
        try {
          window.JPaperQA.loadVideo(video);
        } catch (e) {
          warn('Erro loadVideo', e);
        }
      }
    } else {
      State.qIdx++;
    }

    State.globalIdx++;
    showCurrentQuestion();
  }

  function finishAll() {
    if (completed) {
      return;
    }
    completed = true;

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

    // Exporta para o backend / geração de PDF/HQ
    window.__QA_ANSWERS__ = State.answers;
    window.__QA_META__ = State.meta;

    log('Jornada de perguntas concluída.', {
      total: State.totalQuestions,
      respondidas: Object.keys(State.answers).length
    });

    if (window.JORNADA_CHAMA) {
      window.JORNADA_CHAMA.setChamaIntensidade('chama-perguntas', 'forte');
    }

    // Navegação para a seção final — prioriza transição oficial
    const finalEl = document.getElementById(FINAL_SECTION_ID);

    try {
      if (typeof window.playTransitionThenGo === 'function' && finalEl) {
        log('Usando playTransitionThenGo para:', FINAL_SECTION_ID);
        window.playTransitionThenGo(FINAL_SECTION_ID);
      } else if (window.JC?.show && finalEl) {
        log('Usando JC.show para:', FINAL_SECTION_ID);
        window.JC.show(FINAL_SECTION_ID);
      } else if (typeof window.showSection === 'function' && finalEl) {
        log('Usando showSection para:', FINAL_SECTION_ID);
        window.showSection(FINAL_SECTION_ID);
      } else if (finalEl) {
        log('Fallback via hash para:', FINAL_SECTION_ID);
        window.location.hash = '#' + FINAL_SECTION_ID;
      } else {
        warn('section-final não encontrada; mantendo na tela atual.');
      }
    } catch (e) {
      err('Erro ao navegar para página final:', e);
    }

    // Evento único para qualquer listener (backend, HQ, etc.)
    try {
      document.dispatchEvent(new CustomEvent('qa:completed', {
        detail: { answers: State.answers, meta: State.meta }
      }));
    } catch (e) {
      warn('Falha ao disparar qa:completed:', e);
    }
  }

  // ---------- BIND CONTROLES ----------
  function bindUI(root) {
    const btnFalar  = $('#jp-btn-falar', root);
    const btnApagar = $('#jp-btn-apagar', root);
    const btnConf   = $('#jp-btn-confirmar', root);
    const input     = $('#jp-answer-input', root);

    // MIC
    if (input && window.JORNADA_MICRO) {
      window.JORNADA_MICRO.attach(input, { mode: 'append' });
    }

    // Chama em tempo real
    if (input && window.JORNADA_CHAMA) {
      input.addEventListener('input', () => {
        const txt = input.value || '';
        window.JORNADA_CHAMA.updateChamaFromText(txt, 'chama-perguntas');
      });
    }

    if (btnFalar && input) {
      btnFalar.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (window.JORNADA_MICRO) {
          window.JORNADA_MICRO.attach(input, { mode: 'append' });
        } else {
          (window.toast || alert)('Reconhecimento de voz não disponível.');
        }
      });
    }

    if (btnApagar && input) {
      btnApagar.addEventListener('click', (ev) => {
        ev.preventDefault();
        input.value = '';
        input.focus();
        if (window.JORNADA_CHAMA) {
          window.JORNADA_CHAMA.setChamaIntensidade('chama-perguntas', 'media');
        }
      });
    }

    if (btnConf) {
      btnConf.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (completed) {
          log('Clique em confirmar após conclusão; ignorado.');
          return;
        }
        saveCurrentAnswer();
        nextStep();
      });
    }
  }

  // ---------- INIT ----------
  async function init(root) {
    if (State.mounted || State.loading || completed) return;
    State.loading = true;

    await ensureBlocks();
    computeTotals();

    if (!State.blocks.length) {
      err('JORNADA_BLOCKS vazio; confira jornada-paper-qa.js.');
      State.loading = false;
      return;
    }

    const hasGuia =
      (window.JC && window.JC.state && window.JC.state.guia) ||
      window.sessionStorage?.getItem('jornada.guia');
    if (!hasGuia) {
      warn('Nenhum guia/card detectado — seguindo mesmo assim (modo teste).');
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

  // disparado pelo controlador quando a seção é carregada
  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    if (node) init(node);
  });

  // fallback se já estiver ativa no DOM
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && (sec.classList.contains('active') || window.__currentSectionId === SECTION_ID)) {
      init(sec);
    }
  });

  // Exposto para debug manual
  window.JPerguntas = {
    start(root) {
      init(root || document.getElementById(SECTION_ID));
    },
    reset() {
      State.mounted = false;
      State.loading = false;
      State.answers = {};
      State.meta = null;
      State.blocoIdx = 0;
      State.qIdx = 0;
      State.globalIdx = 0;
      completed = false;
      log('Reset concluído.');
    }
  };

  log(MOD, 'carregado (base + proteção concluído).');
})();
