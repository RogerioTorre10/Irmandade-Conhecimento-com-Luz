/* =============================================================================
  TÍTULO: JORNADA CONTROLLER (v1.2)
  SUBTÍTULO: Fluxo pergunta-a-pergunta por bloco + vídeo de transição + coleta leve
  CAMINHO: /public/jornada-controller.js
  COMPATIBILIDADE: independe de frameworks; usa apenas DOM nativo
============================================================================= */
(function () {
  'use strict';

  // [debug] carregou o arquivo
  console.log("[load] jornada-controller.js iniciado");

  /* ============================================================
     TÍTULO: NAMESPACE
     SUBTÍTULO: Expõe uma API pequena no window para depuração
  ============================================================ */
  const JC = (window.JC = window.JC || {});


  /* ===========================================================================
     TÍTULO: NAMESPACE
     SUBTÍTULO: Expõe uma API pequena no window para depuração
  =========================================================================== */
  const JC = (window.JC = window.JC || {});

  /* ===========================================================================
     TÍTULO: ESTADO
     SUBTÍTULO: Índices atuais de bloco/pergunta e armazenamento simples
  =========================================================================== */
  const state = {
    blocoIndex: 0,
    perguntaIndex: 0,
    respostas: Object.create(null), // { 'b0-q0': 'texto' }
  };

  /* ===========================================================================
     TÍTULO: SELETORES
     SUBTÍTULO: Ganchos de DOM usados pelo controller
  =========================================================================== */
  const S = {
    root: () => document.getElementById('jornada-canvas'),
    blocos: () => Array.from(document.querySelectorAll('.j-bloco,[data-bloco]')),
    blocoAtivo: () => S.blocos()[state.blocoIndex],
    perguntasDo: (blocoEl) => Array.from(blocoEl.querySelectorAll('.j-pergunta,[data-pergunta]')),
    btnPrev: () => document.getElementById('btnPrev') || document.querySelector('[data-action="prev"]'),
    btnNext: () => document.getElementById('btnNext') || document.querySelector('[data-action="next"]'),
    meta: () => document.getElementById('j-meta'),
    progressFill: () => document.querySelector('.j-progress__fill'),
    // Overlay de vídeo
    overlay: () => document.getElementById('videoOverlay'),
    video: () => document.getElementById('videoTransicao'),
    skip: () => document.getElementById('skipVideo'),
  };

  /* ===========================================================================
     TÍTULO: UTILIDADES
     SUBTÍTULO: Helpers para DOM, progresso e chaves
  =========================================================================== */
  const U = {
    show(el, disp = 'block') { if (el) el.style.display = disp; },
    hide(el) { if (el) el.style.display = 'none'; },
    clamp(n, a, b) { return Math.max(a, Math.min(b, n)); },
    key(b, q) { return `b${b}-q${q}`; },
    getAnswerEl(qEl) {
      return qEl?.querySelector?.('textarea, input[type="text"], input[type="email"], input[type="number"], input[type="search"]') || null;
    },
    getVal(el) { return (el && (el.value ?? '')).trim(); },
    setProgress(cur, total) {
      const pct = total ? Math.round((cur / total) * 100) : 0;
      const bar = S.progressFill();
      const meta = S.meta();
      if (bar) bar.style.width = pct + '%';
      if (meta) meta.innerHTML = `<b>${cur}</b> / ${total} (${pct}%)`;
    },
    analiseSentimento: (texto) => {
      const textoNormalizado = texto.toLowerCase();
      const palavrasTristes = ["dor", "perda", "sofrimento", "tristeza", "medo", "desafio"];
      const palavrasAlegres = ["alegria", "superação", "esperança", "coragem", "gratidão", "amor"];
      for (const palavra of palavrasTristes) {
        if (textoNormalizado.includes(palavra)) return "sofrida";
      }
      for (const palavra of palavrasAlegres) {
        if (textoNormalizado.includes(palavra)) return "alegre";
      }
      return "neutra";
    }
  };

  /* ===========================================================================
     TÍTULO: PERSISTÊNCIA LEVE
     SUBTÍTULO: Salva/recupera respostas em memória e/ou localStorage
  =========================================================================== */
  function saveCurrentAnswer() {
    const bloco = S.blocoAtivo();
    if (!bloco) return;
    const perguntas = S.perguntasDo(bloco);
    const qEl = perguntas[state.perguntaIndex];
    if (!qEl) return;
    const input = U.getAnswerEl(qEl);
    if (input) {
      const k = U.key(state.blocoIndex, state.perguntaIndex);
      state.respostas[k] = U.getVal(input);
      try { localStorage.setItem('JORNADA_RESPOSTAS', JSON.stringify(state.respostas)); } catch {}
    }
  }

 /* =============================================================================
   TÍTULO: RENDERIZAÇÃO
   SUBTÍTULO: Exibe apenas 1 pergunta do bloco atual
============================================================================= */

// ===== [03-PERGAMINHO] helpers =====
function applyPergaminhoByRoute() {
  if (!window.JORNADA_PAPER || typeof window.JORNADA_PAPER.set !== 'function') return;
  const route = (location.hash || '#intro').slice(1);
  if (route === 'intro' || route === 'final') {
    window.JORNADA_PAPER.set('v'); // intro/final sempre vertical
  }
}
function applyPergaminhoByBloco(blocoEl) {
  if (!window.JORNADA_PAPER || typeof window.JORNADA_PAPER.set !== 'function') return;
  if (!blocoEl) return;
  let modo = 'v';
  if (blocoEl.hasAttribute('data-pergaminho-h')) modo = 'h';
  else if (blocoEl.hasAttribute('data-pergaminho-v')) modo = 'v';
  else modo = blocoEl.getAttribute('data-pergaminho') || 'h'; // padrão perguntas = H
  window.JORNADA_PAPER.set(modo);
}

function render() {
  const root = S.root();
  if (!root) return;
  
  window.JORNADA_ENTRAR_BLOCO = (i, qtdPerguntas) => {
    
  // controla a intro: mostra só se a rota for #intro
  const isIntroRoute = (location.hash || '#intro').slice(1) === 'intro';
  document.querySelectorAll('[data-intro]').forEach(el => {
    el.style.display = isIntroRoute ? '' : 'none';
  });    

  // mostra o canvas principal
  U.show(root, 'block');

  const blocos = S.blocos();
  if (!blocos.length) return;

  // esconde tudo e mostra o bloco atual
  blocos.forEach(U.hide);
  const bloco = S.blocoAtivo();
  U.show(bloco);

  // esconde perguntas do bloco e mostra só a atual
  const perguntas = S.perguntasDo(bloco);
  perguntas.forEach(U.hide);
  state.perguntaIndex = U.clamp(state.perguntaIndex, 0, Math.max(0, perguntas.length - 1));
  const atual = perguntas[state.perguntaIndex];
  U.show(atual);

  // garante caixa de resposta visível e com foco
  const input = U.getAnswerEl(atual);
  if (input) {
    input.removeAttribute?.('hidden');
    input.style.display = 'block';
    input.style.visibility = 'visible';
    try { input.focus({ preventScroll: true }); } catch {}
  }

  // efeitos e pergaminho (H/V) por bloco
  if (window.JORNADA_TYPE && typeof window.JORNADA_TYPE.run === 'function') {
    window.JORNADA_TYPE.run(atual);
  }
  applyPergaminhoByBloco(bloco);

  // progresso local
  U.setProgress(state.perguntaIndex + 1, perguntas.length);

  // botões
  const prev = S.btnPrev();
  const next = S.btnNext();
  if (prev) prev.disabled = (state.blocoIndex === 0 && state.perguntaIndex === 0);

  if (next) {
    const ultimaPergunta = state.perguntaIndex === perguntas.length - 1;
    const ultimoBloco = state.blocoIndex === blocos.length - 1;
    next.textContent = ultimaPergunta ? (ultimoBloco ? 'Finalizar' : 'Concluir bloco ➜') : 'Próxima';
  }
}

// ===== NAVEGAÇÃO =====
function saveCurrentAnswer() {
  const bloco = S.blocoAtivo();
  if (!bloco) return;
  const perguntas = S.perguntasDo(bloco);
  const qEl = perguntas[state.perguntaIndex];
  if (!qEl) return;
  const input = U.getAnswerEl(qEl);
  if (input) {
    const k = U.key(state.blocoIndex, state.perguntaIndex);
    state.respostas[k] = U.getVal(input);
    try { localStorage.setItem('JORNADA_RESPOSTAS', JSON.stringify(state.respostas)); } catch {}
  }
}

function goNext() {
  const bloco = S.blocoAtivo();
  const perguntas = S.perguntasDo(bloco);

  // salva
  saveCurrentAnswer();

  // próxima pergunta
  if (state.perguntaIndex < perguntas.length - 1) {
    state.perguntaIndex++;
    render();
    return;
  }

  // vídeo de transição e próximo bloco
  const videoSrc = bloco.getAttribute('data-video') || '';
  const haProximoBloco = state.blocoIndex < S.blocos().length - 1;

  if (haProximoBloco) {
    playTransition(videoSrc, () => {
      state.blocoIndex++;
      state.perguntaIndex = 0;
      render();
    });
  } else {
    finalize();
  }
}

function goPrev() {
  if (state.perguntaIndex > 0) {
    state.perguntaIndex--;
    render();
    return;
  }
  if (state.blocoIndex > 0) {
    state.blocoIndex--;
    const perguntas = S.perguntasDo(S.blocoAtivo());
    state.perguntaIndex = Math.max(0, perguntas.length - 1);
    render();
  }
}

// ===== VÍDEO DE TRANSIÇÃO =====
function playTransition(src, onEnd) {
  const overlay = S.overlay();
  const video = S.video();
  const skip = S.skip();
  if (!overlay || !video || !src) { onEnd && onEnd(); return; }

  try { video.pause(); video.removeAttribute('src'); video.load(); } catch {}
  video.src = src;
  overlay.classList.remove('hidden');

  const cleanup = () => {
    try { video.pause(); } catch {}
    overlay.classList.add('hidden');
    try { video.removeAttribute('src'); video.load(); } catch {}
    onEnd && onEnd();
  };

  video.onended = cleanup;
  video.onerror = cleanup;
  if (skip) skip.onclick = cleanup;

  try {
    video.muted = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  } catch {}
}

// ===== FINALIZAÇÃO =====
function finalize() {
  saveCurrentAnswer();
  console.log('[JORNADA] Finalizado. Respostas:', state.respostas);
  alert('Jornada concluída! Gratidão pela confiança.');
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
}

// ===== INIT =====
JC.init = function initJornada () {
  // evita múltiplas inits
  if (JC._inited) return;
  JC._inited = true;

  const root = S.root();
  if (!root) return;

  // rota intro/final = vertical; demais = horizontal
  applyPergaminhoByRoute();

  // === delegação global para next/prev ===
  document.addEventListener('click', (ev) => {
    const n = ev.target.closest?.('[data-action="next"]');
    const p = ev.target.closest?.('[data-action="prev"]');
    if (n) { ev.preventDefault(); goNext(); }
    if (p) { ev.preventDefault(); goPrev(); }
  });

  // restaura stash (opcional)
  try {
    const stash = localStorage.getItem('JORNADA_RESPOSTAS');
    if (stash) state.respostas = JSON.parse(stash) || state.respostas;
  } catch {}

  render();
};

// auto-init
document.addEventListener('DOMContentLoaded', () => {
  if (S.root()) JC.init();
  // atualiza pergaminho ao mudar hash (#intro/#perguntas/#final)
  window.addEventListener('hashchange', applyPergaminhoByRoute);
});
 
   /* ===========================================================================
     TÍTULO: API PÚBLICA (OPCIONAL)
     SUBTÍTULO: Métodos acessíveis via window.JC
    =========================================================================== */
   JC._state = state;
   JC.next = goNext;
   JC.prev = goPrev;
   JC.render = render;
   })();
