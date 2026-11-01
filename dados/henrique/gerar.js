// Gera dados/henrique/celular.json — o conteúdo do celular de Henrique, etapa por etapa.
// uso: node dados/henrique/gerar.js
// Tudo aqui segue o livro "Todo crime tem um autor?". Ao mudar o livro, mudar aqui.
// Datas-chave: morte terça 5/10/2010 · cremação quarta 6/10 · passagem para Zurique sexta 8/10.
const fs = require('fs');
const path = require('path');
const SVG = require('./svg');

// m(data, de, texto): de = 'h' (Henrique enviou) ou 'o' (o contato enviou)
const m = (d, de, t, extra = {}) => ({ d, de, t, ...extra });
const thread = (id, nome, tipo, msgs, extra = {}) => ({ id, nome, tipo, msgs, ...extra });

// Quintas-feiras de 4/3 a 9/9/2010 (28)
const quintas = [];
for (let d = new Date(Date.UTC(2010, 2, 4)); d <= new Date(Date.UTC(2010, 8, 9)); d.setUTCDate(d.getUTCDate() + 7)) {
  quintas.push(d.toISOString().slice(0, 10));
}

// ---------------------------------------------------------------- etapa 1
const helena = thread('helena', 'Helena', 'BBM', [
  m('2007-08-14T18:02', 'o', 'Chego às oito.'),
  m('2007-08-14T18:05', 'h', 'Ok.'),
  m('2007-11-03T16:40', 'o', 'Seu filho ligou. Pediu para você retornar.'),
  m('2007-12-20T12:15', 'o', 'Comprei o vinho que você gosta.'),
  m('2008-01-15T19:30', 'o', 'Seu médico ligou, quer remarcar a consulta.'),
  m('2008-01-16T17:58', 'o', 'Chego às oito. Comprei o vinho.'),
  m('2008-01-16T18:01', 'h', 'Ok.'),
  m('2008-01-17T23:31', 'o', 'Hoje não estou bem. Não me pergunte por quê. Leninha'),
  m('2008-01-17T23:36', 'h', 'Leninha? Desde quando você é Leninha?'),
  m('2008-01-17T23:38', 'o', 'Bobagem. Apelido de criança. Esquece.'),
  m('2008-01-17T23:39', 'h', 'Esquecido. Boa noite, Helena.'),
  m('2008-01-18T08:10', 'o', 'Chego às oito. Não esquece o remédio da pressão.'),
  m('2008-09-18T07:12', 'o', 'Sinto muito pelo seu irmão. Estou indo para Santos.'),
  m('2009-03-02T19:44', 'o', 'Sua filha ligou. Disse que te manda o projeto por e-mail.'),
  m('2009-12-24T15:20', 'o', 'Jantar às nove. Sua ex mandou um presente pela Cida.'),
  m('2010-02-10T07:01', 'o', 'Você saiu cedo. Está tudo bem?'),
  m('2010-02-10T07:30', 'h', 'Reunião às oito.'),
  m('2010-05-20T16:10', 'o', 'Estou na delegacia com o advogado. Não fale nada sem ele.'),
  m('2010-05-21T21:02', 'o', 'O advogado disse que você sai amanhã.'),
  m('2010-07-14T20:10', 'o', 'Como está BH? Frio?'),
  m('2010-07-14T20:31', 'h', 'Reunião até tarde. Volto quinta.'),
  m('2010-09-13T16:02', 'o', 'Vi no jornal. Você está bem?'),
  m('2010-09-13T16:20', 'h', 'Estou vivo.'),
  m('2010-09-27T18:45', 'o', 'Chego às oito. Não esquece o remédio da pressão.'),
  m('2010-10-03T21:05', 'o', 'Separei os remédios da semana na caixinha. Amanhã vou para Americana, a mamãe piorou.'),
  m('2010-10-03T21:12', 'h', 'Vai tranquila.'),
  m('2010-10-04T19:20', 'o', 'Cheguei. Durmo no hospital. Volto amanhã cedo.'),
  m('2010-10-04T19:31', 'h', 'Fica com ela. Boa noite, Helena.'),
]);

