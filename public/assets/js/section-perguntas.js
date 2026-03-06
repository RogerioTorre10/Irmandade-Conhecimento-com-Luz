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

  function playVideoWithCallback(src, onEnded, nextSectionId = null) {
    src = resolveVideoSrc(src);
    if (!src) {
      if (typeof onEnded === 'function') onEnded();
      return;
    }

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, nextSectionId);
      document.addEventListener('transition:ended', function handler() {
        document.removeEventListener('transition:ended', handler);
        if (typeof onEnded === 'function') onEnded();
      });
      return;
    }

    if (typeof onEnded === 'function') onEnded();
  }
 
      window.playTransitionVideo(url, fakeId);
    } else {
      console.warn('[PERGUNTAS] playTransitionVideo não encontrado.');
      if (typeof onDone === 'function') onDone();
    }
  }

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

    const blocoIdx = Math.max(0, Math.min(blocks.length - 1, State.blocoIdx || 0));
    const qIdx = Math.max(0, State.qIdx || 0);

    const bloco = blocks[blocoIdx] || { questions: [] };
    const blocoTotal = (bloco.questions?.length) || 1;

    const totalBlocks = State.totalBlocks || blocks.length || 1;
    const totalQuestions = State.totalQuestions ||
      blocks.reduce((acc, b) => acc + (b.questions?.length || 0), 0) ||
      1;

    const currentBlockNum    = blocoIdx + 1;
    const currentQuestionNum = Math.min(qIdx + 1, blocoTotal);

    let globalIdx = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (i < blocoIdx) globalIdx += (blocks[i].questions?.length || 0);
    }
    globalIdx += qIdx;
    const currentGlobalNum = Math.min(globalIdx + 1, totalQuestions);

    // Barra topo (blocos)
    const elBlockValue = document.getElementById('progress-block-value');
    if (elBlockValue) elBlockValue.textContent = `${currentBlockNum} de ${totalBlocks}`;

    const elBlockFill = document.getElementById('progress-block-fill');
    if (elBlockFill) {
      const pct = Math.min(100, (currentBlockNum / totalBlocks) * 100);
      elBlockFill.style.width = pct + '%';
    }

    const elBlockLabel = document.querySelector('.progress-top .progress-label');
    if (elBlockLabel) elBlockLabel.textContent = bloco.title || `Bloco ${currentBlockNum}`;

    // Barra meio (perguntas no bloco)
    const elQuestionValue = document.getElementById('progress-question-value');
    if (elQuestionValue) elQuestionValue.textContent = `${currentQuestionNum} / ${blocoTotal}`;

    const elQuestionFill = document.getElementById('progress-question-fill');
    if (elQuestionFill) {
      const pct = Math.min(100, (currentQuestionNum / blocoTotal) * 100);
      elQuestionFill.style.width = pct + '%';
    }

    // Ampulheta total
    const elTotal = document.getElementById('progress-total-value');
    if (elTotal) elTotal.textContent = `${currentGlobalNum} / ${totalQuestions}`;
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

  // ====== APLICAR TEMA DO GUIA CORRETAMENTE ======
  function applyGuiaTheme() {
    const guiaRaw = sessionStorage.getItem('jornada.guia');
    const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : 'default';

    // Aqui você pode adicionar lógica para aplicar classes ou estilos baseados no guia
    document.body.setAttribute('data-guia', guia);

    const colorMap = {
      lumen: '#00d4ff',
      zion:  '#ff3366',
      arian: '#33ff99',
      default: '#ffd700'
    };

    const color = colorMap[guia] || colorMap.default;
    localStorage.setItem('JORNADA_GUIA_COLOR', color);

    console.log('[PERGUNTAS] Tema do guia aplicado:', guia, color);
  }

  // ────────────────────────────────────────────────
  // PATCH / Mimos – parte que roda após a seção aparecer
  // ────────────────────────────────────────────────

  function waitForPerguntasSection(cb) {
    const el = $('#section-perguntas');
    if (el) return cb(el);

    setTimeout(() => waitForPerguntasSection(cb), 60);
  }

  waitForPerguntasSection((rootSection) => {
    if (rootSection.dataset.mimosPatched === '1') return;
    rootSection.dataset.mimosPatched = '1';

    const elBlocoIndicador = rootSection.querySelector('[data-perguntas-bloco-indicador], .perg-bloco-indicador');

    const barraMacroFill  = rootSection.querySelector('.perg-progress-outer[data-kind="macro"] .perg-progress-fill');
    const barraMacroLabel = rootSection.querySelector('.perguntas-progress-top, .perg-progress-top-label');

    const barraMicroFill  = rootSection.querySelector('.perg-progress-outer[data-kind="micro"] .perg-progress-fill');
    const barraMicroLabel = rootSection.querySelector('.perguntas-progress-bottom, .perg-progress-bottom-label');

    const perguntaBox = rootSection.querySelector('.perg-pergunta-titulo, .perguntas-pergunta-titulo');

    const btnTTS = rootSection.querySelector('[data-action="tts"], .btn-tts, .btn-falar');

    function setProgress(fillEl, labelEl, atual, total) {
      if (!fillEl) return;
      const nAtual = Math.max(0, Number(atual) || 0);
      const nTotal = Math.max(1, Number(total) || 1);
      const pct    = Math.min(100, (nAtual / nTotal) * 100);

      fillEl.style.width = pct + '%';

      const qBar = fillEl;
      const qBadge = labelEl;
      const guideColor = localStorage.getItem('JORNADA_GUIA_COLOR') || '#ffd700';

      if (qBar) {
        qBar.style.background = `linear-gradient(to right, transparent, ${guideColor})`;
        qBar.style.boxShadow = `0 0 10px ${guideColor}`;
      }
      if (qBadge) qBadge.style.color = guideColor;

      if (labelEl) {
        labelEl.textContent = `${nAtual} / ${nTotal}`;
      }
    }

    function updateGuiaColor() {
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

    function getStateSnapshot() {
      const S = window.PERGUNTAS_STATE || {};
      return {
        blocoAtual:   S.blocoIdx ?? 0,
        blocosTotal:  S.totalBlocks ?? 1,
        perguntaIdx:  S.qIdx ?? 0,
        perguntasBloco: (S.blocks[S.blocoIdx]?.questions?.length) ?? 1,
        perguntaGlobal: S.globalIdx ?? 0,
        perguntasTotal: S.totalQuestions ?? 1,
      };
    }

    function refreshUIFromState() {
      const s = getStateSnapshot();

      updateBlocoIndicador(s.blocoAtual + 1, s.blocosTotal);

      setProgress(barraMacroFill, barraMacroLabel, s.perguntaGlobal + 1, s.perguntasTotal);
      setProgress(barraMicroFill, barraMicroLabel, (s.perguntaIdx % s.perguntasBloco) + 1, s.perguntasBloco);

      updateGuiaColor();
    }

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

    if (btnTTS) {
      btnTTS.addEventListener('click', function (ev) {
        ev.preventDefault();
        speakCurrentQuestion();
      });
    }

    // ────────────────────────────────────────────────
    // MIC — Delegação robusta
    // ────────────────────────────────────────────────
    (function micDelegationRobusta() {
      'use strict';

      if (window.__MIC_DELEGATION_BOUND__) return;
      window.__MIC_DELEGATION_BOUND__ = true;

      const MIC_SELECTOR =
        '.btn-mic, .mic-btn, [data-mic], [data-action="mic"], [aria-label*="microfone"], [title*="microfone"]';

      const log = (...a) => console.log('[MIC]', ...a);

      function startMicStable() {
        if (window.__MIC_START_LOCK__) return;
        window.__MIC_START_LOCK__ = true;
        setTimeout(() => (window.__MIC_START_LOCK__ = false), 450);

        try {
          if (typeof window.startMic === 'function') return window.startMic();
          if (typeof window.initSpeechRecognition === 'function') return window.initSpeechRecognition();

          if (window.__REC__ && window.__REC_RUNNING__) {
            try { window.__REC__.stop(); } catch (e) {}
            window.__REC_RUNNING__ = false;
          }

          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SR) {
            console.warn('[MIC] SpeechRecognition não suportado neste navegador.');
            return;
          }

          if (!window.__REC__) {
            const rec = new SR();
            rec.lang = document.documentElement.lang || 'pt-BR';
            rec.continuous = false;
            rec.interimResults = true;

            rec.onend = () => { window.__REC_RUNNING__ = false; log('onend'); };
            rec.onerror = (e) => { window.__REC_RUNNING__ = false; console.warn('[MIC] onerror', e); };

            window.__REC__ = rec;
          }

          window.__REC_RUNNING__ = true;

          clearTimeout(window.__REC_FAILSAFE_T__);
          window.__REC_FAILSAFE_T__ = setTimeout(() => {
            if (window.__REC_RUNNING__) {
              try { window.__REC__.stop(); } catch (e) {}
              window.__REC_RUNNING__ = false;
              console.warn('[MIC] failsafe: stop() por travamento silencioso.');
            }
          }, 9000);

          window.__REC__.start();
          log('start()');
        } catch (e) {
          window.__REC_RUNNING__ = false;
          console.error('[MIC] erro ao iniciar', e);
        }
      }

      function handler(e) {
        const btn = e.target.closest(MIC_SELECTOR);
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;

        startMicStable();
      }

      document.addEventListener('pointerdown', handler, { capture: true, passive: false });
      document.addEventListener('touchstart', handler, { capture: true, passive: false });
      document.addEventListener('click', handler, { capture: true, passive: false });

      log('delegação ativa');
    })();

    // ────────────────────────────────────────────────
    // Hooks de atualização
    // ────────────────────────────────────────────────

    document.addEventListener('perguntas:state-changed', refreshUIFromState);
    document.addEventListener('JC.perguntas:next',        refreshUIFromState);
    document.addEventListener('JC.perguntas:prev',        refreshUIFromState);
    document.addEventListener('JC.perguntas:jump',        refreshUIFromState);

    document.addEventListener('JC.section:shown', function (ev) {
      if (!ev?.detail || ev.detail.id !== 'section-perguntas') return;
      refreshUIFromState();
    });

    window.addEventListener('load', function () {
      setTimeout(refreshUIFromState, 400);
    });

    log('Patch de mimos inicializado.');
  });

  // Exporta o state para ser usado no patch acima
  window.PERGUNTAS_STATE = State;

  log(MOD, 'carregado');
})();  // <--- FECHAMENTO FINAL DO ARQUIVO PRINCIPAL
