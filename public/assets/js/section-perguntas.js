/* /assets/js/section-perguntas.js — VERSÃO CORRIGIDA
 * Controlador único da jornada de perguntas.
 * - IDs de elementos unificados: #jp-question-typed, #jp-answer-input
 * - Contadores consistentes (modo teste = 1 pergunta/bloco, ou real = N perguntas/bloco)
 * - Vídeo de transição tocado ENTRE BLOCOS (após responder última pergunta do bloco)
 * - Sem conflito com jornada-paper-qa.js (que agora só fornece dados)
 */

(function () {
  'use strict';

  if (window.__PERGUNTAS_BOUND__) {
    console.log('[PERGUNTAS] Já inicializado, ignorando.');
    return;
  }
  window.__PERGUNTAS_BOUND__ = true;

  const MOD = 'section-perguntas.js';
  const SECTION_ID       = 'section-perguntas';
  const FINAL_SECTION_ID = 'section-final';

  const log  = (...a) => console.log('[PERGUNTAS]', ...a);
  const warn = (...a) => console.warn('[PERGUNTAS]', ...a);
  const err  = (...a) => console.error('[PERGUNTAS]', ...a);
  const $    = (sel, root = document) => (root || document).querySelector(sel);

  // ── State ────────────────────────────────────────────────────────────────────
  const State = {
    mounted:        false,
    blocks:         [],
    totalBlocks:    0,
    totalQuestions: 0,
    blocoIdx:       0,
    qIdx:           0,
    globalIdx:      0,
    startedAt:      null,
    answers:        {},
    meta:           null,
    // true = conta só 1 pergunta por bloco nos contadores (fase de teste)
    // false = conta o número real de perguntas por bloco (produção)
    testMode:       true
  };

  let completed = false;
  window.PERGUNTAS_STATE = State;

  // ── Resolve caminho do vídeo ─────────────────────────────────────────────────
  function resolveVideoSrc(src) {
    if (!src) return null;
    let url = String(src).trim();
    // Garante que vídeos sempre vão para /assets/videos/
    if (url.includes('/assets/img/') && url.endsWith('.mp4')) {
      url = url.replace('/assets/img/', '/assets/videos/');
    }
    return url;
  }

  // ── Transição entre blocos (usa motor global do video-transicao.js) ───────────
  function runBlockTransition(videoSrc, onDone) {
    const url = resolveVideoSrc(videoSrc);

    if (!url) {
      if (typeof onDone === 'function') onDone();
      return;
    }

    log('Transição entre blocos:', url);

    // Usa window.playBlockTransition instalado pelo video-transicao.js
    if (typeof window.playBlockTransition === 'function') {
      try {
        window.playBlockTransition(url, onDone);
        return;
      } catch (e) {
        warn('playBlockTransition falhou, usando fallback:', e);
      }
    }

    // Fallback: usa playTransitionVideo sem navegar
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(url, null);
      const handler = () => {
        document.removeEventListener('transition:ended', handler, true);
        if (typeof onDone === 'function') onDone();
      };
      document.addEventListener('transition:ended', handler, true);
      return;
    }

    warn('Nenhum motor de vídeo disponível, avançando sem transição.');
    if (typeof onDone === 'function') onDone();
  }

  // ── Carrega blocos ────────────────────────────────────────────────────────────
  async function ensureBlocks() {
    // 1) Já prontos via window.JORNADA_BLOCKS
    if (Array.isArray(window.JORNADA_BLOCKS) && window.JORNADA_BLOCKS.length) {
      State.blocks = window.JORNADA_BLOCKS;
      computeTotals();
      return;
    }

    // 2) Tenta carregar via JPaperQA
    if (window.JPaperQA && typeof window.JPaperQA.loadDynamicBlocks === 'function') {
      try {
        await window.JPaperQA.loadDynamicBlocks();
      } catch (e) {
        err('Erro ao carregar blocos via JPaperQA:', e);
      }
    }

    // 3) Fallback direto em blockTranslations
    if (!Array.isArray(window.JORNADA_BLOCKS) || !window.JORNADA_BLOCKS.length) {
      const lang = (window.i18n?.lang) || 'pt-BR';
      window.JORNADA_BLOCKS =
        (window.blockTranslations && (window.blockTranslations[lang] || window.blockTranslations['pt-BR'])) || [];
    }

    State.blocks = window.JORNADA_BLOCKS || [];
    computeTotals();
  }

  // ── Totais ────────────────────────────────────────────────────────────────────
  function computeTotals() {
    State.totalBlocks = State.blocks.length;

    if (State.testMode) {
      // Modo teste: 1 pergunta por bloco nos contadores
      State.totalQuestions = State.blocks.length;
    } else {
      // Produção: conta o número real
      State.totalQuestions = State.blocks.reduce(
        (sum, b) => sum + (b.questions?.length || 0), 0
      );
    }
  }

  // ── Pergunta atual ────────────────────────────────────────────────────────────
  function getCurrent() {
    const bloco    = State.blocks[State.blocoIdx];
    const pergunta = bloco?.questions?.[State.qIdx] || null;
    return { bloco, pergunta };
  }

  // ── Atualiza barras de progresso ──────────────────────────────────────────────
  function updateCounters() {
    const blocks = State.blocks;
    if (!blocks.length) return;

    const blocoIdx       = State.blocoIdx;
    const bloco          = blocks[blocoIdx] || { questions: [] };
    const totalBlocks    = State.totalBlocks;
    const totalQuestions = State.totalQuestions;

    // ── Barra de blocos (macro) ──
    const currentBlockNum = blocoIdx + 1;
    const blockPct = Math.min(100, (currentBlockNum / totalBlocks) * 100);

    const elBlockValue = document.getElementById('progress-block-value');
    if (elBlockValue) elBlockValue.textContent = `${currentBlockNum} de ${totalBlocks}`;

    const elBlockFill = document.getElementById('progress-block-fill');
    if (elBlockFill) elBlockFill.style.width = blockPct + '%';

    const elBlockLabel = document.querySelector('.progress-top .progress-label');
    if (elBlockLabel) elBlockLabel.textContent = bloco.title || `Bloco ${currentBlockNum}`;

    // ── Barra de perguntas no bloco (micro) ──
    // No modo teste sempre mostra 1/1; no modo produção mostra qIdx+1 / total do bloco
    const questionsInBlock = State.testMode ? 1 : (bloco.questions?.length || 1);
    const currentQuestionNum = State.testMode ? 1 : (State.qIdx + 1);
    const questionPct = Math.min(100, (currentQuestionNum / questionsInBlock) * 100);

    const elQuestionValue = document.getElementById('progress-question-value');
    if (elQuestionValue) elQuestionValue.textContent = `${currentQuestionNum} / ${questionsInBlock}`;

    const elQuestionFill = document.getElementById('progress-question-fill');
    if (elQuestionFill) elQuestionFill.style.width = questionPct + '%';

    // ── Barra global / ampulheta ──
    // No modo teste globalIdx = blocoIdx; em produção conta perguntas reais
    const currentGlobalNum = State.testMode
      ? currentBlockNum
      : State.globalIdx + 1;
    const globalPct = Math.min(100, (currentGlobalNum / totalQuestions) * 100);

    const elTotalValue = document.getElementById('progress-total-value');
    if (elTotalValue) elTotalValue.textContent = `${currentGlobalNum} / ${totalQuestions}`;

    const elTotalFill = document.getElementById('progress-total-fill');
    if (elTotalFill) elTotalFill.style.width = globalPct + '%';

    // Dispara evento para patches externos (mimos)
    document.dispatchEvent(new CustomEvent('perguntas:state-changed'));
  }

  // ── Datilografia ──────────────────────────────────────────────────────────────
  async function typeQuestion(text) {
    if (completed) return;

    // IDs corretos do HTML — se não existir, tenta variantes
    const box = document.getElementById('jp-question-typed')
             || document.getElementById('question-display')
             || $('.jp-question-typed, .perguntas-pergunta-texto');
    const raw = document.getElementById('jp-question-raw');

    if (!box) {
      warn('Elemento de exibição da pergunta não encontrado (#jp-question-typed).');
      return;
    }

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
        if (completed) { clearInterval(it); return resolve(); }
        box.textContent = pergunta.slice(0, i);
        i++;
        if (i > pergunta.length) {
          clearInterval(it);
          box.classList.add('typing-done');
          resolve();
        }
      }, speed);
    });

    // TTS opcional
    if ('speechSynthesis' in window && pergunta.trim()) {
      const utter = new SpeechSynthesisUtterance(pergunta);
      utter.lang = document.documentElement.lang || 'pt-BR';
      utter.rate  = 0.9;
      utter.pitch = 1;
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(utter), 300);
    }
  }

  // ── Exibe pergunta atual ──────────────────────────────────────────────────────
  async function showCurrentQuestion() {
    if (completed) return;

    const { bloco, pergunta } = getCurrent();

    // Textarea: tenta vários IDs/seletores possíveis
    const textarea = document.getElementById('jp-answer-input')
                  || document.getElementById('answer-input')
                  || $('textarea.jp-answer-input, textarea.perguntas-resposta');

    const aiResp = document.getElementById('jp-ai-response');

    if (!bloco || !pergunta) {
      log('Sem pergunta disponível, finalizando jornada.');
      finishAll();
      return;
    }

    if (aiResp) { aiResp.hidden = true; aiResp.textContent = ''; }
    if (textarea) { textarea.value = ''; textarea.focus(); }

    await typeQuestion(pergunta.label || '[pergunta]');
    updateCounters();

    if (window.JORNADA_CHAMA?.ensureHeroFlame) {
      window.JORNADA_CHAMA.ensureHeroFlame(SECTION_ID);
    }
  }

  // ── Avança para próxima pergunta / bloco ──────────────────────────────────────
  async function advanceNext() {
    if (completed) return;

    const { bloco } = getCurrent();

    // Salva resposta
    const textarea = document.getElementById('jp-answer-input')
                  || document.getElementById('answer-input')
                  || $('textarea.jp-answer-input');
    const resposta = textarea?.value?.trim() || '';

    const key = `jornada_answer_${State.blocoIdx}_${State.qIdx}`;
    localStorage.setItem(key, resposta);

    State.answers[key] = resposta;

    const questionsInBlock = bloco?.questions?.length || 1;
    const isLastQInBlock   = State.testMode ? true : (State.qIdx >= questionsInBlock - 1);
    const isLastBlock      = State.blocoIdx >= State.blocks.length - 1;

    if (!isLastQInBlock) {
      // Próxima pergunta do mesmo bloco
      State.qIdx++;
      State.globalIdx++;
      showCurrentQuestion();
      return;
    }

    if (isLastBlock) {
      // Última pergunta do último bloco → encerra
      finishAll();
      return;
    }

    // ── Fim do bloco atual → toca vídeo de transição → avança para próximo bloco ──
    const videoSrc = resolveVideoSrc(bloco?.video_after);
    log(`Fim do bloco ${State.blocoIdx + 1}, vídeo de transição:`, videoSrc);

    // Desabilita botão durante o vídeo
    const btnNext = document.getElementById('jp-btn-next') || document.getElementById('btn-next');
    if (btnNext) btnNext.disabled = true;

    runBlockTransition(videoSrc, () => {
      // Depois do vídeo, avança o bloco
      State.blocoIdx++;
      State.qIdx = 0;
      if (!State.testMode) State.globalIdx++;
      // Em modo teste globalIdx acompanha blocoIdx
      if (State.testMode) State.globalIdx = State.blocoIdx;

      if (btnNext) btnNext.disabled = false;
      showCurrentQuestion();
    });
  }

  // ── Finaliza jornada ──────────────────────────────────────────────────────────
  function finishAll() {
    if (completed) return;
    completed = true;

    log('Jornada concluída. Navegando para:', FINAL_SECTION_ID);
    document.dispatchEvent(new CustomEvent('qa:completed', { detail: State.answers }));

    const finalVideo = resolveVideoSrc(
      window.JORNADA_FINAL_VIDEO ||
      window.JORNADA_VIDEOS?.final ||
      '/assets/videos/filme-5-fim-da-jornada.mp4'
    );

    if (finalVideo && typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(finalVideo, FINAL_SECTION_ID);
    } else {
      if (window.JC?.show) window.JC.show(FINAL_SECTION_ID);
      else if (typeof window.showSection === 'function') window.showSection(FINAL_SECTION_ID);
      else window.location.hash = '#' + FINAL_SECTION_ID;
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────────
  async function bootstrapPerguntas() {
    if (State.mounted) {
      log('Bootstrap já executado, ignorando chamada duplicada.');
      return;
    }
    State.mounted = true;

    try {
      await ensureBlocks();

      if (!State.blocks.length) {
        err('Nenhum bloco disponível. Abortando.');
        return;
      }

      State.blocoIdx  = 0;
      State.qIdx      = 0;
      State.globalIdx = 0;
      completed       = false;
      State.startedAt = new Date().toISOString();

      bindButtons();
      showCurrentQuestion();
      log('Bootstrap concluído. Blocos:', State.blocks.length);
    } catch (e) {
      err('Erro no bootstrapPerguntas:', e);
      State.mounted = false; // permite retry
    }
  }

  // ── Bind botões de navegação ──────────────────────────────────────────────────
  function bindButtons() {
    // Delegation no document para pegar botões criados dinamicamente
    if (window.__PERGUNTAS_BUTTONS_BOUND__) return;
    window.__PERGUNTAS_BUTTONS_BOUND__ = true;

    document.addEventListener('click', function (e) {
      const btn = e.target.closest(
        '#jp-btn-next, #btn-next, .btn-confirm, [data-action="perguntas-next"]'
      );
      if (!btn) return;
      // Só age se estiver dentro da seção de perguntas
      if (!btn.closest('#section-perguntas')) return;

      e.preventDefault();
      e.stopPropagation();
      advanceNext();
    });

    log('Botões de navegação vinculados via delegation.');
  }

  // ── Listeners de ciclo de vida ────────────────────────────────────────────────

  // Quando a seção de perguntas é exibida
  document.addEventListener('JC.section:shown', function (ev) {
    if (!ev?.detail || ev.detail.id !== SECTION_ID) return;
    if (!State.mounted) bootstrapPerguntas();
  });

  // Fallback se o evento não vier
  window.addEventListener('load', function () {
    const sec = document.getElementById(SECTION_ID);
    if (sec && !sec.classList.contains('hidden')) {
      setTimeout(() => { if (!State.mounted) bootstrapPerguntas(); }, 300);
    }
  });

  // Quando blocos forem carregados dinamicamente pelo jornada-paper-qa.js
  document.addEventListener('jornada:blocks-ready', function () {
    if (!State.mounted) return; // bootstrap ainda não rodou, vai pegar no próprio fluxo
    // Se já estava montado mas sem blocos (caso de race condition), re-tenta
    if (!State.blocks.length) {
      State.mounted = false;
      bootstrapPerguntas();
    }
  });

  // ── Tema do guia ──────────────────────────────────────────────────────────────
  function applyGuiaTheme() {
    const guiaRaw = sessionStorage.getItem('jornada.guia');
    const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : 'default';
    document.body.setAttribute('data-guia', guia);

    const colorMap = {
      lumen:   '#00d4ff',
      zion:    '#ff3366',
      arian:   '#33ff99',
      default: '#ffd700'
    };
    const color = colorMap[guia] || colorMap.default;
    localStorage.setItem('JORNADA_GUIA_COLOR', color);
    log('Tema do guia aplicado:', guia, color);
  }

  // ── Patch de UI / Mimos ────────────────────────────────────────────────────────
  function waitForPerguntasSection(cb) {
    const el = document.getElementById(SECTION_ID);
    if (el) return cb(el);
    setTimeout(() => waitForPerguntasSection(cb), 60);
  }

  waitForPerguntasSection((rootSection) => {
    if (rootSection.dataset.mimosPatched === '1') return;
    rootSection.dataset.mimosPatched = '1';

    const elBlocoIndicador = rootSection.querySelector('[data-perguntas-bloco-indicador], .perg-bloco-indicador');
    const barraMacroFill   = rootSection.querySelector('.perg-progress-outer[data-kind="macro"] .perg-progress-fill');
    const barraMacroLabel  = rootSection.querySelector('.perguntas-progress-top, .perg-progress-top-label');
    const barraMicroFill   = rootSection.querySelector('.perg-progress-outer[data-kind="micro"] .perg-progress-fill');
    const barraMicroLabel  = rootSection.querySelector('.perguntas-progress-bottom, .perg-progress-bottom-label');
    const perguntaBox      = rootSection.querySelector('.perg-pergunta-titulo, .perguntas-pergunta-titulo');
    const btnTTS           = rootSection.querySelector('[data-action="tts"], .btn-tts, .btn-falar');

    function setProgress(fillEl, labelEl, atual, total) {
      if (!fillEl) return;
      const pct = Math.min(100, (Math.max(0, Number(atual)) / Math.max(1, Number(total))) * 100);
      fillEl.style.width = pct + '%';

      const guideColor = localStorage.getItem('JORNADA_GUIA_COLOR') || '#ffd700';
      fillEl.style.background  = `linear-gradient(to right, transparent, ${guideColor})`;
      fillEl.style.boxShadow   = `0 0 10px ${guideColor}`;
      if (labelEl) { labelEl.style.color = guideColor; labelEl.textContent = `${atual} / ${total}`; }
    }

    function updateGuiaColor() {
      const guia = (document.body.getAttribute('data-guia') || '').toLowerCase();
      if (!perguntaBox || !guia) return;
      perguntaBox.classList.remove('guia-lumen', 'guia-zion', 'guia-arian');
      if (guia === 'lumen') perguntaBox.classList.add('guia-lumen');
      if (guia === 'zion')  perguntaBox.classList.add('guia-zion');
      if (guia === 'arian') perguntaBox.classList.add('guia-arian');
    }

    function refreshUIFromState() {
      const S = window.PERGUNTAS_STATE || {};
      if (!S.blocks?.length) return;

      const blocoAtual     = S.blocoIdx ?? 0;
      const blocosTotal    = S.totalBlocks ?? 1;
      const perguntaIdx    = S.qIdx ?? 0;
      const questionsInBlk = S.testMode ? 1 : (S.blocks[blocoAtual]?.questions?.length ?? 1);
      const perguntaGlobal = S.testMode ? blocoAtual : (S.globalIdx ?? 0);
      const perguntasTotal = S.totalQuestions ?? 1;

      if (elBlocoIndicador) elBlocoIndicador.textContent = `${blocoAtual + 1} de ${blocosTotal}`;
      setProgress(barraMacroFill, barraMacroLabel, perguntaGlobal + 1, perguntasTotal);
      setProgress(barraMicroFill, barraMicroLabel, (S.testMode ? 1 : perguntaIdx + 1), questionsInBlk);
      updateGuiaColor();
    }

    if (btnTTS) {
      btnTTS.addEventListener('click', function (ev) {
        ev.preventDefault();
        try {
          const synth = window.speechSynthesis;
          if (!synth) { alert('Leitura em voz alta não disponível.'); return; }
          const perguntaEl = rootSection.querySelector('#jp-question-typed, .perguntas-pergunta-texto, .pergunta-texto');
          if (!perguntaEl) return;
          const text = perguntaEl.textContent.trim();
          if (!text) return;
          synth.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = document.documentElement.lang || 'pt-BR';
          synth.speak(utter);
        } catch (e) { err('[TTS]', e); }
      });
    }
        // BOTÕES — Falar / Apagar / Confirmar
    const btnApagar =
      rootSection.querySelector('[data-action="clear"], .btn-apagar, #jp-btn-apagar');

    const btnConfirmar =
      rootSection.querySelector('[data-action="confirm"], .btn-confirmar, .btn-confirm, #jp-btn-confirmar');

    function clearAnswer() {
      const textarea = $('#jp-answer-input');
      const aiResp = $('#jp-ai-response');

      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }

      if (aiResp) {
        aiResp.hidden = true;
        aiResp.textContent = '';
      }
    }

    function goToFinalSection() {
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(FINAL_VIDEO_FALLBACK, FINAL_SECTION_ID);
        return;
      }

      if (window.JC && typeof window.JC.show === 'function') {
        window.JC.show(FINAL_SECTION_ID);
        return;
      }

      const finalEl = document.getElementById(FINAL_SECTION_ID);
      if (finalEl) {
        document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
        finalEl.classList.remove('hidden');
      }
    }

    function advancePergunta() {
      if (completed) return;

      const textarea = $('#jp-answer-input');
      const resposta = textarea ? String(textarea.value || '').trim() : '';

      if (!resposta) {
        if (typeof window.toast === 'function') {
          window.toast('Escreva sua resposta antes de continuar.');
        } else {
          alert('Escreva sua resposta antes de continuar.');
        }
        textarea?.focus();
        return;
      }

      const current = getCurrent();
      const nextBlockIndex = State.blocoIdx + 1;
      const hasNextBlock = nextBlockIndex < State.totalBlocks;

      // modo teste: 1 pergunta por bloco
      State.globalIdx = Math.min(State.totalQuestions - 1, State.blocoIdx);

      if (hasNextBlock) {
        const onDone = () => {
          State.blocoIdx = nextBlockIndex;
          State.qIdx = 0;
          State.globalIdx = State.blocoIdx;

          document.dispatchEvent(new CustomEvent('perguntas:state-changed'));
          updateCounters();
          showCurrentQuestion();
        };

        if (typeof window.playBlockTransition === 'function') {
          window.playBlockTransition(
            current.bloco?.transitionVideo || current.bloco?.video_after || FINAL_VIDEO_FALLBACK,
            onDone
          );
        } else {
          onDone();
        }
        return;
      }

      // último bloco -> final
      completed = true;
      document.dispatchEvent(new CustomEvent('perguntas:state-changed'));
      goToFinalSection();
    }

    if (btnApagar && !btnApagar.dataset.boundPerguntas) {
      btnApagar.dataset.boundPerguntas = '1';
      btnApagar.addEventListener('click', function (ev) {
        ev.preventDefault();
        clearAnswer();
      });
    }

    if (btnConfirmar && !btnConfirmar.dataset.boundPerguntas) {
      btnConfirmar.dataset.boundPerguntas = '1';
      btnConfirmar.addEventListener('click', function (ev) {
        ev.preventDefault();
        advancePergunta();
      });
    }

    // ── MIC delegation ───────────────────────────────────────────────────────
    (function micDelegationRobusta() {
      if (window.__MIC_DELEGATION_BOUND__) return;
      window.__MIC_DELEGATION_BOUND__ = true;

      const MIC_SELECTOR = '.btn-mic, .mic-btn, [data-mic], [data-action="mic"], [aria-label*="microfone"], [title*="microfone"]';

      function startMicStable() {
        if (window.__MIC_START_LOCK__) return;
        window.__MIC_START_LOCK__ = true;
        setTimeout(() => (window.__MIC_START_LOCK__ = false), 450);

        try {
          if (typeof window.startMic === 'function') return window.startMic();
          if (typeof window.initSpeechRecognition === 'function') return window.initSpeechRecognition();

          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SR) { warn('[MIC] SpeechRecognition não suportado.'); return; }

          if (!window.__REC__) {
            const rec = new SR();
            rec.lang = document.documentElement.lang || 'pt-BR';
            rec.continuous = false;
            rec.interimResults = true;
            rec.onend  = () => { window.__REC_RUNNING__ = false; };
            rec.onerror = (e) => { window.__REC_RUNNING__ = false; warn('[MIC] onerror', e); };
            window.__REC__ = rec;
          }

          if (window.__REC__ && window.__REC_RUNNING__) {
            try { window.__REC__.stop(); } catch {}
            window.__REC_RUNNING__ = false;
          }

          window.__REC_RUNNING__ = true;
          clearTimeout(window.__REC_FAILSAFE_T__);
          window.__REC_FAILSAFE_T__ = setTimeout(() => {
            if (window.__REC_RUNNING__) {
              try { window.__REC__.stop(); } catch {}
              window.__REC_RUNNING__ = false;
            }
          }, 9000);
          window.__REC__.start();
        } catch (e) {
          window.__REC_RUNNING__ = false;
          err('[MIC] erro ao iniciar', e);
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
      document.addEventListener('touchstart',  handler, { capture: true, passive: false });
      document.addEventListener('click',       handler, { capture: true, passive: false });
    })();

    // Hooks de atualização de UI
    document.addEventListener('perguntas:state-changed', refreshUIFromState);
    document.addEventListener('JC.perguntas:next',       refreshUIFromState);
    document.addEventListener('JC.section:shown', function (ev) {
      if (ev?.detail?.id === SECTION_ID) refreshUIFromState();
    });
    window.addEventListener('load', () => setTimeout(refreshUIFromState, 400));

    log('Patch de mimos inicializado.');
  });

  log(MOD, 'carregado');
})();
