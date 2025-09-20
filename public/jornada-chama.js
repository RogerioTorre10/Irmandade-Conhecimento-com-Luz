// /public/jornada-chama.js
// CHAMA DE IMERSÃO — análise emocional + animação modulável
// Inclui: chama normal (#chama-intro, #chama-perguntas, #chama-final)
//         guia espiritual (#chama-bola)

(function () {
  // ===== Léxico de emoções (simplificado) =====
  const EMO = {
    POS: {
      'feliz': 2, 'alegria': 2, 'amor': 3, 'sucesso': 2,
      'esperanca': 3, 'paz': 2, 'fe': 3, 'gratidao': 2,
      'vitoria': 3, 'superacao': 3, 'luz': 2, 'deus': 3,
      'coragem': 2, 'forca': 2, 'confianca': 2, 'proposito': 3
    },
    NEG: {
      'triste': -2, 'dor': -3, 'raiva': -2, 'medo': -2,
      'frustracao': -2, 'decepcao': -2, 'perda': -3,
      'culpa': -2, 'ansiedade': -2, 'solidao': -2,
      'desespero': -3, 'cansaco': -2, 'fracasso': -2,
      'trauma': -3, 'duvida': -2, 'vazio': -2
    }
  };

  // ===== Normalização =====
  function norm(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ===== Análise simples de sentimento =====
  function analyzeSentiment(text) {
    let score = 0;
    const tokens = norm(text).split(/\s+/);
    for (const t of tokens) {
      if (EMO.POS[t] != null) score += EMO.POS[t];
      if (EMO.NEG[t] != null) score += EMO.NEG[t];
    }
    return score; // ~ faixa típica: -6 .. +6
  }

  // ===== Score -> intensidade =====
  function scoreToIntensity(scoreNum) {
    if (scoreNum <= -2) return 'fraca';
    if (scoreNum >= 2) return 'forte';
    return 'media';
  }

  // ===== Monta a chama normal se ainda não existe =====
  function mountFlame(el) {
    if (!el || el._chamaMounted) return;
    el.classList.add('chama-viva');
    el.setAttribute('data-intensidade', 'media');
    el.innerHTML = `
      <div class="brasa"></div>
      <div class="lingua"></div>
      <div class="lingua"></div>
      <div class="lingua"></div>
      <div class="brilho"></div>
    `;
    el._chamaMounted = true;
  }

  // ===== Ajusta intensidade da chama normal =====
  function setChamaIntensidade(target, modo /* fraca|media|forte */) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    mountFlame(el);
    el.setAttribute('data-intensidade', modo);
  }

  // ===== Atualiza chama normal pelo score =====
  function updateChama(scoreNum, targetId = 'chama-perguntas') {
    const el = document.getElementById(targetId);
    if (!el) return;
    mountFlame(el);
    const modo = scoreToIntensity(Number(scoreNum) || 0);
    el.setAttribute('data-intensidade', modo);
    // Efeito pico quando forte
    clearTimeout(el._pulse_t);
    if (modo === 'forte') {
      el.classList.add('chama-pico');
      el._pulse_t = setTimeout(() => el.classList.remove('chama-pico'), 700);
    }
    // também reflete na bola espiritual
    setChamaBola(modo);
  }

  // ===== Atualiza chama normal e bola a partir de texto =====
  function updateChamaFromText(text, targetId = 'chama-perguntas') {
    const score = analyzeSentiment(text);
    updateChama(score, targetId);
    return { score, intensidade: scoreToIntensity(score) };
  }

  // ===== Controle da Bola de Chama (guia espiritual) =====
  function setChamaBola(intensidade, targetId = 'chama-bola') {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.classList.remove('fraca', 'media', 'forte');
    el.classList.add(intensidade);
  }

  // ===== Controle de visibilidade por seção =====
  function ensureHeroFlame(sectionId) {
    const introChama = document.getElementById('chama-intro');
    const finalChama = document.getElementById('chama-final');
    const perguntasChama = document.getElementById('chama-perguntas');

    if (introChama) introChama.style.visibility = (sectionId === 'section-intro') ? 'visible' : 'hidden';
    if (finalChama) finalChama.style.visibility = (sectionId === 'section-final') ? 'visible' : 'hidden';
    if (perguntasChama) perguntasChama.style.visibility = (sectionId === 'section-perguntas') ? 'visible' : 'hidden';
    // OBS: a bola espiritual (#chama-bola) é guia global → sempre visível
  }

  // ===== Auto-init =====
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('chama-perguntas');
    if (el) mountFlame(el);
    // bola de chama já deve existir no HTML como <div id="chama-bola" class="media"></div>
  });

  // ===== API Pública =====
  window.JORNADA_CHAMA = {
    analyzeSentiment,        // analisa texto → score
    updateChama,             // score → chama normal (+ bola)
    updateChamaFromText,     // texto → score → chama normal (+ bola)
    setChamaIntensidade,     // força intensidade na chama normal
    ensureHeroFlame,         // controla visibilidade da chama normal
    setChamaBola             // controla intensidade da bola espiritual
  };
})();
// Alias para compatibilidade com o micro-boot
window.JChama = window.JChama || window.JORNADA_CHAMA;


