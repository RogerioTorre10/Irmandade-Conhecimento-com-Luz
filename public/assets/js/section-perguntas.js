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
// OVERLAY DE VÍDEO (TRANSIÇÕES) — BLINDADO
// - Não mexe em display de outras seções (evita “pedaço da tela anterior”)
// - Sempre FULLSCREEN real (fixed + 100vw/100vh + cover)
// - Trava scroll do ROOT (html/body) e preserva posição
// - Cleanup com 2 frames (evita flash no fim)
// --------------------------------------------------

function ensureVideoOverlay() {
  let overlay = document.getElementById('videoOverlay');
  let video = document.getElementById('videoTransicao');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'videoOverlay';
    overlay.className = 'video-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  if (!video) {
    video = document.createElement('video');
    video.id = 'videoTransicao';
    overlay.appendChild(video);
  }

  // Garantias mínimas (sem depender de CSS externo)
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('width', '100vw', 'important');
  overlay.style.setProperty('height', '100vh', 'important');
  overlay.style.setProperty('z-index', '2147483646', 'important');
  overlay.style.setProperty('background', 'rgba(0,0,0,0.98)', 'important');
  overlay.style.setProperty('display', 'block', 'important');
  overlay.style.setProperty('opacity', '0', 'important');
  overlay.style.setProperty('visibility', 'hidden', 'important');
  overlay.style.setProperty('pointer-events', 'none', 'important');

  video.style.setProperty('position', 'fixed', 'important');
  video.style.setProperty('inset', '0', 'important');
  video.style.setProperty('width', '100vw', 'important');
  video.style.setProperty('height', '100vh', 'important');
  video.style.setProperty('object-fit', 'cover', 'important');
  video.style.setProperty('object-position', 'center', 'important');
  video.style.setProperty('display', 'block', 'important');
  video.style.setProperty('background', '#000', 'important');

  return { overlay, video };
}

function resolveVideoSrc(src) {
  if (!src) return '';
  // já absoluto
  if (/^https?:\/\//i.test(src)) return src;

  // garante base correta (Render Static)
  const clean = String(src).trim().replace(/^\/+/, '');
  return '/' + clean;
}

// usa o portal dourado FULL + limelight (sem “sumir DOM”)
function playVideoWithCallback(src, onEnded) {
  src = resolveVideoSrc(src);
  if (!src) { if (typeof onEnded === 'function') onEnded(); return; }

  const { overlay, video } = ensureVideoOverlay();

  // sempre no body (evita ficar preso em containers)
  if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
  
  (() => {
  const o = document.getElementById('videoOverlay');
  if (!o) return;
  o.classList.remove('is-on'); // garante OFF
 })();
  

  // helper: aplica CSS com IMPORTANT de verdade
  const S = (el, prop, val) => el.style.setProperty(prop, val, 'important');

  // classes de blindagem (anti-transform / modo transição)
  document.documentElement.classList.add('vt-force-fixed');
  document.body.classList.add('vt-force-fixed', 'is-transitioning');

  // ============================
  // Ao ligar (antes de dar play):
  // ============================
  overlay.classList.add('is-on');
  S(overlay, 'pointer-events', 'auto');
  S(overlay, 'visibility', 'visible');
  S(overlay, 'opacity', '1');

  // --- TRAVA SCROLL DO ROOT (sem gambi “display:none”) ---
  const scrollY = window.scrollY || window.pageYOffset || 0;

  const prev = {
    htmlOverflow: document.documentElement.style.overflow,
    htmlHeight: document.documentElement.style.height,

    bodyOverflow: document.body.style.overflow,
    bodyPosition: document.body.style.position,
    bodyTop: document.body.style.top,
    bodyWidth: document.body.style.width,
    bodyHeight: document.body.style.height
  };

  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.height = '100%';

  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.height = '100%';

  // play
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;

    video.onended = null;
    video.onerror = null;

    try { video.pause(); } catch {}
    try {
      video.removeAttribute('src');
      video.load();
    } catch {}

    // 1) libera scroll primeiro (evita “segurar repaint”)
    document.body.style.position = prev.bodyPosition || '';
    document.body.style.top = prev.bodyTop || '';
    document.body.style.width = prev.bodyWidth || '';
    document.body.style.height = prev.bodyHeight || '';
    document.body.style.overflow = prev.bodyOverflow || '';

    document.documentElement.style.overflow = prev.htmlOverflow || '';
    document.documentElement.style.height = prev.htmlHeight || '';

    // volta ao ponto exato do scroll
    window.scrollTo(0, scrollY);

    // 2) espera 2 frames para browser pintar a tela seguinte, aí “some” overlay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove('is-on');
        S(overlay, 'pointer-events', 'none');
        S(overlay, 'opacity', '0');
        S(overlay, 'visibility', 'hidden');

        document.documentElement.classList.remove('vt-force-fixed');
        document.body.classList.remove('vt-force-fixed', 'is-transitioning');

        if (typeof onEnded === 'function') onEnded();
      });
    });
  };

  video.onended = cleanup;
  video.onerror = cleanup;

  // força fullscreen real (caso CSS externo tente interferir)
  S(overlay, 'position', 'fixed');
  S(overlay, 'inset', '0');
  S(overlay, 'width', '100vw');
  S(overlay, 'height', '100vh');
  S(overlay, 'display', 'block');
  S(overlay, 'z-index', '2147483646');

  S(video, 'position', 'fixed');
  S(video, 'inset', '0');
  S(video, 'width', '100vw');
  S(video, 'height', '100vh');
  S(video, 'object-fit', 'cover');
  S(video, 'object-position', 'center');
  S(video, 'display', 'block');

  // carrega e toca
  try {
    video.currentTime = 0;
  } catch {}

  video.src = src;
  video.load();

  const p = video.play();
  if (p && typeof p.catch === 'function') p.catch(cleanup);
}