const otavio = thread('otavio', 'Otávio', 'BBM', [
  m('2010-01-11T09:20', 'o', 'Reunião com a Aurora às dez. Levo os números.'),
  m('2010-01-11T09:22', 'h', 'Ok.'),
  m('2010-02-09T22:05', 'o', 'O pessoal do loteamento quer antecipar para amanhã às oito. Consegue?'),
  m('2010-02-09T22:07', 'h', 'Sim.'),
  m('2010-02-10T11:40', 'o', 'Soube que tem uma delegada aí. Precisa de alguma coisa?'),
  m('2010-02-10T11:41', 'h', 'Não.'),
  m('2010-04-06T17:15', 'o', 'Valor fechado com os galpões de Jundiaí: 2,4 milhões. Assina hoje?'),
  m('2010-04-06T17:30', 'h', 'Ok.'),
  m('2010-05-24T08:50', 'o', 'Cuida de você, Henrique. Esses dias não estão fáceis.'),
  m('2010-07-15T09:12', 'o', 'Meu Deus, Henrique. Acabei de ver na televisão. Onde você está?'),
  m('2010-07-15T09:40', 'h', 'Na delegacia. Depois falo.'),
  m('2010-09-12T19:30', 'o', 'Leva o Renato amanhã. O menino conhece o contrato de cor. Vai que o pessoal da incorporadora pergunta uma vírgula.'),
  m('2010-09-12T19:44', 'h', 'Ok.'),
  m('2010-09-13T15:35', 'o', 'Henrique, me liga. Pelo amor de Deus.'),
  m('2010-10-01T18:02', 'h', 'Quanto tempo a empresa aguenta sem mim?'),
  m('2010-10-01T18:09', 'o', 'Que pergunta é essa? Vai tirar férias, finalmente?'),
  m('2010-10-01T18:10', 'h', 'Pergunta de seguro.'),
  m('2010-10-01T18:16', 'o', 'Uns seis meses, com o Lucas aqui. Sem ele, três. Vai descansar, homem.'),
]);

const contab = [];
const pag = ['2010-01-08', '2010-01-22', '2010-02-05', '2010-02-19', '2010-03-05', '2010-03-12', '2010-03-26', '2010-04-09',
  '2010-04-23', '2010-05-07', '2010-05-14', '2010-05-28', '2010-06-04', '2010-06-18', '2010-06-25', '2010-07-02',
  '2010-07-16', '2010-07-23', '2010-07-30', '2010-08-06', '2010-08-13', '2010-08-20', '2010-08-27'];
pag.forEach((d, i) => {
  contab.push(m(`${d}T10:${String(10 + (i * 7) % 40).padStart(2, '0')}`, 'o', i % 3 === 2 ? 'Relatório enviado.' : 'Pagamento confirmado.'));
  contab.push(m(`${d}T10:${String(14 + (i * 7) % 40).padStart(2, '0')}`, 'h', 'Ok.'));
});
contab.push(m('2010-09-10T10:12', 'o', 'Relatório enviado.'));
contab.push(m('2010-10-04T18:10', 'h', 'Amanhã, sete e meia, aqui em casa. Traga os originais. Eu quero encerrar isso antes que alguém mais saia machucado.'));
contab.push(m('2010-10-04T18:14', 'o', 'Confirmado amanhã cedo. Pode deixar o portão aberto.'));
const contabilidade = thread('contabilidade', 'Contabilidade', 'SMS', contab);

const alvaro = thread('alvaro', 'Dr. Álvaro', 'SMS', [
  m('2009-11-09T08:30', 'o', 'Lembrete: consulta segunda, 16h.'),
  m('2010-02-18T19:05', 'o', 'Henrique, saiu o eletro. Normal. A pressão ainda está alta: não esquece o remédio.'),
  m('2010-02-18T19:20', 'h', 'Obrigado, doutor.'),
  m('2010-05-22T13:00', 'o', 'Passa no consultório quando puder. Quero ver essa mão.'),
  m('2010-08-13T08:15', 'o', 'Lembrete: consulta segunda, 16h. Traga os exames de sangue.'),
  m('2010-10-01T09:00', 'o', 'Consulta segunda, 16h. Não esquece os exames.'),
  m('2010-10-01T09:12', 'h', 'Estarei lá.'),
  m('2010-10-04T17:05', 'o', 'Tudo certo com os exames. Amanhã cedo eu passo aí.'),
  m('2010-10-04T17:09', 'h', 'Minha vida em tuas mãos!!'),
]);

// A conversa que Lucas apaga no capítulo 2: só aparece enquanto o leitor está na etapa 1
const lucas = thread('lucas', 'Lucas', 'SMS', [
  m('2010-05-02T17:48', 'o', 'Campeão, pai!'),
  m('2010-05-02T17:49', 'h', 'Campeão, filho.'),
  m('2010-05-03T09:10', 'h', 'Viu o segundo tempo? Aquele lateral não marcou ninguém de novo.'),
  m('2010-05-03T09:31', 'o', 'Vi. Se fosse eu o técnico, tirava no intervalo.'),
  m('2010-08-04T23:40', 'o', 'Copa do Brasil!!'),
  m('2010-08-04T23:41', 'h', 'Sorte, filho. Que time.'),
  m('2010-08-29T17:22', 'o', 'Golaço, pai.'),
  m('2010-08-29T17:23', 'h', 'Sorte, filho.'),
  m('2010-08-30T09:05', 'h', 'O juiz ontem estava vendido.'),
  m('2010-08-30T09:40', 'o', 'Estava cego, isso sim.'),
  m('2010-09-20T21:14', 'h', 'Lucas, eu preciso de você na corretora. Agora, não daqui a cinco anos.'),
  m('2010-09-20T21:20', 'o', 'Pai, a gente já conversou sobre isso. Eu tenho a minha empresa.'),
  m('2010-09-20T21:22', 'h', 'Deixa alguém tocando por um tempo. Eu preciso de você aqui.'),
  m('2010-09-20T21:25', 'o', 'Por quê? Você nunca precisou de ninguém.'),
  m('2010-09-20T21:26', 'h', 'Não posso explicar agora. Confia em mim.'),
  m('2010-09-20T21:31', 'o', 'Confiar? Você quer que eu sente todo dia ao lado do Otávio. Você sabe muito bem o que eu acho dele.'),
  m('2010-09-20T21:32', 'h', 'Justamente por isso.'),
  m('2010-09-21T02:03', 'o', 'Eu não quero o sobrenome na porta. Não quero a sala do lado do Otávio. Não quero a vida que você escolheu pra mim.'),
  m('2010-09-21T02:05', 'o', 'A minha empresa é pequena, mas eu abri sozinho, sem pedir nada a ninguém. É a única coisa que é minha de verdade.'),
  m('2010-09-21T02:09', 'o', 'Cansei de ser tratado como herdeiro. Eu queria ser tratado como filho.'),
  m('2010-09-21T07:00', 'h', 'Um dia você vai entender. Te amo, filho.'),
], { apagaDepoisDaEtapa: 1 });

