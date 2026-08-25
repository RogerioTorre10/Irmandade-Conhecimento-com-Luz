;(() => {
  'use strict';

  const AUTO_REFRESH_MS = 30000;
  const API_BASE = (window.APP_CONFIG?.API_BASE || window.API_BASE || 'https://lumen-backend-api.onrender.com/api').replace(/\/$/, '');
  const $ = s => document.querySelector(s);
  const state = { secret:'', sessions:[], filtered:[], timer:null, loading:false };

  const ui = {
    login:$('#login'), dash:$('#dash'), secret:$('#secret'), enter:$('#enter'), loginStatus:$('#loginStatus'),
    refresh:$('#refresh'), logout:$('#logout'), live:$('#live'), q:$('#q'), status:$('#status'), deadline:$('#deadline'), clear:$('#clear'),
    tbody:$('#tbody'), empty:$('#empty'), count:$('#count'), mTotal:$('#mTotal'), mActive:$('#mActive'), mDone:$('#mDone'), mExpired:$('#mExpired'), mRevoked:$('#mRevoked'), mRate:$('#mRate'),
    modal:$('#modal'), modalTitle:$('#modalTitle'), modalSub:$('#modalSub'), modalBody:$('#modalBody'), closeModal:$('#closeModal')
  };

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const norm = v => String(v || '').trim().toLowerCase();

  function fmtDate(v){ if(!v) return '—'; const d=new Date(v); return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d); }
  function fmtHours(v){ const h=Number(v); if(!Number.isFinite(h)) return '—'; if(h<=0) return 'Encerrado'; const m=Math.max(0,Math.round(h*60)); return `${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}min`; }
  function isDone(s){ return !!s.concluido || norm(s.status).includes('concl'); }
  function isExpired(s){ if(isDone(s)) return false; if(norm(s.status).includes('expir')) return true; const h=Number(s.horas_restantes); return Number.isFinite(h)&&h<=0; }
  function isRevoked(s){ return norm(s.status).includes('revog'); }
  function isActive(s){ if(isDone(s)||isExpired(s)||isRevoked(s)) return false; const x=norm(s.status); return x==='ativo'||x.includes('andamento')||x.includes('inici'); }

  function badge(s){
    if(isDone(s)) return '<span class="badge ok">Concluída</span>';
    if(isExpired(s)) return '<span class="badge bad">Expirada</span>';
    if(isRevoked(s)) return '<span class="badge bad">Revogada</span>';
    if(isActive(s)) return '<span class="badge blue">Em andamento</span>';
    return `<span class="badge">${esc(s.status||'—')}</span>`;
  }

  async function api(path){
    const r=await fetch(`${API_BASE}${path}`,{cache:'no-store',headers:{Accept:'application/json','X-Admin-Secret':state.secret}});
    let data={}; try{data=await r.json()}catch{}
    if(!r.ok){ const e=new Error(data?.detail||data?.message||`HTTP ${r.status}`); e.status=r.status; throw e; }
    return data;
  }

  function metrics(){
    const all=state.sessions,total=all.length,done=all.filter(isDone).length,expired=all.filter(isExpired).length,revoked=all.filter(isRevoked).length,active=all.filter(isActive).length;
    ui.mTotal.textContent=total; ui.mDone.textContent=done; ui.mExpired.textContent=expired; ui.mRevoked.textContent=revoked; ui.mActive.textContent=active; ui.mRate.textContent=total?`${Math.round(done/total*100)}%`:'0%';
  }

  function filterRows(){
    const q=norm(ui.q.value), st=ui.status.value, dl=ui.deadline.value;
    state.filtered=state.sessions.filter(s=>{
      if(q && !norm(s.id).includes(q) && !norm(s.email).includes(q)) return false;
      if(st==='active'&&!isActive(s)) return false;
      if(st==='done'&&!isDone(s)) return false;
      if(st==='expired'&&!isExpired(s)) return false;
      if(st==='revoked'&&!isRevoked(s)) return false;
      if(dl!==''){ const h=Number(s.horas_restantes); if(!Number.isFinite(h)) return false; if(dl==='0'&&h>0) return false; if(dl!=='0'&&h>Number(dl)) return false; }
      return true;
    });
  }

  function render(){
    metrics(); filterRows(); ui.count.textContent=`${state.filtered.length} registro${state.filtered.length===1?'':'s'}`;
    if(!state.filtered.length){ ui.tbody.innerHTML=''; ui.empty.classList.remove('hidden'); return; }
    ui.empty.classList.add('hidden');
    ui.tbody.innerHTML=state.filtered.map(s=>`<tr data-id="${esc(s.id||'')}"><td class="mono">${esc(s.id||'—')}</td><td>${esc(s.email||'—')}</td><td>${badge(s)}</td><td>${esc(s.bloco_atual??'—')}</td><td>${esc(s.pergunta_atual??'—')}</td><td>${esc(fmtHours(s.horas_restantes))}</td><td>${esc(fmtDate(s.ultimo_acesso))}</td><td>${esc(fmtDate(s.criado_em))}</td></tr>`).join('');
    ui.tbody.querySelectorAll('tr[data-id]').forEach(tr=>tr.addEventListener('click',()=>openDetail(tr.dataset.id)));
  }

  async function login(){
    const secret=ui.secret.value.trim(); if(!secret){ ui.loginStatus.textContent='Informe a chave administrativa.'; ui.loginStatus.className='status err'; return; }
    state.secret=secret; ui.enter.disabled=true; ui.loginStatus.textContent='Validando acesso...';
    try{ const d=await api('/session/admin'); state.sessions=Array.isArray(d?.sessoes)?d.sessoes:[]; sessionStorage.setItem('ICL_ADMIN_SECRET_SESSION',secret); ui.login.classList.add('hidden'); ui.dash.classList.remove('hidden'); ui.loginStatus.textContent=''; render(); startTimer(); }
    catch(e){ state.secret=''; ui.loginStatus.textContent=e.status===403?'Chave administrativa inválida.':`Falha ao conectar: ${e.message}`; ui.loginStatus.className='status err'; }
    finally{ ui.enter.disabled=false; }
  }

  function logout(){ clearInterval(state.timer); state.timer=null; state.secret=''; state.sessions=[]; sessionStorage.removeItem('ICL_ADMIN_SECRET_SESSION'); ui.secret.value=''; ui.dash.classList.add('hidden'); ui.login.classList.remove('hidden'); ui.loginStatus.textContent='Sessão administrativa encerrada.'; ui.loginStatus.className='status'; }

  async function refresh(silent=false){
    if(state.loading||!state.secret) return; state.loading=true; ui.refresh.disabled=true; if(!silent) ui.live.textContent='Atualizando...';
    try{ const d=await api('/session/admin'); state.sessions=Array.isArray(d?.sessoes)?d.sessoes:[]; render(); ui.live.textContent=`Atualizado ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`; }
    catch(e){ ui.live.textContent=e.status===403?'Acesso negado':'Falha de conexão'; if(e.status===403) logout(); }
    finally{ state.loading=false; ui.refresh.disabled=false; }
  }

  async function openDetail(id){
    if(!id) return; ui.modalTitle.textContent=id; const local=state.sessions.find(s=>s.id===id); ui.modalSub.textContent=local?.email||''; ui.modalBody.innerHTML='<div class="empty">Carregando...</div>'; ui.modal.showModal();
    try{ const s=await api(`/session/status/${encodeURIComponent(id)}`); const fields=[['Status',s.status||'—'],['Concluída',s.concluido?'Sim':'Não'],['Bloco atual',s.bloco_atual??'—'],['Pergunta atual',s.pergunta_atual??'—'],['Horas totais',s.horas_totais??'—'],['Horas usadas',s.horas_usadas??'—'],['Tempo restante',fmtHours(s.horas_restantes)],['Criada em',fmtDate(s.criado_em)],['Último acesso',fmtDate(s.ultimo_acesso)],['Expira em',fmtDate(s.expira_em)],['E-mail',s.email||'—'],['Dispositivo',s.dispositivo_hash||'—']]; ui.modalBody.innerHTML=`<div class="grid">${fields.map(([k,v])=>`<div class="detail"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div><p class="sub" style="margin-top:14px">Consulta administrativa sem respostas ou conteúdo emocional.</p>`; }
    catch(e){ ui.modalBody.innerHTML=`<div class="status err">Falha ao carregar detalhes: ${esc(e.message)}</div>`; }
  }

  function startTimer(){ clearInterval(state.timer); state.timer=setInterval(()=>refresh(true),AUTO_REFRESH_MS); }
  function clearFilters(){ ui.q.value=''; ui.status.value=''; ui.deadline.value=''; render(); }

  ui.enter.addEventListener('click',login); ui.secret.addEventListener('keydown',e=>{if(e.key==='Enter')login()}); ui.refresh.addEventListener('click',()=>refresh(false)); ui.logout.addEventListener('click',logout); ui.clear.addEventListener('click',clearFilters); ui.q.addEventListener('input',render); ui.status.addEventListener('change',render); ui.deadline.addEventListener('change',render); ui.closeModal.addEventListener('click',()=>ui.modal.close()); ui.modal.addEventListener('click',e=>{if(e.target===ui.modal)ui.modal.close()});

  const saved=sessionStorage.getItem('ICL_ADMIN_SECRET_SESSION'); if(saved){ state.secret=saved; ui.secret.value=saved; api('/session/admin').then(d=>{state.sessions=Array.isArray(d?.sessoes)?d.sessoes:[];ui.login.classList.add('hidden');ui.dash.classList.remove('hidden');render();startTimer()}).catch(()=>{state.secret='';sessionStorage.removeItem('ICL_ADMIN_SECRET_SESSION')}); }

  console.log('[ICL ADMIN] Painel carregado:',API_BASE);
})();
