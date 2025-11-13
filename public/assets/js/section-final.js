/* section-final.js — FINAL v1.5 | PERFEITO: VISUAL + LÓGICA + ESTABILIDADE */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let started = false;
  let videoPlaying = false;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Fila de fala
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
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      });
      await sleep(100);
    }
    speakingInProgress = false;
  }

  // Datilografia
  let typingPaused = false;
  async function typeText(el, text, delay = 35, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.classList.add('typing-active');

    if (withVoice) speakText(text);

    for (let i = 0; i < text.length; i++) {
      if (typingPaused) {
        await new Promise(r => setTimeout(r, 100));
        i--;
        continue;
      }
      el.textContent += text[i];
      await sleep(delay);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
  }

  async function typeAndSpeak(el, text, delay = 35) {
    await typeText(el, text, delay, false);
    await speakText(text);
  }

  // Pausa ao interagir
  const pauseTyping = () => { typingPaused = true; };
  const resumeTyping = () => { typingPaused = false; };
  document.addEventListener('mousedown', pauseTyping);
  document.addEventListener('touchstart', pauseTyping);
  document.addEventListener('mouseup', resumeTyping);
  document.addEventListener('touchend', resumeTyping);
  document.addEventListener('keydown', resumeTyping);

  // === FORÇA ESCONDER TUDO ANTES DE COMEÇAR ===
  function hideAllExceptFinal() {
    document.querySelectorAll('body > *').forEach(el => {
      if (el.id !== SECTION_ID && el.id !== 'final-video-container' && el.id !== 'final-video-overlay') {
        el.style.display = 'none';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    });
    document.body.style.overflow = 'hidden';
  }

  async function startFinalSequence() {
    if (started) return;
    started = true;

    const section = document.getElementById(SECTION_ID);
    if (!section) {
      console.warn('[FINAL] Seção não encontrada. Aguardando...');
      setTimeout(startFinalSequence, 500);
      return;
    }

    // === FORÇA ESCONDER TUDO ===
    hideAllExceptFinal();

    // Garante que a seção final esteja visível
    section.style.display = 'flex';
    section.style.opacity = '1';
    section.style.zIndex = '99999';

    const titleEl = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');

    if (!titleEl || !messageEl) {
      console.warn('[FINAL] Elementos não encontrados.');
      return;
    }

    // Desabilita botões
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
      btn.style.pointerEvents = 'none';
    });

    try {
      // TÍTULO
      titleEl.style.opacity = '1';
      await typeAndSpeak(titleEl, 'Gratidão por Caminhar com Luz', 40);
      await sleep(800);

      // PARÁGRAFOS
      const ps = messageEl.querySelectorAll('p');
      for (const p of ps) {
        const txt = p.getAttribute('data-original')?.trim() || p.textContent.trim();
        if (!p.getAttribute('data-original')) {
          p.setAttribute('data-original', txt);
        }
        p.textContent = '';
        p.style.opacity = '1';
        await typeAndSpeak(p, txt, 22);
        await sleep(500);
      }

      // LIBERA BOTÕES
      const buttons = document.querySelectorAll('.final-acoes button');
      buttons.forEach((btn, i) => {
        setTimeout(() => {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.transform = 'translateY(0)';
          btn.style.pointerEvents = 'auto';
        }, i * 250);
      });

      console.log('[FINAL] Jornada completa. Botões liberados com luz!');
    } catch (err) {
      console.error('[FINAL] Erro:', err);
    }
  }

  // Geração de PDF/HQ
  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Gerando sua Jornada...';
    btn.disabled = true;

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.__QA_ANSWERS__ || { teste: 'finalizado' },
          meta: { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) {
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

  // Vídeo final com borda perfeita
  function playFinalVideo() {
    if (videoPlaying) return;
    videoPlaying = true;

    const container = document.createElement('div');
    container.id = 'final-video-container';
    container.style.cssText = `
      position: fixed !important; top: 50% !important; left: 50% !important;
      transform: translate(-50%, -50%) !important; width: 92vw !important; height: 92vh !important;
      max-width: 92vw !important; max-height: 92vh !important; z-index: 99999 !important;
      border: 12px solid #d4af37 !important; border-radius: 16px !important;
      box-shadow: 0 0 60px rgba(212,175,55,0.9) !important; overflow: hidden !important;
      background: #000 !important; display: flex !important; justify-content: center !important; align-items: center !important;
    `;

    const video = document.createElement('video');
    video.id = 'final-video';
    video.src = VIDEO_SRC;
    video.playsInline = true;
    video.preload = 'auto';
    video.autoplay = true;
    video.style.cssText = `width: 100% !important; height: 100% !important; object-fit: contain !important;`;

    const overlay = document.createElement('div');
    overlay.id = 'final-video-overlay';
    overlay.style.cssText = `
      position: fixed !important; top: 0 !important; left: 0 !important;
      width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.95) !important;
      z-index: 99998 !important; pointer-events: none !important;
    `;

    container.appendChild(video);
    document.body.appendChild(container);
    document.body.appendChild(overlay);

    const goHome = () => {
      container.style.opacity = '0';
      overlay.style.opacity = '0';
      setTimeout(() => window.location.href = HOME_URL, 1100);
    };

    video.onended = goHome;
    setTimeout(goHome, 8000); // segurança
  }

  // Eventos
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button') || e.target;
    if (t.id === 'btnBaixarPDFHQ') { e.preventDefault(); generateArtifacts(); }
    if (t.id === 'btnVoltarInicio') { e.preventDefault(); playFinalVideo(); }
  });

  // === INICIALIZAÇÃO FORTE: DOM + EVENTO + POLLING ===
  function tryStart() {
    if (started) return;
    const sec = document.getElementById(SECTION_ID);
    if (sec && sec.offsetParent !== null) {
      startFinalSequence();
    } else {
      setTimeout(tryStart, 300);
    }
  }

  // 1. DOM carregado
  document.addEventListener('DOMContentLoaded', tryStart);

  // 2. Evento do JC (se existir)
  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId || e.detail;
    if (id === SECTION_ID) tryStart();
  });

  // 3. Polling de segurança
  setTimeout(tryStart, 1000);

  // CSS
  const style = document.createElement('style');
  style.textContent = `
    .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #d4af37; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #section-final { position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a1a2e, #0a0a1a); }
  `;
  document.head.appendChild(style);

})();
