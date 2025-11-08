/* /assets/js/section-perguntas.js
 * Jornada de Perguntas + Transições + Devolutiva API
 * - Usa JPaperQA.loadDynamicBlocks (dados dos blocos)
 * - Entre blocos: executa vídeo de transição
 * - No final: executa vídeo final e navega para section-final
 * - Exporta __QA_ANSWERS__ e __QA_META__ para o backend/HQ
 */

(function () {
  'use strict';

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

  let completed = false;

  // ---------- Helpers de vídeo ----------

  function resolveVideoSrc(src) {
    if (!src) return null;
    let url = String(src).trim();
    // Corrige base errada /assets/img/ → /assets/videos/ para .mp4
    if (url.startsWith('/assets/img/') && url.endsWith('.mp4')) {
      url = url.replace('/assets/img/', '/assets/videos/');
    }
    return url;
  }

    // Usa a mesma função global do video-transicao.js
  function getTransitionFn() {
    if (typeof window.playTransitionThenGo === 'function') return window.playTransitionThenGo;
    if (typeof window.playVideoTransition === 'function') return window.playVideoTransition;
    return null;
  }

  function callPlayTransition(videoSrc, nextSectionId, onDone) {
    const fn = getTransitionFn();
    if (!fn) return false;

    const src = resolveVideoSrc(videoSrc);

    try {
      // video-transicao.js (pelo log) recebe: src + nextSectionId
      fn(src, nextSectionId);

      if (typeof onDone === 'function') {
        // margem de segurança até o fim do filme
        setTimeout(() => {
          if (!completed) onDone();
        }, 6500);
      }

      return true;
    } catch (e) {
      err('Erro em playTransitionThenGo/playVideoTransition:', e);
      return false;
    }
  }


    function playBlockTransition(videoSrc, onDone) {
    const src = resolveVideoSrc(videoSrc);

    // PRIORIDADE 1: usa o sistema global de transição com retorno para section-perguntas
    if (callPlayTransition(src, SECTION_ID, onDone)) {
      log('Transição entre blocos via vídeo de transição:', src || '(padrão)');
      return true;
    }

    // PRIORIDADE 2 (fallback): tenta usar overlay local do JPaperQA, se existir
    if (window.JPaperQA && typeof window.JPaperQA.loadVideo === 'function' && src) {
      try {
        log('Transição entre blocos via JPaperQA.loadVideo:', src);
        const maybe = window.JPaperQA.loadVideo(src);
        if (maybe && typeof maybe.then === 'function') {
          maybe.then(() => { if (!completed && typeof onDone === 'function') onDone(); });
        } else if (typeof onDone === 'function') {
          setTimeout(() => { if (!completed) onDone(); }, 100);
        }
        return true;
      } catch (e) {
        warn('Falha em JPaperQA.loadVideo:', e);
      }
    }

    // Se nada funcionou, segue direto
    return false;
  }


  // ---------- Blocos / Dados ----------

  async function ensureBlocks() {
    if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
      State.blocks = window.JORNADA_BLOCKS;
      return;
    }

    if (window.JPaperQA && typeof window.JPaperQA.loadDynamicBlocks === 'function') {
      const ok = await window.JPaperQA.loadDynamicBlocks();
      if (ok && Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
        State.blocks = window.JORNADA_BLOCKS;
      } else {
        State.blocks = [];
      }
      return;
    }

    State.blocks = window.JORNADA_BLOCKS || [];
  }

  function computeTotals() {
    State.totalBlocks = State.blocks.length || 0;
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

  // ---------- UI helpers ----------

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

    if (raw) raw.textContent = text || '';

    if (window.runTyping) {
      box.textContent = text;
      try {
        await window.runTyping(box);
      } catch (e) {
        warn('runTyping falhou; fallback.');
      }
      return;
    }

    // fallback simples
    box.textContent = '';
    let i = 0;
    const speed = 24;
    await new Promise(resolve => {
      const it = setInterval(() => {
        if (completed) {
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

  // ---------- Captura de respostas ----------

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

  // ---------- Navegação das perguntas ----------

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

    // Última de todas → fecha jornada
    if (isLastOfAll) {
      finishAll();
      return;
    }

    // Ainda existem perguntas globais
    State.globalIdx++;

    if (isLastInBloco) {
      const nextBlocoIdx = State.blocoIdx + 1;
      const currentVideo = bloco.video_after || null;

      State.blocoIdx = nextBlocoIdx;
      State.qIdx = 0;

      // Tenta rodar filme de transição do bloco atual antes de mostrar o próximo
      const usouVideo = playBlockTransition(currentVideo, () => {
        showCurrentQuestion();
      });

      if (!usouVideo) {
        showCurrentQuestion();
      }
    } else {
      // Próxima dentro do mesmo bloco
      State.qIdx++;
      showCurrentQuestion();
    }
  }

  // ---------- Finalização ----------
  function ensureFinalSectionExists() {
    let finalEl =
      document.getElementById(FINAL_SECTION_ID) ||
      document.querySelector('[data-section="final"]') ||
      document.querySelector('.section-final');

    if (!finalEl) {
      // Container onde ficam as seções "originais" para o JC.show clonar
      const container =
        document.getElementById('jornada-sections') ||
        document.querySelector('.jornada-sections') ||
        document.body; // fallback seguro

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

    // tenta usar JORNADA_FINAL_VIDEO; se não, usa o video_after do último bloco; se não, deixa sem vídeo
    let finalVideo = resolveVideoSrc(window.JORNADA_FINAL_VIDEO || null);
    if (!finalVideo && State.blocks && State.blocks.length) {
      const last = State.blocks[State.blocks.length - 1];
      if (last && last.video_after) {
        finalVideo = resolveVideoSrc(last.video_after);
      }
    }

        try {
      // 1) Se tiver vídeo final e função oficial de transição, usa ela
      if (finalVideo && typeof window.playVideoTransition === 'function') {
        log('Transição final via playVideoTransition:', finalVideo, '→', FINAL_SECTION_ID);
        window.playVideoTransition(finalVideo, FINAL_SECTION_ID);
      }
      // 2) Ou se tiver playTransitionThenGo(nextSectionId) configurado
      else if (typeof window.playTransitionThenGo === 'function') {
        log('Transição final via playTransitionThenGo →', FINAL_SECTION_ID);
        window.playTransitionThenGo(FINAL_SECTION_ID);
      }
      // 3) Sem vídeo, usa o controlador padrão
      else if (window.JC?.show && finalEl) {
        log('Usando JC.show para seção final.');
        window.JC.show(FINAL_SECTION_ID);
      }
      else if (typeof window.showSection === 'function' && finalEl) {
        log('Usando showSection(FINAL_SECTION_ID).');
        window.showSection(FINAL_SECTION_ID);
      }
      // 4) Último recurso: âncora
      else if (finalEl) {
        log('Fallback via hash → section-final.');
        window.location.hash = '#' + FINAL_SECTION_ID;
      }
      else {
        warn('section-final não encontrada e não foi possível criar fallback.');
      }
    } catch (e) {
      err('Erro ao navegar para página final:', e);
    }

    try {
      document.dispatchEvent(new CustomEvent('qa:completed', {
        detail: { answers: State.answers, meta: State.meta }
      }));
    } catch (e) {
      warn('Falha ao disparar qa:completed:', e);
    }
  }

  // ---------- Bind de UI ----------

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

  // ---------- Init ----------

  async function init(root) {
    if (State.mounted || State.loading || completed) return;
    State.loading = true;

    await ensureBlocks();
    computeTotals();

    if (!State.blocks.length || !State.totalQuestions) {
      err('JORNADA_BLOCKS vazio; confira jornada-paper-qa.js.');
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
    log(MOD, 'section-perguntas.js montado com sucesso.');
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

  log(MOD, 'carregado (proteções + transições integradas).');
})();
