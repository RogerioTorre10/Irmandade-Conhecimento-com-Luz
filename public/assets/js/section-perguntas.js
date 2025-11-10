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
  // OVERLAY DE VÍDEO (entre blocos e final)
  // --------------------------------------------------

 function ensureVideoOverlay() {
  let overlay = document.getElementById('videoOverlay');
  let video = document.getElementById('videoTransicao');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'videoOverlay';
    document.body.appendChild(overlay);
  }

  if (!video) {
    video = document.createElement('video');
    video.id = 'videoTransicao';
    video.playsInline = true;
    video.preload = 'auto';
    video.controls = false;
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
  if (!src) {
    if (typeof onEnded === 'function') onEnded();
    return;
  }

  const { overlay, video } = ensureVideoOverlay();

  // FORÇA ESTILO INLINE (ignora tudo)
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    width: 100vw !important; height: 100vh !important;
    background: rgba(0,0,0,0.98) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    transition: opacity 0.6s ease !important;
  `;

  video.style.cssText = `
  width: 94vw !important;
  height: auto !important;
  max-width: 94vw !important;
  max-height: 90vh !important;
  border: 8px solid #d4af37 !important;
  border-radius: 12px !important;
  box-shadow: 0 0 30px rgba(212,175,55,0.7) !important;
  object-fit: contain !important;
`;

  // Remove qualquer outro conteúdo visível
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('section, div, header, footer').forEach(el => {
    if (el.id !== 'videoOverlay') {
      el.style.display = 'none';
    }
  });

  // Mostra overlay
  overlay.style.display = 'flex';
  overlay.style.pointerEvents = 'all';

  // Força render antes de opacity
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  video.src = src;
  video.load();

  const endHandler = () => {
    video.onended = null;
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      // Restaura visibilidade
      document.body.style.overflow = '';
      document.querySelectorAll('section, div, header, footer').forEach(el => {
        if (el.id !== 'videoOverlay') {
          el.style.display = '';
        }
      });
      if (typeof onEnded === 'function') onEnded();
    }, 600);
  };

  video.onended = endHandler;

  video.play().catch(e => {
    console.error('[PERGUNTAS] Erro ao tocar vídeo:', e);
    endHandler();
  });
}

  window.playBlockTransition = function(videoSrc, onDone) {
    const src = resolveVideoSrc(videoSrc);
    if (!src) {
      if (typeof onDone === 'function') onDone();
      return;
    }
    log('Transição entre blocos:', src);
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
    const { bloco } = getCurrent();
    const blocoTotal = bloco?.questions?.length || 1;

    // ---------- BLOCO (Régua superior: 1 a 5) ----------
    if (State.totalBlocks > 0) {
      const blocoAtual = State.blocoIdx + 1;
      const pctBlocos = Math.max(0, Math.min(100,
        (blocoAtual / State.totalBlocks) * 100
      ));

      // texto "X de Y"
      setText('#progress-block-value', `${blocoAtual} de ${State.totalBlocks}`);
      setWidth('#progress-block-fill', pctBlocos + '%');
      // barra dourada
      const fillBloco = document.querySelector('#progress-block-fill');
      if (fillBloco) {
        fillBloco.style.width = pctBlocos + '%';
      }
    }

    // ---------- PERGUNTA DO BLOCO (Régua do meio: 1 a 10) ----------
    {
      const perguntaAtual = State.qIdx + 1;
      const pctPerguntas = Math.max(0, Math.min(100,
        (perguntaAtual / blocoTotal) * 100
      ));

      // texto "X / Y"
      setText('#progress-question-value', `${perguntaAtual} / ${blocoTotal}`);
      setWidth('#progress-question-fill', pctPerguntas + '%');
      // barra prateada
      const fillPerg = document.querySelector('#progress-question-fill');
      if (fillPerg) {
        fillPerg.style.width = pctPerguntas + '%';
      }
    }

    // ---------- TOTAL GERAL (Ampulheta: 1 a 50) ----------
    if (State.totalQuestions > 0) {
      const globalAtual = State.globalIdx + 1;
      setText('#progress-total-value', `${globalAtual} / ${State.totalQuestions}`);    }
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

  function ensureFinalSectionExists() {
    let finalEl = document.getElementById(FINAL_SECTION_ID);

    if (finalEl) {
      log('section-final já existe, usando versão existente.');
      return finalEl;
    }

    // Cria a seção final com o mesmo layout da section-final.html
    finalEl = document.createElement('section');
    finalEl.id = FINAL_SECTION_ID;
    finalEl.className = 'section section-final';
    finalEl.dataset.section = 'final';

    finalEl.innerHTML = `
      <div class="final-pergaminho-wrapper">
        <div class="pergaminho-vertical">
          <div class="pergaminho-content">

            <h1 id="final-title" class="final-title"></h1>

            <div id="final-message" class="final-message">
              <p>Suas respostas foram recebidas com honra pela Irmandade.</p>
              <p>Você plantou sementes de confiança, coragem e luz.</p>
              <p>Continue caminhando. A jornada nunca termina.</p>
              <p>Volte quando precisar reacender a chama.</p>
              <p class="final-bold">Você é a luz. Você é a mudança.</p>
            </div>

            <div class="final-acoes">
              <button id="btnBaixarPDFHQ" class="btn btn-gold" disabled>Baixar PDF e HQ</button>
              <button id="btnVoltarInicio" class="btn btn-light">Voltar ao Início</button>
            </div>

          </div>
        </div>
      </div>

      <video id="final-video" playsinline preload="auto" style="display:none;"></video>
    `;

    const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
    wrapper.appendChild(finalEl);

    log('section-final criada com HTML completo (fallback FINAL).');
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

  // MICROFONE
  if (btnFalar && input && window.JORNADA_MICRO) {
    btnFalar.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      window.JORNADA_MICRO.attach(input, { mode: 'append' });
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
  if (input && window.JORNADA_MICRO) {
    window.JORNADA_MICRO.attach(input, { mode: 'append' });
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
