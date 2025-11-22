/* section-final.js — FINAL v1.4 (espera clique para vídeo final) */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

 let isSpeaking = false; 
 let started = false;    

// Fila de fala: garante que um texto só fala depois do outro terminar
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

    if (withVoice) queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) await sleep(delay);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    return sleep(200);
  }

  async function startFinalSequence() {
    if (started) return;
    started = true;

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

    // TÍTULO
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = '1';
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS
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

    // BOTÕES APARECEM — MAS SEM VÍDEO AUTOMÁTICO
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

  function playFinalVideo() {
    // Remove qualquer overlay antigo
    document.querySelectorAll('#videoOverlay, #final-video').forEach(el => el.remove());

    const video = document.createElement('video');
    video.id = 'final-video';
    video.playsInline = true;
    video.autoplay = true;
    video.muted = false;
    video.preload = 'auto';
    video.controls = false; // pode deixar true só pra testar

    // FORÇA O SRC COM ?t= para burlar cache e forçar Range Requests
    video.src = VIDEO_SRC + '?t=' + Date.now();

    video.style.cssText = `
      position:fixed !important;top:50%!important;left:50%!important;
      transform:translate(-50%,-50%)!important;
      width:94vw!important;height:94vh!important;
      max-width:94vw!important;max-height:94vh!important;
      object-fit:contain!important;
      z-index:9999999!important;
      border:14px solid #d4af37!important;
      border-radius:20px!important;
      box-shadow:0 0 80px rgba(212,175,55,1)!important;
      background:#000!important;
    `;

    document.body.appendChild(video);
    document.body.style.overflow = 'hidden';
    const wrapper = document.getElementById('jornada-content-wrapper');
    if (wrapper) wrapper.style.opacity = '0';

    // Logs
    video.onloadeddata = () => console.log('Vídeo carregou dados');
    video.oncanplay = () => console.log('Vídeo pode tocar');
    video.onplay = () => console.log('Vídeo tocando!');
    video.onerror = (e) => console.error('Erro no vídeo:', e);
    video.onended = () => {
      video.remove();
      location.href = HOME_URL;
    };

    // Força o play com múltiplas tentativas
    const tentarPlay = () => {
      video.play().then(() => {
        console.log('Vídeo rodando com glória!');
      }).catch(err => {
        console.warn('Play falhou, tentando de novo...', err);
        setTimeout(tentarPlay, 500);
      });
    };
    tentarPlay();
  }

  // EVENTOS
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

    // Clique consciente do participante para assistir o filme final
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
