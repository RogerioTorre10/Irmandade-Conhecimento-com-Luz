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
        theme: 'criacao_familiar',
        id: 'q01_criacao',
        label: 'Por quem você foi criado? Pais biológicos, apenas um deles, familiares, pais adotivos ou outra pessoa?',
        data_i18n: 'q01_criacao'
      },
      {
        number: 2,
        block: 1,
        theme: 'individualidade',
        id: 'q02_filho_unico',        
        label: 'Você é filho único ou tem irmãos? Como essa realidade marcou seu senso de individualidade?',
        data_i18n: 'q02_filho_unico'
      },
      {
        number: 3,
        block: 1,
        theme: 'irmaos',
        id: 'q03_irmaos',        
        label: 'Se tem ou tivesse irmãos? Quantos? Qual é ou seria seu lugar entre eles: primogênito, do meio ou caçula?',
        data_i18n: 'q03_irmaos'
      },
      {
        number: 4,
        block: 1,
        theme: 'privacoes',
        id: 'q04_privacoes',        
        label: 'Você já passou fome ou viveu privações severas na infância? Como isso influenciou sua forma de enxergar a vida?',
        data_i18n: 'q04_privacoes'
      },
      {
        number: 5,
        block: 1,
        theme: 'deficiencia',
        id: 'q05_deficiencia',        
        label: 'Você possui alguma deficiência, social, física, cognitiva? Já sofreu preconceito por causa dela?',
        data_i18n: 'q05_deficiencia'
      },
      {
        number: 6,
        block: 1,
        theme: 'escolaridade',
        id: 'q06_escolaridade',        
        label: 'Qual é o seu nível de escolaridade? Como você avalia o investimento que fez em sua formação?',
        data_i18n: 'q06_escolaridade'
      },
      {
        number: 7,
        block: 1,
        theme: 'estado_civil',
        id: 'q07_estado_civil',        
        label: 'Como o seu estado civil hoje influência o momento que você está vivendo?',
        data_i18n: 'q07_estado_civil'
      },
      {
        number: 8,
        block: 1,
        theme: 'identidade',
        id: 'q08_identidade',        
        label: 'Você se lembra da primeira vez em que percebeu que era alguém único no mundo? Quantos anos tinha?',
        data_i18n: 'q08_identidade'
      },
      {
        number: 9,
        block: 1,
        theme: 'silencio',
        id: 'q09_silencio',        
        label: 'Como é sua relação com o silêncio? Ele o incomoda ou o acalma?',
        data_i18n: 'q09_silencio'
      },
      {
        number: 10,
        block: 1,
        theme: 'crianca_interior',
        id: 'q10_crianca',        
        label: 'Se você pudesse conversar com a criança que ainda habita em você, o que diria a ela?',
        data_i18n: 'q10_crianca'
      }
      ]   
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
    number: 11,
    block: 2,
    theme: 'vida',
    id: 'q11_percepcao_vida',
    label: 'Como você tem percebido a sua própria vida até aqui?',
    data_i18n: 'q11_percepcao_vida'
},

{
    number: 12,
    block: 2,
    theme: 'empatia',
    id: 'q12_percepcao_outros',    
    label: 'Como você enxerga a vida das pessoas ao seu redor?',
    data_i18n: 'q12_percepcao_outros'
},

{
    number: 13,
    block: 2,
    theme: 'traumas',
    id: 'q13_traumas',    
    label: 'Como você lida com os seus traumas? Consegue falar sobre eles?',
    data_i18n: 'q13_traumas'
},

{
    number: 14,
    block: 2,
    theme: 'verdade',
    id: 'q14_verdade',    
    label: 'Você acredita que existe uma verdade maior ou que tudo depende do olhar de cada pessoa?',
    data_i18n: 'q14_verdade'
},

{
    number: 15,
    block: 2,
    theme: 'vicios',
    id: 'q15_vicios',    
    label: 'Qual é o seu maior vício? Por que acredita que ele surgiu? Já tentou vencê-lo? Percebe também outros vícios mais sutis ou emocionais em você?',
    data_i18n: 'q15_vicios'
},

{
    number: 16,
    block: 2,
    theme: 'doenca',
    id: 'q16_doenca',    
    label: 'O que a doença representa para você? Está enfrentando alguma condição neste momento?',
    data_i18n: 'q16_doenca'
},

{
    number: 17,
    block: 2,
    theme: 'solidao',
    id: 'q17_presenca',    
    label: 'Existe alguém que você gostaria de ter ao seu lado neste momento? Por que essa pessoa não está presente?',
    data_i18n: 'q17_presenca'
},

