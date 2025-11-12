/* section-final.js — FINAL v1.6 | TUDO FUNCIONA + PERGAMINHO VISÍVEL */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let started = false;
  let videoPlaying = false;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // === CSS FORÇADO (GARANTE VISUAL) ===
  const injectCSS = () => {
    const style = document.createElement('style');
    style.id = 'section-final-forced-css';
    style.textContent = `
      #${SECTION_ID} {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important;
        background: radial-gradient(circle at center, #1a1a2e, #0a0a1a) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 99999 !important;
        opacity: 1 !important;
        overflow: hidden !important;
      }
      .pergaminho-vertical {
        background: center/contain no-repeat url('/assets/img/pergaminho-rasgado-vert.png') !important;
        width: 90vw !important; max-width: 560px !important;
        height: 92vh !important; max-height: 860px !important;
        padding: 60px 40px !important;
        border-radius: 20px !important;
        box-shadow: 0 0 60px rgba(212,175,55,0.8) !important;
        position: relative !important;
        background-color: rgba(245,235,200,0.1) !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
      }
      .final-title {
        font-size: 2.4em !important;
        text-shadow: 0 0 20px gold !important;
        color: #ffd700 !important;
        font-family: 'BerkshireSwash', cursive !important;
        text-align: center !important;
        opacity: 0;
      }
      .final-message p {
        font-size: 1.3em !important;
        line-height: 1.6 !important;
        color: #ffd700 !important;
        text-shadow: 0 0 10px rgba(255,215,0,0.5) !important;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.6s ease;
      }
      .final-message p.revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      .final-acoes {
        margin-top: 30px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.8s ease;
      }
      .final-acoes.show {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      .btn-gold, .btn-light {
        padding: 14px 24px !important;
        border-radius: 12px !important;
        font-weight: bold !important;
        border: none !important;
        cursor: pointer !important;
        font-size: 1.1em !important;
        transition: all 0.3s !important;
      }
      .btn-gold {
        background: linear-gradient(45deg, #d4af37, #f4e04d) !important;
        color: #000 !important;
        box-shadow: 0 0 20px gold !important;
      }
      .btn-light {
        background: rgba(255,255,255,0.1) !important;
        color: #ffd700 !important;
        border: 1px solid #d4af37 !important;
        backdrop-filter: blur(5px) !important;
      }
      .spinner {
        display: inline-block; width: 12px; height: 12px;
        border: 2px solid #d4af37; border-top-color: transparent;
        border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      #final-video-container, #final-video-overlay {
        transition: opacity 1s ease-out !important;
      }
    `;
    document.head.appendChild(style);
  };

  // === FALA ===
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

  // === DATILOGRAFIA ===
  let typingPaused = false;
  async function typeText(el, text, delay = 35, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.classList.add('typing-active');
    if (withVoice) speakText(text);
    for (let i = 0; i < text.length; i++) {
      if (typingPaused) { await sleep(100); i--; continue; }
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

  const pauseTyping = () => { typingPaused = true; };
  const resumeTyping = () => { typingPaused = false; };
  ['mousedown', 'touchstart'].forEach(ev => document.addEventListener(ev, pauseTyping));
  ['mouseup', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, resumeTyping));

  // === ESCONDE TUDO ===
  function hideAllExceptFinal() {
    document.querySelectorAll('body > *').forEach(el => {
      if (!['section-final', 'final-video-container', 'final-video-overlay'].includes(el.id)) {
        el.style.display = 'none';
      }
    });
    document.body.style.overflow = 'hidden';
  }

  // === SEQUÊNCIA FINAL ===
  async function startFinalSequence() {
    if (started) return;
    started = true;

    const section = document.getElementById(SECTION_ID);
    if (!section) {
      setTimeout(startFinalSequence, 500);
      return;
    }

    injectCSS(); // FORÇA O CSS
    hideAllExceptFinal();

    section.style.display = 'flex';
    section.style.opacity = '1';

    const titleEl = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');

    if (!titleEl || !messageEl) {
      console.warn('[FINAL] Elementos não encontrados.');
      return;
    }

    // Botões
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
      btn.style.pointerEvents = 'none';
    });

    try {
      titleEl.style.opacity = '1';
      await typeAndSpeak(titleEl, 'Gratidão por Caminhar com Luz', 40);
      await sleep(800);

      const ps = messageEl.querySelectorAll('p');
      for (const p of ps) {
        const txt = p.getAttribute('data-original')?.trim() || p.textContent.trim();
        if (!p.getAttribute('data-original')) p.setAttribute('data-original', txt);
        p.textContent = '';
        p.style.opacity = '1';
        await typeAndSpeak(p, txt, 22);
        p.classList.add('revealed');
        await sleep(500);
      }

      const buttons = document.querySelectorAll('.final-acoes button');
      buttons.forEach((btn, i) => {
        setTimeout(() => {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.transform = 'translateY(0)';
          btn.style.pointerEvents = 'auto';
        }, i * 250);
      });

      const acoes = document.querySelector('.final-acoes');
      if (acoes) acoes.classList.add('show');

      console.log('[FINAL] Jornada completa. Botões liberados com luz!');
    } catch (err) {
      console.error('[FINAL] Erro:', err);
    }
  }

  // === PDF/HQ ===
  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;
    btn.dataset.loading = '1';
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Gerando...';
    btn.disabled = true;

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.__QA_ANSWERS__ || { teste: 'ok' },
          meta: { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
    } catch (e) {
      alert('Erro temporário. Tente novamente.');
    } finally {
      btn.innerHTML = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // === VÍDEO FINAL ===
  function playFinalVideo() {
    if (videoPlaying) return;
    videoPlaying = true;

    const container = Object.assign(document.createElement('div'), { id: 'final-video-container' });
    container.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:92vw;height:92vh;max-width:92vw;max-height:92vh;z-index:99999;border:12px solid #d4af37;border-radius:16px;box-shadow:0 0 60px rgba(212,175,55,0.9);overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center;`;
    const video = Object.assign(document.createElement('video'), { id: 'final-video', src: VIDEO_SRC, playsInline: true, preload: 'auto', autoplay: true });
    video.style.cssText = `width:100%;height:100%;object-fit:contain;`;
    const overlay = Object.assign(document.createElement('div'), { id: 'final-video-overlay' });
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:99998;`;

    container.appendChild(video);
    document.body.appendChild(container);
    document.body.appendChild(overlay);

    const goHome = () => {
      container.style.opacity = '0';
      overlay.style.opacity = '0';
      setTimeout(() => window.location.href = HOME_URL, 1100);
    };
    video.onended = goHome;
    setTimeout(goHome, 8000);
  }

  // === EVENTOS ===
  document.addEventListener('click', e => {
    const t = e.target.closest('button') || e.target;
    if (t.id === 'btnBaixarPDFHQ') { e.preventDefault(); generateArtifacts(); }
    if (t.id === 'btnVoltarInicio') { e.preventDefault(); playFinalVideo(); }
  });

  // === INICIALIZAÇÃO FORTE ===
  const tryStart = () => {
    if (started) return;
    const sec = document.getElementById(SECTION_ID);
    if (sec && sec.offsetParent !== null) {
      startFinalSequence();
    } else {
      setTimeout(tryStart, 300);
    }
  };

  document.addEventListener('DOMContentLoaded', tryStart);
  document.addEventListener('section:shown', e => {
    if ((e.detail?.sectionId || e.detail) === SECTION_ID) tryStart();
  });
  setTimeout(tryStart, 1000);

})();
