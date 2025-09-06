// Chama de Imersão - injeta e dimensões automaticamente
(function () {
  function criarChama(classe) {
    const d = document.createElement("div");
    d.className = `chama ${classe || 'chama-lg'}`;
    d.innerHTML = `<span></span>`; // Única chama
    return d;
  }

  function ajustarChama(sentimento, chamaEl) {
    if (!chamaEl) return;
    chamaEl.classList.remove("cham// Chama de Imersão - Lógica de Análise e Animação
(function () {
  // Dados de Análise de Sentimento
  const EMO = {
    POS: {'feliz':2,'alegria':2,'amor':3,'sucesso':2,'esperança':3,'paz':2,'fé':3,'gratidão':2,'vitória':3,'superação':3,'luz':2,'deus':3,'coragem':2,'força':2,'confiança':2,'propósito':3},
    NEG: {'triste':-2,'dor':-3,'raiva':-2,'medo':-2,'frustracao':-2,'frustração':-2,'decepcao':-2,'decepção':-2,'perda':-3,'culpa':-2,'ansiedade':-2,'solidao':-2,'solidão':-2,'desespero':-3,'cansaco':-2,'cansaço':-2,'fracasso':-2,'trauma':-3,'duvida':-2,'dúvida':-2}
  };

  // Funções de controle da Chama
  function analyzeSentiment(text) {
    let score = 0;
    const tokens = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
    for (const t of tokens) {
      if (EMO.POS[t] != null) score += EMO.POS[t];
      if (EMO.NEG[t] != null) score += EMO.NEG[t];
    }
    return score;
  }

  function updateChama(scoreNum) {
    const chama = document.getElementById('chama-perguntas');
    if (!chama) return;
    chama.classList.remove('chama-weak', 'chama-strong', 'chama-pulse');
    chama.classList.add('chama', 'chama-md');
    if (scoreNum <= -2) {
      chama.classList.add('chama-weak');
    } else if (scoreNum >= 2) {
      chama.classList.add('chama-strong', 'chama-pulse');
    }
    clearTimeout(chama._pulse_t);
    if (scoreNum >= 2) {
      chama._pulse_t = setTimeout(() => chama.classList.remove('chama-pulse'), 700);
    }
  }

  function ensureHeroFlame(sectionId) {
    const introChama = document.querySelector('#section-intro .chama');
    const finalChama = document.querySelector('#section-final .chama');
    const perguntasChama = document.getElementById('chama-perguntas');
    
    if (introChama) introChama.style.visibility = (sectionId === 'section-intro') ? 'visible' : 'hidden';
    if (finalChama) finalChama.style.visibility = (sectionId === 'section-final') ? 'visible' : 'hidden';
    if (perguntasChama) perguntasChama.style.visibility = (sectionId === 'section-perguntas') ? 'visible' : 'hidden';
  }

  // Expõe as funções para uso em outros scripts
  window.JORNADA_CHAMA = {
    updateChama: updateChama,
    analyzeSentiment: analyzeSentiment,
    ensureHeroFlame: ensureHeroFlame
  };
})();
// Grok xAI - Uhuuuuuuu! 🚀a-sofrida", "chama-alegre");
    const baseScale = 1.04;
    if (sentimento === "sofrida") {
      chamaEl.style.setProperty('--scale', (baseScale - 0.1).toFixed(3));
      chamaEl.style.setProperty('--y', '2px');
    } else if (sentimento === "alegre") {
      chamaEl.style.setProperty('--scale', (baseScale + 0.1).toFixed(3));
      chamaEl.style.setProperty('--y', '-2px');
    }
  }

  function initChama() {
    const chamaHeader = document.querySelector('.site-header .chama');
    const chamaPerguntas = document.getElementById("chama-perguntas");
    const chamaFinal = document.getElementById("chama-final");

    [chamaHeader, chamaPerguntas, chamaFinal].forEach(chamaEl => {
      if (chamaEl && !chamaEl.querySelector('span')) {
        chamaEl.innerHTML = '';
        const novaChama = criarChama(chamaEl.id === 'chama-perguntas' ? 'chama-md-intermediario' : 'chama-lg');
        chamaEl.appendChild(novaChama);
        console.log(`Chama inicializada em ${chamaEl.id || 'header'}`);
      }
    });

    let t;
    const brilho = (chamaEl) => {
      if (!chamaEl) return;
      let t = 0;
      const base = 1.04;
      const ampS = 0.075;
      const ampY = 1.3;
      const ampR = 1.0;
      (function loop() {
        t += 0.032 + Math.random() * 0.008;
        const s = base + Math.sin(t) * ampS + (Math.random() * 0.015 - 0.007);
        const y = Math.sin(t * 1.18) * ampY;
        const rot = Math.sin(t * 0.85) * ampR;
        chamaEl.style.setProperty('--scale', s.toFixed(3));
        chamaEl.style.setProperty('--y', y.toFixed(2) + 'px');
        chamaEl.style.setProperty('--rot', rot.toFixed(2) + 'deg');
        requestAnimationFrame(loop);
      })();
    };

    [chamaHeader, chamaPerguntas, chamaFinal].forEach(chamaEl => {
      if (chamaEl && chamaEl.querySelector('span')) brilho(chamaEl);
    });
  }

  document.addEventListener('DOMContentLoaded', initChama);

  window.JORNADA_CHAMA = {
    criarChama: criarChama,
    ajustar: ajustarChama,
  };
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