// Transição entre blocos: usa a função acima
function playBlockTransition(videoSrc, done) {
  playVideoWithCallback(videoSrc, done);
}

// Exporta / instala globalmente (sem quebrar se a propriedade estiver travada)
try {
  window.ensureVideoOverlay = ensureVideoOverlay;
  window.resolveVideoSrc = resolveVideoSrc;
  window.playVideoWithCallback = playVideoWithCallback;

  const d = Object.getOwnPropertyDescriptor(window, 'playBlockTransition');
  const canSet = !d || d.writable || d.configurable;

  if (canSet) window.playBlockTransition = playBlockTransition;
} catch (e) {
  // silencioso: se estiver travado, mantém o existente
}

if (typeof window.playBlockTransition !== 'function') {
  window.playBlockTransition = playBlockTransition;
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

      // barra prateada
      const fillPerg = document.querySelector('#progress-question-fill');
      if (fillPerg) {
        fillPerg.style.width = pctPerguntas + '%';
      }
    }

    // ---------- TOTAL GERAL (Ampulheta: 1 a 50) ----------
    if (State.totalQuestions > 0) {
      const globalAtual = State.globalIdx + 1;
      setText('#progress-total-value', `${globalAtual} / ${State.totalQuestions}`);
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
  
  (function () {
    try {
    const labelEl = document.querySelector('.jp-block-label');
    if (!labelEl) return;

    // tenta descobrir o bloco atual (ex.: "2 de 5")
    const counterEl = document.querySelector('.jp-block-counter');
    let current = 1;
    if (counterEl) {
      const m = counterEl.textContent.match(/(\d+)/);
      if (m) current = parseInt(m[1], 10) || 1;
    }

    const nomes = {
      1: 'O CAMINHO',
      2: 'A VERDADE',
      3: 'A VIDA',
      4: 'A MISSÃO',
      5: 'A ALIANÇA'
    };

    const titulo = nomes[current] || 'O CAMINHO';
    labelEl.textContent = `BLOCO ${current}: ${titulo}`;
  } catch (e) {
    console.warn('[PERGUNTAS][BLOCO] Não foi possível ajustar o título dinâmico:', e);
  }
})();  

  log(MOD, 'carregado');
})();
