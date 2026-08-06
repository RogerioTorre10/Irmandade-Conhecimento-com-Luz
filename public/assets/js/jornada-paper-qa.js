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
          label: 'Se tem ou tivesse irmãos, quantos seriam? Qual é ou seria seu lugar entre eles: primogênito, do meio ou caçula?',
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
          label: 'Você possui alguma deficiência social, física ou cognitiva? Já sofreu preconceito por causa dela?',
          data_i18n: 'q05_deficiencia'
        },
        {
          number: 6,
          block: 1,
          theme: 'escolaridade',
          id: 'q06_escolaridade',        
          label: 'Qual é o seu nível de escolaridade? Como você avalia o investimento que fez em sua própria formação?',
          data_i18n: 'q06_escolaridade'
        },
        {
          number: 7,
          block: 1,
          theme: 'estado_civil',
          id: 'q07_estado_civil',        
          label: 'Como o seu estado civil hoje influencia o momento que você está vivendo?',
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
          label: 'O que a doença representa para você? Está enfrentando alguma condição de saúde neste momento?',
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
          label: 'Como você compreende a enfermidade? Ela pode ter algum significado ou propósito em determinados momentos da vida?',
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
          label: 'Por que você acredita que, muitas vezes, não consegue se colocar como prioridade?',
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
          label: 'Você se vê como alguém que ajuda sonhos a nascerem ou como alguém que, sem perceber, acaba enterrando os próprios sonhos e os de outras pessoas?',
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
          label: 'Você acredita que existe vida além do nosso planeta Terra ou que toda a existência acontece apenas aqui?',
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
          label: 'Nas suas relações, você se considera uma pessoa mais assertiva/agressiva ou mais submissa?',
          data_i18n: 'q46_comportamento_relacional'
        },
        {
          number: 47,
          block: 5,
          theme: 'autopercepcao',
          id: 'q47_autopercepcao',
          label: 'Você sente que, às vezes, é difícil conviver consigo mesmo ou costuma carregar mágoa ou raiva por decisões que considera equivocadas?',
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
    { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Who raised you — your biological parents, just one of them, other relatives, adoptive parents, or someone outside that circle? Briefly describe that presence.', data_i18n: 'q01_criacao' },
    { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'Did you grow up as an only child or did you have siblings? How did that shape the way you see yourself as an individual — more independent, more alone, more torn?', data_i18n: 'q02_filho_unico' },
    { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'If you have or had siblings, where did you fall among them — oldest, middle, or youngest? What weight or advantage did that spot bring to your story?', data_i18n: 'q03_irmaos' },
    { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Was there hunger or serious hardship in your childhood? If so, what mark did it leave on how you deal with scarcity, security, or feeling worthy today?', data_i18n: 'q04_privacoes' },
    { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Do you live with any social, physical, or cognitive limitation? Have you felt the sting of prejudice because of it — and how does that show up in you now?', data_i18n: 'q05_deficiencia' },
    { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: "What's your education level? Looking back, do you feel you invested enough in your own growth, or is there a gap in your learning that still bothers you?", data_i18n: 'q06_escolaridade' },
    { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Your current relationship status — single, married, separated, dating — is it strengthening you or weighing you down right now?', data_i18n: 'q07_estado_civil' },
    { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Do you remember the exact moment you realized, on your own, that you were someone unique in the world? How old were you, and what did you feel?', data_i18n: 'q08_identidade' },
    { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: "What's your real relationship with silence — does it unsettle you because it exposes something, or does it calm you because it brings you back to yourself?", data_i18n: 'q09_silencio' },
    { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'If you could talk right now to the child you once were — the one who carried everything you just shared — what would you tell them?', data_i18n: 'q10_crianca' }
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
    { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: "After revisiting your roots, how have you come to see your own life so far — as an achievement, as survival, or as something still up in the air?", data_i18n: 'q11_percepcao_vida' },
    { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'And the lives of the people around you — do you see them with genuine empathy, or with distance and judgment?', data_i18n: 'q12_percepcao_outros' },
    { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'How do you deal with your traumas: do you face them head-on, or avoid even naming them? Can you talk about them now with the same honesty as before?', data_i18n: 'q13_traumas' },
    { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: "Do you believe there's a greater truth above everything, or that every truth is just a reflection of the eyes that see it?", data_i18n: 'q14_verdade' },
    { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: "What's your biggest vice — the one you admit to, or the one you hide? Where did it come from, have you tried to beat it, and are there subtler, emotional vices you rarely admit to having?", data_i18n: 'q15_vicios' },
    { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'What does illness mean to you? Is there any health condition — physical or emotional — going through you right now?', data_i18n: 'q16_doenca' },
    { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: "Is there someone you'd like to have by your side right now? What's keeping that person away — distance, pride, or something that was never said?", data_i18n: 'q17_presenca' },
    { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'How do you see death today — as fear, as relief, or as genuine curiosity about what comes next?', data_i18n: 'q18_morte' },
    { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'Do you believe illness can carry a meaning, a message, or a hidden purpose at certain moments in life?', data_i18n: 'q19_doenca_espiritual' },
    { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Going deeper: do you think some illnesses reflect unresolved inner shadows, or are part of a spiritual growth process?', data_i18n: 'q20_sentido_doenca' }
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
    { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'After everything you already revealed, what does life mean to you — is there a greater purpose guiding it all, or is it chance that decides?', data_i18n: 'q21_sentido_vida' },
    { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Do you believe in God, in a supreme being, in spirituality, or in something beyond what the eyes can see?', data_i18n: 'q22_espiritualidade' },
    { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'Have you ever felt, at some point, that you were guided by something invisible? Is there a striking experience that proves that to you?', data_i18n: 'q23_guia_invisivel' },
    { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'What was the greatest emotional pain you have ever faced — and what path did you actually use to get through it?', data_i18n: 'q24_dor_emocional' },
    { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'And what was your greatest triumph? What strength did you discover in yourself right at the moment everything seemed lost?', data_i18n: 'q25_superacao' },
    { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'What are you most afraid of today? If you stop to really listen to that fear, what is it trying to show you?', data_i18n: 'q26_medos' },
    { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Why do you believe that, at some point, you stopped putting yourself first? When was the last time you got a compliment that truly touched you?', data_i18n: 'q27_esquecimento_de_si' },
    { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Why do you often struggle to treat yourself as a priority — even knowing you need to?', data_i18n: 'q28_prioridade' },
    { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: "Do you tend to recognize and praise yourself, without depending on anyone else's validation? In which moments does that actually happen?", data_i18n: 'q29_autoestima' },
    { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: "Do you see yourself as someone who helps dreams — yours and others' — come to life, or as someone who, without realizing it, has been burying those dreams along the way?", data_i18n: 'q30_sonhos' }
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
    { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: "After looking at your fears and buried dreams: what's your biggest dream today — the one that makes you smile just imagining it?", data_i18n: 'q31_maior_sonho' },
    { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'What do you believe is stopping you from making it happen? Do those barriers come from inside, from outside, or both at once?', data_i18n: 'q32_barreiras' },
    { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: "Do you feel like you're already living your purpose, or are you still searching for it — without quite knowing which way to go?", data_i18n: 'q33_proposito' },
    { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: "Is there an inner calling, a quiet urge, that you keep ignoring, even knowing it's still pulsing inside you?", data_i18n: 'q34_chamado_interior' },
    { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'Going back to your fears: what situation or feeling are they actually tied to, deep down?', data_i18n: 'q35_origem_medos' },
    { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Do you feel like you avoid certain decisions out of fear, or that you end up accepting situations that diminish you just to avoid confrontation?', data_i18n: 'q36_decisoes_limites' },
    { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'If someone were standing in front of you right now, deeply suffering, what would you tell them — and could you say the same thing to yourself?', data_i18n: 'q37_acolhimento_sofrimento' },
    { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: "Do you believe there's life beyond our planet, or that all existence is limited to what we know here?", data_i18n: 'q38_vida_alem_terra' },
    { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: "How would you like to be remembered when you're no longer here? What legacy, beyond belongings or words, do you want to leave behind?", data_i18n: 'q39_legado' },
    { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'What actually happened to the dreams you had and never got to fulfill — did they die, are they waiting, or did you just stop believing in them?', data_i18n: 'q40_destino_sonhos' }
  ]
},

{
  sectionId: 'section-perguntas-sintese',
  id: 'sintese',
  index: 4,
  title: 'Block 5 — Synthesis & Delivery',
  data_i18n: 'bloco_sintese_title',
  nextSection: 'section-final',
  transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
  questions: [
    { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'Have you been crying often lately? Can you honestly identify what really triggers that crying?', data_i18n: 'q41_choro' },
    { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Does that crying come from an inner emptiness, a concrete loss, or a regret you carry in silence?', data_i18n: 'q42_origem_choro' },
    { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'When the pain hits, what takes over — the silence that isolates you, the urge to chase something that intensifies the feeling, or the anger wanting to explode?', data_i18n: 'q43_expressao_dor' },
    { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Do you feel just passing sadness, or do you believe you are going through something deeper, like a depressive state? Can you clearly tell the two apart in yourself?', data_i18n: 'q44_tristeza_depressao' },
    { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'If you recognize that deeper state, have you considered seeking professional help to better understand what you are feeling — or are you still resisting that step?', data_i18n: 'q45_ajuda_profissional' },
    { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'In your relationships, do you see yourself more as assertive (or even aggressive), or more as submissive, avoiding conflict at all costs?', data_i18n: 'q46_comportamento_relacional' },
    { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Are there moments when it is even hard to live with yourself — carrying resentment or anger over decisions you now consider mistakes?', data_i18n: 'q47_autopercepcao' },
    { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Deep down, do you see yourself as someone interesting and worthwhile, or do you believe, even secretly, that you are someone of little interest to others?', data_i18n: 'q48_autoimagem' },
    { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'Do you genuinely struggle to say "no" to people — even when it means betraying yourself inside?', data_i18n: 'q49_limites' },
    { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'To close: are you afraid of dying? And being even more honest — is that fear about death itself, or about how it might happen? What does that answer reveal about everything you have shared so far?', data_i18n: 'q50_morte' }
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
    { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Qui t\'a élevé — tes parents biologiques, un seul d\'entre eux, d\'autres membres de la famille, des parents adoptifs, ou quelqu\'un d\'autre en dehors de ce cercle ? Décris brièvement cette présence.', data_i18n: 'q01_criacao' },
    { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'As-tu grandi comme enfant unique ou avais-tu des frères et sœurs ? En quoi cette réalité a-t-elle façonné ta façon de te percevoir en tant qu\'individu — plus indépendant, plus seul, plus divisé ?', data_i18n: 'q02_filho_unico' },
    { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Si tu as ou avais des frères et sœurs, quelle était (ou serait) ta place parmi eux — l\'aîné, celui du milieu, ou le plus jeune ? Quel poids ou quel avantage cette place a-t-elle apporté à ton histoire ?', data_i18n: 'q03_irmaos' },
    { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Y a-t-il eu de la faim ou de graves privations pendant ton enfance ? Si oui, quelle marque cela a-t-il laissée sur ta façon de gérer le manque, la sécurité ou le sentiment de mérite aujourd\'hui ?', data_i18n: 'q04_privacoes' },
    { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Vis-tu avec une limitation sociale, physique ou cognitive ? As-tu déjà ressenti le poids des préjugés à cause de ça — et comment cela se reflète-t-il en toi aujourd\'hui ?', data_i18n: 'q05_deficiencia' },
    { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'Quel est ton niveau d\'études ? En y repensant, sens-tu que tu as suffisamment investi dans ta propre formation, ou existe-t-il un vide d\'apprentissage qui te dérange encore ?', data_i18n: 'q06_escolaridade' },
    { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Ta situation sentimentale actuelle — seul, marié, séparé, en couple — te renforce-t-elle ou te pèse-t-elle en ce moment de ta vie ?', data_i18n: 'q07_estado_civil' },
    { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Te souviens-tu de l\'instant exact où tu as réalisé, par toi-même, que tu étais quelqu\'un d\'unique au monde ? Quel âge avais-tu, et qu\'as-tu ressenti ?', data_i18n: 'q08_identidade' },
    { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: 'Quelle est ta relation réelle avec le silence — te dérange-t-il parce qu\'il expose quelque chose, ou t\'apaise-t-il parce qu\'il te ramène à toi-même ?', data_i18n: 'q09_silencio' },
    { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Si tu pouvais parler maintenant à l\'enfant que tu étais — celui qui a porté tout ce que tu viens de raconter — que lui dirais-tu ?', data_i18n: 'q10_crianca' }
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
    { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'Après avoir revisité tes racines, comment perçois-tu ta propre vie jusqu\'à présent — comme une réussite, comme une survie, ou comme quelque chose encore en suspens ?', data_i18n: 'q11_percepcao_vida' },
    { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'Et la vie des gens autour de toi — la regardes-tu avec une empathie sincère, ou avec distance et jugement ?', data_i18n: 'q12_percepcao_outros' },
    { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'Comment gères-tu tes traumatismes : les affrontes-tu de face, ou évites-tu même de les nommer ? Peux-tu en parler maintenant avec la même sincérité qu\'avant ?', data_i18n: 'q13_traumas' },
    { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'Crois-tu qu\'il existe une vérité plus grande, au-dessus de tout, ou que chaque vérité n\'est que le reflet du regard de celui qui la perçoit ?', data_i18n: 'q14_verdade' },
    { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'Quel est ton plus grand vice — avoué ou caché ? D\'où vient-il, as-tu déjà essayé de le vaincre, et existe-t-il d\'autres vices plus subtils, émotionnels, que tu admets rarement avoir ?', data_i18n: 'q15_vicios' },
    { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'Que représente la maladie pour toi ? Traverses-tu actuellement une condition de santé — physique ou émotionnelle ?', data_i18n: 'q16_doenca' },
    { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: 'Y a-t-il quelqu\'un que tu aimerais avoir à tes côtés en ce moment précis ? Qu\'est-ce qui empêche cette personne d\'être présente — la distance, l\'orgueil, ou quelque chose qui n\'a jamais été dit ?', data_i18n: 'q17_presenca' },
    { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'Comment perçois-tu la mort aujourd\'hui — comme une peur, comme un soulagement, ou comme une curiosité sincère envers ce qui vient après ?', data_i18n: 'q18_morte' },
    { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'Crois-tu que la maladie puisse porter un sens, un message, ou un but caché à certains moments de la vie ?', data_i18n: 'q19_doenca_espiritual' },
    { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'En allant plus loin : penses-tu que certaines maladies reflètent des ombres intérieures non résolues, ou font partie d\'un processus de croissance spirituelle ?', data_i18n: 'q20_sentido_doenca' }
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
    { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'Après tout ce que tu as déjà révélé, quel est, pour toi, le sens de la vie — existe-t-il un but plus grand qui guide tout, ou est-ce le hasard qui décide ?', data_i18n: 'q21_sentido_vida' },
    { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Crois-tu en Dieu, en un être suprême, en la spiritualité, ou en quelque chose qui dépasse ce que les yeux peuvent voir ?', data_i18n: 'q22_espiritualidade' },
    { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'As-tu déjà senti, à un moment donné, que tu étais guidé par quelque chose d\'invisible ? Existe-t-il une expérience marquante qui te le prouve ?', data_i18n: 'q23_guia_invisivel' },
    { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'Quelle a été la plus grande douleur émotionnelle que tu aies jamais affrontée — et quel chemin as-tu réellement utilisé pour la traverser ?', data_i18n: 'q24_dor_emocional' },
    { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'Et quelle a été ta plus grande victoire sur toi-même ? Quelle force as-tu découverte en toi exactement au moment où tout semblait perdu ?', data_i18n: 'q25_superacao' },
    { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'De quoi as-tu le plus peur aujourd\'hui ? Si tu prends le temps de l\'écouter, qu\'est-ce que cette peur essaie de te montrer ?', data_i18n: 'q26_medos' },
    { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Pourquoi crois-tu qu\'à un moment donné, tu as cessé de te mettre en priorité ? Quand as-tu reçu, pour la dernière fois, un compliment qui t\'a vraiment touché ?', data_i18n: 'q27_esquecimento_de_si' },
    { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Pourquoi as-tu souvent du mal à te traiter comme une priorité — même en sachant que tu en as besoin ?', data_i18n: 'q28_prioridade' },
    { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: 'As-tu l\'habitude de te reconnaître et de te féliciter toi-même, sans dépendre de la validation de qui que ce soit ? Dans quels moments cela arrive-t-il vraiment ?', data_i18n: 'q29_autoestima' },
    { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'Te vois-tu comme quelqu\'un qui aide les rêves — les tiens et ceux des autres — à naître, ou comme quelqu\'un qui, sans s\'en rendre compte, a enterré ces rêves en chemin ?', data_i18n: 'q30_sonhos' }
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
    { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'Après avoir regardé tes peurs et tes rêves enterrés : quel est ton plus grand rêve aujourd\'hui — celui qui te fait sourire juste en l\'imaginant ?', data_i18n: 'q31_maior_sonho' },
    { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'Qu\'est-ce qui, selon toi, t\'empêche de le réaliser ? Ces barrières viennent-elles de l\'intérieur, de l\'extérieur, ou des deux à la fois ?', data_i18n: 'q32_barreiras' },
    { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'Sens-tu que tu vis déjà ton but, ou es-tu encore à sa recherche — sans savoir exactement par où continuer ?', data_i18n: 'q33_proposito' },
    { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'Existe-t-il un appel intérieur, une envie silencieuse, que tu ignores sans cesse, même en sachant qu\'elle pulse encore en toi ?', data_i18n: 'q34_chamado_interior' },
    { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'Revenant à tes peurs : à quelle situation ou sentiment spécifique sont-elles réellement liées, au fond ?', data_i18n: 'q35_origem_medos' },
    { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Sens-tu que tu évites de prendre certaines décisions par peur, ou que tu finis par accepter des situations qui te rabaissent juste pour éviter la confrontation ?', data_i18n: 'q36_decisoes_limites' },
    { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'Si quelqu\'un se trouvait devant toi en ce moment, souffrant profondément, que lui dirais-tu — et pourrais-tu te dire la même chose à toi-même ?', data_i18n: 'q37_acolhimento_sofrimento' },
    { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: 'Crois-tu qu\'il existe une vie au-delà de notre planète, ou que toute existence se limite à ce que nous connaissons ici ?', data_i18n: 'q38_vida_alem_terra' },
    { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'Comment aimerais-tu être retenu(e) quand tu ne seras plus ici ? Quel héritage, au-delà des biens ou des mots, souhaites-tu laisser ?', data_i18n: 'q39_legado' },
    { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'Que sont réellement devenus les rêves que tu as eus et que tu n\'as jamais réalisés — sont-ils morts, attendent-ils, ou as-tu simplement cessé d\'y croire ?', data_i18n: 'q40_destino_sonhos' }
  ]
},

{
  sectionId: 'section-perguntas-sintese',
  id: 'sintese',
  index: 4,
  title: 'Bloc 5 — Synthèse et remise',
  data_i18n: 'bloco_sintese_title',
  nextSection: 'section-final',
  transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
  questions: [
    { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'As-tu pleuré souvent ces derniers temps ? Peux-tu identifier, honnêtement, ce qui déclenche vraiment ces pleurs ?', data_i18n: 'q41_choro' },
    { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Ces pleurs naissent-ils d\'un vide intérieur, d\'une perte concrète, ou d\'un regret que tu portes en silence ?', data_i18n: 'q42_origem_choro' },
    { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Quand la douleur arrive, qu\'est-ce qui domine en toi — le silence qui isole, la recherche de quelque chose qui intensifie ce sentiment, ou la colère qui veut exploser ?', data_i18n: 'q43_expressao_dor' },
    { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Ressens-tu seulement une tristesse passagère, ou crois-tu vivre quelque chose de plus profond, comme un état dépressif ? Arrives-tu à distinguer clairement les deux en toi ?', data_i18n: 'q44_tristeza_depressao' },
    { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Si tu reconnais cet état plus profond, as-tu déjà envisagé de chercher une aide professionnelle pour mieux comprendre ce que tu ressens — ou résistes-tu encore à cette étape ?', data_i18n: 'q45_ajuda_profissional' },
    { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'Dans tes relations, te reconnais-tu davantage comme quelqu\'un d\'affirmé (voire agressif), ou plutôt comme quelqu\'un de soumis, qui évite le conflit à tout prix ?', data_i18n: 'q46_comportamento_relacional' },
    { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Y a-t-il des moments où il est même difficile de vivre avec toi-même — en portant du ressentiment ou de la colère pour des décisions que tu considères aujourd\'hui comme des erreurs ?', data_i18n: 'q47_autopercepcao' },
    { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Au fond, te vois-tu comme quelqu\'un d\'intéressant et de valable, ou crois-tu, même secrètement, être quelqu\'un de peu d\'intérêt pour les autres ?', data_i18n: 'q48_autoimagem' },
    { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'As-tu vraiment du mal à dire « non » aux gens — même quand cela signifie te trahir toi-même intérieurement ?', data_i18n: 'q49_limites' },
    { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Pour conclure : as-tu peur de mourir ? Et en étant encore plus honnête — cette peur porte-t-elle sur la mort elle-même, ou sur la manière dont elle pourrait arriver ? Que révèle cette réponse sur tout ce que tu as partagé jusqu\'ici ?', data_i18n: 'q50_morte' }
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
    { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: '¿Quién te crió — tus padres biológicos, solo uno de ellos, otros familiares, padres adoptivos, o alguien fuera de ese círculo? Describe brevemente esa presencia.', data_i18n: 'q01_criacao' },
    { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: '¿Creciste como hijo único o tuviste hermanos? ¿De qué manera esa condición marcó tu forma de verte como individuo — más independiente, más solo, más dividido?', data_i18n: 'q02_filho_unico' },
    { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Si tienes o tuviste hermanos, ¿cuál era (o sería) tu lugar entre ellos — el mayor, el del medio o el menor? ¿Qué peso o ventaja trajo ese lugar a tu historia?', data_i18n: 'q03_irmaos' },
    { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: '¿Hubo hambre o privaciones severas en tu infancia? Si es así, ¿qué huella dejó eso en cómo manejas hoy la escasez, la seguridad o el sentirte merecedor?', data_i18n: 'q04_privacoes' },
    { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: '¿Vives con alguna limitación social, física o cognitiva? ¿Alguna vez sentiste el peso del prejuicio por eso — y cómo se refleja eso en ti hoy?', data_i18n: 'q05_deficiencia' },
    { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: '¿Cuál es tu nivel educativo? Mirando hacia atrás, ¿sientes que invertiste lo suficiente en tu propia formación, o hay un vacío de aprendizaje que todavía te incomoda?', data_i18n: 'q06_escolaridade' },
    { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Tu estado civil actual — soltero, casado, separado, en una relación — ¿te está fortaleciendo o pesando en este momento de tu vida?', data_i18n: 'q07_estado_civil' },
    { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: '¿Recuerdas el instante exacto en que te diste cuenta, por tu cuenta, de que eras alguien único en el mundo? ¿Qué edad tenías, y qué sentiste?', data_i18n: 'q08_identidade' },
    { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: '¿Cuál es tu relación real con el silencio — te incomoda porque expone algo, o te calma porque te devuelve a ti mismo?', data_i18n: 'q09_silencio' },
    { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Si pudieras hablar ahora con el niño que fuiste — el que cargó con todo lo que acabas de contar —, ¿qué le dirías?', data_i18n: 'q10_crianca' }
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
    { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'Después de revisitar tus raíces, ¿cómo has percibido tu propia vida hasta ahora — como un logro, como supervivencia, o como algo aún en suspenso?', data_i18n: 'q11_percepcao_vida' },
    { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: '¿Y la vida de las personas a tu alrededor — la ves con empatía genuina o con distancia y juicio?', data_i18n: 'q12_percepcao_outros' },
    { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: '¿Cómo manejas tus traumas: los enfrentas de frente, o evitas incluso nombrarlos? ¿Puedes hablar de ellos ahora con la misma sinceridad que antes?', data_i18n: 'q13_traumas' },
    { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: '¿Crees que existe una verdad mayor, por encima de todo, o que cada verdad es solo el reflejo de la mirada de quien la ve?', data_i18n: 'q14_verdade' },
    { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: '¿Cuál es tu mayor vicio — declarado o disfrazado? ¿De dónde nació, ya intentaste vencerlo, y existen otros vicios más sutiles, emocionales, que casi nunca admites tener?', data_i18n: 'q15_vicios' },
    { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: '¿Qué representa la enfermedad para ti? ¿Existe alguna condición de salud — física o emocional — atravesándote justo ahora?', data_i18n: 'q16_doenca' },
    { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: '¿Existe alguien a quien te gustaría tener a tu lado en este momento exacto? ¿Qué impide que esa persona esté presente — la distancia, el orgullo, o algo que nunca se dijo?', data_i18n: 'q17_presenca' },
    { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: '¿Cómo percibes la muerte hoy — como miedo, como alivio, o como curiosidad genuina sobre lo que viene después?', data_i18n: 'q18_morte' },
    { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: '¿Crees que la enfermedad puede cargar un significado, un mensaje, o un propósito escondido en ciertos momentos de la vida?', data_i18n: 'q19_doenca_espiritual' },
    { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Yendo más a fondo: ¿crees que algunas enfermedades reflejan sombras internas no resueltas, o forman parte de un proceso de crecimiento espiritual?', data_i18n: 'q20_sentido_doenca' }
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
    { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'Después de todo lo que ya has revelado, ¿cuál es, para ti, el sentido de la vida — existe un propósito mayor guiando todo, o es el azar quien decide?', data_i18n: 'q21_sentido_vida' },
    { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: '¿Crees en Dios, en un ser supremo, en la espiritualidad, o en algo que va más allá de lo que los ojos pueden ver?', data_i18n: 'q22_espiritualidade' },
    { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: '¿Alguna vez has sentido que fuiste guiado por algo invisible? ¿Existe una experiencia marcante que lo compruebe para ti?', data_i18n: 'q23_guia_invisivel' },
    { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: '¿Cuál fue el mayor dolor emocional que has enfrentado — y cuál fue, en verdad, el camino que usaste para atravesarlo?', data_i18n: 'q24_dor_emocional' },
    { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: '¿Y cuál fue tu mayor superación? ¿Qué fuerza descubriste en ti mismo justo en el momento en que todo parecía perdido?', data_i18n: 'q25_superacao' },
    { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: '¿A qué le tienes más miedo hoy? ¿Qué está intentando mostrarte ese miedo si te detienes a escucharlo?', data_i18n: 'q26_medos' },
    { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: '¿Por qué crees que, en algún momento, dejaste de ponerte en primer lugar? ¿Cuándo fue la última vez que recibiste un elogio que realmente te tocó?', data_i18n: 'q27_esquecimento_de_si' },
    { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: '¿Por qué, muchas veces, te cuesta tratarte como una prioridad — aun sabiendo que lo necesitas?', data_i18n: 'q28_prioridade' },
    { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: '¿Sueles reconocerte y elogiarte a ti mismo, sin depender de la validación de nadie? ¿En qué momentos eso realmente sucede?', data_i18n: 'q29_autoestima' },
    { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: '¿Te ves como alguien que ayuda a nacer sueños — tuyos y de otros — o como alguien que, sin darse cuenta, ha ido enterrando esos sueños en el camino?', data_i18n: 'q30_sonhos' }
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
    { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'Después de mirar tus miedos y sueños enterrados: ¿cuál es tu mayor sueño hoy — el que te hace sonreír solo con imaginarlo?', data_i18n: 'q31_maior_sonho' },
    { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: '¿Qué crees que te impide realizarlo? ¿Esas barreras vienen de adentro, de afuera, o de ambas cosas a la vez?', data_i18n: 'q32_barreiras' },
    { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: '¿Sientes que ya estás viviendo tu propósito, o todavía estás en su búsqueda — sin saber exactamente por dónde seguir?', data_i18n: 'q33_proposito' },
    { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: '¿Existe un llamado interior, una voluntad silenciosa, que has ignorado repetidamente, aun sabiendo que todavía late en ti?', data_i18n: 'q34_chamado_interior' },
    { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'Volviendo a tus miedos: ¿a qué situación o sentimiento específico están realmente ligados, en el fondo?', data_i18n: 'q35_origem_medos' },
    { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: '¿Sientes que dejas de tomar ciertas decisiones por miedo, o que terminas aceptando situaciones que te disminuyen solo para evitar el enfrentamiento?', data_i18n: 'q36_decisoes_limites' },
    { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'Si alguien estuviera frente a ti ahora, sufriendo profundamente, ¿qué le dirías — y podrías decirte lo mismo a ti mismo?', data_i18n: 'q37_acolhimento_sofrimento' },
    { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: '¿Crees que existe vida más allá de nuestro planeta, o que toda la existencia se limita a lo que conocemos aquí?', data_i18n: 'q38_vida_alem_terra' },
    { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: '¿Cómo te gustaría ser recordado cuando ya no estés aquí? ¿Qué legado, más allá de bienes o palabras, deseas dejar?', data_i18n: 'q39_legado' },
    { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: '¿Qué pasó realmente con los sueños que tuviste y nunca llegaste a realizar — murieron, esperan, o simplemente dejaste de creer en ellos?', data_i18n: 'q40_destino_sonhos' }
  ]
},

{
  sectionId: 'section-perguntas-sintese',
  id: 'sintese',
  index: 4,
  title: 'Bloque 5 — Síntesis y entrega',
  data_i18n: 'bloco_sintese_title',
  nextSection: 'section-final',
  transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
  questions: [
    { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: '¿Has estado llorando con frecuencia últimamente? ¿Puedes identificar, con honestidad, qué es lo que realmente dispara ese llanto?', data_i18n: 'q41_choro' },
    { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: '¿Ese llanto nace de un vacío interior, de una pérdida concreta, o de un arrepentimiento que cargas en silencio?', data_i18n: 'q42_origem_choro' },
    { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Cuando llega el dolor, ¿qué predomina en ti — el silencio que aísla, la búsqueda de algo que intensifique ese sentimiento, o la rabia que quiere estallar?', data_i18n: 'q43_expressao_dor' },
    { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: '¿Sientes solo tristeza pasajera, o crees que estás viviendo algo más profundo, como un estado depresivo? ¿Puedes distinguir claramente las dos cosas en ti?', data_i18n: 'q44_tristeza_depressao' },
    { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Si reconoces ese estado más profundo, ¿ya has considerado buscar ayuda profesional para entender mejor lo que sientes — o aún te resistes a ese paso?', data_i18n: 'q45_ajuda_profissional' },
    { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'En tus relaciones, ¿te reconoces más como alguien asertivo (o incluso agresivo), o más como alguien sumiso, que evita el conflicto a cualquier costo?', data_i18n: 'q46_comportamento_relacional' },
    { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: '¿Existen momentos en que es difícil incluso convivir contigo mismo — cargando rencor o rabia por decisiones que hoy consideras equivocadas?', data_i18n: 'q47_autopercepcao' },
    { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'En el fondo, ¿te ves como alguien interesante y valioso, o crees, aunque sea en secreto, ser alguien de poco interés para los demás?', data_i18n: 'q48_autoimagem' },
    { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: '¿Tienes dificultad real para decir "no" a las personas — incluso cuando eso significa traicionarte por dentro?', data_i18n: 'q49_limites' },
    { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Para cerrar: ¿tienes miedo de morir? Y siendo aún más honesto — ¿ese miedo está en la muerte en sí, o en la forma en que puede ocurrir? ¿Qué revela esa respuesta sobre todo lo que has compartido hasta aquí?', data_i18n: 'q50_morte' }
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
    { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Wer hat dich aufgezogen — deine biologischen Eltern, nur einer von ihnen, andere Verwandte, Adoptiveltern, oder jemand außerhalb dieses Kreises? Beschreibe diese Präsenz kurz.', data_i18n: 'q01_criacao' },
    { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'Bist du als Einzelkind aufgewachsen oder hattest du Geschwister? Wie hat das deine Art geprägt, dich als Individuum zu sehen — unabhängiger, einsamer, zerrissener?', data_i18n: 'q02_filho_unico' },
    { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Wenn du Geschwister hast oder hattest, welchen Platz hattest (oder hättest) du unter ihnen — der Älteste, der Mittlere oder der Jüngste? Welches Gewicht oder welchen Vorteil hat dieser Platz deiner Geschichte gebracht?', data_i18n: 'q03_irmaos' },
    { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Gab es in deiner Kindheit Hunger oder schwere Entbehrungen? Wenn ja, welche Spur hat das darin hinterlassen, wie du heute mit Knappheit, Sicherheit oder Selbstwert umgehst?', data_i18n: 'q04_privacoes' },
    { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Lebst du mit einer sozialen, körperlichen oder kognitiven Einschränkung? Hast du je das Gewicht von Vorurteilen deswegen gespürt — und wie spiegelt sich das heute in dir wider?', data_i18n: 'q05_deficiencia' },
    { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'Was ist dein Bildungsstand? Wenn du zurückblickst, hast du das Gefühl, genug in deine eigene Bildung investiert zu haben, oder gibt es eine Lücke, die dich noch stört?', data_i18n: 'q06_escolaridade' },
    { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Beeinflusst dein aktueller Beziehungsstatus — allein, verheiratet, getrennt, in einer Beziehung — dich gerade eher stärkend oder belastend?', data_i18n: 'q07_estado_civil' },
    { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Erinnerst du dich an den genauen Moment, in dem dir selbst klar wurde, dass du jemand Einzigartiges auf der Welt bist? Wie alt warst du, und was hast du gefühlt?', data_i18n: 'q08_identidade' },
    { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: 'Wie ist deine wahre Beziehung zur Stille — stört sie dich, weil sie etwas offenlegt, oder beruhigt sie dich, weil sie dich zu dir selbst zurückbringt?', data_i18n: 'q09_silencio' },
    { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Wenn du jetzt mit dem Kind sprechen könntest, das du warst — dem, das all das getragen hat, was du gerade erzählt hast — was würdest du ihm sagen?', data_i18n: 'q10_crianca' }
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
    { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'Nachdem du deine Wurzeln noch einmal betrachtet hast: Wie hast du dein eigenes Leben bisher wahrgenommen — als Erfolg, als Überleben, oder als etwas, das noch in der Schwebe ist?', data_i18n: 'q11_percepcao_vida' },
    { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'Und das Leben der Menschen um dich herum — siehst du es mit echter Empathie oder mit Distanz und Urteil?', data_i18n: 'q12_percepcao_outros' },
    { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'Wie gehst du mit deinen Traumata um: stellst du dich ihnen direkt, oder vermeidest du es sogar, sie zu benennen? Kannst du jetzt darüber sprechen, mit derselben Ehrlichkeit wie früher?', data_i18n: 'q13_traumas' },
    { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'Glaubst du, dass es eine größere Wahrheit über allem gibt, oder dass jede Wahrheit nur ein Spiegelbild des Blicks ist, der sie sieht?', data_i18n: 'q14_verdade' },
    { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'Was ist dein größtes Laster — offen gezeigt oder versteckt? Wo kommt es her, hast du schon versucht, es zu überwinden, und gibt es subtilere, emotionale Laster, die du kaum zugibst zu haben?', data_i18n: 'q15_vicios' },
    { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'Was bedeutet Krankheit für dich? Gibt es gerade eine gesundheitliche Situation — körperlich oder emotional — die dich durchzieht?', data_i18n: 'q16_doenca' },
    { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: 'Gibt es jemanden, den du dir gerade an deiner Seite wünschen würdest? Was hält diese Person davon ab, präsent zu sein — Entfernung, Stolz, oder etwas, das nie gesagt wurde?', data_i18n: 'q17_presenca' },
    { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'Wie nimmst du den Tod heute wahr — als Angst, als Erleichterung, oder als echte Neugier auf das, was danach kommt?', data_i18n: 'q18_morte' },
    { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'Glaubst du, dass Krankheit eine Bedeutung, eine Botschaft oder einen verborgenen Zweck in bestimmten Lebensmomenten tragen kann?', data_i18n: 'q19_doenca_espiritual' },
    { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Noch tiefer: Denkst du, dass manche Krankheiten ungelöste innere Schatten widerspiegeln, oder Teil eines spirituellen Wachstumsprozesses sind?', data_i18n: 'q20_sentido_doenca' }
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
    { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'Nach allem, was du bereits offenbart hast: Was ist für dich der Sinn des Lebens — gibt es einen größeren Zweck, der alles leitet, oder entscheidet der Zufall?', data_i18n: 'q21_sentido_vida' },
    { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Glaubst du an Gott, an ein höheres Wesen, an Spiritualität, oder an etwas, das über das hinausgeht, was die Augen sehen können?', data_i18n: 'q22_espiritualidade' },
    { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'Hast du je das Gefühl gehabt, von etwas Unsichtbarem geleitet zu werden? Gibt es eine eindrückliche Erfahrung, die dir das beweist?', data_i18n: 'q23_guia_invisivel' },
    { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'Was war der größte emotionale Schmerz, dem du je begegnet bist — und welchen Weg hast du tatsächlich benutzt, um ihn zu durchqueren?', data_i18n: 'q24_dor_emocional' },
    { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'Und was war dein größter Triumph? Welche Kraft hast du in dir entdeckt, genau in dem Moment, als alles verloren schien?', data_i18n: 'q25_superacao' },
    { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'Wovor hast du heute am meisten Angst? Was versucht dir diese Angst zu zeigen, wenn du dir Zeit nimmst, sie zu hören?', data_i18n: 'q26_medos' },
    { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Warum glaubst du, dass du irgendwann aufgehört hast, dich selbst an erste Stelle zu setzen? Wann hast du zuletzt ein Kompliment bekommen, das dich wirklich berührt hat?', data_i18n: 'q27_esquecimento_de_si' },
    { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Warum fällt es dir oft schwer, dich selbst als Priorität zu behandeln — obwohl du weißt, dass du es brauchst?', data_i18n: 'q28_prioridade' },
    { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: 'Erkennst und lobst du dich selbst, ohne von der Bestätigung anderer abhängig zu sein? In welchen Momenten passiert das wirklich?', data_i18n: 'q29_autoestima' },
    { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'Siehst du dich als jemanden, der Träume — deine eigenen und die anderer — zum Leben erweckt, oder als jemanden, der, ohne es zu merken, diese Träume auf dem Weg begraben hat?', data_i18n: 'q30_sonhos' }
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
    { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'Nachdem du deine Ängste und begrabenen Träume betrachtet hast: Was ist heute dein größter Traum — der, der dich schon beim bloßen Vorstellen lächeln lässt?', data_i18n: 'q31_maior_sonho' },
    { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'Was glaubst du, hält dich davon ab, ihn zu verwirklichen? Kommen diese Barrieren von innen, von außen, oder von beidem gleichzeitig?', data_i18n: 'q32_barreiras' },
    { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'Hast du das Gefühl, deinen Zweck bereits zu leben, oder bist du noch auf der Suche danach — ohne genau zu wissen, wie es weitergeht?', data_i18n: 'q33_proposito' },
    { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'Gibt es einen inneren Ruf, einen stillen Wunsch, den du immer wieder ignorierst, auch wenn du weißt, dass er noch in dir pulsiert?', data_i18n: 'q34_chamado_interior' },
    { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'Zurück zu deinen Ängsten: Mit welcher konkreten Situation oder Gefühl sind sie im Grunde wirklich verbunden?', data_i18n: 'q35_origem_medos' },
    { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Hast du das Gefühl, bestimmte Entscheidungen aus Angst zu vermeiden, oder Situationen zu akzeptieren, die dich herabsetzen, nur um Konfrontation zu vermeiden?', data_i18n: 'q36_decisoes_limites' },
    { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'Wenn jemand jetzt vor dir stünde und tief leiden würde, was würdest du ihm sagen — und könntest du dir selbst dasselbe sagen?', data_i18n: 'q37_acolhimento_sofrimento' },
    { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: 'Glaubst du, dass es Leben außerhalb unseres Planeten gibt, oder dass sich die gesamte Existenz auf das beschränkt, was wir hier kennen?', data_i18n: 'q38_vida_alem_terra' },
    { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'Wie möchtest du in Erinnerung bleiben, wenn du nicht mehr hier bist? Welches Vermächtnis, jenseits von Besitz oder Worten, möchtest du hinterlassen?', data_i18n: 'q39_legado' },
    { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'Was ist eigentlich aus den Träumen geworden, die du hattest und nie erfüllt hast — sind sie gestorben, warten sie, oder hast du einfach aufgehört, an sie zu glauben?', data_i18n: 'q40_destino_sonhos' }
  ]
},

{
  sectionId: 'section-perguntas-sintese',
  id: 'sintese',
  index: 4,
  title: 'Block 5 — Synthese und Übergabe',
  data_i18n: 'bloco_sintese_title',
  nextSection: 'section-final',
  transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
  questions: [
    { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'Hast du in letzter Zeit oft geweint? Kannst du ehrlich benennen, was dieses Weinen wirklich auslöst?', data_i18n: 'q41_choro' },
    { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Entsteht dieses Weinen aus einer inneren Leere, aus einem konkreten Verlust, oder aus einem Bedauern, das du im Stillen trägst?', data_i18n: 'q42_origem_choro' },
    { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Wenn der Schmerz kommt, was überwiegt bei dir — die Stille, die isoliert, die Suche nach etwas, das dieses Gefühl verstärkt, oder die Wut, die explodieren will?', data_i18n: 'q43_expressao_dor' },
    { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Fühlst du nur vorübergehende Traurigkeit, oder glaubst du, etwas Tieferes zu erleben, wie einen depressiven Zustand? Kannst du die beiden klar in dir unterscheiden?', data_i18n: 'q44_tristeza_depressao' },
    { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Wenn du diesen tieferen Zustand erkennst, hast du schon erwogen, professionelle Hilfe zu suchen, um besser zu verstehen, was du fühlst — oder widersetzt du dich diesem Schritt noch?', data_i18n: 'q45_ajuda_profissional' },
    { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'In deinen Beziehungen: Siehst du dich eher als durchsetzungsfähig (oder sogar aggressiv), oder eher als unterwürfig, der Konflikte um jeden Preis vermeidet?', data_i18n: 'q46_comportamento_relacional' },
    { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Gibt es Momente, in denen es sogar schwierig ist, mit dir selbst zu leben — weil du Groll oder Wut über Entscheidungen trägst, die du heute für falsch hältst?', data_i18n: 'q47_autopercepcao' },
    { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Siehst du dich im Grunde als jemanden Interessanten und Wertvollen, oder glaubst du, auch wenn nur heimlich, jemand von geringem Interesse für andere zu sein?', data_i18n: 'q48_autoimagem' },
    { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'Fällt es dir wirklich schwer, „nein" zu Menschen zu sagen — selbst wenn das bedeutet, dich innerlich selbst zu verraten?', data_i18n: 'q49_limites' },
    { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Zum Abschluss: Hast du Angst vor dem Tod? Und noch ehrlicher — liegt diese Angst im Tod selbst, oder in der Art, wie er geschehen könnte? Was verrät diese Antwort über alles, was du bisher geteilt hast?', data_i18n: 'q50_morte' }
  ]
 }
],

    'ja-JP': [

{
  sectionId: 'section-perguntas-raizes',
  id: 'raizes',
  index: 0,
  title: 'ブロック1 — ルーツ',
  data_i18n: 'bloco_raizes_title',
  nextSection: 'section-perguntas-reflexoes',
  transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
  questions: [
    { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'あなたを育てたのは誰ですか——実の両親、そのうちの一人だけ、他の親族、養父母、それともその輪の外にいる誰かですか？その存在について簡単に教えてください。', data_i18n: 'q01_criacao' },
    { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'あなたは一人っ子として育ちましたか、それは兄弟姉妹がいましたか？その状況は、あなたが自分自身を個人としてどう見るか——より独立的に、より孤独に、より分裂した感じに——どう影響しましたか？', data_i18n: 'q02_filho_unico' },
    { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: '兄弟姉妹がいる（いた）場合、あなたはその中でどの立場でしたか（または、なるはずでしたか）——長子、中間、それとも末っ子？その立場は、あなたの物語にどんな重みや利点をもたらしましたか？', data_i18n: 'q03_irmaos' },
    { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: '子供の頃、ひどい飢えや欠乏を経験しましたか？もしそうなら、それは今のあなたが欠乏や安心感、価値を感じることにどんな影響を残しましたか？', data_i18n: 'q04_privacoes' },
    { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'あなたは何か社会的、身体的、または認知的な制約を抱えて生きていますか？そのために偏見の重さを感じたことはありますか——それは今のあなたにどう反映されていますか？', data_i18n: 'q05_deficiencia' },
    { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'あなたの学歴はどのくらいですか？振り返ってみて、自分自身の教育に十分な投資をしたと感じますか、それとも今も気になる学びの空白がありますか？', data_i18n: 'q06_escolaridade' },
    { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'あなたの現在の結婚・恋愛状況——独身、結婚、別居、交際中——は、今のあなたを強めていますか、それとも重荷になっていますか？', data_i18n: 'q07_estado_civil' },
    { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: '自分が世界で唯一無二の存在だと自分自身で気づいた、その正確な瞬間を覚えていますか？何歳のときで、何を感じましたか？', data_i18n: 'q08_identidade' },
    { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: '静寂との本当の関係はどんなものですか——それは何かを露呈させるから不安になりますか、それとも自分自身へ戻してくれるから安心しますか？', data_i18n: 'q09_silencio' },
    { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'もし今、あなたがかつてだった子供に話しかけられるなら——今話してくれたすべてを抱えてきたその子に——何を伝えますか？', data_i18n: 'q10_crianca' }
  ]
},

{
  sectionId: 'section-perguntas-reflexoes',
  id: 'reflexoes',
  index: 1,
  title: 'ブロック2 — 振り返り',
  data_i18n: 'bloco_reflexoes_title',
  nextSection: 'section-perguntas-crescimento',
  transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
  questions: [
    { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: '自分のルーツを振り返った後、これまでの自分の人生をどう捉えていますか——達成として、生き残りとして、それともまだ宙に浮いた何かとして？', data_i18n: 'q11_percepcao_vida' },
    { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'そして、周りの人たちの人生については——本当の共感を持って見ていますか、それとも距離感や評価を持って見ていますか？', data_i18n: 'q12_percepcao_outros' },
    { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'トラウマにどう対処していますか：正面から向き合いますか、それとも名前をつけることさえ避けますか？以前と同じ誠実さで、今それについて話せますか？', data_i18n: 'q13_traumas' },
    { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'すべてを超える大きな真実が存在すると信じていますか、それとも真実はそれを見る者の視点の反映に過ぎないと思いますか？', data_i18n: 'q14_verdade' },
    { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'あなたの最大の悪癖は何ですか——認めているものか、隠しているものか？それはどこから来て、克服しようとしたことはありますか、そして、あまり認めていないもっと微妙で感情的な悪癖はありますか？', data_i18n: 'q15_vicios' },
    { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: '病気はあなたにとって何を意味しますか？今まさに、身体的または感情的な健康状態を経験していますか？', data_i18n: 'q16_doenca' },
    { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: '今この瞬間、隣にいてほしい人はいますか？その人を今そこにいさせないもの——距離、プライド、それとも決して言われなかった何か——は何ですか？', data_i18n: 'q17_presenca' },
    { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: '今、死をどう感じていますか——恐怖として、安堵として、それともその先に何があるのかへの純粋な興味として？', data_i18n: 'q18_morte' },
    { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: '病気は人生のある時に、意味やメッセージ、または隠れた目的を持つことがあると信じますか？', data_i18n: 'q19_doenca_espiritual' },
    { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'さらに深く：一部の病気は解決されていない内なる影を反映している、あるいは精神的成長のプロセスの一部だと思いますか？', data_i18n: 'q20_sentido_doenca' }
  ]
},

{
  sectionId: 'section-perguntas-crescimento',
  id: 'crescimento',
  index: 2,
  title: 'ブロック3 — 成長',
  data_i18n: 'bloco_crescimento_title',
  nextSection: 'section-perguntas-integracao',
  transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
  questions: [
    { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'すでに語ってきたすべての後で、あなたにとって人生の意味とは何ですか——すべてを導く大きな目的があるのか、それとも偶然が決めるのか？', data_i18n: 'q21_sentido_vida' },
    { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: '神、あるいは至高の存在、スピリチュアリティ、または目に見えるものを超えた何かを信じますか？', data_i18n: 'q22_espiritualidade' },
    { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: '目に見えない何かに導かれていると感じたことはありますか？それを証明する印象的な経験はありますか？', data_i18n: 'q23_guia_invisivel' },
    { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'これまでに経験した最大の感情的な痛みは何でしたか——そして実際にそれを乗り越えるために使った道は何でしたか？', data_i18n: 'q24_dor_emocional' },
    { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'そして、あなたの最大の克服は何でしたか？すべてが失われたと思えたその瞬間に、あなたは自分の中にどんな力を見出しましたか？', data_i18n: 'q25_superacao' },
    { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: '今、最も恐れているものは何ですか？その恐れに耳を傾けたら、それはあなたに何を示そうとしていますか？', data_i18n: 'q26_medos' },
    { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'ある時点で自分を優先することをやめてしまったのはなぜだと思いますか？本当に心に響く褒め言葉を最後に受けたのはいつですか？', data_i18n: 'q27_esquecimento_de_si' },
    { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: '多くの場合、自分を優先することが難しいのはなぜだと思いますか——それが必要だと分かっていても？', data_i18n: 'q28_prioridade' },
    { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: '誰の承認にも頼らず、自分自身を認めて褒めることはよくありますか？それが実際に起こるのはどんな瞬間ですか？', data_i18n: 'q29_autoestima' },
    { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'あなたは自分自身や他人の夢が生まれるのを助ける人だと思いますか、それとも、気づかないうちに、その夢を道の途中で埋めてしまった人だと思いますか？', data_i18n: 'q30_sonhos' }
  ]
},

{
  sectionId: 'section-perguntas-integracao',
  id: 'integracao',
  index: 3,
  title: 'ブロック4 — 統合',
  data_i18n: 'bloco_integracao_title',
  nextSection: 'section-perguntas-sintese',
  transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
  questions: [
    { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: '恐れと埋もれた夢を見つめた後、今のあなたの最大の夢は何ですか——想像するだけで笑顔になるものは？', data_i18n: 'q31_maior_sonho' },
    { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'それを実現することを妨げているのは何だと思いますか？その障壁は内側から来るのか、外側から来るのか、それとも両方からですか？', data_i18n: 'q32_barreiras' },
    { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'すでに自分の目的を生きていると感じますか、それともまだそれを探している最中で、どう進めばいいか正確にはわからない状態ですか？', data_i18n: 'q33_proposito' },
    { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'まだ脈打っていると知っていても、あなたが繰り返し無視している内なる呼び声、静かな願望はありますか？', data_i18n: 'q34_chamado_interior' },
    { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'あなたの恐れに戻りましょう：それらは実際には、どんな具体的な状況や感情に結びついていますか？', data_i18n: 'q35_origem_medos' },
    { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: '恐れのために特定の決断を避けている、あるいは対立を避けるためだけに自分を軽んじる状況を受け入れてしまっていると感じますか？', data_i18n: 'q36_decisoes_limites' },
    { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: '今、誰かがあなたの前で深く苦しんでいたら、その人に何を言いますか——そして自分自身にも同じことを言えますか？', data_i18n: 'q37_acolhimento_sofrimento' },
    { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: '私たちの惑星の外に生命があると信じますか、それとも存在のすべてがここで知っているものに限られると思いますか？', data_i18n: 'q38_vida_alem_terra' },
    { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'もうここにいなくなったとき、どう覚えられたいですか？財産や言葉を超えて、どんな遺産を残したいですか？', data_i18n: 'q39_legado' },
    { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: '実現しなかった夢に、実際に何が起きたのですか——それらは死んでしまったのか、待っているのか、それとも単に信じることをやめたのですか？', data_i18n: 'q40_destino_sonhos' }
  ]
},

{
  sectionId: 'section-perguntas-sintese',
  id: 'sintese',
  index: 4,
  title: 'ブロック5 — 統合と締めくくり',
  data_i18n: 'bloco_sintese_title',
  nextSection: 'section-final',
  transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
  questions: [
    { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: '最近、頻繁に泣いていますか？その涙を本当に引き起こしているものを、正直に見極めることはできますか？', data_i18n: 'q41_choro' },
    { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'その涙は内なる空虚さ、具体的な喪失、それとも静かに抱えている後悔から来ていますか？', data_i18n: 'q42_origem_choro' },
    { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: '痛みが訪れるとき、あなたの中で優勢になるのは何ですか——孤立させる沈黙、その感情を強める何かを探す行動、それとも爆発したがる怒りですか？', data_i18n: 'q43_expressao_dor' },
    { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'あなたが感じているのは一時的な悲しみだけですか、それともうつ状態のような、もっと深いものを経験していると思いますか？その二つをはっきりと自分の中で区別できますか？', data_i18n: 'q44_tristeza_depressao' },
    { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'もしその深い状態を自分の中に認めているなら、感じていることをより理解するために専門的な助けを求めることをすでに考えましたか——それとも、その一歩にまだ抵抗していますか？', data_i18n: 'q45_ajuda_profissional' },
    { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'あなたの人間関係において、自分をより主張的な人（あるいは攻撃的な人）だと思いますか、それとも何としても対立を避ける従順な人だと思いますか？', data_i18n: 'q46_comportamento_relacional' },
    { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: '自分自身と一緒にいることさえ難しい瞬間はありますか——今では間違いだったと考える決断に対する恨みや怒りを抱えていますか？', data_i18n: 'q47_autopercepcao' },
    { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: '心の奥では、自分を興味深く価値のある人間だと見ていますか、それとも、密かにでも、他人にとってあまり興味を持たれない人間だと信じていますか？', data_i18n: 'q48_autoimagem' },
    { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: '人に「いいえ」と言うことに本当に苦労していますか——それが内心で自分自身を裏切ることを意味してでも？', data_i18n: 'q49_limites' },
    { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: '最後に：死ぬことを恐れていますか？そして、さらに正直に言うと——その恐れは死そのものにあるのか、それがどのように起こるかという方法にあるのか？その答えは、これまで共有してきたすべてについて何を明らかにしますか？', data_i18n: 'q50_morte' }
  ]
 }
],

    'zh-CN': [
    {
      sectionId: 'section-perguntas-raizes',
      id: 'raizes',
      index: 0,
      title: '第一部分 — 根源',
      data_i18n: 'bloco_raizes_title',
      nextSection: 'section-perguntas-reflexoes',
      transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      questions: [
        {
          number: 1,
          block: 1,
          theme: 'criacao_familiar',
          id: 'q01_criacao',
          label: '您是由谁抚养长大的？亲生父母、单亲、亲戚、养父母还是其他人？',
          data_i18n: 'q01_criacao'
        },
        {
          number: 2,
          block: 1,
          theme: 'individualidade',
          id: 'q02_filho_unico',        
          label: '您是独生子女还是有兄弟姐妹？这一现实如何塑造了您的独立个体意识？',
          data_i18n: 'q02_filho_unico'
        },
        {
          number: 3,
          block: 1,
          theme: 'irmaos',
          id: 'q03_irmaos',        
          label: '如果您有（或曾有）兄弟姐妹，共有几个？您在他们当中处于（或本应处于）什么位置：长子/长女、排行中间还是老幺？',
          data_i18n: 'q03_irmaos'
        },
        {
          number: 4,
          block: 1,
          theme: 'privacoes',
          id: 'q04_privacoes',        
          label: '您在童年时期是否经历过饥饿或严重的匮乏？这如何影响了您看待生活的方式？',
          data_i18n: 'q04_privacoes'
        },
        {
          number: 5,
          block: 1,
          theme: 'deficiencia',
          id: 'q05_deficiencia',        
          label: '您是否存在某种社交、身体或认知上的障碍？您是否曾因此遭受过偏见？',
          data_i18n: 'q05_deficiencia'
        },
        {
          number: 6,
          block: 1,
          theme: 'escolaridade',
          id: 'q06_escolaridade',        
          label: '您的受教育程度如何？您如何评价自己在个人成长与教育上的投入？',
          data_i18n: 'q06_escolaridade'
        },
        {
          number: 7,
          block: 1,
          theme: 'estado_civil',
          id: 'q07_estado_civil',        
          label: '您目前的婚姻或情感状态如何影响着您当下的生活阶段？',
          data_i18n: 'q07_estado_civil'
        },
        {
          number: 8,
          block: 1,
          theme: 'identidade',
          id: 'q08_identidade',        
          label: '您还记得自己第一次意识到自己是这个世界上独一无二的个体的时刻吗？当时您几岁？',
          data_i18n: 'q08_identidade'
        },
        {
          number: 9,
          block: 1,
          theme: 'silencio',
          id: 'q09_silencio',        
          label: '您与“寂静”的关系是怎样的？它会让您感到内心不安，还是能让您平静下来？',
          data_i18n: 'q09_silencio'
        },
        {
          number: 10,
          block: 1,
          theme: 'crianca_interior',
          id: 'q10_crianca',        
          label: '如果您能与依旧居住在您内心的那个孩子对话，您会对他/她倾诉些什么？',
          data_i18n: 'q10_crianca'
        }
      ]   
    },
    {
      sectionId: 'section-perguntas-reflexoes',
      id: 'reflexoes',
      index: 1,
      title: '第二部分 — 内省',
      data_i18n: 'bloco_reflexoes_title',
      nextSection: 'section-perguntas-crescimento',
      transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      questions: [
        {
          number: 11,
          block: 2,
          theme: 'vida',
          id: 'q11_percepcao_vida',
          label: '走到今天，您是如何看待和感知自己过往的人生路程的？',
          data_i18n: 'q11_percepcao_vida'
        },
        {
          number: 12,
          block: 2,
          theme: 'empatia',
          id: 'q12_percepcao_outros',    
          label: '您是如何看待周围其他人的生活的？',
          data_i18n: 'q12_percepcao_outros'
        },
        {
          number: 13,
          block: 2,
          theme: 'traumas',
          id: 'q13_traumas',    
          label: '您是如何应对自己的心理创伤的？您能够坦然地谈论它们吗？',
          data_i18n: 'q13_traumas'
        },
        {
          number: 14,
          block: 2,
          theme: 'verdade',
          id: 'q14_verdade',    
          label: '您相信存在一个更高的绝对真理，还是认为一切都仅仅取决于每个人的主观视角？',
          data_i18n: 'q14_verdade'
        },
        {
          number: 15,
          block: 2,
          theme: 'vicios',
          id: 'q15_vicios',    
          label: '您最大的恶习、瘾好或执念是什么？您认为它是因何而生的？您曾尝试去战胜它吗？您是否也察觉到自己内心其他更隐蔽或情感上的依赖？',
          data_i18n: 'q15_vicios'
        },
        {
          number: 16,
          block: 2,
          theme: 'doenca',
          id: 'q16_doenca',    
          label: '对您而言，疾病象征着什么？您目前是否正面临着某种健康状况的困扰？',
          data_i18n: 'q16_doenca'
        },
        {
          number: 17,
          block: 2,
          theme: 'solidao',
          id: 'q17_presenca',    
          label: '此时此刻，是否有哪个人是您特别希望他/她陪伴在身边的？为什么那个人不在这里？',
          data_i18n: 'q17_presenca'
        },
        {
          number: 18,
          block: 2,
          theme: 'morte',
          id: 'q18_morte',    
          label: '您是如何看待死亡的？它唤起的是您的恐惧、慰藉还是好奇心？',
          data_i18n: 'q18_morte'
        },
        {
          number: 19,
          block: 2,
          theme: 'espiritualidade',
          id: 'q19_doenca_espiritual',
          label: '您对疾病的理解是怎样的？在生命中的某些特定时刻，它是否可能带有某种意义或目的？',
          data_i18n: 'q19_doenca_espiritual'
        },
        {
          number: 20,
          block: 2,
          theme: 'sentido_doenca',
          id: 'q20_sentido_doenca',
          label: '您是否相信某些疾病可能反映了内在的阴影，或是精神与灵性成长过程中的一部分？',    
          data_i18n: 'q20_sentido_doenca'
        }
      ]
    },
    {
      sectionId: 'section-perguntas-crescimento',
      id: 'crescimento',
      index: 2,
      title: '第三部分 — 成长',
      data_i18n: 'bloco_crescimento_title',
      nextSection: 'section-perguntas-integracao',
      transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      questions: [
        {
          number: 21,
          block: 3,
          theme: 'sentido_da_vida',
          id: 'q21_sentido_vida',
          label: '您是如何理解生命的意义的？是否存在一个更高的宿命与目的，还是说一切都只是偶然发生的？',
          data_i18n: 'q21_sentido_vida'
        },
        {
          number: 22,
          block: 3,
          theme: 'espiritualidade',
          id: 'q22_espiritualidade',
          label: '您是否相信上帝、至高无上的存在、灵性，或是某些超越我们肉眼可见的事物？',
          data_i18n: 'q22_espiritualidade'
        },
        {
          number: 23,
          block: 3,
          theme: 'experiencia_espiritual',
          id: 'q23_guia_invisivel',
          label: '您是否曾感到被某种无形的力量所指引？能否分享一次刻骨铭心的经历？',
          data_i18n: 'q23_guia_invisivel'
        },
        {
          number: 24,
          block: 3,
          theme: 'dor_emocional',
          id: 'q24_dor_emocional',
          label: '您曾经历过的最大的情感痛苦是什么？您是如何设法去面对和渡过难关的？',
          data_i18n: 'q24_dor_emocional'
        },
        {
          number: 25,
          block: 3,
          theme: 'superacao',
          id: 'q25_superacao',
          label: '您一生中最大的超越与蜕变是什么？在那一刻，您在自己内心深处发现了怎样的力量？',
          data_i18n: 'q25_superacao'
        },
        {
          number: 26,
          block: 3,
          theme: 'medos',
          id: 'q26_medos',
          label: '今天您最恐惧的是什么？这种恐惧可能试图在向您昭示些什么？',
          data_i18n: 'q26_medos'
        },
        {
          number: 27,
          block: 3,
          theme: 'autocuidado',
          id: 'q27_esquecimento_de_si',
          label: '为什么您认为自己最终会迷失并遗忘了自我？上一次您收到让您真正铭记在心的由衷赞美是在什么时候？',
          data_i18n: 'q27_esquecimento_de_si'
        },
        {
          number: 28,
          block: 3,
          theme: 'prioridade_pessoal',
          id: 'q28_prioridade',
          label: '您认为自己为什么常常无法将自我放在第一位去珍视？',
          data_i18n: 'q28_prioridade'
        },
        {
          number: 29,
          block: 3,
          theme: 'autoestima',
          id: 'q29_autoestima',
          label: '您经常有意识地去认可并赞美自己吗？这通常发生在哪些时刻？',
          data_i18n: 'q29_autoestima'
        },
        {
          number: 30,
          block: 3,
          theme: 'sonhos',
          id: 'q30_sonhos',
          label: '您觉得自己是一个助力他人梦想诞生的人，还是一个在不知不觉中亲手埋葬了自己和他人梦想的人？',
          data_i18n: 'q30_sonhos'
        }
      ]
    },
    {
      sectionId: 'section-perguntas-integracao',
      id: 'integracao',
      index: 3,
      title: '第四部分 — 整合',
      data_i18n: 'bloco_integracao_title',
      nextSection: 'section-perguntas-sintese',
      transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
      questions: [
        {
          number: 31,
          block: 4,
          theme: 'maior_sonho',
          id: 'q31_maior_sonho',
          label: '如今您最大的梦想是什么？那些光是想象一下就会让您展露笑颜的事物。',
          data_i18n: 'q31_maior_sonho'
        },
        {
          number: 32,
          block: 4,
          theme: 'barreiras',
          id: 'q32_barreiras',
          label: '您认为是什么在阻碍着您去实现它？这些障碍是源于内在、外在，还是两者兼有？',
          data_i18n: 'q32_barreiras'
        },
        {
          number: 33,
          block: 4,
          theme: 'proposito',
          id: 'q33_proposito',
          label: '您觉得您正在活出自己的天命与人生使命，还是依然处于寻找它的途中？',
          data_i18n: 'q33_proposito'
        },
        {
          number: 34,
          block: 4,
          theme: 'chamado_interior',
          id: 'q34_chamado_interior',
          label: '是否存在一个被您一直以来刻意忽略的内在召唤，或是那份无声的渴望？',
          data_i18n: 'q34_chamado_interior'
        },
        {
          number: 35,
          block: 4,
          theme: 'origem_dos_medos',
          id: 'q35_origem_medos',
          label: '您的那些恐惧，都深层联结着怎样的特定情境或情感？',
          data_i18n: 'q35_origem_medos'
        },
        {
          number: 36,
          block: 4,
          theme: 'decisoes_e_limites',
          id: 'q36_decisoes_limites',
          label: '您是否感到自己由于恐惧而逃避做出某些决定，或者最终妥协接受了那些令您尊严受损的处境？',
          data_i18n: 'q36_decisoes_limites'
        },
        {
          number: 37,
          block: 4,
          theme: 'acolhimento_do_sofrimento',
          id: 'q37_acolhimento_sofrimento',
          label: '对于此时此刻正深陷痛苦煎熬中的人，您会对他/她留下怎样的真诚致语？',
          data_i18n: 'q37_acolhimento_sofrimento'
        },
        {
          number: 38,
          block: 4,
          theme: 'vida_alem_da_terra',
          id: 'q38_vida_alem_terra',
          label: '您是否相信在我们的地球之外还存在生命，还是相信宇宙间所有的生命和存在都仅仅发生在这里？',
          data_i18n: 'q38_vida_alem_terra'
        },
        {
          number: 39,
          block: 4,
          theme: 'legado',
          id: 'q39_legado',
          label: '当您未来离开这个世界时，您希望如何被世人铭记？您期许自己能留下怎样的精神遗产？',
          data_i18n: 'q39_legado'
        },
        {
          number: 40,
          block: 4,
          theme: 'destino_dos_sonhos',
          id: 'q40_destino_sonhos',
          label: '那些您曾经拥有、却最终未能达成和实现的梦想，后来都怎样了？',
          data_i18n: 'q40_destino_sonhos'
        }
      ]
    },
    {
      sectionId: 'section-perguntas-sintese',
      id: 'sintese',
      index: 4,
      title: '第五部分 — 综合与交付',
      data_i18n: 'bloco_sintese_title',
      nextSection: 'section-final',
      transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
      questions: [
        {
          number: 41,
          block: 5,
          theme: 'choro',
          id: 'q41_choro',
          label: '您最近是否经常流泪痛哭？您能否察觉到通常是什么导火索引发了这番哭泣？',
          data_i18n: 'q41_choro'
        },
        {
          number: 42,
          block: 5,
          theme: 'origem_do_choro',
          id: 'q42_origem_choro',
          label: '这份泪水是源于内心的空虚、某种失去的创伤，还是深层的悔恨？',
          data_i18n: 'q42_origem_choro'
        },
        {
          number: 43,
          block: 5,
          theme: 'expressao_da_dor',
          id: 'q43_expressao_dor',
          label: '当哭泣降临时，您身上占据主导的是什么：是无言的沉默、寻找能加剧痛苦的事物，还是内心渴望宣泄的愤怒？',
          data_i18n: 'q43_expressao_dor'
        },
        {
          number: 44,
          block: 5,
          theme: 'tristeza_depressao',
          id: 'q44_tristeza_depressao',
          label: '您只是感到日常的悲伤，还是认为自己正处于某种抑郁状态中？您能否清晰辨别出这两种体验之间的本质不同？',
          data_i18n: 'q44_tristeza_depressao'
        },
        {
          number: 45,
          block: 5,
          theme: 'ajuda_profissional',
          id: 'q45_ajuda_profissional',
          label: '如果您认为自己正饱受抑郁状态的折磨，您是否考虑过寻求专业心理咨询的帮助，以更深层地理清内心的真实感受？',
          data_i18n: 'q45_ajuda_profissional'
        },
        {
          number: 46,
          block: 5,
          theme: 'comportamento_relacional',
          id: 'q46_comportamento_relacional',
          label: '在人际关系和相处中，您认为自己是一个更倾向于表现出攻击性（强势）的人，还是一个更倾向于顺从（妥协）的人？',
          data_i18n: 'q46_comportamento_relacional'
        },
        {
          number: 47,
          block: 5,
          theme: 'autopercepcao',
          id: 'q47_autopercepcao',
          label: '您是否有时觉得很难与自己和谐共处，或者常常对那些您认为错误的过往抉择怀恨在心？',
          data_i18n: 'q47_autopercepcao'
        },
        {
          number: 48,
          block: 5,
          theme: 'autoimagem',
          id: 'q48_autoimagem',
          label: '您认为自己是一个充满魅力、丰富有趣的人，还是坚信自己对他人而言是个索然无味的人？',
          data_i18n: 'q48_autoimagem'
        },
        {
          number: 49,
          block: 5,
          theme: 'limites',
          id: 'q49_limites',
          label: '您是否很难对别人的索求或抗拒坦然地说出“不”？',
          data_i18n: 'q49_limites'
        },
        {
          number: 50,
          block: 5,
          theme: 'morte',
          id: 'q50_morte',
          label: '您害怕面临死亡吗？在很多时候，恐惧往往不在于死亡的终点本身，而更在于它可能降临的痛苦方式。您在自身中是如何感知到这一点的？',
          data_i18n: 'q50_morte'
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
