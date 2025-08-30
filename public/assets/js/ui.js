// ui.js — unificado (ESM + compat window.UI)
// Mantém API legada: qs, qsa, showSection, setProgress, setPergunta
// Adiciona: toast, fadeOutIn, mountGlobalHandlers

// ===== Seletores =====
function qs(sel, root = document)  { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// ===== Helpers visuais =====
function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); t.remove(); }, 3000);
}

function fadeOutIn(fn){
  const root = document.querySelector('#app') || document.body;
  root.classList.add('fade-out');
  setTimeout(() => {
    try { fn && fn(); }
    finally { root.classList.remove('fade-out'); }
  }, 220);
}

function mountGlobalHandlers(){
  // Evita duplo clique em botões críticos
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-once]')) {
      if (e.target.dataset._locked) { e.preventDefault(); return; }
      e.target.dataset._locked = '1';
    }
  });
}

// ===== Views e progresso =====
// Mostra uma section e esconde as outras
// Aceita ID ("intro") ou seletor ("#intro" / "[data-view='intro']")
function showSection(idOrSelector) {
  const views = qsa('section.card');
  const target = idOrSelector?.startsWith('#') || idOrSelector?.startsWith('[')
    ? idOrSelector
    : `#${idOrSelector}`;
  views.forEach(sec => {
    if (sec.matches(target)) sec.classList.remove('hidden');
    else sec.classList.add('hidden');
  });
}

function setProgress(percent) {
  const bar = qs('#progressBar');
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function setPergunta(index, total, perguntas) {
  const titulo   = qs('#perguntaTitulo');
  const etapaNum = qs('#etapaNum');
  const etapaTot = qs('#etapaTot');

  if (etapaTot) etapaTot.textContent = String(total || (perguntas?.length || 0));
  if (etapaNum) etapaNum.textContent = String((index ?? 0) + 1);

  if (titulo) {
    if (Array.isArray(perguntas)) {
      const item  = perguntas[index] ?? '';
      const texto = typeof item === 'string' ? item : (item?.titulo || item?.texto || '');
      titulo.textContent = texto || 'Pergunta';
    } else {
      titulo.textContent = 'Pergunta';
    }
  }
}

// ===== Export ESM + compat global =====
export const UI = { qs, qsa, showSection, setProgress, setPergunta, toast, fadeOutIn, mountGlobalHandlers };
if (typeof window !== 'undefined') window.UI = UI;

// /public/js/ui.js
(function (ns) {
  // ... seu código atual (showSection, setProgress, etc.)

  // Exponha o que outros módulos precisam:
  ns.showSection  = typeof showSection  === 'function' ? showSection  : ns.showSection;
  ns.setProgress  = typeof setProgress  === 'function' ? setProgress  : ns.setProgress;
  ns.qs           = (sel, root=document) => root.querySelector(sel);
  ns.qsa          = (sel, root=document) => Array.from(root.querySelectorAll(sel));
})(window.JORNADA = window.JORNADA || {});