const lia = thread('lia', 'Lia', 'SMS', [
  m('2010-08-11T20:30', 'o', 'Pai, saiu a reforma de Higienópolis na revista! Página 42.'),
  m('2010-08-11T21:02', 'h', 'Vi. Orgulho.'),
  m('2010-09-03T12:40', 'o', 'Pai, confirmado o almoço de domingo? 13h?'),
  m('2010-09-03T13:05', 'h', 'Confirmado. Seu irmão vem?'),
  m('2010-09-03T13:07', 'o', 'Disse que não pode.'),
  m('2010-09-03T13:08', 'h', 'Então somos dois.'),
  m('2010-09-03T13:08', 'o', 'Os melhores.'),
]);

const carlosMsgs = [m('2010-03-04T14:10', 'h', 'Carlos, sei que você não quer falar comigo. Toda quinta vou te esperar na saída da sua aula, no banco da calçada, às sete. Se um dia quiser descer, eu estou lá.')];
quintas.slice(1).forEach((d) => carlosMsgs.push(m(`${d}T${d === '2010-05-20' ? '10:02' : '15:00'}`, 'h', 'Hoje às sete. No banco de sempre.')));
const carlos = thread('carlos', 'Carlos', 'SMS', carlosMsgs);

const bianca = thread('bianca', 'Bianca', 'SMS', [
  m('2008-11-03T23:50', 'o', 'Adorei o jantar. Mas quem dá seguro de vida de presente de aniversário?'),
  m('2008-11-03T23:52', 'h', 'Quem trabalha com isso. É para você ficar bem se eu cair duro aqui.'),
  m('2008-11-03T23:53', 'o', 'Que horror. Não fala isso nem brincando.'),
  m('2009-12-24T22:40', 'o', 'Natal sozinha de novo. Você disse que este ano ia ser diferente.'),
  m('2009-12-30T19:12', 'o', 'E a Europa? Você prometeu.'),
  m('2009-12-30T19:30', 'h', 'Um dia.'),
  m('2010-02-08T21:15', 'o', 'Saudade. Amanhã?'),
  m('2010-02-08T21:40', 'h', 'Amanhã. Saio da reunião às nove.'),
  m('2010-02-09T18:40', 'o', 'Suíte 14? Eu peço o de sempre.'),
  m('2010-02-09T18:42', 'h', 'Ok.'),
  m('2010-02-10T02:40', 'o', 'Cheguei. Dorme bem.'),
  m('2010-02-11T19:02', 'o', 'Você viu o jornal? A polícia me ligou. Me liga.'),
  m('2010-02-14T23:31', 'o', 'Henrique, eu não tenho nada com isso. Por que você não me responde?'),
]);

const nestor = thread('nestor', 'Nestor', 'SMS', [
  m('2010-06-07T07:58', 'o', 'Doutor, estou na porta.'),
  m('2010-09-10T16:20', 'o', 'Doutor, amanhã é o aniversário da minha neta. Posso sair às cinco?'),
  m('2010-09-10T16:31', 'h', 'Pode. Leva um presente meu para ela.'),
  m('2010-09-10T16:33', 'o', 'Deus lhe pague, doutor.'),
  m('2010-09-13T08:40', 'o', 'Doutor, saímos às nove?'),
  m('2010-09-13T08:41', 'h', 'Nove.'),
  m('2010-09-13T15:12', 'h', 'Traz também a pasta cinza que está ao lado. Por garantia.'),
  m('2010-09-13T15:14', 'o', 'Ok doutor. Já na estrada.'),
]);

