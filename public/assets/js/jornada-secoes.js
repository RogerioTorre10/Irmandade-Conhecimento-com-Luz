(function (global) {
  'use strict';

  if (global.__SecoesReady) {
    console.log('[Secoes] Já carregado, ignorando');
    return;
  }
  global.__SecoesReady = true;

  const log = (...args) => console.log('[Secoes]', ...args);
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // ===== Pergaminho & Canvas =====
  function checkImage(url, fallbackUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(fallbackUrl);
      img.src = url;
    });
  }

  function updateCanvasBackground(sectionId) {
    const canvas = $('#jornada-canvas');
    if (!canvas) return;
    if (sectionId === 'section-perguntas') {
      checkImage('/assets/img/pergaminho-rasgado-horiz.png', '/assets/img/pergaminho-rasgado-vert.png').then(bg => {
        canvas.className = `card pergaminho pergaminho-h${bg.includes('vert') ? ' fallback' : ''}`;
        canvas.style.background = `var(--panel) url('${bg}') no-repeat center/cover`;
        log('Canvas atualizado para section-perguntas:', bg);
      });
    } else {
      canvas.className = 'card pergaminho pergaminho-v';
      canvas.style.background = 'var(--panel) url(/assets/img/pergaminho-rasgado-vert.png) no-repeat center/cover';
      log('Canvas atualizado para:', sectionId);
    }
  }

  // ===== Blocos Dinâmicos =====
  function loadDynamicBlocks() {
    const content = $('#perguntas-container');
    if (!content) {
      log('Container de perguntas não encontrado');
      return;
    }

    const blocks = window.JORNADA_BLOCKS || [];
    content.innerHTML = '';

    blocks.forEach((block, bIdx) => {
      const bloco = document.createElement('section');
      bloco.className = 'j-bloco';
      bloco.id = `bloco-${block.id || bIdx}`;
      bloco.dataset.bloco = bIdx;
      bloco.dataset.video = block.video_after || '';

      (block.questions || []).forEach((q, qIdx) => {
        const label = typeof q === 'string' ? q : (q.label || q.text || '');
        const div = document.createElement('div');
        div.className = 'j-pergunta';
        div.dataset.pergunta = qIdx;

        const enunciado =
          `<label class="pergunta-enunciado" ` +
          `data-typing="true" data-text="Pergunta ${qIdx + 1}: ${label}" ` +
          `data-speed="36" data-cursor="true"></label>`;

        div.innerHTML = enunciado +
          `\n<textarea rows="4" class="input" placeholder="Digite sua resposta..."></textarea>` +
          `<div class="devolutiva-container" style="display:none;"><p data-typing="true" data-speed="36" data-cursor="true"></p></div>` +
          `<div class="accessibility-controls">` +
          `<button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>` +
          `<button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>` +
          `</div>`;

        bloco.appendChild(div);
      });

      content.appendChild(bloco);
    });

    const firstBloco = content.querySelector('.j-bloco');
    if (firstBloco) {
      firstBloco.style.display = 'block';
      const first = firstBloco.querySelector('.j-pergunta');
      if (first && global.runTyping) {
        first.classList.add('active');
        global.runTyping(first.querySelector('.pergunta-enunciado'), first.querySelector('.pergunta-enunciado').dataset.text, () => {
          log('Datilografia concluída para primeira pergunta');
        });
      }
    }

    global.JGuiaSelfie && global.JGuiaSelfie.loadAnswers();
    const firstTa = content.querySelector('.j-bloco .j-pergunta textarea');
    if (firstTa) handleInput(firstTa);
    log('Blocos dinâmicos carregados:', blocks.length);
  }

  // ===== Controles =====
  function analyzeSentiment(text) {
    const POS = {
      'feliz': 2, 'alegria': 2, 'amor': 3, 'sucesso': 2, 'esperança': 3, 'paz': 2, 'fé': 3, 'gratidão': 2,
      'vitória': 3, 'superação': 3, 'luz': 2, 'deus': 3, 'coragem': 2, 'força': 2, 'confiança': 2, 'propósito': 3
    };
    const NEG = {
      'triste': -2, 'dor': -3, 'raiva': -2, 'medo': -2, 'frustracao': -2, 'frustração': -2, 'decepcao': -2,
      'decepção': -2, 'perda': -3, 'culpa': -2, 'ansiedade': -2, 'solidao': -2, 'solidão': -2, 'desespero': -3,
      'cansaco': -2, 'cansaço': -2, 'fracasso': -2, 'trauma': -3, 'duvida': -2, 'dúvida': -2
    };
    let score = 0;
    (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).forEach(t => {
      if (POS[t] != null) score += POS[t];
      if (NEG[t] != null) score += NEG[t];
    });
    return score;
  }

  async function handleInput(textarea) {
    const score = analyzeSentiment(textarea.value);
    global.updateChama && global.updateChama(score);
    global.JGuiaSelfie && global.JGuiaSelfie.saveAnswers();
    global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
    const perguntaDiv = textarea.closest('.j-pergunta');
    const devolutivaDiv = perguntaDiv.querySelector('.devolutiva-container');
    const devolutivaP = devolutivaDiv.querySelector('p');
    if (textarea.value.trim() && devolutivaDiv) {
      devolutivaDiv.style.display = 'block';
      const pergunta = perguntaDiv.querySelector('.pergunta-enunciado')?.textContent || '';
      const resposta = textarea.value;
      const guia = localStorage.getItem('JORNADA_GUIA') || 'zion';
      const devolutiva = await fetchDevolutiva(pergunta, resposta, guia);
      global.runTyping && global.runTyping(devolutivaP, devolutiva, () => log('Datilografia concluída para devolutiva'));
    } else {
      devolutivaDiv.style.display = 'none';
    }
    log('Input processado:', { score, resposta: textarea.value });
  }

  async function fetchDevolutiva(pergunta, resposta, guia) {
    const guiaConfigs = window.guiaConfigs || {
      zion: { apiUrl: 'https://zion-backend-api.onrender.com/v1/chat', model: 'grok' },
      lumen: { apiUrl: 'https://lumen-backend-api.onrender.com/v1/chat', model: 'gpt-5' },
      arian: { apiUrl: 'https://arion-backend-api.onrender.com/v1/chat', model: 'gemini' }
    };
    const cfg = guiaConfigs[guia] || guiaConfigs.lumen;
    try {
      const resp = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: `Você é ${guia === 'zion' ? 'Zion (Grok)' : guia === 'arian' ? 'Arian (Gemini)' : 'Lumen (ChatGPT)'} guiando a Jornada. Forneça uma devolutiva reflexiva para a resposta.` },
            { role: 'user', content: `Pergunta: ${pergunta}\nResposta: ${resposta}` }
          ],
          temperature: 0.7
        })
      });
      if (!resp.ok) throw new Error('API falhou: ' + resp.status);
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || 'Obrigado pela sua resposta. Reflita sobre como ela conecta você ao seu propósito!';
    } catch (e) {
      console.error('[Secoes] Erro ao buscar devolutiva:', e);
      return 'Ops, algo deu errado! Continue sua jornada com coragem.';
    }
  }

  function toggleSenha() {
    const input = $('#senha-input');
    if (!input) return;
    input.type = (input.type === 'password' ? 'text' : 'password');
    log('Senha toggled:', input.type);
  }

  function proceedAfterGuia(guia) {
    const guiaNameInput = $('#guiaNameInput');
    if (guiaNameInput && guiaNameInput.value.trim()) {
      localStorage.setItem('JORNADA_NOME', guiaNameInput.value.trim());
    } else {
      global.toast && global.toast('Por favor, insira seu nome antes de prosseguir.');
      return;
    }
    localStorage.setItem('JORNADA_GUIA', guia);
    global.ensureHeroFlame && global.ensureHeroFlame('section-selfie');
    global.JC.show('section-selfie');
    const card = $('#card-guide');
    const bgImg = $('#guideBg');
    const guideNameEl = $('#guideNameSlot');
    card.dataset.guide = guia.toUpperCase();
    guideNameEl.textContent = guia.toUpperCase();
    bgImg.src = `/assets/img/irmandade-quarteto-bg-${guia}.png`;
    log('Prosseguindo após guia:', guia);
  }

  function proceedAfterSelfie() {
    const intro = window.JORNADA_VIDEOS?.intro || '';
    if (!intro || window.__introPlayed) {
      proceedToQuestions();
      return;
    }
    window.__introPlayed = true;
    global.playTransition(intro, () => proceedToQuestions());
  }

  function proceedToQuestions() {
    global.JC.show('section-perguntas');
    loadDynamicBlocks();
    const perguntas = $$('.j-pergunta');
    if (perguntas.length) {
      perguntas[0].classList.add('active');
      const lbl = perguntas[0].querySelector('.pergunta-enunciado')?.textContent || '';
      const ta = perguntas[0].querySelector('textarea');
      ta.placeholder = "Digite sua resposta...";
      const aria = $('#aria-pergunta');
      if (aria) aria.textContent = lbl;
      if (ta) handleInput(ta);
    }
    global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
    log('Prosseguindo para section-perguntas');
  }

  let isTransitioning = false;
  function goNext() {
    if (isTransitioning) {
      log('Transição em andamento, ignorando');
      return;
    }
    isTransitioning = true;
    const current = $('.j-pergunta.active');
    if (!current) {
      isTransitioning = false;
      global.JC.goNext();
      return;
    }
    const bloco = current.closest('.j-bloco');
    if (!bloco) {
      isTransitioning = false;
      global.JC.goNext();
      return;
    }
    const perguntas = Array.from(bloco.querySelectorAll('.j-pergunta'));
    const i = perguntas.indexOf(current);
    current.classList.remove('active');

    if (i + 1 < perguntas.length) {
      const prox = perguntas[i + 1];
      prox.classList.add('active');
      const lbl = prox.querySelector('.pergunta-enunciado')?.textContent || '';
      const ta = prox.querySelector('textarea');
      ta.placeholder = "Digite sua resposta...";
      const aria = $('#aria-pergunta');
      if (aria) aria.textContent = lbl;
      global.runTyping && global.runTyping(prox.querySelector('.pergunta-enunciado'), prox.querySelector('.pergunta-enunciado').dataset.text, () => log('Datilografia concluída para pergunta'));
      global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
      isTransitioning = false;
      return;
    }

    const blocos = Array.from($$('.j-bloco'));
    const idxBloco = parseInt(bloco.dataset.bloco, 10);
    const temProx = idxBloco + 1 < blocos.length;

    const irAdiante = () => {
      if (temProx) {
        blocos.forEach(b => b.style.display = 'none');
        const proxBloco = blocos[idxBloco + 1];
        if (!proxBloco) {
          isTransitioning = false;
          global.JC.goNext();
          return;
        }
        proxBloco.style.display = 'block';
        const primeira = proxBloco.querySelector('.j-pergunta');
        if (primeira) {
          primeira.classList.add('active');
          const lbl = primeira.querySelector('.pergunta-enunciado')?.textContent || '';
          const ta = primeira.querySelector('textarea');
          ta.placeholder = "Digite sua resposta...";
          const aria = $('#aria-pergunta');
          if (aria) aria.textContent = lbl;
          global.runTyping && global.runTyping(primeira.querySelector('.pergunta-enunciado'), primeira.querySelector('.pergunta-enunciado').dataset.text, () => log('Datilografia concluída para primeira pergunta do bloco'));
        }
        global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
        isTransitioning = false;
      } else {
        if (window.JORNADA_FINAL_VIDEO) {
          global.playTransition(window.JORNADA_FINAL_VIDEO, () => {
            global.JC.show('section-final');
            isTransitioning = false;
          });
        } else {
          global.JC.show('section-final');
          isTransitioning = false;
        }
        global.JGuiaSelfie && global.JGuiaSelfie.updateProgress();
      }
    };

    const src = (window.JORNADA_BLOCKS[idxBloco] && window.JORNADA_BLOCKS[idxBloco].video_after) || '';
    if (src) {
      global.playTransition(src, () => irAdiante());
    } else {
      irAdiante();
    }
  }

  // ===== Vídeo de Transição =====
  function playTransition(src, onEnd) {
    const overlay = $('#videoOverlay');
    const video = $('#videoTransicao');
    const fallback = $('#videoFallback');
    const skip = $('#skipVideo');
    if (!overlay || !video || !fallback || !src) {
      log('Elementos de vídeo ausentes ou src inválido:', { overlay: !!overlay, video: !!video, fallback: !!fallback, src });
      onEnd && onEnd();
      return;
    }

    window.__playingTransition = true;
    overlay.classList.remove('hidden');
    video.classList.remove('hidden');
    fallback.classList.add('hidden');
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.currentTime = 0;
    video.controls = false;
    video.muted = false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.style.background = '#000';

    let ended = false;
    const cleanup = () => {
      if (ended) return;
      ended = true;
      isTransitioning = false;
      window.__playingTransition = false;
      video.pause();
      overlay.classList.add('hidden');
      video.classList.add('hidden');
      fallback.classList.add('hidden');
      video.removeAttribute('src');
      video.load();
      onEnd && onEnd();
      log('Transição finalizada:', src);
    };

    video.onerror = (e) => {
      console.error('[Secoes] Video error:', e, 'Source:', src);
      fallback.classList.remove('hidden');
      video.classList.add('hidden');
      global.toast && global.toast('Não foi possível carregar o vídeo.');
      setTimeout(cleanup, 1500);
    };
    video.onended = cleanup;
    if (skip) skip.onclick = cleanup;

    video.onloadedmetadata = () => {
      if (!video.videoWidth || !video.videoHeight) {
        video.classList.add('hidden');
        fallback.classList.remove('hidden');
      }
      video.currentTime = 0;
      setTimeout(() => {
        video.play().catch((e) => {
          console.error('[Secoes] Video playback error:', e, 'Source:', src);
          fallback.classList.remove('hidden');
          video.classList.add('hidden');
          setTimeout(cleanup, 1500);
        });
      }, 400);
    };

    video.src = src + '?t=' + Date.now();
    setTimeout(cleanup, 90000);
    log('Iniciando transição:', src);
  }

  // ===== Controle de Orientação de Vídeo =====
  function lockVideoOrientation() {
    const video = $('#videoTransicao');
    if (!video) return;
    video.addEventListener('webkitbeginfullscreen', (e) => {
      e.preventDefault();
      video.exitFullscreen?.();
    });
    video.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === video) {
        document.exitFullscreen?.();
      }
    });
    window.addEventListener('orientationchange', () => {
      video.style.transform = 'rotate(0deg)';
    });
    if (window.matchMedia('(orientation: portrait)').matches) {
      video.style.width = '100vw';
      video.style.height = 'auto';
      video.style.maxHeight = '100vh';
    }
    log('Orientação de vídeo travada');
  }

  // ===== PDF =====
  function generatePDF() {
    const respostas = JSON.parse(localStorage.getItem('jornada_respostas') || '{}');
    const doc = { content: [] };
    doc.content.push({ text: 'Jornada Essencial - Irmandade Conhecimento com Luz', style: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 20] } });
    Object.keys(respostas).forEach((key, idx) => {
      const pergunta = $(`.j-pergunta[data-pergunta="${idx}"] .pergunta-enunciado`)?.textContent || `Pergunta ${idx + 1}`;
      doc.content.push(
        { text: pergunta, style: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] } },
        { text: respostas[key] || 'Sem resposta', style: { fontSize: 12, margin: [0, 0, 0, 10] } }
      );
    });
    if (window.pdfMake) {
      window.pdfMake.createPdf(doc).download('jornada_essencial.pdf');
      log('PDF gerado');
    } else {
      global.toast && global.toast('PDF não disponível.');
      log('pdfMake não encontrado');
    }
  }

  // ===== Inicialização =====
  function initSecoes() {
    lockVideoOrientation();
    $$('.j-pergunta textarea').forEach(input => {
      input.addEventListener('input', () => handleInput(input));
    });
    const senhaInput = $('#senha-input');
    if (senhaInput) {
      senhaInput.addEventListener('input', () => {
        const btn = $('#btn-senha-avancar');
        if (btn) btn.disabled = !senhaInput.value.trim();
      });
    }
    log('Secoes inicializado');
  }

  document.addEventListener('DOMContentLoaded', initSecoes);
  global.JSecoes = { checkImage, updateCanvasBackground, loadDynamicBlocks, analyzeSentiment, handleInput, toggleSenha, proceedAfterGuia, proceedAfterSelfie, proceedToQuestions, goNext, playTransition, generatePDF };
})(window);
// === [BOTTOM] jornada-secoes.js ===
(function(){
  // preserva caso já exista
  window.JSecoes = window.JSecoes || {};

  // Se você já tiver a função real, ALIAS:
  // window.JSecoes.startJourney = window.JSecoes.startJourney || window.iniciarPerguntas || window.start || function(){...};

  // Implementação mínima para destravar o fluxo SENHA → próxima seção
  if (typeof window.JSecoes.startJourney !== 'function') {
    window.JSecoes.startJourney = function startJourney() {
      // decide próxima seção: prioriza 'section-guia', senão cai em 'section-selfie'
      var next = document.getElementById('section-guia') ? 'section-guia'
               : document.getElementById('section-guia-selfie') ? 'section-guia-selfie'
               : 'section-selfie';
      if (typeof window.showSection === 'function') {
        console.log('[JSecoes] startJourney →', next);
        window.showSection(next);
        // libera locks antigos de typing
        window.G = window.G || {};
        window.G.__typingLock = false;
      } else {
        window.toast && window.toast('showSection indisponível.');
      }
    };
  }
})();
