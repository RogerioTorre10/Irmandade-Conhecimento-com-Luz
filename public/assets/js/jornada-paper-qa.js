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
  'Quem cuidou mais de você durante a infância? Quando você precisava de proteção, colo ou ajuda, para quem você ia — e o que normalmente acontecia?',
  'Na casa em que você cresceu, o que você precisava fazer para ganhar atenção, carinho ou elogio? Existia algo em você que parecia incomodar ou decepcionar os outros?',
  'Dentro da sua família, que "papel" sobrou pra você: o responsável, o obediente, o forte, o engraçado, o rebelde, o invisível, o cuidador de todos — ou outro? Por que acha que esse papel ficou com você?',
  'Quando criança, faltou alguma coisa importante — comida, dinheiro, segurança, carinho, presença, estabilidade? O que você sentia quando percebia essa falta?',
  'Existiu alguma característica sua — jeito, corpo, fala, origem, comportamento — pela qual você já se sentiu diferente, ridicularizado ou de fora? O que aconteceu?',
  'Quando alguém te criticava, rejeitava ou fazia você se sentir errado, o que você fazia: enfrentava, chorava, calava, tentava agradar, fugia, fingia não se importar?',
  'O que você aprendeu, ainda cedo, que era perigoso mostrar na frente dos outros — medo, fraqueza, raiva, tristeza, carência, afeto, opinião, choro? Por quê?',
  'Quando algo dava errado, qual pensamento vinha mais fácil: "eu fiz algo errado", "tem algo errado comigo", "ninguém vai me ajudar", "tenho que resolver sozinho", "não posso confiar em ninguém" — ou outro?',
  'Pensando naquela criança que você foi: do que ela mais precisava e talvez não tenha recebido na medida certa?',
  'Depois de lembrar tudo isso, qual característica sua de hoje parece ter nascido naquela época? Não precisa ter certeza — diga o que vier à cabeça.',
  'Hoje, quando algo te faz sentir rejeitado, criticado ou ameaçado, qual costuma ser sua reação mais automática — antes mesmo de pensar?',
  'Nessa reação, o que você parece estar tentando não sentir de novo?',
  'Existe alguma situação que as outras pessoas parecem enfrentar numa boa, mas que em você provoca desconforto, medo, vergonha, raiva ou vontade de fugir? Dê um exemplo real.',
  'Quando você evita, cede, controla, agrada, se cala ou se afasta nessa situação, o que sente logo depois: alívio, segurança, culpa, frustração, poder, vazio?',
  'Existe algo que você faz repetidamente mesmo sabendo que pode se arrepender depois — comer, beber, comprar, trabalhar demais, controlar, agradar, discutir, se isolar, buscar aprovação? O que sente antes e depois?',
  'Quando precisa escolher entre o que você realmente quer e o que acham que esperam de você, o que costuma vencer? Conte uma situação real.',
  'Existe alguém cuja aprovação, presença ou perdão ainda pesa muito pra você? O que você gostaria de receber dessa pessoa?',
  'Que tipo de pessoa ou comportamento mexe muito com você — admiração, irritação, inveja, medo, desprezo, fascínio? O que exatamente nisso te afeta?',
  'Existe algo que você critica duramente nos outros, mas que reconhece, mesmo um pouco, em você?',
  'Olhando pro que já respondeu, qual comportamento seu talvez tenha nascido como proteção, mas hoje te limita?',
  'Qual experiência mudou mais a forma como você se enxerga? Quem você era antes dela — e quem você virou depois?',
  'Qual foi uma das dores mais difíceis que você já atravessou? O que você fez para continuar funcionando mesmo sentindo aquilo?',
  'Dessa dor nasceu alguma força que hoje é parte importante de quem você é? Qual?',
  'Essa força vira excesso alguma vez? Por exemplo: independência que impede pedir ajuda, responsabilidade que vira sobrecarga, controle que impede confiar, cuidado com os outros que faz você esquecer de si. Como isso aparece em você?',
  'O que você mais teme perder hoje — uma pessoa, estabilidade, controle, reconhecimento, liberdade, saúde, dinheiro, pertencimento? Por que essa perda seria tão difícil?',
  'Quando sente que isso que mais valoriza está ameaçado, o que muda no seu jeito de agir?',
  'Quem recebe mais cuidado e atenção sua: você ou os outros? O que acontece quando suas necessidades entram em conflito com as deles?',
  'Quando você se coloca em primeiro lugar, o que sente: tranquilidade, culpa, sensação de egoísmo, medo de decepcionar, liberdade?',
  'Quando alguém te elogia de verdade, você consegue acreditar — ou uma parte sua já desconfia e diminui o elogio? O que passa pela sua cabeça?',
  'Se pudesse largar hoje, sem nenhum risco, uma única forma de se proteger, qual seria — e quem você acha que poderia ser sem ela?',
  'Se medo, dinheiro, idade, opinião alheia e chance de fracassar deixassem de existir por um instante, que vida você escolheria viver?',
  'O que existe nessa vida imaginada que está faltando na sua vida de hoje?',
  'O que você acha que perderia ou arriscaria se realmente começasse a viver assim?',
  'Existe algo que você diz querer muito, mas suas escolhas repetidas parecem empurrar pra longe? O que é?',
  'Quando surge uma oportunidade importante, qual "voz" fala primeiro dentro de você? O que ela diz?',
  'Essa voz lembra alguém da sua história, ou alguma coisa que você já contou nesta jornada?',
  'Em quais relações você consegue ser totalmente você mesmo — e perto de quem você percebe que muda, se diminui, se controla ou "representa um papel"?',
  'O que você acha que aconteceria se essas pessoas conhecessem justamente a parte sua que você mais esconde ou controla?',
  'Que preço você já pagou pra ser aceito, evitar briga, se manter seguro ou corresponder ao que esperavam de você?',
  'Se você repetir pelos próximos dez anos os mesmos padrões que reconheceu aqui, pra onde acha que isso vai levar sua vida?',
  'Imagine-se muito mais velho, olhando pra trás: qual dor do passado você sente que ainda pesa nas escolhas que faz hoje?',
  'Que comportamento seu você entende de um jeito diferente agora que conhece melhor a história por trás dele?',
  'Existe algo pelo qual você se culpou por muito tempo, e que hoje também consegue enxergar como uma forma de sobreviver, pertencer, ser amado ou se proteger?',
  'Qual parte de você passou tanto tempo tentando ser forte que talvez nunca tenha tido permissão de admitir que também precisava de cuidado?',
  'O que você oferece fácil pra quem você ama, mas tem dificuldade de oferecer a você mesmo?',
  'Se você chegar à velhice e olhar pra trás, qual qualidade sua — mesmo tendo nascido de uma dor — você gostaria de ver que cultivou até o fim?',
  'O que você ainda faz pra provar que tem valor — e pra quem, no fundo, sente que precisa provar isso?',
  'Imaginando-se daqui a muitos anos, já mais velho, olhando pra tudo que viveu: se você não precisasse mais provar nada, proteger ninguém, agradar ninguém nem corresponder a expectativa nenhuma, o que mudaria primeiro no seu jeito de viver, a partir de hoje?',
  'Pra não chegar à velhice carregando essa mesma história sem resolução: o que você sente que precisa perdoar, aceitar, encerrar, dizer, começar ou deixar para trás, ainda hoje?',
  'Para fechar, fale ou escreva, sem pensar demais, três palavras ou expressões bem curtas: 1) Durante muito tempo, o que você precisou ser? 2) Para conseguir o quê? 3) Hoje você percebe que pode ser ou fazer o quê?'
],
'en-US': [
  'Who took care of you the most growing up? When you needed protection, comfort, or help, who did you turn to — and what usually happened?',
  'In the home where you grew up, what did you have to do to get attention, affection, or praise? Was there something about you that seemed to bother or disappoint others?',
  'Within your family, what "role" ended up being yours: the responsible one, the obedient one, the strong one, the funny one, the rebel, the invisible one, the caretaker of everyone — or something else? Why do you think that role became yours?',
  'As a child, was something important missing — food, money, safety, affection, presence, stability? What did you feel when you noticed that lack?',
  'Was there something about you — your looks, your body, the way you spoke, your background, your behavior — that made you feel different, mocked, or left out? What happened?',
  'When someone criticized, rejected, or made you feel wrong, what did you do: face it, cry, go silent, try to please, run away, pretend it didn\'t matter?',
  'What did you learn early on was dangerous to show in front of others — fear, weakness, anger, sadness, need, affection, opinion, tears? Why?',
  'When something went wrong, which thought came easiest: "I did something wrong," "something is wrong with me," "no one is going to help me," "I have to handle this alone," "I can\'t trust anyone" — or another one?',
  'Thinking about that child you once were: what did they need most that they probably didn\'t get enough of?',
  'After remembering all this, which trait of who you are today seems to have started back then? You don\'t need to be sure — just say whatever comes to mind.',
  'Today, when something makes you feel rejected, criticized, or threatened, what\'s usually your most automatic reaction — before you even think about it?',
  'In that reaction, what are you trying not to feel again?',
  'Is there a situation other people seem to handle easily, but that causes you discomfort, fear, shame, anger, or the urge to run? Give a real example.',
  'When you avoid, give in, control, please, go quiet, or pull away in that situation, what do you feel right after: relief, safety, guilt, frustration, power, emptiness?',
  'Is there something you keep doing even knowing you might regret it later — eating, drinking, shopping, overworking, controlling, pleasing, arguing, isolating, seeking approval? What do you feel right before and right after?',
  'When you have to choose between what you truly want and what you believe is expected of you, which one usually wins? Tell a real situation.',
  'Is there someone whose approval, presence, or forgiveness still carries a lot of weight for you? What would you like to receive from that person?',
  'What kind of person or behavior triggers a strong emotional reaction in you — admiration, irritation, envy, fear, contempt, fascination? What exactly about it affects you?',
  'Is there something you harshly criticize in others but recognize, even a little, in yourself?',
  'Looking at what you\'ve answered so far, which behavior of yours might have started as protection but limits your life today?',
  'What experience changed the way you see yourself the most? Who were you before it — and who do you think you became after?',
  'What was one of the hardest emotional pains you\'ve been through? What did you do to keep functioning even while feeling that?',
  'Did any strength you consider an important part of who you are come out of that pain? What is it?',
  'Does that same strength ever become too much? For example: independence that stops you from asking for help, responsibility that turns into overload, control that keeps you from trusting, caring for others so much you forget yourself. How does that show up in you?',
  'What do you fear losing most today — a person, stability, control, recognition, freedom, health, money, belonging? Why would that loss be so hard?',
  'When you feel that what you value most is threatened, what changes in your behavior?',
  'Who receives more of your care and energy: you or others? What happens when your needs conflict with theirs?',
  'When you put yourself first, what do you feel: calm, guilt, a sense of selfishness, fear of disappointing others, freedom?',
  'When someone gives you a sincere compliment, can you truly believe it — or does some part of you doubt it and shrink it down right away? What goes through your mind?',
  'If you could drop, today, with zero risk, one single way you protect yourself, which would you choose — and who do you think you could become without it?',
  'If fear, money, age, other people\'s opinions, and the possibility of failure stopped being obstacles for a moment, what life would you choose to live?',
  'What exists in that imagined life that\'s missing from your life today?',
  'What do you think you\'d lose or risk if you actually started living that way?',
  'Is there something you say you want badly, but your repeated choices seem to push away? What is it?',
  'When an important opportunity shows up, which "voice" speaks first inside you? What does it say?',
  'Does that voice remind you of someone from your story, or something you\'ve already shared in this journey?',
  'In which relationships can you fully be yourself — and around whom do you notice you shrink, control yourself, or "play a role"?',
  'What do you think would happen if those people knew exactly the part of you that you hide or control the most?',
  'What price have you already paid to be accepted, avoid conflict, stay safe, or live up to others\' expectations?',
  'If you keep repeating, for the next ten years, the same patterns you\'ve recognized here, where do you think that will take your life?',
  'Picture yourself much older, looking back: which pain from the past do you feel still weighs on the choices you make today?',
  'Which of your behaviors do you understand differently now that you know the story behind it better?',
  'Is there something you blamed yourself for over a long time that you can now also see as a way of surviving, belonging, being loved, or protecting yourself?',
  'Which part of you spent so long trying to be strong that it may never have had permission to admit it also needed care?',
  'What do you easily offer to the people you love but struggle to offer yourself?',
  'If you picture yourself in old age looking back, which quality of yours — even one born from pain — would you like to see that you kept alive until the end?',
  'What do you still do to prove your worth — and to whom, deep down, do you feel you need to prove it?',
  'Imagining yourself many years from now, already older, looking back on everything you lived: if you no longer had to prove anything, protect anyone, please anyone, or meet any expectation, what would change first in how you live, starting today?',
  'So you don\'t reach old age still carrying this same unresolved story: what do you feel you need to forgive, accept, close, say, start, or leave behind, starting today?',
  'To close, say or write, without overthinking, three short words or phrases: 1) For a long time, what did you have to be? 2) In order to get what? 3) Today you realize you can be or do what?'
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
  '¿Quién te cuidó más durante tu infancia? Cuando necesitabas protección, cariño o ayuda, ¿a quién recurrías — y qué solía pasar?',
  'En la casa donde creciste, ¿qué tenías que hacer para recibir atención, cariño o reconocimiento? ¿Había algo en ti que parecía molestar o decepcionar a los demás?',
  'Dentro de tu familia, ¿qué "papel" te tocó: el responsable, el obediente, el fuerte, el gracioso, el rebelde, el invisible, el que cuidaba de todos — u otro? ¿Por qué crees que ese papel se volvió tuyo?',
  'De niño, ¿te faltó algo importante — comida, dinero, seguridad, cariño, presencia, estabilidad? ¿Qué sentías cuando notabas esa falta?',
  '¿Hubo alguna característica tuya — tu aspecto, tu cuerpo, tu forma de hablar, tu origen, tu comportamiento — por la que te sentiste diferente, ridiculizado o excluido? ¿Qué pasó?',
  'Cuando alguien te criticaba, te rechazaba o te hacía sentir mal, ¿qué hacías: lo enfrentabas, llorabas, te callabas, intentabas agradar, huías, fingías que no te importaba?',
  '¿Qué aprendiste desde pequeño que era peligroso mostrar frente a los demás — miedo, debilidad, rabia, tristeza, necesidad, cariño, opinión, llanto? ¿Por qué?',
  'Cuando algo salía mal, ¿qué pensamiento aparecía más fácil: "hice algo mal", "algo está mal en mí", "nadie va a ayudarme", "tengo que resolverlo solo", "no puedo confiar en nadie" — u otro?',
  'Pensando en ese niño o niña que fuiste: ¿qué era lo que más necesitaba y quizás no recibió lo suficiente?',
  'Después de recordar todo esto, ¿qué característica tuya de hoy parece haber nacido en esa época? No hace falta estar seguro — di lo primero que te venga a la mente.',
  'Hoy, cuando algo te hace sentir rechazado, criticado o amenazado, ¿cuál suele ser tu reacción más automática — antes incluso de pensar?',
  'En esa reacción, ¿qué intentas evitar volver a sentir?',
  '¿Hay alguna situación que otras personas parecen enfrentar sin problema, pero que en ti provoca incomodidad, miedo, vergüenza, rabia o ganas de huir? Da un ejemplo real.',
  'Cuando evitas, cedes, controlas, complaces, te callas o te alejas en esa situación, ¿qué sientes justo después: alivio, seguridad, culpa, frustración, poder, vacío?',
  '¿Hay algo que haces repetidamente aun sabiendo que después puedes arrepentirte — comer, beber, comprar, trabajar en exceso, controlar, complacer, discutir, aislarte, buscar aprobación? ¿Qué sientes justo antes y justo después?',
  'Cuando tienes que elegir entre lo que realmente quieres y lo que crees que esperan de ti, ¿qué suele ganar? Cuenta una situación real.',
  '¿Hay alguien cuya aprobación, presencia o perdón todavía tiene mucho peso para ti? ¿Qué te gustaría recibir de esa persona?',
  '¿Qué tipo de persona o comportamiento despierta en ti una reacción emocional muy fuerte — admiración, irritación, envidia, miedo, desprecio, fascinación? ¿Qué es exactamente lo que te afecta?',
  '¿Hay algo que criticas duramente en los demás, pero que reconoces, aunque sea un poco, en ti?',
  'Mirando lo que has respondido hasta ahora, ¿qué comportamiento tuyo pudo haber nacido como protección, pero hoy te limita?',
  '¿Qué experiencia cambió más la forma en que te ves a ti mismo? ¿Quién eras antes de ella — y en quién crees que te convertiste después?',
  '¿Cuál fue uno de los dolores emocionales más difíciles que has atravesado? ¿Qué hiciste para seguir funcionando incluso sintiendo eso?',
  '¿De ese dolor nació alguna fuerza que hoy es parte importante de quién eres? ¿Cuál?',
  '¿Esa misma fuerza a veces se convierte en exceso? Por ejemplo: independencia que impide pedir ayuda, responsabilidad que se vuelve sobrecarga, control que impide confiar, cuidar tanto de otros que te olvidas de ti. ¿Cómo se manifiesta esto en ti?',
  '¿Qué es lo que más temes perder hoy — una persona, estabilidad, control, reconocimiento, libertad, salud, dinero, sentido de pertenencia? ¿Por qué sería tan difícil esa pérdida?',
  'Cuando sientes que eso que más valoras está amenazado, ¿qué cambia en tu forma de actuar?',
  '¿Quién recibe más cuidado y energía tuya: tú o los demás? ¿Qué pasa cuando tus necesidades entran en conflicto con las de ellos?',
  'Cuando te pones a ti mismo en primer lugar, ¿qué sientes: tranquilidad, culpa, sensación de egoísmo, miedo a decepcionar, libertad?',
  'Cuando alguien te hace un cumplido sincero, ¿logras creerlo — o una parte tuya ya desconfía y le resta valor? ¿Qué pasa por tu cabeza?',
  'Si pudieras dejar hoy, sin ningún riesgo, una sola forma de protegerte, ¿cuál elegirías — y en quién crees que podrías convertirte sin ella?',
  'Si el miedo, el dinero, la edad, la opinión ajena y la posibilidad de fracasar dejaran de ser obstáculos por un instante, ¿qué vida elegirías vivir?',
  '¿Qué hay en esa vida imaginada que falta en tu vida actual?',
  '¿Qué crees que perderías o arriesgarías si realmente empezaras a vivir así?',
  '¿Hay algo que dices querer mucho, pero tus decisiones repetidas parecen alejarte de ello? ¿Qué es?',
  'Cuando surge una oportunidad importante, ¿qué "voz" habla primero dentro de ti? ¿Qué dice?',
  '¿Esa voz te recuerda a alguien de tu historia, o a algo que ya contaste en esta jornada?',
  '¿En qué relaciones logras ser completamente tú mismo — y frente a quién notas que cambias, te achicas, te controlas o "haces un papel"?',
  '¿Qué crees que pasaría si esas personas conocieran justamente la parte tuya que más escondes o controlas?',
  '¿Qué precio has pagado ya por ser aceptado, evitar conflictos, mantenerte seguro o cumplir con lo que esperaban de ti?',
  'Si repites durante los próximos diez años los mismos patrones que reconociste aquí, ¿a dónde crees que eso llevará tu vida?',
  'Imagínate mucho más grande, mirando hacia atrás: ¿qué dolor del pasado sientes que todavía influye en las decisiones que tomas hoy?',
  '¿Qué comportamiento tuyo entiendes de manera diferente ahora que conoces mejor la historia detrás de él?',
  '¿Hay algo por lo que te culpaste durante mucho tiempo y que hoy también puedes ver como una forma de sobrevivir, pertenecer, ser amado o protegerte?',
  '¿Qué parte de ti pasó tanto tiempo intentando ser fuerte que tal vez nunca tuvo permiso de admitir que también necesitaba cuidado?',
  '¿Qué ofreces con facilidad a las personas que amas, pero te cuesta ofrecerte a ti mismo?',
  'Si llegas a la vejez y miras hacia atrás, ¿qué cualidad tuya — aunque haya nacido de un dolor — te gustaría ver que cultivaste hasta el final?',
  '¿Qué sigues haciendo para demostrar que vales — y a quién, en el fondo, sientes que necesitas demostrárselo?',
  'Imaginándote dentro de muchos años, ya mayor, mirando todo lo que viviste: si ya no tuvieras que demostrar nada, proteger a nadie, complacer a nadie ni cumplir ninguna expectativa, ¿qué cambiaría primero en tu forma de vivir, desde hoy?',
  'Para no llegar a la vejez cargando esta misma historia sin resolver: ¿qué sientes que necesitas perdonar, aceptar, cerrar, decir, empezar o dejar atrás, desde hoy?',
  'Para cerrar, di o escribe, sin pensarlo demasiado, tres palabras o expresiones bien cortas: 1) Durante mucho tiempo, ¿qué necesitaste ser? 2) ¿Para conseguir qué? 3) Hoy te das cuenta de que puedes ser o hacer ¿qué?'
];
TEXTS['fr-FR'] = [
  'Qui s\'est le plus occupé de vous pendant votre enfance ? Quand vous aviez besoin de protection, de réconfort ou d\'aide, vers qui vous tourniez-vous — et que se passait-il généralement ?',
  'Dans la maison où vous avez grandi, que fallait-il faire pour recevoir de l\'attention, de l\'affection ou des compliments ? Y avait-il quelque chose en vous qui semblait déranger ou décevoir les autres ?',
  'Dans votre famille, quel "rôle" vous est-il revenu : le responsable, l\'obéissant, le fort, le comique, le rebelle, l\'invisible, celui qui s\'occupait de tout le monde — ou un autre ? Pourquoi pensez-vous que ce rôle est devenu le vôtre ?',
  'Enfant, avez-vous manqué de quelque chose d\'important — nourriture, argent, sécurité, affection, présence, stabilité ? Que ressentiez-vous en constatant ce manque ?',
  'Y avait-il une caractéristique chez vous — votre apparence, votre corps, votre façon de parler, vos origines, votre comportement — à cause de laquelle vous vous êtes senti différent, ridiculisé ou exclu ? Que s\'est-il passé ?',
  'Quand quelqu\'un vous critiquait, vous rejetait ou vous faisait sentir en tort, que faisiez-vous : vous affrontiez, vous pleuriez, vous vous taisiez, vous essayiez de plaire, vous fuyiez, vous faisiez semblant que ça ne comptait pas ?',
  'Qu\'avez-vous appris très tôt qu\'il était dangereux de montrer devant les autres — la peur, la faiblesse, la colère, la tristesse, le besoin, l\'affection, une opinion, les larmes ? Pourquoi ?',
  'Quand quelque chose se passait mal, quelle pensée venait le plus facilement : "j\'ai fait quelque chose de mal", "il y a quelque chose qui ne va pas chez moi", "personne ne va m\'aider", "je dois régler ça seul", "je ne peux faire confiance à personne" — ou une autre ?',
  'En pensant à cet enfant que vous étiez : de quoi avait-il le plus besoin et n\'a peut-être pas assez reçu ?',
  'Après vous être remémoré tout cela, quel trait de la personne que vous êtes aujourd\'hui semble être né à cette époque ? Pas besoin d\'être sûr — dites simplement ce qui vous vient à l\'esprit.',
  'Aujourd\'hui, quand quelque chose vous fait sentir rejeté, critiqué ou menacé, quelle est généralement votre réaction la plus automatique — avant même de réfléchir ?',
  'Dans cette réaction, qu\'essayez-vous d\'éviter de ressentir à nouveau ?',
  'Y a-t-il une situation que les autres semblent gérer facilement, mais qui provoque chez vous de l\'inconfort, de la peur, de la honte, de la colère ou l\'envie de fuir ? Donnez un exemple concret.',
  'Quand vous évitez, cédez, contrôlez, cherchez à plaire, vous taisez ou vous éloignez dans cette situation, que ressentez-vous juste après : soulagement, sécurité, culpabilité, frustration, pouvoir, vide ?',
  'Y a-t-il quelque chose que vous répétez même en sachant que vous pourriez le regretter ensuite — manger, boire, acheter, trop travailler, contrôler, plaire, vous disputer, vous isoler, chercher l\'approbation ? Que ressentez-vous juste avant et juste après ?',
  'Quand vous devez choisir entre ce que vous voulez vraiment et ce que l\'on attend de vous, lequel l\'emporte habituellement ? Racontez une situation réelle.',
  'Y a-t-il quelqu\'un dont l\'approbation, la présence ou le pardon compte encore énormément pour vous ? Que voudriez-vous recevoir de cette personne ?',
  'Quel type de personne ou de comportement déclenche chez vous une réaction émotionnelle très forte — admiration, irritation, envie, peur, mépris, fascination ? Qu\'est-ce qui exactement vous affecte dans cela ?',
  'Y a-t-il quelque chose que vous critiquez durement chez les autres, mais que vous reconnaissez, même un peu, chez vous ?',
  'En regardant ce que vous avez répondu jusqu\'ici, quel comportement chez vous a peut-être commencé comme une protection, mais vous limite aujourd\'hui ?',
  'Quelle expérience a le plus changé la façon dont vous vous percevez ? Qui étiez-vous avant elle — et qui pensez-vous être devenu après ?',
  'Quelle a été l\'une des douleurs émotionnelles les plus difficiles que vous ayez traversées ? Qu\'avez-vous fait pour continuer à fonctionner malgré cela ?',
  'Une force que vous considérez importante aujourd\'hui est-elle née de cette douleur ? Laquelle ?',
  'Cette même force devient-elle parfois excessive ? Par exemple : une indépendance qui empêche de demander de l\'aide, une responsabilité qui devient un fardeau, un contrôle qui empêche de faire confiance, un souci des autres qui vous fait vous oublier vous-même. Comment cela se manifeste-t-il chez vous ?',
  'Que craignez-vous le plus de perdre aujourd\'hui — une personne, la stabilité, le contrôle, la reconnaissance, la liberté, la santé, l\'argent, le sentiment d\'appartenance ? Pourquoi cette perte serait-elle si difficile ?',
  'Quand vous sentez que ce que vous valorisez le plus est menacé, qu\'est-ce qui change dans votre comportement ?',
  'Qui reçoit le plus de votre attention et de votre énergie : vous ou les autres ? Que se passe-t-il quand vos besoins entrent en conflit avec les leurs ?',
  'Quand vous vous mettez en premier, que ressentez-vous : de la tranquillité, de la culpabilité, un sentiment d\'égoïsme, la peur de décevoir, de la liberté ?',
  'Quand quelqu\'un vous fait un compliment sincère, arrivez-vous à y croire — ou une partie de vous doute-t-elle et le minimise-t-elle aussitôt ? Que se passe-t-il dans votre tête ?',
  'Si vous pouviez abandonner aujourd\'hui, sans aucun risque, une seule façon de vous protéger, laquelle choisiriez-vous — et qui pensez-vous pourriez devenir sans elle ?',
  'Si la peur, l\'argent, l\'âge, l\'opinion des autres et la possibilité d\'échouer cessaient d\'être des obstacles un instant, quelle vie choisiriez-vous de vivre ?',
  'Qu\'y a-t-il dans cette vie imaginée qui manque à votre vie actuelle ?',
  'Que pensez-vous que vous perdriez ou risqueriez si vous commenciez réellement à vivre ainsi ?',
  'Y a-t-il quelque chose que vous dites vouloir vraiment, mais que vos choix répétés semblent repousser ? Qu\'est-ce que c\'est ?',
  'Quand une opportunité importante se présente, quelle "voix" parle en premier en vous ? Que dit-elle ?',
  'Cette voix vous rappelle-t-elle quelqu\'un de votre histoire, ou quelque chose que vous avez déjà raconté dans ce parcours ?',
  'Dans quelles relations arrivez-vous à être pleinement vous-même — et devant qui remarquez-vous que vous changez, vous vous diminuez, vous vous contrôlez ou "jouez un rôle" ?',
  'Que pensez-vous qu\'il se passerait si ces personnes connaissaient justement la part de vous que vous cachez ou contrôlez le plus ?',
  'Quel prix avez-vous déjà payé pour être accepté, éviter les conflits, rester en sécurité ou répondre aux attentes des autres ?',
  'Si vous répétez pendant les dix prochaines années les mêmes schémas que vous avez reconnus ici, où pensez-vous que cela mènera votre vie ?',
  'Imaginez-vous bien plus âgé, en train de regarder en arrière : quelle douleur du passé sentez-vous encore peser sur les choix que vous faites aujourd\'hui ?',
  'Quel comportement chez vous comprenez-vous différemment maintenant que vous connaissez mieux l\'histoire derrière lui ?',
  'Y a-t-il quelque chose que vous vous êtes reproché longtemps, et que vous parvenez aujourd\'hui aussi à voir comme une façon de survivre, d\'appartenir, d\'être aimé ou de vous protéger ?',
  'Quelle partie de vous a passé tant de temps à essayer d\'être forte qu\'elle n\'a peut-être jamais eu la permission d\'admettre qu\'elle avait, elle aussi, besoin d\'être prise en charge ?',
  'Qu\'offrez-vous facilement aux personnes que vous aimez, mais avez du mal à vous offrir à vous-même ?',
  'Si vous arrivez à la vieillesse et regardez en arrière, quelle qualité chez vous — même née d\'une douleur — aimeriez-vous avoir cultivée jusqu\'au bout ?',
  'Que faites-vous encore pour prouver votre valeur — et à qui, au fond, sentez-vous le besoin de le prouver ?',
  'En vous imaginant dans de nombreuses années, déjà âgé, en train de regarder tout ce que vous avez vécu : si vous n\'aviez plus à prouver quoi que ce soit, protéger personne, plaire à personne ni répondre à aucune attente, qu\'est-ce qui changerait en premier dans votre façon de vivre, dès aujourd\'hui ?',
  'Pour ne pas arriver à la vieillesse en portant encore cette même histoire non résolue : que sentez-vous devoir pardonner, accepter, clore, dire, commencer ou laisser derrière vous, dès aujourd\'hui ?',
  'Pour finir, dites ou écrivez, sans trop réfléchir, trois mots ou expressions très courtes : 1) Pendant longtemps, qu\'avez-vous dû être ? 2) Pour obtenir quoi ? 3) Aujourd\'hui, vous réalisez que vous pouvez être ou faire quoi ?'
];
TEXTS['de-DE'] = [
  'Wer hat sich in Ihrer Kindheit am meisten um Sie gekümmert? An wen haben Sie sich gewandt, wenn Sie Schutz, Trost oder Hilfe brauchten — und was passierte dann meistens?',
  'In dem Zuhause, in dem Sie aufgewachsen sind: Was mussten Sie tun, um Aufmerksamkeit, Zuneigung oder Lob zu bekommen? Gab es etwas an Ihnen, das andere zu stören oder zu enttäuschen schien?',
  'Welche "Rolle" ist Ihnen in Ihrer Familie zugefallen: die verantwortungsvolle, die gehorsame, die starke, die lustige, die rebellische, die unsichtbare, die, die sich um alle kümmert — oder eine andere? Warum, glauben Sie, wurde genau diese Rolle Ihre?',
  'Hat Ihnen als Kind etwas Wichtiges gefehlt — Essen, Geld, Sicherheit, Zuneigung, Anwesenheit, Stabilität? Was haben Sie gefühlt, wenn Ihnen dieser Mangel bewusst wurde?',
  'Gab es etwas an Ihnen — Ihr Aussehen, Ihren Körper, Ihre Sprechweise, Ihre Herkunft, Ihr Verhalten —, weswegen Sie sich schon einmal anders, lächerlich gemacht oder ausgeschlossen gefühlt haben? Was ist passiert?',
  'Wenn Sie jemand kritisierte, ablehnte oder Ihnen das Gefühl gab, falsch zu sein — was haben Sie getan: sich gewehrt, geweint, geschwiegen, versucht zu gefallen, sich zurückgezogen, so getan, als wäre es Ihnen egal?',
  'Was haben Sie schon früh gelernt, das gefährlich war, vor anderen zu zeigen — Angst, Schwäche, Wut, Traurigkeit, Bedürftigkeit, Zuneigung, eine Meinung, Tränen? Warum?',
  'Wenn etwas schiefging, welcher Gedanke kam Ihnen am leichtesten: "Ich habe etwas falsch gemacht", "mit mir stimmt etwas nicht", "mir wird niemand helfen", "ich muss das allein lösen", "ich kann niemandem vertrauen" — oder ein anderer?',
  'Wenn Sie an das Kind denken, das Sie einmal waren: Was hat es am meisten gebraucht und vielleicht nicht ausreichend bekommen?',
  'Nachdem Sie sich all das ins Gedächtnis gerufen haben: Welche Eigenschaft, die Sie heute haben, scheint damals entstanden zu sein? Sie müssen sich nicht sicher sein — sagen Sie einfach, was Ihnen dazu einfällt.',
  'Wenn Sie sich heute abgelehnt, kritisiert oder bedroht fühlen — was ist meist Ihre automatischste Reaktion, noch bevor Sie überhaupt nachdenken?',
  'Was versuchen Sie mit dieser Reaktion, nicht noch einmal zu fühlen?',
  'Gibt es eine Situation, mit der andere Menschen scheinbar mühelos umgehen, die aber bei Ihnen Unbehagen, Angst, Scham, Wut oder Fluchtimpuls auslöst? Nennen Sie ein konkretes Beispiel.',
  'Wenn Sie in dieser Situation ausweichen, nachgeben, kontrollieren, gefallen wollen, schweigen oder sich zurückziehen — was fühlen Sie unmittelbar danach: Erleichterung, Sicherheit, Schuld, Frustration, Macht, Leere?',
  'Gibt es etwas, das Sie wiederholt tun, obwohl Sie wissen, dass Sie es später bereuen könnten — essen, trinken, einkaufen, zu viel arbeiten, kontrollieren, gefallen wollen, streiten, sich isolieren, nach Anerkennung suchen? Was fühlen Sie kurz davor und kurz danach?',
  'Wenn Sie zwischen dem wählen müssen, was Sie wirklich wollen, und dem, was man von Ihnen erwartet — was gewinnt meistens? Erzählen Sie eine echte Situation.',
  'Gibt es jemanden, dessen Zustimmung, Anwesenheit oder Vergebung für Sie noch immer sehr viel Gewicht hat? Was würden Sie sich von dieser Person wünschen?',
  'Welche Art von Mensch oder Verhalten löst bei Ihnen eine sehr starke emotionale Reaktion aus — Bewunderung, Ärger, Neid, Angst, Verachtung, Faszination? Was genau daran betrifft Sie?',
  'Gibt es etwas, das Sie bei anderen scharf kritisieren, aber, auch wenn nur ein wenig, bei sich selbst erkennen?',
  'Wenn Sie auf Ihre bisherigen Antworten schauen: Welches Verhalten von Ihnen hat vielleicht als Schutz begonnen, schränkt Sie heute aber ein?',
  'Welche Erfahrung hat am meisten verändert, wie Sie sich selbst sehen? Wer waren Sie davor — und wer, glauben Sie, sind Sie danach geworden?',
  'Was war einer der schwierigsten emotionalen Schmerzen, den Sie durchgemacht haben? Was haben Sie getan, um trotzdem weiter zu funktionieren?',
  'Ist aus diesem Schmerz eine Stärke entstanden, die heute ein wichtiger Teil von Ihnen ist? Welche?',
  'Wird diese Stärke manchmal zu viel des Guten? Zum Beispiel: Unabhängigkeit, die verhindert, um Hilfe zu bitten; Verantwortungsbewusstsein, das zur Überlastung wird; Kontrolle, die Vertrauen verhindert; Fürsorge für andere, bei der Sie sich selbst vergessen. Wie zeigt sich das bei Ihnen?',
  'Was fürchten Sie heute am meisten zu verlieren — eine Person, Stabilität, Kontrolle, Anerkennung, Freiheit, Gesundheit, Geld, Zugehörigkeit? Warum wäre dieser Verlust so schwer?',
  'Wenn Sie spüren, dass das, was Sie am meisten schätzen, bedroht ist — was ändert sich an Ihrem Verhalten?',
  'Wer bekommt mehr von Ihrer Fürsorge und Energie: Sie selbst oder die anderen? Was passiert, wenn Ihre Bedürfnisse mit deren Bedürfnissen kollidieren?',
  'Wenn Sie sich selbst an erste Stelle setzen, was fühlen Sie: Ruhe, Schuld, ein Gefühl von Egoismus, Angst zu enttäuschen, Freiheit?',
  'Wenn Ihnen jemand aufrichtig ein Kompliment macht — können Sie es glauben, oder zweifelt ein Teil von Ihnen sofort daran und macht es kleiner? Was geht Ihnen dabei durch den Kopf?',
  'Wenn Sie heute, ohne jedes Risiko, eine einzige Ihrer Schutzstrategien aufgeben könnten — welche wäre es, und wer, glauben Sie, könnten Sie ohne sie werden?',
  'Wenn Angst, Geld, Alter, die Meinung anderer und die Möglichkeit des Scheiterns für einen Moment keine Hindernisse mehr wären — welches Leben würden Sie wählen?',
  'Was gibt es in diesem vorgestellten Leben, das in Ihrem jetzigen Leben fehlt?',
  'Was, glauben Sie, würden Sie verlieren oder riskieren, wenn Sie wirklich anfingen, so zu leben?',
  'Gibt es etwas, das Sie sich sehr zu wünschen behaupten, das Ihre wiederholten Entscheidungen aber eher zu verhindern scheinen? Was ist es?',
  'Wenn sich eine wichtige Gelegenheit ergibt, welche "Stimme" meldet sich zuerst in Ihnen? Was sagt sie?',
  'Erinnert Sie diese Stimme an jemanden aus Ihrer Geschichte oder an etwas, das Sie in dieser Reise bereits erzählt haben?',
  'In welchen Beziehungen können Sie ganz Sie selbst sein — und bei wem bemerken Sie, dass Sie sich verändern, sich klein machen, sich kontrollieren oder "eine Rolle spielen"?',
  'Was, glauben Sie, würde passieren, wenn diese Menschen genau den Teil von Ihnen kennen würden, den Sie am meisten verstecken oder kontrollieren?',
  'Welchen Preis haben Sie bereits gezahlt, um akzeptiert zu werden, Konflikte zu vermeiden, sich sicher zu fühlen oder den Erwartungen anderer zu entsprechen?',
  'Wenn Sie die Muster, die Sie hier erkannt haben, die nächsten zehn Jahre weiter wiederholen — wohin, glauben Sie, wird das Ihr Leben führen?',
  'Stellen Sie sich vor, Sie wären viel älter und würden zurückblicken: Welcher Schmerz aus der Vergangenheit lastet Ihrer Meinung nach noch immer auf den Entscheidungen, die Sie heute treffen?',
  'Welches Verhalten von Ihnen verstehen Sie jetzt anders, da Sie die Geschichte dahinter besser kennen?',
  'Gibt es etwas, wofür Sie sich lange die Schuld gegeben haben und das Sie heute auch als eine Art zu sehen vermögen, zu überleben, dazuzugehören, geliebt zu werden oder sich zu schützen?',
  'Welcher Teil von Ihnen hat so lange versucht, stark zu sein, dass er vielleicht nie die Erlaubnis hatte zuzugeben, dass er auch Fürsorge brauchte?',
  'Was geben Sie den Menschen, die Sie lieben, mit Leichtigkeit, tun sich aber schwer, es sich selbst zu geben?',
  'Wenn Sie im Alter zurückblicken: Welche Eigenschaft von Ihnen — selbst wenn sie aus Schmerz entstanden ist — würden Sie gerne bis zum Schluss bewahrt haben?',
  'Was tun Sie noch immer, um Ihren Wert zu beweisen — und wem gegenüber, tief im Inneren, fühlen Sie, dass Sie das beweisen müssen?',
  'Stellen Sie sich vor, viele Jahre von jetzt an, bereits älter, blicken Sie auf alles zurück, was Sie erlebt haben: Wenn Sie nichts mehr beweisen, niemanden mehr beschützen, niemandem mehr gefallen und keiner Erwartung mehr entsprechen müssten — was würde sich ab heute als Erstes an Ihrer Art zu leben ändern?',
  'Damit Sie im Alter nicht dieselbe ungelöste Geschichte weiter mit sich tragen: Was, spüren Sie, müssen Sie ab heute vergeben, akzeptieren, abschließen, aussprechen, beginnen oder hinter sich lassen?',
  'Sagen oder schreiben Sie zum Abschluss, ohne lange nachzudenken, drei kurze Worte oder Ausdrücke: 1) Was mussten Sie lange Zeit sein? 2) Um was zu erreichen? 3) Was, merken Sie heute, können Sie sein oder tun?'
];
TEXTS['ja-JP'] = [
  '子どもの頃、あなたを最も世話してくれたのは誰でしたか？守ってほしい時や助けが必要な時、誰を頼っていましたか——そして、たいていどうなりましたか？',
  '育った家庭で、注目や愛情、褒め言葉をもらうために何をする必要がありましたか？あなたの中に、周りを困らせたりがっかりさせたりするような何かがあるように感じていましたか？',
  '家族の中で、あなたはどんな「役割」を担っていましたか——責任者、従順な子、強い子、面白い子、反抗的な子、目立たない子、みんなの世話をする子——それとも別の何かでしたか？なぜその役割が自分のものになったと思いますか？',
  '子どもの頃、何か大切なもの——食べ物、お金、安全、愛情、そばにいてくれる人、安定——が足りなかったことはありますか？その不足を感じた時、どんな気持ちでしたか？',
  '見た目、体、話し方、出身、振る舞いなど、自分のある特徴のせいで、周りと違う、笑いものにされる、仲間外れにされると感じたことはありますか？何がありましたか？',
  '誰かに批判されたり、拒絶されたり、自分が間違っていると感じさせられたりした時、あなたはどうしていましたか——立ち向かう、泣く、黙る、機嫌を取ろうとする、逃げる、気にしていないふりをする？',
  '幼い頃、人前で見せてはいけないと学んだものは何でしたか——恐怖、弱さ、怒り、悲しみ、甘えたい気持ち、愛情、意見、涙？なぜそう思いましたか？',
  '何かうまくいかなかった時、どの考えが一番浮かびやすかったですか——「自分が何か悪いことをした」「自分のどこかがおかしい」「誰も助けてくれない」「自分一人で解決しなければ」「誰も信じられない」——それとも別の考えでしたか？',
  'あの頃の自分——子どもだったあなた——を思い浮かべてください。その子が一番必要としていて、十分に受け取れなかったものは何だと思いますか？',
  'ここまで思い出してみて、今のあなたのどんな特徴が、あの頃に生まれたように感じますか？確信がなくても構いません、思い浮かんだことをそのまま答えてください。',
  '今、拒絶されたり批判されたり、脅かされたりしていると感じた時、考えるより先に出てくる、最も反射的な反応は何ですか？',
  'その反応の中で、あなたが再び感じないようにしようとしていることは何ですか？',
  '他の人は簡単にこなしているように見えるのに、あなた自身には不快感、恐怖、恥、怒り、逃げ出したい気持ちを引き起こす状況はありますか？具体的な例を挙げてください。',
  'その状況で、避けたり、譲歩したり、コントロールしたり、機嫌を取ったり、黙ったり、距離を置いたりした直後、何を感じますか——安心、安全、罪悪感、苛立ち、力、空虚感？',
  '後で後悔するかもしれないと分かっていても繰り返してしまうことはありますか——食べる、飲む、買い物する、働きすぎる、コントロールする、機嫌を取る、口論する、孤立する、承認を求める。その直前と直後にどんな気持ちになりますか？',
  '本当に望んでいることと、周りから期待されていると思うことのどちらかを選ばなければならない時、どちらが勝つことが多いですか？実際にあった状況を教えてください。',
  'その人の承認、存在、あるいは許しが、今でもあなたにとって特別に重い意味を持つ人はいますか？その人から何を受け取りたいですか？',
  'どんなタイプの人や行動が、あなたの中に強い感情的な反応——憧れ、苛立ち、嫉妬、恐怖、軽蔑、魅了——を引き起こしますか？具体的に何があなたに影響していますか？',
  '他人には厳しく批判するのに、少しでも自分にも当てはまると感じることはありますか？',
  'これまでの答えを振り返って、もともとは自分を守るために始まったけれど、今のあなたを制限している行動はありますか？',
  'どんな経験が、自分自身の見方を最も大きく変えましたか？その経験の前のあなたはどんな人でしたか——そして、その後どんな人になったと思いますか？',
  'これまでに経験した中で、最もつらい感情的な痛みは何でしたか？それを感じながらも機能し続けるために、何をしましたか？',
  'その痛みから、今のあなたの重要な一部になっている強さが生まれましたか？それは何ですか？',
  'その強さが、時に行き過ぎることはありますか？例えば、助けを求められなくなるほどの自立心、負担になるほどの責任感、人を信じられなくなるほどのコントロール欲、自分を忘れてしまうほど他人の世話を焼くことなど。あなたの中でそれはどう現れますか？',
  '今、最も失うことを恐れているものは何ですか——人、安定、コントロール、評価、自由、健康、お金、居場所? なぜその喪失がそれほど辛いのでしょうか？',
  '一番大切にしているものが脅かされていると感じた時、あなたの行動にはどんな変化が起こりますか？',
  'あなたの気遣いやエネルギーをより多く受け取っているのは、あなた自身ですか、それとも他の人たちですか？自分のニーズと相手のニーズがぶつかった時、何が起こりますか？',
  '自分を優先した時、どんな気持ちになりますか——落ち着き、罪悪感、自己中心的だという感覚、がっかりさせてしまう恐れ、自由？',
  '誰かに心からの褒め言葉をもらった時、それを素直に信じられますか——それとも、自分の中の何かがすぐに疑い、その言葉を小さくしてしまいますか？その時、頭の中では何が起きていますか？',
  'もし今日、リスクなしに一つだけ自分を守るための方法を手放せるとしたら、どれを選びますか——そして、それがなくなったら自分はどんな人になれると思いますか？',
  'もし恐怖、お金、年齢、他人の意見、失敗する可能性が一瞬でも障害でなくなったら、あなたはどんな人生を選びますか？',
  'その想像した人生の中にあって、今の生活に足りていないものは何ですか？',
  '実際にそのように生き始めたら、何を失う、あるいは危険にさらすことになると思いますか？',
  'とても欲しいと言いながら、繰り返す選択がそれを遠ざけているように見えることはありますか？それは何ですか？',
  '大切なチャンスが訪れた時、あなたの中で最初に語りかけてくる「声」は何ですか？その声は何と言っていますか？',
  'その声は、あなたの人生の中の誰か、あるいはこのジャーニーですでに話した何かを思い出させますか？',
  'どんな関係の中で、あなたは完全に自分自身でいられますか——そして、誰の前だと変わってしまう、小さくなる、自分をコントロールしてしまう、あるいは「役を演じてしまう」と感じますか？',
  'もしその人たちが、あなたが一番隠している、あるいはコントロールしている部分を知ったら、何が起こると思いますか？',
  '受け入れられるため、対立を避けるため、安全でいるため、あるいは他人の期待に応えるために、これまでにどんな代償を払ってきましたか？',
  'ここで気づいたのと同じパターンをこれから10年間繰り返し続けたら、あなたの人生はどこに向かうと思いますか？',
  'ずっと年を重ねた自分になって、過去を振り返っていると想像してください。今の選択に、いまだに重くのしかかっている過去の痛みは何だと感じますか？',
  'その行動の背景にある物語をより深く理解した今、あなたのどんな行動が違って見えますか？',
  '長い間、自分を責め続けてきたことの中で、今では「生き延びるため」「居場所を得るため」「愛されるため」「自分を守るため」の一つの方法だったとも見られるものはありますか？',
  '強くあろうとし続けたあまり、「自分にもケアが必要だ」と認める許しを一度も自分に与えられなかった部分は、あなたの中にありますか？',
  '愛する人には簡単に与えられるのに、自分自身には与えることが難しいものは何ですか？',
  'もし老年期に達して過去を振り返るとしたら、痛みから生まれたものであっても、最後まで大切に育て続けたいと思うあなたの資質は何ですか？',
  'あなたはまだ、自分の価値を証明するために何をしていますか——そして、心の奥では、誰に対してそれを証明する必要があると感じていますか？',
  '何年も先、すでに年を重ねた自分になって、これまで生きてきたすべてを振り返っていると想像してください。もう何も証明する必要がなく、誰も守る必要がなく、誰の機嫌を取る必要もなく、どんな期待にも応える必要がないとしたら、今日から、生き方の何が最初に変わると思いますか？',
  '同じ未解決の物語を老年期まで抱え続けないために、今日からあなたが許し、受け入れ、終わらせ、口にし、始め、あるいは手放す必要があると感じるものは何ですか？',
  '最後に、深く考えすぎず、短い言葉や表現を三つ、声に出すか書いてください。1）長い間、あなたは何であることを求められましたか？2）それは何を得るためでしたか？3）今日、あなたは自分が何であれる、あるいは何ができると気づきましたか？'
];
TEXTS['zh-CN'] = [
  '小时候，谁最常照顾你？当你需要保护、安慰或帮助时，你会去找谁——通常又会发生什么？',
  '在你成长的家庭里，你需要做什么才能得到关注、疼爱或表扬？你身上是否有什么东西似乎总是让别人不满意或失望？',
  '在你的家庭里，你最后扮演了什么"角色"：负责任的人、听话的人、坚强的人、逗大家开心的人、叛逆的人、被忽视的人、照顾所有人的人——还是别的角色？你觉得为什么这个角色落在了你身上？',
  '小时候，你是否缺少过什么重要的东西——食物、金钱、安全感、关爱、陪伴、稳定？当你意识到这种缺失时，你有什么感受？',
  '你身上是否有某种特质——外貌、身材、说话方式、出身、行为举止——曾让你感到与众不同、被嘲笑或被排斥？当时发生了什么？',
  '当有人批评你、拒绝你，或让你觉得自己不对的时候，你通常会怎么做：正面对抗、哭泣、沉默、试图讨好、逃避，还是假装不在乎？',
  '你很小的时候就学到，在别人面前表现出什么是危险的——害怕、脆弱、愤怒、悲伤、需要被关心、感情、意见，还是眼泪？为什么？',
  '当事情出了差错，哪种想法最容易冒出来："我做错了什么"、"我这个人有问题"、"没人会帮我"、"我必须自己解决"、"我谁都不能相信"——还是别的想法？',
  '想想你曾经是的那个孩子：他/她最需要什么，却可能没有得到足够的满足？',
  '回忆完这一切之后，你觉得现在自己身上的哪个特质，似乎就是从那时开始形成的？不需要百分之百确定——想到什么就说什么。',
  '现在，当有什么事让你感到被拒绝、被批评或受到威胁时，你最先出现的、几乎不经过思考的反应通常是什么？',
  '在那种反应里，你在努力避免再次感受到的是什么？',
  '有没有一种情况，别人似乎都能轻松应对，但对你来说却会带来不适、恐惧、羞耻、愤怒，或者想逃跑的冲动？请举一个真实的例子。',
  '当你在那种情况下选择回避、妥协、控制、讨好、沉默或疏远时，事后你会有什么感觉：如释重负、安全感、内疚、挫败、掌控感，还是空虚？',
  '有没有什么事，你明知道之后可能会后悔，却还是会反复去做——比如暴饮暴食、喝酒、购物、过度工作、控制、讨好、争吵、把自己孤立起来、寻求认可？在做这件事之前和之后，你分别有什么感觉？',
  '当你必须在自己真正想要的东西和你认为别人期望你做的事之间做选择时，通常是哪一方获胜？讲一个真实发生过的情况。',
  '有没有一个人，他/她的认可、存在或原谅，至今仍对你意义重大？你希望从这个人那里得到什么？',
  '什么样的人或行为会在你心里激起强烈的情绪反应——钦佩、恼火、嫉妒、恐惧、鄙视，还是着迷？具体是什么打动或触动了你？',
  '有没有什么，你在别人身上严厉批评，却在自己身上——哪怕只有一点点——也能看到？',
  '回顾你到目前为止的回答，你有哪种行为可能一开始是出于自我保护，但现在却在限制你的生活？',
  '哪段经历最大程度地改变了你看待自己的方式？在那之前你是什么样的人——之后你觉得自己变成了什么样的人？',
  '你经历过的最难熬的情感痛苦之一是什么？即使承受着那种痛苦，你做了什么才能继续正常生活？',
  '从那段痛苦中，有没有诞生出一种如今对你来说很重要的力量？是什么？',
  '这种力量有没有时候会变得过度？比如：独立到不肯求助、责任感强到变成负担、控制欲强到无法信任别人、太照顾别人以至于忘了自己。这在你身上是怎么表现出来的？',
  '你现在最害怕失去的是什么——一个人、稳定、掌控感、认可、自由、健康、金钱，还是归属感？为什么这种失去会如此难以承受？',
  '当你觉得自己最看重的东西受到威胁时，你的行为会发生什么变化？',
  '你的关心和精力，更多给了自己，还是给了别人？当你的需求和他们的需求发生冲突时，会发生什么？',
  '当你把自己放在第一位时，你会有什么感觉：平静、内疚、自私感、害怕让人失望，还是自由？',
  '当有人真诚地夸奖你时，你能真正相信吗——还是你内心的某一部分立刻开始怀疑，把这份夸奖变小？你脑海里会想些什么？',
  '如果今天你可以毫无风险地放下一种自我保护的方式，你会选择放下哪一种——没有它，你觉得自己会变成什么样的人？',
  '如果恐惧、金钱、年龄、他人的看法，以及失败的可能性，在这一刻都不再是障碍，你会选择过怎样的生活？',
  '在那个想象中的生活里，有什么是你现在的生活所缺少的？',
  '如果你真的开始那样生活，你觉得自己会失去什么，或者冒什么风险？',
  '有没有什么东西，你嘴上说非常想要，但你反复做出的选择却好像在把它推得越来越远？那是什么？',
  '当一个重要的机会出现时，你心里最先说话的那个"声音"是什么？它说了什么？',
  '那个声音，是否让你想起了你生命中的某个人，或者你在这段旅程中已经提到过的某件事？',
  '在哪些关系中，你能够完全做自己——在谁面前，你会发现自己变了、缩小了、控制了自己，或者在"扮演一个角色"？',
  '如果那些人真的了解你最想隐藏或最想控制的那一部分，你觉得会发生什么？',
  '为了被接纳、避免冲突、保持安全，或者符合别人的期待，你已经付出过什么代价？',
  '如果接下来的十年里，你继续重复在这里所意识到的这些模式，你觉得这会把你的人生带向何方？',
  '想象一下年迈的自己，正在回望过去：你觉得过去的哪种痛苦，至今仍在影响你今天做出的选择？',
  '现在你更了解了行为背后的故事，你对自己的哪种行为有了不同的理解？',
  '有没有什么事，你为此自责了很久，但现在也能把它看作是一种生存、归属、被爱或自我保护的方式？',
  '你身上有没有哪个部分，长期以来一直努力保持坚强，以至于它可能从未获得过承认——它其实也需要被关心？',
  '你很容易给予所爱的人的东西，是什么？而你很难给予自己的，又是什么？',
  '如果你活到年老，回望这一生，你希望自己身上有哪种品质——即使它源自痛苦——是你一直守护到最后的？',
  '你现在还在做什么来证明自己的价值——内心深处，你觉得需要向谁证明这一点？',
  '想象多年以后，已经年迈的自己，回顾这一生所经历的一切：如果你不再需要证明任何事、不再需要保护任何人、不再需要讨好任何人、也不再需要满足任何期待，从今天起，你的生活方式会先发生什么改变？',
  '为了不让自己带着这段未解决的故事一直走到老年：从今天起，你觉得自己需要原谅、接受、结束、说出口、开始，或者放下的是什么？',
  '最后，请不要想太多，说出或写下三个简短的词语或短句：1）很长一段时间里，你不得不成为什么样的人？2）那是为了得到什么？3）今天，你意识到自己可以成为或做什么？'
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
