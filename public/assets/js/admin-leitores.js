// /assets/js/admin-leitores.js — aba "Leitores" do Painel da Irmandade
;(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => (v == null ? '—' : new Intl.NumberFormat('pt-BR').format(Number(v)));
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const st = { secret: '', api: '', dados: null, erro: '', ligado: false };

async function chamar(caminho) {
  const r = await fetch(st.api + '/livros' + caminho, { cache: 'no-store', headers: { 'X-Admin-Secret': st.secret } });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.detail || d?.erro || `HTTP ${r.status}`); }
  return r;
}
async function carregar() {
  try { st.dados = await (await chamar('/admin/leitores')).json(); st.erro = ''; }
  catch (e) { st.erro = e.message; }
  desenhar();
}
function desenhar() {
  const d = st.dados;
  $('#lStatus').textContent = st.erro ? `Erro: ${st.erro}` : (d ? `Atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Carregando…');
  if (!d) return;
  const r = d.resumo || {};
  $('#lTotal').textContent = num(r.total); $('#lNov').textContent = num(r.novidades);
  $('#l7').textContent = num(r.ultimos_7_dias); $('#lHoje').textContent = num(r.hoje);
  const busca = ($('#lBusca').value || '').trim().toLowerCase();
  const so = $('#lFiltro').value === 'sim';
  const lista = (d.leitores || []).filter((l) => (!so || l.novidades) && (!busca || `${l.nome} ${l.email}`.toLowerCase().includes(busca)));
  $('#lCount').textContent = `${num(lista.length)} de ${num(r.total)}`;
  $('#lCorpo').innerHTML = lista.map((l) => `<tr><td>${quando(l.criado_em)}</td><td>${esc(l.nome)}</td><td class="mono">${esc(l.email)}</td><td>${esc(l.titulo)}</td>`
    + `<td>${l.novidades ? '<span class="badge ok">sim</span>' : '<span class="badge neutral">não</span>'}</td><td>${num(l.envios)}</td>`
    + `<td>${l.ultimo_envio_status === 'enviado' ? '<span class="badge ok">enviado</span>' : `<span class="badge bad">${esc(l.ultimo_envio_status || '—')}</span>`}</td></tr>`).join('');
  $('#lVazio').classList.toggle('hidden', lista.length > 0);
}
async function exportar() {
  const bt = $('#lCsv'); bt.disabled = true;
  try {
    const blob = await (await chamar('/admin/leitores.csv')).blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `leitores-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) { alert('Não foi possível exportar: ' + e.message); }
  finally { bt.disabled = false; }
}
function ligar() {
  if (st.ligado) return; st.ligado = true;
  $('#lBusca').addEventListener('input', desenhar);
  $('#lFiltro').addEventListener('change', desenhar);
  $('#lCsv').addEventListener('click', exportar);
}
window.ICLLeitores = {
  mostrar(secret, api) { st.secret = secret; st.api = api; ligar(); if (!st.dados) carregar(); else desenhar(); },
  atualizar(secret, api) { st.secret = secret; st.api = api; carregar(); },
};
})();
