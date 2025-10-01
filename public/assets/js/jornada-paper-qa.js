// jornada-paper-qa.js
'use strict';

import i18n from '/public/assets/js/i18n.js';

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
    // Substitua pela lógica real para carregar blocos
    window.JORNADA_BLOCKS = [
      { id: 'block1', content: 'Conteúdo 1' },
      { id: 'block2', content: 'Conteúdo 2' }
    ];
    paperLog('JORNADA_BLOCKS preenchido:', window.JORNADA_BLOCKS);
  } catch (error) {
    console.error('[JORNADA_PAPER] Erro ao preencher JORNADA_BLOCKS:', error.message);
    window.JORNADA_BLOCKS = [];
  }
}

async function renderQuestions() {
  if (!window.JORNADA_BLOCKS?.length) {
    paperLog('Nenhum bloco disponível para renderizar');
    return;
  }
  window.JORNADA_BLOCKS.forEach(block => {
    paperLog('Renderizando bloco:', block.id);
    // Substitua pela lógica real de renderização
    const section = document.querySelector('#section-perguntas');
    if (section) {
      const div = document.createElement('div');
      div.textContent = block.content;
      section.appendChild(div);
    }
  });
}

function loadVideo(url) {
  paperLog(`Carregando vídeo: ${url}`);
  const videoElement = document.createElement('video');
  videoElement.src = url;
  videoElement.controls = true;
  const container = document.querySelector('#section-guia') || document.querySelector('#section-selfie') || document.body;
  container.appendChild(videoElement);
}

function setPergaminho() {
  paperLog('Configurando pergaminho');
  // Adicione a lógica real aqui
}

function ensureCanvas() {
  paperLog('Garantindo canvas');
  // Adicione a lógica real aqui
}

function typeQuestionsSequentially() {
  paperLog('Digitando perguntas sequencialmente');
  // Adicione a lógica real aqui
}

function typePlaceholder() {
  paperLog('Digitando placeholder');
  // Adicione a lógica real aqui
}

async function initPaperQA() {
  try {
    await loadDynamicBlocks();
    paperLog('[JORNADA_PAPER] Inicializado com sucesso');
    // Adicione a lógica adicional de inicialização aqui
  } catch (error) {
    console.error('[JORNADA_PAPER] Erro na inicialização:', error.message);
    window.JORNADA_BLOCKS = window.JORNADA_BLOCKS || [];
  }
}

document.addEventListener('DOMContentLoaded', initPaperQA);
document.addEventListener('change', (e) => {
  if (e.target.id === 'language-select') {
    i18n.setLang(e.target.value).then(() => {
      loadDynamicBlocks();
      renderQuestions();
      paperLog('Idioma alterado, blocos recarregados');
    });
  }
});

paperLog('Script jornada-paper-qa.js carregado com sucesso');

export {
  loadDynamicBlocks,
  renderQuestions,
  loadVideo,
  setPergaminho,
  ensureCanvas,
  typeQuestionsSequentially,
  typePlaceholder
};
