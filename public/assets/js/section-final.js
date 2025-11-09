/* section-final.js */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/jornada-conhecimento-com-luz1.html';

  const $ = (sel, root = document) => (root || document).querySelector(sel);

  // DATILOGRAFIA + VOZ
  async function typeText(element, text, delay = 40) {
    element.textContent = '';
    element.classList.remove('typing-done');
    element.classList.add('typing-active');

    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      if ('speechSynthesis' in window && i % 3 === 0) {
        const chunk = text.slice(0, i + 1).split(' ').slice(-3).join(' ');
        if (chunk) {
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

  // INICIA DATILOGRAFIA
  async function startFinalSequence() {
    const title = $('#final-title');
    const message = $('#final-message');

    await typeText(title, "Gratidão por Caminhar com Luz 🌟");
    await new Promise(r => setTimeout(r, 600));

    const paragraphs = message.querySelectorAll('p');
    for (let p of paragraphs) {
      await typeText(p, p.textContent);
      await new Promise(r => setTimeout(r, 400, 400));
    }

    // Ativa botões
    document.querySelectorAll('.final-acoes button').forEach(b => b.disabled = false);
  }

  // VÍDEO FINAL + VOLTA
  function playFinalVideo() {
    const video = $('#final-video');
    video.src = VIDEO_SRC;
    video.style.display = 'block';
    video.style.position = 'fixed';
    video.style.top = '0'; video.style.left = '0';
    video.style.width = '100vw'; video.style.height = '100vh';
    video.style.objectFit = 'contain';
    video.style.zIndex = '99999';
    video.style.background = '#000';

    video.play();

    video.onended = () => {
      setTimeout(() => {
        window.location.href = HOME_URL;
      }, 800);
    };
  }

  // DOWNLOAD PDF/HQ
  async function downloadPDFHQ() {
    const btn = $('#btnBaixarPDFHQ');
    btn.disabled = true;
    btn.textContent = 'Gerando...';

    try {
      const payload = {
        answers: window.__QA_ANSWERS__,
        meta: window.__QA_META__,
        lang: 'pt-BR'
      };

      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
    } catch (e) {
      alert('Erro ao gerar arquivos. Tente novamente.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Baixar PDF e HQ';
    }
  }

  // BIND
  async function bindSection(node) {
  // Espera o DOM estar pronto
  await new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  const btnDownload = $('#btnBaixarPDFHQ', node);
  const btnVoltar = $('#btnVoltarInicio', node);

  if (btnDownload) {
    btnDownload.disabled = true;
    btnDownload.addEventListener('click', async () => {
      btnDownload.disabled = true;
      btnDownload.textContent = 'Gerando...';
      await generateArtifacts();
      downloadAll();
      btnDownload.textContent = 'Baixar PDF e HQ';
      btnDownload.disabled = false;
    });
  }

  if (btnVoltar) {
    btnVoltar.addEventListener('click', playFinalVideo);
  }

  // Geração automática
  generateArtifacts();
}
  // Fallback DOM
  document.addEventListener('DOMContentLoaded', () => {
    const sec = $('#' + SECTION_ID);
    if (sec && sec.classList.contains('active')) {
      startFinalSequence();
    }
  });

  console.log('[FINAL] Carregado com sucesso');
})();
