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
// OVERLAY DE VÍDEO (entre blocos e final) — PORTAL GLOBAL
// --------------------------------------------------

function resolveVideoSrc(src) {
  if (!src) return null;
  let url = String(src).trim();
  if (url.startsWith('/assets/img/') && url.endsWith('.mp4')) {
    url = url.replace('/assets/img/', '/assets/videos/');
  }
  return url;
}

// usa o portal dourado FULL + limelight
function playVideoWithCallback(src, onEnded, nextSectionId = null) {
  src = resolveVideoSrc(src);
  if (!src) {
    if (typeof onEnded === 'function') onEnded();
    return;
  }

  // Se existir player global cinematográfico, usa ele
  if (typeof window.playTransitionVideo === 'function') {
    window.playTransitionVideo(src, nextSectionId);
    // quando o portal fecha ele navega; aqui só chamamos callback depois
    document.addEventListener('transition:ended', function handler() {
      document.removeEventListener('transition:ended', handler);
      if (typeof onEnded === 'function') onEnded();
    });
    return;
  }

  // fallback (raríssimo): sem portal → só chama callback
  if (typeof onEnded === 'function') onEnded();
}

window.playBlockTransition = function(videoSrc, onDone) {
  const src = resolveVideoSrc(videoSrc);
  if (!src) {
    if (typeof onDone === 'function') onDone();
    return;
  }
  log('Transição entre blocos (PORTAL GLOBAL):', src);
  playVideoWithCallback(src, onDone);
};


  // --------------------------------------------------
  // BLOCS / PERGUNTAS
  // --------------------------------------------------

  async function ensureBlocks() {
    if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
      State.blocks = window.JORNADA_BLOCKS;
      return;
    }

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
  // UI / BARRAS / DATILOGRAFIA + LEITURA
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
  const JC     = window.JC || {};
  const blocks = window.JORNADA_BLOCKS || [];

  const blocoIdx  = JC.currentBloco    || 0;
  const qIdx      = JC.currentPergunta || 0;

  const bloco = blocks[blocoIdx] || { questions: [] };
  const blocoTotal = (bloco.questions && bloco.questions.length) || 1;

  const totalBlocks    = blocks.length || 1;
  const totalQuestions = blocks.reduce((acc, b) => acc + (b.questions?.length || 0), 0) || 1;

  const currentBlockNum    = blocoIdx + 1;      // 1–5
  const currentQuestionNum = qIdx + 1;          // 1–N dentro do bloco
  let   globalIdx          = 0;

  // índice global (1–totalQuestions)
  for (let i = 0; i < blocks.length; i++) {
    if (i < blocoIdx) {
      globalIdx += blocks[i].questions?.length || 0;
    }
  }
  globalIdx += qIdx;
  const currentGlobalNum = globalIdx + 1;

  // --- 1) Barra do topo (blocos) ---
  const elBlockValue = document.getElementById('progress-block-value');
  if (elBlockValue) {
    elBlockValue.textContent = `${currentBlockNum} de ${totalBlocks}`;
  }

  const elBlockFill = document.getElementById('progress-block-fill');
  if (elBlockFill) {
    const pctBlock = Math.max(
      0,
      Math.min(100, (currentBlockNum / totalBlocks) * 100)
    );
    elBlockFill.style.width = pctBlock + '%';
  }

  // Nome do bloco (usa título das traduções)
  const elBlockLabel = document.querySelector('.progress-top .progress-label');
  if (elBlockLabel) {
    // ex: "Bloco 2 — Reflexões"
    elBlockLabel.textContent = bloco.title || `Bloco ${currentBlockNum}`;
  }

  // --- 2) Barra do meio (perguntas no bloco) ---
  const elQuestionValue = document.getElementById('progress-question-value');
  if (elQuestionValue) {
    elQuestionValue.textContent = `${currentQuestionNum} / ${blocoTotal}`;
  }

  const elQuestionFill = document.getElementById('progress-question-fill');
  if (elQuestionFill) {
    const pctQuestion = Math.max(
      0,
      Math.min(100, (currentQuestionNum / blocoTotal) * 100)
    );
    elQuestionFill.style.width = pctQuestion + '%';
  }

  // --- 3) Ampulheta (total geral) ---
  const elTotal = document.getElementById('progress-total-value');
  if (elTotal) {
    elTotal.textContent = `${currentGlobalNum} / ${totalQuestions}`;
  }
}

  async function typeQuestion(text) {
    if (completed) return;

    const box = $('#jp-question-typed');
    const raw = $('#jp-question-raw');
    if (!box) return;

    const pergunta = text || '[pergunta]';

    if (raw) raw.textContent = pergunta;

    box.style.textAlign = 'left';
    box.textContent = '';
    box.classList.remove('typing-done');
    box.removeAttribute('data-typing');

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

    // LEITURA AUTOMÁTICA
    if ('speechSynthesis' in window && pergunta.trim()) {
      const utter = new SpeechSynthesisUtterance(pergunta);
      utter.lang = 'pt-BR';
      utter.rate = 0.9;
      utter.pitch = 1;
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(utter), 300);
    }

    if (typeof window.runTyping === 'function') {
      try {
        box.setAttribute('data-typing', 'true');
        await window.runTyping(box);
      } catch (e) {
        console.warn('[PERGUNTAS] runTyping falhou:', e);
      } finally {
        box.classList.add('typing-done');
        box.removeAttribute('data-typing');
      }
    }
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
  // ====== INJETAR CORES LUMINOSAS POR GUIA ======