{
    number: 18,
    block: 2,
    theme: 'morte',
    id: 'q18_morte',    
    label: 'Como você percebe a morte? Ela desperta medo, conforto ou curiosidade?',
    data_i18n: 'q18_morte'
},

{
    number: 19,
    block: 2,
    theme: 'espiritualidade',
    id: 'q19_doenca_espiritual',
    label: 'Como você compreende a doença? Ela pode ter algum significado ou propósito em determinados momentos da vida?',
    data_i18n: 'q19_doenca_espiritual'
},

{
    number: 20,
    block: 2,
    theme: 'sentido_doenca',
    id: 'q20_sentido_doenca',
    label: 'Você acredita que algumas doenças podem refletir sombras internas ou fazer parte de um processo de crescimento espiritual?',    
    data_i18n: 'q20_sentido_doenca'
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
    number: 21,
    block: 3,
    theme: 'sentido_da_vida',
    id: 'q21_sentido_vida',
    label: 'Como você percebe o sentido da vida? Existe um propósito maior ou tudo acontece por acaso?',
    data_i18n: 'q21_sentido_vida'
},

{
    number: 22,
    block: 3,
    theme: 'espiritualidade',
    id: 'q22_espiritualidade',
    label: 'Você acredita em Deus, em um ser supremo, na espiritualidade ou em algo além do que podemos ver?',
    data_i18n: 'q22_espiritualidade'
},

{
    number: 23,
    block: 3,
    theme: 'experiencia_espiritual',
    id: 'q23_guia_invisivel',
    label: 'Você já se sentiu guiado por algo invisível? Pode contar uma experiência marcante?',
    data_i18n: 'q23_guia_invisivel'
},

{
    number: 24,
    block: 3,
    theme: 'dor_emocional',
    id: 'q24_dor_emocional',
    label: 'Qual foi a maior dor emocional que você já enfrentou? Como conseguiu lidar com ela?',
    data_i18n: 'q24_dor_emocional'
},

{
    number: 25,
    block: 3,
    theme: 'superacao',
    id: 'q25_superacao',
    label: 'Qual foi a maior superação da sua vida? Que força você descobriu naquele momento?',
    data_i18n: 'q25_superacao'
},

{
    number: 26,
    block: 3,
    theme: 'medos',
    id: 'q26_medos',
    label: 'Do que você mais tem medo hoje? O que esse medo pode estar tentando lhe mostrar?',
    data_i18n: 'q26_medos'
},

{
    number: 27,
    block: 3,
    theme: 'autocuidado',
    id: 'q27_esquecimento_de_si',
    label: 'Por que você acredita que acabou se esquecendo de si mesmo? Quando foi a última vez que recebeu um elogio que realmente o marcou?',
    data_i18n: 'q27_esquecimento_de_si'
},

{
    number: 28,
    block: 3,
    theme: 'prioridade_pessoal',
    id: 'q28_prioridade',
    label: 'Por que você acredita que, muitas vezes, não consegue colocar a si mesmo como prioridade?',
    data_i18n: 'q28_prioridade'
},

{
    number: 29,
    block: 3,
    theme: 'autoestima',
    id: 'q29_autoestima',
    label: 'Você costuma reconhecer e elogiar a si mesmo? Em quais momentos isso acontece?',
    data_i18n: 'q29_autoestima'
},

{
    number: 30,
    block: 3,
    theme: 'sonhos',
    id: 'q30_sonhos',
    label: 'Você se vê como alguém que ajuda sonhos a nascerem ou como alguém que, sem perceber, acaba enterrando os próprios sonhos e dos outros?',
    data_i18n: 'q30_sonhos'
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
    number: 31,
    block: 4,
    theme: 'maior_sonho',
    id: 'q31_maior_sonho',
    label: 'Qual é o seu maior sonho hoje? Algo que faz você sorrir só de imaginar.',
    data_i18n: 'q31_maior_sonho'
},

{
    number: 32,
    block: 4,
    theme: 'barreiras',
    id: 'q32_barreiras',
    label: 'O que você acredita que o impede de realizá-lo? Essas barreiras são internas, externas ou ambas?',
    data_i18n: 'q32_barreiras'
},

{
    number: 33,
    block: 4,
    theme: 'proposito',
    id: 'q33_proposito',
    label: 'Você sente que está vivendo o seu propósito ou ainda está em busca dele?',
    data_i18n: 'q33_proposito'
},

{
    number: 34,
    block: 4,
    theme: 'chamado_interior',
    id: 'q34_chamado_interior',
    label: 'Existe um chamado interior, uma vontade silenciosa, que você tem ignorado?',
    data_i18n: 'q34_chamado_interior'
},

