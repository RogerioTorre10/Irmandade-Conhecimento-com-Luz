/* section-final.js — VERSÃO FINAL 100% FUNCIONAL */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-conhecimento-com-luz1.html';

  const $ = (sel, root = document) => (root || document).querySelector(sel);

  // ========================================
  // 1. DATILOGRAFIA + VOZ
  // ========================================
  async function typeText(element, text, delay = 40) {
    element.textContent = '';
    element.classList.remove('typing-done');
    element.classList.add('typing-active');

    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      
      // Voz a cada 3 caracteres
      if ('speechSynthesis' in window && i % 3 === 0 && i > 0) {
        const chunk = text.slice(0, i + 1).split(' ').slice(-3).join(' ');
        if (chunk.trim()) {
          const utter = new SpeechSynthesisUtterance(chunk);
          utter.lang = 'pt-BR';
          utter.rate = 0.9;
          speechSynthesis.speak(utter);
        }
      }
      
      await new Promise(r => setTimeout(r, delay));
    }

    element.classList.remove('typing-active');
    element.classList.add('typing-done');
  }

  // ========================================
  // 2. SEQUÊNCIA FINAL
  // ========================================
  async function startFinalSequence() {
    const title = document.getElementById('final-title');
    const message = document.getElementById('final-message');

    if (!title || !message) {
      console.warn('[FINAL] Elementos de texto não encontrados');
      return;
    }

    // Título
    await typeText(title, "Gratidão por Caminhar com Luz");

    // Parágrafos
    const paragraphs = message.querySelectorAll('p');
    for (let p of paragraphs) {
      await typeText(p, p.textContent);
      await new Promise(r => setTimeout(r, 600));
    }

    // Libera botões
    document.querySelectorAll('.final-acoes button').forEach(btn => {
      btn.disabled = false;
    });

    // Gera PDF/HQ automaticamente
    await generateArtifacts();
  }

  // ========================================
  // 3. GERA PDF/HQ
  // ========================================
  async function generateArtifacts() {
    const btn = $('#btnBaixarPDFHQ');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Gerando...';

    try {
      const payload = {
        answers: window.__QA_ANSWERS__ || {},
        meta: window.__QA_META__ || {},
        lang: 'pt-BR'
      };

      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
      if (data.hqUrl) {
        window.open(data.hqUrl, '_blank');
      }

      btn.textContent = 'Baixar PDF e HQ';
    } catch (e) {
      console.error('[FINAL] Erro ao gerar arquivos:', e);
      alert('Erro ao gerar arquivos. Tente novamente.');
      btn.textContent = 'Baixar PDF e HQ';
    } finally {
      btn.disabled = false;
    }
  }

  // ========================================
  // 4. VÍDEO FINAL + VOLTA
  // ========================================
  function playFinalVideo() {
    let video = document.getElementById('final-video');
    if (!video) {
      video = document.createElement('video');
      video.id = 'final-video';
      video.playsInline = true;
      video.preload = 'auto';
      document.body.appendChild(video);
    }

    video.src = VIDEO_SRC;

    // TELA CHEIA + BORDA DOURADA
    video.style.cssText = `
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100vw !important; height: 100vh !important;
      z-index: 99999 !important;
      background: #000 !important;
      object-fit: contain !important;
      display: block !important;
      border: 12px solid #d4af37 !important;
      border-radius: 16px !important;
      box-shadow: 0 0 60px rgba(212, 175, 55, 0.9) !important;
    `;

    // Esconde tudo
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('section, div, header, footer').forEach(el => {
      if (el.id !== 'final-video') el.style.display = 'none';
    });

    // Toca
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Tocar Vídeo Final';
        playBtn.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;padding:20px 40px;font-size:20px;background:#d4af37;color:#000;border:none;border-radius:12px;';
        document.body.appendChild(playBtn);
        playBtn.onclick = () => { video.play(); playBtn.remove(); };
      });
    }

    // Ao terminar → volta à home
    video.onended = () => {
      setTimeout(() => {
        window.location.href = HOME_URL;
      }, 1000);
    };
  }

  // ========================================
  // 5. BIND DE BOTÕES
  // ========================================
  document.addEventListener('click', (e) => {
    if (e.target.id === 'btnBaixarPDFHQ') {
      generateArtifacts();
    }
    if (e.target.id === 'btnVoltarInicio') {
      playFinalVideo();
    }
  });

  // ========================================
  // 6. INÍCIO AUTOMÁTICO
  // ========================================
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId !== SECTION_ID) return;

    setTimeout(() => {
      startFinalSequence();
    }, 150);
  });

  // Fallback DOM
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && sec.classList.contains('active')) {
      setTimeout(startFinalSequence, 150);
    }
  });

  console.log('[SECTION-FINAL] Carregado com sucesso');
})();
