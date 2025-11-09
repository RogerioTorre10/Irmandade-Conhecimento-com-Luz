/* section-final.js — FINAL v1.2 OTIMIZADO (anti-travamento) */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let isSpeaking = false;
  let started = false;
  let videoPlaying = false;

  // Utilitário otimizado com requestIdleCallback ou fallback
  const sleep = (ms) => new Promise(r => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setTimeout(r, ms), { timeout: ms + 100 });
    } else {
      setTimeout(r, ms);
    }
  });

  // Fila de fala para evitar sobreposição
  const speakQueue = [];
  let speakingInProgress = false;

  async function speakText(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speakQueue.push(text);
    if (speakingInProgress) return;
    speakingInProgress = true;

    while (speakQueue.length > 0) {
      const current = speakQueue.shift();
      await new Promise(resolve => {
        const utter = new SpeechSynthesisUtterance(current);
        utter.lang = 'pt-BR';
        utter.rate = 0.95;
        utter.onend = resolve;
        utter.onerror = resolve;
        speechSynthesis.cancel(); // limpa fila antiga
        speechSynthesis.speak(utter);
      });
      await sleep(100); // pequena pausa entre falas
    }
    speakingInProgress = false;
  }

  // Datilografia com throttling + pause on interaction
  let typingPaused = false;
  async function typeText(el, text, delay = 35, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.classList.add('typing-active');

    if (withVoice) {
      speakText(text); // fila, não bloqueia
    }

    for (let i = 0; i < text.length; i++) {
      if (typingPaused) {
        await new Promise(r => setTimeout(r, 100)); // espera voltar
        i--; // repete caractere
        continue;
      }
      el.textContent += text[i];
      await sleep(delay);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
  }

  // Pausa datilografia ao interagir
  const pauseTyping = () => { typingPaused = true; };
  const resumeTyping = () => { typingPaused = false; };
  document.addEventListener('mousedown', pauseTyping);
  document.addEventListener('touchstart', pauseTyping);
  document.addEventListener('mouseup', resumeTyping);
  document.addEventListener('touchend', resumeTyping);
  document.addEventListener('keydown', resumeTyping);

  // Sequência final com controle de fluxo
  async function startFinalSequence() {
    if (started) return;
    started = true;

    const section = document.getElementById(SECTION_ID);
    if (!section) {
      started = false;
      return;
    }

    const titleEl = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');

    if (!titleEl || !messageEl) {
      console.warn('[FINAL] Elementos não encontrados.');
      return;
    }

    await typeText(titleEl, 'Gratidão por Caminhar com Luz', 40, true);
    await sleep(600);

    const ps = messageEl.querySelectorAll('p');
    for (const p of ps) {
      const txt = (p.getAttribute('data-original') || p.textContent || '').trim();
      if (!p.getAttribute('data-original')) {
        p.setAttribute('data-original', txt);
      }
      await typeText(p, txt, 22, true);
      await sleep(350);
    }

    // Libera botões
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    });

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  // Geração de PDF/HQ (inalterada, mas com feedback visual)
  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Gerando sua Jornada...';
    btn.disabled = true;

    const payload = {
      answers: { teste: 'Resposta de teste' },
      meta: { finishedAt: new Date().toISOString() },
      lang: 'pt-BR'
    };

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json().catch(() => ({}));
      let opened = false;

      if (data.pdfUrl) { window.open(data.pdfUrl, '_blank'); opened = true; }
      if (data.hqUrl) { window.open(data.hqUrl, '_blank'); opened = true; }

      if (!opened) {
        alert('Jornada finalizada! PDF/HQ em breve...');
      }
    } catch (e) {
      console.error('[FINAL] Erro:', e);
      alert('Erro temporário. Tente novamente.');
    } finally {
      btn.innerHTML = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // VÍDEO FINAL ESTÁVEL (com fallback e preload)
  function playFinalVideo() {
    if (videoPlaying || window.__finalVideoRunning) {
      window.location.href = HOME_URL;
      return;
    }
    window.__finalVideoRunning = true;
    videoPlaying = true;

    // Preload do vídeo (evita delay)
    const video = document.createElement('video');
    video.id = 'final-video';
    video.src = VIDEO_SRC;
    video.playsInline = true;
    video.muted = false;
    video.preload = 'auto';
    video.style.display = 'none';
    document.body.appendChild(video);

    // Estiliza só quando pronto
    const showVideo = () => {
      video.style.cssText = `
        position: fixed !important;
        top: 50% !important; left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 92vw !important; height: 92vh !important;
        max-width: 92vw !important; max-height: 92vh !important;
        object-fit: contain !important;
        z-index: 99999 !important;
        border: 12px solid #d4af37 !important;
        border-radius: 16px !important;
        box-shadow: 0 0 60px rgba(212,175,55,0.9) !important;
        background: #000 !important;
        display: block !important;
      `;

      document.body.style.overflow = 'hidden';
      document.querySelectorAll('body > *:not(#final-video)').forEach(el => {
        el.style.transition = 'opacity 0.6s';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
    };

    const goHome = () => {
      document.body.style.overflow = '';
      window.location.href = HOME_URL;
    };

    video.oncanplaythrough = () => {
      showVideo();
      video.play().then(() => {
        console.log('[FINAL] Vídeo iniciado.');
      }).catch(() => goHome());
    };

    video.onended = goHome;
    video.onerror = goHome;

    // Timeout de segurança
    setTimeout(() => {
      if (!video.playing) goHome();
    }, 6000);
  }

  // Eventos
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button') || e.target;
    if (!t) return;

    if (t.id === 'btnBaixarPDFHQ') {
      e.preventDefault();
      generateArtifacts();
    }

    if (t.id === 'btnVoltarInicio') {
      e.preventDefault();
      playFinalVideo();
    }
  });

  // Inicialização
  function tryStart() {
    if (document.getElementById(SECTION_ID) && !started) {
      startFinalSequence();
    }
  }

  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId || e.detail?.id || e.detail;
    if (id === SECTION_ID) tryStart();
  });

  document.addEventListener('DOMContentLoaded', tryStart);

  // CSS do spinner (adicione no seu CSS ou aqui)
  const style = document.createElement('style');
  style.textContent = `
    .spinner {
      display: inline-block;
      width: 12px; height: 12px;
      border: 2px solid #d4af37;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .final-acoes button:disabled { opacity: 0.6; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

})();
