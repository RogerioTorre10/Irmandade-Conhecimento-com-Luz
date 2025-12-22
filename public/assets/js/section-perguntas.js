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
    const blocks = State.blocks || [];
    if (!blocks.length) return;

    // Índices atuais vindos do próprio State da jornada
    const blocoIdx = Math.max(
      0,
      Math.min(blocks.length - 1, State.blocoIdx || 0)
    );
    const qIdx = Math.max(0, State.qIdx || 0);

    const bloco = blocks[blocoIdx] || { questions: [] };
    const blocoTotal =
      (bloco.questions && bloco.questions.length) || 1;

    const totalBlocks =
      State.totalBlocks || blocks.length || 1;

    const totalQuestions =
      State.totalQuestions ||
      blocks.reduce(
        (acc, b) => acc + ((b.questions && b.questions.length) || 0),
        0
      ) ||
      1;

    const currentBlockNum    = blocoIdx + 1;                // 1..N blocos
    const currentQuestionNum = Math.min(qIdx + 1, blocoTotal); // 1..N perguntas dentro do bloco

    // Índice global 1..totalQuestions (ampulheta)
    let globalIdx = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (i < blocoIdx) {
        globalIdx += (blocks[i].questions && blocks[i].questions.length) || 0;
      }
    }
    globalIdx += qIdx;
    const currentGlobalNum = Math.min(globalIdx + 1, totalQuestions);

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

    // Nome do bloco (título)
    const elBlockLabel = document.querySelector('.progress-top .progress-label');
    if (elBlockLabel) {
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
   // ====== INJETAR CORES LUMINOSAS POR GUIA ======
  (function applyGuideGlow() {
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

    // reforço direto na barra (garante a cor mesmo com outros CSS)
    document
      .querySelectorAll('#progress-block-fill, #progress-question-fill')
      .forEach((f) => {
        f.style.background = color;
        f.style.boxShadow  = glow;
      });

    // AURA nos botões da página de perguntas
    document
      .querySelectorAll('#section-perguntas .btn')
      .forEach((b) => {
        b.style.boxShadow  = glow;
        b.style.borderColor = color;
      });
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
  window.__QA_META__    = State.meta;

  log('Jornada de perguntas concluída.', {
    total: State.totalQuestions,
    respondidas: Object.keys(State.answers).length
  });

  if (window.JORNADA_CHAMA) {
    window.JORNADA_CHAMA.setChamaIntensidade('chama-perguntas', 'forte');
  }

  // ---------------- VÍDEO FINAL + NAVEGAÇÃO ---------------- 
  const finalVideoSrc   = window.JORNADA_FINAL_VIDEO || FINAL_VIDEO_FALLBACK;
  const targetSectionId = FINAL_SECTION_ID; // 'section-final'

  if (finalVideoSrc && typeof window.playTransitionVideo === 'function') {
    log('Iniciando vídeo final (portal → section-final):', finalVideoSrc);
    window.playTransitionVideo(finalVideoSrc, targetSectionId);
  } else {
    log('Sem vídeo de transição final; indo direto para section-final');

    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(targetSectionId);
    } else {
      document.querySelectorAll('section.section').forEach(sec => {
        sec.style.display = (sec.id === targetSectionId) ? 'block' : 'none';
      });
      const finalEl = document.getElementById(targetSectionId);
      if (finalEl) finalEl.scrollIntoView({ behavior: 'smooth' });
    }
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
    let micInstance = null;

    if (btnFalar && input && window.JORNADA_MICRO) {
      const Micro = window.JORNADA_MICRO;

      btnFalar.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        // 1) Garante que o input está "conectado" ao módulo de voz
        if (!micAttached && typeof Micro.attach === 'function') {
          micInstance = Micro.attach(input, { mode: 'append' });
          micAttached = true;
        }

        if (!micInstance) return;

        // 2) Liga / desliga a captura de voz (toggle manual)
        const btnMic = micInstance.button;
        const isRec  = btnMic && btnMic.classList.contains('rec');

        if (isRec) {
          if (typeof micInstance.stop === 'function') {
            micInstance.stop();
          }
        } else {
          if (typeof micInstance.start === 'function') {
            micInstance.start();
          }
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
    
    // FIX 5: Atualiza áurea quando guia muda
      const guideColor = localStorage.getItem('JORNADA_GUIA_COLOR') || '#ffd700';
      document.querySelectorAll('.btn').forEach(b => {
      b.style.setProperty('--guide-color', guideColor);
   });

    // (opcional) nada de attach automático aqui, só pelo botão falar
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

/* ============================================================
 * PATCH – Mimos da página de perguntas
 * - Indicador de bloco
 * - Barras de progresso
 * - Cor do guia nas perguntas
 * - Botão Falar (TTS)
 * ============================================================ */
(function () {
  'use strict';

  if (!window.__PERGUNTAS_MIMOS__) {
    window.__PERGUNTAS_MIMOS__ = true;
  } else {
    // evita rodar duas vezes
    return;
  }

  const log = (...a) => console.log('[PERGUNTAS:MIMOS]', ...a);
  const $   = (sel, root = document) => (root || document).querySelector(sel);

  // ---- 1. Pegar elementos básicos uma vez ----
  const rootSection    = $('#section-perguntas');
  if (!rootSection) {
    log('Seção #section-perguntas não encontrada – abortando patch.');
    return;
  }

  // topo: "1 de 5"
  const elBlocoIndicador = rootSection.querySelector('[data-perguntas-bloco-indicador], .perg-bloco-indicador');

  // barras de progresso
  const barraMacroFill  = rootSection.querySelector('.perg-progress-outer[data-kind="macro"] .perg-progress-fill');
  const barraMacroLabel = rootSection.querySelector('.perguntas-progress-top, .perg-progress-top-label');

  const barraMicroFill  = rootSection.querySelector('.perg-progress-outer[data-kind="micro"] .perg-progress-fill');
  const barraMicroLabel = rootSection.querySelector('.perguntas-progress-bottom, .perg-progress-bottom-label');

  // container da pergunta (para tingir com a cor do guia)
  const perguntaBox = rootSection.querySelector('.perg-pergunta-titulo, .perguntas-pergunta-titulo');

  // botão Falar
  const btnFalar = rootSection.querySelector('[data-action="tts"], .btn-tts, .btn-falar');

  // ---- 2. Funções utilitárias ----

  function setProgress(fillEl, labelEl, atual, total) {
    if (!fillEl) return;
    const nAtual = Math.max(0, Number(atual) || 0);
    const nTotal = Math.max(1, Number(total) || 1);
    const pct    = Math.min(100, (nAtual / nTotal) * 100);

    fillEl.style.width = pct + '%';

    // FIX 2: Luz do guia no progresso
    const guideColor = localStorage.getItem('JORNADA_GUIA_COLOR') || '#ffd700'; // pega cor do guia salvo
    qBar.style.background = `linear-gradient(to right, transparent, ${guideColor})`; // luz preenchendo
    qBar.style.boxShadow = `0 0 10px ${guideColor}`; // emite luz
    qBadge.style.color = guideColor; // badge reflete cor do guia

    if (labelEl) {
      labelEl.textContent = `${nAtual} / ${nTotal}`;
    }
  }

  function updateGuiaColor() {
    // Usa o atributo data-guia do <body> para determinar a cor
    const guia = (document.body.getAttribute('data-guia') || '').toLowerCase();
    if (!perguntaBox || !guia) return;

    perguntaBox.classList.remove('guia-lumen', 'guia-zion', 'guia-arian');
    if (guia === 'lumen') perguntaBox.classList.add('guia-lumen');
    if (guia === 'zion')  perguntaBox.classList.add('guia-zion');
    if (guia === 'arian') perguntaBox.classList.add('guia-arian');
  }

  function updateBlocoIndicador(blocoAtual, blocosTotal) {
    if (!elBlocoIndicador) return;
    const a = Number(blocoAtual) || 1;
    const t = Number(blocosTotal) || 1;
    elBlocoIndicador.textContent = `${a} de ${t}`;
  }

  // ---- 3. Integração com o State existente ----
  //
  // Este patch tenta ler o objeto State exportado pelo section-perguntas.js.
  // Se ele não existir, caímos em um modo mais simples baseado em data-atributos.

  function getStateSnapshot() {
    const S = window.PERGUNTAS_STATE || window.SectionPerguntasState || window.State || {};
    const snap = {
      blocoAtual:   S.currentBlockIndex ?? S.blocoAtual ?? 0,
      blocosTotal:  S.totalBlocks      ?? S.blocosTotal ?? 1,
      perguntaIdx:  S.currentIndex     ?? S.perguntaIdx ?? 0,
      perguntasBloco: S.questionsPerBlock ?? S.perguntasBloco ?? 1,
      perguntaGlobal: S.currentGlobalIndex ?? S.perguntaGlobal ?? 0,
      perguntasTotal: S.totalQuestions     ?? S.perguntasTotal ?? 1,
    };
    return snap;
  }

  function refreshUIFromState() {
    const s = getStateSnapshot();

    // bloco atual (1 de 5)
    updateBlocoIndicador(s.blocoAtual + 1, s.blocosTotal);

    // barra global (todas perguntas da jornada)
    setProgress(
      barraMacroFill,
      barraMacroLabel,
      s.perguntaGlobal + 1,
      s.perguntasTotal
    );

    // barra micro (perguntas dentro do bloco)
    setProgress(
      barraMicroFill,
      barraMicroLabel,
      (s.perguntaIdx % s.perguntasBloco) + 1,
      s.perguntasBloco
    );

    // tingir pergunta com a cor do guia
    updateGuiaColor();
  }

  // ---- 4. TTS – botão Falar ----
  function speakCurrentQuestion() {
    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        alert('Leitura em voz alta não está disponível neste navegador.');
        return;
      }

      const perguntaEl = rootSection.querySelector('.perguntas-pergunta-texto, .pergunta-texto, .pergunta-atual');
      if (!perguntaEl) return;

      const text = perguntaEl.textContent.trim();
      if (!text) return;

      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = document.documentElement.lang || 'pt-BR';
      synth.speak(utter);
    } catch (e) {
      console.error('[PERGUNTAS:TTS] erro ao falar', e);
    }
  }

  if (btnFalar) {
    btnFalar.addEventListener('click', function (ev) {
      ev.preventDefault();
      speakCurrentQuestion();
    });
  }

 // =====================================================
// MIC — DELEGAÇÃO ROBUSTA (mobile estável)
// Captura: pega o evento antes de overlays e handlers
// =====================================================
(function micDelegationRobusta() {
  if (window.__MIC_DELEGATION_BOUND__) return;
  window.__MIC_DELEGATION_BOUND__ = true;

  const MIC_SELECTOR =
    '#btn-mic, .btn-mic, .mic-btn, [data-mic], [data-action="mic"], [aria-label*="microfone"], [title*="microfone"]';

  const log = (...a) => console.log('[MIC]', ...a);

  function callStartMic() {
    // evita “duplo start” em toques rápidos
    if (window.__MIC_START_LOCK__) return;
    window.__MIC_START_LOCK__ = true;
    setTimeout(() => (window.__MIC_START_LOCK__ = false), 400);

    try {
      if (typeof window.startMic === 'function') return window.startMic();
      if (typeof window.initSpeechRecognition === 'function') return window.initSpeechRecognition();
      log('Função startMic/initSpeechRecognition não encontrada');
    } catch (e) {
      console.error('[MIC] erro ao iniciar', e);
      window.__MIC_START_LOCK__ = false;
    }
  }

  function handler(e) {
    const btn = e.target?.closest?.(MIC_SELECTOR);
    if (!btn) return;

    // se algum overlay estiver “pegando” o toque, aqui ainda capturamos
    e.preventDefault();
    e.stopPropagation();

    // debug: confirma que o evento chegou
    log('evento', e.type, 'ok; target=', btn);

    // se o botão estiver disabled ou com aria-disabled, não chama
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
      log('botão está disabled/aria-disabled');
      return;
    }

    callStartMic();
  }

  // CAPTURE = true (muito importante)
  document.addEventListener('pointerdown', handler, { capture: true, passive: false });
  document.addEventListener('touchstart', handler, { capture: true, passive: false });
  document.addEventListener('click', handler, { capture: true, passive: false });
})();



  // ---- 5. Hooks de atualização ----
  //
  // A maioria dos seus scripts dispara eventos do JC quando troca de pergunta/bloco.
  // Vamos ouvir esses eventos; se eles não existirem, ainda chamamos 1x no início.

  document.addEventListener('perguntas:state-changed', refreshUIFromState);
  document.addEventListener('JC.perguntas:next',        refreshUIFromState);
  document.addEventListener('JC.perguntas:prev',        refreshUIFromState);
  document.addEventListener('JC.perguntas:jump',        refreshUIFromState);

  // Quando a seção aparece pela primeira vez
  document.addEventListener('JC.section:shown', function (ev) {
    if (!ev || !ev.detail || ev.detail.id !== 'section-perguntas') return;
    refreshUIFromState();
  });

  // fallback – se nada disparar, ainda assim tentamos uma vez após o load
  window.addEventListener('load', function () {
    setTimeout(refreshUIFromState, 400);
  });

  log('Patch de mimos inicializado.');
})();

