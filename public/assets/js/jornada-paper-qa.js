'use strict';

if (window.jornadaPaperQALoaded) {
  console.log('[JORNADA_PAPER] Script já carregado, ignorando...');
} else {
  window.jornadaPaperQALoaded = true;
    
  const log = (...args) => console.log('[JORNADA_PAPER]', ...args);

  const CFG = Object.assign({
    CANVAS_ID: 'jornada-canvas',
    CONTENT_ID: 'jornada-conteudo',
    PERGAMINHO_VERT: '/assets/img/pergaminho-rasgado-vert.png',
    PERGAMINHO_HORIZ: '/assets/img/pergaminho-rasgado-horiz.png',
    VIDEO_BASE: '/assets/img/'
  }, window.JORNADA_CFG || {});

  const VIDEO_BASE = CFG.VIDEO_BASE;
  window.JORNADA_VIDEOS = {
    intro: VIDEO_BASE + 'filme-0-ao-encontro-da-jornada.mp4',
    afterBlocks: {
      0: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      1: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      2: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      3: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    final: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
  };
  window.JORNADA_FINAL_VIDEO = window.JORNADA_VIDEOS.final;

  const blockTranslations = {
    'pt-BR': [
       {
      id: 'raizes',
      title: 'Block 1 — Roots',
      data_i18n: 'bloco_raizes_title',
      questions: [
        { id: 'quem_voce_hoje', label: 'Who are you today?', data_i18n: 'pergunta_quem_voce_hoje' },
        { id: 'o_que_te_trouxe', label: 'What brought you to this journey?', data_i18n: 'pergunta_o_que_te_trouxe' },
        { id: 'sonho_espiritual', label: 'What is your greatest spiritual dream?', data_i18n: 'pergunta_sonho_espiritual' }
      ],
      video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
    },
    {
      id: 'reflexoes',
      title: 'Block 2 — Reflections',
      data_i18n: 'bloco_reflexoes_title',
      questions: [
        { id: 'desafios_atuais', label: 'What are your biggest current challenges?', data_i18n: 'pergunta_desafios_atuais' },
        { id: 'medo_duvida', label: 'How do you deal with fear or doubt?', data_i18n: 'pergunta_medo_duvida' },
        { id: 'significado_luz', label: 'What does "light" mean to you?', data_i18n: 'pergunta_significado_luz' }
      ],
      video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
    },
    {
      id: 'crescimento',
      title: 'Block 3 — Growth',
      data_i18n: 'bloco_crescimento_title',
      questions: [
        { id: 'mudar_vida', label: 'What do you want to change in your life?', data_i18n: 'pergunta_mudar_vida' },
        { id: 'quem_inspira', label: 'Who inspires you and why?', data_i18n: 'pergunta_quem_inspira' },
        { id: 'pratica_gratidao', label: 'How do you practice gratitude daily?', data_i18n: 'pergunta_pratica_gratidao' }
      ],
      video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
    },
    {
      id: 'integracao',
      title: 'Block 4 — Integration',
      data_i18n: 'bloco_integracao_title',
      questions: [
        { id: 'licao_jornada', label: 'What lesson do you take from this journey?', data_i18n: 'pergunta_licao_jornada' },
        { id: 'aplicar_futuro', label: 'How will you apply this in the future?', data_i18n: 'pergunta_aplicar_futuro' },
        { id: 'mensagem_futuro', label: 'A message for your future self.', data_i18n: 'pergunta_mensagem_futuro' }
      ],
      video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    {
      id: 'sintese',
      title: 'Block 5 — Synthesis and Delivery',
      data_i18n: 'bloco_sintese_title',
      questions: [
        { id: 'essencia_hoje', label: 'Who are you today, in one true sentence?', data_i18n: 'pergunta_essencia_hoje' },
        { id: 'passo_fe', label: 'What will be your next step of faith and courage?', data_i18n: 'pergunta_passo_fe' }
      ],
      video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
    }
  ],
  'es-ES': [
    {
      id: 'raizes',
      title: 'Bloque 1 — Raíces',
      data_i18n: 'bloco_raizes_title',
      questions: [
        { id: 'quem_voce_hoje', label: '¿Quién eres hoy?', data_i18n: 'pergunta_quem_voce_hoje' },
        { id: 'o_que_te_trouxe', label: '¿Qué te trajo a este viaje?', data_i18n: 'pergunta_o_que_te_trouxe' },
        { id: 'sonho_espiritual', label: '¿Cuál es tu mayor sueño espiritual?', data_i18n: 'pergunta_sonho_espiritual' }
      ],
      video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
    },
    {
      id: 'reflexoes',
      title: 'Bloque 2 — Reflexiones',
      data_i18n: 'bloco_reflexoes_title',
      questions: [
        { id: 'desafios_atuais', label: '¿Cuáles son tus mayores desafíos actuales?', data_i18n: 'pergunta_desafios_atuais' },
        { id: 'medo_duvida', label: '¿Cómo lidias con el miedo o la duda?', data_i18n: 'pergunta_medo_duvida' },
        { id: 'significado_luz', label: '¿Qué significa la "luz" para ti?', data_i18n: 'pergunta_significado_luz' }
      ],
      video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
    },
    {
      id: 'crescimento',
      title: 'Bloque 3 — Crecimiento',
      data_i18n: 'bloco_crescimento_title',
      questions: [
        { id: 'mudar_vida', label: '¿Qué quieres cambiar en tu vida?', data_i18n: 'pergunta_mudar_vida' },
        { id: 'quem_inspira', label: '¿Quién te inspira y por qué?', data_i18n: 'pergunta_quem_inspira' },
        { id: 'pratica_gratidao', label: '¿Cómo practicas la gratitud a diario?', data_i18n: 'pergunta_pratica_gratidao' }
      ],
      video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
    },
    {
      id: 'integracao',
      title: 'Bloque 4 — Integración',
      data_i18n: 'bloco_integracao_title',
      questions: [
        { id: 'licao_jornada', label: '¿Qué lección te llevas de este viaje?', data_i18n: 'pergunta_licao_jornada' },
        { id: 'aplicar_futuro', label: '¿Cómo aplicarás esto en el futuro?', data_i18n: 'pergunta_aplicar_futuro' },
        { id: 'mensagem_futuro', label: 'Un mensaje para tu yo futuro.', data_i18n: 'pergunta_mensagem_futuro' }
      ],
      video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    {
      id: 'sintese',
      title: 'Bloque 5 — Síntesis y Entrega',
      data_i18n: 'bloco_sintese_title',
      questions: [
        { id: 'essencia_hoje', label: '¿Quién eres hoy, en una frase verdadera?', data_i18n: 'pergunta_essencia_hoje' },
        { id: 'passo_fe', label: '¿Cuál será tu próximo paso de fe y coraje?', data_i18n: 'pergunta_passo_fe' }
      ],
      video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
    }
  ]
};

  let JORNADA_BLOCKS = [];

  function elCanvas() {
    return document.getElementById(CFG.CANVAS_ID);
  }

  function elContent() {
    return document.getElementById(CFG.CONTENT_ID);
  }

  function ensureCanvas() {
    let root = elCanvas();
    if (!root) {
      root = document.createElement('section');
      root.id = CFG.CANVAS_ID;
      root.className = 'card pergaminho';
      document.body.appendChild(root);
    }
    let content = elContent();
    if (!content) {
      content = document.createElement('div');
      content.id = CFG.CONTENT_ID;
      content.className = 'conteudo-pergaminho';
      root.appendChild(content);
    }
    log('Canvas garantido:', { root, content });
    return { root, content };
  }

  function setPergaminho(mode = 'h') {
    const { root } = ensureCanvas();
    root.classList.remove('pergaminho-v', 'pergaminho-h');
    const isV = mode === 'v';
    root.classList.add(isV ? 'pergaminho-v' : 'pergaminho-h');
    const imageUrl = isV ? CFG.PERGAMINHO_VERT : CFG.PERGAMINHO_HORIZ;
    root.style.backgroundImage = `url("${imageUrl}")`;
    root.style.backgroundRepeat = 'no-repeat';
    root.style.backgroundPosition = 'center';
    root.style.backgroundSize = 'cover';
    root.style.minHeight = '82vh';
    log('Pergaminho aplicado:', { mode, imageUrl });
  }

  function buildForm(questions = []) {
    return `
      <form id="form-perguntas" class="grid gap-3">
        ${questions.map(q => `
          <label class="grid gap-1">
            <span class="font-medium pergunta-enunciado text" data-i18n="${q.data_i18n}" data-typing="true" data-speed="36" data-cursor="true">${q.label}</span>
            <textarea name="${q.id}" class="px-3 py-2 rounded border border-gray-300 bg-white/80" data-i18n-placeholder="resposta_placeholder" placeholder="Digite sua resposta..."></textarea>
          </label>
        `).join('')}
      </form>
    `;
  }

  async function loadDynamicBlocks() {
    try {
      await i18n.waitForReady(10000);
      if (!i18n.ready) throw new Error('i18n não inicializado');

      const lang = i18n.lang || 'pt-BR';
      window.JORNADA_BLOCKS = blockTranslations[lang].map(block => ({
        id: block.id,
        title: block.title,
        data_i18n: block.data_i18n,
        questions: block.questions,
        video_after: block.video_after,
        tipo: 'perguntas'
      }));

      log('JORNADA_BLOCKS preenchido:', window.JORNADA_BLOCKS);
      return true;
    } catch (error) {
      console.error('[JORNADA_PAPER] Erro ao preencher JORNADA_BLOCKS:', error);
      window.JORNADA_BLOCKS = [];
      window.toast && window.toast('Erro ao carregar blocos de perguntas');
      return false;
    }
  }

  async function renderQuestions() {
    setPergaminho('h');
    const { content } = ensureCanvas();
    if (!content) {
      console.error('[JORNADA_PAPER] Container de perguntas não encontrado');
      window.toast && window.toast('Erro ao carregar perguntas.');
      return;
    }

    if (!JORNADA_BLOCKS || !Array.isArray(JORNADA_BLOCKS)) {
      console.error('[JORNADA_PAPER] JORNADA_BLOCKS não está definido ou não é um array');
      window.toast && window.toast('Erro ao carregar blocos de perguntas.');
      return;
    }

    content.innerHTML = '';
    content.classList.remove('hidden');
    JORNADA_BLOCKS.forEach((block, bIdx) => {
      const bloco = document.createElement('div');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = bIdx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = bIdx === window.JC.currentBloco ? 'block' : 'none';

      if (block.title) {
        const title = document.createElement('h3');
        title.className = 'pergunta-enunciado text';
        title.dataset.i18n = block.data_i18n;
        title.dataset.typing = 'true';
        title.dataset.speed = '36';
        title.dataset.cursor = 'true';
        title.textContent = block.title;
        bloco.appendChild(title);
      }

      block.questions.forEach((q, qIdx) => {
        const div = document.createElement('div');
        div.className = 'j-pergunta';
        div.dataset.perguntaId = `${block.id}-${qIdx}`;
        div.style.display = bIdx === window.JC.currentBloco && qIdx === window.JC.currentPergunta ? 'block' : 'none';
        div.innerHTML = `
          <label class="pergunta-enunciado text" data-i18n="${q.data_i18n}" data-typing="true" data-speed="36" data-cursor="true">${q.label}</label>
          <textarea rows="4" class="input" data-i18n-placeholder="resposta_placeholder" placeholder="Digite sua resposta..."></textarea>
          <div class="accessibility-controls">
            <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
            <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
            <button class="btn btn-avancar" data-action="read-question" data-question-id="${block.id}-${qIdx}" data-i18n="btn-avancar">Avançar</button>
          </div>
        `;
        bloco.appendChild(div);
      });

      content.appendChild(bloco);
    });

    if (i18n.ready) {
      i18n.apply(content);
    } else {
      console.warn('[JORNADA_PAPER] i18n não pronto, pulando i18n.apply');
    }

    const currentBloco = content.querySelector(`[data-bloco="${window.JC.currentBloco}"]`);
    if (currentBloco) {
      currentBloco.style.display = 'block';
      const currentPergunta = currentBloco.querySelector(`[data-perguntaId="${window.JC.currentBloco}-${window.JC.currentPergunta}"]`);
      if (currentPergunta) {
        currentPergunta.style.display = 'block';
        currentPergunta.classList.add('active');
        setTimeout(() => {
          log('Iniciando typeQuestionsSequentially para bloco', window.JC.currentBloco);
          typeQuestionsSequentially(currentBloco);
          if (window.TypingBridge) {
            window.TypingBridge.play('.text', () => console.log('[JORNADA_PAPER] Animação de digitação concluída'));
          }
        }, 100);
      }
    }

    log('Perguntas renderizadas, total de blocos:', JORNADA_BLOCKS.length);
  }

  function loadVideo(videoSrc) {
    const video = document.querySelector('#videoTransicao');
    const videoOverlay = document.querySelector('#videoOverlay');
    if (!video || !videoOverlay) {
      console.error('[JORNADA_PAPER] #videoTransicao ou #videoOverlay não encontrado');
      return;
    }
    video.src = videoSrc;
    video.style.zIndex = 2001;
    videoOverlay.style.zIndex = 2000;
    video.load();
    video.play().catch(err => console.error('[JORNADA_PAPER] Erro ao reproduzir vídeo:', err));
    log('Vídeo carregado:', videoSrc);
  }

  let __abortTypingPlaceholder = null;

  async function typePlaceholder(inp, text, speed = 22) {
    if (!inp) return;
    if (__abortTypingPlaceholder) __abortTypingPlaceholder();
    let abort = false;
    __abortTypingPlaceholder = () => (abort = true);
    inp.placeholder = '';
    const aria = document.getElementById('aria-pergunta');
    if (aria) aria.textContent = text;
    for (let i = 0; i <= text.length; i++) {
      if (abort) break;
      inp.placeholder = text.slice(0, i) + (i < text.length ? '▌' : '');
      await new Promise(r => setTimeout(r, speed));
    }
    if (!abort) {
      inp.placeholder = text;
    }
    if (aria) {
      aria.textContent = '';
    }
    log('Placeholder digitado:', text);
  }

  async function typeQuestionsSequentially(bloco) {
    const elements = bloco.querySelectorAll('[data-typing="true"]');
    for (const el of elements) {
      const key = el.dataset.i18n;
      const text = i18n.t(key, el.textContent || key);
      await typeText(el, text, parseInt(el.dataset.speed) || 36);
    }
    const textareas = bloco.querySelectorAll('.j-pergunta textarea');
    for (const textarea of textareas) {
      const key = textarea.dataset.i18nPlaceholder;
      const text = i18n.t(key, textarea.placeholder || key);
      await typePlaceholder(textarea, text, 22);
    }
  }

  async function typeText(element, text, speed = 36) {
    return new Promise(resolve => {
      let i = 0;
      element.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'typing-caret';
      caret.textContent = '|';
      element.appendChild(caret);

      const interval = setInterval(() => {
        element.textContent = text.slice(0, i);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          caret.remove();
          element.classList.add('typing-done');
          resolve();
        }
      }, speed);
    });
  }

  function initPaperQAEvents() {
    document.querySelectorAll('[data-action="read-question"]').forEach(button => {
      button.addEventListener('click', () => {
        const pergunta = button.closest('.j-pergunta').querySelector('[data-i18n]');
        const key = pergunta.dataset.i18n;
        const text = i18n.t(key, pergunta.textContent);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = i18n.lang || 'pt-BR';
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('[JORNADA_PAPER] SpeechSynthesis não suportado');
        }
      });
    });

    document.querySelectorAll('[data-action="start-mic"]').forEach(button => {
      button.addEventListener('click', () => {
        log('Microfone acionado (funcionalidade não implementada)');
        window.toast && window.toast('Microfone não implementado ainda.');
      });
    });

    const skipVideoButton = document.querySelector('#skipVideo');
    if (skipVideoButton) {
      skipVideoButton.addEventListener('click', () => {
        log('Vídeo pulado');
        document.dispatchEvent(new CustomEvent('videoSkipped'));
      });
    }
  }

  async function initPaperQA() {
    try {
      await loadDynamicBlocks();
      console.log('[JORNADA_PAPER] Inicializado com sucesso');
    } catch (error) {
      console.error('[JORNADA_PAPER] Erro na inicialização:', error.message);
      window.JORNADA_BLOCKS = [];
    }
  }

  document.addEventListener('DOMContentLoaded', initPaperQA);
  document.addEventListener('change', (e) => {
    if (e.target.id === 'language-select') {
      i18n.setLang(e.target.value).then(() => {
        loadDynamicBlocks();
        renderQuestions();
        log('Idioma alterado, blocos recarregados');
      });
    }
  });

  log('JORNADA_BLOCKS preenchido:', window.JORNADA_BLOCKS);

 export function loadDynamicBlocks() { /* ... */ }
export function renderQuestions() { /* ... */ }
export function loadVideo() { /* ... */ }
export function setPergaminho() { /* ... */ }
export function ensureCanvas() { /* ... */ }
export function typeQuestionsSequentially() { /* ... */ }
export function typePlaceholder() { /* ... */ }

log('Script jornada-paper-qa.js carregado com sucesso');
