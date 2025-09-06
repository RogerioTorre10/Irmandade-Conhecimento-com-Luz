// /public/jornada-chama.js
// CHAMA DE IMERSÃO — análise emocional + animação modulável
// Compatível com: #chama-perguntas + sections: #section-intro, #section-perguntas, #section-final
(function () {
  // ===== Léxico simples (PT-BR, sem acentos) =====
  const EMO = {
    POS: {
      'feliz':2,'alegria':2,'amor':3,'sucesso':2,'esperanca':3,'paz':2,'fe':3,'gratidao':2,
      'vitoria':3,'superacao':3,'luz':2,'deus':3,'coragem':2,'forca':2,'confiança':2,'confiança':2,
      'confianca':2,'proposito':3,'renovacao':2,'esperancoso':2,'otimismo':2,'graca':2
    },
    NEG: {
      'triste':-2,'dor':-3,'raiva':-2,'medo':-2,'frustracao':-2,'decepcao':-2,'perda':-3,
      'culpa':-2,'ansiedade':-2,'solidao':-2,'desespero':-3,'cansaco':-2,'fracasso':-2,
      'trauma':-3,'duvida':-2,'vazio':-2,'desanimo':-2,'falta':-1,'luto':-3
    }
  };

  // ===== Utils =====
  function norm(s){
    return (s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  // ===== Análise de sentimento muito leve =====
  function analyzeSentiment(text) {
    let score = 0;
    const tokens = norm(text).split(/\s+/);
    for (const t of tokens) {
      if (EMO.POS[t] != null) score += EMO.POS[t];
      if (EMO.NEG[t] != null) score += EMO.NEG[t];
    }
    return score; // ~ faixa típica: -6 .. +6
  }

  // ===== Mapeamento score -> intensidade =====
  function scoreToIntensity(scoreNum){
    if (scoreNum <= -2) return 'fraca';
    if (scoreNum >=  2) return 'forte';
    return 'media';
  }

  // ===== Monta a estrutura visual da chama (sem imagens) =====
  function mountFlame(el){
    if (!el || el._chamaMounted) return;
    el.classList.add('chama-viva');           // classe raiz (CSS)
    el.setAttribute('data-intensidade','media');
    el.innerHTML = `
      <div class="brasa"></div>
      <div class="lingua"></div>
      <div class="lingua"></div>
      <div class="lingua"></div>
      <div class="brilho"></div>
    `;
    el._chamaMounted = true;
  }

  // ===== Ajusta intensidade diretamente =====
  function setChamaIntensidade(target, modo /* 'fraca'|'media'|'forte' */){
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    mountFlame(el);
    el.setAttribute('data-intensidade', modo);
  }

  // ===== Atualiza pela pontuação numérica =====
  function updateChama(scoreNum, targetId='chama-perguntas'){
    const el = document.getElementById(targetId);
    if (!el) return;
    mountFlame(el);
    const modo = scoreToIntensity(Number(scoreNum)||0);
    el.setAttribute('data-intensidade', modo);
    // efeito “pico” curto quando forte
    clearTimeout(el._pulse_t);
    if (modo === 'forte') {
      el.classList.add('chama-pico');
      el._pulse_t = setTimeout(()=> el.classList.remove('chama-pico'), 700);
    }
  }

  // ===== Atualiza a partir de um TEXTO livre =====
  function updateChamaFromText(text, targetId='chama-perguntas'){
    const score = analyzeSentiment(text);
    updateChama(score, targetId);
    return { score, intensidade: scoreToIntensity(score) };
  }

  // ===== Mostra/oculta chamas “hero” por seção =====
  function ensureHeroFlame(sectionId) {
    const introChama   = document.querySelector('#section-intro .chama-viva, #chama-intro');
    const finalChama   = document.querySelector('#section-final .chama-viva, #chama-final');
    const perguntasEl  = document.getElementById('chama-perguntas');

    if (introChama)   introChama.style.visibility   = (sectionId === 'section-intro')      ? 'visible' : 'hidden';
    if (finalChama)   finalChama.style.visibility   = (sectionId === 'section-final')      ? 'visible' : 'hidden';
    if (perguntasEl)  perguntasEl.style.visibility  = (sectionId === 'section-perguntas')  ? 'visible' : 'hidden';
  }

  // ===== Auto-init leve (se existe #chama-perguntas monta no DOM) =====
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('chama-perguntas');
    if (el) mountFlame(el);
  });

  // ===== API pública =====
  window.JORNADA_CHAMA = {
    analyzeSentiment,         // (texto) -> score
    updateChama,              // (scoreNum[, targetId])
    updateChamaFromText,      // (texto[, targetId]) -> {score,intensidade}
    setChamaIntensidade,      // (elOrId, 'fraca'|'media'|'forte')
    ensureHeroFlame           // (sectionId)
  };
})();

// Grok xAI - Uhuuuuuuu! 🚀
