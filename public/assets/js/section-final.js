/* section-final.js — FINAL v1.2 */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let isSpeaking = false;
  let started = false;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function speakText(text) {
    if (!('speechSynthesis' in window) || isSpeaking || !text) return;
    isSpeaking = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 0.9;
    utter.onend = () => { isSpeaking = false; };
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

// === SUBSTITUA A FUNÇÃO typeText POR ESTA (MAIS LENTA E IMPACTANTE) ===
async function typeText(el, text, delay = 60, withVoice = false) {
  if (!el || !text) return;
  el.textContent = '';
  el.style.opacity = '0';
  el.classList.add('typing-active');

  // Revela o elemento suavemente
  setTimeout(() => { el.style.opacity = '1'; el.style.transition = 'opacity 0.6s ease'; }, 100);

  if (withVoice) {
    // Fala mais devagar e com pausas
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 0.8;
    utter.pitch = 1.1;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    if (i % 2 === 0) await sleep(delay); // Mais lento = mais impacto
  }

  el.classList.remove('typing-active');
  el.classList.add('typing-done');
  return sleep(400);
}

// === SUBSTITUA startFinalSequence POR ESTA (COM REVEAL + PAUSAS) ===
async function startFinalSequence() {
  if (started) return;
  started = true;

  const section = document.getElementById(SECTION_ID);
  if (!section) return;

  section.classList.add('show');
  await sleep(500);

  const titleEl = document.getElementById('final-title');
  const ps = document.querySelectorAll('#final-message p');
  const botoes = document.querySelector('.final-acoes');

  // TÍTULO COM GRANDE ENTRADA
  titleEl.style.opacity = '0';
  titleEl.style.transform = 'translateY(-20px)';
  await sleep(300);
  titleEl.style.transition = 'all 1s ease';
  titleEl.style.opacity = '1';
  titleEl.style.transform = 'translateY(0)';
  await typeText(titleEl, 'Gratidão por Caminhar com Luz', 70, true);
  await sleep(800);

  // PARÁGRAFOS COM REVEAL + VOZ
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    p.style.opacity = '0';
    p.style.transform = 'translateX(-30px)';
    await sleep(400);
    p.style.transition = 'all 0.8s ease';
    p.style.opacity = '1';
    p.style.transform = 'translateX(0)';
    await typeText(p, p.getAttribute('data-original'), 55, true);
    await sleep(600);
  }

  // BOTÕES COM BRILHO
  botoes.style.opacity = '0';
  botoes.style.transform = 'scale(0.8)';
  await sleep(500);
  botoes.style.transition = 'all 0.8s ease';
  botoes.style.opacity = '1';
  botoes.style.transform = 'scale(1)';
  botoes.classList.add('show');

  document.querySelectorAll('.final-acoes button').forEach(btn => {
    btn.disabled = false;
  });
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
      if (!data.pdfUrl && !data.hqUrl) {
        alert('Jornada concluída! PDF/HQ em breve disponível.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro temporário. Tente novamente em 10s.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  function playFinalVideo() {
    let video = document.getElementById('final-video');
    if (!video) {
      video = Object.assign(document.createElement('video'), { id: 'final-video', playsInline: true });
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

    video.play().catch(() => {
      setTimeout(() => { window.location.href = HOME_URL; }, 1000);
    });

    video.onended = () => {
      window.location.href = HOME_URL;
    };
  }

  // Eventos
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.id === 'btnBaixarPDFHQ') { e.preventDefault(); generateArtifacts(); }
    if (t.id === 'btnVoltarInicio') { e.preventDefault(); playFinalVideo(); }
  });

  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId || e.detail?.id || e.detail;
    if (id === SECTION_ID) startFinalSequence();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && sec.style.display !== 'none') startFinalSequence();
  });

})();
