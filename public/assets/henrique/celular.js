/* Celular virtual de Henrique Salvallus — "Todo crime tem um autor?"
   O conteúdo vem do servidor, etapa por etapa (/api/henrique/abrir).
   No navegador só ficam guardados o e-mail e as senhas já digitadas. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const CHAVE = 'henrique.v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------------------------------------------------------- estado
  const st = { email: '', senhas: {}, dados: {}, imgs: {}, pilha: [] };
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (_) { return null; } };
  const gravar = () => { try { localStorage.setItem(CHAVE, JSON.stringify({ email: st.email, senhas: st.senhas })); } catch (_) {} };
  const temEtapa = (n) => Boolean(st.dados[n]);
  const maxEtapa = () => Math.max(0, ...Object.keys(st.dados).map(Number));

  async function api(url, corpo) {
    const r = await fetch(url, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : {});
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(j.erro || 'Não foi possível falar com o site agora. Tente de novo.');
    return j;
  }
  async function abrir(senha) {
    const j = await api('/api/henrique/abrir', { email: st.email, senha });
    st.dados[j.etapa] = j.conteudo;
    st.senhas[j.etapa] = String(senha);
    Object.assign(st.imgs, j.conteudo.imagens || {});
    gravar();
    return j;
  }

  // ---------------------------------------------------------------- datas
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const parte = (iso) => { const [d, h = ''] = iso.split('T'); const [y, mo, da] = d.split('-').map(Number); return { y, mo, da, h }; };
  const dow = (iso) => { const p = parte(iso); return new Date(Date.UTC(p.y, p.mo - 1, p.da)).getUTCDay(); };
  const dataCurta = (iso) => { const p = parte(iso); return `${String(p.da).padStart(2, '0')}/${String(p.mo).padStart(2, '0')}/${p.y}`; };
  const dataLonga = (iso) => { const p = parte(iso); return `${SEM[dow(iso)]}, ${p.da} ${MES[p.mo - 1]} ${p.y}`; };
  const hora = (iso) => parte(iso).h;
  const dia = (iso) => iso.slice(0, 10);

  // ---------------------------------------------------------------- ícones
  const I = {
    msg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    tel: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    foto: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',
    nota: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    cofre: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    cad: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M7 10V7a5 5 0 0 1 10 0v3h1v11H6V10zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>',
    postal: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="6" width="20" height="13" rx="1"/><path d="M14 9h5v4h-5zM5 11h6M5 15h6"/></svg>',
  };

  // Aplicativos da tela inicial: etapa que abre cada um e a dica escrita por Henrique
  const APPS = [
    { id: 'mensagens', nome: 'Mensagens', ic: 'msg', cor: '#2f7d4f', etapa: 1 },
    { id: 'emailc', nome: 'E-mail', ic: 'mail', cor: '#2f6fb3', etapa: 1 },
    { id: 'emailp', nome: 'E-mail pessoal', ic: 'mail', cor: '#7a4fb3', etapa: 3 },
    { id: 'chamadas', nome: 'Chamadas', ic: 'tel', cor: '#3a9a4c', etapa: 1 },
    { id: 'agenda', nome: 'Agenda', ic: 'cal', cor: '#c4513b', etapa: 1 },
    { id: 'galeria', nome: 'Fotos', ic: 'foto', cor: '#d08a22', etapa: 5 },
    { id: 'notas', nome: 'Notas', ic: 'nota', cor: '#c9a72a', etapa: 5 },
    { id: 'gravador', nome: 'Gravador', ic: 'mic', cor: '#46525e', etapa: 4, dica: 'Onde eu espero toda quinta.' },
    { id: 'privacidade', nome: 'Privacidade', ic: 'cofre', cor: '#1f3550', etapa: 2 },
    { id: 'cadeado', nome: '', ic: 'cad', cor: '#7d858d', etapa: 6, dica: 'O papel que me deixa ir.' },
    { id: 'postal', nome: 'Postal', ic: 'postal', cor: '#a26a3c', etapa: 7, dica: 'O cartão-postal' },
  ];

  // ---------------------------------------------------------------- tela
  const tela = () => $('#tela');
  const statusBar = () => `<div class="status"><span class="sinal" aria-hidden="true"><i style="height:3px"></i><i style="height:5px"></i><i style="height:7px"></i><i style="height:10px"></i></span><span class="op">3G</span><span>08:57</span><span class="bateria" aria-hidden="true"></span></div>`;
  const cab = (titulo, sub = '') => `<div class="cab"><button type="button" class="vol" data-voltar aria-label="Voltar">‹</button><h2>${esc(titulo)}</h2>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;

  function mostrar(html, foco = true) {
    const t = tela();
    t.innerHTML = statusBar() + html;
    t.querySelectorAll('[data-voltar]').forEach((b) => b.addEventListener('click', voltar));
    if (foco) t.focus({ preventScroll: true });
    carregarFotos(t);
  }

  // Fotos reais: chegam pela rota protegida, com a senha da etapa; miniatura na grade e no e-mail
  const fotosCache = new Map();
  function carregarFotos(raiz) {
    raiz.querySelectorAll('img[data-foto]').forEach((img) => {
      const id = img.dataset.foto, etapa = img.dataset.etapa;
      const tam = img.closest('.grade, .fotos') ? 'p' : 'g';
      const chave = id + ':' + tam;
      if (!fotosCache.has(chave)) {
        fotosCache.set(chave, fetch('/api/henrique/foto', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: st.email, senha: st.senhas[etapa], id, tam }) })
          .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('foto'))))
          .then((b) => URL.createObjectURL(b))
          .catch((e) => { fotosCache.delete(chave); throw e; }));
      }
      img.decoding = 'async';
      fotosCache.get(chave).then((url) => { img.src = url; }).catch(() => { img.alt = 'Foto indisponível'; });
    });
  }
  function ir(fn) { st.pilha.push(fn); fn(); }
  function voltar() {
    pararAudio();
    if (st.pilha.length > 1) { st.pilha.pop(); st.pilha[st.pilha.length - 1](); }
    else if (temEtapa(1) || maxEtapa()) home();
  }
  function home() { pararAudio(); st.pilha = [telaInicial]; telaInicial(); }

  function aviso(txt) {
    const a = document.createElement('div');
    a.className = 'aviso'; a.setAttribute('role', 'status'); a.textContent = txt;
    tela().appendChild(a);
    setTimeout(() => a.remove(), 3200);
  }

  // ---------------------------------------------------------------- bloqueio inicial
  function bloqueio(msg = '') {
    st.pilha = [];
    mostrar(`<div class="bloqueio">
      <b>08:57</b><p>Terça-feira, 5 de outubro</p>
      <p>Digite a senha para desbloquear</p>
      <form id="fBloq" style="display:contents"><input id="senhaIni" inputmode="numeric" autocomplete="off" maxlength="5" aria-label="Senha do celular" />
      <button type="submit">Desbloquear</button></form>
      <p class="msgerro" id="erroBloq" role="alert">${esc(msg)}</p>
      <p>Senha do livro + o seu código pessoal.</p></div>`);
    const inp = $('#senhaIni');
    inp.focus();
    $('#fBloq').addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = inp.value.trim();
      if (!v) return;
      try { const j = await abrir(v); home(); aviso(`Abriu: ${j.conteudo.titulo}`); }
      catch (err) { $('#erroBloq').textContent = err.message; inp.select(); }
    });
  }

  // ---------------------------------------------------------------- tela inicial
  function telaInicial() {
    const cadeadoNaoLidas = temEtapa(6) ? st.dados[6].cadeado.msgs.filter((x) => x.naoLida).length : 0;
    const icones = APPS.map((a) => {
      const aberto = temEtapa(a.etapa);
      const badge = a.id === 'cadeado' && aberto ? `<span class="badge">${cadeadoNaoLidas}</span>` : '';
      return `<button type="button" class="ic" data-app="${a.id}" aria-label="${esc(a.nome || 'Aplicativo sem nome')}${aberto ? '' : ' (bloqueado)'}">
        <span class="q" style="background:${a.cor}">${I[a.ic]}</span>${aberto ? badge : `<span class="cad">${I.cad}</span>`}<span>${esc(a.nome) || '&nbsp;'}</span></button>`;
    }).join('');
    mostrar(`<div class="home"><div class="relogio"><b>08:57</b><span>Terça-feira, 5 de outubro de 2010</span></div><div class="icones">${icones}</div></div>`);
    tela().querySelectorAll('[data-app]').forEach((b) => b.addEventListener('click', () => abrirApp(b.dataset.app)));
  }

  function abrirApp(id) {
    const app = APPS.find((a) => a.id === id);
    if (!temEtapa(app.etapa)) return pedirSenha(app);
    const v = { mensagens: vMensagens, emailc: vEmailC, emailp: vEmailP, chamadas: vChamadas, agenda: () => vAgenda('2010-10'),
      galeria: vGaleria, notas: vNotas, gravador: vGravador, privacidade: vPrivacidade, cadeado: vCadeado, postal: vPostal }[id];
    ir(v);
  }

  function pedirSenha(app) {
    const cx = document.createElement('div');
    cx.className = 'senha';
    cx.innerHTML = `<form class="cx"><h3>${esc(app.nome || 'Aplicativo protegido')}: digite a senha</h3>
      ${app.dica && app.id !== 'postal' ? `<p class="dica">Dica: ${esc(app.dica)}</p>` : '<p class="dica">Senha do livro + o seu código pessoal.</p>'}
      <input inputmode="numeric" autocomplete="off" maxlength="5" aria-label="Senha" />
      <p class="msgerro" role="alert"></p>
      <div class="acoes"><button type="button" class="cancela">Cancelar</button><button type="submit" class="ok">OK</button></div></form>`;
    tela().appendChild(cx);
    const inp = $('input', cx);
    inp.focus();
    $('.cancela', cx).addEventListener('click', () => cx.remove());
    $('form', cx).addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = inp.value.trim();
      if (!v) return;
      try {
        const j = await abrir(v);
        cx.remove();
        if (j.etapa === app.etapa) { telaInicial(); abrirApp(app.id); }
        else telaInicial();
        aviso(`Abriu: ${j.conteudo.titulo}`);
      } catch (err) { $('.msgerro', cx).textContent = err.message; inp.select(); }
    });
  }

  // ---------------------------------------------------------------- mensagens
  function threads() {
    const base = (st.dados[1]?.mensagens || []).map((t) => ({ ...t, msgs: [...t.msgs] }));
    const lista = base.filter((t) => !(t.apagaDepoisDaEtapa && maxEtapa() > t.apagaDepoisDaEtapa));
    if (temEtapa(4)) {
      const ex = st.dados[4].extra;
      const t = lista.find((x) => x.id === ex.thread);
      if (t) t.msgs.push(ex.msg);
    }
    return lista.sort((a, b) => b.msgs[b.msgs.length - 1].d.localeCompare(a.msgs[a.msgs.length - 1].d));
  }
  function itemThread(t) {
    const u = t.msgs[t.msgs.length - 1];
    return `<li><button type="button" data-t="${t.id}"><span class="meio"><span class="nome">${esc(t.nome)}</span><span class="tag ${t.tipo === 'BBM' ? 'bbm' : ''}">${t.tipo}</span>
      <span class="prev">${u.de === 'h' ? 'Você: ' : ''}${esc(u.t)}</span></span><span class="data">${dataCurta(u.d)}</span></button></li>`;
  }
  function vMensagens() {
    const ts = threads();
    mostrar(cab('Mensagens', `${ts.length} conversas`) + `<div class="corpo-tela"><ul class="lista">${ts.map(itemThread).join('')}</ul></div>`);
    tela().querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
      const t = ts.find((x) => x.id === b.dataset.t);
      ir(() => vConversa(t));
    }));
  }
  function vConversa(t, titulo) {
    let ult = '';
    const html = t.msgs.map((x) => {
      const d = dia(x.d);
      const sep = d !== ult ? `<div class="sep">${dataLonga(x.d)}</div>` : '';
      ult = d;
      const foto = x.foto && st.imgs[x.foto] ? `<span class="foto">${st.imgs[x.foto]}</span>` : '';
      const corpo = x.audio
        ? `<button type="button" class="audio" data-audio><span class="play">▶</span><span>${esc(x.t)}</span></button>`
        : esc(x.t);
      const status = x.status ? ` · ${esc(x.status)}` : '';
      return `${sep}<div class="msg ${x.de === 'h' ? 'eu' : 'ele'}${x.naoLida ? ' nao-lida' : ''}">${foto}${corpo}<span class="hora">${hora(x.d)}${status}${x.naoLida ? ' · não lida' : ''}</span></div>`;
    }).join('');
    mostrar(cab(titulo || t.nome, t.tipo) + `<div class="corpo-tela"><div class="conversa">${html}</div></div>`);
    tela().querySelectorAll('[data-audio]').forEach((b) => b.addEventListener('click', () => (temEtapa(4) ? ir(vPlayer) : null)));
    const c = $('.corpo-tela', tela());
    c.scrollTop = c.scrollHeight;
  }

  // ---------------------------------------------------------------- e-mail
  function vEmailC() {
    const ms = [...st.dados[1].emailCorretora].sort((a, b) => b.d.localeCompare(a.d));
    mostrar(cab('E-mail', 'Salvallus Seguros') + `<div class="corpo-tela"><ul class="lista">${ms.map((m, i) => `<li><button type="button" data-i="${i}"><span class="meio"><span class="nome">${esc(m.de)}</span><span class="prev">${esc(m.assunto)}</span></span><span class="data">${dataCurta(m.d)}</span></button></li>`).join('')}</ul></div>`);
    tela().querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      const m = ms[b.dataset.i];
      ir(() => mostrar(cab('E-mail') + `<div class="corpo-tela"><div class="email"><div class="de">De: ${esc(m.de)} · ${dataLonga(m.d)}, ${hora(m.d)}</div><h3>${esc(m.assunto)}</h3><div class="corpo-m">${esc(m.t)}</div></div></div>`));
    }));
  }
  function vEmailP() {
    const ms = st.dados[3].emailPessoal; // já em ordem de escrita
    mostrar(cab('E-mail pessoal', 'mais antigas primeiro') + `<div class="corpo-tela"><ul class="lista">${ms.map((m, i) => `<li><button type="button" data-i="${i}"><span class="meio"><span class="nome">${esc(m.assunto)}</span><span class="prev">${m.fotos ? '2 fotos anexadas' : esc(m.t)}</span></span><span class="data">${dataCurta(m.d)}</span></button></li>`).join('')}</ul></div>`);
    tela().querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => ir(() => vEmailPessoalMsg(ms[b.dataset.i]))));
  }
  function vEmailPessoalMsg(m) {
    const fotos = m.fotos ? `<div class="fotos">${m.fotos.map((f) => `<button type="button" data-f="${f}" aria-label="Ampliar foto">${st.imgs[f] || ''}</button>`).join('')}</div>` : '';
    let anexo = '';
    if (m.anexo) {
      const total = m.anexo.linhas.reduce((s, l) => s + Number(l[2].replace(/\./g, '').replace(',', '.')), 0);
      anexo = `<details class="anexo"><summary>Anexo: ${esc(m.anexo.nome)}</summary><table class="planilha"><thead><tr><th>Data</th><th>Fornecedor</th><th>R$</th></tr></thead><tbody>
        ${m.anexo.linhas.map((l) => `<tr><td>${esc(l[0])}</td><td>${esc(l[1])}</td><td>${esc(l[2])}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="2">${m.anexo.linhas.length} pagamentos</td><td>${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr></tfoot></table></details>`;
    }
    mostrar(cab('E-mail pessoal') + `<div class="corpo-tela"><div class="email"><div class="de">De: Henrique · Para: Henrique · ${dataLonga(m.d)}, ${hora(m.d)}</div><h3>${esc(m.assunto)}</h3><div class="corpo-m">${esc(m.t)}</div>${fotos}${anexo}</div></div>`);
    tela().querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => ir(() => vVisor(b.dataset.f, m.d, ''))));
  }

  // ---------------------------------------------------------------- chamadas
  function vChamadas() {
    const cs = st.dados[1].chamadas;
    const sim = { feita: '↗', recebida: '↙', perdida: '✕' };
    mostrar(cab('Registro de chamadas') + `<div class="corpo-tela"><ul class="lista">${cs.map((c) => `<li class="${c.tipo}"><button type="button" tabindex="-1"><span class="ch-ic ch-${c.tipo}" aria-label="${c.tipo}">${sim[c.tipo]}</span>
      <span class="meio"><span class="nome">${esc(c.nome)}</span><span class="prev">${c.tipo === 'perdida' ? 'Chamada perdida' : c.tipo === 'feita' ? 'Chamada feita' : 'Chamada recebida'}${c.dur ? ` · ${c.dur}` : ''}</span></span>
      <span class="data">${dataCurta(c.d)}<br>${hora(c.d)}</span></button></li>`).join('')}</ul></div>`);
  }

  // ---------------------------------------------------------------- agenda
  const COR = { azul: 'Reuniões', verde: 'Viagens', vermelho: 'Médicos', cinza: 'Outros' };
  function vAgenda(ym) {
    st.pilha[st.pilha.length - 1] = () => vAgenda(ym);
    const [y, mo] = ym.split('-').map(Number);
    const itens = st.dados[1].agenda.filter((e) => e.d.startsWith(ym)).sort((a, b) => (a.d + a.h).localeCompare(b.d + b.h));
    let ult = '';
    const html = itens.map((e, i) => {
      const sep = e.d !== ult ? `<div class="ag-dia">${SEMANA[dow(e.d)]}, ${parte(e.d).da} de ${MESES[mo - 1].toLowerCase()}</div>` : '';
      ult = e.d;
      return `${sep}<li class="ag-item"><button type="button" data-i="${i}"><span class="barra cor-${e.cor}"></span><span class="meio"><span class="nome">${e.t ? esc(e.t) : '&nbsp;'}</span><span class="prev">${esc(e.h)}</span></span></button></li>`;
    }).join('');
    const ant = mo > 1 ? `2010-${String(mo - 1).padStart(2, '0')}` : null;
    const prox = mo < 12 ? `2010-${String(mo + 1).padStart(2, '0')}` : null;
    mostrar(cab('Agenda') + `<div class="ag-nav"><button type="button" id="agAnt" ${ant ? '' : 'disabled'} aria-label="Mês anterior">‹</button><b>${MESES[mo - 1]} ${y}</b><button type="button" id="agProx" ${prox ? '' : 'disabled'} aria-label="Próximo mês">›</button></div>
      <div class="ag-leg">${Object.entries(COR).map(([c, n]) => `<span><i class="cor-${c}"></i>${n}</span>`).join('')}</div>
      <div class="corpo-tela">${itens.length ? `<ul class="lista">${html}</ul>` : '<p class="vazio">Nenhum compromisso neste mês.</p>'}</div>`);
    if (ant) $('#agAnt').addEventListener('click', () => vAgenda(ant));
    if (prox) $('#agProx').addEventListener('click', () => vAgenda(prox));
    tela().querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      const e = itens[b.dataset.i];
      ir(() => mostrar(cab('Compromisso') + `<div class="corpo-tela"><div class="ag-det"><p class="gr">${e.t ? esc(e.t) : '<em>(sem título)</em>'}</p>
        <p>${SEMANA[dow(e.d)]}, ${dataCurta(e.d)} · ${esc(e.h)}</p><p><span class="cor-${e.cor}" style="display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:-1px"></span> ${COR[e.cor]}</p>
        ${e.criado ? `<p style="color:#5f6873;font-size:12px">Criado em ${dataCurta(e.criado)}</p>` : ''}</div></div>`));
    }));
  }

  // ---------------------------------------------------------------- galeria e notas
  function vGaleria() {
    const g = st.dados[5].galeria;
    mostrar(cab('Fotos', `${g.length} itens`) + `<div class="corpo-tela"><div class="grade">${g.map((f, i) => `<button type="button" data-i="${i}" aria-label="Foto ${i + 1}">${st.imgs[f.id] || ''}</button>`).join('')}</div></div>`);
    tela().querySelectorAll('.grade svg').forEach((el) => el.setAttribute('preserveAspectRatio', 'xMidYMid slice'));
    tela().querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { const f = g[b.dataset.i]; ir(() => vVisor(f.id, f.d, f.legenda)); }));
  }
  function vVisor(id, d, legenda) {
    mostrar(cab('Foto') + `<div class="visor">${st.imgs[id] || ''}<p>${legenda ? esc(legenda) + ' · ' : ''}${dataCurta(d)}</p></div>`);
  }
  function vNotas() {
    const n = st.dados[5].notas;
    mostrar(cab('Notas') + `<div class="corpo-tela"><ul class="lista">${n.map((x, i) => `<li><button type="button" data-i="${i}"><span class="meio"><span class="nome">${esc(x.t)}</span></span><span class="data">${dataCurta(x.d)}</span></button></li>`).join('')}</ul></div>`);
    tela().querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      const x = n[b.dataset.i];
      ir(() => mostrar(cab('Nota') + `<div class="corpo-tela"><div class="email"><div class="de">${dataLonga(x.d)}, ${hora(x.d)}</div><div class="corpo-m" style="font-size:18px;margin-top:10px">${esc(x.t)}</div></div></div>`));
    }));
  }

  // ---------------------------------------------------------------- gravador
  let timer = null;
  let audioAtual = null;
  function pararAudio() {
    if (timer) { clearInterval(timer); timer = null; }
    if (audioAtual) { try { audioAtual.pause(); } catch (_) {} audioAtual = null; }
  }
  function vGravador() {
    const g = st.dados[4].gravador;
    mostrar(cab('Gravador') + `<div class="corpo-tela"><ul class="lista"><li><button type="button" id="arq"><span class="meio"><span class="nome">${esc(g.arquivo)}</span><span class="prev">0:${String(g.duracao).padStart(2, '0')}</span></span><span class="data">${dataCurta(g.gravado)}<br>${hora(g.gravado)}</span></button></li></ul></div>`);
    $('#arq').addEventListener('click', () => ir(vPlayer));
  }
  function vPlayer() {
    const g = st.dados[4].gravador;
    const barras = Array.from({ length: 40 }, (_, i) => `<i style="height:${18 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70)}%"></i>`).join('');
    mostrar(cab(g.arquivo, 'gravado em ' + dataCurta(g.gravado)) + `<div class="corpo-tela"><div class="grav"><div class="nome-arq">${esc(g.arquivo)}</div>
      <div class="onda" aria-hidden="true">${barras}</div><div class="tempo" id="tempo">0:00 / 0:${g.duracao}</div>
      <button type="button" class="bt" id="play" aria-label="Tocar">▶</button>
      <div class="transc" aria-live="polite">${g.transcricao.map(([s, t]) => `<span data-s="${s}">${esc(t)} </span>`).join('')}</div>
      <button type="button" class="sair" id="tudo" style="color:#c3cfdb">Ler tudo de uma vez</button></div></div>`);
    let t = 0, total = g.duracao;
    const barrasEl = tela().querySelectorAll('.onda i');
    const pinta = () => {
      $('#tempo').textContent = `0:${String(Math.floor(t)).padStart(2, '0')} / 0:${g.duracao}`;
      barrasEl.forEach((b, i) => b.classList.toggle('on', i < Math.round((t / total) * 40)));
      tela().querySelectorAll('.transc span').forEach((s) => s.classList.toggle('dita', t >= Number(s.dataset.s)));
    };
    // Com o arquivo de voz no servidor, o texto acompanha o áudio
    // (os tempos da transcrição marcam o início de cada frase na gravação, em segundos).
    if (g.temAudio) {
      const bt = $('#play');
      let audio = null;
      const carregar = async () => {
        if (audio) return audio;
        bt.textContent = '…';
        const r = await fetch('/api/henrique/audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: st.email, senha: st.senhas[4] }) });
        if (!r.ok) throw new Error('sem áudio');
        audio = new Audio(URL.createObjectURL(await r.blob()));
        audioAtual = audio;
        audio.addEventListener('timeupdate', () => {
          const d = audio.duration || g.duracao;
          total = d;
          t = audio.currentTime; // os tempos da transcrição são os da própria gravação, em segundos
          pinta();
          $('#tempo').textContent = `${fmt(audio.currentTime)} / ${fmt(d)}`;
        });
        audio.addEventListener('ended', () => { bt.textContent = '▶'; t = total; pinta(); });
        return audio;
      };
      const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      bt.addEventListener('click', async () => {
        try {
          const a = await carregar();
          if (a.paused) { await a.play(); bt.textContent = '❚❚'; } else { a.pause(); bt.textContent = '▶'; }
        } catch (_) { bt.textContent = '▶'; aviso('Não foi possível tocar o áudio agora.'); }
      });
      $('#tudo').addEventListener('click', () => { if (audio) audio.pause(); bt.textContent = '▶'; t = total; pinta(); });
      return;
    }
    $('#play').addEventListener('click', () => {
      if (timer) { pararAudio(); $('#play').textContent = '▶'; return; }
      if (t >= g.duracao) t = 0;
      $('#play').textContent = '❚❚';
      timer = setInterval(() => { t += 1; pinta(); if (t >= g.duracao) { pararAudio(); $('#play').textContent = '▶'; } }, 1000);
      pinta();
    });
    $('#tudo').addEventListener('click', () => { pararAudio(); t = g.duracao; pinta(); $('#play').textContent = '▶'; });
  }

  // ---------------------------------------------------------------- pastas protegidas
  function vPrivacidade() {
    const t = st.dados[2].privacidade;
    mostrar(cab('Privacidade', 'pasta protegida') + `<div class="corpo-tela"><ul class="lista">${itemThread(t)}</ul></div>`);
    tela().querySelector('[data-t]').addEventListener('click', () => ir(() => vConversa(t)));
  }
  function vCadeado() {
    const t = st.dados[6].cadeado;
    mostrar(cab(' ', 'protegido') + `<div class="corpo-tela"><ul class="lista">${itemThread(t)}</ul></div>`);
    tela().querySelector('[data-t]').addEventListener('click', () => ir(() => vConversa(t)));
  }

  // ---------------------------------------------------------------- cartão-postal
  function vPostal(lado = 'frente', luz = false) {
    st.pilha[st.pilha.length - 1] = () => vPostal(lado, luz);
    const p = st.dados[7].postal;
    const face = lado === 'frente'
      ? `<div class="cartao">${st.imgs[p.frente] || ''}</div>`
      : `<div class="cartao"><div class="ps" aria-hidden="true">${esc(p.ps)}</div><div class="verso"><div class="txt">${esc(p.texto)}<br><br>${esc(p.assinatura)}</div>
          <div class="dir"><div class="selo">HELVETIA<br>1.00</div><div class="endereco">${p.endereco.map((l) => `<div>${esc(l)}</div>`).join('')}</div></div></div></div>`;
    mostrar(cab('Cartão-postal') + `<div class="corpo-tela"><div class="postal">${face}
      <div class="acoes"><button type="button" id="virar">${lado === 'frente' ? 'Virar o cartão' : 'Ver a frente'}</button>${lado === 'verso' ? `<button type="button" id="luz">${luz ? 'Guardar' : 'Inclinar contra a luz'}</button>` : ''}</div>
      ${lado === 'verso' && luz ? `<div class="ps-lido">${esc(p.ps)}</div>` : ''}</div></div>`);
    $('#virar').addEventListener('click', () => vPostal(lado === 'frente' ? 'verso' : 'frente', false));
    const l = $('#luz');
    if (l) l.addEventListener('click', () => vPostal('verso', !luz));
  }

  // ---------------------------------------------------------------- acesso e início
  function mostrarAparelho() {
    $('#acesso').hidden = true;
    $('#aparelho').hidden = false;
    $('#quem').textContent = st.email;
  }
  function mostrarAcesso() {
    $('#acesso').hidden = false;
    $('#aparelho').hidden = true;
    $('#quem').textContent = '';
  }
  let desafio = null;
  async function carregarDesafio() {
    try { desafio = await api('/api/henrique/desafio'); $('#pergunta').textContent = desafio.pergunta; }
    catch (e) { $('#pergunta').textContent = 'Não foi possível carregar o desafio. Recarregue a página.'; }
  }
  function aba(qual) {
    const cad = qual === 'cadastro';
    $('#abaEntrar').setAttribute('aria-selected', String(!cad));
    $('#abaCadastro').setAttribute('aria-selected', String(cad));
    $('#formEntrar').hidden = cad;
    $('#formCadastro').hidden = !cad;
    $('#codigoBox').hidden = true;
    $('#erroAcesso').textContent = '';
    if (cad && !desafio) carregarDesafio();
  }

  async function restaurar() {
    const etapas = Object.keys(st.senhas).sort((a, b) => a - b);
    const salvas = { ...st.senhas };
    st.senhas = {};
    for (const n of etapas) { try { await abrir(salvas[n]); } catch (_) {} }
    gravar();
  }

  async function iniciar() {
    const s = ler();
    $('#abaEntrar').addEventListener('click', () => aba('entrar'));
    $('#abaCadastro').addEventListener('click', () => aba('cadastro'));
    $('#formEntrar').addEventListener('submit', (e) => {
      e.preventDefault();
      st.email = e.target.email.value.trim().toLowerCase();
      gravar(); mostrarAparelho(); bloqueio();
    });
    $('#formCadastro').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target, bt = $('button', f);
      bt.disabled = true; $('#erroAcesso').textContent = '';
      try {
        const j = await api('/api/henrique/cadastro', { nome: f.nome.value, email: f.email.value, desafio: desafio && desafio.id, resposta: f.resposta.value });
        st.email = f.email.value.trim().toLowerCase();
        gravar();
        f.hidden = true;
        $('#codigoNum').textContent = j.codigo;
        $('#codigoEx').textContent = `Exemplo: 4821 + ${j.codigo} = ${4821 + j.codigo}`;
        $('#codigoBox').hidden = false;
      } catch (err) {
        $('#erroAcesso').textContent = err.message;
        if (/Desafio/.test(err.message)) carregarDesafio();
      } finally { bt.disabled = false; }
    });
    $('#irCelular').addEventListener('click', () => { mostrarAparelho(); bloqueio(); });
    $('#sair').addEventListener('click', () => {
      try { localStorage.removeItem(CHAVE); } catch (_) {}
      location.reload();
    });
    ['#tVoltar', '#tTrack'].forEach((id) => $(id).addEventListener('click', voltar));
    ['#tHome', '#tMenu', '#tFim'].forEach((id) => $(id).addEventListener('click', () => (maxEtapa() ? home() : null)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#aparelho').hidden) { const m = $('.senha', tela()); if (m) m.remove(); else voltar(); } });

    if (!s || !s.email) return mostrarAcesso();
    st.email = s.email;
    st.senhas = s.senhas || {};
    mostrarAparelho();
    if (!Object.keys(st.senhas).length) return bloqueio();
    mostrar('<div class="bloqueio"><p>Ligando…</p></div>', false);
    await restaurar();
    if (maxEtapa()) home(); else bloqueio('Digite a senha de novo.');
  }

  iniciar();
})();
