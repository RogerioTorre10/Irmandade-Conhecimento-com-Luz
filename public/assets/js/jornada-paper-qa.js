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
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Por quem você foi criado? Pais biológicos, apenas um deles, familiares, pais adotivos ou outra pessoa?', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'Você é filho único ou tem irmãos? Como essa realidade marcou seu senso de individualidade?', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Se tem ou tivesse irmãos, quantos seriam? Qual é ou seria seu lugar entre eles: primogênito, do meio ou caçula?', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Você já passou fome ou viveu privações severas na infância? Como isso influenciou sua forma de enxergar a vida?', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Você possui alguma deficiência física, cognitiva ou outra condição que tenha influenciado sua vida? Já sofreu preconceito por causa dela?', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'Qual é o seu nível de escolaridade? Como você avalia o investimento que fez em sua própria formação?', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Como o seu estado civil hoje influencia o momento que você está vivendo?', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Você se lembra da primeira vez em que percebeu que era alguém único no mundo? Quantos anos tinha?', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: 'Como é sua relação com o silêncio? Ele o incomoda ou o acalma?', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Se você pudesse conversar com a criança que ainda habita em você, o que diria a ela?', data_i18n: 'q10_crianca' }
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
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'Como você tem percebido a sua própria vida até aqui?', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'Como você enxerga a vida das pessoas ao seu redor?', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'Como você lida com os seus traumas? Consegue falar sobre eles?', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'Você acredita que existe uma verdade maior ou que tudo depende do olhar de cada pessoa?', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'Qual é o seu maior vício? Por que acredita que ele surgiu? Já tentou vencê-lo? Percebe também outros vícios mais sutis ou emocionais em você?', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'O que a doença representa para você? Está enfrentando alguma condição de saúde neste momento?', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: 'Existe alguém que você gostaria de ter ao seu lado neste momento? Por que essa pessoa não está presente?', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'Como você percebe a morte? Ela desperta medo, conforto ou curiosidade?', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'Como você compreende a enfermidade? Ela pode ter algum significado ou propósito em determinados momentos da vida?', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Você acredita que algumas doenças podem refletir sombras internas ou fazer parte de um processo de crescimento espiritual?', data_i18n: 'q20_sentido_doenca' }
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
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'Como você percebe o sentido da vida? Existe um propósito maior ou tudo acontece por acaso?', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Você acredita em Deus, em um ser supremo, na espiritualidade ou em algo além do que podemos ver?', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'Você já se sentiu guiado por algo invisível? Pode contar uma experiência marcante?', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'Qual foi a maior dor emocional que você já enfrentou? Como conseguiu lidar com ela?', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'Qual foi a maior superação da sua vida? Que força você descobriu naquele momento?', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'Do que você mais tem medo hoje? O que esse medo pode estar tentando lhe mostrar?', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Por que você acredita que acabou se esquecendo de si mesmo? Quando foi a última vez que recebeu um elogio que realmente o marcou?', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Por que você acredita que, muitas vezes, não consegue se colocar como prioridade?', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: 'Você costuma reconhecer e elogiar a si mesmo? Em quais momentos isso acontece?', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'Você se vê como alguém que ajuda sonhos a nascerem ou como alguém que, sem perceber, acaba enterrando os próprios sonhos e os de outras pessoas?', data_i18n: 'q30_sonhos' }
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
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'Qual é o seu maior sonho hoje? Algo que faz você sorrir só de imaginar.', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'O que você acredita que o impede de realizá-lo? Essas barreiras são internas, externas ou ambas?', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'Você sente que está vivendo o seu propósito ou ainda está em busca dele?', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'Existe um chamado interior, uma vontade silenciosa, que você tem ignorado?', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'Os seus medos estão ligados a qual situação ou sentimento específico?', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Você sente que deixa de tomar certas decisões por medo ou acaba aceitando situações que o humilham?', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'O que você diria para alguém que está sofrendo profundamente neste momento?', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: 'Você acredita que existe vida além do nosso planeta Terra ou que toda a existência acontece apenas aqui?', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'Como você gostaria de ser lembrado quando não estiver mais aqui? Que legado deseja deixar?', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'O que aconteceu com os sonhos que você teve — e os quais nunca chegou a realizar?', data_i18n: 'q40_destino_sonhos' }
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
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'Você tem chorado com frequência? Consegue identificar o que costuma provocar esse choro?', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Esse choro nasce de um vazio interior, de uma perda ou de um arrependimento?', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Quando o choro chega, o que predomina: o silêncio, a busca por algo que intensifique esse sentimento ou a raiva querendo se manifestar?', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Você se sente triste ou acredita estar vivendo um estado depressivo? Consegue perceber a diferença entre essas duas experiências?', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Se você acredita estar vivendo um estado depressivo, já pensou em procurar ajuda profissional para compreender melhor o que está sentindo?', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'Nas suas relações, você se considera uma pessoa mais assertiva, mais agressiva ou mais submissa?', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Você sente que, às vezes, é difícil conviver consigo mesmo ou costuma carregar mágoa ou raiva por decisões que considera equivocadas?', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Você se considera uma pessoa interessante ou acredita ser alguém sem muito interesse para os outros?', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'Você tem dificuldade em dizer "não" para as pessoas?', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Você tem medo de morrer? Muitas vezes, o medo está menos na morte em si e mais na forma como ela pode acontecer. Como você percebe isso em você?', data_i18n: 'q50_morte' }
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
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Who raised you? Biological parents, only one of them, relatives, adoptive parents, or someone else?', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'Are you an only child or do you have siblings? How has this reality shaped your sense of individuality?', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'If you have or had siblings, how many? What is or would be your place among them: first-born, middle, or youngest child?', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Did you experience hunger or severe hardships during your childhood? How did that influence the way you view life?', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Do you have any social, physical, or cognitive disability? Have you ever faced prejudice because of it?', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'What is your level of education? How do you evaluate the investment you made in your development?', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'How does your current marital status influence the moment you are experiencing right now?', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Do you remember the first time you realized you were someone unique in the world? How old were you?', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: 'What is your relationship with silence? Does it make you uncomfortable or does it calm you?', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'If you could talk to the child that still lives within you, what would you say to them?', data_i18n: 'q10_crianca' }
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
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'How have you perceived your own life up to this point?', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'How do you view the lives of the people around you?', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'How do you deal with your traumas? Are you able to talk about them?', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'Do you believe there is a greater truth, or does everything depend on each person’s perspective?', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'What is your greatest vice or addiction? Why do you think it emerged? Have you tried to overcome it? Do you also notice other subtler or more emotional dependencies within yourself?', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'What does illness represent to you? Are you facing any health condition at this moment?', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: 'Is there someone you wish was by your side right now? Why is this person not present?', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'How do you perceive death? Does it evoke fear, comfort, or curiosity?', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'How do you understand illness? Can it carry some meaning or purpose at certain times in life?', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Do you believe that some illnesses can reflect internal shadows or be part of a process of spiritual growth?', data_i18n: 'q20_sentido_doenca' }
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
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'How do you perceive the meaning of life? Is there a higher purpose, or does everything happen by chance?', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Do you believe in God, a supreme being, spirituality, or something beyond what we can see?', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'Have you ever felt guided by something invisible? Can you share a meaningful experience?', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'What was the greatest emotional pain you have ever faced? How did you manage to cope with it?', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'What was the greatest triumph or breakthrough in your life? What strength did you discover within yourself at that moment?', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'What are you most afraid of today? What might this fear be trying to show you?', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Why do you believe you ended up forgetting about yourself? When was the last time you received a compliment that truly left a mark on you?', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Why do you believe that you often struggle to place yourself as a priority?', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: 'Do you habitually recognize and acknowledge your own qualities? In what moments does that happen?', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'Do you see yourself as someone who helps dreams come to life, or as someone who, without realizing it, ends up burying their own dreams and those of others?', data_i18n: 'q30_sonhos' }
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
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'What is your greatest dream today? Something that makes you smile just by imagining it.', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'What do you believe prevents you from achieving it? Are these barriers internal, external, or both?', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'Do you feel you are living your purpose, or are you still searching for it?', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'Is there an inner calling, a silent desire, that you have been ignoring?', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'To what specific situation or feeling are your fears linked?', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Do you feel that you hold back from making certain decisions out of fear, or end up accepting situations that demean you?', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'What would you say to someone who is suffering deeply at this moment?', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: 'Do you believe that life exists beyond our planet Earth, or do you believe that all existence happens only here?', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'How would you like to be remembered when you are no longer here? What legacy do you wish to leave behind?', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'What happened to the dreams you once had — and which you never managed to fulfill?', data_i18n: 'q40_destino_sonhos' }
    ]
  },
  {
    sectionId: 'section-perguntas-sintese',
    id: 'sintese',
    index: 4,
    title: 'Block 5 — Synthesis and Offering',
    data_i18n: 'bloco_sintese_title',
    nextSection: 'section-final',
    transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
    questions: [
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'Have you been crying frequently? Can you identify what usually triggers this crying?', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Does this crying stem from an inner emptiness, a loss, or a regret?', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'When the tears come, what dominates: silence, a search for something that intensifies this feeling, or anger wanting to manifest?', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Do you feel sad, or do you believe you are living in a depressive state? Can you perceive the difference between these two experiences?', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'If you believe you are living in a depressive state, have you thought about seeking professional help to better understand what you are feeling?', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'In your relationships, do you consider yourself to be a more assertive, more aggressive, or more submissive person?', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Do you feel that, sometimes, it is difficult to live with yourself, or do you carry anger over decisions you consider mistaken?', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Do you consider yourself an interesting person, or do you believe you are someone of little interest to others?', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'Do you have difficulty saying "no" to people?', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Are you afraid of dying? Often, the fear lies less in death itself and more in how it might happen. How do you perceive this within yourself?', data_i18n: 'q50_morte' }
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
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: '¿Por quién fuiste criado? ¿Padres biológicos, solo uno de ellos, familiares, padres adoptivos u otra persona?', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: '¿Eres hijo único o tienes hermanos? ¿Cómo marcó esta realidad tu sentido de individualidad?', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Si tienes o hubieras tenido hermanos, ¿cuántos? ¿Cuál es o sería tu lugar entre ellos: primogénito, hermano mediano o el menor?', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: '¿Pasaste hambre o viviste privaciones severas en tu infancia? ¿Cómo influyó eso en tu forma de ver la vida?', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: '¿Tienes alguna discapacidad social, física o cognitiva? ¿Has sufrido prejuicios a causa de ella?', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: '¿Cuál es tu nivel de escolaridad? ¿Cómo evalúas la inversión que hiciste en tu formación?', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: '¿Cómo influye tu estado civil actual en el momento que estás viviendo hoy?', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: '¿Recuerdas la primera vez que te diste cuenta de que eras alguien único en el mundo? ¿Cuántos años tenías?', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: '¿Cómo es tu relación con el silencio? ¿Te incomoda o te tranquiliza?', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Si pudieras hablar con el niño que aún habita en ti, ¿qué le dirías?', data_i18n: 'q10_crianca' }
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
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: '¿Cómo has percibido tu propia vida hasta este momento?', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: '¿Cómo ves la vida de las personas que te rodean?', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: '¿Cómo lidas con tus traumas? ¿Eres capaz de hablar de ellos?', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: '¿Crees que existe una verdad mayor o que todo depende de la mirada de cada persona?', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: '¿Cuál es tu mayor vicio o adicción? ¿Por qué crees que surgió? ¿Has intentado vencerlo? ¿Notas también otros vicios más sutiles o emocionales en ti?', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: '¿Qué representa la enfermedad para ti? ¿Estás enfrentando alguna condición de salud en este momento?', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: '¿Hay alguien que te gustaría tener a tu lado en este momento? ¿Por qué esa persona no está presente?', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: '¿Cómo percibes la muerte? ¿Despierta en ti miedo, consuelo o curiosidad?', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: '¿Cómo comprendes la enfermedad? ¿Puede tener algún significado o propósito en determinados momentos de la vida?', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: '¿Crees que algunas enfermedades pueden reflejar sombras internas o formar parte de un proceso de crecimiento espiritual?', data_i18n: 'q20_sentido_doenca' }
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
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: '¿Cómo percibes el sentido de la vida? ¿Existe un propósito mayor o todo sucede por casualidad?', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: '¿Crees en Dios, en un ser supremo, en la espiritualidad o en algo más allá de lo que podemos ver?', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: '¿Te has sentido alguna vez guiado por algo invisible? ¿Podrías contar una experiencia significativa?', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: '¿Cuál ha sido el mayor dolor emocional que has enfrentado? ¿Cómo lograste lidiar con él?', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: '¿Cuál ha sido la mayor superación de tu vida? ¿Qué fuerza descubriste en ti en ese momento?', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: '¿A qué le tienes más miedo hoy? ¿Qué podría estar intentando mostrarte ese miedo?', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: '¿Por qué crees que terminaste olvidándote de ti mismo? ¿Cuándo fue la última vez que recibiste un cumplido que realmente te marcó?', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: '¿Por qué crees que, a menudo, no logras ponerte a ti mismo como prioridad?', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: '¿Sueles reconocerte y elogiarte a ti mismo? ¿En qué momentos sucede eso?', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: '¿Te ves como alguien que ayuda a que nazcan los sueños, o como alguien que, sin darse cuenta, termina enterrando sus propios sueños y los de los demás?', data_i18n: 'q30_sonhos' }
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
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: '¿Cuál es tu mayor sueño hoy? Algo que te haga sonreír con solo imaginarlo.', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: '¿Qué crees que te impide realizarlo? ¿Esas barreras son internas, externas o ambas?', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: '¿Sientes que estás viviendo tu propósito o todavía estás en busca de él?', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: '¿Existe un llamado interior, un deseo silencioso, que has estado ignorando?', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: '¿Tus miedos están vinculados a qué situación o sentimiento específico?', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: '¿Sientes que dejas de tomar ciertas decisiones por miedo, o terminas aceptando situaciones que te humillan?', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: '¿Qué le dirías a alguien que está sufriendo profundamente en este momento?', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: '¿Crees que existe vida más allá de nuestro planeta Tierra, o crees que toda la existencia ocurre solo aquí?', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: '¿Cómo te gustaría ser recordado cuando ya no estés aquí? ¿Qué legado deseas dejar?', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: '¿Qué pasó con los sueños que alguna vez tuviste — y que nunca llegaste a realizar?', data_i18n: 'q40_destino_sonhos' }
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
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: '¿Has estado llorando con frecuencia? ¿Puedes identificar qué suele provocar ese llanto?', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: '¿Este llanto nace de un vacío interior, de una pérdida o de un arrepentimiento?', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Cuando llega el llanto, ¿qué predomina: el silencio, la búsqueda de algo que intensifique ese sentimiento, o la rabia queriendo manifestarse?', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: '¿Te sientes triste o crees estar viviendo un estado depresivo? ¿Consigues percibir la diferencia entre estas dos experiencias?', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Si crees estar viviendo un estado depresivo, ¿has pensado en buscar ayuda profesional para comprender mejor lo que estás sintiendo?', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: '¿En tus relaciones, te consideras una persona más asertiva, más agresiva o más sumisa?', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: '¿Sientes que, a veces, es difícil convivir contigo mismo, o sueles cargar con rabia por decisiones que consideras equivocadas?', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: '¿Te consideras una persona interesante, o crees ser alguien sin mucho interés para los demás?', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: '¿Tienes dificultad para decir "no" a las personas?', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: '¿Tienes miedo de morir? Muchas veces, el miedo está menos en la muerte en sí y más en la forma en que puede suceder. ¿Cómo percibes esto en ti?', data_i18n: 'q50_morte' }
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
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Par qui avez-vous été élevé ? Vos parents biologiques, un seul d’entre eux, des membres de votre famille, des parents adoptifs ou quelqu’un d’autre ?', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'Êtes-vous enfant unique ou avez-vous des frères et sœurs ? Comment cette réalité a-t-elle marqué votre sens de l’individualité ?', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Si vous avez ou aviez des frères et sœurs, combien ? Quelle est ou serait votre place parmi eux : aîné, cadet (du milieu) ou benjamin ?', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Avez-vous souffert de la faim ou vécu de graves privations pendant votre enfance ? Comment cela a-t-il influencé votre vision de la vie ?', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Souffrez-vous d’un handicap social, physique ou cognitif ? Avez-vous déjà été victime de préjugés à cause de cela ?', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'Quel est votre niveau d’études ? Comment évaluez-vous l’investissement que vous avez consacré à votre formation ?', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Comment votre situation amoureuse ou maritale actuelle influence-t-elle le moment que vous vivez aujourd’hui ?', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Vous souvenez-vous de la première fois où vous avez réalisé que vous étiez une personne unique au monde ? Quel âge aviez-vous ?', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: 'Quelle est votre relation avec le silence ? Vous dérange-t-il ou vous apaise-t-il ?', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Si vous pouviez parler à l’enfant qui habite encore en vous, que lui diriez-vous ?', data_i18n: 'q10_crianca' }
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
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'Comment avez-vous perçu votre propre vie jusqu’à présent ?', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'Comment voyez-vous la vie des gens qui vous entourent ?', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'Comment gérez-vous vos traumas ? Arrivez-vous à en parler ?', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'Croyez-vous qu’il existe une vérité supérieure ou que tout dépend du regard de chacun ?', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'Quel est votre plus grand vice ou dépendance ? Pourquoi pensez-vous qu’il est apparu ? Avez-vous déjà essayé de le surmonter ? Remarquez-vous également en vous d’autres dépendances plus subtiles ou émotionnelles ?', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'Que représente la maladie pour vous ? Traversez-vous un problème de santé en ce moment ?', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: 'Y a-t-il quelqu’un que vous aimeriez avoir à vos côtés en ce moment ? Pourquoi cette personne n’est-elle pas présente ?', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'Comment percevez-vous la mort ? Éveille-t-elle en vous de la peur, du réconfort ou de la curiosité ?', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'Comment comprenez-vous la maladie ? Peut-elle avoir un sens ou un but à certains moments de la vie ?', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Croyez-vous que certaines maladies peuvent refléter des zones d’ombre intérieures ou faire partie d’un processus de croissance spirituelle ?', data_i18n: 'q20_sentido_doenca' }
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
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'Comment percevez-vous le sens de la vie ? Existe-t-il un but supérieur ou tout arrive-t-il par hasard ?', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Croyez-vous en Dieu, en un être suprême, en la spiritualité ou en quelque chose au-delà de ce que nous pouvons voir ?', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'Vous êtes-vous déjà senti guidé par quelque chose d’invisible ? Pouvez-vous raconter une expérience marquante ?', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'Quelle a été la plus grande douleur émotionnelle à laquelle vous avez dû faire face ? Comment avez-vous réussi à la surmonter ?', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'Quel a été le plus grand dépassement de soi ou triomphe de votre vie ? Quelle force avez-vous découverte en vous à ce moment-là ?', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'De quoi avez-vous le plus peur aujourd’hui ? Que pourrait essayer de vous montrer cette peur ?', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Pourquoi pensez-vous avoir fini par vous oublier vous-même ? À quand remonte la dernière fois que vous avez reçu un compliment qui vous a vraiment marqué ?', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Pourquoi pensez-vous que, bien souvent, vous n’arrivez pas à faire de vous-même une priorité ?', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: 'Avez-vous l’habitude de vous reconnaître et de vous féliciter vous-même ? À quels moments cela se produit-il ?', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'Vous voyez-vous comme quelqu’un qui aide les rêves à naître, ou comme quelqu’un qui, sans s’en rendre compte, finit par enterrer ses propres rêves et ceux des autres ?', data_i18n: 'q30_sonhos' }
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
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'Quel est votre plus grand rêve aujourd’hui ? Quelque chose qui vous fait sourire rien qu’en l’imaginant.', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'Qu’est-ce qui, selon vous, vous empêche de le réaliser ? Ces barrières sont-elles intérieures, extérieures ou les deux ?', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'Avez-vous le sentiment de vivre votre mission de vie ou êtes-vous encore à sa recherche ?', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'Existe-t-il un appel intérieur, un désir silencieux, que vous avez ignoré jusqu’à présent ?', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'À quelle situation ou à quel sentiment spécifique vos peurs sont-elles liées ?', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Avez-vous le sentiment de renoncer à prendre certaines décisions par peur, ou de finir par accepter des situations qui vous rabaissent ?', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'Que diriez-vous à quelqu’un qui souffre profondément en ce moment même ?', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: 'Croyez-vous qu’il existe de la vie au-delà de notre planète Terre, ou pensez-vous que toute l’existence se déroule uniquement ici ?', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'Comment aimeriez-vous que l’on se souvienne de vous lorsque vous ne serez plus là ? Quel héritage (legs) souhaitez-vous laisser ?', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'Qu’est-il advenu des rêves que vous aviez autrefois — et que vous n’avez jamais réussi à réaliser ?', data_i18n: 'q40_destino_sonhos' }
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
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'Pleurez-vous fréquemment ces derniers temps ? Pouvez-vous identifier ce qui provoque généralement ces larmes ?', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Ces pleurs naissent-ils d’un vide intérieur, d’une perte ou d’un regret ?', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Quand les larmes viennent, qu’est-ce qui prédomine : le silence, la recherche de quelque chose qui intensifie ce sentiment, ou la colère qui cherche à se manifester ?', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Vous sentez-vous triste ou pensez-vous vivre un état dépressif ? Arrivez-vous à percevoir la différence entre ces deux expériences ?', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Si vous pensez vivre un état dépressif, avez-vous envisagé de chercher une aide professionnelle pour mieux comprendre ce que vous ressentez ?', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'Dans vos relations, vous considérez-vous comme une personne plutôt assertive, plutôt agressive ou plutôt soumise ?', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Trouvez-vous que, parfois, il est difficile de vivre avec vous-même, ou portez-vous en vous de la colère face à des décisions que vous jugez erronées ?', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Vous considérez-vous comme une personne intéressante, ou pensez-vous être quelqu’un de peu d’intérêt pour les autres ?', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'Avez-vous du mal à dire « non » aux gens ?', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Avez-vous peur de mourir ? Souvent, la peur réside moins dans la mort elle-même que dans la manière dont elle pourrait survenir. Comment percevez-vous cela en vous ?', data_i18n: 'q50_morte' }
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
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'Von wem wurden Sie erzogen? Von den biologischen Eltern, nur einem von ihnen, Verwandten, Adoptiveltern oder einer anderen Person?', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'Sind Sie ein Einzelkind oder haben Sie Geschwister? Wie hat diese Tatsache Ihr Gefühl für Individualität geprägt?', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: 'Falls Sie Geschwister haben oder hätten, wie viele wären es? Welchen Platz nehmen oder nähmen Sie unter ihnen ein: Erstgeborener, mittleres Kind oder Nachgeborener?', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: 'Haben Sie in Ihrer Kindheit Hunger oder schwere Entbehrungen erlebt? Wie hat das Ihre Sicht auf das Leben beeinflusst?', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: 'Haben Sie eine körperliche, kognitive oder andere Beeinträchtigung, die Ihr Leben beeinflusst hat? Haben Sie deswegen schon Vorurteile erfahren?', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'Wie hoch ist Ihr Bildungsniveau? Wie bewerten Sie die Investition, die Sie in Ihre eigene Ausbildung getätigt haben?', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: 'Wie beeinflusst Ihr aktueller Familienstand die Phase, die Sie gerade durchleben?', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: 'Erinnern Sie sich an den ersten Moment, in dem Sie erkannten, dass Sie ein einzigartiger Mensch auf der Welt sind? Wie alt waren Sie damals?', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: 'Wie ist Ihre Beziehung zur Stille? Stört sie Sie oder beruhigt sie Sie?', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'Wenn Sie mit dem Kind sprechen könnten, das noch in Ihnen lebt, was würden Sie ihm sagen?', data_i18n: 'q10_crianca' }
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
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: 'Wie haben Sie Ihr eigenes Leben bisher wahrgenommen?', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: 'Wie sehen Sie das Leben der Menschen um Sie herum?', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: 'Wie gehen Sie mit Ihren Traumata um? Können Sie darüber sprechen?', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'Glauben Sie, dass es eine höhere Wahrheit gibt, oder hängt alles vom Blickwinkel jedes Einzelnen ab?', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'Was ist Ihre größte Sucht? Warum glauben Sie, dass sie entstanden ist? Haben Sie schon versucht, sie zu überwinden? Bemerken Sie auch subtilere oder emotionale Süchte in sich?', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: 'Was bedeutet Krankheit für Sie? Erleben Sie derzeit gesundheitliche Probleme?', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: 'Gibt es jemanden, den Sie gerne in diesem Moment an Ihrer Seite hätten? Warum ist diese Person nicht da?', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'Wie nehmen Sie den Tod wahr? Weckt er Angst, Trost oder Neugier?', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: 'Wie verstehen Sie Krankheit? Kann sie in bestimmten Lebensphasen eine Bedeutung oder einen Zweck haben?', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: 'Glauben Sie, dass manche Krankheiten innere Schatten widerspiegeln oder Teil eines spirituellen Wachstumsprozesses sein können?', data_i18n: 'q20_sentido_doenca' }
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
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: 'Wie nehmen Sie den Sinn des Lebens wahr? Gibt es einen höheren Zweck, oder geschieht alles zufällig?', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: 'Glauben Sie an Gott, an ein höheres Wesen, an Spiritualität oder an etwas jenseits des Sichtbaren?', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: 'Haben Sie sich jemals von etwas Unsichtbarem geführt gefühlt? Können Sie eine prägende Erfahrung erzählen?', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'Was war der größte emotionale Schmerz, den Sie je erlebt haben? Wie haben Sie damit umgehen können?', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'Was war die größte Herausforderung, die Sie in Ihrem Leben überwunden haben? Welche Kraft haben Sie in diesem Moment entdeckt?', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: 'Wovor haben Sie heute am meisten Angst? Was könnte diese Angst Ihnen zeigen wollen?', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'Warum glauben Sie, dass Sie sich selbst aus den Augen verloren haben? Wann haben Sie zuletzt ein Lob erhalten, das Sie wirklich berührt hat?', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: 'Warum glauben Sie, dass es Ihnen oft schwerfällt, sich selbst an erste Stelle zu setzen?', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: 'Erkennen und loben Sie sich selbst? In welchen Momenten geschieht das?', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'Sehen Sie sich als jemanden, der Träumen hilft zu entstehen, oder als jemanden, der unbewusst die eigenen Träume und die anderer begräbt?', data_i18n: 'q30_sonhos' }
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
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: 'Was ist heute Ihr größter Traum? Etwas, das Sie schon beim bloßen Gedanken daran lächeln lässt.', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'Was glauben Sie, hält Sie davon ab, ihn zu verwirklichen? Sind diese Hindernisse innerer, äußerer oder beider Natur?', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'Haben Sie das Gefühl, Ihren Lebenszweck bereits zu leben, oder sind Sie noch auf der Suche danach?', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: 'Gibt es einen inneren Ruf, einen stillen Wunsch, den Sie ignoriert haben?', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'Mit welcher konkreten Situation oder welchem Gefühl sind Ihre Ängste verbunden?', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: 'Haben Sie das Gefühl, bestimmte Entscheidungen aus Angst nicht zu treffen, oder akzeptieren Sie Situationen, die Sie erniedrigen?', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: 'Was würden Sie jemandem sagen, der gerade tief leidet?', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: 'Glauben Sie, dass es Leben jenseits unseres Planeten Erde gibt, oder dass sich die gesamte Existenz nur hier abspielt?', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'Wie möchten Sie in Erinnerung bleiben, wenn Sie nicht mehr hier sind? Welches Erbe möchten Sie hinterlassen?', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'Was ist aus den Träumen geworden, die Sie hatten — und die Sie nie verwirklicht haben?', data_i18n: 'q40_destino_sonhos' }
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
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'Weinen Sie oft? Können Sie erkennen, was dieses Weinen normalerweise auslöst?', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'Entsteht dieses Weinen aus einer inneren Leere, einem Verlust oder einer Reue?', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: 'Wenn das Weinen kommt, was überwiegt: die Stille, die Suche nach etwas, das dieses Gefühl verstärkt, oder aufkommende Wut?', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'Fühlen Sie sich traurig, oder glauben Sie, sich in einem depressiven Zustand zu befinden? Können Sie den Unterschied zwischen diesen beiden Erfahrungen erkennen?', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: 'Falls Sie glauben, sich in einem depressiven Zustand zu befinden, haben Sie schon daran gedacht, professionelle Hilfe zu suchen, um besser zu verstehen, was Sie fühlen?', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: 'Halten Sie sich in Ihren Beziehungen für eher durchsetzungsfähig, aggressiv oder unterwürfig?', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: 'Haben Sie manchmal das Gefühl, schwer mit sich selbst auszukommen, oder tragen Sie Kränkung oder Wut wegen Entscheidungen mit sich, die Sie für falsch halten?', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: 'Halten Sie sich für einen interessanten Menschen, oder glauben Sie, für andere wenig interessant zu sein?', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: 'Fällt es Ihnen schwer, anderen Menschen "Nein" zu sagen?', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: 'Haben Sie Angst vor dem Sterben? Oft liegt die Angst weniger im Tod selbst als in der Art, wie er eintreten könnte. Wie nehmen Sie das bei sich wahr?', data_i18n: 'q50_morte' }
    ]
  }
],

    'ja-JP': [
  {
    sectionId: 'section-perguntas-raizes',
    id: 'raizes',
    index: 0,
    title: '第1章 — ルーツ',
    data_i18n: 'bloco_raizes_title',
    nextSection: 'section-perguntas-reflexoes',
    transitionVideo: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
    questions: [
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: 'あなたは誰に育てられましたか？生物学上の両親、そのうちの一人だけ、親戚、養親、それとも別の人でしたか？', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: 'あなたは一人っ子ですか、それは兄弟姉妹がいますか？その事実は、あなたの個性の感覚にどのような影響を与えましたか？', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: '兄弟姉妹がいる、またはいたとしたら、何人になるでしょうか？その中でのあなたの立場は、長子、中間、それとも末っ子でしょうか？', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: '子供の頃、飢えや深刻な貧困を経験しましたか？それは人生の見方にどのような影響を与えましたか？', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: '身体的、認知的、またはその他の障がいがあり、それが人生に影響を与えたことはありますか？そのために偏見を受けたことはありますか？', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: 'あなたの学歴はどの程度ですか？自分自身の教育への投資について、どのように評価していますか？', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: '現在の婚姻状況は、今あなたが生きているこの時期にどのような影響を与えていますか？', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: '自分がこの世界で唯一の存在だと初めて気づいた瞬間を覚えていますか？その時、何歳でしたか？', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: '静寂とのあなたの関係はどのようなものですか？それはあなたを不安にさせますか、それとも安らぎを与えますか？', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: 'もし今も自分の中に生きている子供と話すことができたら、その子に何を伝えますか？', data_i18n: 'q10_crianca' }
    ]
  },
  {
    sectionId: 'section-perguntas-reflexoes',
    id: 'reflexoes',
    index: 1,
    title: '第2章 — 内省',
    data_i18n: 'bloco_reflexoes_title',
    nextSection: 'section-perguntas-crescimento',
    transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
    questions: [
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: '今までのあなた自身の人生をどのように感じてきましたか？', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: '周りの人々の人生をどのように見ていますか？', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: '自分のトラウマとどのように向き合っていますか？それについて話すことができますか？', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: 'より大きな真実が存在すると信じますか、それとも全ては各人の見方によるものだと思いますか？', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: 'あなたの最大の依存（悪癖）は何ですか？それはなぜ生まれたと思いますか？克服しようとしたことはありますか？もっと微妙な、あるいは感情的な依存に気づいていますか？', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: '病気とはあなたにとって何を意味しますか？今、何か健康上の問題を抱えていますか？', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: '今このとき、隣にいてほしいと思う人はいますか？その人はなぜ今そこにいないのでしょうか？', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: 'あなたは死をどのように感じていますか？それは恐怖、安らぎ、それとも好奇心を呼び起こしますか？', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: '病というものをどう理解していますか？人生のある時期において、病には意味や目的があるのでしょうか？', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: '病気の中には、内なる影を映し出したり、精神的成長の過程の一部であったりするものがあると思いますか？', data_i18n: 'q20_sentido_doenca' }
    ]
  },
  {
    sectionId: 'section-perguntas-crescimento',
    id: 'crescimento',
    index: 2,
    title: '第3章 — 成長',
    data_i18n: 'bloco_crescimento_title',
    nextSection: 'section-perguntas-integracao',
    transitionVideo: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
    questions: [
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: '人生の意味をどのように感じていますか？より大きな目的が存在するのでしょうか、それとも全ては偶然によるものでしょうか？', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: '神、あるいは至高の存在、精神性、または目には見えない何かを信じていますか？', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: '目に見えない何かに導かれていると感じたことはありますか？印象的な経験を教えていただけますか？', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: 'あなたが経験した最も大きな感情的な痛みは何でしたか？それをどのように乗り越えましたか？', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: 'あなたの人生における最大の克服は何でしたか？その時、どのような力を見出しましたか？', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: '今、あなたが最も恐れているものは何ですか？その恐怖は何を示そうとしているのでしょうか？', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: 'なぜ自分自身を忘れてしまったと思いますか？本当に心に響いた褒め言葉を最後に受け取ったのはいつですか？', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: '多くの場合、なぜ自分自身を優先できないのだと思いますか？', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: '自分自身を認め、褒めることはありますか？それはどのような時に起こりますか？', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: 'あなたは夢が生まれるのを助ける人だと感じますか、それとも気づかないうちに自分や他人の夢を埋めてしまう人だと感じますか？', data_i18n: 'q30_sonhos' }
    ]
  },
  {
    sectionId: 'section-perguntas-integracao',
    id: 'integracao',
    index: 3,
    title: '第4章 — 統合',
    data_i18n: 'bloco_integracao_title',
    nextSection: 'section-perguntas-sintese',
    transitionVideo: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4',
    questions: [
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: '今、あなたの最大の夢は何ですか？想像するだけで思わず笑みがこぼれるようなことです。', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: 'それを実現することを妨げているものは何だと思いますか？その障壁は内面的なもの、外面的なもの、それとも両方でしょうか？', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: 'あなたは自分の使命を生きていると感じますか、それともまだそれを探している最中ですか？', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: '無視してきた内なる呼び声、静かな願いはありますか？', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: 'あなたの恐怖は、どのような具体的な状況や感情と結びついていますか？', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: '恐怖のためにある決断を避けている、あるいは自分を辱めるような状況を受け入れてしまっていると感じますか？', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: '今深く苦しんでいる人に、あなたは何と言いますか？', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: '地球以外にも生命が存在すると思いますか、それともすべての存在はここだけで起こると思いますか？', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: 'あなたがもうここにいなくなったとき、どのように記憶されたいですか？どのような遺産を残したいですか？', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: 'あなたが抱いていた夢、そして実現できなかった夢はどうなったのでしょうか？', data_i18n: 'q40_destino_sonhos' }
    ]
  },
  {
    sectionId: 'section-perguntas-sintese',
    id: 'sintese',
    index: 4,
    title: '第5章 — 統合と手渡し',
    data_i18n: 'bloco_sintese_title',
    nextSection: 'section-final',
    transitionVideo: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4',
    questions: [
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: 'あなたは頻繁に涙を流しますか？その涙を引き起こすものが何かを特定できますか？', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: 'その涙は、内なる虚しさ、失ったもの、それとも後悔から生まれるものですか？', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: '涙が訪れるとき、何が支配的ですか？沈黙、その感情を強めるものを求める気持ち、それとも表れそうになる怒りでしょうか？', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: 'あなたは悲しみを感じていますか、それとも抑うつ状態にあると感じていますか？この二つの経験の違いを認識できますか？', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: '自分が抑うつ状態にあると感じている場合、感じていることをより深く理解するために専門家の助けを求めることを考えたことはありますか？', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: '人間関係において、あなたはより主張的、攻撃的、それとも従順な人だと思いますか？', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: '自分自身と共に生きることが時に難しいと感じますか、あるいは自分が間違っていたと思う決断について、恨みや怒りを抱え続けていますか？', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: '自分を興味深い人物だと思いますか、それとも他人にとってあまり興味を引かない存在だと思いますか？', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: '人に対して「ノー」と言うことに難しさを感じますか？', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: '死ぬことを恐れていますか？多くの場合、恐怖は死そのものよりも、それがどのように訪れるかという点にあります。あなたはこれをどのように感じていますか？', data_i18n: 'q50_morte' }
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
      { number: 1, block: 1, theme: 'criacao_familiar', id: 'q01_criacao', label: '你是由谁抚养长大的？亲生父母、其中一位、亲属、养父母，还是其他人？', data_i18n: 'q01_criacao' },
      { number: 2, block: 1, theme: 'individualidade', id: 'q02_filho_unico', label: '你是独生子女，还是有兄弟姐妹？这一现实如何影响了你的个体意识？', data_i18n: 'q02_filho_unico' },
      { number: 3, block: 1, theme: 'irmaos', id: 'q03_irmaos', label: '如果你有或曾经有兄弟姐妹，会是几个人？你在其中的位置是长子/长女、中间的孩子，还是最小的？', data_i18n: 'q03_irmaos' },
      { number: 4, block: 1, theme: 'privacoes', id: 'q04_privacoes', label: '你在童年时期是否经历过饥饿或严重的匮乏？这如何影响了你看待生活的方式？', data_i18n: 'q04_privacoes' },
      { number: 5, block: 1, theme: 'deficiencia', id: 'q05_deficiencia', label: '你是否有身体、认知或其他方面的障碍，对你的生活产生了影响？你是否因此受到过偏见？', data_i18n: 'q05_deficiencia' },
      { number: 6, block: 1, theme: 'escolaridade', id: 'q06_escolaridade', label: '你的教育水平如何？你如何评价自己在教育上的投入？', data_i18n: 'q06_escolaridade' },
      { number: 7, block: 1, theme: 'estado_civil', id: 'q07_estado_civil', label: '你目前的婚姻状况如何影响着你正在经历的这段人生阶段？', data_i18n: 'q07_estado_civil' },
      { number: 8, block: 1, theme: 'identidade', id: 'q08_identidade', label: '你还记得第一次意识到自己是世界上独一无二的人是什么时候吗？那时你几岁？', data_i18n: 'q08_identidade' },
      { number: 9, block: 1, theme: 'silencio', id: 'q09_silencio', label: '你与沉默的关系如何？它让你感到不安，还是让你感到平静？', data_i18n: 'q09_silencio' },
      { number: 10, block: 1, theme: 'crianca_interior', id: 'q10_crianca', label: '如果你能与仍存在于你内心的那个孩子对话，你会对他说什么？', data_i18n: 'q10_crianca' }
    ]
  },
  {
    sectionId: 'section-perguntas-reflexoes',
    id: 'reflexoes',
    index: 1,
    title: '第二部分 — 反思',
    data_i18n: 'bloco_reflexoes_title',
    nextSection: 'section-perguntas-crescimento',
    transitionVideo: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
    questions: [
      { number: 11, block: 2, theme: 'vida', id: 'q11_percepcao_vida', label: '到目前为止，你如何看待自己的人生？', data_i18n: 'q11_percepcao_vida' },
      { number: 12, block: 2, theme: 'empatia', id: 'q12_percepcao_outros', label: '你如何看待身边人的生活？', data_i18n: 'q12_percepcao_outros' },
      { number: 13, block: 2, theme: 'traumas', id: 'q13_traumas', label: '你如何面对自己的创伤？你能谈论它们吗？', data_i18n: 'q13_traumas' },
      { number: 14, block: 2, theme: 'verdade', id: 'q14_verdade', label: '你认为存在一种更高的真理，还是一切都取决于每个人的视角？', data_i18n: 'q14_verdade' },
      { number: 15, block: 2, theme: 'vicios', id: 'q15_vicios', label: '你最大的瘾好是什么？你认为它是如何形成的？你尝试过战胜它吗？你是否也察觉到自己身上更微妙或情感上的成瘾？', data_i18n: 'q15_vicios' },
      { number: 16, block: 2, theme: 'doenca', id: 'q16_doenca', label: '疾病对你而言意味着什么？你目前是否正面临某种健康问题？', data_i18n: 'q16_doenca' },
      { number: 17, block: 2, theme: 'solidao', id: 'q17_presenca', label: '此刻，有没有你希望陪伴在身边的人？为什么这个人不在你身边？', data_i18n: 'q17_presenca' },
      { number: 18, block: 2, theme: 'morte', id: 'q18_morte', label: '你如何看待死亡？它带给你的是恐惧、安慰，还是好奇？', data_i18n: 'q18_morte' },
      { number: 19, block: 2, theme: 'espiritualidade', id: 'q19_doenca_espiritual', label: '你如何理解病痛？在人生的某些时刻，它是否可能具有某种意义或目的？', data_i18n: 'q19_doenca_espiritual' },
      { number: 20, block: 2, theme: 'sentido_doenca', id: 'q20_sentido_doenca', label: '你认为某些疾病可能反映出内心的阴影，或是精神成长过程的一部分吗？', data_i18n: 'q20_sentido_doenca' }
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
      { number: 21, block: 3, theme: 'sentido_da_vida', id: 'q21_sentido_vida', label: '你如何看待人生的意义？存在更高的目的，还是一切都出于偶然？', data_i18n: 'q21_sentido_vida' },
      { number: 22, block: 3, theme: 'espiritualidade', id: 'q22_espiritualidade', label: '你信仰上帝、某种至高存在、灵性，或超越我们所能看见的事物吗？', data_i18n: 'q22_espiritualidade' },
      { number: 23, block: 3, theme: 'experiencia_espiritual', id: 'q23_guia_invisivel', label: '你是否曾感觉被某种无形的力量引导？能分享一段令你印象深刻的经历吗？', data_i18n: 'q23_guia_invisivel' },
      { number: 24, block: 3, theme: 'dor_emocional', id: 'q24_dor_emocional', label: '你所经历过的最大情感痛苦是什么？你是如何应对它的？', data_i18n: 'q24_dor_emocional' },
      { number: 25, block: 3, theme: 'superacao', id: 'q25_superacao', label: '你人生中最大的克服和突破是什么？在那一刻，你发现了什么样的力量？', data_i18n: 'q25_superacao' },
      { number: 26, block: 3, theme: 'medos', id: 'q26_medos', label: '今天你最害怕的是什么？这种恐惧可能想向你展示什么？', data_i18n: 'q26_medos' },
      { number: 27, block: 3, theme: 'autocuidado', id: 'q27_esquecimento_de_si', label: '你认为自己为什么会忽视了自己？你上一次收到真正打动你的赞美是什么时候？', data_i18n: 'q27_esquecimento_de_si' },
      { number: 28, block: 3, theme: 'prioridade_pessoal', id: 'q28_prioridade', label: '你认为为什么自己常常无法把自己放在首位？', data_i18n: 'q28_prioridade' },
      { number: 29, block: 3, theme: 'autoestima', id: 'q29_autoestima', label: '你是否经常认可并称赞自己？这通常发生在什么时候？', data_i18n: 'q29_autoestima' },
      { number: 30, block: 3, theme: 'sonhos', id: 'q30_sonhos', label: '你认为自己是帮助梦想诞生的人，还是在不知不觉中埋葬了自己和他人梦想的人？', data_i18n: 'q30_sonhos' }
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
      { number: 31, block: 4, theme: 'maior_sonho', id: 'q31_maior_sonho', label: '你今天最大的梦想是什么？一个只要想到就会让你微笑的梦想。', data_i18n: 'q31_maior_sonho' },
      { number: 32, block: 4, theme: 'barreiras', id: 'q32_barreiras', label: '你认为是什么阻碍了你实现这个梦想？这些障碍是内在的、外在的，还是两者兼有？', data_i18n: 'q32_barreiras' },
      { number: 33, block: 4, theme: 'proposito', id: 'q33_proposito', label: '你感觉自己正在活出自己的人生使命，还是仍在寻找它？', data_i18n: 'q33_proposito' },
      { number: 34, block: 4, theme: 'chamado_interior', id: 'q34_chamado_interior', label: '是否存在一种内心的呼唤，一个你一直忽视的沉默愿望？', data_i18n: 'q34_chamado_interior' },
      { number: 35, block: 4, theme: 'origem_dos_medos', id: 'q35_origem_medos', label: '你的恐惧与哪种具体的情境或感受相关？', data_i18n: 'q35_origem_medos' },
      { number: 36, block: 4, theme: 'decisoes_e_limites', id: 'q36_decisoes_limites', label: '你是否觉得自己因为恐惧而放弃做出某些决定，或者接受了让自己感到屈辱的处境？', data_i18n: 'q36_decisoes_limites' },
      { number: 37, block: 4, theme: 'acolhimento_do_sofrimento', id: 'q37_acolhimento_sofrimento', label: '你会对此刻正在深深痛苦中的人说些什么？', data_i18n: 'q37_acolhimento_sofrimento' },
      { number: 38, block: 4, theme: 'vida_alem_da_terra', id: 'q38_vida_alem_terra', label: '你相信地球之外存在生命，还是认为一切存在只发生在这里？', data_i18n: 'q38_vida_alem_terra' },
      { number: 39, block: 4, theme: 'legado', id: 'q39_legado', label: '当你不再在这里时，你希望被如何记住？你想留下怎样的遗产？', data_i18n: 'q39_legado' },
      { number: 40, block: 4, theme: 'destino_dos_sonhos', id: 'q40_destino_sonhos', label: '你曾经拥有过、却从未实现的那些梦想，后来怎样了？', data_i18n: 'q40_destino_sonhos' }
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
      { number: 41, block: 5, theme: 'choro', id: 'q41_choro', label: '你是否经常哭泣？你能识别出通常是什么引发这种哭泣吗？', data_i18n: 'q41_choro' },
      { number: 42, block: 5, theme: 'origem_do_choro', id: 'q42_origem_choro', label: '这种哭泣是源于内心的空虚、失去，还是懊悔？', data_i18n: 'q42_origem_choro' },
      { number: 43, block: 5, theme: 'expressao_da_dor', id: 'q43_expressao_dor', label: '当泪水涌现时，占主导的是什么：沉默、寻求能加深这种感受的事物，还是想要爆发的愤怒？', data_i18n: 'q43_expressao_dor' },
      { number: 44, block: 5, theme: 'tristeza_depressao', id: 'q44_tristeza_depressao', label: '你感到悲伤，还是认为自己正处于抑郁状态？你能分辨这两种体验之间的区别吗？', data_i18n: 'q44_tristeza_depressao' },
      { number: 45, block: 5, theme: 'ajuda_profissional', id: 'q45_ajuda_profissional', label: '如果你认为自己正处于抑郁状态，是否想过寻求专业帮助，以更好地理解自己的感受？', data_i18n: 'q45_ajuda_profissional' },
      { number: 46, block: 5, theme: 'comportamento_relacional', id: 'q46_comportamento_relacional', label: '在人际关系中，你认为自己更倾向于坚定自信、具有攻击性，还是顺从？', data_i18n: 'q46_comportamento_relacional' },
      { number: 47, block: 5, theme: 'autopercepcao', id: 'q47_autopercepcao', label: '你是否有时觉得难以与自己相处，或对自己认为做错的决定怀有怨恨或愤怒？', data_i18n: 'q47_autopercepcao' },
      { number: 48, block: 5, theme: 'autoimagem', id: 'q48_autoimagem', label: '你认为自己是一个有趣的人，还是认为自己对他人来说并不太有吸引力？', data_i18n: 'q48_autoimagem' },
      { number: 49, block: 5, theme: 'limites', id: 'q49_limites', label: '你是否难以对别人说"不"？', data_i18n: 'q49_limites' },
      { number: 50, block: 5, theme: 'morte', id: 'q50_morte', label: '你害怕死亡吗？很多时候，恐惧不在于死亡本身，而在于死亡可能发生的方式。你如何感受这一点？', data_i18n: 'q50_morte' }
    ]
  }
],
}
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
