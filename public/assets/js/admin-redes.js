// /assets/js/admin-redes.js — aba "Redes" do Painel da Irmandade
;(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => (v == null ? '—' : new Intl.NumberFormat('pt-BR').format(Number(v)));
const sinal = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${num(v)}`);
const quando = (iso) => { if (!iso) return 'sem dados'; const d = new Date(iso); return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const COR = { youtube: '#ff4e45', instagram: '#e1306c', facebook: '#4c8dff', tiktok: '#25f4ee', kwai: '#ff8a1f', telegram: '#2aabee' };
const ICONE = { youtube: '▶', instagram: '◎', facebook: 'f', tiktok: '♪', kwai: 'K', telegram: '➤' };
const AJUDA = {
  youtube: 'Automático: crie uma chave da “YouTube Data API v3” no Google Cloud e coloque no Render como YOUTUBE_API_KEY. Em “Configurar”, use o @ do canal (ex.: @irmandade) ou o ID “UC…”.',
  telegram: 'Automático: crie um robô no @BotFather, adicione-o ao canal como administrador e coloque o token no Render como TELEGRAM_BOT_TOKEN. Em “Configurar”, use o @ do canal.',
  instagram: 'Automático: precisa de conta profissional ligada a uma página do Facebook e de um token da Meta (META_ACCESS_TOKEN). Em “Configurar”, use o ID da conta do Instagram. Enquanto isso, lance os números à mão.',
  facebook: 'Automático: mesmo token da Meta (META_ACCESS_TOKEN). Em “Configurar”, use o ID ou o nome de usuário da página. Enquanto isso, lance os números à mão.',
  tiktok: 'O TikTok só libera dados para aplicativos aprovados. Lance os números à mão uma vez por semana (ou use o Metricool).',
  kwai: 'O Kwai não tem API pública. Lance os números à mão uma vez por semana.',
};
const st = { secret: '', api: '', dados: null, erro: '', aberto: null, dias: 90 };

async function chamar(caminho, corpo) {
  const r = await fetch(st.api + '/redes' + caminho, {
    method: corpo ? 'POST' : 'GET', cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Admin-Secret': st.secret },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.detail || `HTTP ${r.status}`);
  return d;
}
async function carregar() {
  try { st.dados = await chamar(`/admin/resumo?dias=${st.dias}`); st.erro = ''; }
  catch (e) { st.erro = e.message; }
  desenhar();
}

function grafico(d) {
  const W = 1000, H = 260, P = 34;
  const redes = d.redes.filter((r) => (d.series[r.rede] || []).some((v) => v != null));
  if (!redes.length) return '<div class="empty" style="padding:30px">O gráfico aparece assim que houver números de pelo menos uma rede.</div>';
  const todos = redes.flatMap((r) => d.series[r.rede].filter((v) => v != null));
  let min = Math.min(...todos), max = Math.max(...todos);
  if (min === max) { min = Math.max(0, min - 1); max += 1; }
  const n = d.dias.length, x = (i) => P + (i * (W - 2 * P)) / Math.max(1, n - 1), y = (v) => H - P - ((v - min) * (H - 2 * P)) / (max - min);
  let linhas = '';
  for (const r of redes) {
    let dd = '', abre = true;
    d.series[r.rede].forEach((v, i) => { if (v == null) { abre = true; return; } dd += `${abre ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)} `; abre = false; });
    linhas += `<path d="${dd}" fill="none" stroke="${COR[r.rede]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const marcas = [0, Math.floor((n - 1) / 2), n - 1].map((i) => { const [a, m, dia] = d.dias[i].split('-'); return `<text x="${x(i)}" y="${H - 8}" fill="#a6afbd" font-size="12" text-anchor="middle">${dia}/${m}</text>`; }).join('');
  const eixo = [min, (min + max) / 2, max].map((v) => `<text x="4" y="${y(v) + 4}" fill="#a6afbd" font-size="11">${num(Math.round(v))}</text><line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.06)"/>`).join('');
  const legenda = redes.map((r) => `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;font-size:12px;color:#ccd2dc"><i style="width:12px;height:3px;background:${COR[r.rede]};display:inline-block;border-radius:2px"></i>${esc(r.nome)}</span>`).join('');
  return `<div style="padding:10px 15px 0">${legenda}</div><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${eixo}${linhas}${marcas}</svg>`;
}

