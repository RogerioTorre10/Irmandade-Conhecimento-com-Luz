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
  };
   // Utilitários de análise de sentimento
const analiseSentimento = (texto) => {
  const textoNormalizado = texto.toLowerCase();
  const palavrasTristes = ["dor", "perda", "sofrimento", "tristeza", "medo", "desafio"];
  const palavrasAlegres = ["alegria", "superação", "esperança", "coragem", "gratidão", "amor"];

  for (const palavra of palavrasTristes) {
    if (textoNormalizado.includes(palavra)) return "sofrida";
  }
  for (const palavra of palavrasAlegres) {
    if (textoNormalizado.includes(palavra)) return "alegre";
  }
  return "neutra"; // Para respostas que não se encaixam
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

 // ================================================================
// CONTROLE DE PROGRESSO POR BLOCOS E PERGUNTAS
// ================================================================
 window.JORNADA_ENTRAR_BLOCO = (i, qtdPerguntas) => {
  J.blocoAtual = i;
  J.perguntasNoBloco = qtdPerguntas;
  J.idxPerguntaNoBloco = 0;
// NADA DEVE SER MOSTRADO AQUI.
// Apenas atualiza as informações do bloco.
  JORNADA_UI.setProgressoBlocos(i, J.totalBlocos);
  JORNADA_UI.setProgressoPerguntas(0);
};
        // Mostra a pergunta atual
    const atual = perguntas[state.perguntaIndex];
    U.show(atual);
  // O CÓDIGO QUE ATIVA OS EFEITOS
    if (window.JORNADA_TYPE && typeof window.JORNADA_TYPE.run === 'function') {
        window.JORNADA_TYPE.run(atual);
    }    
    if (window.JORNADA_PAPER && typeof window.JORNADA_PAPER.set === 'function') {
        // Assume que você quer o pergaminho vertical
        window.JORNADA_PAPER.set('v');
    }

  // Atualiza badge de blocos (topo) e barra interna (0%)
  JORNADA_UI.setProgressoBlocos(i, J.totalBlocos);
  JORNADA_UI.setProgressoPerguntas(0);
};
window.JORNADA_AVANCAR_PERGUNTA = () => {
  if (J.idxPerguntaNoBloco < J.perguntasNoBloco) {
    J.idxPerguntaNoBloco++;
  }
  const pct = Math.round(
    (J.idxPerguntaNoBloco / Math.max(1, J.perguntasNoBloco)) * 100
  );
  JORNADA_UI.setProgressoPerguntas(pct);
};
// ================================================================
// FINALIZAÇÃO: gera PDF + HQ e volta para a homepage
// Requer: window.JORNADA_CFG.API_BASE apontando para seu backend
//         backend responde { pdf_url, hq_url } (ajuste os nomes se preciso)
// ================================================================
// ========================= FINALIZAÇÃO GLOBAL =========================
(function () {
  const API = (window.JORNADA_CFG && window.JORNADA_CFG.API_BASE) || "";

  async function baixarArquivo(url, filename) {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`Download falhou: ${r.status}`);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  async function finalizarJornada(payloadRespostas) {
    try {
      if (!API) throw new Error("API_BASE ausente em JORNADA_CFG");
      console.log('[FINALIZAR] POST =>', `${API}/generate`, payloadRespostas);

      const resp = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payloadRespostas || {}),
      });
      console.log('[FINALIZAR] HTTP', resp.status);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      console.log('[FINALIZAR] payload', data);

      const pdfUrl = data.pdf_url || data.pdf || data.pdfLink;
      const hqUrl  = data.hq_url  || data.hq  || data.hqLink;

      if (pdfUrl) await baixarArquivo(pdfUrl, "Jornada-Conhecimento-com-Luz.pdf");
      if (hqUrl)  await baixarArquivo(hqUrl,  "Jornada-HQ.zip");

      window.location.href = "/index.html";
    } catch (err) {
      console.error("[FINALIZAR] erro:", err);
      alert("Não foi possível gerar os arquivos agora. Tente novamente em instantes.");
    }
  }

  window.JORNADA_FINALIZAR = finalizarJornada;
})();



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

  /* ===========================================================================
     TÍTULO: NAVEGAÇÃO
     SUBTÍTULO: Próxima / Anterior (com salvamento)
  =========================================================================== */
  function goNext() {
    const bloco = S.blocoAtivo();
    const perguntas = S.perguntasDo(bloco);

    // salva a atual
    saveCurrentAnswer();
     
     // NOVO: Analisa a última resposta e ajusta a chama
      const qEl = perguntas[state.perguntaIndex];
      const input = U.getAnswerEl(qEl);
      if (input && window.JORNADA_CHAMA && typeof window.JORNADA_CHAMA.ajustar === 'function') {
      const sentimento = analiseSentimento(U.getVal(input));
      window.JORNADA_CHAMA.ajustar(sentimento);
}

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
      if (p && p.catch) p.catch(() => {/* usuário poderá clicar play/skip */});
    } catch {
      // se der erro, mantém overlay visível e usuário pode clicar play
    }
  }

  /* ===========================================================================
     TÍTULO: FINALIZAÇÃO
     SUBTÍTULO: Gatilho de conclusão (envio/alerta/resumo)
  =========================================================================== */
  function finalize() {
    // salva última resposta
    saveCurrentAnswer();

    // aqui você pode enviar para backend
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

 /* ===========================================================================
     TÍTULO: CHAMA
     SUBTÍTULO: ESTADO MÍNIMO + CHAMADAS
  =========================================================================== */
  (function(){
  const UI = window.JORNADA_UI;
  const J  = window.JORNADA_STATE = window.JORNADA_STATE || {
    blocoAtual: 0,          // 0..4 (5 blocos)
    totalBlocos: 5,
    idxPerguntaNoBloco: 0,  // 0..(perguntasNoBloco-1)
    perguntasNoBloco: 5
  };

  function atualizarProgresso(){
    UI.setProgressoBlocos(J.blocoAtual, J.totalBlocos);
    const pct = Math.round((J.idxPerguntaNoBloco / Math.max(1,J.perguntasNoBloco)) * 100);
    UI.setProgressoPerguntas(pct);
  }

  // Exponha para quem renderiza perguntas/blocos:
  window.JORNADA_ENTRAR_BLOCO = (i, qtdPerguntas)=>{
    J.blocoAtual = i; J.perguntasNoBloco = qtdPerguntas; J.idxPerguntaNoBloco = 0; atualizarProgresso();
  };
  window.JORNADA_AVANCAR_PERGUNTA = ()=>{
    if (J.idxPerguntaNoBloco < J.perguntasNoBloco) J.idxPerguntaNoBloco++;
    atualizarProgresso();
  };

  document.addEventListener('DOMContentLoaded', atualizarProgresso);
})();

(function(){
  const API = (window.JORNADA_CFG && window.JORNADA_CFG.API_BASE) || '';

  async function baixar(url, filename){
    const r = await fetch(url); if(!r.ok) throw new Error('Download falhou');
    const blob = await r.blob(); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a);
    a.click(); URL.revokeObjectURL(a.href); a.remove();
  }

  window.JORNADA_FINALIZAR = async function(payload){
    try{
      const r = await fetch(`${API}/generate`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const { pdf_url, hq_url } = await r.json();
      if (pdf_url) await baixar(pdf_url, 'Jornada-Conhecimento-com-Luz.pdf');
      if (hq_url) await baixar(hq_url,   'Jornada-HQ.zip');
      setTimeout(()=>{ window.location.href = '/index.html'; }, 800);
    }catch(e){
      console.error(e); alert('Falha ao gerar arquivos. Tente novamente.');
    }
  };
})();

