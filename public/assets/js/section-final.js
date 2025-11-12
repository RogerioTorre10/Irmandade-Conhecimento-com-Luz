/* section-final.js — FINAL v1.4 | Vídeo até o fim + borda perfeita + CORRIGIDO */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let isSpeaking = false;
  let started = false;
  let videoPlaying = false;

  // Utilitário com requestIdleCallback (evita travamento)
  const sleep = (ms) => new Promise(r => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setTimeout(r, ms), { timeout: ms + 100 });
    } else {
      setTimeout(r, ms);
    }
  });

  // Fila de fala (evita sobreposição)
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

  // Datilografia com pausa ao interagir
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

  // === FUNÇÃO CORRIGIDA: typeAndSpeak ===
  async function typeAndSpeak(el, text, delay = 35) {
    await typeText(el, text, delay, false); // digita
    await speakText(text);                  // fala depois
  }

  // Pausa datilografia ao interagir
  const pauseTyping = () => { typingPaused = true; };
  const resumeTyping = () => { typingPaused = false; };
  document.addEventListener('mousedown', pauseTyping);
  document.addEventListener('touchstart', pauseTyping);
  document.addEventListener('mouseup', resumeTyping);
  document.addEventListener('touchend', resumeTyping);
  document.addEventListener('keydown', resumeTyping);

  // === SEQUÊNCIA FINAL: TEXTO INVISÍVEL + BOTÕES SÓ NO FIM ===
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

    // === GARANTE QUE BOTÕES ESTÃO DESABILITADOS ===
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
      btn.style.pointerEvents = 'none';
    });

    try {
      // === 1. TÍTULO ===
      titleEl.style.opacity = '1';
      await typeAndSpeak(titleEl, 'Gratidão por Caminhar com Luz', 40);
      await sleep(800);

      // === 2. PARÁGRAFOS (UM POR VEZ) ===
      const ps = messageEl.querySelectorAll('p');
      for (const p of ps) {
        const txt = p.getAttribute('data-original')?.trim();
        if (!txt) continue;

        p.textContent = '';
        p.style.opacity = '1';
        await typeAndSpeak(p, txt, 22);
        await sleep(500);
      }

      // === 3. SÓ AGORA LIBERA OS BOTÕES ===
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
      console.error('[FINAL] Erro na sequência:', err);
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

  // === VÍDEO FINAL: RODA ATÉ O FIM + PREENCHE A BORDA ===
  function playFinalVideo() {
    if (window.__finalVideoRunning || videoPlaying) {
      window.location.href = HOME_URL;
      return;
    }
    window.__finalVideoRunning = true;
    videoPlaying = true;

    // Contêiner com borda dourada
    const container = document.createElement('div');
    container.id = 'final-video-container';
    container.style.cssText = `
      position: fixed !important;
      top: 50% !important; left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 92vw !important; height: 92vh !important;
      max-width: 92vw !important; max-height: 92vh !important;
      z-index: 99999 !important;
      border: 12px solid #d4af37 !important;
      border-radius: 16px !important;
      box-shadow: 0 0 60px rgba(212,175,55,0.9) !important;
      overflow: hidden !important;
      background: #000 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      opacity: 1 !important;
      transition: opacity 1s ease-out !important;
    `;

    // Vídeo dentro
    const video = document.createElement('video');
    video.id = 'final-video';
    video.src = VIDEO_SRC;
    video.playsInline = true;
    video.muted = false;
    video.preload = 'auto';
    video.autoplay = true;
    video.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      display: block !important;
    `;

    container.appendChild(video);
    document.body.appendChild(container);

    // Overlay escuro
    const overlay = document.createElement('div');
    overlay.id = 'final-video-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100vw !important; height: 100vh !important;
      background: rgba(0,0,0,0.95) !important;
      z-index: 99998 !important;
      pointer-events: none !important;
      opacity: 1 !important;
      transition: opacity 1s ease-out !important;
    `;
    document.body.appendChild(overlay);

    // Redireciona APÓS o fim
    const goHome = () => {
      container.style.opacity = '0';
      overlay.style.opacity = '0';
      setTimeout(() => {
        window.location.href = HOME_URL;
      }, 1100);
    };

    video.onended = () => {
      console.log('[FINAL] Jornada concluída com luz plena.');
      goHome();
    };

    // Timeout de segurança (8s)
    const timeout = setTimeout(() => {
      console.warn('[FINAL] Timeout: indo pro portal.');
      goHome();
    }, 8000);

    video.oncanplaythrough = () => {
      clearTimeout(timeout);
      console.log('[FINAL] Vídeo carregado. Rodando até o fim.');
    };

    video.onerror = () => {
      clearTimeout(timeout);
      goHome();
    };

    // Garante play (mesmo com bloqueio de autoplay)
    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          const clicker = document.createElement('div');
          clicker.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99997;';
          document.body.appendChild(clicker);
          clicker.click();
          setTimeout(() => document.body.removeChild(clicker), 100);
          video.play();
        });
      }
    };

    video.onloadeddata = tryPlay;
  }

  // Eventos de clique
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

  // CSS do spinner e transições
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
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .final-acoes button:disabled { opacity: 0.6; cursor: not-allowed; }
    #final-video-container, #final-video-overlay {
      transition: opacity 1s ease-out !important;
    }
  `;
  document.head.appendChild(style);

})();
