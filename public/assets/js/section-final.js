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
  if (!('speechSynthesis' in window) || !text) return;

  // sempre fala o texto atual (cancela o anterior)
  isSpeaking = true;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'pt-BR';
  utter.rate = 0.9;   // um pouco mais calmo
  utter.pitch = 1;
  utter.volume = 0.9;
  utter.onend = () => { isSpeaking = false; };

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}


async function typeText(el, text, delay = 55, withVoice = false) {
  if (!el || !text) return;

  // prepara o elemento
  el.textContent = '';
  el.style.opacity = '1';          // garante que apareça já no efeito
  el.classList.add('typing-active');

  if (withVoice) {
    speakText(text);
  }

  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    // a cada 2 caracteres dá uma pausa → mais lento e épico
    if (i % 2 === 0) await sleep(delay);
  }

  el.classList.remove('typing-active');
  el.classList.add('typing-done');
  return sleep(200);
}

// === SUBSTITUA startFinalSequence POR ESTA (COM REVEAL + PAUSAS) ===
async function startFinalSequence() {
  if (started) return;
  started = true;

  const section   = document.getElementById(SECTION_ID);
  const titleEl   = document.getElementById('final-title');
  const messageEl = document.getElementById('final-message');
  const botoes    = document.querySelector('.final-acoes');

  if (!section || !titleEl || !messageEl) return;

  // ===== PREPARO: garante que nada apareça pronto =====
  const ps = Array.from(messageEl.querySelectorAll('p'));

  // guarda o texto original e limpa o conteúdo visual
  ps.forEach(p => {
    const txt = (p.getAttribute('data-original') || p.textContent || '').trim();
    p.setAttribute('data-original', txt);
    p.textContent = '';
    p.classList.remove('revealed');
    p.style.opacity   = '0';
    p.style.transform = 'translateY(10px)';
  });

  // título também começa limpinho
  const tituloOriginal =
    titleEl.getAttribute('data-original') ||
    titleEl.textContent.trim() ||
    'Gratidão por Caminhar com Luz';

  titleEl.setAttribute('data-original', tituloOriginal);
  titleEl.textContent = '';
  titleEl.style.opacity   = '0';
  titleEl.style.transform = 'translateY(-16px)';

  // mostra a seção
  section.classList.add('show');
  await sleep(200);

  // ===== TÍTULO: entra com datilografia + voz =====
  titleEl.style.transition = 'all 0.9s ease';
  titleEl.style.opacity    = '1';
  titleEl.style.transform  = 'translateY(0)';
  await typeText(titleEl, tituloOriginal, 65, true);
  await sleep(600);

  // ===== PARÁGRAFOS: um por um, datilografia =====
  for (let i = 0; i < ps.length; i++) {
    const p   = ps[i];
    const txt = p.getAttribute('data-original') || '';

    if (!txt) continue;

    // pequena animação de entrada
    p.style.transition = 'all 0.8s ease';
    p.style.opacity    = '1';
    p.style.transform  = 'translateY(0)';

    // voz só no primeiro parágrafo (se quiser em todos, troque false por true)
    const withVoice = (i === 0);
    await typeText(p, txt, 55, true);

    p.classList.add('revealed');
    await sleep(300);
  }

  // ===== BOTÕES: aparecem e são liberados =====
  if (botoes) {
    botoes.style.opacity       = '0';
    botoes.style.transform     = 'scale(0.9)';
    botoes.style.transition    = 'all 0.8s ease';
    botoes.style.pointerEvents = 'none';

    await sleep(400);

    botoes.classList.add('show');
    botoes.style.opacity       = '1';
    botoes.style.transform     = 'scale(1)';
    botoes.style.pointerEvents = 'auto';

    // garante que TODOS fiquem clicáveis
    botoes.querySelectorAll('button, a').forEach(el => {
      el.disabled = false;
      el.classList.remove('disabled');
      el.removeAttribute('aria-disabled');
      el.style.pointerEvents = 'auto';
    });
  }

  console.log('[FINAL] Sequência concluída com sucesso!');
}
  
