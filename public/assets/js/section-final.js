/* section-final.js — FINAL v1.3 (CORRIGIDO E FUNCIONAL) */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let started = false;

  // Utilitário de pausa (necessário para datilografia / efeitos)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fila de fala: garante sincronismo da leitura por parágrafo
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 0.9;
      utter.onend = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    }));

    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    // Inicia leitura e datilografia juntas, mas só libera o próximo parágrafo ao fim da leitura
    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) await sleep(delay);
    }

    // Espera a voz terminar antes de concluir este parágrafo
    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    return sleep(200);
  }

  async function startFinalSequence() {
    if (started) return;
    started = true;

    try {
    document.body.classList.add('final-lock');
  } catch (e) {}
    
    // Reseta qualquer fala pendente de outras seções
    try { speechSynthesis.cancel(); } catch(e) {}
    speechChain = Promise.resolve();

    const section   = document.getElementById(SECTION_ID);
    const titleEl   = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');
    const botoes    = document.querySelector('.final-acoes');

    if (!section || !titleEl || !messageEl) return;

    // PREPARA TÍTULO E PARÁGRAFOS
    const tituloOriginal = titleEl.getAttribute('data-original') || titleEl.textContent.trim() || 'Gratidão por Caminhar com Luz';
    titleEl.setAttribute('data-original', tituloOriginal);
    titleEl.textContent = '';
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(-16px)';

    const ps = messageEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.getAttribute('data-original') || p.textContent.trim();
      p.setAttribute('data-original', txt);
      p.textContent = '';
      p.style.opacity = '0';
      p.style.transform = 'translateY(10px)';
      p.classList.remove('revealed');
    });

    section.classList.add('show');
    await sleep(200);

    // TÍTULO (datilografa + lê, e só segue quando terminar de ler)
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = '1';
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS (um por vez: lê + datilografa juntos, e só passa pro próximo ao fim da leitura)
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.getAttribute('data-original') || '';
      if (!txt) continue;
      p.style.transition = 'all 0.8s ease';
      p.style.opacity = '1';
      p.style.transform = 'translateY(0)';
      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
      await sleep(300);
    }

    // BOTÕES APARECEM — SEM VÍDEO AUTOMÁTICO
    if (botoes) {
      botoes.style.opacity = '0';
      botoes.style.transform = 'scale(0.9)';
      botoes.style.transition = 'all 0.8s ease';
      botoes.style.pointerEvents = 'none';

      await sleep(400);

      botoes.classList.add('show');
      botoes.style.opacity = '1';
      botoes.style.transform = 'scale(1)';

      botoes.querySelectorAll('button, a').forEach(el => {
        el.disabled = false;
        el.classList.remove('disabled');
        el.removeAttribute('aria-disabled');
        el.style.pointerEvents = 'auto';
      });

      console.log('[FINAL] Botões liberados. Aguardando clique do participante para o vídeo final.');
    }

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;
    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Gerando sua Jornada...';
    btn.disabled = true;

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.JornadaAnswers || { teste: 'finalizado' },
          meta: { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) alert('Jornada concluída! PDF/HQ em breve disponível.');
    } catch (e) {
      console.error(e);
      alert('Erro temporário. Tente novamente em 10s.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

 // Vídeo final + redirecionamento cinematográfico
function playFinalVideo() {
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4'; // ajusta se precisar

  // Overlay
  let overlay = document.getElementById('final-video-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'final-video-overlay';
    overlay.className = 'final-video-overlay'; // opcional, se quiser outra classe
    document.body.appendChild(overlay);
  }

  // Vídeo
  let video = document.getElementById('final-video');
  if (!video) {
    video = document.createElement('video');
    video.id = 'final-video';
    video.playsInline = true;
    video.autoplay = true;
    video.controls = false;
    video.muted = false; // põe true se quiser mudo
    video.className = 'final-video-frame'; // ✨ aqui entra o efeito de cinema
    overlay.appendChild(video);
  }

  video.src = VIDEO_SRC;
  video.currentTime = 0;

  // Garante que tente tocar
  const tryPlay = () => {
    video.play().catch(err => {
      console.warn('[FINAL] Não consegui tocar o vídeo automaticamente:', err);
    });
  };
  tryPlay();

  // Ao terminar: fade-out + redireciona ao portal
  video.onended = () => {
    overlay.style.transition = 'opacity 0.8s ease-out';
    overlay.style.opacity = '0';

    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      window.location.href = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html'; // ou o link do teu portal
    }, 850);
  };
}

  document.addEventListener('section:shown', e => {
    const id = e.detail?.sectionId || e.detail;
    if (id === SECTION_ID) startFinalSequence();
  });

  document.addEventListener('click', e => {
    const t = e.target;

    if (t.id === 'btnBaixarPDFHQ' || t.closest('#btnBaixarPDFHQ')) {
      e.preventDefault();
      generateArtifacts();
    }

    if (t.id === 'btnVoltarInicio' || t.closest('#btnVoltarInicio')) {
      e.preventDefault();
      playFinalVideo();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && (sec.classList.contains('show') || getComputedStyle(sec).display !== 'none')) {
      startFinalSequence();
    }
  });

})();
