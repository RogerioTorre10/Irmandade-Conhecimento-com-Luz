(function (global) {
  'use strict';

  if (global.__GuiaSelfieReady) {
    console.log('[GuiaSelfie] Já carregado, ignorando');
    return;
  }
  global.__GuiaSelfieReady = true;

  const log = (...args) => console.log('[GuiaSelfie]', ...args);
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // ===== Selfie =====
  function initSelfie() {
    const card = $('#card-guide');
    const guideNameEl = $('#guideNameSlot');
    const userNameEl = $('#userNameSlot');
    const flameLayer = $('#card-guide .flame-layer');
    const selfieImg = $('#selfieImage');
    const bgImg = $('#guideBg');
    const nameInput = $('#nameInput');
    const guiaNameInput = $('#guiaNameInput');
    const fileInput = $('#selfieInput');
    const previewBtn = $('#previewBtn');
    const captureBtn = $('#captureBtn');
    const errorDiv = $('#selfieError');
    const scaleInput = $('#selfieScale');
    const offsetXInput = $('#selfieOffsetX');
    const offsetYInput = $('#selfieOffsetY');

    let selfieURL = '';

   function getBgUrl() {
  const card = document.getElementById('card-guide');
  if (!card) {
    console.warn('[GuiaSelfie] Elemento #card-guide não encontrado');
    return '/assets/img/irmandade-quarteto-bg-zion.png'; // fallback seguro
  }
  const guia = localStorage.getItem('JORNADA_GUIA') || 'zion';
  card.dataset.guide = guia.toUpperCase();
  guideNameEl.textContent = guia.toUpperCase();
  return `/assets/img/irmandade-quarteto-bg-${guia}.png`;
}

    function loadBg() {
      const bgUrl = getBgUrl();
      bgImg.src = bgUrl;
      bgImg.onload = () => {
        if (errorDiv) errorDiv.style.display = 'none';
        log('Imagem de fundo carregada:', bgUrl);
      };
      bgImg.onerror = () => {
        if (errorDiv) errorDiv.style.display = 'block';
        global.toast && global.toast('Erro ao carregar a imagem de fundo do guia.');
      };
    }

    function updatePreview() {
      const scale = parseFloat(scaleInput.value);
      const ox = parseFloat(offsetXInput.value);
      const oy = parseFloat(offsetYInput.value);
      const baseX = 15 + ox;
      const baseY = 35 + oy;
      const baseW = 70 * scale;
      const baseH = 90 * scale;
      selfieImg.setAttribute('x', baseX);
      selfieImg.setAttribute('y', baseY);
      selfieImg.setAttribute('width', baseW);
      selfieImg.setAttribute('height', baseH);
      log('Preview atualizado:', { scale, ox, oy });
    }

    function syncNameInput() {
      const storedName = localStorage.getItem('JORNADA_NOME') || '';
      if (storedName) {
        nameInput.value = storedName;
        userNameEl.textContent = storedName.toUpperCase() || 'NOME';
      }
      nameInput.addEventListener('input', () => {
        const name = nameInput.value.trim();
        userNameEl.textContent = name.toUpperCase() || 'NOME';
        localStorage.setItem('JORNADA_NOME', name);
        log('Nome sincronizado:', name);
      });
    }

    if (scaleInput) scaleInput.addEventListener('input', updatePreview);
    if (offsetXInput) offsetXInput.addEventListener('input', updatePreview);
    if (offsetYInput) offsetYInput.addEventListener('input', updatePreview);

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const f = fileInput.files?.[0];
        if (!f) return;
        if (selfieURL) URL.revokeObjectURL(selfieURL);
        selfieURL = URL.createObjectURL(f);
        selfieImg.setAttribute('href', selfieURL);
        if (errorDiv) errorDiv.style.display = 'none';
        updatePreview();
        log('Selfie selecionada:', f.name);
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', async () => {
        if (!selfieImg.getAttribute('href')) {
          global.toast && global.toast('Selecione uma selfie antes.');
          return;
        }
        updatePreview();
        if (flameLayer) flameLayer.style.opacity = 1;
        log('Preview ativado');
      });
    }

    if (captureBtn) {
      captureBtn.addEventListener('click', async () => {
        if (!selfieImg.getAttribute('href')) {
          global.toast && global.toast('Selecione uma selfie antes.');
          return;
        }
        updatePreview();
        if (flameLayer) flameLayer.style.opacity = 1;
        await new Promise(r => requestAnimationFrame(r));

        const canvas = document.createElement('canvas');
        const rect = card.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        canvas.width = Math.round(rect.width * scale);
        canvas.height = Math.round(rect.height * scale);
        const ctx = canvas.getContext('2d');

        const load = (src) => new Promise((res, rej) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = src;
        });

        const bg = await load(bgImg.currentSrc || bgImg.src).catch(() => {
          if (errorDiv) errorDiv.style.display = 'block';
          global.toast && global.toast('Erro ao carregar a imagem de fundo.');
          return;
        });
        if (!bg) return;
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        const W = canvas.width, H = canvas.height;
        const fw = 0.40 * W, fh = 0.60 * H, fx = (W - fw) / 2, fy = (H - fh) / 2 + 0.06 * H;

        const grad = ctx.createRadialGradient(fx + fw / 2, fy + fh * 0.65, fh * 0.02, fx + fw / 2, fy + fh * 0.65, fh * 0.55);
        grad.addColorStop(0, 'rgba(255,224,130,1)');
        grad.addColorStop(0.55, 'rgba(255,180,0,0.9)');
        grad.addColorStop(1, 'rgba(255,180,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(fx + fw / 2, fy + fh * 0.65, fw * 0.35, fh * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        function flamePath(ctx, x, y, w, h) {
          ctx.beginPath();
          ctx.moveTo(x + 0.50 * w, y + 0.133 * h);
          ctx.bezierCurveTo(x + 0.42 * w, y + 0.233 * h, x + 0.34 * w, y + 0.300 * h, x + 0.33 * w, y + 0.387 * h);
          ctx.bezierCurveTo(x + 0.32 * w, y + 0.487 * h, x + 0.41 * w, y + 0.547 * h, x + 0.50 * w, y + 0.613 * h);
          ctx.bezierCurveTo(x + 0.59 * w, y + 0.547 * h, x + 0.68 * w, y + 0.487 * h, x + 0.67 * w, y + 0.387 * h);
          ctx.bezierCurveTo(x + 0.66 * w, y + 0.300 * h, x + 0.58 * w, y + 0.233 * h, x + 0.50 * w, y + 0.133 * h);
        }

        ctx.save();
        flamePath(ctx, fx, fy, fw, fh);
        ctx.clip();

        const selfie = await load(selfieImg.getAttribute('href')).catch(() => {
          if (errorDiv) errorDiv.style.display = 'block';
          global.toast && global.toast('Erro ao carregar a selfie.');
          return;
        });
        if (!selfie) return;

        const selfieScaleVal = parseFloat(scaleInput.value);
        const ox = parseFloat(offsetXInput.value);
        const oy = parseFloat(offsetYInput.value);
        const svgScaleX = fw / 100;
        const svgScaleY = fh / 150;

        let coverRatio = Math.max(fw / selfie.width, fh / selfie.height) * selfieScaleVal;
        let sw = selfie.width * coverRatio;
        let sh = selfie.height * coverRatio;
        let sx = fx + (fw - sw) / 2 + ox * svgScaleX;
        let sy = fy + (fh - sh) / 2 + oy * svgScaleY;

        ctx.drawImage(selfie, sx, sy, sw, sh);
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,200,0,.85)';
        ctx.lineWidth = Math.max(1.2, W * 0.0022);
        flamePath(ctx, fx, fy, fw, fh);
        ctx.stroke();

        ctx.fillStyle = '#f7d37a';
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(W * 0.075)}px Cardo, serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(card.dataset.guide, W / 2, H * 0.035);
        const userName = (nameInput.value.trim() || 'NOME').toUpperCase();
        ctx.font = `bold ${Math.round(W * 0.068)}px Cardo, serif`;
        ctx.fillText(userName, W / 2, H * 0.955);

        try {
          const dataURL = canvas.toDataURL('image/png');
          localStorage.setItem('IRMANDADE_SELFIE_FINAL', dataURL);
          const a = document.createElement('a');
          a.href = dataURL;
          a.download = `jornada-${card.dataset.guide.toLowerCase()}-${Date.now()}.png`;
          a.click();
          if (errorDiv) errorDiv.style.display = 'none';
          log('Imagem salva e baixada:', a.download);
        } catch (_) {
          if (errorDiv) errorDiv.style.display = 'block';
          global.toast && global.toast('Erro ao salvar ou baixar a imagem.');
        }
      });
    }

    loadBg();
    syncNameInput();
    log('Selfie inicializado');
  }

    // ===== Chat com Guia =====
    async function sendChatMessage() {
      const input = $('#grok-chat-input');
      const messagesDiv = $('#grok-chat-messages');
      if (!input || !messagesDiv) {
        log('Input ou messagesDiv não encontrados');
        return;
      }
      const userMessage = input.value.trim();
      if (!userMessage) return;

      const tokens = userMessage.split(/\s+/).length;
      if (tokens > 100) {
        const guiaMsg = document.createElement('div');
        guiaMsg.className = 'grok-chat-message grok';
        guiaMsg.textContent = 'Por favor, limite sua mensagem a 100 palavras.';
        messagesDiv.appendChild(guiaMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        log('Mensagem excedeu 100 palavras');
        return;
      }

      const userMsg = document.createElement('div');
      userMsg.className = 'grok-chat-message user';
      userMsg.textContent = userMessage;
      messagesDiv.appendChild(userMsg);

      const currentQuestion = $('.j-pergunta.active .pergunta-enunciado')?.textContent || '';
      const currentAnswer = $('.j-pergunta.active textarea')?.value || '';
      const respostas = JSON.parse(localStorage.getItem('jornada_respostas') || '{}');
      const blocoIdx = $('.j-bloco[style*="display: block"]')?.dataset.bloco || 0;
      const guia = localStorage.getItem('JORNADA_GUIA') || 'zion';
      const context = { currentQuestion, currentAnswer, respostas, blocoIdx, progresso: $('#jprog-pct')?.textContent || '0% concluído', guia };

      const guiaConfigs = window.guiaConfigs || {
        zion: { apiUrl: 'https://zion-backend-api.onrender.com/v1/chat', model: 'grok' },
        lumen: { apiUrl: 'https://lumen-backend-api.onrender.com/v1/chat', model: 'gpt-5' },
        arian: { apiUrl: 'https://arion-backend-api.onrender.com/v1/chat', model: 'gemini' }
      };
      const cfg = guiaConfigs[guia] || guiaConfigs.lumen;

      try {
        const system = `Você é ${guia === 'zion' ? 'Zion (Grok)' : guia === 'arian' ? 'Arian (Gemini)' : 'Lumen (ChatGPT)'} guiando a Jornada. Contexto: ` + JSON.stringify(context);
        const resp = await fetch(cfg.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: cfg.model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }],
            temperature: 0.7
          })
        });
        if (!resp.ok) throw new Error('API falhou: ' + resp.status);
        const data = await resp.json();
        const guiaMessage = data?.choices?.[0]?.message?.content || data?.message?.content || 'Tô pronto pra te guiar! Como posso ajudar?';
        const guiaMsg = document.createElement('div');
        guiaMsg.className = 'grok-chat-message grok';
        messagesDiv.appendChild(guiaMsg);
        global.runTyping(guiaMsg, guiaMessage, () => log('Datilografia concluída para mensagem do guia'));
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } catch (e) {
        console.error('[Chat] erro', e);
        const guiaMsg = document.createElement('div');
        guiaMsg.className = 'grok-chat-message grok';
        global.runTyping(guiaMsg, 'Ops, algo deu errado! Tenta de novo ou pula pra próxima pergunta.', () => log('Datilografia concluída para erro'));
        messagesDiv.appendChild(guiaMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
      input.value = '';
      log('Mensagem enviada:', userMessage);
    }

    // ===== Progresso & Storage =====
    function updateProgress() {
      const perguntas = $$('.j-pergunta');
      const respondidas = Array.from(perguntas).filter(p => (p.querySelector('textarea')?.value.trim() || '') !== '').length;
      const total = perguntas.length || 1;
      const pct = Math.round((respondidas / total) * 100);
      const fill = $('#jprog-fill');
      const badge = $('#jprog-pct');
      const jFill = $('#j-fill-inline');
      const jMeta = $('#j-meta');
      if (fill) fill.style.width = pct + '%';
      if (badge) badge.textContent = pct + '% concluído';
      if (jFill) jFill.style.width = pct + '%';
      if (jMeta) jMeta.textContent = `Respondidas: ${respondidas} de ${total}`;
      log('Progresso atualizado:', { respondidas, total, pct });
    }

    function saveAnswers() {
      const respostas = {};
      $$('.j-pergunta textarea').forEach((input, idx) => {
        const text = input.value.trim();
        const tokens = text.split(/\s+/).length;
        if (tokens > 100) {
          input.value = text.split(/\s+/).slice(0, 100).join(' ');
          global.toast && global.toast('Resposta limitada a 100 palavras.');
        }
        respostas[`q${idx}`] = input.value || '';
      });
      try {
        localStorage.setItem('jornada_respostas', JSON.stringify(respostas));
        log('Respostas salvas:', respostas);
      } catch (_) {
        log('Erro ao salvar respostas no localStorage');
      }
    }

    function loadAnswers() {
      const respostas = JSON.parse(localStorage.getItem('jornada_respostas') || '{}');
      $$('.j-pergunta textarea').forEach((input, idx) => {
        input.value = respostas[`q${idx}`] || '';
        if (input.value) {
          global.runTyping(input, input.value, () => log('Datilografia concluída para resposta:', `q${idx}`));
        }
      });
      updateProgress();
      log('Respostas carregadas:', respostas);
    }

    // ===== Inicialização =====
   function initGuiaSelfie() {
    initSelfie();
    const chatInput = $('#grok-chat-input');
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendChatMessage();
        }
      });
    }
    const chatSendBtn = $('#grok-chat-send');
    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', sendChatMessage);
    }
    $$('.j-pergunta textarea').forEach(input => {
      input.addEventListener('input', () => {
        saveAnswers();
        updateProgress();
      });
    });
    loadAnswers();
    log('GuiaSelfie inicializado');
  }

  document.addEventListener('DOMContentLoaded', initGuiaSelfie);
  global.JGuiaSelfie = {
    initSelfie,
    sendChatMessage,
    updateProgress,
    saveAnswers,
    loadAnswers
  };
})(window);
