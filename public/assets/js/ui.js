// ui.js — unificado (ESM + compat window.UI)
// Mantém API legada: qs, qsa, showSection, setProgress, setPergunta
// Adiciona: toast, fadeOutIn, mountGlobalHandlers

// ===== Seletores =====
function qs(sel, root = document)  { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// ===== Helpers visuais =====
function ensureToastHost() {
  // Se já existe um #toast no DOM, usamos ele.
  let host = document.getElementById('toast');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast';
    host.style.cssText = [
      'position:fixed','left:50%','bottom:16px','transform:translateX(-50%)',
      'max-width:70ch','padding:10px 14px','border-radius:10px',
      'background:#111','color:#fff','box-shadow:0 6px 18px rgba(0,0,0,.35)',
      'font-size:16px','z-index:4000','opacity:0','pointer-events:none',
      'transition:opacity .25s ease','font-family:inherit'
    ].join(';');
    host.classList.add('hidden');
    document.body.appendChild(host);
  }
  return host;
}

function toast(msg){
  // Não sobrescreve window.toast se já houver uma função externa
  if (typeof window !== 'undefined' && typeof window.toast === 'function' && window.toast !== toast) {
    try { window.toast(msg); return; } catch(_) {}
  }
  const host = ensureToastHost();
  host.textContent = String(msg ?? '');
  host.classList.remove('hidden');
  requestAnimationFrame(() => host.style.opacity = '1');
  setTimeout(() => {
    host.style.opacity = '0';
    setTimeout(() => host.classList.add('hidden'), 260);
  }, 3000);
}

function fadeOutIn(fn){
  const root = document.querySelector('#app') || document.body;
  root.classList.add('fade-out');
  setTimeout(() => {
    try { fn && fn(); } finally { root.classList.remove('fade-out'); }
  }, 220);
}

let __onceHandlersMounted = false;
function mountGlobalHandlers(){
  if (__onceHandlersMounted) return;
  __onceHandlersMounted = true;

  // Evita duplo clique em botões críticos
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-once]');
    if (!btn) return;
    if (btn.dataset._locked) { e.preventDefault(); e.stopPropagation(); return; }
    btn.dataset._locked = '1';
    setTimeout(() => delete btn.dataset._locked, 1500);
  }, true);
}

// ===== Views e progresso =====
function getAllSections(){
  // Considera a marcação usada na Jornada
  return qsa('.j-section, [data-section], [data-view], .section, [class*="section-"]');
}

function resolveTargetSection(idOrSelector){
  if (!idOrSelector) return null;

  // Se passou um elemento
  if (idOrSelector instanceof Element) return idOrSelector;

  // Se passou seletor (#id ou [data-*])
  if (typeof idOrSelector === 'string' && (/^[#.\[]/.test(idOrSelector))) {
    return document.querySelector(idOrSelector);
  }

  // Se passou "intro", "termos", etc → tenta variações comuns
  const raw = String(idOrSelector);
  const tries = [
    `#${raw}`,
    `#section-${raw}`,
    `[data-section="${raw}"]`,
    `.section-${raw}`
  ];
  for (const sel of tries) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// Mostra uma section e esconde as outras
function showSection(idOrSelector) {
  // Se existir um showSection legado, delega para ele (evita conflitos)
  if (typeof window !== 'undefined'
      && window.showSection
      && window.showSection !== showSection) {
    try { return window.showSection(idOrSelector); } catch(_) {}
  }

  const sections = getAllSections();
  const target = resolveTargetSection(idOrSelector);

  if (!target) {
    toast('Seção não encontrada.');
    return;
  }

  sections.forEach(sec => {
    if (sec === target) {
      sec.classList.remove('hidden');
      sec.style.display = 'block';
    } else {
      sec.classList.add('hidden');
      sec.style.display = 'none';
    }
  });

  // Tenta aplicar datilografia caso disponível
  try {
    if (typeof window.runTyping === 'function') window.runTyping(target);
  } catch {}

  // Ajusta pergaminho se a página usar esse helper
  try {
    if (typeof window.updateCanvasBackground === 'function') {
      const id = target.id || '';
      window.updateCanvasBackground(id);
    }
  } catch {}
}

function setProgress(percent) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));

  // v1
  const bar = qs('#progressBar');
  if (bar) bar.style.width = `${p}%`;

  // v2 – barras internas
  qsa('.progress-bar-fill, .j-progress__fill').forEach(el => el.style.width = `${p}%`);

  // selo e meta, se existirem
  const badge = document.getElementById('jprog-pct');
  if (badge) badge.textContent = `${p}% concluído`;

  const meta = document.getElementById('j-meta');
  if (meta) meta.innerHTML = `<b>${p}</b>%`;
}

function setPergunta(index, total, perguntas) {
  const titulo   = qs('#perguntaTitulo');
  const etapaNum = qs('#etapaNum');
  const etapaTot = qs('#etapaTot');

  if (typeof total === 'number' && etapaTot) etapaTot.textContent = String(total);
  if (typeof index === 'number' && etapaNum) etapaNum.textContent = String(index + 1);

  if (titulo) {
    let texto = 'Pergunta';
    if (Array.isArray(perguntas)) {
      const item = perguntas[index] ?? '';
      if (typeof item === 'string') texto = item;
      else if (item && typeof item === 'object') texto = item.titulo || item.texto || item.label || 'Pergunta';
    }
    titulo.textContent = texto;
  }
}

// ===== Export ESM + compat global =====
export const UI = {
  qs, qsa, showSection, setProgress, setPergunta,
  toast, fadeOutIn, mountGlobalHandlers
};

if (typeof window !== 'undefined') {
  // expõe API sem quebrar o que já existe
  window.UI = Object.assign({}, window.UI || {}, UI);

  // garante um window.toast funcional (sem conflitar com <div id="toast">)
  if (typeof window.toast !== 'function') window.toast = toast;

  // compat antiga em window.JORNADA.*
  (function (ns) {
    ns.qs          = ns.qs  || qs;
    ns.qsa         = ns.qsa || qsa;
    ns.showSection = ns.showSection || showSection;
    ns.setProgress = ns.setProgress || setProgress;
  })(window.JORNADA = window.JORNADA || {});
}
