/* section-final.js — FINAL v1.7 | VISÍVEL, COM CSS FORÇADO */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let started = false;
  let videoPlaying = false;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // === INJETA CSS FORÇADO (GARANTE VISUAL) ===
  const injectCriticalCSS = () => {
    const existing = document.getElementById('final-critical-css');
    if (existing) return;

    const style = document.createElement('style');
    style.id = 'final-critical-css';
    style.textContent = `
      /* FUNDO ESCURO */
      body, html { background: #000 !important; margin:0; padding:0; overflow:hidden; }

      /* SECTION FINAL */
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
        font-family: 'BerkshireSwash', cursive !important;
      }

      /* PERGAMINHO */
      .pergaminho-vertical {
        background: center/contain no-repeat url('/assets/img/pergaminho-rasgado-vert.png') !important;
        background-color: rgba(245,235,200,0.1) !important;
        width: 90vw !important;
        max-width: 560px !important;
        height: 92vh !important;
        max-height: 860px !important;
        padding: 60px 40px !important;
        border-radius: 20px !important;
        box-shadow: 0 0 60px rgba(212,175,55,0.8) !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        text-align: center !important;
        color: #ffd700 !important;
      }

      /* TÍTULO */
      #final-title {
        font-size: 2.4em !important;
        text-shadow: 0 0 20px gold !important;
        margin: 0 0 20px 0 !important;
        opacity: 0;
        transition: opacity 0.6s ease;
      }

      /* PARÁGRAFOS */
      .final-message p {
        font-size: 1.3em !important;
        line-height: 1.6 !important;
        margin: 12px 0 !important;
        text-shadow: 0 0 10px rgba(255,215,0,0.5) !important;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.6s ease;
      }
      .final-message p.revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      /* BOTÕES */
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

      /* ESTILO DOS BOTÕES */
      .btn-gold, .btn-light {
        padding: 14px 24px !important;
        border-radius: 12px !important;
        font-weight: bold !important;
        font-size: 1.1em !important;
        cursor: pointer !important;
        transition: all 0.3s !important;
        border: none !important;
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

      /* SPINNER */
      .spinner {
        display: inline-block; width: 12px; height: 12px;
        border: 2px solid #d4af37; border-top-color: transparent;
        border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
    console.log('[FINAL] CSS crítico injetado com sucesso!');
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

  // === PAUSA AO INTERAGIR ===
  ['mousedown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => typingPaused = true));
  ['mouseup', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => typingPaused = false));

  // === ESCONDE TUDO ===
  const hideAll = () => {
    document.querySelectorAll('body > *').forEach(el => {
      if (!['section-final', 'final-video-container', 'final-video-overlay'].includes(el.id)) {
        el.style.display = 'none';
      }
    });
  };

  // === SEQUÊNCIA FINAL ===
  async function startFinalSequence() {
    if (started) return;
    started = true;

    const section = document.getElementById(SECTION_ID);
    if (!section) {
      console.warn('[FINAL] #section-final não encontrado. Tentando novamente...');
      setTimeout(startFinalSequence, 500);
      return;
    }

    console.log('[FINAL] #section-final encontrado! Iniciando...');
    injectCriticalCSS();
    hideAll();

    // FORÇA VISIBILIDADE
    section.style.cssText = 'display:flex !important; opacity:1 !important; z-index:99999 !important;';

    const titleEl = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');

    if (!titleEl || !messageEl) {
      console.error('[FINAL] Elementos #final-title ou .final-message não encontrados!');
      return;
    }

    // Desabilita botões
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
    });

    try {
      // TÍTULO
      titleEl.style.opacity = '1';
      await typeAndSpeak(titleEl, 'Gratidão por Caminhar com Luz', 40);
      await sleep(800);

      // PARÁGRAFOS
      const ps = messageEl.querySelectorAll('p');
      for (const p of ps) {
        let txt = p.getAttribute('data-original');
        if (!txt) {
          txt = p.textContent.trim();
          p.setAttribute('data-original', txt);
        }
        p.textContent = '';
        p.style.opacity = '1';
        await typeAndSpeak(p, txt, 22);
        p.classList.add('revealed');
        await sleep(500);
      }

      // LIBERA BOTÕES
      const acoes = document.querySelector('.final-acoes');
      if (acoes) acoes.classList.add('show');

      document.querySelectorAll('.final-acoes button').forEach((btn, i) => {
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
    container.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:92vw;height:92vh;z-index:99999;border:12px solid #d4af37;border-radius:16px;box-shadow:0 0 60px rgba(212,175,55,0.9);overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center;`;
    const video = Object.assign(document.createElement('video'), { src: VIDEO_SRC, playsInline: true, preload: 'auto', autoplay: true });
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
    if (sec) {
      console.log('[FINAL] Seção encontrada! Iniciando sequência...');
      startFinalSequence();
    } else {
      console.log('[FINAL] Aguardando #section-final...');
      setTimeout(tryStart, 300);
    }
  };

  document.addEventListener('DOMContentLoaded', tryStart);
  document.addEventListener('section:shown', e => {
    if ((e.detail?.sectionId || e.detail) === SECTION_ID) tryStart();
  });
  setTimeout(tryStart, 1000);

})();
