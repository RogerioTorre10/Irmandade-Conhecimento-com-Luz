/* section-final.js — FINAL 100% */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-conhecimento-com-luz1.html';

  let isSpeaking = false;

  // VOZ SEM TRAVAR
  function speakText(text) {
    if (!('speechSynthesis' in window) || isSpeaking) return;
    isSpeaking = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 0.9;
    utter.onend = () => { isSpeaking = false; };
    speechSynthesis.speak(utter);
  }

  // DATILOGRAFIA
  async function typeText(element, text, delay = 40) {
    element.textContent = '';
    element.classList.add('typing-active');

    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      if (i % 15 === 0 && i > 0) {
        const chunk = text.slice(0, i + 1).split(' ').slice(-5).join(' ');
        speakText(chunk);
      }
      await new Promise(r => setTimeout(r, delay));
    }

    element.classList.remove('typing-active');
    element.classList.add('typing-done');
  }

  // SEQUÊNCIA
  async function startFinalSequence() {
    const title = document.getElementById('final-title');
    const message = document.getElementById('final-message');

    if (!title || !message) return;

    await typeText(title, "Gratidão por Caminhar com Luz");
    const ps = message.querySelectorAll('p');
    for (let p of ps) {
      await typeText(p, p.textContent);
      await new Promise(r => setTimeout(r, 600));
    }

    document.querySelectorAll('.final-acoes button').forEach(b => b.disabled = false);
    generateArtifacts();
  }

  // PDF/HQ (TESTE COM DADOS FALSOS)
  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Gerando...';

    // DADOS DE TESTE
    const testPayload = {
      answers: { teste: "Resposta de teste" },
      meta: { startedAt: new Date().toISOString() },
      lang: 'pt-BR'
    };

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
    } catch (e) {
      alert('Erro ao gerar arquivos (teste).');
    } finally {
      btn.textContent = 'Baixar PDF e HQ';
      btn.disabled = false;
    }
  }

  // VÍDEO FINAL (PREENCHE A MOLDURA)
  function playFinalVideo() {
    let video = document.getElementById('final-video');
    if (!video) {
      video = document.createElement('video');
      video.id = 'final-video';
      video.playsInline = true;
      document.body.appendChild(video);
    }

    video.src = VIDEO_SRC;
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
    `;

    document.body.style.overflow = 'hidden';
    document.querySelectorAll('*').forEach(el => {
      if (el.id !== 'final-video') el.style.display = 'none';
    });

    video.play();
    video.onended = () => {
      setTimeout(() => window.location.href = HOME_URL, 1000);
    };
  }

  // BIND
  document.addEventListener('click', e => {
    if (e.target.id === 'btnBaixarPDFHQ') generateArtifacts();
    if (e.target.id === 'btnVoltarJornada') playFinalVideo();
  });

  // INÍCIO
  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId === SECTION_ID) {
      setTimeout(startFinalSequence, 200);
    }
  });
})();
