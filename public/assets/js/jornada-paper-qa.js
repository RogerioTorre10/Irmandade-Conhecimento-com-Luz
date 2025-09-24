;(function () {
  'use strict';

  const CFG = Object.assign(
    {
      CANVAS_ID: 'jornada-canvas',
      CONTENT_ID: 'jornada-conteudo',
      PERGAMINHO_VERT: '/assets/img/pergaminho-rasgado-vert.png',
      PERGAMINHO_HORIZ: '/assets/img/pergaminho-rasgado-horiz.png',
      VIDEO_BASE: '/assets/img/'
    },
    window.JORNADA_CFG || {}
  );

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
        title: 'Bloco 1 — Raízes',
        data_i18n: 'bloco_raizes_title',
        questions: [
          { id: 'quem_voce_hoje', label: 'Quem é você hoje?', data_i18n: 'pergunta_quem_voce_hoje' },
          { id: 'o_que_te_trouxe', label: 'O que te trouxe até esta jornada?', data_i18n: 'pergunta_o_que_te_trouxe' },
          { id: 'sonho_espiritual', label: 'Qual é o seu maior sonho espiritual?', data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Bloco 2 — Reflexões',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'desafios_atuais', label: 'Quais são seus maiores desafios atuais?', data_i18n: 'pergunta_desafios_atuais' },
          { id: 'medo_duvida', label: 'Como você lida com o medo ou a dúvida?', data_i18n: 'pergunta_medo_duvida' },
          { id: 'significado_luz', label: 'O que a "luz" significa para você?', data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Bloco 3 — Crescimento',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'mudar_vida', label: 'O que você quer mudar na sua vida?', data_i18n: 'pergunta_mudar_vida' },
          { id: 'quem_inspira', label: 'Quem inspira você e por quê?', data_i18n: 'pergunta_quem_inspira' },
          { id: 'pratica_gratidao', label: 'Como você pratica gratidão no dia a dia?', data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Bloco 4 — Integração',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'licao_jornada', label: 'Qual lição você leva dessa jornada?', data_i18n: 'pergunta_licao_jornada' },
          { id: 'aplicar_futuro', label: 'Como vai aplicar isso no futuro?', data_i18n: 'pergunta_aplicar_futuro' },
          { id: 'mensagem_futuro', label: 'Uma mensagem para seu eu futuro.', data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Bloco 5 — Síntese e Entrega',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'essencia_hoje', label: 'Quem é você hoje, em uma frase de verdade?', data_i18n: 'pergunta_essencia_hoje' },
          { id: 'passo_fe', label: 'Qual será seu próximo passo de fé e coragem?', data_i18n: 'pergunta_passo_fe' }
        ],
        video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
      }
    ],
    'en-US': [/* Adicione traduções para en-US */],
    'es-ES': [/* Adicione traduções para es-ES */]
  };

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
    console.log('[JORNADA_PAPER] Canvas garantido:', { root, content });
    return { root, content };
  }

  function setPergaminho(mode /* 'v' | 'h' */) {
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
    console.log('[JORNADA_PAPER] Pergaminho aplicado:', { mode, imageUrl });
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

  function updateBlocks() {
    const currentLang = window.i18n?.lang || 'pt-BR';
    window.JORNADA_BLOCKS = blockTranslations[currentLang] || blockTranslations['pt-BR'];
    console.log('[JORNADA_PAPER] Blocos atualizados para idioma:', currentLang);
  }

  let __abortTypingPlaceholder = null;

  async function typePlaceholder(inp, text, speed = 22) {
    if (!inp) {
      console.warn('[TypePlaceholder] Input não encontrado');
      return;
    }
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
    if (!abort) inp.placeholder = text;
    console.log('[TypePlaceholder] Digitação concluída para:', inp);
  }

  async function typeAnswer(textarea, text, speed = 36) {
    if (!textarea) {
      console.warn('[TypeAnswer] Textarea não encontrado');
      return;
    }
    textarea.value = '';
    textarea.classList.add('lumen-typing');
    for (let i = 0; i <= text.length; i++) {
      textarea.value = text.slice(0, i);
      await new Promise(r => setTimeout(r, speed));
    }
    textarea.classList.add('typing-done');
    console.log('[TypeAnswer] Digitação concluída para:', textarea);
  }

  async function typeQuestionsSequentially(bloco) {
    const elements = bloco.querySelectorAll('[data-typing="true"]');
    for (const el of elements) {
      const key = el.dataset.i18n;
      const text = window.i18n?.t(key, el.textContent || key) || el.textContent;
      await typeEffect(el, text, parseInt(el.dataset.speed) || 36);
    }
    const textareas = bloco.querySelectorAll('.j-pergunta textarea');
    for (const textarea of textareas) {
      const key = textarea.dataset.i18nPlaceholder;
      const text = window.i18n?.t(key, textarea.placeholder || key) || textarea.placeholder;
      await typePlaceholder(textarea, text, 22);
    }
  }

  async function typeEffect(element, text, delay = 36) {
    element.textContent = '';
    if (element.dataset.cursor === 'true') {
      element.classList.add('typing-cursor');
    }
    for (let char of text) {
      element.textContent += char;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (element.dataset.cursor === 'true') {
      element.classList.remove('typing-cursor');
    }
  }

  function loadDynamicBlocks() {
    updateBlocks();
    const content = document.getElementById('perguntas-container');
    if (!content) {
      console.error('[JORNADA_PAPER] Container de perguntas não encontrado');
      window.toast && window.toast('Erro ao carregar perguntas.');
      return;
    }

    const blocks = window.JORNADA_BLOCKS || [];
    if (!blocks.length) {
      console.error('[JORNADA_PAPER] JORNADA_BLOCKS não definido ou vazio');
      window.toast && window.toast('Nenhum bloco de perguntas encontrado.');
      return;
    }

    content.innerHTML = '';
    content.classList.remove('hidden');
    blocks.forEach((block, bIdx) => {
      const bloco = document.createElement('div');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = bIdx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = bIdx === 0 ? 'block' : 'none';

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

      (block.questions || []).forEach((q, qIdx) => {
        const div = document.createElement('div');
        div.className = 'j-pergunta';
        div.dataset.pergunta = qIdx;
        div.style.display = bIdx === 0 && qIdx === 0 ? 'block' : 'none';
        div.innerHTML = `
          <label class="pergunta-enunciado text" 
                 data-i18n="${q.data_i18n}" 
                 data-typing="true" 
                 data-speed="36" 
                 data-cursor="true">${q.label}</label>
          <textarea rows="4" class="input" data-i18n-placeholder="resposta_placeholder" placeholder="Digite sua resposta..."></textarea>
          <div class="accessibility-controls">
            <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
            <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
            <button class="btn btn-avancar" data-action="avancar">Avançar</button>
          </div>
        `;
        bloco.appendChild(div);
      });

      content.appendChild(bloco);
    });

    window.i18n?.apply?.(content);

    const firstBloco = content.querySelector('.j-bloco');
    if (firstBloco) {
      firstBloco.style.display = 'block';
      window.JC.currentBloco = 0;
      window.JC.currentPergunta = 0;
      const firstPergunta = firstBloco.querySelector('.j-pergunta');
      if (firstPergunta) {
        firstPergunta.style.display = 'block';
        firstPergunta.classList.add('active');
        setTimeout(() => {
          console.log('[JORNADA_PAPER] Iniciando typeQuestionsSequentially para primeira pergunta');
          typeQuestionsSequentially(firstBloco);
        }, 100);
      }
    }

    if (window.loadAnswers) window.loadAnswers();
    const firstTa = document.querySelector('.j-bloco .j-pergunta textarea');
    if (firstTa && window.handleInput) window.handleInput(firstTa);
    console.log('[JORNADA_PAPER] Blocos carregados com sucesso');
    console.log('[JORNADA_PAPER] Dicionário i18n:', window.i18n?.dict);
  }

  function mount(containerId = CFG.CONTENT_ID, questions = [], { onBack, onFinish } = {}) {
    setPergaminho('h');
    const { content } = ensureCanvas();
    content.innerHTML = `
      <h2 class="text-xl md:text-2xl font-semibold mb-3" data-i18n="perguntas_title">Perguntas</h2>
      ${buildForm(questions)}
      <div class="mt-4 flex flex-wrap gap-2">
        <button id="qa-back" class="px-3 py-2 rounded bg-gray-700 text-white">Voltar</button>
        <button id="qa-finish" class="px-4 py-2 rounded bg-purple-700 text-white">Finalizar</button>
      </div>
    `;
    window.i18n?.apply?.(content);
    document.getElementById('qa-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      onBack && onBack();
    });
    document.getElementById('qa-finish')?.addEventListener('click', (e) => {
      e.preventDefault();
      onFinish && onFinish();
    });
  }

  document.addEventListener('change', (e) => {
    if (e.target.id === 'language-select') {
      window.i18n?.setLang?.(e.target.value);
      updateBlocks();
      loadDynamicBlocks();
      console.log('[JORNADA_PAPER] Idioma alterado, blocos recarregados');
    }
  });

  document.querySelectorAll('[data-action="read-question"]').forEach(button => {
    button.addEventListener('click', () => {
      const pergunta = button.closest('.j-pergunta').querySelector('[data-i18n]');
      const key = pergunta.dataset.i18n;
      const text = window.i18n.t(key, pergunta.textContent);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = window.i18n.lang || 'pt-BR';
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('[readAloud] SpeechSynthesis não suportado');
      }
    });
  });

  document.querySelectorAll('[data-action="toggle-password"]').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.closest('.input-group').querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
      button.textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar';
    });
  });

  window.JORNADA_PAPER = { set: setPergaminho, ensureCanvas };
  window.JORNADA_QA = { buildForm, mount, loadDynamicBlocks, typeQuestionsSequentially, typePlaceholder, typeAnswer };

  document.addEventListener('DOMContentLoaded', () => {
    window.i18n?.init?.().then(() => {
      loadDynamicBlocks();
    });
  });

  console.log('[JORNADA_PAPER] Script carregado');
})();