{
    number: 35,
    block: 4,
    theme: 'origem_dos_medos',
    id: 'q35_origem_medos',
    label: 'Os seus medos estão ligados a qual situação ou sentimento específico?',
    data_i18n: 'q35_origem_medos'
},

{
    number: 36,
    block: 4,
    theme: 'decisoes_e_limites',
    id: 'q36_decisoes_limites',
    label: 'Você sente que deixa de tomar certas decisões por medo ou acaba aceitando situações que o humilham?',
    data_i18n: 'q36_decisoes_limites'
},

{
    number: 37,
    block: 4,
    theme: 'acolhimento_do_sofrimento',
    id: 'q37_acolhimento_sofrimento',
    label: 'O que você diria para alguém que está sofrendo profundamente neste momento?',
    data_i18n: 'q37_acolhimento_sofrimento'
},

{
    number: 38,
    block: 4,
    theme: 'vida_alem_da_terra',
    id: 'q38_vida_alem_terra',
    label: 'Você acredita que existe vida além do nosso planeta Terra ou acredita que toda a existência acontece apenas aqui?',
    data_i18n: 'q38_vida_alem_terra'
},

{
    number: 39,
    block: 4,
    theme: 'legado',
    id: 'q39_legado',
    label: 'Como você gostaria de ser lembrado quando não estiver mais aqui? Que legado deseja deixar?',
    data_i18n: 'q39_legado'
},

{
    number: 40,
    block: 4,
    theme: 'destino_dos_sonhos',
    id: 'q40_destino_sonhos',
    label: 'O que aconteceu com os sonhos que você teve — e os quais nunca chegou a realizar?',
    data_i18n: 'q40_destino_sonhos'
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
    number: 41,
    block: 5,
    theme: 'choro',
    id: 'q41_choro',
    label: 'Você tem chorado com frequência? Consegue identificar o que costuma provocar esse choro?',
    data_i18n: 'q41_choro'
},

{
    number: 42,
    block: 5,
    theme: 'origem_do_choro',
    id: 'q42_origem_choro',
    label: 'Esse choro nasce de um vazio interior, de uma perda ou de um arrependimento?',
    data_i18n: 'q42_origem_choro'
},

{
    number: 43,
    block: 5,
    theme: 'expressao_da_dor',
    id: 'q43_expressao_dor',
    label: 'Quando o choro chega, o que predomina: o silêncio, a busca por algo que intensifique esse sentimento ou a raiva querendo se manifestar?',
    data_i18n: 'q43_expressao_dor'
},

{
    number: 44,
    block: 5,
    theme: 'tristeza_depressao',
    id: 'q44_tristeza_depressao',
    label: 'Você se sente triste ou acredita estar vivendo um estado depressivo? Consegue perceber a diferença entre essas duas experiências?',
    data_i18n: 'q44_tristeza_depressao'
},

{
    number: 45,
    block: 5,
    theme: 'ajuda_profissional',
    id: 'q45_ajuda_profissional',
    label: 'Se você acredita estar vivendo um estado depressivo, já pensou em procurar ajuda profissional para compreender melhor o que está sentindo?',
    data_i18n: 'q45_ajuda_profissional'
},

{
    number: 46,
    block: 5,
    theme: 'comportamento_relacional',
    id: 'q46_comportamento_relacional',
    label: 'Nas suas relações, você se considera uma pessoa mais agressiva ou mais submissa?',
    data_i18n: 'q46_comportamento_relacional'
},

{
    number: 47,
    block: 5,
    theme: 'autopercepcao',
    id: 'q47_autopercepcao',
    label: 'Você sente que, às vezes, é difícil conviver consigo mesmo ou costuma carregar raiva por decisões que considera equivocadas?',
    data_i18n: 'q47_autopercepcao'
},

{
    number: 48,
    block: 5,
    theme: 'autoimagem',
    id: 'q48_autoimagem',
    label: 'Você se considera uma pessoa interessante ou acredita ser alguém sem muito interesse para os outros?',
    data_i18n: 'q48_autoimagem'
},

{
    number: 49,
    block: 5,
    theme: 'limites',
    id: 'q49_limites',
    label: 'Você tem dificuldade em dizer "não" para as pessoas?',
    data_i18n: 'q49_limites'
},

{
    number: 50,
    block: 5,
    theme: 'morte',
    id: 'q50_morte',
    label: 'Você tem medo de morrer? Muitas vezes, o medo está menos na morte em si e mais na forma como ela pode acontecer. Como você percebe isso em você?',
    data_i18n: 'q50_morte'
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
