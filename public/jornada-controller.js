(function () {
  'use strict';

  const JC = (window.JC = window.JC || {});
  const state = {
    blocoIndex: 0,
    perguntaIndex: 0,
    respostas: Object.create(null),
  };

  const S = {
    root: () => document.getElementById('jornada-canvas'),
    blocos: () => Array.from(document.querySelectorAll('.j-bloco,[data-bloco]')),
    blocoAtivo: () => S.blocos()[state.blocoIndex],
    perguntasDo: (blocoEl) => Array.from(blocoEl.querySelectorAll('.j-pergunta,[data-pergunta]')),
    btnPrev: () => document.getElementById('btnPrevPerguntas') || document.querySelector('[data-action="prev"]'),
    btnNext: () => document.getElementById('btnNextPerguntas') || document.querySelector('[data-action="next"]'),
    btnStart: () => document.getElementById('btnIniciar') || document.querySelector('[data-action="start"]'),
    meta: () => document.getElementById('j-meta'),
    progressFill: () => document.querySelector('.j-progress__fill'),
    overlay: () => document.getElementById('videoOverlay'),
    video: () => document.getElementById('videoTransicao'),
    skip: () => document.getElementById('skipVideo'),
  };

  const U = {
    show(el, disp = 'block') { if (el) el.style.display = disp; },
    hide(el) { if (el) el.style.display = 'none'; },
    clamp(n, a, b) { return Math.max(a, Math.min(b, n)); },
    key(b, q) { return `b${b}-q${q}`; },
    getAnswerEl(qEl) { return qEl?.querySelector?.('textarea, input[type="text"], input[type="email"], input[type="number"], input[type="search"]') || null; },
    getVal(el) { return (el && (el.value ?? '')).trim(); },
    setProgress(cur, total) {
      const pct = total ? Math.round((cur / total) * 100) : 0;
      const bar = S.progressFill();
      const meta = S.meta();
      if (bar) bar.style.width = pct + '%';
      if (meta) meta.innerHTML = `<b>${cur}</b> / ${total} (${pct}%)`;
    },
    analiseSentiment(texto) {
      const textoNormalizado = texto.toLowerCase().split(/\s+/);
      let posCount = 0, negCount = 0;
      textoNormalizado.forEach(word => {
        if (window.JORNADA_CFG.positiveWords.includes(word)) posCount++;
        if (window.JORNADA_CFG.negativeWords.includes(word)) negCount++;
      });
      return posCount > negCount ? "alegre" : (negCount > posCount ? "sofrida" : "neutra");
    }
  };

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

  function applyPergaminhoByRoute() {
    if (!window.JORNADA_PAPER || typeof window.JORNADA_PAPER.set !== 'function') {
      console.warn('JORNADA_PAPER não disponível para aplicar pergaminho por rota');
      return;
    }
    const route = (location.hash || '#intro').slice(1);
    console.log('[JORNADA_CONTROLLER] Aplicando pergaminho por rota:', route);
    if (route === 'intro' || route === 'final') {
      window.JORNADA_PAPER.set('v');
    } else {
      window.JORNADA_PAPER.set('h');
    }
  }

  function applyPergaminhoByBloco(blocoEl) {
    if (!window.JORNADA_PAPER || typeof window.JORNADA_PAPER.set !== 'function') {
      console.warn('JORNADA_PAPER não disponível para aplicar pergaminho por bloco');
      return;
    }
    if (!blocoEl) {
      console.warn('Bloco não encontrado para aplicar pergaminho');
      return;
    }
    let modo = 'h';
    if (blocoEl.hasAttribute('data-pergaminho-h')) modo = 'h';
    else if (blocoEl.hasAttribute('data-pergaminho-v')) modo = 'v';
    else modo = blocoEl.getAttribute('data-pergaminho') || 'h';
    console.log('[JORNADA_CONTROLLER] Aplicando pergaminho para bloco:', modo, blocoEl);
    window.JORNADA_PAPER.set(modo);
  }

  function render() {
    const root = S.root();
    if (!root) {
      console.warn('Root #jornada-canvas não encontrado');
      return;
    }
    U.show(root, 'block');
    const blocos = S.blocos();
    if (!blocos.length) {
      console.warn('Nenhum bloco encontrado');
      return;
    }
    blocos.forEach(U.hide);
    const bloco = S.blocoAtivo();
    U.show(bloco);
    const perguntas = S.perguntasDo(bloco);
    perguntas.forEach(U.hide);
    state.perguntaIndex = U.clamp(state.perguntaIndex, 0, Math.max(0, perguntas.length - 1));
    const atual = perguntas[state.perguntaIndex];
    U.show(atual);
    const input = U.getAnswerEl(atual);
    if (input) {
      input.removeAttribute?.('hidden');
      input.style.display = 'block';
      input.style.visibility = 'visible';
      try { input.focus({ preventScroll: true }); } catch {}
    }
    if (window.JORNADA_TYPE && typeof window.JORNADA_TYPE.run === 'function') {
      window.JORNADA_TYPE.run(atual);
    }
    applyPergaminhoByBloco(bloco);
    U.setProgress(state.perguntaIndex + 1, perguntas.length);
    const prev = S.btnPrev();
    const next = S.btnNext();
    if (prev) prev.disabled = (state.blocoIndex === 0 && state.perguntaIndex === 0);
    if (next) {
      const ultimaPergunta = state.perguntaIndex === perguntas.length - 1;
      const ultimoBloco = state.blocoIndex === blocos.length - 1;
      next.textContent = ultimaPergunta ? (ultimoBloco ? 'Finalizar' : 'Concluir bloco ➜') : 'Próxima';
    }
  }

  function goNext() {
    const bloco = S.blocoAtivo();
    const perguntas = S.perguntasDo(bloco);
    saveCurrentAnswer();
    if (state.perguntaIndex < perguntas.length - 1) {
      state.perguntaIndex++;
      render();
      return;
    }
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

  function startJourney() {
    console.log('Iniciando jornada...');
    if (window.JORNADA_BLOCKS && window.JORNADA_QA && window.JORNADA_PAPER) {
      showSection('section-perguntas');
      loadDynamicBlocks();
    } else {
      console.error('Dependências não carregadas para iniciar!');
    }
  }

  function playTransition(src, onEnd) {
    const overlay = S.overlay();
    const video = S.video();
    const skip = S.skip();
    if (!overlay || !video || !src) {
      console.warn('Overlay, vídeo ou src não disponível:', { overlay, video, src });
      onEnd && onEnd();
      return;
    }
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

  function finalize() {
    saveCurrentAnswer();
    console.log('[JORNADA] Finalizado. Respostas:', state.respostas);
    window.JORNADA_DOWNLOAD(state.respostas).then(() => {
      alert('Jornada concluída! Arquivos gerados.');
      location.replace('/index.html');
    }).catch(() => alert('Erro ao gerar arquivos.'));
  }

  JC.init = function initJornada() {
    const root = S.root();
    if (!root) {
      console.warn('Root #jornada-canvas não encontrado para inicialização');
      return;
    }
    applyPergaminhoByRoute();
    const startBtn = S.btnStart();
    if (startBtn) {
      startBtn.addEventListener('click', startJourney);
      console.log('Botão Iniciar inicializado em JC.init');
    }
    const prevBtn = S.btnPrev();
    const nextBtn = S.btnNext();
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    document.addEventListener('click', (ev) => {
      const n = ev.target.closest?.('[data-action="next"]');
      const p = ev.target.closest?.('[data-action="prev"]');
      const s = ev.target.closest?.('[data-action="start"]');
      if (n) { ev.preventDefault(); goNext(); }
      if (p) { ev.preventDefault(); goPrev(); }
      if (s) { ev.preventDefault(); startJourney(); }
    });
    try {
      const stash = localStorage.getItem('JORNADA_RESPOSTAS');
      if (stash) state.respostas = JSON.parse(stash) || state.respostas;
    } catch {}
    render();
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (S.root()) JC.init();
    window.addEventListener('load', () => {
      if (!window.JC._initialized) {
        console.log('Forçando inicialização no load...');
        JC.init();
        window.JC._initialized = true;
      }
    });
    window.addEventListener('hashchange', applyPergaminhoByRoute);
  });

  JC._state = state;
  JC.next = goNext;
  JC.prev = goPrev;
  JC.render = render;
  JC.start = startJourney;

  // Funções expostas globalmente para depuração
  window.showSection = showSection;
  window.loadDynamicBlocks = loadDynamicBlocks;
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
