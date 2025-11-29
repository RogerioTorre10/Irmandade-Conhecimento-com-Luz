/* section-final.js — FINAL v1.4
 * Controle quase autônomo: layout + datilografia + voz + vídeo cinema
 */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let started = false;

  // Utilitário de pausa (necessário para datilografia / efeitos)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fila de fala: garante sincronismo da leitura por parágrafo
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

    // Inicia leitura e datilografia juntas, mas só libera o próximo parágrafo ao fim da leitura
    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) await sleep(delay);
    }

    // Espera a voz terminar antes de concluir este parágrafo
    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    return sleep(200);
  }

  // ==============================================
  // AJUSTE DE LAYOUT DA SEÇÃO FINAL (ALTURA / EIXO)
  // ==============================================
  function ensureFinalLayout(section) {
    if (!section) return;

    // painel com glow
    const panel = section.querySelector('.j-panel-glow');
    // pergaminho interno
    const perg = section.querySelector('.j-perg-v-inner');

    // 🔧 Ajuste fino do painel (subir um pouco no pergaminho)
    if (panel) {
      panel.style.position = 'relative';
      // mexe aqui se quiser subir/descer mais no DESKTOP
      panel.style.transform = 'translate(-10px, -70px)';
    }

    if (perg) {
      // centraliza melhor o pergaminho dentro do painel
      perg.style.transform = 'translate(-8px, -60px)';
      // controla a altura máxima do pergaminho pra não “cair”
      perg.style.maxHeight = '520px';
      perg.style.margin = '0 auto';
    }
  }

  // ==============================================
  // SEQUÊNCIA FINAL (TÍTULO + PARÁGRAFOS + BOTÕES)
  // ==============================================
  async function startFinalSequence() {
    if (started) return;
    started = true;

    // Reseta qualquer fala pendente de outras seções
    try { speechSynthesis.cancel(); } catch (e) {}
    speechChain = Promise.resolve();

    const section   = document.getElementById(SECTION_ID);
    const titleEl   = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');
    const botoes    = document.querySelector('.final-acoes');

    if (!section || !titleEl || !messageEl) return;

    // 🧭 deixa o container final na altura certa do pergaminho
    ensureFinalLayout(section);

    // PREPARA TÍTULO E PARÁGRAFOS
    const tituloOriginal =
      titleEl.getAttribute('data-original') ||
      titleEl.textContent.trim() ||
      'Gratidão por Caminhar com Luz';

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

    // TÍTULO (datilografa + lê, e só segue quando terminar de ler)
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = '1';
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS (um por vez: lê + datilografa juntos)
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

    // BOTÕES APARECEM — só depois de tudo
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

  // ==============================================
  // GERAÇÃO DE PDF / HQ
  // ==============================================
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

  // ==============================================
  // VÍDEO FINAL — MODO CINEMA + BORDA PULSANTE
  // ==============================================
  function playFinalVideo() {
    // remove restos de execuções anteriores
    document
      .querySelectorAll('#videoOverlay, #final-video, #final-video-frame')
      .forEach(el => el.remove());

    // WRAPPER do cinema
    const frame = document.createElement('div');
    frame.id = 'final-video-frame';
    frame.style.cssText = `
      position:fixed!important;
      top:50%!important;
      left:50%!important;
      transform:translate(-50%,-50%)!important;
      width:94vw!important;
      height:94vh!important;
      max-width:94vw!important;
      max-height:94vh!important;
      z-index:9999999!important;
      border-radius:22px!important;
      background:#000!important;
      box-shadow:0 0 40px rgba(212,175,55,0.9)!important;
      overflow:hidden!important;
    `;

    // VÍDEO em si
    const video = document.createElement('video');
    video.id = 'final-video';
    video.playsInline = true;
    video.autoplay = true;
    video.muted = false;
    video.preload = 'auto';
    video.controls = false;
    video.src = VIDEO_SRC + '?t=' + Date.now();
    video.style.cssText = `
      width:100%!important;
      height:100%!important;
      object-fit:contain!important;
      display:block!important;
      background:#000!important;
    `;

    frame.appendChild(video);

    // BARRAS desfocadas (topo e base) simulando “o mesmo filme” nas bordas
    ['top', 'bottom'].forEach(pos => {
      const bar = document.createElement('div');
      bar.style.cssText = `
        position:absolute!important;
        left:0!important;
        right:0!important;
        ${pos === 'top' ? 'top:0!important;' : 'bottom:0!important;'}
        height:16vh!important;
        pointer-events:none!important;
        background:linear-gradient(
          ${pos === 'top' ? 'to bottom' : 'to top'},
          rgba(212,175,55,0.65),
          rgba(0,0,0,0)
        )!important;
        filter:blur(8px)!important;
        mix-blend-mode:screen!important;
      `;
      frame.appendChild(bar);
    });

    document.body.appendChild(frame);
    document.body.style.overflow = 'hidden';

    const wrapper = document.getElementById('jornada-content-wrapper');
    if (wrapper) wrapper.style.opacity = '0';

    // BORDA PULSANTE (glow)
    let pulseUp = true;
    const pulseInterval = setInterval(() => {
      if (!frame.isConnected) {
        clearInterval(pulseInterval);
        return;
      }
      frame.style.boxShadow = pulseUp
        ? '0 0 90px rgba(212,175,55,1)'
        : '0 0 40px rgba(212,175,55,0.7)';
      pulseUp = !pulseUp;
    }, 700);

    video.onloadeddata = () => console.log('Vídeo carregou dados');
    video.oncanplay = () => console.log('Vídeo pode tocar');
    video.onplay = () => console.log('Vídeo tocando!');
    video.onerror = (e) => console.error('Erro no vídeo:', e);
    video.onended = () => {
      clearInterval(pulseInterval);
      frame.remove();
      document.body.style.overflow = '';
      location.href = HOME_URL;
    };

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

  // ==============================================
  // EVENTOS GERAIS
  // ==============================================
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