if (botoes) {
  botoes.classList.add('show');
  // Roda o vídeo automaticamente após 1.5s (tempo de animação + typing)
  setTimeout(() => {
    console.log('[FINAL] Iniciando vídeo automaticamente...');
    playFinalVideo();
  }, 1500);
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
  // Esconda explicitamente overlay de perguntas para evitar conflito
  const existingOverlay = document.getElementById('videoOverlay');
  if (existingOverlay) {
    existingOverlay.style.display = 'none';
    existingOverlay.style.opacity = '0';
  }

  let video = document.getElementById('final-video');
  if (!video) {
    video = Object.assign(document.createElement('video'), { id: 'final-video', playsInline: true });
    document.body.appendChild(video);
  }

  // Correção de path (copiado de perguntas.js)
  let src = VIDEO_SRC;
  if (src.startsWith('/assets/img/') && src.endsWith('.mp4')) {
    src = src.replace('/assets/img/', '/assets/videos/');
  }
  video.src = src;

  // Adicione preload e muted se precisar (ajuda em mobile)
  video.preload = 'auto';
  video.muted = false; // Garanta som se o vídeo tiver áudio

  // Ajuste estilos: remova background #000 para evitar tela preta; use overlay se quiser fundo
  video.style.cssText = `
    position: fixed !important; top: 50% !important; left: 50% !important;
    transform: translate(-50%, -50%) !important; width: 94vw !important; height: 94vh !important;
    max-width: 94vw !important; max-height: 94vh !important; object-fit: contain !important;
    z-index: 999999 !important; border: 14px solid #d4af37 !important;
    border-radius: 20px !important; box-shadow: 0 0 80px rgba(212,175,55,1) !important;
    background: transparent !important; // <--- MUDE PARA TRANSPARENT
  `;

  // Esconda outros elementos
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('body > *').forEach(el => {
    if (el.id !== 'final-video') el.style.opacity = '0';
  });

  // Adicione logs para debug (remova após teste)
  video.addEventListener('loadeddata', () => console.log('[FINAL-VIDEO] Dados carregados'));
  video.addEventListener('play', () => console.log('[FINAL-VIDEO] Iniciou reprodução'));
  video.addEventListener('error', (e) => console.error('[FINAL-VIDEO] Erro:', e));
  video.addEventListener('ended', () => console.log('[FINAL-VIDEO] Terminou'));

  video.play().catch((err) => {
    console.error('[FINAL-VIDEO] Erro no play:', err);
    // Fallback: se erro, redirecione após 1s e mostre alert
    alert('Vídeo não carregou visivelmente. Redirecionando...');
    setTimeout(() => { window.location.href = HOME_URL; }, 1000);
  });

  video.onended = () => {
    // Limpe o vídeo após acabar
    video.remove();
    window.location.href = HOME_URL;
  };
}

  // Adicione esta função no final do arquivo section-final.js
function checkAndStartFinal() {
  const section = document.getElementById(SECTION_ID);
  if (!section || started) return;

  // Verifica se a seção está visível (qualquer um desses indicadores)
  const isVisible = 
    section.classList.contains('show') ||
    section.style.display !== 'none' ||
    section.offsetParent !== null ||
    window.getComputedStyle(section).opacity > 0;

  if (isVisible) {
    console.log('[FINAL] Seção detectada como visível. Iniciando sequência...');
    startFinalSequence();
  }
}

// Execute verificação periódica até iniciar
let checkInterval = setInterval(() => {
  if (started) {
    clearInterval(checkInterval);
    return;
  }
  checkAndStartFinal();
}, 500);

// Para após 10 segundos (segurança)
setTimeout(() => clearInterval(checkInterval), 10000);

  // Eventos
 document.addEventListener('section:shown', (e) => {
  const id = e.detail?.sectionId || e.detail?.id || e.detail;
  if (id === SECTION_ID) {
    console.log('[FINAL] Seção final exibida → iniciando vídeo automaticamente');
    setTimeout(playFinalVideo, 800); // pequeno delay pra garantir que DOM está pronto
  }
});

// Também mantém o clique no botão como fallback
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.id === 'btnVoltarInicio' || t.closest('#btnVoltarInicio')) {
    e.preventDefault();
    console.log('[FINAL] Botão "Voltar ao Início" clicado → playFinalVideo');
    playFinalVideo();
  }
  if (t.id === 'btnBaixarPDFHQ') {
    e.preventDefault();
    generateArtifacts();
  }
});
   document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.id === 'btnBaixarPDFHQ') { e.preventDefault(); generateArtifacts(); }
    if (t.id === 'btnVoltarInicio') { e.preventDefault(); playFinalVideo(); }
  });

})();
