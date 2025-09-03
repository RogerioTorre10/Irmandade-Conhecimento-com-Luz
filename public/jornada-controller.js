/* =============================================================================
  TÍTULO: JORNADA CONTROLLER (v1.2)
  SUBTÍTULO: Fluxo pergunta-a-pergunta por bloco + vídeo de transição + coleta leve
  CAMINHO: /public/jornada-controller.js
  COMPATIBILIDADE: independe de frameworks; usa apenas DOM nativo
============================================================================= */
(function () {
  'use strict';

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
    btnPrev: () => document.getElementById('btnPrev'),
    btnNext: () => document.getElementById('btnNext'),
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

  /* ===========================================================================
     TÍTULO: RENDERIZAÇÃO
     SUBTÍTULO: Exibe apenas 1 pergunta do bloco atual
  =========================================================================== */
  function render() {
    const root = S.root();
    if (!root) return;
    const blocos = S.blocos();
    if (!blocos.length) return;

    // Esconde todos os blocos
    blocos.forEach(U.hide);
    // Mostra bloco atual
    const bloco = S.blocoAtivo();
    U.show(bloco);

    // Esconde todas as perguntas deste bloco
    const perguntas = S.perguntasDo(bloco);
    perguntas.forEach(U.hide);
    // Mantém índice válido
    state.perguntaIndex = U.clamp(state.perguntaIndex, 0, Math.max(0, perguntas.length - 1));

    // Mostra a pergunta atual
    const atual = perguntas[state.perguntaIndex];
    U.show(atual);

    // ATIVA OS EFEITOS
    if (window.JORNADA_TYPE && typeof window.JORNADA_TYPE.run === 'function') {
      window.JORNADA_TYPE.run(atual);
    }
    if (window.JORNADA_PAPER && typeof window.JORNADA_PAPER.set === 'function') {
      window.JORNADA_PAPER.set(bloco.getAttribute('data-pergaminho') || 'v');
    }
   
    // Progresso local do bloco
    U.setProgress(state.perguntaIndex + 1, perguntas.length);

    // Botões
    const prev = S.btnPrev();
    const next = S.btnNext();
    if (prev) prev.disabled = (state.blocoIndex === 0 && state.perguntaIndex === 0);

    if (next) {
      const ultimaPergunta = state.perguntaIndex === perguntas.length - 1;
      const ultimoBloco = state.blocoIndex === blocos.length - 1;
      next.textContent = ultimaPergunta ? (ultimoBloco ? 'Finalizar' : 'Concluir bloco ➜') : 'Próxima';
    }
    // Foco amigável no campo da pergunta
    const input = U.getAnswerEl(atual);
    if (input) try { input.focus({ preventScroll: true }); } catch {}
  }
    <div class="pergaminho-frame v">
  <img src="/assets/img/pergaminho-rasgado-vert.png" alt="Pergaminho" class="pergaminho-img" aria-hidden="true">

  <div class="pergaminho-layer">
    <!-- chama média na intro -->
    <div class="chama chama-md">
      <span></span><span></span><span></span>
    </div>

    <section id="intro" class="intro-bloco">
      <h1>Bem-vindo(a) à Jornada Essencial</h1>
      <p id="intro-typing"
         data-text="Bem-vindo(a) à nossa casa de reflexão e coragem. Aqui, fé e consciência se unem para acender sua chama interior — passo a passo, jornada por jornada.">
      </p>

      <!-- Termo (se tiver) -->
      <div class="termo">
        <h2>Termo de Responsabilidade e Consentimento</h2>
        <p>Ao iniciar, você concorda em participar de forma consciente…</p>
      </div>
    </section>
  </div>
</div>

 /* ===========================================================================
    TÍTULO: NAVEGAÇÃO
    SUBTÍTULO: Próxima / Anterior (com salvamento)
  =========================================================================== */
function goNext() {
    const bloco = S.blocoAtivo();
    const perguntas = S.perguntasDo(bloco);

    // Analisa e ajusta a chama antes de salvar
    const qEl = perguntas[state.perguntaIndex];
    const input = U.getAnswerEl(qEl);
    if (input && window.JORNADA_CHAMA && typeof window.JORNADA_CHAMA.ajustar === 'function') {
      const sentimento = U.analiseSentimento(U.getVal(input));
      window.JORNADA_CHAMA.ajustar(sentimento);
    }

    // salva a atual
    saveCurrentAnswer();
    
    // ainda há perguntas neste bloco
    if (state.perguntaIndex < perguntas.length - 1) {
      state.perguntaIndex++;
      render();
      return;
    }
    // terminou perguntas deste bloco → vídeo de transição (se houver)
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
    // volta pergunta
    if (state.perguntaIndex > 0) {
      state.perguntaIndex--;
      render();
      return;
    }
    // volta bloco anterior (última pergunta)
    if (state.blocoIndex > 0) {
      state.blocoIndex--;
      const perguntas = S.perguntasDo(S.blocoAtivo());
      state.perguntaIndex = Math.max(0, perguntas.length - 1);
      render();
    }
  }

  /* ===========================================================================
     TÍTULO: VÍDEO DE TRANSIÇÃO
     SUBTÍTULO: Overlay com skip e fallbacks defensivos
  =========================================================================== */
  function playTransition(src, onEnd) {
    const overlay = S.overlay();
    const video = S.video();
    const skip = S.skip();
    // Sem overlay ou sem vídeo → segue
    if (!overlay || !video || !src) {
      onEnd && onEnd();
      return;
    }
    // Preparar player
    try {
      video.pause();
      video.removeAttribute('src'); video.load();
    } catch {}
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

    // tentativa de autoplay mudo
    try {
      video.muted = true;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    } catch {}
  }

  /* ===========================================================================
     TÍTULO: FINALIZAÇÃO
     SUBTÍTULO: Gatilho de conclusão (envio/alerta/resumo)
  =========================================================================== */
  function finalize() {
    // salva última resposta
    saveCurrentAnswer();
    console.log('[JORNADA] Finalizado. Respostas:', state.respostas);
    alert('Jornada concluída! Gratidão pela confiança.');
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }

  /* ===========================================================================
     TÍTULO: INICIALIZAÇÃO
     SUBTÍTULO: Liga eventos e faz o primeiro render
  =========================================================================== */
  JC.init = function initJornada() {
    const root = S.root();
    if (!root) return;
    const prevBtn = S.btnPrev();
    const nextBtn = S.btnNext();
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    // tenta restaurar respostas antigas (opcional)
    try {
      const stash = localStorage.getItem('JORNADA_RESPOSTAS');
      if (stash) state.respostas = JSON.parse(stash) || state.respostas;
    } catch {}
    // O render inicial
    render();
  };

  // Auto-init se o canvas existir
  document.addEventListener('DOMContentLoaded', () => {
    if (S.root()) JC.init();
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
