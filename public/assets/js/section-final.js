/* section-final.js — FINAL v3.0 (voz + datilografia + PDF/HQ + vídeo OFICIAL) */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';

  // endereço do portal
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  // utilitário de pausa
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // controle de voz
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!window.speechSynthesis || !text) return Promise.resolve();
    speechChain = speechChain.then(() => new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      u.rate = 0.9;
      u.pitch = 1;
      u.volume = 0.9;
      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    }));
    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;
  
    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) await sleep(delay);
    }

    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }


  // ------------------------------------------
  // SEQUÊNCIA FINAL
  // ------------------------------------------

  let started = false;

  async function startFinalSequence() {
    if (started) return;
    started = true;

    try { speechSynthesis.cancel(); } catch {}

    const section = document.getElementById(SECTION_ID);
    const titleEl = document.getElementById('final-title');
    const msgEl   = document.getElementById('final-message');
    const botoes  = document.querySelector('.final-acoes');

    if (!section || !titleEl || !msgEl) return;

    const titulo = titleEl.dataset.original || titleEl.textContent.trim();
    titleEl.textContent = '';
    titleEl.style.opacity = 0;

    const ps = msgEl.querySelectorAll('p');
    ps.forEach(p => {
      const t = p.dataset.original || p.textContent.trim();
      p.dataset.original = t;
      p.textContent = '';
      p.style.opacity = 0;
    });

    await sleep(200);

    // título
    titleEl.style.transition = 'all .9s ease';
    titleEl.style.opacity = 1;
    await typeText(titleEl, titulo, 65, true);
    await sleep(400);

    // parágrafos
    for (const p of ps) {
      p.style.transition = 'all .8s ease';
      p.style.opacity = 1;
      await typeText(p, p.dataset.original, 55, true);
      await sleep(200);
    }

    // botões
    botoes.style.opacity = 0;
    botoes.style.transform = 'scale(0.9)';
    botoes.style.transition = 'all .8s ease';
    await sleep(300);
    botoes.classList.add('show');
    botoes.style.opacity = 1;
    botoes.style.transform = 'scale(1)';
  }


  // ------------------------------------------
  // PDF / HQ
  // ------------------------------------------

  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Gerando sua Jornada...';

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.JornadaAnswers || {},
          meta: { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) alert('PDF/HQ estarão disponíveis em instantes.');

    } catch (e) {
      alert('Erro temporário. Tente novamente em alguns segundos.');
    }

    btn.textContent = original;
    btn.dataset.loading = '0';
  }


  // ------------------------------------------
  // BOTÃO VOLTAR AO INÍCIO
  // ------------------------------------------

  function handleVoltarInicio() {
    console.log('[FINAL] Chamando vídeo oficial de transição…');

    const finalMovie = '/assets/videos/filme-5-fim-da-jornada.mp4';

    // preferencial: use video-transicao.js
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(finalMovie, null);
      return;
    }

    // fallback: playVideo global
    if (typeof window.playVideo === 'function') {
      window.playVideo(finalMovie, {
        onEnded: () => window.location.href = HOME_URL
      });
      return;
    }

    // fallback final: sem vídeo
    window.location.href = HOME_URL;
  }


  // ------------------------------------------
  // EVENTOS
  // ------------------------------------------

  document.addEventListener('section:shown', e => {
    if ((e.detail?.sectionId || e.detail) === SECTION_ID) {
      startFinalSequence();
    }
  });

  document.addEventListener('click', e => {
    const t = e.target;

    if (t.id === 'btnBaixarPDFHQ' || t.closest('#btnBaixarPDFHQ')) {
      e.preventDefault();
      generateArtifacts();
    }

    if (t.id === 'btnVoltarInicio' || t.closest('#btnVoltarInicio')) {
      e.preventDefault();
      handleVoltarInicio();
    }
  });

})();
