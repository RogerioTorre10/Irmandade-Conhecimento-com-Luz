/* section-final.js — FINAL v1.1 alinhado com JC.show */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let isSpeaking = false;
  let started = false;

  // Utilitário simples
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Leitura em voz alta (sem loop infinito)
  function speakText(text) {
    if (!('speechSynthesis' in window) || isSpeaking || !text) return;
    isSpeaking = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 0.95;
    utter.onend = () => { isSpeaking = false; };
    speechSynthesis.speak(utter);
  }

  // Datilografia genérica
  async function typeText(el, text, delay = 35, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.classList.add('typing-active');

    if (withVoice) {
      // dispara uma vez no começo
      speakText(text);
    }

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await sleep(delay);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
  }

  // Sequência final (título + parágrafos)
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
      console.warn('[FINAL] Elementos de título ou mensagem não encontrados.');
      return;
    }

    // Título
    await typeText(titleEl, 'Gratidão por Caminhar com Luz', 40, true);

    // Parágrafos
    const ps = messageEl.querySelectorAll('p');
    for (const p of ps) {
      const txt = (p.getAttribute('data-original') || p.textContent || '').trim();
      if (!p.getAttribute('data-original')) {
        p.setAttribute('data-original', txt);
      }
      await typeText(p, txt, 22, true);
      await sleep(250);
    }

    // Libera botões
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = false;
    });

    console.log('[FINAL] Sequência concluída, botões liberados.');
  }

  // Geração de PDF/HQ (placeholder integrado ao backend)
  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Gerando sua Jornada...';
    btn.disabled = true;

    // TODO: substituir pelos dados reais da jornada
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

      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }

      const data = await res.json().catch(() => ({}));
      let opened = false;

      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        opened = true;
      }
      if (data.hqUrl) {
        window.open(data.hqUrl, '_blank');
        opened = true;
      }

      if (!opened) {
        alert('Sua jornada foi concluída.\nA geração automática de PDF/HQ ainda está em ajuste.');
      }
    } catch (e) {
      console.error('[FINAL] Erro ao gerar artefatos:', e);
      alert('Erro ao gerar PDF/HQ. Tente novamente em instantes.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // Vídeo final + redirecionamento
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
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 92vw !important;
      height: 92vh !important;
      max-width: 92vw !important;
      max-height: 92vh !important;
      object-fit: contain !important;
      z-index: 99999 !important;
      border: 12px solid #d4af37 !important;
      border-radius: 16px !important;
      box-shadow: 0 0 60px rgba(212,175,55,0.9) !important;
      background: #000 !important;
    `;

    document.body.style.overflow = 'hidden';

    // Escurece o restante sem destruir a DOM
    document.querySelectorAll('body > *:not(#final-video)').forEach(el => {
      if (el.id !== 'final-video') {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
    });

    video.play().catch(err => {
      console.error('[FINAL] Erro ao reproduzir vídeo final:', err);
      window.location.href = HOME_URL;
    });

    video.onended = () => {
      window.location.href = HOME_URL;
    };
  }

  // Clicks globais
  document.addEventListener('click', (e) => {
    const t = e.target;
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

  // Dispara quando a seção final é mostrada pelo controller
  function tryStart() {
    const sec = document.getElementById(SECTION_ID);
    if (sec && !started) {
      startFinalSequence();
    }
  }

  // Integrar com o evento real do JC.show: "section:shown"
  document.addEventListener('section:shown', (e) => {
    const d = e.detail || {};
    const id = d.sectionId || d.id || d;
    if (id === SECTION_ID) {
      console.log('[FINAL] section:shown recebido, iniciando sequência final.');
      tryStart();
    }
  });

  // Fallback: se já estiver na página final direta
  document.addEventListener('DOMContentLoaded', tryStart);
})();