const cida = thread('cida', 'Dona Cida', 'SMS', [
  m('2010-08-21T09:12', 'o', 'Doutor, chegou banana-prata boa na feira, comprei.', { foto: 'feira' }),
  m('2010-09-18T09:30', 'o', 'Doutor, o remédio da pressão está no fim. Compro na farmácia?'),
  m('2010-09-18T09:44', 'h', 'Compra. Obrigado, Cida.'),
  m('2010-10-04T14:20', 'o', 'Doutor, amanhã é minha folga. Deixei sopa na geladeira e o remédio na caixinha que a dona Helena separou.'),
  m('2010-10-04T14:35', 'h', 'Obrigado por tudo, Cida.'),
]);

const valdir = thread('valdir', 'Valdir', 'SMS', [
  m('2010-03-05T18:00', 'o', 'Doutor, começo segunda. Das sete da noite às duas.'),
  m('2010-06-01T18:10', 'o', 'Hoje Moema ou Morumbi?'),
  m('2010-06-01T18:12', 'h', 'Moema.'),
  m('2010-07-03T11:20', 'o', 'Placa checada. Carro em nome de empresa em Barueri. Sem funcionário, sem telefone. Doutor, quem anda em carro de empresa de fachada não é gente que a gente cutuca.'),
  m('2010-07-14T21:05', 'o', 'Deixei o senhor no hotel. De hotel eu não dou conta, doutor. Lá dentro o senhor está mais seguro do que comigo.'),
  m('2010-09-13T16:30', 'o', 'Doutor, soube. Onde o senhor está? Vou aí.'),
]);

const escritorio = thread('escritorio', 'Escritório', 'BBM', [
  m('2010-07-06T10:02', 'o', 'Doutor, o aditivo da Aurora Vida chegou para assinatura.'),
  m('2010-09-13T09:15', 'o', 'Doutor, deixei a pasta do contrato do loteamento na sua mesa, como o senhor pediu.'),
  m('2010-10-05T08:50', 'o', 'Doutor, o senhor vem hoje? O comitê das dez está esperando.'),
]);

const bastos = thread('bastos', 'Bastos Contabilidade', 'SMS', [
  m('2008-04-28T16:00', 'o', 'Dr. Henrique, declaração de IR entregue. Recibo por e-mail.'),
  m('2009-04-29T15:40', 'o', 'Dr. Henrique, declaração de IR entregue. Recibo por e-mail.'),
]);

const mauro = thread('mauro', 'Dr. Mauro', 'SMS', [
  m('2010-07-07T17:30', 'o', 'Doutor Henrique, o testamento está pronto para assinatura. Quinta, às 15h?'),
  m('2010-07-07T17:41', 'h', 'Quinta.'),
  m('2010-08-04T11:00', 'o', 'Cartório confirmado para amanhã, 15h. Leve o documento original.'),
  m('2010-08-04T11:06', 'h', 'Levarei.'),
]);

const silvia = thread('silvia', 'Sílvia', 'SMS', [m('2010-10-03T10:31', 'h', 'Me perdoa.')]);

