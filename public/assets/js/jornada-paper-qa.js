/* /assets/js/jornada-paper-qa.js
 * JORNADA ESSENCIAL — MAPA PSICOEMOCIONAL v1
 * Fonte oficial: 5 blocos / 50 perguntas / 7 idiomas.
 * Não renderiza UI, não controla progresso e não controla navegação.
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

  const IDS = [
    'q01_base_cuidado','q02_vinculo_reconhecimento','q03_papel_familiar','q04_privacao_necessidade','q05_diferenca_exclusao','q06_resposta_protecao','q07_emocao_proibida','q08_crenca_aprendida','q09_necessidade_infantil','q10_origem_adulto',
    'q11_reacao_automatica','q12_funcao_protetiva','q13_gatilho_atual','q14_alivio_pos_resposta','q15_repeticao_regulacao','q16_desejo_expectativa','q17_aprovacao_vinculo','q18_reacao_ao_outro','q19_espelho_sombra','q20_protecao_custo',
    'q21_evento_transformador','q22_dor_e_adaptacao','q23_recurso_da_dor','q24_forca_em_excesso','q25_medo_de_perda','q26_ameaca_e_comportamento','q27_cuidado_e_prioridade','q28_culpa_autocuidado','q29_receber_reconhecimento','q30_soltar_protecao',
    'q31_vida_desejada','q32_falta_no_presente','q33_risco_da_mudanca','q34_contradicao_desejo_acao','q35_voz_interna','q36_origem_da_voz','q37_autenticidade_relacional','q38_medo_de_ser_visto','q39_preco_da_aceitacao','q40_projecao_do_padrao',
    'q41_dor_passado_presente','q42_nova_compreensao','q43_culpa_e_sobrevivencia','q44_forca_que_precisa_cuidado','q45_cuidado_negado_a_si','q46_recurso_preservado','q47_provar_valor','q48_vida_sem_prova','q49_encerrar_historia','q50_sintese_transformadora'
  ];

  const THEMES = [
    'base_de_cuidado','vinculo_e_reconhecimento','papel_familiar','privacao_e_necessidade','diferenca_e_exclusao','resposta_de_protecao','emocao_reprimida','crenca_aprendida','necessidade_infantil','ponte_infancia_adulto',
    'reacao_automatica','funcao_da_protecao','gatilho_atual','reforco_e_alivio','regulacao_repetitiva','desejo_vs_expectativa','aprovacao_e_vinculo','projecao_e_reacao','espelho_e_sombra','protecao_vs_custo',
    'evento_transformador','dor_e_adaptacao','recurso_desenvolvido','recurso_em_excesso','medo_de_perda','ameaca_e_resposta','cuidado_e_autoabandono','culpa_no_autocuidado','receber_valor','soltar_defesa',
    'desejo_autentico','necessidade_nao_atendida','medo_da_mudanca','contradicao_desejo_acao','voz_interna','origem_da_voz','autenticidade','medo_de_exposicao','preco_do_pertencimento','projecao_de_futuro',
    'dor_que_permanece','ressignificacao','autocompaixao','vulnerabilidade_e_cuidado','reciprocidade_interna','recurso_da_adversidade','valor_e_validacao','liberdade_de_expectativas','fechamento_e_escolha','sintese_e_agencia'
  ];

  const MAP_AXES = [
    ['experiencia','vinculo','seguranca'],['vinculo','necessidade','reconhecimento'],['papel','adaptacao','pertencimento'],['experiencia','dor','seguranca'],['experiencia','vergonha','exclusao'],['adaptacao','protecao','comportamento'],['emocao','protecao','expressao'],['crenca','significado','autonomia'],['necessidade','vazio','vinculo'],['padrao','origem','identidade'],
    ['gatilho','emocao','comportamento'],['protecao','dor','evitacao'],['gatilho','medo','vergonha'],['reforco','alivio','evitacao'],['regulacao','compulsao','custo'],['desejo','aprovacao','limites'],['vinculo','aprovacao','vazio'],['projecao','emocao','sombra'],['sombra','autopercepcao','projecao'],['protecao','custo','padrao'],
    ['identidade','mudanca','historia'],['dor','adaptacao','sobrevivencia'],['recurso','forca','resiliencia'],['recurso','excesso','custo'],['medo','perda','seguranca'],['ameaca','comportamento','protecao'],['cuidado','limites','autoabandono'],['culpa','autocuidado','merecimento'],['autoestima','reconhecimento','crenca'],['protecao','liberdade','identidade'],
    ['desejo','proposito','liberdade'],['necessidade','vazio','presente'],['medo','perda','mudanca'],['contradicao','desejo','comportamento'],['crenca','critica_interna','medo'],['origem','memoria','crenca'],['autenticidade','vinculo','papel'],['vergonha','exposicao','protecao'],['pertencimento','custo','limites'],['padrao','consequencia','futuro'],
    ['dor','repeticao','presente'],['ressignificacao','padrao','consciencia'],['culpa','protecao','autocompaixao'],['forca','vulnerabilidade','necessidade'],['cuidado','reciprocidade','autoestima'],['recurso','adversidade','identidade'],['valor','aprovacao','merecimento'],['liberdade','desejo','autonomia'],['fechamento','perdao','escolha'],['sintese','agencia','transformacao']
  ];

  const TEXTS = {
    'pt-BR': [
      'Quem esteve mais presente na sua criação? Quando você precisava de proteção, acolhimento ou ajuda, a quem recorria — e o que normalmente acontecia?',
      'Na casa em que você cresceu, o que precisava fazer para receber atenção, carinho ou reconhecimento? Havia algo em você que parecia incomodar, decepcionar ou provocar críticas?',
      'Entre as pessoas da sua família, que lugar você acabou ocupando: o responsável, o obediente, o forte, o engraçado, o rebelde, o invisível, o cuidador — ou outro? Por que acredita que esse lugar se tornou seu?',
      'Quando criança, houve alguma experiência de falta — comida, dinheiro, segurança, carinho, presença, estabilidade ou outra coisa importante? O que você lembra de sentir quando percebia essa falta?',
      'Houve alguma característica sua — aparência, corpo, jeito de falar, condição física, origem, comportamento ou forma de ser — pela qual você se sentiu diferente, inferiorizado, ridicularizado ou excluído? O que aconteceu?',
      'Quando alguém criticava, rejeitava, humilhava ou fazia você se sentir inadequado, como costumava reagir: enfrentava, chorava, se calava, tentava agradar, se afastava, fingia não se importar — ou fazia outra coisa?',
      'O que você aprendeu cedo que era perigoso demonstrar diante dos outros — medo, fraqueza, raiva, tristeza, necessidade, afeto, opinião, choro ou alguma outra parte sua? Por quê?',
      'Quando alguma coisa dava errado na infância ou adolescência, qual pensamento surgia mais facilmente: “eu fiz algo errado”, “há algo errado comigo”, “ninguém vai me ajudar”, “preciso resolver sozinho”, “não posso confiar” — ou outro?',
      'Pensando naquela criança que você foi, do que ela mais precisava e talvez não tenha recebido na medida em que precisava?',
      'Depois de tudo que acabou de recordar, qual característica do adulto que você é hoje parece ter começado a ser construída naquela época? Não precisa ter certeza; diga apenas o que lhe vem à mente.',
      'Quando hoje acontece algo que faz você se sentir rejeitado, criticado, desvalorizado ou ameaçado, qual é sua reação mais automática antes mesmo de pensar muito?',
      'Quando essa reação acontece, o que você parece estar tentando evitar sentir ou viver novamente?',
      'Existe alguma situação que outras pessoas parecem enfrentar com naturalidade, mas que provoca em você desconforto, medo, vergonha, raiva ou vontade de fugir? Dê um exemplo real.',
      'Quando você evita essa situação, cede, controla, agrada, se cala ou se afasta, o que sente logo depois: alívio, segurança, culpa, frustração, poder, vazio — ou outra coisa?',
      'Existe algo que você faz repetidamente mesmo sabendo que depois pode se arrepender — comer, beber, comprar, trabalhar demais, controlar, agradar, discutir, se isolar, buscar aprovação ou outra coisa? O que sente imediatamente antes e depois?',
      'Quando precisa escolher entre aquilo que você realmente quer e aquilo que acredita que esperam de você, qual costuma vencer? Conte uma situação.',
      'Existe alguém cuja aprovação, presença, reconhecimento ou perdão ainda parece ter um peso especial para você? O que gostaria de receber dessa pessoa?',
      'Que tipo de pessoa ou comportamento desperta em você uma reação emocional muito forte — admiração, irritação, inveja, medo, desprezo ou fascínio? O que exatamente nisso te afeta?',
      'Existe alguma característica que você critica duramente nos outros, mas reconhece — mesmo em pequena medida — em você?',
      'Olhando para suas respostas até aqui, qual comportamento seu talvez tenha começado como proteção, mas hoje às vezes também limita sua vida?',
      'Qual experiência da sua vida mais mudou a maneira como você enxerga a si mesmo? Quem você era antes dela — e quem acredita ter se tornado depois?',
      'Qual foi uma das dores emocionais mais difíceis que já atravessou? O que você fez para continuar funcionando mesmo sentindo aquilo?',
      'Daquela experiência difícil nasceu alguma força que hoje você considera parte importante de quem é? Qual?',
      'Essa mesma força alguma vez se torna um excesso? Por exemplo: independência que impede pedir ajuda, responsabilidade que vira sobrecarga, controle que impede confiar, generosidade que faz esquecer de si. Como isso aparece em você?',
      'O que você mais teme perder hoje — uma pessoa, estabilidade, controle, reconhecimento, liberdade, saúde, dinheiro, pertencimento ou outra coisa? Por que essa perda seria tão difícil?',
      'Quando sente que aquilo que mais valoriza está ameaçado, o que muda no seu comportamento?',
      'Quem costuma receber de você mais cuidado, compreensão e energia: você ou as outras pessoas? O que acontece quando suas necessidades entram em conflito com as delas?',
      'Quando você se coloca em primeiro lugar, que sentimento aparece: tranquilidade, culpa, egoísmo, medo de decepcionar, liberdade — ou outro?',
      'Quando recebe um elogio sincero, você consegue acreditar nele ou alguma parte sua imediatamente diminui, desconfia ou rejeita aquilo que ouviu? O que passa pela sua cabeça?',
      'Se pudesse abandonar hoje uma única forma de se proteger sem correr nenhum risco, qual escolheria — e quem acredita que poderia se tornar sem ela?',
      'Se medo, dinheiro, idade, opinião alheia e possibilidade de fracassar deixassem de ser obstáculos por um instante, que vida você escolheria viver?',
      'O que existe nessa vida imaginada que está faltando na sua vida atual?',
      'O que você acredita que perderia ou colocaria em risco se realmente começasse a viver dessa maneira?',
      'Existe algo que você diz querer muito, mas suas escolhas repetidas parecem empurrar para longe? O que é?',
      'Quando uma oportunidade importante aparece, qual voz costuma falar primeiro dentro de você? O que ela diz?',
      'Essa voz lembra alguém da sua história ou alguma experiência que você já contou nesta Jornada?',
      'Em quais relações você consegue ser plenamente você — e diante de quem percebe que muda, se diminui, se controla ou representa um papel?',
      'O que acredita que aconteceria se essas pessoas conhecessem justamente a parte sua que você mais tenta esconder ou controlar?',
      'Qual preço você já pagou para ser aceito, evitar conflito, manter segurança ou corresponder às expectativas dos outros?',
      'Se continuar repetindo pelos próximos dez anos os mesmos padrões que reconheceu nesta Jornada, onde acredita que eles poderão levar sua vida?',
      'Depois de tudo que contou, qual dor do passado você percebe que ainda influencia alguma escolha sua no presente?',
      'Que comportamento seu você compreende de maneira diferente agora que conhece melhor a história que existe por trás dele?',
      'Existe alguma coisa pela qual você se culpou durante muito tempo e que hoje consegue enxergar também como uma tentativa de sobreviver, pertencer, ser amado ou se proteger?',
      'Qual parte de você passou tanto tempo tentando ser forte que talvez nunca tenha recebido permissão para admitir que também precisava de cuidado?',
      'O que você oferece com facilidade às pessoas que ama, mas tem dificuldade de oferecer a si mesmo?',
      'Qual qualidade sua nasceu justamente de uma experiência difícil e hoje você não gostaria de perder, mesmo podendo apagar aquela dor?',
      'O que você ainda faz para provar que tem valor — e para quem, no fundo, sente que precisa provar isso?',
      'Se você não precisasse mais provar nada, proteger ninguém de tudo, agradar ninguém nem corresponder a nenhuma expectativa, o que mudaria primeiro na maneira como vive?',
      'Existe algo que você precisa perdoar, aceitar, encerrar, dizer, começar ou deixar para trás para não continuar vivendo segundo uma história que já passou? O quê?',
      'Depois de atravessar estas 50 perguntas, fale ou escreva, sem pensar demais, três palavras ou expressões bem curtas. A primeira resposta deve dizer: durante muito tempo, o que eu precisei ser? A segunda resposta: para conseguir o quê? E a terceira resposta: hoje percebo que posso ser ou fazer o quê?'
    ],
    'en-US': [
      'Who was most present in raising you? When you needed protection, comfort, or help, whom did you turn to — and what usually happened?',
      'In the home where you grew up, what did you feel you had to do to receive attention, affection, or recognition? Was there anything about you that seemed to disappoint, bother, or invite criticism?',
      'Within your family, what role did you end up taking: the responsible one, the obedient one, the strong one, the funny one, the rebel, the invisible one, the caregiver — or another? Why do you think that role became yours?',
      'As a child, did you experience any important lack — food, money, safety, affection, presence, stability, or something else? What do you remember feeling when you noticed that lack?',
      'Was there something about you — appearance, body, way of speaking, physical condition, background, behavior, or way of being — that made you feel different, inferior, mocked, or excluded? What happened?',
      'When someone criticized, rejected, humiliated, or made you feel inadequate, how did you usually react: confront, cry, go quiet, try to please, withdraw, pretend not to care — or something else?',
      'What did you learn early on was dangerous to show others — fear, weakness, anger, sadness, need, affection, opinions, tears, or some other part of yourself? Why?',
      'When something went wrong in childhood or adolescence, which thought came most easily: “I did something wrong,” “something is wrong with me,” “no one will help me,” “I have to solve it alone,” “I can’t trust” — or another?',
      'Thinking about the child you were, what did that child need most and perhaps did not receive in the amount they needed?',
      'After everything you have just remembered, what trait of the adult you are today seems to have begun taking shape back then? You do not need to be certain; say what first comes to mind.',
      'When something today makes you feel rejected, criticized, devalued, or threatened, what is your most automatic reaction before you have time to think?',
      'When that reaction happens, what do you seem to be trying to avoid feeling or experiencing again?',
      'Is there a situation other people seem to handle naturally but that triggers discomfort, fear, shame, anger, or the urge to escape in you? Give a real example.',
      'When you avoid that situation, give in, control, please, stay silent, or withdraw, what do you feel right afterward: relief, safety, guilt, frustration, power, emptiness — or something else?',
      'Is there something you do repeatedly even though you may regret it later — eating, drinking, buying, overworking, controlling, pleasing, arguing, isolating yourself, seeking approval, or something else? What do you feel immediately before and after?',
      'When you must choose between what you truly want and what you believe others expect from you, which usually wins? Describe a situation.',
      'Is there someone whose approval, presence, recognition, or forgiveness still carries special weight for you? What would you like to receive from that person?',
      'What kind of person or behavior triggers a very strong emotional reaction in you — admiration, irritation, envy, fear, contempt, or fascination? What exactly affects you?',
      'Is there a trait you judge harshly in others but can recognize — even slightly — in yourself?',
      'Looking at your answers so far, which behavior of yours may have begun as protection but now sometimes limits your life?',
      'Which experience in your life most changed the way you see yourself? Who were you before it — and who do you believe you became afterward?',
      'What was one of the hardest emotional pains you have gone through? What did you do to keep functioning while you were feeling it?',
      'Did any strength emerge from that difficult experience that you now consider an important part of who you are? Which one?',
      'Does that same strength ever become excessive? For example: independence that prevents asking for help, responsibility that becomes overload, control that makes trust difficult, generosity that makes you forget yourself. How does this show up in you?',
      'What are you most afraid of losing today — a person, stability, control, recognition, freedom, health, money, belonging, or something else? Why would that loss be so difficult?',
      'When you feel that what you value most is threatened, what changes in your behavior?',
      'Who usually receives more of your care, understanding, and energy: you or other people? What happens when your needs conflict with theirs?',
      'When you put yourself first, what feeling appears: calm, guilt, selfishness, fear of disappointing someone, freedom — or something else?',
      'When you receive a sincere compliment, can you believe it, or does some part of you immediately minimize, distrust, or reject what you heard? What goes through your mind?',
      'If you could safely give up one way you protect yourself today, which would you choose — and who do you think you might become without it?',
      'If fear, money, age, other people’s opinions, and the possibility of failure stopped being obstacles for a moment, what life would you choose to live?',
      'What is present in that imagined life that is missing from your current life?',
      'What do you believe you would lose or put at risk if you truly began living that way?',
      'Is there something you say you want deeply, yet your repeated choices seem to push it farther away? What is it?',
      'When an important opportunity appears, which voice tends to speak first inside you? What does it say?',
      'Does that voice remind you of someone in your history or of an experience you have already described in this Journey?',
      'In which relationships can you be fully yourself — and around whom do you notice that you change, shrink yourself, control yourself, or play a role?',
      'What do you believe would happen if those people saw exactly the part of you that you most try to hide or control?',
      'What price have you already paid to be accepted, avoid conflict, preserve security, or meet other people’s expectations?',
      'If you keep repeating for the next ten years the same patterns you have recognized in this Journey, where do you believe they may take your life?',
      'After everything you have shared, which pain from the past do you notice still influencing a choice you make in the present?',
      'Which behavior of yours do you understand differently now that you know more about the story behind it?',
      'Is there something you blamed yourself for for a long time that you can now also see as an attempt to survive, belong, be loved, or protect yourself?',
      'Which part of you has spent so long trying to be strong that it may never have been allowed to admit it also needed care?',
      'What do you give easily to the people you love but find difficult to give to yourself?',
      'Which quality of yours was born precisely from a difficult experience and you would not want to lose today, even if you could erase the pain that gave rise to it?',
      'What do you still do to prove that you have value — and to whom, deep down, do you feel you need to prove it?',
      'If you no longer had to prove anything, protect everyone from everything, please anyone, or meet any expectation, what would change first in the way you live?',
      'Is there something you need to forgive, accept, end, say, begin, or leave behind so that you do not keep living according to a story that has already passed? What?',
      'After going through these 50 questions, speak or write, without thinking too much, three words or very short expressions. The first answer should say: for a long time, what did I need to be? The second answer: in order to achieve what? And the third answer: today, what do I realize I can be or do?',
    ],
    'es-ES': [],
    'fr-FR': [],
    'de-DE': [],
    'ja-JP': [],
    'zh-CN': []
  };

  // Traduções ES/FR/DE/JA/ZH são declaradas abaixo em arrays separados
  // para manter o arquivo legível e validar exatamente 50 itens por idioma.
  TEXTS['es-ES'] = [
    '¿Quién estuvo más presente en tu crianza? Cuando necesitabas protección, acogida o ayuda, ¿a quién recurrías y qué solía ocurrir?',
    'En el hogar donde creciste, ¿qué sentías que debías hacer para recibir atención, cariño o reconocimiento? ¿Había algo en ti que parecía molestar, decepcionar o provocar críticas?',
    'Dentro de tu familia, ¿qué papel terminaste ocupando: el responsable, el obediente, el fuerte, el gracioso, el rebelde, el invisible, el cuidador u otro? ¿Por qué crees que ese lugar se volvió tuyo?',
    'Cuando eras niño, ¿viviste alguna carencia importante — comida, dinero, seguridad, afecto, presencia, estabilidad u otra cosa? ¿Qué recuerdas haber sentido al percibir esa falta?',
    '¿Hubo alguna característica tuya — apariencia, cuerpo, forma de hablar, condición física, origen, comportamiento o manera de ser — por la que te sintieras diferente, inferior, ridiculizado o excluido? ¿Qué ocurrió?',
    'Cuando alguien te criticaba, rechazaba, humillaba o te hacía sentir inadecuado, ¿cómo solías reaccionar: enfrentabas, llorabas, callabas, intentabas agradar, te alejabas, fingías que no te importaba u otra cosa?',
    '¿Qué aprendiste pronto que era peligroso mostrar ante los demás — miedo, debilidad, rabia, tristeza, necesidad, afecto, opinión, llanto u otra parte de ti? ¿Por qué?',
    'Cuando algo salía mal en la infancia o adolescencia, ¿qué pensamiento aparecía con más facilidad: “hice algo mal”, “hay algo mal en mí”, “nadie me ayudará”, “tengo que resolverlo solo”, “no puedo confiar” u otro?',
    'Pensando en el niño que fuiste, ¿qué era lo que más necesitaba y quizá no recibió en la medida que necesitaba?',
    'Después de todo lo que acabas de recordar, ¿qué característica del adulto que eres hoy parece haber empezado a construirse en aquella época? No necesitas estar seguro; di simplemente lo primero que te venga.',
    'Cuando hoy sucede algo que te hace sentir rechazado, criticado, desvalorizado o amenazado, ¿cuál es tu reacción más automática antes incluso de pensarlo mucho?',
    'Cuando aparece esa reacción, ¿qué parece que intentas evitar sentir o vivir de nuevo?',
    '¿Hay alguna situación que otras personas parecen afrontar con naturalidad pero que en ti provoca incomodidad, miedo, vergüenza, rabia o ganas de huir? Da un ejemplo real.',
    'Cuando evitas esa situación, cedes, controlas, agradas, callas o te alejas, ¿qué sientes justo después: alivio, seguridad, culpa, frustración, poder, vacío u otra cosa?',
    '¿Hay algo que haces repetidamente aunque sepas que después puedes arrepentirte — comer, beber, comprar, trabajar en exceso, controlar, agradar, discutir, aislarte, buscar aprobación u otra cosa? ¿Qué sientes inmediatamente antes y después?',
    'Cuando tienes que elegir entre lo que realmente quieres y lo que crees que esperan de ti, ¿qué suele ganar? Cuenta una situación.',
    '¿Hay alguien cuya aprobación, presencia, reconocimiento o perdón todavía tenga un peso especial para ti? ¿Qué te gustaría recibir de esa persona?',
    '¿Qué tipo de persona o comportamiento despierta en ti una reacción emocional muy fuerte — admiración, irritación, envidia, miedo, desprecio o fascinación? ¿Qué es exactamente lo que te afecta?',
    '¿Hay alguna característica que criticas duramente en los demás pero que reconoces — aunque sea un poco — en ti?',
    'Mirando tus respuestas hasta aquí, ¿qué comportamiento tuyo pudo haber empezado como protección pero hoy, a veces, también limita tu vida?',
    '¿Qué experiencia de tu vida cambió más la forma en que te ves a ti mismo? ¿Quién eras antes y quién crees haberte convertido después?',
    '¿Cuál fue uno de los dolores emocionales más difíciles que atravesaste? ¿Qué hiciste para seguir funcionando aun sintiendo aquello?',
    '¿Nació de aquella experiencia difícil alguna fortaleza que hoy consideras una parte importante de quien eres? ¿Cuál?',
    '¿Esa misma fortaleza alguna vez se vuelve excesiva? Por ejemplo: independencia que impide pedir ayuda, responsabilidad que se vuelve sobrecarga, control que dificulta confiar, generosidad que hace olvidarte de ti. ¿Cómo aparece eso en ti?',
    '¿Qué temes perder más hoy — una persona, estabilidad, control, reconocimiento, libertad, salud, dinero, pertenencia u otra cosa? ¿Por qué esa pérdida sería tan difícil?',
    'Cuando sientes amenazado aquello que más valoras, ¿qué cambia en tu comportamiento?',
    '¿Quién suele recibir más de tu cuidado, comprensión y energía: tú u otras personas? ¿Qué ocurre cuando tus necesidades entran en conflicto con las de ellas?',
    'Cuando te pones en primer lugar, ¿qué sentimiento aparece: tranquilidad, culpa, egoísmo, miedo a decepcionar, libertad u otro?',
    'Cuando recibes un elogio sincero, ¿puedes creerlo o alguna parte de ti lo minimiza, desconfía o rechaza de inmediato? ¿Qué pasa por tu mente?',
    'Si hoy pudieras abandonar sin ningún riesgo una sola forma de protegerte, ¿cuál elegirías y quién crees que podrías llegar a ser sin ella?',
    'Si el miedo, el dinero, la edad, la opinión ajena y la posibilidad de fracasar dejaran de ser obstáculos por un instante, ¿qué vida elegirías vivir?',
    '¿Qué hay en esa vida imaginada que falta en tu vida actual?',
    '¿Qué crees que perderías o pondrías en riesgo si realmente empezaras a vivir de esa manera?',
    '¿Hay algo que dices desear mucho, pero tus elecciones repetidas parecen alejar? ¿Qué es?',
    'Cuando aparece una oportunidad importante, ¿qué voz suele hablar primero dentro de ti? ¿Qué dice?',
    '¿Esa voz te recuerda a alguien de tu historia o a alguna experiencia que ya contaste en esta Jornada?',
    '¿En qué relaciones consigues ser plenamente tú y ante quién notas que cambias, te haces pequeño, te controlas o interpretas un papel?',
    '¿Qué crees que ocurriría si esas personas conocieran precisamente la parte de ti que más intentas esconder o controlar?',
    '¿Qué precio has pagado para ser aceptado, evitar conflictos, mantener seguridad o responder a las expectativas de los demás?',
    'Si durante los próximos diez años sigues repitiendo los mismos patrones que reconociste en esta Jornada, ¿adónde crees que podrían llevar tu vida?',
    'Después de todo lo que has contado, ¿qué dolor del pasado percibes que todavía influye en alguna elección de tu presente?',
    '¿Qué comportamiento tuyo comprendes de manera diferente ahora que conoces mejor la historia que hay detrás de él?',
    '¿Hay algo por lo que te culpaste durante mucho tiempo y que hoy puedes ver también como un intento de sobrevivir, pertenecer, ser amado o protegerte?',
    '¿Qué parte de ti pasó tanto tiempo intentando ser fuerte que quizá nunca recibió permiso para admitir que también necesitaba cuidado?',
    '¿Qué ofreces con facilidad a las personas que amas, pero te cuesta ofrecerte a ti mismo?',
    '¿Qué cualidad tuya nació precisamente de una experiencia difícil y hoy no querrías perder, incluso si pudieras borrar aquel dolor?',
    '¿Qué sigues haciendo para demostrar que tienes valor y a quién, en el fondo, sientes que necesitas demostrárselo?',
    'Si ya no tuvieras que demostrar nada, proteger a todos de todo, agradar a nadie ni responder a ninguna expectativa, ¿qué cambiaría primero en tu forma de vivir?',
    '¿Hay algo que necesitas perdonar, aceptar, terminar, decir, comenzar o dejar atrás para no seguir viviendo según una historia que ya pasó? ¿Qué?',
    'Después de recorrer estas 50 preguntas, habla o escribe, sin pensarlo demasiado, tres palabras o expresiones muy breves. La primera respuesta debe decir: durante mucho tiempo, ¿qué necesité ser? La segunda respuesta: ¿para conseguir qué? Y la tercera respuesta: hoy, ¿qué percibo que puedo ser o hacer?',
  ];

  TEXTS['fr-FR'] = [
    'Qui a été le plus présent dans votre éducation ? Lorsque vous aviez besoin de protection, de réconfort ou d’aide, vers qui vous tourniez-vous — et que se passait-il généralement ?',
    'Dans la maison où vous avez grandi, que pensiez-vous devoir faire pour recevoir de l’attention, de l’affection ou de la reconnaissance ? Y avait-il quelque chose en vous qui semblait déranger, décevoir ou susciter des critiques ?',
    'Au sein de votre famille, quel rôle avez-vous fini par occuper : le responsable, l’obéissant, le fort, le drôle, le rebelle, l’invisible, celui qui prend soin des autres — ou un autre ? Pourquoi pensez-vous que ce rôle est devenu le vôtre ?',
    'Dans votre enfance, avez-vous connu un manque important — nourriture, argent, sécurité, affection, présence, stabilité ou autre chose ? Que vous souvenez-vous avoir ressenti lorsque vous constatiez ce manque ?',
    'Y avait-il quelque chose chez vous — apparence, corps, façon de parler, condition physique, origine, comportement ou manière d’être — qui vous a fait vous sentir différent, inférieur, ridiculisé ou exclu ? Que s’est-il passé ?',
    'Lorsque quelqu’un vous critiquait, vous rejetait, vous humiliait ou vous faisait vous sentir inadéquat, comment réagissiez-vous habituellement : vous affrontiez, pleuriez, vous taisiez, cherchiez à plaire, vous éloigniez, faisiez semblant de ne pas être touché — ou autrement ?',
    'Qu’avez-vous appris très tôt qu’il était dangereux de montrer aux autres — peur, faiblesse, colère, tristesse, besoin, affection, opinion, larmes ou une autre part de vous ? Pourquoi ?',
    'Quand quelque chose tournait mal pendant l’enfance ou l’adolescence, quelle pensée venait le plus facilement : « j’ai fait quelque chose de mal », « quelque chose ne va pas chez moi », « personne ne m’aidera », « je dois me débrouiller seul », « je ne peux pas faire confiance » — ou une autre ?',
    'En pensant à l’enfant que vous étiez, de quoi avait-il le plus besoin et qu’il n’a peut-être pas reçu autant qu’il en avait besoin ?',
    'Après tout ce que vous venez de vous rappeler, quelle caractéristique de l’adulte que vous êtes aujourd’hui semble avoir commencé à se construire à cette époque ? Vous n’avez pas besoin d’en être certain ; dites simplement ce qui vous vient.',
    'Lorsqu’aujourd’hui quelque chose vous fait vous sentir rejeté, critiqué, dévalorisé ou menacé, quelle est votre réaction la plus automatique avant même d’avoir le temps d’y réfléchir ?',
    'Quand cette réaction apparaît, qu’essayez-vous peut-être d’éviter de ressentir ou de revivre ?',
    'Existe-t-il une situation que les autres semblent affronter naturellement mais qui provoque chez vous malaise, peur, honte, colère ou envie de fuir ? Donnez un exemple réel.',
    'Lorsque vous évitez cette situation, cédez, contrôlez, cherchez à plaire, vous taisez ou vous éloignez, que ressentez-vous juste après : soulagement, sécurité, culpabilité, frustration, pouvoir, vide — ou autre chose ?',
    'Y a-t-il quelque chose que vous faites de façon répétée tout en sachant que vous pourriez le regretter ensuite — manger, boire, acheter, trop travailler, contrôler, plaire, vous disputer, vous isoler, chercher l’approbation ou autre chose ? Que ressentez-vous immédiatement avant et après ?',
    'Lorsque vous devez choisir entre ce que vous voulez vraiment et ce que vous pensez que les autres attendent de vous, qu’est-ce qui l’emporte le plus souvent ? Racontez une situation.',
    'Y a-t-il quelqu’un dont l’approbation, la présence, la reconnaissance ou le pardon a encore un poids particulier pour vous ? Qu’aimeriez-vous recevoir de cette personne ?',
    'Quel type de personne ou de comportement déclenche chez vous une réaction émotionnelle très forte — admiration, irritation, envie, peur, mépris ou fascination ? Qu’est-ce qui vous touche exactement ?',
    'Y a-t-il un trait que vous critiquez sévèrement chez les autres mais que vous reconnaissez — même un peu — en vous-même ?',
    'En regardant vos réponses jusqu’ici, quel comportement a peut-être commencé comme une protection mais limite parfois votre vie aujourd’hui ?',
    'Quelle expérience de votre vie a le plus changé la manière dont vous vous percevez ? Qui étiez-vous avant — et qui pensez-vous être devenu ensuite ?',
    'Quelle a été l’une des douleurs émotionnelles les plus difficiles que vous ayez traversées ? Qu’avez-vous fait pour continuer à fonctionner malgré ce que vous ressentiez ?',
    'De cette expérience difficile est-elle née une force que vous considérez aujourd’hui comme une part importante de vous ? Laquelle ?',
    'Cette même force devient-elle parfois excessive ? Par exemple : une indépendance qui empêche de demander de l’aide, une responsabilité qui devient surcharge, un contrôle qui empêche de faire confiance, une générosité qui vous fait vous oublier. Comment cela se manifeste-t-il chez vous ?',
    'Qu’avez-vous le plus peur de perdre aujourd’hui — une personne, la stabilité, le contrôle, la reconnaissance, la liberté, la santé, l’argent, l’appartenance ou autre chose ? Pourquoi cette perte serait-elle si difficile ?',
    'Lorsque vous sentez que ce qui compte le plus pour vous est menacé, qu’est-ce qui change dans votre comportement ?',
    'Qui reçoit généralement le plus de votre attention, de votre compréhension et de votre énergie : vous-même ou les autres ? Que se passe-t-il lorsque vos besoins entrent en conflit avec les leurs ?',
    'Lorsque vous vous placez en premier, quel sentiment apparaît : tranquillité, culpabilité, égoïsme, peur de décevoir, liberté — ou autre chose ?',
    'Lorsque vous recevez un compliment sincère, arrivez-vous à y croire ou une partie de vous le minimise-t-elle, s’en méfie-t-elle ou le rejette-t-elle immédiatement ? Qu’est-ce qui vous traverse l’esprit ?',
    'Si vous pouviez abandonner aujourd’hui, sans aucun risque, une seule façon de vous protéger, laquelle choisiriez-vous — et qui pensez-vous pouvoir devenir sans elle ?',
    'Si la peur, l’argent, l’âge, l’opinion des autres et la possibilité d’échouer cessaient un instant d’être des obstacles, quelle vie choisiriez-vous de vivre ?',
    'Qu’y a-t-il dans cette vie imaginée qui manque à votre vie actuelle ?',
    'Que pensez-vous perdre ou mettre en danger si vous commenciez réellement à vivre de cette manière ?',
    'Y a-t-il quelque chose que vous dites vouloir profondément, mais dont vos choix répétés semblent vous éloigner ? Qu’est-ce que c’est ?',
    'Lorsqu’une occasion importante se présente, quelle voix parle généralement en premier en vous ? Que dit-elle ?',
    'Cette voix vous rappelle-t-elle quelqu’un de votre histoire ou une expérience que vous avez déjà racontée au cours de cette Journée ?',
    'Dans quelles relations pouvez-vous être pleinement vous-même — et devant qui remarquez-vous que vous changez, vous vous diminuez, vous contrôlez ou jouez un rôle ?',
    'Que pensez-vous qu’il se passerait si ces personnes connaissaient précisément la part de vous que vous essayez le plus de cacher ou de contrôler ?',
    'Quel prix avez-vous déjà payé pour être accepté, éviter les conflits, préserver la sécurité ou répondre aux attentes des autres ?',
    'Si vous continuez pendant les dix prochaines années à répéter les mêmes schémas que vous avez reconnus dans cette Journée, où pensez-vous qu’ils pourraient conduire votre vie ?',
    'Après tout ce que vous avez raconté, quelle douleur du passé percevez-vous encore comme influençant un choix de votre présent ?',
    'Quel comportement comprenez-vous différemment maintenant que vous connaissez mieux l’histoire qui se trouve derrière lui ?',
    'Y a-t-il quelque chose dont vous vous êtes longtemps reproché et que vous pouvez aujourd’hui voir aussi comme une tentative de survivre, d’appartenir, d’être aimé ou de vous protéger ?',
    'Quelle part de vous a passé tellement de temps à essayer d’être forte qu’elle n’a peut-être jamais reçu la permission d’admettre qu’elle avait aussi besoin de soins ?',
    'Qu’offrez-vous facilement aux personnes que vous aimez, mais avez-vous du mal à vous offrir à vous-même ?',
    'Quelle qualité en vous est née précisément d’une expérience difficile et que vous ne voudriez pas perdre aujourd’hui, même si vous pouviez effacer la douleur qui l’a fait naître ?',
    'Que faites-vous encore pour prouver que vous avez de la valeur — et à qui, au fond, sentez-vous devoir le prouver ?',
    'Si vous n’aviez plus rien à prouver, personne à protéger de tout, personne à satisfaire et aucune attente à remplir, qu’est-ce qui changerait d’abord dans votre manière de vivre ?',
    'Y a-t-il quelque chose que vous devez pardonner, accepter, terminer, dire, commencer ou laisser derrière vous afin de ne plus vivre selon une histoire déjà passée ? Quoi ?',
    'Après avoir parcouru ces 50 questions, dites ou écrivez, sans trop réfléchir, trois mots ou expressions très courtes. La première réponse doit dire : pendant longtemps, qu’ai-je eu besoin d’être ? La deuxième réponse : pour obtenir quoi ? Et la troisième réponse : aujourd’hui, qu’est-ce que je réalise pouvoir être ou faire ?',
  ];
  TEXTS['de-DE'] = [
    'Wer war in Ihrer Erziehung am stärksten präsent? Wenn Sie Schutz, Trost oder Hilfe brauchten, an wen wandten Sie sich — und was geschah gewöhnlich?',
    'Was glaubten Sie in Ihrem Elternhaus tun zu müssen, um Aufmerksamkeit, Zuneigung oder Anerkennung zu bekommen? Gab es etwas an Ihnen, das andere zu stören, zu enttäuschen oder Kritik hervorzurufen schien?',
    'Welche Rolle haben Sie in Ihrer Familie schließlich eingenommen: die verantwortliche, gehorsame, starke, lustige, rebellische, unsichtbare oder fürsorgliche Person — oder eine andere? Warum glauben Sie, dass diese Rolle zu Ihrer wurde?',
    'Haben Sie als Kind einen wichtigen Mangel erlebt — an Essen, Geld, Sicherheit, Zuneigung, Anwesenheit, Stabilität oder etwas anderem? Woran erinnern Sie sich, was Sie dabei empfanden?',
    'Gab es etwas an Ihnen — Aussehen, Körper, Sprechweise, körperliche Verfassung, Herkunft, Verhalten oder Art zu sein — wodurch Sie sich anders, minderwertig, verspottet oder ausgeschlossen fühlten? Was ist geschehen?',
    'Wie reagierten Sie gewöhnlich, wenn jemand Sie kritisierte, ablehnte, demütigte oder Ihnen das Gefühl gab, nicht richtig zu sein: konfrontierten Sie, weinten Sie, schwiegen Sie, versuchten Sie zu gefallen, zogen Sie sich zurück, taten Sie so, als wäre es Ihnen egal — oder etwas anderes?',
    'Was haben Sie früh gelernt, vor anderen besser nicht zu zeigen — Angst, Schwäche, Wut, Traurigkeit, Bedürftigkeit, Zuneigung, Meinung, Tränen oder einen anderen Teil von sich? Warum?',
    'Wenn in Kindheit oder Jugend etwas schiefging, welcher Gedanke kam am ehesten: „Ich habe etwas falsch gemacht“, „mit mir stimmt etwas nicht“, „niemand wird mir helfen“, „ich muss es allein lösen“, „ich kann nicht vertrauen“ — oder ein anderer?',
    'Wenn Sie an das Kind denken, das Sie waren: Was brauchte dieses Kind am meisten und bekam es vielleicht nicht in dem Maß, wie es nötig gewesen wäre?',
    'Nach allem, woran Sie sich gerade erinnert haben: Welche Eigenschaft des Erwachsenen, der Sie heute sind, scheint damals begonnen zu haben? Sie müssen sich nicht sicher sein; sagen Sie einfach, was Ihnen in den Sinn kommt.',
    'Wenn heute etwas geschieht, wodurch Sie sich abgelehnt, kritisiert, entwertet oder bedroht fühlen, was ist Ihre automatischste Reaktion, noch bevor Sie viel darüber nachdenken?',
    'Wenn diese Reaktion auftritt, welches Gefühl oder welche Erfahrung versuchen Sie möglicherweise nicht noch einmal erleben zu müssen?',
    'Gibt es eine Situation, mit der andere scheinbar selbstverständlich umgehen, die bei Ihnen aber Unbehagen, Angst, Scham, Wut oder Fluchtimpulse auslöst? Nennen Sie ein konkretes Beispiel.',
    'Wenn Sie diese Situation vermeiden, nachgeben, kontrollieren, gefallen wollen, schweigen oder sich zurückziehen: Was fühlen Sie unmittelbar danach — Erleichterung, Sicherheit, Schuld, Frust, Macht, Leere oder etwas anderes?',
    'Gibt es etwas, das Sie wiederholt tun, obwohl Sie wissen, dass Sie es später bereuen könnten — essen, trinken, kaufen, zu viel arbeiten, kontrollieren, gefallen wollen, streiten, sich isolieren, Anerkennung suchen oder etwas anderes? Was fühlen Sie unmittelbar davor und danach?',
    'Wenn Sie zwischen dem wählen müssen, was Sie wirklich wollen, und dem, was andere Ihrer Meinung nach von Ihnen erwarten, was gewinnt meistens? Beschreiben Sie eine Situation.',
    'Gibt es jemanden, dessen Anerkennung, Anwesenheit, Wertschätzung oder Vergebung für Sie noch besonderes Gewicht hat? Was würden Sie gern von dieser Person erhalten?',
    'Welche Art von Mensch oder Verhalten löst bei Ihnen eine sehr starke emotionale Reaktion aus — Bewunderung, Ärger, Neid, Angst, Verachtung oder Faszination? Was genau berührt Sie daran?',
    'Gibt es eine Eigenschaft, die Sie bei anderen scharf kritisieren, aber — wenn auch nur ein wenig — bei sich selbst erkennen?',
    'Wenn Sie Ihre bisherigen Antworten betrachten: Welches Verhalten begann vielleicht als Schutz, begrenzt heute aber manchmal auch Ihr Leben?',
    'Welche Erfahrung in Ihrem Leben hat die Art, wie Sie sich selbst sehen, am stärksten verändert? Wer waren Sie davor — und wer glauben Sie danach geworden zu sein?',
    'Was war einer der schwierigsten emotionalen Schmerzen, die Sie durchlebt haben? Was haben Sie getan, um trotz dieses Gefühls weiterzufunktionieren?',
    'Ist aus dieser schwierigen Erfahrung eine Stärke entstanden, die Sie heute als wichtigen Teil Ihrer Persönlichkeit ansehen? Welche?',
    'Wird genau diese Stärke manchmal zu viel? Zum Beispiel: Unabhängigkeit, die Hilfe verhindert; Verantwortungsgefühl, das zur Überlastung wird; Kontrolle, die Vertrauen erschwert; Großzügigkeit, durch die Sie sich selbst vergessen. Wie zeigt sich das bei Ihnen?',
    'Was fürchten Sie heute am meisten zu verlieren — einen Menschen, Stabilität, Kontrolle, Anerkennung, Freiheit, Gesundheit, Geld, Zugehörigkeit oder etwas anderes? Warum wäre dieser Verlust so schwer?',
    'Wenn Sie spüren, dass das, was Ihnen am wichtigsten ist, bedroht wird, was verändert sich in Ihrem Verhalten?',
    'Wer erhält gewöhnlich mehr von Ihrer Fürsorge, Ihrem Verständnis und Ihrer Energie: Sie selbst oder andere Menschen? Was geschieht, wenn Ihre Bedürfnisse mit ihren in Konflikt geraten?',
    'Wenn Sie sich selbst an erste Stelle setzen, welches Gefühl taucht auf: Ruhe, Schuld, Egoismus, Angst jemanden zu enttäuschen, Freiheit — oder etwas anderes?',
    'Wenn Sie ein aufrichtiges Kompliment bekommen, können Sie es glauben, oder spielt ein Teil von Ihnen es sofort herunter, misstraut ihm oder weist es zurück? Was geht Ihnen durch den Kopf?',
    'Wenn Sie heute ohne jedes Risiko eine einzige Art, sich zu schützen, aufgeben könnten, welche wäre es — und wer könnten Sie Ihrer Meinung nach ohne sie werden?',
    'Wenn Angst, Geld, Alter, die Meinung anderer und die Möglichkeit zu scheitern für einen Moment keine Hindernisse wären, welches Leben würden Sie wählen?',
    'Was gibt es in diesem vorgestellten Leben, das Ihrem heutigen Leben fehlt?',
    'Was glauben Sie zu verlieren oder aufs Spiel zu setzen, wenn Sie wirklich anfangen würden, so zu leben?',
    'Gibt es etwas, von dem Sie sagen, dass Sie es sehr wollen, Ihre wiederholten Entscheidungen Sie aber scheinbar davon wegführen? Was ist es?',
    'Wenn sich eine wichtige Gelegenheit bietet, welche Stimme spricht zuerst in Ihnen? Was sagt sie?',
    'Erinnert Sie diese Stimme an jemanden aus Ihrer Geschichte oder an eine Erfahrung, von der Sie in dieser Reise bereits erzählt haben?',
    'In welchen Beziehungen können Sie ganz Sie selbst sein — und bei wem bemerken Sie, dass Sie sich verändern, kleiner machen, kontrollieren oder eine Rolle spielen?',
    'Was glauben Sie würde geschehen, wenn diese Menschen genau den Teil von Ihnen kennenlernten, den Sie am stärksten zu verbergen oder zu kontrollieren versuchen?',
    'Welchen Preis haben Sie bereits dafür bezahlt, akzeptiert zu werden, Konflikte zu vermeiden, Sicherheit zu bewahren oder die Erwartungen anderer zu erfüllen?',
    'Wenn Sie in den nächsten zehn Jahren dieselben Muster weiter wiederholen, die Sie in dieser Reise erkannt haben, wohin könnten sie Ihr Leben Ihrer Meinung nach führen?',
    'Welcher Schmerz aus der Vergangenheit beeinflusst nach allem, was Sie erzählt haben, Ihrer Wahrnehmung nach noch heute eine Ihrer Entscheidungen?',
    'Welches Verhalten von Ihnen verstehen Sie heute anders, nachdem Sie die Geschichte dahinter besser kennen?',
    'Gibt es etwas, wofür Sie sich lange Vorwürfe gemacht haben und das Sie heute auch als Versuch sehen können, zu überleben, dazuzugehören, geliebt zu werden oder sich zu schützen?',
    'Welcher Teil von Ihnen hat so lange versucht, stark zu sein, dass er vielleicht nie die Erlaubnis bekam einzugestehen, dass auch er Fürsorge brauchte?',
    'Was geben Sie den Menschen, die Sie lieben, leicht, können es sich selbst aber nur schwer geben?',
    'Welche Ihrer Eigenschaften ist gerade aus einer schwierigen Erfahrung entstanden und möchten Sie heute nicht verlieren, selbst wenn Sie den damaligen Schmerz löschen könnten?',
    'Was tun Sie noch immer, um zu beweisen, dass Sie wertvoll sind — und wem, tief in Ihrem Inneren, glauben Sie das beweisen zu müssen?',
    'Wenn Sie nichts mehr beweisen, niemanden vor allem schützen, niemandem gefallen und keine Erwartungen erfüllen müssten, was würde sich zuerst an Ihrer Lebensweise ändern?',
    'Gibt es etwas, das Sie vergeben, annehmen, beenden, aussprechen, beginnen oder zurücklassen müssen, damit Sie nicht weiter nach einer Geschichte leben, die bereits vorbei ist? Was?',
    'Nachdem du diese 50 Fragen durchlaufen hast, sprich oder schreibe, ohne zu lange nachzudenken, drei Wörter oder sehr kurze Ausdrücke. Die erste Antwort soll sagen: Was musste ich lange Zeit sein? Die zweite Antwort: Um was zu erreichen oder zu bekommen? Und die dritte Antwort: Was erkenne ich heute, sein oder tun zu können?',
  ];

  TEXTS['ja-JP'] = [
    'あなたを育てるうえで、最も身近にいたのは誰ですか？守ってほしい、受け止めてほしい、助けてほしいと感じたとき、誰を頼り、通常どのような反応が返ってきましたか？',
    '育った家庭で、注意や愛情、認められることを得るために、あなたは何をしなければならないと感じていましたか？また、あなたの何かが周囲を困らせたり、失望させたり、批判を招いたりしていると感じることはありましたか？',
    '家族の中で、あなたはどんな役割を担うようになりましたか？責任を負う人、従順な人、強い人、面白い人、反抗する人、目立たない人、世話をする人、それとも別の役割でしょうか。なぜその役割が自分のものになったと思いますか？',
    '子どもの頃、食べ物、お金、安全、愛情、誰かの存在、安定など、大切なものが足りない経験はありましたか？その不足に気づいたとき、何を感じていたか覚えていますか？',
    '外見、体、話し方、身体的な状態、出自、行動、性格などのために、自分は違う、劣っている、笑われている、仲間外れにされていると感じたことはありますか？何がありましたか？',
    '批判されたり、拒絶されたり、恥をかかされたり、自分は十分ではないと感じさせられたとき、あなたはどう反応することが多かったですか？立ち向かう、泣く、黙る、相手に合わせる、距離を取る、気にしていないふりをする、それとも別の反応でしたか？',
    '人前で見せるのは危険だと、早い時期に学んだものはありますか？恐れ、弱さ、怒り、悲しみ、助けを求めること、愛情、意見、涙、あるいは別の自分の一面でしょうか。なぜですか？',
    '子ども時代や思春期に何かがうまくいかなかったとき、どんな考えが最も浮かびやすかったですか？「自分が悪いことをした」「自分には何か問題がある」「誰も助けてくれない」「自分で解決しなければならない」「人を信じられない」、それとも別の考えですか？',
    'かつての子どもの自分を思い浮かべてください。その子が最も必要としていたのに、十分には受け取れなかったかもしれないものは何ですか？',
    'ここまで思い出したことを振り返ると、今の大人のあなたのどんな特徴が、あの頃に形づくられ始めたように感じますか？確信は必要ありません。最初に浮かぶことを教えてください。',
    '今、拒絶された、批判された、価値を下げられた、脅かされたと感じる出来事が起きたとき、深く考える前に出る最も自動的な反応は何ですか？',
    'その反応が起きるとき、あなたは何をもう一度感じたり経験したりしないようにしているように思いますか？',
    '他の人は自然にこなしているように見えるのに、あなたには不快感、恐れ、恥、怒り、逃げたい気持ちを起こす状況はありますか？具体的な例を一つ教えてください。',
    'その状況を避ける、譲る、コントロールする、相手に合わせる、黙る、距離を取るといった行動の直後、何を感じますか？安心、安全、罪悪感、苛立ち、力、空虚感、それとも別の感情でしょうか？',
    'あとで後悔するかもしれないと分かっていても繰り返してしまうことはありますか？食べる、飲む、買う、働きすぎる、コントロールする、好かれようとする、争う、孤立する、承認を求めるなどです。その直前と直後には何を感じますか？',
    '本当に自分が望むことと、周囲が自分に期待していると思うことのどちらかを選ばなければならないとき、通常どちらが勝ちますか？具体的な場面を教えてください。',
    '今でも、その人からの承認、存在、評価、あるいは許しが特別な重みを持っている相手はいますか？その人から何を受け取りたいですか？',
    'どんな人や行動が、あなたに非常に強い感情を起こしますか？尊敬、苛立ち、羨望、恐れ、軽蔑、魅了などです。具体的に何があなたを強く反応させますか？',
    '他人には厳しく批判するのに、自分の中にも少しはあると認められる特徴はありますか？',
    'ここまでの回答を振り返ると、もともとは自分を守るために始まったのに、今では時に人生を制限している行動は何だと思いますか？',
    '人生の中で、自分自身の見方を最も大きく変えた経験は何ですか？その前のあなたはどんな人で、その後どんな人になったと思いますか？',
    'これまでに経験した中で、特に辛かった感情的な痛みは何ですか？それを感じながらも生活を続けるために、あなたは何をしましたか？',
    'その困難な経験から、今では自分の大切な一部だと思える強さが生まれましたか？それは何ですか？',
    'その強さが、時には強すぎる形で現れることはありますか？例えば、助けを求められなくする自立、負担になりすぎる責任感、人を信じにくくするコントロール、自分を忘れさせる優しさなどです。あなたの場合はどう現れますか？',
    '今、最も失うことを恐れているものは何ですか？大切な人、安定、コントロール、評価、自由、健康、お金、居場所、それとも別のものですか？なぜその喪失はそれほど辛いのでしょうか？',
    '自分が最も大切にしているものが脅かされていると感じるとき、あなたの行動はどのように変わりますか？',
    'あなたのケア、理解、エネルギーをより多く受け取るのは、自分自身ですか、それとも他の人ですか？自分の必要と相手の必要がぶつかったとき、何が起こりますか？',
    '自分を優先するとき、どんな感情が現れますか？安心、罪悪感、わがままに感じる気持ち、誰かを失望させる恐れ、自由、それとも別のものですか？',
    '心からの褒め言葉を受けたとき、それを信じられますか？それとも、自分の一部がすぐに小さく扱ったり、疑ったり、拒んだりしますか？その瞬間、頭の中に何が浮かびますか？',
    'もし何の危険もなく、今使っている「自分を守る方法」を一つだけ手放せるなら、何を選びますか？そして、それがなくなったとき、自分はどんな人になれると思いますか？',
    '恐れ、お金、年齢、他人の評価、失敗の可能性が一瞬すべて障害ではなくなったら、あなたはどんな人生を選びますか？',
    'その思い描いた人生にはあって、今の人生には足りないものは何ですか？',
    '本当にその生き方を始めたら、何を失う、あるいは危険にさらすことになると思いますか？',
    '自分では強く望んでいると言いながら、繰り返す選択によって遠ざけているものはありますか？それは何ですか？',
    '大切な機会が現れたとき、あなたの内側で最初に話し始める声はどんな声ですか？何と言いますか？',
    'その声は、あなたの過去の誰か、あるいはこの旅ですでに話した経験を思い出させますか？',
    'どんな人間関係ではありのままの自分でいられますか？逆に、誰の前では自分を変え、小さくし、抑え、役割を演じていると感じますか？',
    'その人たちに、自分が最も隠したりコントロールしたりしている部分を知られたら、何が起こると思いますか？',
    '受け入れてもらうため、争いを避けるため、安全を保つため、あるいは他人の期待に応えるために、これまでどんな代償を払ってきましたか？',
    'この旅で気づいた同じパターンを、今後10年間そのまま繰り返したとしたら、あなたの人生はどこへ向かうと思いますか？',
    'ここまで語ってきたことを振り返ると、過去のどんな痛みが、今のあなたの選択にまだ影響していると感じますか？',
    'その背景にある物語をより理解した今、自分のどんな行動を以前とは違って理解できるようになりましたか？',
    '長い間自分を責めてきたことの中に、今なら「生き延びるため」「居場所を得るため」「愛されるため」「自分を守るため」の試みでもあったと見られるものはありますか？',
    '長い間ずっと強くあろうとしてきたために、「自分にもケアが必要だった」と認める許可を一度も得られなかったかもしれない自分の部分はどこですか？',
    '愛する人には自然に与えられるのに、自分には与えるのが難しいものは何ですか？',
    '困難な経験から生まれたからこそ、たとえその痛みを消せるとしても、今の自分から失いたくないと思う長所は何ですか？',
    '自分には価値があると証明するために、今もしていることは何ですか？そして心の奥では、誰にそれを証明しなければならないと感じていますか？',
    'もう何も証明せず、誰かをすべてから守ろうとせず、誰にも好かれようとせず、どんな期待にも応えなくてよいとしたら、あなたの生き方で最初に変わることは何ですか？',
    'すでに過ぎ去った物語に従って生き続けないために、許す、受け入れる、終わらせる、伝える、始める、手放す必要があることはありますか？それは何ですか？',
    'この50の問いを振り返ったあと、あまり考えすぎずに、三つの言葉、またはとても短い表現を話すか書いてください。最初の答えは「長い間、私は何である必要があったのか」。二つ目の答えは「何を得るためだったのか」。三つ目の答えは「今、私は何になれる、または何ができると気づいているのか」です。',
  ];
  TEXTS['zh-CN'] = [
    '在你的成长过程中，谁最常陪伴和照顾你？当你需要保护、安慰或帮助时，你会向谁求助——通常会发生什么？',
    '在你成长的家庭里，为了得到关注、关爱或认可，你觉得自己必须做些什么？你身上是否有某些部分似乎会让别人不满、失望或批评你？',
    '在家人之间，你最终承担了怎样的角色：负责的人、听话的人、坚强的人、逗大家开心的人、反抗的人、不被注意的人、照顾别人的人，还是其他角色？你觉得为什么这个角色会属于你？',
    '小时候，你是否经历过某种重要的匮乏——食物、金钱、安全感、关爱、陪伴、稳定，或其他东西？当你意识到这种缺乏时，你记得自己有什么感受？',
    '你是否因为自己的某个特点——外貌、身体、说话方式、身体状况、出身、行为或性格——而觉得自己与别人不同、低人一等、被嘲笑或被排斥？发生了什么？',
    '当别人批评、拒绝、羞辱你，或让你觉得自己不够好时，你通常怎样反应：反击、哭泣、沉默、努力讨好、远离、装作不在意，还是其他方式？',
    '你很早就学会哪些东西在别人面前“不能表现出来”——害怕、脆弱、愤怒、悲伤、需要帮助、爱意、意见、眼泪，或自己的其他部分？为什么？',
    '童年或青春期遇到事情出错时，你最容易冒出的念头是什么：“我做错了”、“我有问题”、“没人会帮我”、“我必须自己解决”、“我不能相信别人”，还是其他想法？',
    '想一想小时候的自己：那个孩子最需要、却可能没有得到足够的东西是什么？',
    '回顾刚才想起的一切，如今成年后的你有哪些特点，似乎就是从那时开始形成的？不必确定，只说最先浮现在你心里的答案。',
    '如今发生让你感到被拒绝、被批评、被贬低或受到威胁的事情时，在来得及仔细思考之前，你最自动的反应是什么？',
    '当这种反应出现时，你似乎在努力避免再次感受或经历什么？',
    '有没有一种情境，别人似乎可以自然面对，却会让你感到不适、害怕、羞耻、愤怒或想逃走？请举一个真实的例子。',
    '当你选择回避、退让、控制、讨好、沉默或远离之后，你马上会感到什么：轻松、安全、内疚、挫败、力量、空虚，还是其他感受？',
    '有没有某件事你明知之后可能会后悔，却仍会反复去做——吃、喝、购物、过度工作、控制、讨好、争吵、孤立自己、寻求认可，或其他事情？在做之前和之后，你分别有什么感受？',
    '当你必须在“自己真正想要的”和“你认为别人期待你做的”之间选择时，通常哪一边会赢？请描述一个情境。',
    '有没有一个人，他/她的认可、陪伴、肯定或原谅至今对你仍有特别的分量？你最希望从这个人那里得到什么？',
    '哪一种人或行为会在你心里激起非常强烈的情绪——欣赏、恼怒、嫉妒、害怕、轻蔑或着迷？究竟是什么触动了你？',
    '有没有一种特质，你会严厉批评别人拥有它，却也能承认自己身上多少有一点？',
    '回顾到目前为止的回答，你的哪一种行为可能最初是为了保护自己，却在今天有时也限制了你的生活？',
    '你人生中的哪一次经历，最改变了你看待自己的方式？在那之前你是谁——在那之后你觉得自己变成了谁？',
    '你经历过的最艰难的情绪痛苦之一是什么？即使感受着那份痛苦，你做了什么让自己继续生活和运转？',
    '那段艰难经历是否让你发展出某种力量，而你现在认为它是自己很重要的一部分？是什么？',
    '同样的这种力量，有时会不会变得过度？例如：独立到无法求助，责任感变成过度负担，控制让你难以信任，善良让你忘了自己。它在你身上怎样表现？',
    '如今你最害怕失去什么——某个人、稳定、控制、认可、自由、健康、金钱、归属感，还是其他东西？为什么失去它会如此困难？',
    '当你觉得自己最重视的东西受到威胁时，你的行为会发生什么变化？',
    '通常谁得到你更多的照顾、理解和精力：你自己，还是别人？当你的需要与他们的需要发生冲突时，会发生什么？',
    '当你把自己放在第一位时，什么感受会出现：安心、内疚、觉得自私、害怕让人失望、自由，还是别的感受？',
    '当你收到真诚的赞美时，你能相信它吗？还是你内心的某个部分会立刻淡化、怀疑或拒绝它？那一刻你脑中会出现什么？',
    '如果今天你可以在毫无风险的情况下放下一个保护自己的方式，你会选择哪一个——没有它以后，你觉得自己可能成为怎样的人？',
    '如果恐惧、金钱、年龄、他人的看法和失败的可能性暂时都不再是障碍，你会选择过怎样的人生？',
    '在你想象的那种人生里，有什么是你现在的生活中所缺少的？',
    '如果你真的开始那样生活，你觉得自己会失去什么，或让什么处于风险之中？',
    '有没有一件事你总说自己非常想要，但你反复做出的选择却似乎让它越来越远？是什么？',
    '当一个重要机会出现时，你内心通常最先响起的是哪一种声音？它会说什么？',
    '这个声音会让你想起过去的某个人，或你已经在这段旅程中讲过的一段经历吗？',
    '在哪些关系里你能够完整地做自己？而面对哪些人时，你会发现自己改变、缩小自己、控制自己或扮演某种角色？',
    '如果这些人真正看见了你最努力隐藏或控制的那一部分，你觉得会发生什么？',
    '为了被接受、避免冲突、维持安全，或满足别人的期待，你曾经付出过什么代价？',
    '如果未来十年你继续重复这段旅程中已经发现的同样模式，你觉得它们会把你的人生带向哪里？',
    '在你讲述了这么多之后，你觉得过去的哪一种痛苦至今仍在影响你现在的某些选择？',
    '现在你更了解某个行为背后的故事以后，你对自己的哪一种行为有了不同的理解？',
    '有没有一件事你长期责怪自己，而现在也能够把它看成当时为了生存、获得归属、得到爱或保护自己所做的一种尝试？',
    '你内心的哪一部分花了太长时间努力坚强，以至于它可能从未被允许承认：自己其实也需要被照顾？',
    '你能够轻易给予所爱之人的东西中，有什么是你很难给予自己的？',
    '你的哪一种品质恰恰是在艰难经历中形成的，即使能够抹去当时的痛苦，你今天也不愿失去这种品质？',
    '为了证明自己有价值，你现在仍在做什么？而在内心深处，你觉得自己究竟需要向谁证明这一点？',
    '如果你不再需要证明任何事、不必保护所有人免受一切伤害、不必讨好任何人，也不必满足任何期待，你的生活方式最先会发生什么变化？',
    '为了不再按照一个已经过去的故事继续生活，你是否需要原谅、接受、结束、说出、开始或放下什么？是什么？',
    '走过这50个问题之后，请不要想得太多，说出或写下三个词或非常简短的表达。第一个回答是：很长一段时间里，我觉得自己必须成为什么样的人？第二个回答是：为了得到什么？第三个回答是：今天，我意识到自己可以成为什么样的人，或者可以做什么？'
  ];

  const BLOCK_TITLES = {
    'pt-BR': ['Bloco 1 — Raízes','Bloco 2 — Reflexões','Bloco 3 — Crescimento','Bloco 4 — Integração','Bloco 5 — Síntese e Entrega'],
    'en-US': ['Block 1 — Roots','Block 2 — Reflections','Block 3 — Growth','Block 4 — Integration','Block 5 — Synthesis and Delivery'],
    'es-ES': ['Bloque 1 — Raíces','Bloque 2 — Reflexiones','Bloque 3 — Crecimiento','Bloque 4 — Integración','Bloque 5 — Síntesis y Entrega'],
    'fr-FR': ['Bloc 1 — Racines','Bloc 2 — Réflexions','Bloc 3 — Croissance','Bloc 4 — Intégration','Bloc 5 — Synthèse et Intégration'],
    'de-DE': ['Block 1 — Wurzeln','Block 2 — Reflexionen','Block 3 — Wachstum','Block 4 — Integration','Block 5 — Synthese und Integration'],
    'ja-JP': ['第1ブロック — ルーツ','第2ブロック — 内省','第3ブロック — 成長','第4ブロック — 統合','第5ブロック — 統合と選択'],
    'zh-CN': ['模块 1 — 根基','模块 2 — 反思','模块 3 — 成长','模块 4 — 整合','模块 5 — 总结与整合']
  };

  const BLOCK_META = [
    { sectionId:'section-perguntas-raizes', id:'raizes', nextSection:'section-perguntas-reflexoes', transitionVideo:VIDEO_BASE+'filme-1-entrando-na-jornada.mp4', data_i18n:'bloco_raizes_title' },
    { sectionId:'section-perguntas-reflexoes', id:'reflexoes', nextSection:'section-perguntas-crescimento', transitionVideo:VIDEO_BASE+'filme-2-dentro-da-jornada.mp4', data_i18n:'bloco_reflexoes_title' },
    { sectionId:'section-perguntas-crescimento', id:'crescimento', nextSection:'section-perguntas-integracao', transitionVideo:VIDEO_BASE+'filme-3-traumas-na-jornada.mp4', data_i18n:'bloco_crescimento_title' },
    { sectionId:'section-perguntas-integracao', id:'integracao', nextSection:'section-perguntas-sintese', transitionVideo:VIDEO_BASE+'filme-4-aproximando-do-final.mp4', data_i18n:'bloco_integracao_title' },
    { sectionId:'section-perguntas-sintese', id:'sintese', nextSection:'section-final', transitionVideo:VIDEO_BASE+'filme-5-fim-da-jornada.mp4', data_i18n:'bloco_sintese_title' }
  ];

  function makeQuestion(lang, i) {
    return {
      number: i + 1,
      block: Math.floor(i / 10) + 1,
      theme: THEMES[i],
      map_axes: MAP_AXES[i].slice(),
      id: IDS[i],
      label: TEXTS[lang][i],
      data_i18n: IDS[i]
    };
  }

  function makeBlocks(lang) {
    return BLOCK_META.map((meta, index) => ({
      sectionId: meta.sectionId,
      id: meta.id,
      index,
      title: BLOCK_TITLES[lang][index],
      data_i18n: meta.data_i18n,
      nextSection: meta.nextSection,
      transitionVideo: meta.transitionVideo,
      questions: Array.from({ length: 10 }, (_, offset) => makeQuestion(lang, index * 10 + offset))
    }));
  }

  const CONFIG = {};
  Object.keys(TEXTS).forEach((lang) => { CONFIG[lang] = makeBlocks(lang); });

  function detectLang() {
    const htmlLang = document.documentElement.lang;
    const saved =
      window.i18n?.currentLang || window.i18n?.lang ||
      sessionStorage.getItem('jornada.lang') || sessionStorage.getItem('i18n.lang') ||
      localStorage.getItem('jc.lang') || localStorage.getItem('i18n_lang') ||
      window.LANG || localStorage.getItem('JORNADA_LANG') || sessionStorage.getItem('JORNADA_LANG') ||
      htmlLang || 'pt-BR';

    const lang = String(saved).trim().replace(/_/g, '-');
    if (CONFIG[lang]) return lang;
    const low = lang.toLowerCase();
    if (low.startsWith('en')) return 'en-US';
    if (low.startsWith('es')) return 'es-ES';
    if (low.startsWith('fr')) return 'fr-FR';
    if (low.startsWith('de')) return 'de-DE';
    if (low.startsWith('ja') || low.startsWith('jp')) return 'ja-JP';
    if (low.startsWith('zh')) return 'zh-CN';
    return 'pt-BR';
  }

  function getBlocks(lang) { const useLang = lang || detectLang(); return CONFIG[useLang] || CONFIG['pt-BR']; }
  function getBlockBySection(sectionId, lang) { return getBlocks(lang).find((b) => b.sectionId === sectionId) || null; }
  function getBlockById(blockId, lang) { return getBlocks(lang).find((b) => b.id === blockId) || null; }
  function getBlockByIndex(index, lang) { return getBlocks(lang)[index] || null; }
  function getTotalBlocks(lang) { return getBlocks(lang).length; }
  function getGlobalQuestionTotal(lang) { return getBlocks(lang).reduce((acc, b) => acc + (Array.isArray(b.questions) ? b.questions.length : 0), 0); }
  function getSectionSequence(lang) { return getBlocks(lang).map((b) => b.sectionId); }

  Object.keys(CONFIG).forEach((lang) => {
    const total = CONFIG[lang].reduce((acc, b) => acc + b.questions.length, 0);
    if (CONFIG[lang].length !== 5 || total !== 50) {
      console.error(`${MOD} Config inválida para ${lang}:`, { blocos: CONFIG[lang].length, perguntas: total });
    }
  });

  window.JORNADA_PAPER_QA = { CONFIG, detectLang, getBlocks, getBlockBySection, getBlockById, getBlockByIndex, getTotalBlocks, getGlobalQuestionTotal, getSectionSequence };
  window.JORNADA_BLOCKS = getBlocks();
  window.blockTranslations = CONFIG;

  console.log(`${MOD} Mapa Psicoemocional v1 carregado. Idioma:`, detectLang(), 'Blocos:', getTotalBlocks(), 'Perguntas:', getGlobalQuestionTotal());
})(window);