function cartao(r) {
  const s = r.status;
  let chip;
  if (!r.automatica) chip = '<span class="badge warn">manual</span>';
  else if (!r.chave_configurada) chip = `<span class="badge neutral" title="Para ficar automático: ${esc(r.chave_variavel)} no Render">manual por enquanto</span>`;
  else if (!r.identificador) chip = '<span class="badge warn">falta configurar</span>';
  else if (s && s.ok === false) chip = '<span class="badge bad">erro na coleta</span>';
  else if (s && s.ok) chip = '<span class="badge ok">automático ✓</span>';
  else chip = '<span class="badge neutral">aguardando 1ª coleta</span>';
  const extras = [r.visualizacoes != null ? `${num(r.visualizacoes)} visualizações` : '', r.publicacoes != null ? `${num(r.publicacoes)} publicações` : ''].filter(Boolean).join(' · ');
  const aberto = st.aberto === r.rede;
  return `<article class="card rcard" style="border-top:3px solid ${COR[r.rede]}">
    <div class="rtop"><span class="ric" style="background:${COR[r.rede]}">${ICONE[r.rede]}</span><b>${esc(r.nome)}</b>${chip}</div>
    <div class="rnum">${num(r.seguidores)}</div><div class="h">${esc(r.metrica)}</div>
    <div class="rdelta"><span>7 dias: <b class="${(r.delta_7d || 0) >= 0 ? 'ok' : 'bad'}">${sinal(r.delta_7d)}</b></span><span>30 dias: <b class="${(r.delta_30d || 0) >= 0 ? 'ok' : 'bad'}">${sinal(r.delta_30d)}</b></span></div>
    ${extras ? `<div class="h">${extras}</div>` : ''}
    <div class="h">Atualizado: ${quando(r.atualizado_em)}${r.origem ? ` · ${r.origem === 'manual' ? 'lançado à mão' : 'automático'}` : ''}</div>
    ${s && s.ok === false ? `<div class="rerro">${esc(s.mensagem)}</div>` : ''}
    <div class="racoes">${r.url ? `<a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener">Abrir ↗</a>` : ''}<button class="btn" data-abrir="${r.rede}">${aberto ? 'Fechar' : 'Configurar / lançar'}</button></div>
    ${aberto ? `<div class="rform">
      <label>Link do perfil<input class="field" id="rUrl" value="${esc(r.url)}" placeholder="https://..."></label>
      ${r.automatica ? `<label>Identificador para a coleta automática<input class="field" id="rIdent" value="${esc(r.identificador)}" placeholder="${r.rede === 'youtube' ? '@canal ou UC...' : r.rede === 'telegram' ? '@canal' : 'ID da conta/página'}"></label>` : ''}
      <button class="btn primary" data-salvar="${r.rede}">Salvar configuração</button>
      <hr style="border:0;border-top:1px solid rgba(255,255,255,.08);margin:12px 0">
      <div class="h" style="margin-bottom:6px">Lançar números de hoje (à mão)</div>
      <div class="rlinha"><input class="field" id="rSeg" type="number" min="0" placeholder="${esc(r.metrica)}"><input class="field" id="rViews" type="number" min="0" placeholder="visualizações (opcional)"><input class="field" id="rPosts" type="number" min="0" placeholder="publicações (opcional)"></div>
      <button class="btn" data-lancar="${r.rede}">Lançar</button>
      <p class="h" style="margin-top:10px;line-height:1.5">${esc(AJUDA[r.rede])}</p>
    </div>` : ''}
  </article>`;
}

function desenhar() {
  const box = $('#redes'); if (!box) return;
  const status = $('#rStatus');
  if (st.erro) { status.textContent = `Não foi possível carregar: ${st.erro}`; status.className = 'sub bad'; return; }
  const d = st.dados; if (!d) { status.textContent = 'Carregando…'; return; }
  status.textContent = `Coleta automática a cada ${d.intervalo_min} min · histórico guardado no seu banco`; status.className = 'sub';
  $('#rTotal').textContent = num(d.total_seguidores);
  const somar = (k) => d.redes.reduce((s, r) => (r[k] == null ? s : (s ?? 0) + r[k]), null);
  $('#rTotal7').textContent = sinal(somar('delta_7d'));
  $('#rTotal30').textContent = sinal(somar('delta_30d'));
  $('#rCards').innerHTML = d.redes.map(cartao).join('');
  $('#rGrafico').innerHTML = grafico(d);
  box.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => { st.aberto = st.aberto === b.dataset.abrir ? null : b.dataset.abrir; desenhar(); }));
  box.querySelectorAll('[data-salvar]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try { await chamar('/admin/config', { rede: b.dataset.salvar, url: $('#rUrl').value.trim(), identificador: $('#rIdent')?.value.trim() || '' }); await chamar('/admin/coletar', {}).catch(() => {}); st.aberto = null; await carregar(); }
    catch (e) { alert(e.message); b.disabled = false; }
  }));
  box.querySelectorAll('[data-lancar]').forEach((b) => b.addEventListener('click', async () => {
    const v = (id) => { const x = $(id).value.trim(); return x === '' ? null : Number(x); };
    if (v('#rSeg') == null) return alert('Informe pelo menos o número de seguidores.');
    b.disabled = true;
    try { await chamar('/admin/manual', { rede: b.dataset.lancar, seguidores: v('#rSeg'), visualizacoes: v('#rViews'), publicacoes: v('#rPosts') }); st.aberto = null; await carregar(); }
    catch (e) { alert(e.message); b.disabled = false; }
  }));
}

function ligar() {
  const d = $('#rDias'); if (d && !d.dataset.ok) { d.dataset.ok = '1'; d.addEventListener('change', () => { st.dias = Number(d.value); carregar(); }); }
  const c = $('#rColetar'); if (c && !c.dataset.ok) {
    c.dataset.ok = '1';
    c.addEventListener('click', async () => { c.disabled = true; c.textContent = 'Coletando…'; try { await chamar('/admin/coletar', {}); } catch (e) { alert(e.message); } c.disabled = false; c.textContent = '↻ Coletar agora'; carregar(); });
  }
}

window.ICLRedes = {
  mostrar(secret, api) { st.secret = secret; st.api = api; ligar(); if (!st.dados) carregar(); else if (!st.aberto) desenhar(); },
  atualizar(secret, api) { st.secret = secret; st.api = api; if (!st.aberto) carregar(); },
};
})();
