/* jornada-paper-qa.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.jornadaPaperQALoaded) {
    console.log('[JORNADA_PAPER] Script já carregado, ignorando...');
    return;
  }
  global.jornadaPaperQALoaded = true;

  const log = (...args) => console.log('[JORNADA_PAPER]', ...args);

  // Usa o i18n global se existir; senão, cria um stub seguro
  const i18n = global.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (_, fallback) => fallback || _,
    apply: () => {},
    waitForReady: async () => {}
  };

  const CFG = Object.assign({
    CANVAS_ID: 'jornada-canvas',
    CONTENT_ID: 'jornada-conteudo',
    PERGAMINHO_VERT: '/assets/img/pergaminho-rasgado-vert.png',
    PERGAMINHO_HORIZ: '/assets/img/pergaminho-rasgado-horiz.png',
    VIDEO_BASE: '/assets/img/'
  }, global.JORNADA_CFG || {});

  const VIDEO_BASE = CFG.VIDEO_BASE;

  global.JORNADA_VIDEOS = {
    intro: VIDEO_BASE + 'filme-0-ao-encontro-da-jornada.mp4',
    afterBlocks: {
      0: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      1: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      2: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      3: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    final: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
  };
  global.JORNADA_FINAL_VIDEO = global.JORNADA_VIDEOS.final;

  const blockTranslations = {
    'pt-BR': [
      {
        id: 'raizes',
        title: 'Block 1 — Roots',
        data_i18n: 'bloco_raizes_title',
        questions: [
          { id: 'quem_voce_hoje',    label: 'Who are you today?',                         data_i18n: 'pergunta_quem_voce_hoje' },
          { id: 'o_que_te_trouxe',   label: 'What brought you to this journey?',          data_i18n: 'pergunta_o_que_te_trouxe' },
          { id: 'sonho_espiritual',  label: 'What is your greatest spiritual dream?',     data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Block 2 — Reflections',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'desafios_atuais',  label: 'What are your biggest current challenges?',  data_i18n: 'pergunta_desafios_atuais' },
          { id: 'medo_duvida',      label: 'How do you deal with fear or doubt?',        data_i18n: 'pergunta_medo_duvida' },
          { id: 'significado_luz',  label: 'What does "light" mean to you?',             data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Block 3 — Growth',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'mudar_vida',       label: 'What do you want to change in your life?',   data_i18n: 'pergunta_mudar_vida' },
          { id: 'quem_inspira',     label: 'Who inspires you and why?',                  data_i18n: 'pergunta_quem_inspira' },
          { id: 'pratica_gratidao', label: 'How do you practice gratitude daily?',       data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Block 4 — Integration',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'licao_jornada',    label: 'What lesson do you take from this journey?', data_i18n: 'pergunta_licao_jornada' },
          { id: 'aplicar_futuro',   label: 'How will you apply this in the future?',     data_i18n: 'pergunta_aplicar_futuro' },
          { id: 'mensagem_futuro',  label: 'A message for your future self.',            data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Block 5 — Synthesis and Delivery',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'essencia_hoje',    label: 'Who are you today, in one true sentence?',   data_i18n: 'pergunta_essencia_hoje' },
          { id: 'passo_fe',         label: 'What will be your next step of faith and courage?', data_i18n: 'pergunta_passo_fe' }
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
          { id: 'quem_voce_hoje',    label: '¿Quién eres hoy?',                          data_i18n: 'pergunta_quem_voce_hoje' },
          { id: 'o_que_te_trouxe',   label: '¿Qué te trajo a este viaje?',               data_i18n: 'pergunta_o_que_te_trouxe' },
          { id: 'sonho_espiritual',  label: '¿Cuál es tu mayor sueño espiritual?',       data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Bloque 2 — Reflexiones',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'desafios_atuais',  label: '¿Cuáles son tus mayores desafíos actuales?', data_i18n: 'pergunta_desafios_atuais' },
          { id: 'medo_duvida',      label: '¿Cómo lidias con el miedo o la duda?',       data_i18n: 'pergunta_medo_duvida' },
          { id: 'significado_luz',  label: '¿Qué significa la "luz" para ti?',          data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Bloque 3 — Crecimiento',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'mudar_vida',       label: '¿Qué quieres cambiar en tu vida?',          data_i18n: 'pergunta_mudar_vida' },
          { id: 'quem_inspira',     label: '¿Quién te inspira y por qué?',              data_i18n: 'pergunta_quem_inspira' },
          { id: 'pratica_gratidao', label: '¿Cómo practicas la gratitud a diario?',     data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Bloque 4 — Integración',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'licao_jornada',    label: '¿Qué lección te llevas de este viaje?',     data_i18n: 'pergunta_licao_jornada' },
          { id: 'aplicar_futuro',   label: '¿Cómo aplicarás esto en el futuro?',        data_i18n: 'pergunta_aplicar_futuro' },
          { id: 'mensagem_futuro',  label: 'Un mensaje para tu yo futuro.',             data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Bloque 5 — Síntesis y Entrega',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'essencia_hoje',    label: '¿Quién eres hoy, en una frase verdadera?',  data_i18n: 'pergunta_essencia_hoje' },
          { id: 'passo_fe',         label: '¿Cuál será tu próximo paso de fe y coraje?', data_i18n: 'pergunta_passo_fe' }
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
    await i18n.waitForReady();

    const lang = i18n.lang || 'pt-BR';
    const blocks = blockTranslations[lang] || blockTranslations['pt-BR'];
    if (!blocks || !Array.isArray(blocks)) {
      log('Nenhum bloco disponível para o idioma:', lang);
      return false;
    }

    JORNADA_BLOCKS = blocks;
    log('Blocos carregados:', blocks);

    let currentBlockIndex = 0;

    function renderBlock(index) {
      const block = blocks[index];
      if (!block) {
        log('Todos os blocos renderizados');
        return renderFinalVideo();
      }

      const { root, content } = ensureCanvas();
      content.innerHTML = ''; // limpa conteúdo anterior

      setPergaminho(index % 2 === 0 ? 'h' : 'v');

      const title = document.createElement('h2');
      title.className = 'text-xl font-bold text-center text';
      title.setAttribute('data-i18n', block.data_i18n);
      title.setAttribute('data-typing', 'true');
      title.setAttribute('data-speed', '42');
      title.setAttribute('data-cursor', 'true');
      title.textContent = block.title;
      content.appendChild(title);

      const formWrapper = document.createElement('div');
      formWrapper.innerHTML = buildForm(block.questions);
      content.appendChild(formWrapper);

      const btn = document.createElement('button');
      btn.className = 'btn btn-avancar mt-6';
      btn.textContent = i18n.t('btn-avancar', 'Avançar');
      btn.addEventListener('click', () => {
        playVideoAfterBlock(index);
      });
      content.appendChild(btn);

      i18n.apply(content);
      if (global.runTyping) global.runTyping(content);
      if (global.playTypingAndSpeak) global.playTypingAndSpeak('.text');
    }

    function playVideoAfterBlock(index) {
      const block = blocks[index];
      const videoUrl = block.video_after;
      const { root, content } = ensureCanvas();
      content.innerHTML = '';

      const video = document.createElement('video');
      video.src = videoUrl;
      video.autoplay = true;
      video.controls = false;
      video.className = 'w-full rounded shadow';
      video.addEventListener('ended', () => {
        renderBlock(index + 1);
      });
      content.appendChild(video);
    }

    function renderFinalVideo() {
      const { root, content } = ensureCanvas();
      content.innerHTML = '';

      cdocument.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'language-select') {
    i18n.setLang(e.target.value).then(() => {
      global.toast && global.toast('Idioma alterado com sucesso');

      // Reinicia estado da jornada
      global.JC = { currentBloco: 0, currentPergunta: 0 };

      // Recarrega blocos com novo idioma
      if (global.loadDynamicBlocks && global.renderQuestions) {
        global.loadDynamicBlocks().then(() => {
          global.renderQuestions();
        });
      }

      // Volta visualmente para a primeira seção
      if (typeof global.showSectionByIndex === 'function') {
        global.showSectionByIndex(0); // volta para section-intro
      }
    });
  }
});


    renderBlock(currentBlockIndex);
    return true;
  }

  global.loadDynamicBlocks = loadDynamicBlocks;
  global.setPergaminho = setPergaminho;
  global.ensureCanvas = ensureCanvas;
})(window);

