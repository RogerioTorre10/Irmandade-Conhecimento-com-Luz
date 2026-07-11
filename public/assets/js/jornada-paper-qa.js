/* /assets/js/jornada-paper-qa.js
 * Fonte oficial de configuração dos blocos da jornada
 * NÃO renderiza UI
 * NÃO controla progresso
 * NÃO controla navegação
 * Apenas fornece dados por idioma / section
 */
(function (window) {
  'use strict';

  if (window.__JORNADA_PAPER_QA_CONFIG__) {
    console.log('[JORNADA_PAPER] Config já carregada, ignorando...');
    return;
  }
  window.__JORNADA_PAPER_QA_CONFIG__ = true;

  const MOD = '[JORNADA_PAPER]';
  const VIDEO_BASE = '/assets/videos/';

  const CONFIG = {
    'pt-BR': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: 'Bloco 1 — Raízes',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
  {
    number: 1,
    block: 1,
    id: 'q01_criacao',
    label: 'Por quem você foi criado? Pais biológicos, apenas um deles, familiares, pais adotivos ou outra pessoa?',
    data_i18n: 'q01_criacao'
  },
  {
    number: 2,
    block: 2,
    id: 'q02_filho_unico',
    label: 'Você é filho único? Como isso marcou seu senso de individualidade?',
    data_i18n: 'q02_filho_unico'
  },
  {
    number: 3,
    block: 3,
    id: 'q03_irmaos',
    label: 'Quantos irmãos você tem? Qual era seu lugar entre eles: primogênito, do meio ou caçula?',
    data_i18n: 'q03_irmaos'
  },
  {
    number: 4,
    block: 4,
    id: 'q04_privacoes',
    label: 'Você já passou fome ou viveu privações severas na infância? Como isso influenciou sua forma de enxergar a vida?',
    data_i18n: 'q04_privacoes'
  },
  {
    number: 5,
    block: 5,
    id: 'q05_deficiencia',
    label: 'Você possui alguma deficiência física? Já sofreu preconceito por causa dela?',
    data_i18n: 'q05_deficiencia'
  },
  {
    number: 6,
    block: 6,
    id: 'q06_escolaridade',
    label: 'Qual é o seu nível de escolaridade? Como você avalia o investimento que fez em sua formação?',
    data_i18n: 'q06_escolaridade'
  },
  {
    number: 7,
    block: 7,
    id: 'q07_estado_civil',
    label: 'Qual é o seu estado civil hoje? O que isso revela sobre o momento que você está vivendo?',
    data_i18n: 'q07_estado_civil'
  },
  {
    number: 8,
    block: 8,
    id: 'q08_identidade',
    label: 'Você se lembra da primeira vez em que percebeu que era alguém único no mundo? Quantos anos tinha?',
    data_i18n: 'q08_identidade'
  },
  {
    number: 9,
    block: 9,
    id: 'q09_silencio',
    label: 'Como é sua relação com o silêncio? Ele o incomoda ou o acalma?',
    data_i18n: 'q09_silencio'
  },
  {
    number: 10,
    block: 10,
    id: 'q10_crianca',
    label: 'Se você pudesse conversar com a criança que um dia foi, o que diria a ela?',
    data_i18n: 'q10_crianca'
  }
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: 'Bloco 2 — Reflexões',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: 'O que "luz" significa para você?',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: 'Bloco 3 — Crescimento',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: 'Como você pratica gratidão diariamente?',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: 'Bloco 4 — Integração',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: 'Uma mensagem para o seu eu futuro.',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: 'Bloco 5 — Síntese e Entrega',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: 'Qual será seu próximo passo de fé e coragem?',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ],

    'en-US': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: 'Block 1 — Roots',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
          {
            id: 'sonho_espiritual',
            label: 'What is your greatest spiritual dream?',
            data_i18n: 'pergunta_sonho_espiritual'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: 'Block 2 — Reflections',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: 'What does "light" mean to you?',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: 'Block 3 — Growth',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: 'How do you practice gratitude daily?',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: 'Block 4 — Integration',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: 'A message for your future self.',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: 'Block 5 — Synthesis and Delivery',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: 'What will be your next step of faith and courage?',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ],

    'es-ES': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: 'Bloque 1 — Raíces',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
          {
            id: 'sonho_espiritual',
            label: '¿Cuál es tu mayor sueño espiritual?',
            data_i18n: 'pergunta_sonho_espiritual'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: 'Bloque 2 — Reflexiones',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: '¿Qué significa la "luz" para ti?',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: 'Bloque 3 — Crecimiento',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: '¿Cómo practicas la gratitud a diario?',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: 'Bloque 4 — Integración',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: 'Un mensaje para tu yo futuro.',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: 'Bloque 5 — Síntesis y Entrega',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: '¿Cuál será tu próximo paso de fe y coraje?',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ],

    'fr-FR': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: 'Bloc 1 — Racines',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
          {
            id: 'sonho_espiritual',
            label: 'Quel est votre plus grand rêve spirituel ?',
            data_i18n: 'pergunta_sonho_espiritual'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: 'Bloc 2 — Réflexions',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: 'Que signifie la « lumière » pour vous ?',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: 'Bloc 3 — Croissance',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: 'Comment pratiquez-vous la gratitude au quotidien ?',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: 'Bloc 4 — Intégration',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: 'Un message pour votre moi futur.',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: 'Bloc 5 — Synthèse et Offrande',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: 'Quel sera votre prochain pas de foi et de courage ?',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ],

    'de-DE': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: 'Block 1 — Wurzeln',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
          {
            id: 'sonho_espiritual',
            label: 'Was ist Ihr größter spiritueller Traum?',
            data_i18n: 'pergunta_sonho_espiritual'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: 'Block 2 — Reflexionen',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: 'Was bedeutet „Licht“ für Sie?',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: 'Block 3 — Wachstum',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: 'Wie praktizieren Sie täglich Dankbarkeit?',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: 'Block 4 — Integration',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: 'Eine Botschaft an Ihr zukünftiges Ich.',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: 'Block 5 — Synthese und Hingabe',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: 'Was wird Ihr nächster Schritt des Glaubens und des Mutes sein?',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ],

    'ja-JP': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: '第1ブロック — ルーツ',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
          {
            id: 'sonho_espiritual',
            label: 'あなたの最も大きな霊的な夢は何ですか？',
            data_i18n: 'pergunta_sonho_espiritual'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: '第2ブロック — 内省',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: 'あなたにとって「光」とは何を意味しますか？',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: '第3ブロック — 成長',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: '日々どのように感謝を実践していますか？',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: '第4ブロック — 統合',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: '未来の自分へのメッセージ。',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: '第5ブロック — 総合と委ね',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: 'あなたの次の信仰と勇気の一歩は何ですか？',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ],

    'zh-CN': [
      {
        sectionId: 'section-perguntas-raizes',
        id: 'raizes',
        index: 0,
        title: '模块 1 — 根基',
        data_i18n: 'bloco_raizes_title',
        nextSection: 'section-perguntas-reflexoes',
        transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
        questions: [
          {
            id: 'sonho_espiritual',
            label: '你最大的属灵梦想是什么？',
            data_i18n: 'pergunta_sonho_espiritual'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-reflexoes',
        id: 'reflexoes',
        index: 1,
        title: '模块 2 — 反思',
        data_i18n: 'bloco_reflexoes_title',
        nextSection: 'section-perguntas-crescimento',
        transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
        questions: [
          {
            id: 'significado_luz',
            label: '“光”对你意味着什么？',
            data_i18n: 'pergunta_significado_luz'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-crescimento',
        id: 'crescimento',
        index: 2,
        title: '模块 3 — 成长',
        data_i18n: 'bloco_crescimento_title',
        nextSection: 'section-perguntas-integracao',
        transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
        questions: [
          {
            id: 'pratica_gratidao',
            label: '你如何每天实践感恩？',
            data_i18n: 'pergunta_pratica_gratidao'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-integracao',
        id: 'integracao',
        index: 3,
        title: '模块 4 — 整合',
        data_i18n: 'bloco_integracao_title',
        nextSection: 'section-perguntas-sintese',
        transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
        questions: [
          {
            id: 'mensagem_futuro',
            label: '给未来自己的一个信息。',
            data_i18n: 'pergunta_mensagem_futuro'
          }
        ]
      },
      {
        sectionId: 'section-perguntas-sintese',
        id: 'sintese',
        index: 4,
        title: '模块 5 — 综合与交托',
        data_i18n: 'bloco_sintese_title',
        nextSection: 'section-final',
        transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
        questions: [
          {
            id: 'passo_fe',
            label: '你信心与勇气的下一步会是什么？',
            data_i18n: 'pergunta_passo_fe'
          }
        ]
      }
    ]
  };

  function detectLang() {
    const htmlLang = document.documentElement.lang;
    const saved =
      window.LANG ||
      localStorage.getItem('JORNADA_LANG') ||
      sessionStorage.getItem('JORNADA_LANG') ||
      htmlLang ||
      'pt-BR';

    const lang = String(saved).trim();
    if (CONFIG[lang]) return lang;

    const low = lang.toLowerCase();
    if (low.startsWith('en')) return 'en-US';
    if (low.startsWith('es')) return 'es-ES';
    if (low.startsWith('fr')) return 'fr-FR';
    if (low.startsWith('de')) return 'de-DE';
    if (low.startsWith('ja')) return 'ja-JP';
    if (low.startsWith('zh')) return 'zh-CN';
    return 'pt-BR';
  }

  function getBlocks(lang) {
    const useLang = lang || detectLang();
    return CONFIG[useLang] || CONFIG['pt-BR'];
  }

  function getBlockBySection(sectionId, lang) {
    const blocks = getBlocks(lang);
    return blocks.find((b) => b.sectionId === sectionId) || null;
  }

  function getBlockById(blockId, lang) {
    const blocks = getBlocks(lang);
    return blocks.find((b) => b.id === blockId) || null;
  }

  function getBlockByIndex(index, lang) {
    const blocks = getBlocks(lang);
    return blocks[index] || null;
  }

  function getTotalBlocks(lang) {
    return getBlocks(lang).length;
  }

  function getGlobalQuestionTotal(lang) {
    return getBlocks(lang).reduce((acc, bloco) => {
      const q = Array.isArray(bloco.questions) ? bloco.questions.length : 0;
      return acc + q;
    }, 0);
  }

  function getSectionSequence(lang) {
    return getBlocks(lang).map((b) => b.sectionId);
  }

  window.JORNADA_PAPER_QA = {
    CONFIG,
    detectLang,
    getBlocks,
    getBlockBySection,
    getBlockById,
    getBlockByIndex,
    getTotalBlocks,
    getGlobalQuestionTotal,
    getSectionSequence
  };

  window.JORNADA_BLOCKS = getBlocks();
  window.blockTranslations = CONFIG;

  console.log(`${MOD} Config carregada com sucesso. Idioma:`, detectLang(), 'Blocos:', getTotalBlocks());
})(window);