(function applyGuideGlow(){
  const guia = sessionStorage.getItem('jornada.guia')?.toLowerCase() || 'lumen';

  const style = document.createElement('style');
  style.id = 'progress-glow-style';

  let color = '#00ff9d';    // padrão: Lumen
  let glow  = '0 0 12px #00ff9d, 0 0 24px #00ff9d';

  if (guia === 'arian') {
    color = '#ff00ff';
    glow  = '0 0 12px #ff00ff, 0 0 24px #ff55ff';
  }
  if (guia === 'zion') {
    color = '#00aaff';
    glow  = '0 0 10px #ffd65b, 0 0 18px #ffd65b, 0 0 30px #00aaff';
  }

  style.textContent = `
    #progress-block-fill,
    #progress-question-fill {
      background: ${color} !important;
      box-shadow: ${glow} !important;
    }
  `;

  // remove estilo antigo se existir
  const old = document.getElementById('progress-glow-style');
  if (old) old.remove();

  document.head.appendChild(style);
})();


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
  // NAVEGAÇÃO
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

    if (isLastOfAll) {
      finishAll();
      return;
    }

    State.globalIdx++;

    if (isLastInBloco) {
      const nextBlocoIdx = State.blocoIdx + 1;
      const video = bloco.video_after || bloco.transitionVideo || null;

      State.blocoIdx = nextBlocoIdx;
      State.qIdx = 0;

      window.playBlockTransition(video, () => {
        if (!completed) showCurrentQuestion();
      });
    } else {
      State.qIdx++;
      showCurrentQuestion();
    }
  }

     // --------------------------------------------------
  // FINALIZAÇÃO — FALLBACK LIMPO PARA SECTION-FINAL
  // --------------------------------------------------

  // Fallback FINAL — usa o HTML real fornecido
