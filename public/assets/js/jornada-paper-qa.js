/* jornada-paper-qa.js — VERSÃO CORRIGIDA (apenas dados, sem render próprio) */
(function (win) {
  'use strict';

  if (win.jornadaPaperQALoaded) {
    console.log('[JORNADA_PAPER] Script já carregado, ignorando...');
    return;
  }
  win.jornadaPaperQALoaded = true;

  const log  = (...args) => console.log('[JORNADA_PAPER]', ...args);
  const warn = (...args) => console.warn('[JORNADA_PAPER]', ...args);

  const i18n = win.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (k, fallback) => fallback || k,
    apply: () => {},
    waitForReady: async () => {}
  };

  const CFG = Object.assign({
    CANVAS_ID: 'jornada-canvas',
    CONTENT_ID: 'jornada-conteudo',
    PERGAMINHO_HORIZ: '/assets/img/pergaminho-rasgado-horiz.png',
    PERGAMINHO_VERT:  '/assets/img/pergaminho-rasgado-horiz.png',
    VIDEO_BASE: '/assets/videos/'   // ← corrigido: aponta para /assets/videos/
  }, win.JORNADA_CFG || {});

  const VIDEO_BASE = CFG.VIDEO_BASE;

  // ── Vídeos ──────────────────────────────────────────────────────────────────
  win.JORNADA_VIDEOS = win.JORNADA_VIDEOS || {
    intro: VIDEO_BASE + 'filme-0-ao-encontro-da-jornada.mp4',
    afterBlocks: {
      0: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      1: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      2: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      3: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    final: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
  };
  win.JORNADA_FINAL_VIDEO = win.JORNADA_VIDEOS.final;

  // ── Blocos multilíngues ──────────────────────────────────────────────────────
  const blockTranslations = {
    'pt-BR': [
      {
        id: 'raizes',
        title: 'Bloco 1 — Raízes',
        data_i18n: 'bloco_raizes_title',
        questions: [
          { id: 'sonho_espiritual', label: 'Qual é o seu maior sonho espiritual?', data_i18n: 'pergunta_sonho_espiritual' }
        ],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes',
        title: 'Bloco 2 — Reflexões',
        data_i18n: 'bloco_reflexoes_title',
        questions: [
          { id: 'significado_luz', label: 'O que "luz" significa para você?', data_i18n: 'pergunta_significado_luz' }
        ],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento',
        title: 'Bloco 3 — Crescimento',
        data_i18n: 'bloco_crescimento_title',
        questions: [
          { id: 'pratica_gratidao', label: 'Como você pratica gratidão diariamente?', data_i18n: 'pergunta_pratica_gratidao' }
        ],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao',
        title: 'Bloco 4 — Integração',
        data_i18n: 'bloco_integracao_title',
        questions: [
          { id: 'mensagem_futuro', label: 'Uma mensagem para o seu eu futuro.', data_i18n: 'pergunta_mensagem_futuro' }
        ],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese',
        title: 'Bloco 5 — Síntese e Entrega',
        data_i18n: 'bloco_sintese_title',
        questions: [
          { id: 'passo_fe', label: 'Qual será seu próximo passo de fé e coragem?', data_i18n: 'pergunta_passo_fe' }
        ],
        video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
      }
    ],
    'en-US': [
      {
        id: 'raizes', title: 'Block 1 — Roots', data_i18n: 'bloco_raizes_title',
        questions: [{ id: 'sonho_espiritual', label: 'What is your greatest spiritual dream?', data_i18n: 'pergunta_sonho_espiritual' }],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes', title: 'Block 2 — Reflections', data_i18n: 'bloco_reflexoes_title',
        questions: [{ id: 'significado_luz', label: 'What does "light" mean to you?', data_i18n: 'pergunta_significado_luz' }],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento', title: 'Block 3 — Growth', data_i18n: 'bloco_crescimento_title',
        questions: [{ id: 'pratica_gratidao', label: 'How do you practice gratitude daily?', data_i18n: 'pergunta_pratica_gratidao' }],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao', title: 'Block 4 — Integration', data_i18n: 'bloco_integracao_title',
        questions: [{ id: 'mensagem_futuro', label: 'A message for your future self.', data_i18n: 'pergunta_mensagem_futuro' }],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese', title: 'Block 5 — Synthesis and Delivery', data_i18n: 'bloco_sintese_title',
        questions: [{ id: 'passo_fe', label: 'What will be your next step of faith and courage?', data_i18n: 'pergunta_passo_fe' }],
        video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
      }
    ],
    'es-ES': [
      {
        id: 'raizes', title: 'Bloque 1 — Raíces', data_i18n: 'bloco_raizes_title',
        questions: [{ id: 'sonho_espiritual', label: '¿Cuál es tu mayor sueño espiritual?', data_i18n: 'pergunta_sonho_espiritual' }],
        video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4'
      },
      {
        id: 'reflexoes', title: 'Bloque 2 — Reflexiones', data_i18n: 'bloco_reflexoes_title',
        questions: [{ id: 'significado_luz', label: '¿Qué significa la "luz" para ti?', data_i18n: 'pergunta_significado_luz' }],
        video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4'
      },
      {
        id: 'crescimento', title: 'Bloque 3 — Crecimiento', data_i18n: 'bloco_crescimento_title',
        questions: [{ id: 'pratica_gratidao', label: '¿Cómo practicas la gratitud a diario?', data_i18n: 'pergunta_pratica_gratidao' }],
        video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4'
      },
      {
        id: 'integracao', title: 'Bloque 4 — Integración', data_i18n: 'bloco_integracao_title',
        questions: [{ id: 'mensagem_futuro', label: 'Un mensaje para tu yo futuro.', data_i18n: 'pergunta_mensagem_futuro' }],
        video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
      },
      {
        id: 'sintese', title: 'Bloque 5 — Síntesis y Entrega', data_i18n: 'bloco_sintese_title',
        questions: [{ id: 'passo_fe', label: '¿Cuál será tu próximo paso de fe y coraje?', data_i18n: 'pergunta_passo_fe' }],
        video_after: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
      }
    ]
  };

  // Expostos para section-perguntas.js usar
  win.blockTranslations = blockTranslations;

  let JORNADA_BLOCKS = [];
  win.JORNADA_BLOCKS = JORNADA_BLOCKS;

  // ── Carrega blocos com i18n ──────────────────────────────────────────────────
  async function loadDynamicBlocks() {
    await i18n.waitForReady(10000);
    const lang = i18n.lang || 'pt-BR';
    const base = blockTranslations[lang] || blockTranslations['pt-BR'];

    JORNADA_BLOCKS = base.map(b => ({
      id: b.id,
      title: b.title,
      data_i18n: b.data_i18n,
      questions: b.questions,
      video_after: b.video_after,
      tipo: 'perguntas'
    }));

    win.JORNADA_BLOCKS = JORNADA_BLOCKS;
    log('Blocos carregados:', JORNADA_BLOCKS.length);
    return true;
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  async function initPaperQA() {
    await loadDynamicBlocks();
    // Dispara evento para section-perguntas.js saber que os blocos estão prontos
    document.dispatchEvent(new CustomEvent('jornada:blocks-ready'));
    log('Blocos prontos, evento jornada:blocks-ready disparado.');
  }

  document.addEventListener('DOMContentLoaded', initPaperQA);

  // ── API pública (apenas dados — renderização é responsabilidade do section-perguntas.js) ──
  win.JPaperQA = {
    loadDynamicBlocks,
    init: initPaperQA
  };

  log('jornada-paper-qa.js carregado (modo dados).');
})(window);