const chamadas = [
  { d: '2010-10-05T08:57', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T08:50', tipo: 'perdida', nome: 'Escritório' },
  { d: '2010-10-05T08:44', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T08:38', tipo: 'perdida', nome: 'Otávio' },
  { d: '2010-10-05T08:33', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T08:26', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T08:21', tipo: 'perdida', nome: 'Helena' },
  { d: '2010-10-05T08:14', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T08:09', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T08:03', tipo: 'perdida', nome: 'Lia' },
  { d: '2010-10-05T07:40', tipo: 'perdida', nome: 'Dr. Álvaro' },
  { d: '2010-10-05T07:02', tipo: 'feita', nome: 'Dr. Álvaro', dur: '0:47' },
  { d: '2010-10-04T15:32', tipo: 'recebida', nome: 'Escritório', dur: '2:10' },
  { d: '2010-10-03T10:12', tipo: 'feita', nome: 'Sílvia', dur: '6:40' },
  { d: '2010-10-02T11:20', tipo: 'recebida', nome: 'Otávio', dur: '3:12' },
  { d: '2010-10-01T16:05', tipo: 'feita', nome: 'Dr. Mauro', dur: '1:58' },
  { d: '2010-09-30T19:40', tipo: 'perdida', nome: 'Helena' },
  { d: '2010-09-29T10:02', tipo: 'recebida', nome: 'Aurora Vida', dur: '4:31' },
  { d: '2010-09-27T21:30', tipo: 'feita', nome: 'Dr. Álvaro', dur: '12:05' },
  { d: '2010-09-21T07:02', tipo: 'feita', nome: 'Lucas', dur: '0:00' },
  { d: '2010-09-13T15:36', tipo: 'perdida', nome: 'Otávio' },
  { d: '2010-09-13T15:31', tipo: 'perdida', nome: 'Valdir' },
];

const agenda = [
  { d: '2010-01-12', h: '10:00', t: 'Renovação – Grupo Arco', cor: 'azul' },
  { d: '2010-02-10', h: '08:00', t: 'Loteamento Cajamar – reunião (antecipada)', cor: 'azul', criado: '2010-02-09' },
  { d: '2010-02-22', h: '16:00', t: 'Consulta – Dr. Álvaro', cor: 'vermelho' },
  { d: '2010-03-18', h: '09:00', t: 'Vistoria – Campinas', cor: 'verde' },
  { d: '2010-04-14', h: '20:00', t: 'Jantar – Associação Comercial', cor: 'azul' },
  { d: '2010-05-10', h: '16:00', t: 'Consulta – Dr. Álvaro', cor: 'vermelho' },
  { d: '2010-05-20', h: '12:30', t: 'Almoço Il Ponte – cliente de Ribeirão Preto (galpões)', cor: 'azul' },
  { d: '2010-06-07', h: '16:00', t: 'Consulta – Dr. Álvaro', cor: 'vermelho' },
  { d: '2010-07-06', h: '11:00', t: 'Aurora Vida – aditivo da apólice', cor: 'azul' },
  { d: '2010-07-08', h: '15:00', t: 'Dr. Mauro – testamento', cor: 'azul' },
  { d: '2010-07-14', h: '21:00', t: 'Hotel – Paulista', cor: 'verde' },
  { d: '2010-08-05', h: '15:00', t: 'Dr. Mauro – reconhecer firma (2 págs.). Levar a caneta tinteiro. O original fica com A.', cor: 'azul', criado: '2010-08-02' },
  { d: '2010-08-16', h: '16:00', t: 'Consulta – Dr. Álvaro', cor: 'vermelho' },
  { d: '2010-09-05', h: '13:00', t: 'Almoço – Lia', cor: 'azul' },
  { d: '2010-09-13', h: '09:00', t: 'Loteamento Cajamar – assinatura da apólice. Levar o Renato (pedido do O.)', cor: 'azul' },
  { d: '2010-10-01', h: '17:00', t: 'Fechamento mensal', cor: 'azul' },
  { d: '2010-10-04', h: '16:00', t: 'Consulta – Dr. Álvaro (exames)', cor: 'vermelho' },
  { d: '2010-10-04', h: '21:00', t: '', cor: 'azul', criado: '2010-10-04' },
  { d: '2010-10-05', h: '07:00', t: 'Álvaro. Em casa.', cor: 'vermelho', criado: '2010-09-15' },
  { d: '2010-10-05', h: '10:00', t: 'Comitê de sinistros', cor: 'azul', criado: '2010-08-30' },
  { d: '2010-10-06', h: '06:00', t: 'Moema', cor: 'verde', criado: '2010-09-22' },
  { d: '2010-10-08', h: 'dia todo', t: 'Z', cor: 'verde', criado: '2010-09-22' },
  { d: '2010-10-14', h: '20:00', t: 'Jantar – Associação Comercial', cor: 'azul' },
  { d: '2010-12-05', h: '16:00', t: 'Vila Belmiro. Levar o Lucas. Se ele quiser. Se eu ainda puder.', cor: 'verde', criado: '2010-09-22' },
  ...quintas.map((d) => ({ d, h: '19:00', t: 'Carlos', cor: 'cinza', criado: '2010-03-04' })),
];

const emailCorretora = [
  { d: '2010-10-05T06:58', de: 'Sinistros – Salvallus', assunto: 'Relatório de sinistros – setembro', t: 'Segue o relatório consolidado de setembro. Apólices 3381, 3394 e 3407 aguardam parecer técnico.' },
  { d: '2010-10-04T11:12', de: 'Associação Comercial', assunto: 'Convite: jantar de 14 de outubro', t: 'Prezado associado, temos a honra de convidá-lo para o jantar de outubro.' },
  { d: '2010-10-01T08:00', de: 'Banco', assunto: 'Aviso de débito', t: 'Informamos o débito programado em sua conta corrente.' },
  { d: '2010-07-06T16:40', de: 'Aurora Vida e Previdência', assunto: 'Aditivo de apólice confirmado', t: 'Confirmamos o aditivo que altera o capital segurado da apólice de vida. Beneficiários: Lucas, Lia e Carlos Salvallus, em partes iguais.' },
];

// ---------------------------------------------------------------- etapa 2
const raul = thread('familia-r', 'Sinistro 2006 – Família R.', 'SMS', [
  m('2006-04-11T09:30', 'o', 'Doutor Henrique, peço que reconsidere. A reforma foi para cumprir uma exigência dos bombeiros. Eu não sabia que precisava avisar a seguradora. Raul'),
  m('2006-04-12T18:02', 'h', 'Lamento, senhor Raul. A decisão é técnica. O contrato é claro. Desejo sorte ao senhor e à sua família.'),
  m('2006-05-08T07:45', 'o', 'Doutor Henrique, são cento e vinte funcionários. Eu não tenho como pagar a rescisão de ninguém. Raul'),
  m('2006-06-19T22:10', 'o', 'Doutor Henrique, minha mulher está doente. Minha filha, a Leninha, está apavorada. Ela tem vinte e oito anos e nunca me viu chorar. Agora me vê todas as noites. Raul'),
  m('2006-06-20T08:30', 'h', 'Lamento, senhor Raul. A decisão é técnica. O contrato é claro. Desejo sorte ao senhor e à sua família.'),
  m('2006-07-14T23:40', 'o', 'Doutor, o senhor tem filhos? Raul'),
  m('2006-08-22T10:05', 'o', 'Perdi a casa. Raul'),
  m('2007-01-18T08:12', 'o', 'Senhor Henrique Salvallus. Meu pai faleceu ontem, de infarto, aos sessenta e três anos. A família pede que o senhor não compareça ao enterro.'),
], { aviso: 'Pasta protegida' });

// ---------------------------------------------------------------- etapa 3
const planilha = [
  ['08/01', 'Vértice Serviços Ltda.', '186.400,00'], ['22/01', 'Cumeeira Engenharia e Participações', '312.000,00'],
  ['05/02', 'Prisma Consultoria e Gestão', '144.900,00'], ['19/02', 'Cumeeira Engenharia e Participações', '298.500,00'],
  ['05/03', 'Vértice Serviços Ltda.', '171.200,00'], ['12/03', 'Cumeeira Engenharia e Participações', '305.000,00'],
  ['26/03', 'Prisma Consultoria e Gestão', '139.800,00'], ['09/04', 'Cumeeira Engenharia e Participações', '322.700,00'],
  ['23/04', 'Vértice Serviços Ltda.', '188.000,00'], ['07/05', 'Cumeeira Engenharia e Participações', '317.400,00'],
  ['14/05', 'Prisma Consultoria e Gestão', '152.300,00'], ['28/05', 'Cumeeira Engenharia e Participações', '309.900,00'],
  ['04/06', 'Vértice Serviços Ltda.', '179.600,00'], ['18/06', 'Cumeeira Engenharia e Participações', '331.200,00'],
  ['25/06', 'Prisma Consultoria e Gestão', '148.000,00'], ['02/07', 'Cumeeira Engenharia e Participações', '326.800,00'],
  ['16/07', 'Vértice Serviços Ltda.', '183.500,00'], ['23/07', 'Cumeeira Engenharia e Participações', '340.100,00'],
  ['30/07', 'Prisma Consultoria e Gestão', '151.700,00'], ['06/08', 'Cumeeira Engenharia e Participações', '338.000,00'],
  ['13/08', 'Vértice Serviços Ltda.', '190.200,00'], ['20/08', 'Cumeeira Engenharia e Participações', '344.600,00'],
  ['27/08', 'Prisma Consultoria e Gestão', '156.400,00'],
];

const emailPessoal = [
  { d: '2010-06-18T22:40', assunto: '(sem assunto)', t: 'Carro prata. Placa EJK-7316. Terceira vez esta semana. Na saída de casa e na porta da corretora.' },
  { d: '2010-07-05T23:02', assunto: '(sem assunto)', t: 'Valdir checou a placa. Carro em nome de uma empresa de Barueri. Empresa sem funcionários, sem telefone. Caixa postal.' },
  { d: '2010-07-17T01:15', assunto: '(sem assunto)', t: 'O mesmo carro na Paulista, na manhã seguinte. Estacionado em frente ao Castellane.' },
  { d: '2010-08-04T22:30', assunto: 'pagamentos', t: 'Revisar os pagamentos aprovados por mensagem desde janeiro. Alguma coisa não fecha.' },
  { d: '2010-08-11T23:48', assunto: 'pagamentos', t: 'Pagamentos para três fornecedores que eu não conheço. Todos aprovados por mim. Todos com o meu ok.' },
  { d: '2010-08-12T02:20', assunto: 'pagamentos', t: 'Eu não lembro de ter aprovado isso. Ou lembro e não li o que aprovava.' },
  { d: '2010-08-30T21:05', assunto: 'pagamentos', t: 'Os pagamentos chegam como mensagem da Contabilidade. Pagamento confirmado. Relatório enviado. Eu respondo ok porque sempre respondi ok. Liguei hoje para o escritório de contabilidade. Eles nunca me mandaram mensagem nenhuma. Nunca tiveram esse número.\n\nDe quem é esse número?', anexo: { nome: 'pagamentos_2010.xls', linhas: planilha } },
  { d: '2010-09-03T23:30', assunto: 'Lucas', t: 'Falei de novo com o Lucas sobre a corretora. Disse não de novo. Ele é o único em quem eu confiaria lá dentro, e é o único que não quer. Talvez seja por isso.' },
  { d: '2010-09-10T22:50', assunto: 'Lucas', t: 'Insisti. Ele ficou bravo. Disse que eu nunca acreditei nele. Ele não sabe o que está em jogo e eu não posso contar.' },
  { d: '2010-09-21T03:10', assunto: 'Lucas', t: 'ele me disse coisas que eu mereço ouvir mas não precisava ser agora não tenho tempo para esperar a raiva dele passar' },
  { d: '2010-09-21T23:05', assunto: '?', t: '', fotos: ['helenaPerfil', 'inauguracao'] },
  { d: '2010-09-24T00:40', assunto: '(sem assunto)', t: 'Documentos: outubro. Confirmar com A.' },
  { d: '2010-10-04T18:03', assunto: '(sem assunto)', t: 'Contabilidade = Otávio?' },
];

// ---------------------------------------------------------------- etapa 4
const gravador = {
  arquivo: 'Para o Carlos', duracao: 41, gravado: '2010-10-02T22:10',
  dica: 'Onde eu espero toda quinta.',
  transcricao: [
    [1, 'Carlos. Sou eu. Não apaga.'],
    [3, 'Eu sei que você não quer ouvir a minha voz, e eu entendo.'],
    [8, 'Eu fiquei esperando você naquele banco por seis meses e você nunca desceu. Tudo bem. Eu também não desceria.'],
    [17, 'Mas eu não aguento mais carregar isso sozinho.'],
    [21, 'Tem uma coisa que eu nunca contei para ninguém, e que eu devia ter contado há vinte anos.'],
    [28, 'Semana que vem você vai entender por que eu estou falando isso agora.'],
    [33, 'E a sua mãe vai saber de tudo.'],
  ],
};
const carlosAudio = m('2010-10-02T22:14', 'h', 'Mensagem de voz: Para o Carlos (0:41)', { audio: true, status: 'Entregue · Lida', tipo: 'BBM' });

// ---------------------------------------------------------------- etapa 5
const galeria = [
  { id: 'vistoria', d: '2010-03-18', legenda: 'Documento – vistoria' },
  { id: 'placa', d: '2010-06-02', legenda: 'Loteamento Cajamar' },
  { id: 'cida', d: '2010-07-27', legenda: 'Aniversário da Cida' },
  { id: 'ubatuba', d: '2010-08-02', legenda: 'Foto do consultório' },
  { id: 'neve', d: '2010-08-09', legenda: '' },
  { id: 'vale', d: '2010-08-09', legenda: '' },
  { id: 'trem', d: '2010-08-10', legenda: '' },
  { id: 'chaleFrente', d: '2010-08-23', legenda: '' },
  { id: 'chaleLado', d: '2010-08-23', legenda: '' },
  { id: 'chaleVaranda', d: '2010-08-23', legenda: '' },
  { id: 'voo', d: '2010-09-22', legenda: 'Captura de tela' },
];
const notas = [{ d: '2010-09-17T23:59', t: 'Zurique' }];

// ---------------------------------------------------------------- etapa 6
const a = thread('a', 'A.', 'SMS', [
  m('2010-09-14T01:12', 'h', 'Obrigado por ontem. Pensei no que você disse. Sim.'),
  m('2010-09-14T06:40', 'o', 'Não é decisão para tomar de luto, Henrique. Dorme. Fala comigo daqui a uma semana.'),
  m('2010-09-14T06:52', 'h', 'Não é luto. É conta. Cinco pessoas, Álvaro. A próxima pode ser o Lucas, ou a Lia, num carro que eu mandei buscar uma pasta.'),
  m('2010-09-15T22:30', 'o', 'Então terça, 5 de outubro. Sete horas. Marca como consulta.'),
  m('2010-09-17T23:20', 'o', 'O 71 funciona em rato. Em homem, nunca ninguém fez. Eu não posso te garantir nada.'),
  m('2010-09-17T23:24', 'h', 'Você nunca me garantiu nada na vida e sempre acertou.'),
  m('2010-09-17T23:31', 'o', 'Estou falando sério. Entre a dose e o antídoto, você tem pouco mais de um dia. Depois disso, eu não te trago de volta. Ninguém traz.'),
  m('2010-09-17T23:33', 'h', 'Então não passa de um dia.'),
  m('2010-09-22T22:04', 'h', 'Dose às sete, em casa. Você chega às sete e cinco, pela porta da frente. Ninguém mais em casa: a Cida de folga, a Helena em Americana com a mãe, como toda segunda.'),
  m('2010-09-22T22:11', 'o', 'O atestado é meu. A segunda assinatura eu consigo com o Paulo.'),
  m('2010-09-22T22:15', 'h', 'Nada de formol. Nada de geladeira. Nada de calor. Você fica do lado o tempo todo.'),
  m('2010-09-22T22:20', 'h', 'Enterro numa gaveta, não na terra. Térrea, perto de um portão. A tampa só é cimentada no dia seguinte. Na madrugada de quarta, você abre, aplica o antídoto e me tira de lá. Às seis, eu estou no apartamento de Moema, esperando a sexta.'),
  m('2010-09-22T22:26', 'h', 'Na sexta, Zurique.'),
  m('2010-09-22T22:29', 'o', 'Os documentos novos ficam prontos no começo de outubro. O passaporte com o outro nome, eu pego em mãos.'),
  m('2010-09-25T23:10', 'o', 'E se a Helena quiser cremar?'),
  m('2010-09-25T23:14', 'h', 'Não vai. O pai dela foi enterrado. Ela me disse no Rodolfo, lembra? Eu quero ficar onde ele ficou, debaixo da terra. Ela odeia cremação.'),
  m('2010-09-25T23:16', 'o', 'Você deixou a decisão com ela. Na frente de todo mundo.'),
  m('2010-09-25T23:19', 'h', 'Por isso mesmo. Uma viúva que escolhe enterrar ninguém questiona. Se fosse eu que tivesse deixado escrito, iam perguntar por quê.'),
  m('2010-09-25T23:21', 'o', 'E se ela escolher cremar mesmo assim?'),
  m('2010-09-25T23:22', 'h', 'Então você não deixa.'),
  m('2010-09-25T23:25', 'o', 'Eu sou médico, Henrique. Não sou viúvo. Não decido nada.'),
  m('2010-09-25T23:27', 'h', 'Por isso mesmo também. Ninguém desconfia de quem não decide.'),
  m('2010-09-29T21:40', 'o', 'Às sete e quarenta eu ligo para o seu celular. Precisa ficar registrado que você não atendeu.'),
  m('2010-09-29T21:42', 'o', 'Às oito e quinze eu ligo para a Helena. Às oito e meia, para o Otávio. Os filhos, só depois que a Helena souber.'),
  m('2010-10-04T23:50', 'h', 'Acabei de ver a Lia. Quase contei. Não desisto. Amanhã, sete horas. Cuida de tudo, irmão. Obrigado por apagar a luz.'),
  m('2010-10-05T14:10', 'o', 'A Helena decidiu cremar. Estou tentando mudar. Aguenta.', { naoLida: true }),
  m('2010-10-05T22:00', 'o', 'Não consegui. Amanhã cedo, na Vila Alpina, eu tento de novo. Ela não me ouve. Ninguém me ouve.', { naoLida: true }),
  m('2010-10-06T03:40', 'o', 'Estou do seu lado. Você ainda está quente.', { naoLida: true }),
  m('2010-10-06T10:52', 'o', 'Perdão, irmão.', { naoLida: true }),
], { aviso: 'Segundo cadeado' });

// ---------------------------------------------------------------- etapa 7
const postal = {
  frente: 'postalFrente',
  endereco: ['Lia Salvallus', 'Rua Fradique Coutinho', 'Pinheiros · São Paulo – SP', 'BRASIL'],
  texto: 'Filha. Cheguei. Agora você entende. Desculpa pelo susto, desculpa por tudo, desculpa por não ter sabido ser pai do jeito que vocês mereciam. Aqui tem neve, e a casa tem doze janelas, e eu deixei uma porta, porque a gente nunca sabe quando alguém vai querer entrar. Quando a poeira baixar, o tio Álvaro vai explicar tudo. Diz ao seu irmão que a corretora é dele, mas que ele não precisa ficar nela. Diz ao Carlos que eu esperei. Diz à sua mãe que era verdade. E vem me ver. Vocês três. Eu apago a luz e deixo a varanda acesa.',
  assinatura: 'Pai.',
  ps: 'P.S. Não conta ao Álvaro que eu escrevi isto. Ele acha que só me ajudou a fugir. Mas eu também quis ajudar ele. Alguém precisava ser o primeiro, filha, e quem melhor do que um velho que já tem vontade de sumir? Se eu acordar, o remédio dele funciona em gente. Milhares de pessoas com câncer vão poder dormir durante os piores dias de dor, em vez de gritar. O Álvaro vai ser reconhecido no mundo inteiro, como sempre mereceu, e aquela comissão que não acreditou nele vai ter que engolir. Não é só fuga, Lia. É o meu jeito de pagar a ele os trinta anos que ele cuidou de todos nós. Uma causa nobre, pela primeira vez na vida do seu pai.',
};

// ---------------------------------------------------------------- montagem
const imagens = (ids) => Object.fromEntries(ids.map((id) => [id, SVG[id]]));
const etapas = {
  1: {
    titulo: 'O celular de Henrique', capitulo: 2,
    mensagens: [helena, otavio, contabilidade, alvaro, lucas, lia, carlos, bianca, nestor, cida, valdir, escritorio, bastos, mauro, silvia],
    chamadas, agenda, emailCorretora, imagens: imagens(['feira']),
  },
  2: { titulo: 'Pasta protegida', capitulo: 7, privacidade: raul },
  3: { titulo: 'E-mail pessoal', capitulo: 12, emailPessoal, imagens: imagens(['helenaPerfil', 'inauguracao']) },
  4: { titulo: 'Gravador', capitulo: 16, gravador, extra: { thread: 'carlos', msg: carlosAudio } },
  5: { titulo: 'Galeria e notas', capitulo: 23, galeria, notas, imagens: imagens(galeria.map((g) => g.id)) },
  6: { titulo: 'Segundo cadeado', capitulo: 27, cadeado: a },
  7: { titulo: 'O cartão-postal', capitulo: 30, postal, imagens: imagens(['postalFrente']) },
};

const out = path.join(__dirname, 'celular.json');
fs.writeFileSync(out, JSON.stringify({ versao: 1, etapas }, null, 1));
console.log('ok', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB', '· quintas:', quintas.length);
