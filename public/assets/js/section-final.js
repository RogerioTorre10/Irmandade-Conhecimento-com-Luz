/* section-final.js — FINAL v2.0 MÁGICO */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let isSpeaking = false;
  let started = false;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // === VOZ ===
  function speakText(text) {
    if (!('speechSynthesis' in window) || isSpeaking || !text) return;
    isSpeaking = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 0.85;
    utter.pitch = 1.0;
    utter.volume = 0.9;
    utter.onend = () => { isSpeaking = false; };
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  // === DATILOGRAFIA LENTA E NATURAL ===
  async function typeText(el, text, delay = 65, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.classList.add('typing-active');

    if (withVoice) speakText(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if ('.,!?'.includes(text[i])) {
        await sleep(180);
      } else if (i % 2 === 0) {
        await sleep(delay);
      }
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    return sleep(200);
  }

  // === SEQUÊNCIA FINAL ===
  async function startFinalSequence() {
    if (started) return;
    started = true;

    const section = document.getElementById(SECTION_ID);
    if (!section) return;

    section.classList.add('show');

    const titleEl = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');
    const botoes = document.querySelector('.final-acoes');

    if (!titleEl || !messageEl) return;

    // TÍTULO
    await typeText(titleEl, 'Gratidão por Caminhar com Luz', 50, true);
    await sleep(700);

    // PARÁGRAFOS
    const ps = messageEl.querySelectorAll('p');
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.getAttribute('data-original')?.trim();
      if (!txt) continue;

      p.textContent = '';
      p.classList.remove('revealed');

      await sleep(500);
      await typeText(p, txt, 65, true);
      p.classList.add('revealed');

      if (txt.includes('Você é a luz')) {
        await sleep(1400); // MOMENTO ÉPICO
      } else {
        await sleep(800);
      }
    }

    // BOTÕES SÓ AGORA
    if (botoes) {
      botoes.classList.add('show');
      setTimeout(() => {
        document.querySelectorAll('.final-acoes button').forEach(btn => {
          btn.disabled = false;
        });
      }, 600);
    }

    console.log('[FINAL] Sequência mágica concluída!');
  }

  // === DOWNLOAD PDF/HQ ===
  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Invocando a luz...';
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
      if (!data.pdfUrl && !data.hqUrl) {
        alert('A luz está se manifestando... Em breve!');
      }
    } catch (e) {
      console.error(e);
      alert('A conexão com a luz falhou. Tente novamente.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // === FILME FINAL COM LOADING DOURADO ===
  function playFinalVideo() {
    let video = document.getElementById('final-video');
    if (!video) {
      video = Object.assign(document.createElement('video'), { 
        id: 'final-video', 
        playsInline: true,
        muted: true
      });
      document.body.appendChild(video);
    }

    video.src = VIDEO_SRC;
    video.style.cssText = `
      position: fixed !important; top: 50% !important; left: 50% !important;
      transform: translate(-50%, -50%) !important; width: 94vw !important; height: 94vh !important;
      max-width: 94vw !important; max-height: 94vh !important; object-fit: contain !important;
      z-index: 999999 !important; border: 14px solid #d4af37 !important;
      border-radius: 20px !important; box-shadow: 0 0 80px rgba(212,175,55,1) !important;
      background: #000 !important;
    `;

    document.body.style.overflow = 'hidden';
    document.querySelectorAll('body > *').forEach(el => {
      if (el.id !== 'final-video') el.style.opacity = '0';
    });

    // LOADING DOURADO
    const loading = document.createElement('div');
    loading.id = 'final-video-loading';
    loading.innerHTML = `
      <div style="
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        color: #ffd700; font-family: 'BerkshireSwash', cursive; font-size: 1.5em;
        text-align: center; z-index: 9999999; text-shadow: 0 0 20px gold;
        animation: pulse 2s infinite;
      ">
        <div>Carregando a luz final</div>
        <div style="margin-top: 15px; font-size: 2.2em;">Loading</div>
      </div>
      <style>
        @keyframes pulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
      </style>
    `;
    document.body.appendChild(loading);

    let hasPlayed = false;

    const startVideo = () => {
      if (hasPlayed) return;
      hasPlayed = true;
      loading.remove();
      video.play().catch(() => {});
      video.onended = () => {
        window.location.href = HOME_URL;
      };
    };

    const onCanPlay = () => {
      console.log('[FILME] Luz carregada → iniciando');
      video.removeEventListener('canplaythrough', onCanPlay);
      startVideo();
    };

    const onError = () => {
      console.warn('[FILME] A luz está oculta');
      loading.innerHTML = `
        <div style="color: #ffd700; font-family: 'BerkshireSwash'; text-shadow: 0 0 15px gold; text-align: center;">
          A luz está temporariamente oculta.<br><br>
          <button onclick="window.location.href='${HOME_URL}'" 
                  style="padding: 14px 28px; background: #d4af37; color: #000; border: none; border-radius: 14px; font-weight: bold; cursor: pointer; font-size: 1.1em;">
            Voltar ao Portal da Luz
          </button>
        </div>
      `;
    };

    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('error', onError);

    video.load();

    // TIMEOUT DE SEGURANÇA
    setTimeout(() => {
      if (!hasPlayed) onError();
    }, 15000);

    // TENTA INICIAR RÁPIDO
    setTimeout(() => {
      if (video.readyState >= 3) onCanPlay();
    }, 500);
  }

  // === EVENTOS ===
  document.addEventListener('click', (e) => {
    const t = e.target;
    console.log('[CLICK]', t.id);

    if (t.id === 'btnBaixarPDFHQ') {
      e.preventDefault();
      generateArtifacts();
    }
    if (t.id === 'btnVoltarInicio') {
      e.preventDefault();
      console.log('[BOTÃO] Iniciando filme final...');
      playFinalVideo();
    }
  });

  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId || e.detail;
    if (id === SECTION_ID) startFinalSequence();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && sec.style.display !== 'none') startFinalSequence();
  });

  // FALLBACK FORÇADO
  setTimeout(() => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && !started && sec.classList.contains('show')) {
      console.log('[FALLBACK] Iniciando sequência final...');
      startFinalSequence();
    }
  }, 1000);

})();
