// /assets/js/sala-equipe.js — Sala da Equipe (Rogério + Claude + ChatGPT)
;(() => {
'use strict';
const API = (window.APP_CONFIG?.API_BASE || 'https://lumen-backend-api.onrender.com/api').replace(/\/$/, '') + '/sala';
const CHAVE = 'ICL_ADMIN_SECRET_SESSION';
const $ = (s) => document.querySelector(s);
const st = { secret: '', conversa: null, msgs: [], ocupado: false, conversas: [] };
const NOME = { claude: 'Claude', chatgpt: 'ChatGPT' };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Markdown simples e seguro (escapa tudo antes)
function md(t) {
  const linhas = esc(t).split('\n');
  let html = '', lista = null;
  const inline = (s) => s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  const fecha = () => { if (lista) { html += `</${lista}>`; lista = null; } };
  let par = [];
  const solta = () => { if (par.length) { html += `<p>${inline(par.join('<br>'))}</p>`; par = []; } };
  for (const l of linhas) {
    const ul = l.match(/^\s*[-*•]\s+(.*)/), ol = l.match(/^\s*\d+[.)]\s+(.*)/), h = l.match(/^#{1,4}\s+(.*)/);
    if (ul || ol) {
      solta();
      const tipo = ul ? 'ul' : 'ol';
      if (lista !== tipo) { fecha(); html += `<${tipo}>`; lista = tipo; }
      html += `<li>${inline((ul || ol)[1])}</li>`;
    } else if (h) { solta(); fecha(); html += `<h4>${inline(h[1])}</h4>`; }
    else if (!l.trim()) { solta(); fecha(); }
    else { fecha(); par.push(l); }
  }
  solta(); fecha();
  return html;
}
const hora = (iso) => { try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; } };

async function api(caminho, corpo, metodo) {
  const r = await fetch(API + caminho, {
    method: metodo || (corpo ? 'POST' : 'GET'), cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Admin-Secret': st.secret },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let d = {}; try { d = await r.json(); } catch (_) {}
  if (!r.ok) { const e = new Error(d?.detail || `Erro ${r.status}`); e.status = r.status; throw e; }
  return d;
}

// ---------------------------------------------------------------- lista
async function carregarLista() {
  const d = await api('/conversas');
  st.conversas = d.conversas || [];
  const lig = (ok) => `<i class="dot" style="background:${ok ? '#75d9a2' : '#f18484'}"></i>`;
  $('#info').innerHTML = `${lig(d.ligados?.claude)}Claude · ${esc(d.modelos?.claude)}<br>${lig(d.ligados?.chatgpt)}ChatGPT · ${esc(d.modelos?.chatgpt)}<br>Hoje: ${d.uso_hoje}/${d.limite_dia} perguntas`;
  $('#lista').innerHTML = st.conversas.length ? st.conversas.map((c) => `<button class="conv ${c.id === st.conversa ? 'ativa' : ''}" data-id="${c.id}">${esc(c.titulo)}<small>${hora(c.atualizado_em)} · ${c.perguntas} pergunta${c.perguntas == 1 ? '' : 's'}</small></button>`).join('') : '<p class="sub" style="padding:10px">Nenhuma conversa ainda.</p>';
  document.querySelectorAll('.conv').forEach((b) => b.addEventListener('click', () => abrir(Number(b.dataset.id))));
}

async function abrir(id) {
  $('#lado').classList.remove('aberto');
  st.conversa = id;
  $('#fala').innerHTML = '<div class="vazio">Carregando…</div>';
  try {
    const d = await api('/conversa/' + id);
    st.msgs = d.mensagens; $('#titulo').textContent = d.titulo; render(); carregarLista();
  } catch (e) { $('#fala').innerHTML = `<div class="vazio">${esc(e.message)}</div>`; }
}

function nova() {
  $('#lado').classList.remove('aberto');
  st.conversa = null; st.msgs = []; $('#titulo').textContent = 'Nova conversa'; render(); carregarLista().catch(() => {});
  $('#texto').focus();
}

// ---------------------------------------------------------------- conversa
function cartao(m) {
  if (!m) return '<div></div>';
  if (m.pensando) return `<div class="ia ${m.autor} pensando"><div class="q">${NOME[m.autor]}</div><div class="txt">pensando</div></div>`;
  return `<div class="ia ${m.autor} ${m.erro ? 'erro' : ''}"><div class="q"><span>${NOME[m.autor]}${m.tipo === 'debate' ? ' · comenta' : ''}</span><small>${hora(m.criado_em)} <button class="copiar" data-copiar="${m.id}">copiar</button></small></div><div class="txt">${md(m.texto)}</div></div>`;
}
function render() {
  const f = $('#fala');
  if (!st.msgs.length) {
    f.innerHTML = `<div class="vazio"><b>A equipe está reunida.</b>Escreva uma pergunta, uma ideia ou um texto para revisar. O Claude e o ChatGPT respondem lado a lado. Depois, toque em <b style="display:inline;font-size:inherit">Debater</b> para um comentar a resposta do outro.</div>`;
    return;
  }
  let html = '', i = 0;
  const ms = st.msgs;
  while (i < ms.length) {
    const m = ms[i];
    if (m.autor === 'rogerio') { html += `<div class="eu"><div class="q">Você · ${hora(m.criado_em)}</div>${esc(m.texto)}</div>`; i++; continue; }
    // agrupa a rodada (resposta ou debate) das duas IAs
    const grupo = { claude: null, chatgpt: null }, tipo = m.tipo;
    while (i < ms.length && ms[i].autor !== 'rogerio' && ms[i].tipo === tipo && !grupo[ms[i].autor]) { grupo[ms[i].autor] = ms[i]; i++; }
    if (tipo === 'debate') html += '<div class="rotulo">Debate · um comenta o outro</div>';
    html += `<div class="par">${cartao(grupo.claude)}${cartao(grupo.chatgpt)}</div>`;
  }
  const ult = ms[ms.length - 1];
  if (!st.ocupado && ult && ult.autor !== 'rogerio' && !ult.pensando && ult.tipo === 'resposta') {
    html += `<div class="acoes"><button class="btn" id="debater">⚖️ Debater: um comenta o outro</button></div>`;
  }
  f.innerHTML = html;
  f.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => {
    const m = st.msgs.find((x) => String(x.id) === b.dataset.copiar);
    navigator.clipboard?.writeText(m?.texto || '').then(() => { b.textContent = 'copiado ✓'; setTimeout(() => (b.textContent = 'copiar'), 1500); });
  }));
  const d = $('#debater'); if (d) d.addEventListener('click', debater);
  f.scrollTop = f.scrollHeight;
}

function ocupar(sim) {
  st.ocupado = sim; $('#enviar').disabled = sim; $('#texto').disabled = sim;
}

async function enviar() {
  const t = $('#texto').value.trim();
  if (!t || st.ocupado) return;
  ocupar(true);
  const agora = new Date().toISOString();
  st.msgs.push({ autor: 'rogerio', texto: t, criado_em: agora, tipo: 'pergunta' },
    { autor: 'claude', pensando: true, tipo: 'resposta' }, { autor: 'chatgpt', pensando: true, tipo: 'resposta' });
  $('#texto').value = ''; render();
  try {
    const d = await api('/enviar', { texto: t, conversa_id: st.conversa });
    st.msgs = st.msgs.filter((m) => !m.pensando && !(m.autor === 'rogerio' && !m.id && m.texto === t));
    st.msgs.push(...d.mensagens);
    if (!st.conversa) { st.conversa = d.conversa_id; $('#titulo').textContent = t.slice(0, 70); }
  } catch (e) {
    st.msgs = st.msgs.filter((m) => !m.pensando && !(m.autor === 'rogerio' && !m.id));
    $('#texto').value = t;
    alert(e.status === 403 ? 'Chave inválida.' : e.message);
    if (e.status === 403) return sair();
  } finally { ocupar(false); render(); carregarLista().catch(() => {}); $('#texto').focus(); }
}

async function debater() {
  if (st.ocupado || !st.conversa) return;
  ocupar(true);
  st.msgs.push({ autor: 'claude', pensando: true, tipo: 'debate' }, { autor: 'chatgpt', pensando: true, tipo: 'debate' });
  render();
  try {
    const d = await api('/debater', { conversa_id: st.conversa });
    st.msgs = st.msgs.filter((m) => !m.pensando); st.msgs.push(...d.mensagens);
  } catch (e) { st.msgs = st.msgs.filter((m) => !m.pensando); alert(e.message); }
  finally { ocupar(false); render(); }
}

// ---------------------------------------------------------------- acesso
async function entrar() {
  const s = $('#secret').value.trim();
  if (!s) return;
  st.secret = s; $('#entrar').disabled = true; $('#loginStatus').textContent = 'Validando…';
  try {
    await carregarLista();
    sessionStorage.setItem(CHAVE, s);
    try { if (localStorage.getItem('ICL_NAO_CONTAR') === null) localStorage.setItem('ICL_NAO_CONTAR', '1'); } catch (_) {}
    $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); render(); $('#texto').focus();
    $('#loginStatus').textContent = '';
  } catch (e) {
    st.secret = ''; sessionStorage.removeItem(CHAVE);
    $('#loginStatus').textContent = e.status === 403 ? 'Chave inválida.' : `Erro: ${e.message}`;
  } finally { $('#entrar').disabled = false; }
}
function sair() { st.secret = ''; sessionStorage.removeItem(CHAVE); location.reload(); }

$('#entrar').addEventListener('click', entrar);
$('#secret').addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
$('#enviar').addEventListener('click', enviar);
$('#texto').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(); } });
$('#texto').addEventListener('input', (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px'; });
$('#nova').addEventListener('click', nova);
$('#sair').addEventListener('click', sair);
$('#menu').addEventListener('click', () => $('#lado').classList.toggle('aberto'));
const salvo = sessionStorage.getItem(CHAVE);
if (salvo) { $('#secret').value = salvo; entrar(); }
})();