function ensureFinalSectionExists() {
  let finalEl = document.getElementById("section-final");

  if (!finalEl) {
    finalEl = document.createElement("section");
    finalEl.id = "section-final";
    finalEl.className = "section section-final";
    finalEl.style.display = "none";

    finalEl.innerHTML = `
      <div class="final-pergaminho-wrapper">
        <div class="j-panel-glow final-panel">
          <div class="j-perg-v-inner">
            <div class="pergaminho-content">

              <h1 id="final-title" class="final-title typing-text"></h1>

              <div id="final-message" class="final-message">
                <p data-original="Suas respostas foram recebidas com honra pela Irmandade."></p>
                <p data-original="Você plantou sementes de confiança, coragem e luz."></p>
                <p data-original="Continue caminhando. A jornada nunca termina."></p>
                <p data-original="Volte quando precisar reacender a chama."></p>
                <p class="final-bold" data-original="Você é a luz. Você é a mudança."></p>
              </div>

              <div class="final-acoes">
                <button id="btnBaixarPDFHQ" class="btn btn-gold" disabled>✅Baixar PDF e HQ</button>
                <button id="btnVoltarInicio" class="btn btn-light">🙏Voltar ao Início🚀</button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <video id="final-video" playsinline preload="auto" style="display:none;"></video>
    `;

    document.getElementById("jornada-content-wrapper")?.appendChild(finalEl);
  }

  return finalEl;
}


  function showFinalSection() {
    const finalEl = ensureFinalSectionExists();

    const wrapper = document.getElementById('jornada-content-wrapper');
    if (wrapper) {
      // limpa tudo que está dentro e deixa só a final
      wrapper.innerHTML = '';
      wrapper.appendChild(finalEl);
    }

    // Fluxo oficial controlado pelo JC
    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(FINAL_SECTION_ID);
    } else {
      // Fallback simples
      document.querySelectorAll('section.section').forEach(sec => {
        sec.style.display = (sec.id === FINAL_SECTION_ID) ? 'block' : 'none';
      });
      finalEl.scrollIntoView({ behavior: 'smooth' });
    }
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

    const finalVideoSrc = resolveVideoSrc(
      window.JORNADA_FINAL_VIDEO || FINAL_VIDEO_FALLBACK
    );

    if (finalVideoSrc) {
      log('Iniciando vídeo final:', finalVideoSrc);
      playVideoWithCallback(finalVideoSrc, showFinalSection);
    } else {
      showFinalSection();
    }

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
  root = root || document.getElementById(SECTION_ID) || document;

  const btnFalar  = $('#jp-btn-falar', root);
  const btnApagar = $('#jp-btn-apagar', root);
  const btnConf   = $('#jp-btn-confirmar', root);
  const input     = $('#jp-answer-input', root);

  // ================================
  // MICROFONE controlado pelo botão
  // ================================
  let micAttached = false;

  if (btnFalar && input && window.JORNADA_MICRO) {
    const Micro = window.JORNADA_MICRO;

    btnFalar.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      // 1) Garante que o input está "conectado" ao módulo de voz
      if (!micAttached && typeof Micro.attach === 'function') {
        // se no jornada-micro.js existir alguma opção tipo "hideButton",
        // pode passar aqui também, ex: { mode: 'append', hideButton: true }
        Micro.attach(input, { mode: 'append' });
        micAttached = true;
      }

      // 2) Liga / desliga a captura de voz
      if (typeof Micro.toggle === 'function') {
        // caminho ideal: módulo expõe um toggle()
        Micro.toggle();
      } else if (typeof Micro.start === 'function') {
        // fallback: se só existir start(), chama start sempre
        Micro.start();
      } else {
        console.warn('[PERGUNTAS] JORNADA_MICRO não tem toggle()/start().');
      }
    });
  }

  // APAGAR
  if (btnApagar && input) {
    btnApagar.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      input.value = '';
      input.focus();
      if (window.JORNADA_CHAMA) {
        window.JORNADA_CHAMA.setChamaIntensidade('chama-perguntas', 'media');
      }
    });
  }

  // CONFIRMAR
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

  // INPUT CHAMA
  if (input && window.JORNADA_CHAMA) {
    input.addEventListener('input', () => {
      const txt = input.value || '';
      window.JORNADA_CHAMA.updateChamaFromText(txt, 'chama-perguntas');
    });
  }

  // MICROFONE AUTOMÁTICO (opcional)
  //if (input && window.JORNADA_MICRO) {
  // window.JORNADA_MICRO.attach(input, { mode: 'append' });
 // }
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
      Object.assign(State, {
        mounted: false, loading: false, answers: {}, meta: null,
        blocoIdx: 0, qIdx: 0, globalIdx: 0
      });
      completed = false;
      log('Reset concluído.');
    }
  };

  log(MOD, 'carregado');
})();
