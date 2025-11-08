/* /assets/js/section-perguntas.js
 * Jornada de Perguntas + Vídeos + Export para API
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
 const FINAL_VIDEO_FALLBACK = '/assets/videos/filme-5-fim-da-jornada.mp4'; // filme perguntas -> final


  const log  = (...a) => console.log('[PERGUNTAS]', ...a);
  const warn = (...a) => console.warn('[PERGUNTAS]', ...a);
  const err  = (...a) => console.error('[PERGUNTAS]', ...a);
  const $    = (sel, root = document) => (root || document).querySelector(sel);

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
  // VÍDEO OVERLAY (entre blocos e final)
  // --------------------------------------------------

  function ensureVideoOverlay() {
    let overlay = $('#videoOverlay');
    let video = $('#videoTransicao');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'videoOverlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(0,0,0,0.9)';
      overlay.style.display = 'none';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '2000';
      document.body.appendChild(overlay);
    }

    if (!video) {
      video = document.createElement('video');
      video.id = 'videoTransicao';
      video.playsInline = true;
      video.preload = 'auto';
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100%';
      overlay.appendChild(video);
    }

    return { overlay, video };
  }

  function resolveVideoSrc(src) {
    if (!src) return null;
    let url = String(src).trim();
    if (url.startsWith('/assets/img/') && url.endsWith('.mp4')) {
      url = url.replace('/assets/img/', '/assets/videos/');
    }
    return url;
  }

  function playVideoWithCallback(src, onEnded) {
    src = resolveVideoSrc(src);
    const { overlay, video } = ensureVideoOverlay();

    if (!src) {
      if (onEnded) onEnded();
      return;
    }

    overlay.style.display = 'flex';
    video.src = src;
    video.load();

    const prev = video.onended;

    video.onended = () => {
      video.onended = null;
      if (typeof prev === 'function') {
        try { prev(); } catch (e) { console.error(e); }
      }
      overlay.style.display = 'none';
      if (!completed && typeof onEnded === 'function') {
        onEnded();
      }
    };

    video.play().catch(e => {
      console.error('[PERGUNTAS] Erro ao tocar vídeo:', e);
      overlay.style.display = 'none';
      video.onended = null;
      if (onEnded) onEnded();
    });
  }

  function playBlockTransition(videoSrc, onDone) {
    const src = resolveVideoSrc(videoSrc);
    if (!src) {
      if (onDone) onDone();
      return;
    }
    log('Transição entre blocos:', src);
    playVideoWithCallback(src, onDone);
  }

  // --------------------------------------------------
  // BLOCS / PERGUNTAS
  // --------------------------------------------------

  async function ensureBlocks() {
    // Se já veio carregado
    if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
      State.blocks = window.JORNADA_BLOCKS;
      return;
    }

    // Usa JPaperQA para carregar
    if (window.JPaperQA && typeof window.JPaperQA.loadDynamicBlocks === 'function') {
      try {
        await window.JPaperQA.loadDynamicBlocks();
        if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
          State.blocks = window.JORNADA_BLOCKS;
          return;
        }
      } catch (e) {
        err('Erro ao carregar blocos via JPaperQA.loadDynamicBlocks:', e);
      }
    }

    State.blocks = window.JORNADA_BLOCKS || [];
  }

  function computeTotals() {
    State.totalBlocks = State.blocks.length;
    State.totalQuestions = State.blocks.reduce(
      (sum, b) => sum + (b.questions?.length || 0),
      0
    );
  }

  function getCurrent() {
    const bloco = State.blocks[State.blocoIdx];
    const pergunta = bloco?.questions?.[State.qIdx] || null;
    return { bloco, pergunta };
  }

  // --------------------------------------------------
  // UI / DATILOGRAFIA
  // --------------------------------------------------

  function setText(sel, val) {
    const el = $(sel);
    if (el) el.textContent = String(val);
  }

  function setWidth(sel, val) {
    const el = $(sel);
    if (el) el.style.width = val;
  }

  function updateCounters() {
    const { bloco } = getCurrent();
    const blocoTotal = bloco?.questions?.length || 1;

    setText('#jp-block-num', State.blocoIdx + 1);
    setText('#jp-block-num-2', State.blocoIdx + 1);
    setText('#jp-block-max', State.totalBlocks || 1);

    setText('#jp-global-current', State.globalIdx + 1);
    setText('#jp-global-current-2', State.globalIdx + 1);
    setText('#jp-global-total', State.totalQuestions || 1);
    setText('#jp-global-total-2', State.totalQuestions || 1);

    setText('#jp-block-current', State.qIdx + 1);
    setText('#jp-block-total', blocoTotal);

    const pctBloco = Math.max(0, Math.min(100, ((State.qIdx + 1) / blocoTotal) * 100));
    const pctGlobal = Math.max(0, Math.min(100, ((State.globalIdx + 1) / (State.totalQuestions || 1)) * 100));

    setWidth('#jp-block-progress-fill', pctBloco + '%');
    setWidth('#jp-global-progress-fill', pctGlobal + '%');
  }

  async function typeQuestion(text) {
    if (completed) return;

    const box = $('#jp-question-typed');
    const raw = $('#jp-question-raw');
    if (!box) return;

    const pergunta = text || '[pergunta]';

    if (raw) raw.textContent = pergunta;

    // limpa e garante estado neutro
    box.textContent = '';
    box.removeAttribute('data-typing');
    box.classList.remove('typing-done');

    // datilografia VISUAL manual (independente do TypingBridge)
    let i = 0;
    const speed = 24;

    await new Promise(resolve => {
      const it = setInterval(() => {
        if (completed) {
          clearInterval(it);
          return resolve();
        }
        box.textContent = pergunta.slice(0, i);
        i++;
        if (i > pergunta.length) {
          clearInterval(it);
          box.classList.add('typing-done');
          resolve();
        }
      }, speed);
    });

    // se o TypingBridge usar isso só para leitura/TTS, deixamos o gancho
    box.setAttribute('data-typing', 'true');
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

    await typeQuestion(pergunta.label || '[pergunta]');
    updateCounters();

    if (window.JORNADA_CHAMA?.ensureHeroFlame) {
      window.JORNADA_CHAMA.ensureHeroFlame(SECTION_ID);
    }
  }

  // --------------------------------------------------
  // RESPOSTAS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // NAVEGAÇÃO DAS PERGUNTAS
  // --------------------------------------------------

  function nextStep() {
    if (completed) {
      log('Clique em confirmar após conclusão; ignorado.');
      return;
    }

    const { bloco } = getCurrent();
    if (!bloco) {
      finishAll();
      return;
    }

    const blocoTotal = bloco.questions?.length || 1;
    const isLastInBloco = State.qIdx >= blocoTotal - 1;
    const isLastOfAll = State.globalIdx >= State.totalQuestions - 1;

    // última pergunta global
    if (isLastOfAll) {
      finishAll();
      return;
    }

    State.globalIdx++;

    // fim de bloco (mas ainda não é o fim de todos)
    if (isLastInBloco) {
      const nextBlocoIdx = State.blocoIdx + 1;
      const video = bloco.video_after || bloco.transitionVideo || null;

      State.blocoIdx = nextBlocoIdx;
      State.qIdx = 0;

      playBlockTransition(video, () => {
        if (!completed) showCurrentQuestion();
      });
    } else {
      // dentro do mesmo bloco
      State.qIdx++;
      showCurrentQuestion();
    }
  }

  // --------------------------------------------------
  // SECTION FINAL / EXPORT
  // --------------------------------------------------

  function ensureFinalSectionExists() {
    let finalEl =
      document.getElementById(FINAL_SECTION_ID) ||
      document.querySelector('[data-section="final"]') ||
      document.querySelector('.section-final');

    if (!finalEl) {
      const container =
        document.getElementById('jornada-sections') ||
        document.querySelector('.jornada-sections') ||
        document.body;

      finalEl = document.createElement('section');
      finalEl.id = FINAL_SECTION_ID;
      finalEl.className = 'section section-final pergaminho';
      finalEl.dataset.section = 'final';
      finalEl.innerHTML = `
        <div class="final-wrapper">
          <h2 class="final-title">Gratidão por caminhar com Luz 🙏</h2>
          <p class="final-text">
            Suas respostas foram recebidas com honra. A Irmandade está preparando sua devolutiva especial.
          </p>
        </div>
      `;
      container.appendChild(finalEl);
      log('section-final criada automaticamente (fallback).');
    }

    return finalEl;
  }

  function finishAll() {
    if (completed) return;
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

    window.__QA_ANSWERS__ = State.answers;
    window.__QA_META__ = State.meta;

    log('Jornada de perguntas concluída.', {
      total: State.totalQuestions,
      respondidas: Object.keys(State.answers).length
    });

    if (window.JORNADA_CHAMA) {
      window.JORNADA_CHAMA.setChamaIntensidade('chama-perguntas', 'forte');
    }

    const finalEl = ensureFinalSectionExists();

    // tenta vídeo final: usa video_after do último bloco ou JORNADA_FINAL_VIDEO
    const lastBlock = State.blocks[State.blocks.length - 1];
    const finalVideoSrc = resolveVideoSrc(
      window.JORNADA_FINAL_VIDEO ||
      (lastBlock && lastBlock.video_after) ||
      null
    );

    if (finalVideoSrc) {
      log('Iniciando vídeo final:', finalVideoSrc);
      playVideoWithCallback(finalVideoSrc, () => {
        if (window.JC?.show && finalEl) {
          window.JC.show(FINAL_SECTION_ID);
        } else if (typeof window.showSection === 'function') {
          window.showSection(FINAL_SECTION_ID);
        } else {
          window.location.hash = '#' + FINAL_SECTION_ID;
        }
      });
    } else {
      if (window.JC?.show && finalEl) {
        window.JC.show(FINAL_SECTION_ID);
      } else if (typeof window.showSection === 'function') {
        window.showSection(FINAL_SECTION_ID);
      } else {
        window.location.hash = '#' + FINAL_SECTION_ID;
      }
    }

    // notifica quem quiser ouvir (section-final.js / outros)
    try {
      document.dispatchEvent(new CustomEvent('qa:completed', {
        detail: { answers: State.answers, meta: State.meta }
      }));
    } catch (e) {
      warn('Falha ao disparar qa:completed:', e);
    }
  }

  // --------------------------------------------------
  // BIND UI
  // --------------------------------------------------

  function bindUI(root) {
    const btnFalar  = $('#jp-btn-falar', root);
    const btnApagar = $('#jp-btn-apagar', root);
    const btnConf   = $('#jp-btn-confirmar', root);
    const input     = $('#jp-answer-input', root);

    if (input && window.JORNADA_MICRO) {
      window.JORNADA_MICRO.attach(input, { mode: 'append' });
    }

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

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  async function init(root) {
    if (State.mounted || State.loading || completed) return;
    State.loading = true;

    await ensureBlocks();
    computeTotals();

    if (!State.blocks.length || !State.totalQuestions) {
      err('Nenhum bloco/pergunta carregado. Verifique jornada-paper-qa.js.');
      State.loading = false;
      return;
    }

    ensureVideoOverlay();

    State.startedAt = new Date().toISOString();
    State.blocoIdx = 0;
    State.qIdx = 0;
    State.globalIdx = 0;

    bindUI(root);
    await showCurrentQuestion();

    State.mounted = true;
    State.loading = false;
    log(MOD, MOD + ' montado com sucesso.');
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    if (node) init(node);
  });

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
      completed = false;
      log('Reset concluído.');
    }
  };

  log(MOD, 'carregado');
})();
